export interface CspAgentDefinition {
  id: string;
  role: string;
  description: string;
  expected_tools?: string[];
}

export const CSP_AGENTS: CspAgentDefinition[] = [
  {
    id: 'chemistry_scout',
    role: 'Chemistry Scout',
    description: 'Proposes plausible chemistry systems for the objective.',
    expected_tools: ['materials-data-mcp.suggest_chemistries'],
  },
  {
    id: 'data_hydrator',
    role: 'Data Hydrator',
    description: 'Fetches priors such as density, oxidation states, and prototypes.',
    expected_tools: ['materials-data-mcp.fetch_priors'],
  },
  {
    id: 'constraint_engineer',
    role: 'Constraint Engineer',
    description: 'Builds canonical QLIP constraints from priors and overrides.',
    expected_tools: ['qlip-mcp.build_constraints'],
  },
  {
    id: 'qlip_runner',
    role: 'QLIP Runner',
    description: 'Runs QLIP MILP search and returns candidate structures.',
    expected_tools: ['qlip-mcp.run_qlip'],
  },
  {
    id: 'csp_verifier',
    role: 'CSP Verifier',
    description: 'Validates candidates and produces truth scoring.',
    expected_tools: ['csp-validators-mcp.batch_validate'],
  },
  {
    id: 'iteration_controller',
    role: 'Iteration Controller',
    description: 'Applies deterministic iteration policy based on validation summary.',
    expected_tools: [],
  },
];
