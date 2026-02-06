
# MASTER SPEC — Claude Flow CSP (internal-testable)

## Scope
Implement a fork of Claude Flow that adds a new distributable wrapper CLI:
- NPM package: `claude-flow-csp`
- Binary: `claude-flow-csp`

CSP features are implemented as monorepo packages under:
- v3/@claude-flow-csp/core
- v3/@claude-flow-csp/workflows
- v3/@claude-flow-csp/agents
- v3/@claude-flow-csp/verify
- v3/@claude-flow-csp/cli

## Hard requirements
1) No Anthropic network calls in tests.
2) No external MCP servers required in tests.
3) `--dry-run` must execute the full CSP command flow end-to-end and write artifacts.
4) Only 3 upstream touchpoints may be edited:
   - workflow registry
   - agent registry
   - verify preset registry
5) Determinism: same seed + same config => identical artifact summary hash.

## CSP CLI commands (must implement)
- `claude-flow-csp csp:discover`
- `claude-flow-csp csp:iterate`
- `claude-flow-csp csp:validate`
- `claude-flow-csp csp:export`

All commands must accept:
- `--workspace <dir>`
- `--seed <int>` (optional)
- `--config <path>` (optional)
- `--dry-run` (optional; forces internal stubs)

## Config
See CONFIG_SPEC.md. In dry-run, config is still loaded, but tool calls are stubbed.

## Artifacts contract
workspace_dir/runs/{run_id}/
- run_manifest.json
- constraints.json
- events.jsonl
- candidates/
- validation/
- exports/

## Tool abstraction (internal tests)
Define a tool interface in @claude-flow-csp/core:
- ToolClient.call(toolName: string, input: object) -> Promise<object>

Provide two implementations:
1) RealMcpClient (runtime use)
2) StubToolClient (tests + --dry-run)

`--dry-run` must force StubToolClient regardless of config.

## CSP workflow execution model
Even without Anthropic, commands must:
- construct the workflow stages
- call ToolClient methods in the correct order
- apply iteration policy deterministically
- produce final report JSON to stdout (machine-readable)

## Output
CLI stdout for CSP commands must be strict JSON (no markdown).
