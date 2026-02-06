
# CSP agent presets

## chemistry_scout
Goal: propose chemically plausible systems for the objective.
Inputs: objective, element constraints (optional), known structure type hints.

## data_hydrator
Goal: obtain priors and guidance needed to construct constraints.
Outputs: lattice prior, density window, oxidation state constraints, prototype suggestions.

## constraint_engineer
Goal: compile priors + overrides into the canonical constraint schema used by QLIP.
Output: QLIPConstraintSpec (typed JSON).

## qlip_runner
Goal: run QLIP via MCP, manage caching and run artifacts.
Output: QLIPRunResult and candidate exports.

## csp_verifier
Goal: validate candidates; output truth-scored reports and failure reason histogram.

## iteration_controller
Goal: apply deterministic iteration policy to produce the next constraint update.
