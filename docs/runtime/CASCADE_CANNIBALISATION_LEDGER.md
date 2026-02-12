# Purpose
Track every CASCADE_CSP subsystem pattern harvested into `claude-flow-CSP`, including exact file mappings, adaptations, tests, and known limits.

# Scope
- Source snapshot: `CASCADE_CSP/`
- Destination runtime: `v3/@claude-flow/csp-runtime/`
- CLI bridge only: `v3/@claude-flow/cli/`
- Runtime docs: `docs/runtime/`
- Explicit non-goal: replacing Claude Flow orchestration.
- Branch: `feature/cascade-cannibalisation-runtime`

# Harvest Index (numbered list of harvested subsystems)
1. Workspace Docker execution substrate and staging safety patterns.
2. Memory server as structured persistence service with consolidation.
3. Research ingestion/index/query substrate with citation bundles.
4. Runtime tool packaging and registry pattern.
5. Operator documentation/playbook pattern for LLM usage loops.

# Phase-by-phase ledger
## Phase 1 Workspace Server
### Sources
- `CASCADE_CSP/docker/Dockerfile`
- `CASCADE_CSP/docker/entrypoint.sh`
- `CASCADE_CSP/docker/requirements-docker.txt`
- `CASCADE_CSP/docker-compose.yml`
- `CASCADE_CSP/mcp_servers_and_tools/workspace_server/src/index.ts`

### Destinations
- `v3/@claude-flow/csp-runtime/docker/workspace_runner/Dockerfile`
- `v3/@claude-flow/csp-runtime/docker/workspace_runner/entrypoint.sh`
- `v3/@claude-flow/csp-runtime/docker/workspace_runner/requirements-docker.txt`
- `v3/@claude-flow/csp-runtime/docker/docker-compose.yml`
- `v3/@claude-flow/csp-runtime/src/servers/workspace_server/workspace-service.ts`
- `v3/@claude-flow/csp-runtime/src/servers/workspace_server/workspace-tools.ts`
- `v3/@claude-flow/csp-runtime/__tests__/workspace-server.test.ts`

### Changes / Adaptations
- Re-implemented in TypeScript and wired to runtime paths under `.claude-flow/runtime/workspace/*`.
- Added explicit path sanitization and runtime-root checks (`resolveInRoot`).
- Added Docker-optional execution branch and structured run logs/events.
- Added URL staging with hash output for deterministic artifact tracking.

### Tests
- `v3/@claude-flow/csp-runtime/__tests__/workspace-server.test.ts`
  - Docker python run (`print(1+1)`) with skip when runner image not available.
  - Fetch-and-stage roundtrip via local HTTP test server.

### Limitations
- Docker execution requires prebuilt image `claude-flow-csp-workspace-runner`.
- Workspace command restrictions are path-based but not shell-command allowlist based.

## Phase 2 Memory Server
### Sources
- `CASCADE_CSP/mcp_servers_and_tools/memory_server/src/memory_mcp.py`
- `CASCADE_CSP/mcp_servers_and_tools/direct_tools/memory_tools.py`
- `CASCADE_CSP/mcp_servers_and_tools/direct_tools/custom_memory_prompts.py`

### Destinations
- `v3/@claude-flow/csp-runtime/src/persistence/memory/types.ts`
- `v3/@claude-flow/csp-runtime/src/persistence/memory/memory-store.ts`
- `v3/@claude-flow/csp-runtime/src/servers/memory_server/memory-tools.ts`
- `v3/@claude-flow/csp-runtime/src/persistence/schemas/memory-schema.json`
- `v3/@claude-flow/csp-runtime/__tests__/memory-server.test.ts`

### Changes / Adaptations
- Implemented file-first object store instead of mem0/supabase runtime dependencies.
- Added canonical store types (`ToolShape`, `PlanMemory`, `ConstraintMemory`, `RunMemory`, `EvidenceBundle`).
- Enforced object metadata fields: `schema_version`, timestamps, `scope`, provenance.
- Added `memory.link` and `memory.consolidate` workflows for relationship and semantic summary.

### Tests
- `v3/@claude-flow/csp-runtime/__tests__/memory-server.test.ts`
  - roundtrip store/retrieve
  - search filtering with scope/query
  - consolidation writes summary without deleting originals

### Limitations
- Search is substring-based and not vector/semantic retrieval.
- Links are stored separately and not materialized into graph queries.

## Phase 3 Research Server
### Sources
- `CASCADE_CSP/mcp_servers_and_tools/research_server/src/research_mcp.py`
- `CASCADE_CSP/mcp_servers_and_tools/research_server/src/research_server_utils.py`
- `CASCADE_CSP/mcp_servers_and_tools/research_server/knowledge_graphs/parse_repo_into_neo4j.py`
- `CASCADE_CSP/mcp_servers_and_tools/direct_tools/research_tools.py`
- `CASCADE_CSP/mcp_servers_and_tools/research_server/extracted_code.sql`

### Destinations
- `v3/@claude-flow/csp-runtime/src/servers/research_server/extractors.ts`
- `v3/@claude-flow/csp-runtime/src/servers/research_server/indexer.ts`
- `v3/@claude-flow/csp-runtime/src/servers/research_server/research-store.ts`
- `v3/@claude-flow/csp-runtime/src/servers/research_server/research-tools.ts`
- `v3/@claude-flow/csp-runtime/src/servers/research_server/adapters.ts`
- `v3/@claude-flow/csp-runtime/src/persistence/schemas/extracted_code.sql`
- `v3/@claude-flow/csp-runtime/src/persistence/{sqlite,mlflow}/adapter.ts`
- `v3/@claude-flow/csp-runtime/__tests__/research-server.test.ts`

### Changes / Adaptations
- Implemented local extractor for repo files, markdown/txt docs, and URL ingestion.
- Implemented embedding-free keyword index baseline with swappable architecture.
- Persisted artifacts and evidence bundles under `.claude-flow/runtime/artifacts/*`.
- Added optional adapter state hooks for Postgres/Neo4j/MLflow disabled by default.
- Added optional compose profiles for MLflow/Neo4j/Postgres.

### Tests
- `v3/@claude-flow/csp-runtime/__tests__/research-server.test.ts`
  - fixture repo ingest
  - keyword search assertion
  - cite bundle with stable hash references

### Limitations
- URL ingestion is lightweight and does not include CASCADE crawl/cache stack.
- Knowledge graph integration is adapter-gated; no active graph writes by default.

## Phase 4 Tool Packaging + Registry
### Sources
- `CASCADE_CSP/mcp_servers_and_tools/direct_tools/__init__.py`
- `CASCADE_CSP/mcp_servers_and_tools/direct_tools/workspace_tools.py`
- `CASCADE_CSP/mcp_servers_and_tools/direct_tools/memory_tools.py`
- `CASCADE_CSP/mcp_servers_and_tools/direct_tools/research_tools.py`

### Destinations
- `v3/@claude-flow/csp-runtime/src/tools/registry/*`
- `v3/@claude-flow/csp-runtime/src/tools/runtime_tools/*`
- `v3/@claude-flow/csp-runtime/src/index.ts`
- `v3/@claude-flow/cli/src/mcp-tools/runtime-tools.ts`
- `v3/@claude-flow/cli/src/mcp-tools/index.ts`
- `v3/@claude-flow/cli/src/mcp-client.ts`
- `v3/@claude-flow/cli/src/commands/runtime.ts`
- `v3/@claude-flow/cli/src/commands/index.ts`

### Changes / Adaptations
- Added internal registry model with runtime aliases:
  - `runtime.workspace.*`
  - `runtime.memory.*`
  - `runtime.research.*`
- Preserved existing Claude Flow MCP client behavior; runtime tools added as additional registry entries.
- Added `claude-flow runtime ...` command group as tool bridge only.

### Tests
- Runtime server behavior tested in `@claude-flow/csp-runtime` test suite.
- CLI bridge is thin and intentionally delegates to runtime registry handlers.

### Limitations
- CLI runtime tool loader expects built runtime module path for execution.
- Full CLI integration tests were not executed in this branch due missing local monorepo toolchain install.

## Phase 5 Operator Docs
### Sources
- `CASCADE_CSP/conversational_system` (operator usage and loop discipline patterns)
- `CASCADE_CSP/README.md`
- `CASCADE_CSP/mcp_servers_and_tools/*/README.md`

### Destinations
- `docs/runtime/RUNTIME_OPERATOR_MANUAL.md`
- `docs/runtime/LLM_USAGE_PLAYBOOK.md`
- `docs/runtime/RUNTIME_SUBSYSTEMS.md`
- `docs/runtime/CASCADE_PATTERNS.md`
- `docs/runtime/CANNIBALISED_FROM_CASCADE.md`

### Changes / Adaptations
- Reframed to Claude Flow ownership and runtime-tool usage loop.
- Added worked tool-call examples and EvidenceBundle handling.

### Tests
- Documentation validation only.

### Limitations
- Playbook examples assume runtime package built and tool bridge active.

# NOT TAKEN
- CASCADE orchestrator core (`CASCADE_CSP/conversational_system/core/orchestrator.py` and any equivalent planner replacement).
- CASCADE Streamlit UI and conversational frontend runtime (`CASCADE_CSP/conversational_system/frontend`).
- CASCADE full mem0/supabase/neo4j coupled runtime dependency model.
- CASCADE project-local material science domain prompts not specific to Claude Flow CSP runtime.
- Any subsystem that would supersede Claude Flow coordination ownership.

# How to Verify Locally (commands)
1. `git checkout feature/cascade-cannibalisation-runtime`
2. `Test-Path CASCADE_CSP/.git`
3. `docker compose -f v3/@claude-flow/csp-runtime/docker/docker-compose.yml config`
4. Build runtime package:
   - `cd v3/@claude-flow/csp-runtime`
   - `npm run build`
5. Run runtime tests:
   - `npm test`
6. CLI smoke:
   - `claude-flow runtime workspace run-python --code "print(1+1)"`
   - `claude-flow runtime memory put --store-type RunMemory --payload "{\"ok\":true}"`
   - `claude-flow runtime research ingest-repo --path .`

# Diff Summary (git diff --stat per phase)
## Commit list
- Phase 0: `ba60880fa` docs: initialize runtime cannibalisation ledger and safety map
- Phase 1: `8a8aa6367` runtime: add workspace docker runner (from CASCADE patterns)
- Phase 2: `40c27e063` runtime: add memory server + stores
- Phase 3: `708bb931b` runtime: add research ingestion + retrieval
- Phase 4: `856ec89dd` runtime: add runtime tool registry and CLI bridge
- Phase 5: `4cac6b47e` docs: add operator manual + LLM playbook

## Per-phase `git show --stat`
- `8a8aa6367`: 18 files changed, 773 insertions(+)
- `40c27e063`: 6 files changed, 536 insertions(+)
- `708bb931b`: 15 files changed, 683 insertions(+)
- `856ec89dd`: 15 files changed, 565 insertions(+)
- `4cac6b47e`: 5 files changed, 194 insertions(+), 1 deletion(-)

## Branch aggregate `git diff --stat main..HEAD`
- 61 files changed, 2902 insertions(+)
