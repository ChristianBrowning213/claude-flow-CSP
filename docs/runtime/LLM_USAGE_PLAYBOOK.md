# LLM Usage Playbook

## Operational loop (strict)
1. Retrieve: query `memory.search` and `research.search` for existing context.
2. Plan: produce explicit tool sequence and expected artifacts.
3. Tool: call `workspace.*`, `memory.*`, `research.*` in small steps.
4. Log: ensure outputs are persisted in runtime dirs and run events.
5. Consolidate: run `memory.consolidate` after meaningful execution batches.

## Tool call templates
- `workspace.exec`:
  - `{ "cmd": "...", "working_dir": "staging", "use_docker": true }`
- `workspace.run_python`:
  - `{ "code": "print(1+1)", "requirements": ["pandas"], "use_docker": true }`
- `memory.put`:
  - `{ "store_type": "RunMemory", "scope": {"run_id":"..."}, "payload": {...}, "provenance": {"source":"llm"} }`
- `research.ingest_repo`:
  - `{ "path": "." }`
- `research.cite_bundle`:
  - `{ "artifact_ids": ["art-..."], "query": "..." }`

## EvidenceBundle rules
- Always cite artifact IDs and hashes from `research.cite_bundle`.
- Link bundle to constraints/plans with `memory.link`.
- Never quote unsupported claims without a bundle reference.

## ToolShape updates after tool errors
- On schema mismatch or runtime error:
  1. Store a `ToolShape` object with expected vs actual input/output.
  2. Tag with `error`, tool name, and revision note.
  3. Link to `RunMemory` record capturing failure context.

## Worked examples

### 1) Ingest repo then search for X
1. `research.ingest_repo { "path": "." }`
2. `research.search { "query": "workspaceRunPython", "limit": 5 }`
3. `memory.put` store top result summary as `RunMemory`.

### 2) Fetch and stage URL then run Python analysis
1. `workspace.fetch_and_stage { "url": "https://example.com/data.txt", "filename": "data.txt" }`
2. `workspace.run_python { "code": "print(open('.claude-flow/runtime/workspace/staging/data.txt').read()[:40])", "use_docker": false }`
3. `memory.put` run summary with output hash.

### 3) Store ToolShape after schema mismatch
1. Observe tool error for missing field.
2. `memory.put { "store_type":"ToolShape", "payload":{"tool":"workspace.exec","expected":["cmd"],"actual":["command"]}, "provenance":{"source":"llm.error-handler"} }`
3. Link to run record with `memory.link`.

### 4) Link EvidenceBundle to constraint plugin
1. `research.cite_bundle { "artifact_ids":["art-1","art-2"], "query":"constraint evidence" }`
2. `memory.put { "store_type":"ConstraintMemory", "payload":{"constraint":"Do not replace orchestrator"} }`
3. `memory.link { "source_id":"<bundle_mem_id>", "target_id":"<constraint_id>", "relation":"supports_constraint" }`

### 5) Run QLIP experiment and log MLflow metrics (if enabled)
1. Execute experiment via `workspace.exec` or `workspace.run_python`.
2. `memory.put { "store_type":"RunMemory", "scope":{"experiment_id":"qlip-01"}, "payload":{"metrics":{"acc":0.84}} }`
3. If `CSP_RUNTIME_ENABLE_MLFLOW=true`, publish metrics through MLflow endpoint configured in operator environment.

### 6) Consolidate run memory to semantic summary
1. `memory.search { "scope":{"run_id":"run-123"} }`
2. `memory.consolidate { "scope":{"run_id":"run-123"}, "summary_type":"RunMemory" }`
3. Store summary ID in session state for next planning loop.
