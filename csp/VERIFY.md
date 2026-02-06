
# CSP verification (verify:csp)

## Outputs
- Validation report per candidate
- Summary: accept/reject counts, failure histograms, best candidate list

## Required checks
1) parseable: structure loads and atom list is finite
2) min_distance: no pair closer than threshold matrix
3) density_in_range: if prior density window exists
4) charge_neutrality_feasible: oxidation-state assignment feasible if enabled
5) coordination_reasonable: soft heuristic (warn vs fail)
6) symmetry_match: optional if symmetry constrained

## Truth score
Truth score in [0,1] computed as weighted sum of check passes.
Acceptance threshold is configured in CONFIG_SPEC.

## Failure histogram
Return counts per check to drive deterministic policy decisions.
