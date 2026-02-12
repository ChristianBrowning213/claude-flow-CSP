import { mkdirSync } from 'node:fs';
import { resolve, join, normalize, relative, isAbsolute, basename } from 'node:path';

const RUNTIME_ROOT = resolve(process.cwd(), '.claude-flow', 'runtime');

export const runtimePaths = {
  root: RUNTIME_ROOT,
  workspace: join(RUNTIME_ROOT, 'workspace'),
  workspaceRuns: join(RUNTIME_ROOT, 'workspace', 'runs'),
  workspaceArtifacts: join(RUNTIME_ROOT, 'workspace', 'artifacts'),
  workspaceLogs: join(RUNTIME_ROOT, 'workspace', 'logs'),
  workspaceStaging: join(RUNTIME_ROOT, 'workspace', 'staging'),
  artifacts: join(RUNTIME_ROOT, 'artifacts'),
  artifactsResearch: join(RUNTIME_ROOT, 'artifacts', 'research'),
  artifactsEvidence: join(RUNTIME_ROOT, 'artifacts', 'evidence'),
  memory: join(RUNTIME_ROOT, 'memory'),
  memoryObjects: join(RUNTIME_ROOT, 'memory', 'objects'),
  memoryLinks: join(RUNTIME_ROOT, 'memory', 'links'),
  runEvents: join(RUNTIME_ROOT, 'run_events'),
  sqlite: join(RUNTIME_ROOT, 'sqlite'),
  mlflow: join(RUNTIME_ROOT, 'mlflow')
} as const;

export function ensureRuntimeDirectories(): void {
  for (const pathValue of Object.values(runtimePaths)) {
    mkdirSync(pathValue, { recursive: true });
  }
}

export function sanitizeFilename(input: string): string {
  const name = basename(input).replace(/[^a-zA-Z0-9._-]/g, '_');
  return name.length === 0 ? 'artifact' : name;
}

export function resolveInRoot(baseDir: string, target: string): string {
  if (target.includes('\0')) {
    throw new Error('Invalid path input');
  }

  const normalizedTarget = normalize(target);
  const candidate = isAbsolute(normalizedTarget)
    ? normalizedTarget
    : resolve(baseDir, normalizedTarget);

  const rel = relative(baseDir, candidate);
  if (rel.startsWith('..') || rel.includes('..\\') || rel.includes('../')) {
    throw new Error(`Path escapes allowed runtime directory: ${target}`);
  }

  return candidate;
}
