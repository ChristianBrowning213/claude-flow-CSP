CREATE TABLE IF NOT EXISTS extracted_artifacts (
  artifact_id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_bundles (
  bundle_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  query TEXT,
  payload_json TEXT NOT NULL
);
