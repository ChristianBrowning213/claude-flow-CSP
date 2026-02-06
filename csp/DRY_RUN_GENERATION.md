
# DRY_RUN Generation Rules (internal-only)

## Objective
In dry-run mode, the system must run end-to-end without:
- QLIP installed
- a solver installed
- any MCP servers running
- any network calls

## Stubbed tool behaviors (deterministic)

### materials-data-mcp.suggest_chemistries
Input: { objective, ... }
Output:
- fixed list of 3 chem systems based on seed:
  - seed -> select from a predefined table
  - include rationale + confidence

### materials-data-mcp.fetch_priors
Output deterministic priors:
- lattice_prior symmetry "any"
- density_range [dmin, dmax] from seeded table
- oxidation_state_constraints from seeded table
- prototypes list from seeded table

### qlip-mcp.build_constraints
- merges priors + overrides into constraints.json

### qlip-mcp.run_qlip
- writes run_manifest.json with status=ok
- generates exactly 5 candidates:
  - candidates/cand_0001.cif ... cand_0005.cif
  - candidate_id = "cand_0001" etc
  - score = deterministic float from PRNG(seed, candidate_index)

Candidate CIF content may be minimal placeholder text; validators in dry-run must accept placeholder parsing OR be stubbed.

### csp-validators-mcp.batch_validate
- returns ValidationReport for each candidate
- truth_score computed deterministically:
  truth_score = clamp(0,1, base + noise)
  where base depends on candidate_index and noise depends on seed

At least 1 candidate must be "accept" for default config:
- e.g. cand_0001 accept with truth_score 0.85

## Determinism
PRNG must be stable across platforms:
- use a fixed algorithm (e.g. xorshift32 or mulberry32)
- do NOT use Math.random without seeding

## Output checks
After dry-run discovery:
- run_manifest.json exists
- candidates exist
- validation summary exists
- CLI prints strict JSON with selected candidate_id
