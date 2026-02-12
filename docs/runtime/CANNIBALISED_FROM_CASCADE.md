# Cannibalised From CASCADE

## What we took
- Three-server runtime split pattern (workspace/memory/research).
- Docker-first workspace execution pattern with mounted runtime dirs.
- Structured persistence and event-log pattern (`schema_version`, provenance, run events).
- Research extraction -> stored artifacts -> query -> citation workflow.
- Operator-facing documentation style for human + LLM execution discipline.

## Why we took it
- These patterns improve tool reliability and state traceability while preserving Claude Flow orchestration ownership.
- They map cleanly to MCP-compatible utilities without introducing a competing planner/orchestrator.

## What changed
- Re-implemented in TypeScript-first package layout aligned to `v3/@claude-flow`.
- Runtime storage normalized under `.claude-flow/runtime/...`.
- CASCADE-specific external stack dependencies replaced with optional adapters disabled by default.
