import type {
  CandidateSpec,
  ChemistryPriors,
  ChemistrySuggestion,
  ConstraintsSpec,
  ValidationReport,
  ValidationSummary,
} from './types.js';
import { SeededRng } from './prng.js';
import { clamp } from './utils.js';

export interface ToolClient {
  call<T = unknown>(toolName: string, input: Record<string, unknown>): Promise<T>;
}

export class RealMcpClient implements ToolClient {
  private handler?: (toolName: string, input: Record<string, unknown>) => Promise<unknown>;

  constructor(options?: { handler?: (toolName: string, input: Record<string, unknown>) => Promise<unknown> }) {
    this.handler = options?.handler;
  }

  async call<T = unknown>(toolName: string, input: Record<string, unknown>): Promise<T> {
    if (!this.handler) {
      throw new Error(`Real MCP client not configured for tool ${toolName}`);
    }
    return this.handler(toolName, input) as Promise<T>;
  }
}

const CHEMISTRY_TABLE: ChemistrySuggestion[][] = [
  [
    { chem_system: 'Li-Fe-P-O', rationale: 'Phosphate chemistry with stable frameworks', confidence: 0.78 },
    { chem_system: 'Na-Cl', rationale: 'Binary ionic system for baseline CSP', confidence: 0.64 },
    { chem_system: 'Ti-O', rationale: 'Oxide system with known polymorphs', confidence: 0.71 },
  ],
  [
    { chem_system: 'Mg-Si-O', rationale: 'Silicate chemistry for structural diversity', confidence: 0.75 },
    { chem_system: 'Al-N', rationale: 'Nitride system with high symmetry', confidence: 0.62 },
    { chem_system: 'Ca-Ti-O', rationale: 'Perovskite-forming chemistry', confidence: 0.82 },
  ],
  [
    { chem_system: 'Zn-S', rationale: 'Binary semiconductor baseline', confidence: 0.7 },
    { chem_system: 'Li-Co-O', rationale: 'Layered oxide chemistry', confidence: 0.8 },
    { chem_system: 'Fe-S', rationale: 'Transition metal sulfide system', confidence: 0.66 },
  ],
];

const PRIOR_TABLE: ChemistryPriors[] = [
  {
    lattice_prior: { symmetry: 'any' },
    density_range: [2.8, 4.2],
    oxidation_state_constraints: {
      Li: [1],
      Fe: [2, 3],
      P: [5],
      O: [-2],
    },
    prototypes: ['olivine', 'spinel', 'perovskite'],
  },
  {
    lattice_prior: { symmetry: 'any' },
    density_range: [3.1, 5.0],
    oxidation_state_constraints: {
      Mg: [2],
      Si: [4],
      O: [-2],
      Ca: [2],
      Ti: [4],
    },
    prototypes: ['perovskite', 'rutile', 'rocksalt'],
  },
  {
    lattice_prior: { symmetry: 'any' },
    density_range: [2.0, 3.6],
    oxidation_state_constraints: {
      Zn: [2],
      S: [-2],
      Li: [1],
      Co: [3, 4],
      Fe: [2, 3],
    },
    prototypes: ['zincblende', 'wurtzite', 'layered'],
  },
];

export class StubToolClient implements ToolClient {
  private rng: SeededRng;
  private truthThreshold: number;

  constructor(options: { seed: number; truthThreshold?: number }) {
    this.rng = new SeededRng(options.seed);
    this.truthThreshold = options.truthThreshold ?? 0.8;
  }

  async call<T = unknown>(toolName: string, input: Record<string, unknown>): Promise<T> {
    switch (toolName) {
      case 'materials-data-mcp.suggest_chemistries':
        return this.suggestChemistries(input) as T;
      case 'materials-data-mcp.fetch_priors':
        return this.fetchPriors(input) as T;
      case 'qlip-mcp.build_constraints':
        return this.buildConstraints(input) as T;
      case 'qlip-mcp.run_qlip':
        return this.runQlip(input) as T;
      case 'csp-validators-mcp.batch_validate':
        return this.batchValidate(input) as T;
      default:
        throw new Error(`StubToolClient does not support tool ${toolName}`);
    }
  }

  private suggestChemistries(_input: Record<string, unknown>): { chemistries: ChemistrySuggestion[] } {
    const tableIndex = this.rng.nextInt(0, CHEMISTRY_TABLE.length - 1);
    return { chemistries: CHEMISTRY_TABLE[tableIndex] };
  }

  private fetchPriors(_input: Record<string, unknown>): { priors: ChemistryPriors } {
    const tableIndex = this.rng.nextInt(0, PRIOR_TABLE.length - 1);
    return { priors: PRIOR_TABLE[tableIndex] };
  }

  private buildConstraints(input: Record<string, unknown>): { constraints: ConstraintsSpec } {
    const chemSystem = String(input.chem_system || 'unknown');
    const priors = input.priors as ChemistryPriors;
    const overrides = (input.overrides as Record<string, unknown>) || {};

    const constraints: ConstraintsSpec = {
      chem_system: chemSystem,
      priors,
      overrides,
    };

    return { constraints };
  }

  private runQlip(_input: Record<string, unknown>): { candidates: CandidateSpec[] } {
    const candidates: CandidateSpec[] = [];
    for (let i = 1; i <= 5; i++) {
      const candidateId = `cand_${String(i).padStart(4, '0')}`;
      const score = Number(this.rng.nextFloat(0.2, 0.95).toFixed(4));
      const content = `data_${candidateId}\n# CIF placeholder for ${candidateId}\n_cell_length_a 5.${i}0\n_cell_length_b 5.${i}0\n_cell_length_c 5.${i}0\n_cell_angle_alpha 90\n_cell_angle_beta 90\n_cell_angle_gamma 90\n`;
      candidates.push({ candidate_id: candidateId, score, format: 'cif', content });
    }

    return { candidates };
  }

  private batchValidate(input: Record<string, unknown>): { reports: ValidationReport[]; summary: ValidationSummary } {
    const candidates = (input.candidates as CandidateSpec[]) || [];
    const baseScores = [0.85, 0.72, 0.6, 0.48, 0.35];
    const reports: ValidationReport[] = [];
    const truthScores: Record<string, number> = {};
    const failureHistogram: Record<string, number> = {
      parseable: 0,
      min_distance: 0,
      density_in_range: 0,
      charge_neutrality_feasible: 0,
      coordination_reasonable: 0,
      symmetry_match: 0,
    };

    let bestCandidateId = '';
    let bestScore = -1;

    candidates.forEach((candidate, index) => {
      const noise = (this.rng.nextFloat(-0.02, 0.02));
      const base = baseScores[index] ?? 0.4;
      const truthScore = clamp(Number((base + noise).toFixed(4)));
      const accept = truthScore >= this.truthThreshold;

      const checks = [
        { name: 'parseable', passed: true },
        { name: 'min_distance', passed: truthScore >= 0.4, value: truthScore },
        { name: 'density_in_range', passed: truthScore >= 0.5, value: truthScore },
        { name: 'charge_neutrality_feasible', passed: truthScore >= 0.55, value: truthScore },
        { name: 'coordination_reasonable', passed: truthScore >= 0.65, value: truthScore },
        { name: 'symmetry_match', passed: truthScore >= 0.7, value: truthScore },
      ];

      for (const check of checks) {
        if (!check.passed) {
          failureHistogram[check.name] = (failureHistogram[check.name] || 0) + 1;
        }
      }

      truthScores[candidate.candidate_id] = truthScore;
      if (truthScore > bestScore) {
        bestScore = truthScore;
        bestCandidateId = candidate.candidate_id;
      }

      reports.push({
        candidate_id: candidate.candidate_id,
        truth_score: truthScore,
        accept,
        checks,
      });
    });

    const accepted = reports.filter((r) => r.accept).length;
    const summary: ValidationSummary = {
      total: reports.length,
      accepted,
      rejected: reports.length - accepted,
      best_candidate_id: bestCandidateId || (reports[0]?.candidate_id ?? ''),
      truth_scores: truthScores,
      failure_histogram: failureHistogram,
      top_candidates: Object.entries(truthScores)
        .sort((a, b) => b[1] - a[1])
        .map(([candidate_id, truth_score]) => ({ candidate_id, truth_score })),
    };

    return { reports, summary };
  }
}
