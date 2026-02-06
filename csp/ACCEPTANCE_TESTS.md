
# Acceptance tests (no Anthropic, no external MCP)

## Test execution
- All tests must run offline.
- Use stub tool client automatically for `--dry-run`.

## A) CLI dry-run end-to-end
Test: `claude-flow-csp csp:discover --dry-run --workspace <tmp> --seed 1`
Assert:
- process exit code 0
- stdout is strict JSON
- stdout includes: run_id, selected chemistry, chosen_candidate_id
- workspace/runs/{run_id}/ exists
- run_manifest.json exists and has status=ok
- constraints.json exists
- candidates/ contains exactly 5 files
- validation/summary.json exists

## B) Registry wiring
Test: programmatically import registry listing functions and assert:
- workflows include csp_discovery (or equivalent id)
- agents include chemistry_scout, constraint_engineer, qlip_runner, csp_verifier, iteration_controller
- verify presets include csp

## C) Determinism
Run `csp:discover` twice with the same seed and config in two temp workspaces.
Assert:
- candidate_id list identical
- validation summary hash identical
- selected candidate identical

## D) Iterate command
Run discover, then:
`claude-flow-csp csp:iterate --dry-run --workspace <tmp> --run-id <id> --seed 1`
Assert:
- produces a new iteration artifact (iteration_1.json)
- increments manifest iteration count
