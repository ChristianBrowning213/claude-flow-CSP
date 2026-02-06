
# CSP workflows

## Workflow: csp_discovery
Stages:
1) Choose chemistry:
   - if chem_system provided, use it
   - else call materials-data-mcp suggest_chemistries and select top 1–3
2) Fetch priors:
   - fetch_priors + fetch_prototypes
3) Build constraints:
   - qlip-mcp build_constraints (merge priors + overrides)
4) Run QLIP:
   - qlip-mcp run_qlip(run_id)
5) Validate:
   - qlip-mcp export_candidates(top_k)
   - validators batch_validate
   - compute truth score per candidate
6) Iterate (policy):
   - infeasible/timeout => relax in deterministic order
   - invalid => tighten in deterministic order
   - weak => rerank/shift objective
7) Output:
   - final report + artifacts + best candidates

## Workflow: csp_iterate
Resume from an existing run_id, apply policy steps, rerun QLIP and validation.

## Workflow: csp_validate
Validate and rank existing candidates.

## Determinism requirements
- policy decisions are deterministic given prior run status + validation summary + seed
- all artifacts written under workspace_dir/runs/{run_id}/
