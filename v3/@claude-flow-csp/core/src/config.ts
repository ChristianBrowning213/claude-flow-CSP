import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import type { CspConfig, QlipSolver } from './types.js';

const DEFAULT_CONFIG: CspConfig = {
  workspace_dir: process.cwd(),
  mcp: {
    qlip: { server_name: 'qlip-mcp' },
    materials_data: { server_name: 'materials-data-mcp' },
    validators: { server_name: 'csp-validators-mcp' },
    surrogate_eval: { server_name: 'surrogate-eval-mcp', enabled: false },
  },
  qlip: {
    solver: 'gurobi',
    time_limit_s: 3600,
    max_solutions: 25,
    max_atoms: 120,
  },
  policy: {
    max_iters: 5,
    truth_accept_threshold: 0.8,
    relax_order: [
      'widen_lattice',
      'relax_symmetry',
      'expand_oxidation_states',
      'increase_max_atoms',
      'expand_prototypes',
    ],
    tighten_order: [
      'increase_min_distance_scale',
      'narrow_density',
      'restrict_oxidation_states',
      'restrict_prototypes',
    ],
  },
};

export function getDefaultConfigPath(): string {
  const home = os.homedir();
  return join(home, '.claude-flow-csp', 'config.json');
}

export async function loadConfigFile(configPath?: string): Promise<Partial<CspConfig> | null> {
  const resolvedPath = configPath || getDefaultConfigPath();
  try {
    const contents = await fs.readFile(resolvedPath, 'utf8');
    return JSON.parse(contents) as Partial<CspConfig>;
  } catch {
    return null;
  }
}

function mergeDeep<T>(base: T, override?: Partial<T>): T {
  if (!override) return base;
  const output = Array.isArray(base) ? [...base] : { ...(base as Record<string, unknown>) } as T;
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    if (value === undefined) continue;
    const baseValue = (output as Record<string, unknown>)[key];
    if (
      baseValue &&
      typeof baseValue === 'object' &&
      !Array.isArray(baseValue) &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      (output as Record<string, unknown>)[key] = mergeDeep(baseValue, value as Record<string, unknown>);
    } else {
      (output as Record<string, unknown>)[key] = value;
    }
  }
  return output;
}

export function applyCliOverrides(
  config: CspConfig,
  overrides: {
    workspace_dir?: string;
    solver?: QlipSolver;
    max_iters?: number;
  }
): CspConfig {
  const next = { ...config } as CspConfig;
  if (overrides.workspace_dir) {
    next.workspace_dir = overrides.workspace_dir;
  }
  if (overrides.solver) {
    next.qlip = { ...next.qlip, solver: overrides.solver };
  }
  if (typeof overrides.max_iters === 'number') {
    next.policy = { ...next.policy, max_iters: overrides.max_iters };
  }
  return next;
}

export async function resolveConfig(options: {
  configPath?: string;
  workspaceDir?: string;
  solver?: QlipSolver;
  maxIters?: number;
}): Promise<CspConfig> {
  const loaded = await loadConfigFile(options.configPath);
  const merged = mergeDeep(DEFAULT_CONFIG, loaded || undefined);
  return applyCliOverrides(merged, {
    workspace_dir: options.workspaceDir,
    solver: options.solver,
    max_iters: options.maxIters,
  });
}

export function getDefaultConfig(): CspConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as CspConfig;
}
