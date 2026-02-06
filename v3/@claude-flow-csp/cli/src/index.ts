import type { CspConfig } from '@claude-flow-csp/core';
import { resolveConfig, toInt, toOptionalInt } from '@claude-flow-csp/core';
import { RealMcpClient, StubToolClient } from '@claude-flow-csp/core';
import { runCspDiscover, runCspIterate, runCspValidate, runCspExport } from '@claude-flow-csp/workflows';
import { CSP_WORKFLOWS } from '@claude-flow-csp/workflows';
import { CSP_AGENTS } from '@claude-flow-csp/agents';
import { CSP_VERIFY_PRESETS } from '@claude-flow-csp/verify';
import { registerWorkflows, registerAgents, registerVerifyPresets } from '@claude-flow/shared';

export interface CliIO {
  stdout: { write: (chunk: string) => void };
  stderr: { write: (chunk: string) => void };
}

const CSP_COMMANDS = new Set(['csp:discover', 'csp:iterate', 'csp:validate', 'csp:export']);

export function registerCspBundles(): void {
  registerWorkflows(CSP_WORKFLOWS as Array<{ id: string }>);
  registerAgents(CSP_AGENTS as Array<{ id: string }>);
  registerVerifyPresets(CSP_VERIFY_PRESETS as Array<{ id: string }>);
}

function defaultIO(): CliIO {
  return { stdout: process.stdout, stderr: process.stderr };
}

function writeJson(io: CliIO, payload: unknown): void {
  io.stdout.write(`${JSON.stringify(payload)}\n`);
}

function writeError(io: CliIO, command: string, message: string, exitCode = 1): void {
  writeJson(io, { command, status: 'error', error: message, exit_code: exitCode });
}

function parseArgs(args: string[]): { command?: string; flags: Record<string, string | boolean>; positionals: string[] } {
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];
  let i = 0;

  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [rawKey, rawValue] = arg.slice(2).split('=', 2);
      if (rawValue !== undefined) {
        flags[rawKey] = rawValue;
        i += 1;
        continue;
      }
      const next = args[i + 1];
      if (next && !next.startsWith('-')) {
        flags[rawKey] = next;
        i += 2;
        continue;
      }
      flags[rawKey] = true;
      i += 1;
      continue;
    }
    if (arg.startsWith('-')) {
      // Short flags are treated as booleans
      flags[arg.replace(/^-+/, '')] = true;
      i += 1;
      continue;
    }
    positionals.push(arg);
    i += 1;
  }

  return { command: positionals[0], flags, positionals: positionals.slice(1) };
}

function getWorkspaceDir(flags: Record<string, string | boolean>, config: CspConfig): string {
  const workspaceFlag = flags.workspace;
  if (typeof workspaceFlag === 'string' && workspaceFlag.length > 0) {
    return workspaceFlag;
  }
  if (config.workspace_dir) return config.workspace_dir;
  return process.cwd();
}

export async function runCspCli(args: string[] = process.argv.slice(2), io: CliIO = defaultIO()): Promise<{ exitCode: number }> {
  registerCspBundles();

  const parsed = parseArgs(args);
  const command = parsed.command;

  if (!command || !CSP_COMMANDS.has(command)) {
    const { CLI } = await import('@claude-flow/cli');
    const cli = new CLI({ name: 'claude-flow-csp', description: 'Claude Flow CSP' });
    await cli.run(args);
    return { exitCode: 0 };
  }

  if (parsed.flags.help || parsed.flags.h) {
    writeJson(io, { command, status: 'ok', help: `Usage: ${command} [options]` });
    return { exitCode: 0 };
  }

  const seed = toInt(parsed.flags.seed, 1);
  const maxItersOverride = toOptionalInt(parsed.flags['max-iters']);
  const solverFlag = typeof parsed.flags.solver === 'string' ? parsed.flags.solver : undefined;
  const configPath = typeof parsed.flags.config === 'string' ? parsed.flags.config : undefined;
  const workspaceFlag = typeof parsed.flags.workspace === 'string' ? parsed.flags.workspace : undefined;

  const config = await resolveConfig({
    configPath,
    workspaceDir: workspaceFlag,
    solver: solverFlag as any,
    maxIters: maxItersOverride,
  });

  const workspaceDir = getWorkspaceDir(parsed.flags, config);
  const dryRun = parsed.flags['dry-run'] === true || parsed.flags['dry-run'] === 'true';

  const toolClient = dryRun
    ? new StubToolClient({ seed, truthThreshold: config.policy.truth_accept_threshold })
    : new RealMcpClient();

  try {
    switch (command) {
      case 'csp:discover': {
        const objective = typeof parsed.flags.objective === 'string' ? parsed.flags.objective : undefined;
        if (!objective) {
          writeError(io, command, 'Missing required --objective');
          return { exitCode: 1 };
        }
        const chemSystemRaw = typeof parsed.flags['chem-system'] === 'string'
          ? parsed.flags['chem-system']
          : undefined;
        const chemSystem = chemSystemRaw
          ? chemSystemRaw
              .split(',')
              .map((part) => part.trim())
              .filter(Boolean)
              .join('-')
          : undefined;

        const result = await runCspDiscover({
          objective,
          chem_system: chemSystem,
          workspace_dir: workspaceDir,
          seed,
          config,
          toolClient,
        });

        writeJson(io, { command, status: 'ok', ...result });
        return { exitCode: 0 };
      }
      case 'csp:iterate': {
        const runId = typeof parsed.flags['run-id'] === 'string' ? parsed.flags['run-id'] : undefined;
        if (!runId) {
          writeError(io, command, 'Missing required --run-id');
          return { exitCode: 1 };
        }
        const result = await runCspIterate({
          run_id: runId,
          workspace_dir: workspaceDir,
          seed,
          config,
          toolClient,
        });
        writeJson(io, { command, status: 'ok', ...result });
        return { exitCode: 0 };
      }
      case 'csp:validate': {
        const runId = typeof parsed.flags['run-id'] === 'string' ? parsed.flags['run-id'] : undefined;
        if (!runId) {
          writeError(io, command, 'Missing required --run-id');
          return { exitCode: 1 };
        }
        const topK = toOptionalInt(parsed.flags['top-k']) ?? 20;
        const result = await runCspValidate({
          run_id: runId,
          workspace_dir: workspaceDir,
          seed,
          config,
          toolClient,
        });
        writeJson(io, {
          command,
          status: 'ok',
          run_id: runId,
          workspace_dir: workspaceDir,
          summary_hash: result.summary_hash,
          best_candidate_id: result.summary.best_candidate_id,
          top_k: topK,
          top_candidates: result.summary.top_candidates.slice(0, topK),
        });
        return { exitCode: 0 };
      }
      case 'csp:export': {
        const runId = typeof parsed.flags['run-id'] === 'string' ? parsed.flags['run-id'] : undefined;
        if (!runId) {
          writeError(io, command, 'Missing required --run-id');
          return { exitCode: 1 };
        }
        const format = typeof parsed.flags.format === 'string' ? parsed.flags.format : 'cif';
        const topK = toOptionalInt(parsed.flags['top-k']) ?? 20;
        const exportsList = await runCspExport({
          run_id: runId,
          workspace_dir: workspaceDir,
          format: format === 'poscar' ? 'poscar' : 'cif',
          top_k: topK,
        });
        writeJson(io, {
          command,
          status: 'ok',
          run_id: runId,
          workspace_dir: workspaceDir,
          format: format === 'poscar' ? 'poscar' : 'cif',
          top_k: topK,
          exports: exportsList,
        });
        return { exitCode: 0 };
      }
      default:
        writeError(io, command, `Unsupported command ${command}`);
        return { exitCode: 1 };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeError(io, command, message, 1);
    return { exitCode: 1 };
  }
}

export default { runCspCli, registerCspBundles };
