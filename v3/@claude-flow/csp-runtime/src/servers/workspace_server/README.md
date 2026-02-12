# Workspace Server

Purpose:
- Provide MCP-compatible runtime workspace tools for controlled command execution, Python runs, and URL staging.

Tools:
- `workspace.exec`
- `workspace.run_python`
- `workspace.fetch_and_stage`

Runtime paths:
- `.claude-flow/runtime/workspace/runs`
- `.claude-flow/runtime/workspace/artifacts`
- `.claude-flow/runtime/workspace/logs`

Examples:
- `workspace.exec` with `{ "cmd": "ls", "use_docker": false }`
- `workspace.run_python` with `{ "code": "print(1+1)", "use_docker": true }`
- `workspace.fetch_and_stage` with `{ "url": "https://example.com/file.txt" }`
