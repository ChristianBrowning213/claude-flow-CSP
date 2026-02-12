# @claude-flow/csp-runtime

Runtime subsystems extracted from CASCADE patterns and adapted for Claude Flow CSP:
- `workspace_server`: isolated execution and file staging tools.
- `memory_server`: structured memory objects and consolidation workflows.
- `research_server`: ingest, index, search, and citation bundle tools.
- `tools/registry`: modular runtime tool packaging for MCP bridge registration.

Claude Flow remains the orchestrator. This package only provides utility subsystems and tool handlers.
