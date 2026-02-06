export type QlipSolver = 'gurobi' | 'cbc' | 'highs';

export interface CspMcpServerConfig {
  server_name: string;
  enabled?: boolean;
}

export interface CspConfig {
  workspace_dir: string;
  mcp: {
    qlip: CspMcpServerConfig;
    materials_data: CspMcpServerConfig;
    validators: CspMcpServerConfig;
    surrogate_eval: CspMcpServerConfig & { enabled?: boolean };
  };
  qlip: {
    solver: QlipSolver;
    time_limit_s: number;
    max_solutions: number;
    max_atoms: number;
  };
  policy: {
    max_iters: number;
    truth_accept_threshold: number;
    relax_order: string[];
    tighten_order: string[];
  };
}

export interface ChemistrySuggestion {
  chem_system: string;
  rationale: string;
  confidence: number;
}

export interface ChemistryPriors {
  lattice_prior: {
    symmetry: string;
  };
  density_range: [number, number];
  oxidation_state_constraints: Record<string, number[]>;
  prototypes: string[];
}

export interface ConstraintsSpec {
  chem_system: string;
  priors: ChemistryPriors;
  overrides?: Record<string, unknown>;
  adjustments?: Array<{
    iteration: number;
    mode: 'relax' | 'tighten';
    action: string;
  }>;
}

export interface CandidateSpec {
  candidate_id: string;
  score: number;
  format: 'cif';
  content: string;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  value?: number;
  message?: string;
  severity?: 'info' | 'warn' | 'fail';
}

export interface ValidationReport {
  candidate_id: string;
  truth_score: number;
  accept: boolean;
  checks: ValidationCheck[];
}

export interface ValidationSummary {
  total: number;
  accepted: number;
  rejected: number;
  best_candidate_id: string;
  truth_scores: Record<string, number>;
  failure_histogram: Record<string, number>;
  top_candidates: Array<{ candidate_id: string; truth_score: number }>;
}

export interface RunManifest {
  run_id: string;
  status: 'running' | 'ok' | 'error';
  objective: string;
  chem_system: string;
  seed: number;
  created_at: string;
  updated_at: string;
  iteration: number;
  max_iters: number;
  selected_candidate_id?: string;
  truth_score?: number;
  config_snapshot: CspConfig;
}

export interface CspRunResult {
  run_id: string;
  status: 'ok' | 'error';
  workspace_dir: string;
  run_dir: string;
  selected_chemistry: string;
  chosen_candidate_id: string;
  truth_score: number;
  candidate_ids: string[];
  summary_hash: string;
  iteration: number;
}

export interface IterationDecision {
  mode: 'relax' | 'tighten';
  action: string;
}

export interface ExportResult {
  candidate_id: string;
  path: string;
}
