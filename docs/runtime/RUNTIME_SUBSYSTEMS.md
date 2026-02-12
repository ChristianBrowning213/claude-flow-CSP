# Runtime Subsystems

## Workspace server
- Module: `v3/@claude-flow/csp-runtime/src/servers/workspace_server`
- Tools:
  - `workspace.exec`
  - `workspace.run_python`
  - `workspace.fetch_and_stage`
- Persistence:
  - `.claude-flow/runtime/workspace/{runs,artifacts,logs,staging}`
- Security posture:
  - Runtime-root path checks (`resolveInRoot`)
  - File-name sanitization
  - Docker execution optional and explicit

## Memory server
- Module: `v3/@claude-flow/csp-runtime/src/servers/memory_server`
- Tools:
  - `memory.put`
  - `memory.get`
  - `memory.search`
  - `memory.link`
  - `memory.consolidate`
- Object model:
  - `ToolShape`, `PlanMemory`, `ConstraintMemory`, `RunMemory`, `EvidenceBundle`
- Required metadata:
  - `schema_version`, `created_at`, `updated_at`, `provenance`, `scope`

## Research server
- Module: `v3/@claude-flow/csp-runtime/src/servers/research_server`
- Tools:
  - `research.ingest_repo`
  - `research.ingest_file`
  - `research.search`
  - `research.open_artifact`
  - `research.cite_bundle`
- Retrieval:
  - Keyword index baseline (`indexer.ts`)
  - Swappable architecture for future embedding index
- Optional adapters (disabled by default):
  - Postgres, Neo4j, MLflow via env flags and docker profiles
