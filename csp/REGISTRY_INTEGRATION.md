
# Registry integration (what we change upstream)

## Purpose
CSP Edition must be discoverable as first-class:
- workflows: csp:discover / csp:iterate
- agents: chemistry_scout, constraint_engineer, etc.
- verify preset: verify:csp

## Required upstream edits (exactly three)
1) Workflows registry: register CSP workflows bundle
2) Agents registry: register CSP agent presets bundle
3) Verify preset registry: register verify:csp preset

No other upstream edits are permitted without justification in docs/csp/UPSTREAM_SYNC.md

## Required integration points
### A) Workflow registry
Add CSP workflows from `@claude-flow-csp/workflows` to the base workflow list.

### B) Agent registry
Add CSP agent presets from `@claude-flow-csp/agents`:
- chemistry_scout
- data_hydrator
- constraint_engineer
- qlip_runner
- csp_verifier
- iteration_controller

### C) Verify preset registry
Register a `csp` preset that runs:
- parseable
- min_distance
- density range
- charge neutrality feasibility
- coordination sanity (soft)
- symmetry match (optional)

## Scope constraints
No behavioural changes to existing workflows/agents/presets.
Only additive registrations.
