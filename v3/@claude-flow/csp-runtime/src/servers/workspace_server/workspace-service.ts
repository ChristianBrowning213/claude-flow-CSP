import { createHash, randomUUID } from 'node:crypto';
import { exec as execCallback, spawn, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { copyFile, writeFile } from 'node:fs/promises';
import { basename, extname, join, relative } from 'node:path';
import { CommandExecutionResult } from '../../types.js';
import { ensureRuntimeDirectories, resolveInRoot, runtimePaths, sanitizeFilename } from '../../persistence/paths.js';
import { logRuntimeEvent, makeEvent } from '../../persistence/run_events/logger.js';

const execAsync = promisify(execCallback);
const DEFAULT_TIMEOUT_MS = 120000;
const MAX_STAGE_BYTES = 10 * 1024 * 1024;
const DEFAULT_WORKSPACE_IMAGE = process.env.CSP_RUNTIME_WORKSPACE_IMAGE || 'claude-flow-csp-workspace-runner';

export interface WorkspaceExecInput {
  cmd: string;
  working_dir?: string;
  timeout_ms?: number;
  use_docker?: boolean;
  run_id?: string;
}

export interface WorkspaceRunPythonInput {
  code?: string;
  file?: string;
  requirements?: string[];
  timeout_ms?: number;
  use_docker?: boolean;
  run_id?: string;
}

export interface WorkspaceFetchAndStageInput {
  url: string;
  filename?: string;
}

function ensureNonEmptyText(name: string, value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value.trim();
}

function resolveWorkspaceCwd(inputCwd?: string): { hostPath: string; dockerPath: string } {
  ensureRuntimeDirectories();
  if (!inputCwd) {
    return {
      hostPath: runtimePaths.workspaceStaging,
      dockerPath: '/workspace/staging'
    };
  }

  const resolved = resolveInRoot(runtimePaths.workspace, inputCwd);
  const rel = relative(runtimePaths.workspace, resolved).replaceAll('\\', '/');
  return {
    hostPath: resolved,
    dockerPath: `/workspace/${rel}`.replace(/\/+$/, '')
  };
}

function createRunEnvelope(runId?: string): { runId: string; runDir: string; artifactDir: string; logPath: string } {
  ensureRuntimeDirectories();
  const resolvedRunId = runId || `run-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const runDir = join(runtimePaths.workspaceRuns, resolvedRunId);
  const artifactDir = join(runtimePaths.workspaceArtifacts, resolvedRunId);
  const logPath = join(runtimePaths.workspaceLogs, `${resolvedRunId}.log`);
  mkdirSync(runDir, { recursive: true });
  mkdirSync(artifactDir, { recursive: true });
  return { runId: resolvedRunId, runDir, artifactDir, logPath };
}

function dockerAvailable(): boolean {
  try {
    const probe = spawnSync('docker', ['--version'], { stdio: 'ignore' });
    return probe.status === 0;
  } catch {
    return false;
  }
}

async function runLocalCommand(command: string, cwd: string, timeoutMs: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: timeoutMs,
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
    });
    return {
      stdout: stdout ?? '',
      stderr: stderr ?? '',
      exitCode: 0
    };
  } catch (error) {
    const err = error as Error & { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? err.message,
      exitCode: typeof err.code === 'number' ? err.code : 1
    };
  }
}

async function runDockerCommand(command: string, dockerCwd: string, timeoutMs: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  if (!dockerAvailable()) {
    throw new Error('Docker is not available on PATH');
  }

  return new Promise((resolve, reject) => {
    const args = [
      'run',
      '--rm',
      '-i',
      '-v',
      `${runtimePaths.workspace}:/workspace`,
      '-v',
      `${runtimePaths.workspaceArtifacts}:/artifacts`,
      '-w',
      dockerCwd,
      DEFAULT_WORKSPACE_IMAGE,
      'sh',
      '-lc',
      command
    ];

    const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Docker command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1
      });
    });
  });
}

async function executeCommand(input: WorkspaceExecInput): Promise<CommandExecutionResult> {
  const cmd = ensureNonEmptyText('cmd', input.cmd);
  const timeoutMs = typeof input.timeout_ms === 'number' ? input.timeout_ms : DEFAULT_TIMEOUT_MS;
  const { runId, runDir, artifactDir, logPath } = createRunEnvelope(input.run_id);
  const resolvedCwd = resolveWorkspaceCwd(input.working_dir);
  const start = Date.now();

  const execution = input.use_docker
    ? await runDockerCommand(cmd, resolvedCwd.dockerPath, timeoutMs)
    : await runLocalCommand(cmd, resolvedCwd.hostPath, timeoutMs);

  const durationMs = Date.now() - start;
  const output = [
    `command=${cmd}`,
    `cwd=${input.use_docker ? resolvedCwd.dockerPath : resolvedCwd.hostPath}`,
    `exit_code=${execution.exitCode}`,
    '',
    '[stdout]',
    execution.stdout,
    '',
    '[stderr]',
    execution.stderr
  ].join('\n');
  writeFileSync(logPath, output, 'utf-8');
  writeFileSync(join(runDir, 'result.json'), JSON.stringify({
    runId,
    command: cmd,
    cwd: input.use_docker ? resolvedCwd.dockerPath : resolvedCwd.hostPath,
    exitCode: execution.exitCode,
    durationMs,
    timestamp: new Date().toISOString()
  }, null, 2), 'utf-8');

  logRuntimeEvent(makeEvent('workspace', 'workspace.exec', {
    run_id: runId,
    command: cmd,
    use_docker: input.use_docker ?? false,
    exit_code: execution.exitCode
  }));

  return {
    success: execution.exitCode === 0,
    runId,
    command: cmd,
    stdout: execution.stdout,
    stderr: execution.stderr,
    exitCode: execution.exitCode,
    durationMs,
    logPath,
    artifactDir
  };
}

function toDockerPath(hostPath: string): string {
  const rel = relative(runtimePaths.workspace, hostPath).replaceAll('\\', '/');
  return `/workspace/${rel}`;
}

export async function workspaceExec(input: WorkspaceExecInput): Promise<CommandExecutionResult> {
  return executeCommand(input);
}

export async function workspaceRunPython(input: WorkspaceRunPythonInput): Promise<CommandExecutionResult> {
  ensureRuntimeDirectories();
  const timeoutMs = typeof input.timeout_ms === 'number' ? input.timeout_ms : DEFAULT_TIMEOUT_MS;
  const { runId, runDir, artifactDir, logPath } = createRunEnvelope(input.run_id);

  let scriptPath: string;
  if (input.file) {
    scriptPath = resolveInRoot(runtimePaths.workspace, input.file);
    if (!existsSync(scriptPath)) {
      throw new Error(`Python file not found: ${input.file}`);
    }
  } else {
    const code = ensureNonEmptyText('code', input.code);
    scriptPath = join(runDir, 'script.py');
    writeFileSync(scriptPath, code, 'utf-8');
  }

  const requirements = Array.isArray(input.requirements)
    ? input.requirements.filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
    : [];

  let command = `python "${input.use_docker ? toDockerPath(scriptPath) : scriptPath}"`;
  if (requirements.length > 0) {
    const requirementsPath = join(runDir, 'requirements.txt');
    writeFileSync(requirementsPath, `${requirements.join('\n')}\n`, 'utf-8');
    const requirementsTarget = input.use_docker ? toDockerPath(requirementsPath) : requirementsPath;
    command = `pip install -r "${requirementsTarget}" && ${command}`;
  }

  const result = await executeCommand({
    cmd: command,
    run_id: runId,
    timeout_ms: timeoutMs,
    use_docker: input.use_docker ?? true,
    working_dir: relative(runtimePaths.workspace, runDir)
  });

  if (existsSync(scriptPath)) {
    await copyFile(scriptPath, join(artifactDir, sanitizeFilename(basename(scriptPath))));
  }
  writeFileSync(logPath, readFileSync(result.logPath, 'utf-8'), 'utf-8');

  logRuntimeEvent(makeEvent('workspace', 'workspace.run_python', {
    run_id: runId,
    script: scriptPath,
    requirements_count: requirements.length,
    use_docker: input.use_docker ?? true
  }));

  return result;
}

function validateHttpUrl(rawUrl: string): URL {
  const parsed = new URL(rawUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are supported');
  }
  return parsed;
}

export async function workspaceFetchAndStage(input: WorkspaceFetchAndStageInput): Promise<{
  success: boolean;
  sourceUrl: string;
  stagedPath: string;
  artifactPath: string;
  sha256: string;
  bytes: number;
}> {
  ensureRuntimeDirectories();
  const parsedUrl = validateHttpUrl(ensureNonEmptyText('url', input.url));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(parsedUrl, {
    signal: controller.signal
  });
  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`Fetch failed with HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_STAGE_BYTES) {
    throw new Error(`Fetched content exceeds ${MAX_STAGE_BYTES} bytes`);
  }

  const suggestedName = input.filename
    || (basename(parsedUrl.pathname) || `fetched-${Date.now()}${extname(parsedUrl.pathname)}`);
  const filename = sanitizeFilename(suggestedName);
  const stagedPath = resolveInRoot(runtimePaths.workspaceStaging, filename);
  const artifactPath = join(runtimePaths.workspaceArtifacts, filename);

  await writeFile(stagedPath, buffer);
  await writeFile(artifactPath, buffer);

  const sha256 = createHash('sha256').update(buffer).digest('hex');
  logRuntimeEvent(makeEvent('workspace', 'workspace.fetch_and_stage', {
    source_url: parsedUrl.toString(),
    staged_path: stagedPath,
    artifact_path: artifactPath,
    sha256
  }));

  return {
    success: true,
    sourceUrl: parsedUrl.toString(),
    stagedPath,
    artifactPath,
    sha256,
    bytes: buffer.length
  };
}
