# CASCADE Patterns Adopted

This document maps high-level CASCADE patterns to runtime integrations in Claude Flow CSP.

## Pattern set
- Three-server split: `research`, `memory`, `workspace`.
- Persistent runtime state under deterministic directories.
- Docker-first optional execution substrate.
- Structured evidence and run logging for tool outputs.
- Operator-focused usage playbooks for LLM execution loops.

## Source areas in `CASCADE_CSP`
- `mcp_servers_and_tools/workspace_server`
- `mcp_servers_and_tools/memory_server`
- `mcp_servers_and_tools/research_server`
- `mcp_servers_and_tools/direct_tools`
- `docker`, `docker-compose.yml`, `.env.example`
- `conversational_system` docs and operational patterns

## Adaptation policy
- Preserve Claude Flow orchestration ownership.
- Integrate runtime as modular tool packages and MCP tools.
- Keep optional services (MLflow/Neo4j/Postgres) disabled by default.

## Pattern mapping table
- Workspace runner:
  - CASCADE source: `CASCADE_CSP/docker/*`, `CASCADE_CSP/mcp_servers_and_tools/workspace_server`
  - Claude Flow destination: `v3/@claude-flow/csp-runtime/docker/workspace_runner`, `v3/@claude-flow/csp-runtime/src/servers/workspace_server`
  - Adaptation: moved to TypeScript handlers + explicit runtime root path guards.
- Memory as service:
  - CASCADE source: `CASCADE_CSP/mcp_servers_and_tools/memory_server`, `CASCADE_CSP/mcp_servers_and_tools/direct_tools/memory_tools.py`
  - Claude Flow destination: `v3/@claude-flow/csp-runtime/src/servers/memory_server`, `v3/@claude-flow/csp-runtime/src/persistence/memory`
  - Adaptation: file-first structured objects and scope metadata.
- Research ingestion/indexing:
  - CASCADE source: `CASCADE_CSP/mcp_servers_and_tools/research_server`, `CASCADE_CSP/mcp_servers_and_tools/direct_tools/research_tools.py`
  - Claude Flow destination: `v3/@claude-flow/csp-runtime/src/servers/research_server`
  - Adaptation: keyword index baseline with swappable retrieval architecture.
- Tool registry packaging:
  - CASCADE source: `CASCADE_CSP/mcp_servers_and_tools/direct_tools`
  - Claude Flow destination: `v3/@claude-flow/csp-runtime/src/tools/{registry,runtime_tools}`
  - Adaptation: runtime-prefixed MCP tool aliases + CLI MCP bridge integration.
