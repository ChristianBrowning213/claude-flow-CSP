
# Internal APIs (required for CSP Edition)

## Purpose
Implement stable extension points so CSP packages can register:
- workflows
- agent presets
- verify presets

## Requirement
If Claude Flow already has extension APIs, use them.
If not, implement minimal adapters at the 3 registries ONLY.

## API contracts (must exist somewhere stable)
Create a module (or export from existing core) with these functions:

### registerWorkflows
- input: array of workflow defs (opaque object but must include id:string)
- behavior: merges into workflow registry

### registerAgents
- input: array of agent defs (must include id:string)
- behavior: merges into agent registry

### registerVerifyPresets
- input: array of verify preset defs (must include id:string)
- behavior: merges into verify preset registry

### listWorkflows / listAgents / listVerifyPresets
- returns current registry contents for tests.

## CSP bundles
The CSP packages must export these:
- @claude-flow-csp/workflows: CSP_WORKFLOWS
- @claude-flow-csp/agents: CSP_AGENTS
- @claude-flow-csp/verify: CSP_VERIFY_PRESETS

The wrapper CLI must call the register* functions before dispatching commands.
