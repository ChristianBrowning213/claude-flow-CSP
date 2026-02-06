
# Architecture

## Goal
Provide a CSP-focused orchestrator built on Claude Flow, distributed as:
- `claude-flow-csp` (npm package, wrapper CLI)

The system orchestrates a closed-loop CSP pipeline:
Chemistry Scout -> Data Hydrator -> Constraint Engineer -> QLIP Runner -> Verifier -> Iteration Controller.

## Components
### A) Claude Flow (fork)
Provides:
- swarm/agent orchestration primitives
- memory/metrics/logging primitives (as provided by Claude Flow)
- existing CLI/runtime base

### B) CSP extension packages (new)
Under `v3/@claude-flow-csp/*` provide:
- `@claude-flow-csp/core`: schemas, iteration policy, artifact contracts
- `@claude-flow-csp/workflows`: built-in CSP workflow templates/specs
- `@claude-flow-csp/agents`: CSP agent presets (prompts/roles)
- `@claude-flow-csp/verify`: CSP verification preset runner + truth scoring
- `@claude-flow-csp/cli`: wrapper CLI `claude-flow-csp`

### C) External tools (MCP servers)
At runtime, the CSP edition assumes MCP servers exist and are configured by the user:
- qlip-mcp (run CSP MILPs, export candidates)
- materials-data-mcp (priors/prototypes/oxidation states)
- csp-validators-mcp (structure checks)
- surrogate-eval-mcp (optional; energy ranking)

Tests must not require these; tests run via stubs.

## Integration surfaces (minimal upstream touches)
1) workflow template registry
2) agent type/preset registry
3) verification preset registry (verify:csp)

Everything else remains in CSP packages.
