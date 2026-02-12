# Runtime Operator Manual

## What runs where
- Orchestration: Claude Flow (`v3/@claude-flow/cli`) remains coordinator.
- Runtime utility package: `v3/@claude-flow/csp-runtime`.
- Runtime services exposed as MCP-compatible tools:
  - `workspace.*`
  - `memory.*`
  - `research.*`
  - `runtime.workspace.*`
  - `runtime.memory.*`
  - `runtime.research.*`

## Start docker services
- Validate compose:
  - `docker compose -f v3/@claude-flow/csp-runtime/docker/docker-compose.yml config`
- Build workspace runner image:
  - `docker compose -f v3/@claude-flow/csp-runtime/docker/docker-compose.yml --profile workspace build workspace_runner`
- Optional services:
  - MLflow: `--profile mlflow`
  - Neo4j: `--profile neo4j`
  - Postgres: `--profile postgres`

## CLI usage
- Workspace:
  - `claude-flow runtime workspace run-python --code "print(1+1)"`
  - `claude-flow runtime workspace exec --cmd "python --version"`
  - `claude-flow runtime workspace fetch-and-stage --url "https://example.com/a.txt"`
- Memory:
  - `claude-flow runtime memory put --store-type RunMemory --payload "{\"status\":\"ok\"}"`
  - `claude-flow runtime memory search --query "status"`
- Research:
  - `claude-flow runtime research ingest-repo --path .`
  - `claude-flow runtime research search --query "workspaceRunPython"`

## Persistence layout
- `.claude-flow/runtime/workspace/runs`
- `.claude-flow/runtime/workspace/artifacts`
- `.claude-flow/runtime/workspace/logs`
- `.claude-flow/runtime/memory/objects`
- `.claude-flow/runtime/memory/links`
- `.claude-flow/runtime/artifacts/research`
- `.claude-flow/runtime/artifacts/evidence`
- `.claude-flow/runtime/run_events/events.jsonl`

## Troubleshooting
- Runtime tool load fails in CLI:
  - Build runtime package first: `cd v3/@claude-flow/csp-runtime && npm run build`
  - Or set explicit module path: `CSP_RUNTIME_MODULE_PATH=<file:///.../dist/index.js>`
- Docker command fails:
  - Ensure Docker daemon is running and image exists:
    - `docker image inspect claude-flow-csp-workspace-runner`
- Memory or research paths appear empty:
  - Confirm command ran from expected repository root (runtime paths are relative to current working directory).
