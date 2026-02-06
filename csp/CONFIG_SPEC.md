
# Config spec (claude-flow-csp)

## Config file
Default location:
- ~/.claude-flow-csp/config.json (or platform equivalent)
CLI flag override:
- --config <path>

## Schema (required)
{
  "workspace_dir": "<string>",
  "mcp": {
    "qlip": { "server_name": "<string>" },
    "materials_data": { "server_name": "<string>" },
    "validators": { "server_name": "<string>" },
    "surrogate_eval": { "server_name": "<string>", "enabled": true|false }
  },
  "qlip": {
    "solver": "gurobi|cbc|highs",
    "time_limit_s": <int>,
    "max_solutions": <int>,
    "max_atoms": <int>
  },
  "policy": {
    "max_iters": <int>,
    "truth_accept_threshold": <number>,
    "relax_order": ["widen_lattice","relax_symmetry","expand_oxidation_states","increase_max_atoms","expand_prototypes"],
    "tighten_order": ["increase_min_distance_scale","narrow_density","restrict_oxidation_states","restrict_prototypes"]
  }
}

## Precedence
1) CLI flags override config file
2) config file overrides built-in defaults
