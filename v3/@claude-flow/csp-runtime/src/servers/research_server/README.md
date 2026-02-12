# Research Server

Purpose:
- Provide extract -> store -> query workflows over local code and docs with evidence bundles.

Tools:
- `research.ingest_repo`
- `research.ingest_file`
- `research.search`
- `research.open_artifact`
- `research.cite_bundle`
- `research.adapter_status`

Indexing strategy:
- Keyword/token index (embedding-free baseline)
- Swappable architecture for future embedding indexers

Persistence:
- `.claude-flow/runtime/artifacts/research`
- `.claude-flow/runtime/artifacts/evidence`
