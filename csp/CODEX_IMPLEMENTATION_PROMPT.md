
You are Codex acting as an engineer implementing **Claude Flow CSP** in a fork of Claude Flow.

PRIMARY SPEC (follow exactly):
- docs/csp/MASTER_SPEC.md
Supporting specs:
- docs/csp/ARCHITECTURE.md
- docs/csp/WIRING_CONTRACT.md
- docs/csp/REGISTRY_INTEGRATION.md
- docs/csp/CLI_SPEC.md
- docs/csp/CONFIG_SPEC.md
- docs/csp/ARTIFACTS.md
- docs/csp/VERIFY.md
- docs/csp/DRY_RUN_GENERATION.md
- docs/csp/ACCEPTANCE_TESTS.md
- docs/csp/INTERNAL_APIS.md

OBJECTIVE
Create a new distributable wrapper CLI package:
- v3/@claude-flow-csp/cli
that installs a binary:
- claude-flow-csp

Create additive CSP packages in the same monorepo:
- v3/@claude-flow-csp/core
- v3/@claude-flow-csp/workflows
- v3/@claude-flow-csp/agents
- v3/@claude-flow-csp/verify

HARD REQUIREMENTS
1) Tests must run fully offline: no Anthropic calls, no network.
2) No external MCP servers required: implement StubToolClient and force it under --dry-run.
3) Implement ONLY THREE upstream touchpoints changes:
   - workflow registry
   - agent registry
   - verify preset registry
4) Deterministic artifacts: same seed => same results.
5) CLI stdout for CSP commands must be strict JSON only.

DELIVERABLES
- Implement the packages listed above.
- Implement internal extension APIs (register/list) if they do not exist, limited to the three registries.
- Implement commands:
  - csp:discover, csp:iterate, csp:validate, csp:export
- Implement DRY_RUN as specified and ensure it writes artifacts as specified.
- Implement acceptance tests that validate:
  - CLI dry-run end-to-end
  - registry wiring
  - determinism

DO NOT
- modify any other upstream Claude Flow code beyond the three registries
- introduce any dependency on Anthropic keys or network calls in tests
