
# Wiring Contract (CSP Edition)

## What the wrapper CLI must do
When `claude-flow-csp` starts:

1) Load config (CONFIG_SPEC.md)
2) Register CSP bundles:
   - workflows from @claude-flow-csp/workflows
   - agents from @claude-flow-csp/agents
   - verify preset from @claude-flow-csp/verify
3) Dispatch command:
   - if argv matches csp:* => run CSP command handlers
   - else => forward argv to base Claude Flow CLI entrypoint

## Bundle interfaces (must exist)
- @claude-flow-csp/workflows exports: CSP_WORKFLOWS
- @claude-flow-csp/agents exports: CSP_AGENTS
- @claude-flow-csp/verify exports: CSP_VERIFY_PRESETS

## Registry calls (abstract)
The fork must expose a stable internal API to add:
- registerWorkflows(CSP_WORKFLOWS)
- registerAgents(CSP_AGENTS)
- registerVerifyPresets(CSP_VERIFY_PRESETS)

If base Claude Flow lacks these extension points, create tiny adapters at the three registries (only).
