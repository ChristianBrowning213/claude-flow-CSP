
# Test plan (acceptance)

## A) CLI tests
- `claude-flow-csp --help` works
- `claude-flow-csp csp:discover --dry-run --workspace <tmp>` writes artifacts
- `claude-flow-csp csp:validate --dry-run ...` returns a ranked list

## B) Registry tests
- base workflow list includes `csp_discovery`
- base agent registry includes CSP presets
- verify presets include `csp`

## C) Artifact contract tests
- run_manifest.json exists and includes:
  - run_id
  - config snapshot
  - status
- candidates directory exists and contains >= 1 file in dry-run

## D) Determinism tests
- same seed + same config => identical run_manifest + candidates list
