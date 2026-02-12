# Runtime Integration Map

## Safety notes
- `CASCADE_CSP/project_context.txt` is vendored reference context and must not be edited.
- `CASCADE_CSP` is treated as read-only source patterns during cannibalisation.
- Claude Flow remains orchestrator; runtime servers are tooling utilities only.

## Phase smoke checklist
### Phase 0
- `git status --short --branch` confirms branch `feature/cascade-cannibalisation-runtime`.
- `Test-Path CASCADE_CSP/.git` returns `False`.
- Ledger exists: `docs/runtime/CASCADE_CANNIBALISATION_LEDGER.md`.

### Phase 1
- `docker compose -f v3/@claude-flow/csp-runtime/docker/docker-compose.yml config` validates compose.
- `pnpm --filter @claude-flow/csp-runtime test -- workspace` runs workspace tests.
- `claude-flow runtime workspace run-python --code "print(1+1)"` succeeds (or skip with Docker unavailable).

### Phase 2
- `pnpm --filter @claude-flow/csp-runtime test -- memory` passes.
- `claude-flow runtime memory put ...` then `get/search` returns stored object.
- `memory.consolidate` creates summary object without deleting originals.

### Phase 3
- `pnpm --filter @claude-flow/csp-runtime test -- research` passes.
- `claude-flow runtime research ingest-repo --path <fixture>` indexes local symbols.
- `claude-flow runtime research search --query <term>` returns expected snippet and artifact ID.

### Phase 4
- `claude-flow mcp tools` (or equivalent) lists `runtime.*` tools.
- `runtime.memory.*`, `runtime.research.*`, `runtime.workspace.*` resolve via MCP client registry.
- Server/tool READMEs exist in all runtime server directories.

### Phase 5
- Runtime docs exist under `docs/runtime/`.
- `docs/runtime/LLM_USAGE_PLAYBOOK.md` contains at least 6 worked examples.

### Phase 6
- Ledger includes per-phase source->destination mappings.
- Ledger includes explicit NOT TAKEN section.
- Ledger includes per-phase commit hashes and `git diff --stat` summaries.
