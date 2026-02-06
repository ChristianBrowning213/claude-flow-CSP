
# CLI spec: claude-flow-csp

## Command name
`claude-flow-csp`

## Philosophy
- Provide CSP-first commands with stable interfaces.
- Defer to base Claude Flow CLI for generic swarm/agent commands.

## Implementation note
The wrapper CLI lives in the fork monorepo and imports the base Claude Flow CLI/runtime packages directly
(via workspace dependencies). It does NOT shell out to an external claude-flow executable.

## Commands (required)
### 1) csp:discover
Run end-to-end discovery loop.

Args:
- --objective <string>
- --chem-system <CSV elements> (optional)
- --workspace <path>
- --solver <gurobi|cbc|highs> (default gurobi)
- --max-iters <int> (default 5)
- --seed <int> (optional)
- --dry-run (optional)

### 2) csp:iterate
Continue an existing run.

Args:
- --run-id <id>
- --workspace <path>
- --max-iters <int>
- --seed <int> (optional)
- --dry-run

### 3) csp:validate
Validate candidates and produce truth-ranked list.

Args:
- --run-id <id>
- --workspace <path>
- --top-k <int> (default 20)
- --seed <int> (optional)
- --dry-run

### 4) csp:export
Export candidates.

Args:
- --run-id <id>
- --workspace <path>
- --format <cif|poscar> (default cif)
- --top-k <int>

## Pass-through behavior
If the command is not recognised as CSP-specific:
- forward to base Claude Flow CLI (same argv).
