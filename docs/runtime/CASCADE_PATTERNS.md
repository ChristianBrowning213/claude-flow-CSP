# CASCADE Patterns Adopted

This document maps high-level CASCADE patterns to runtime integrations in Claude Flow CSP.

## Pattern set (initial map)
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
