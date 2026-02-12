# Runtime Tool Registry

Purpose:
- Register runtime MCP-compatible tools in a single modular registry.

How to use:
- Import `runtimeToolRegistry` and call `.list()` to enumerate tools.
- Call `.get(name)` to resolve handler and schema for one tool.

Example:
- `runtimeToolRegistry.get("runtime.workspace.exec")`
