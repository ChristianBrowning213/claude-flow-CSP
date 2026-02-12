export interface SqliteAdapterState {
  enabled: boolean;
  db_path: string;
  reason: string;
}

export function sqliteAdapterState(): SqliteAdapterState {
  const enabled = process.env.CSP_RUNTIME_ENABLE_SQLITE === 'true';
  const dbPath = process.env.CSP_RUNTIME_SQLITE_PATH || '.claude-flow/runtime/sqlite/runtime.db';
  return {
    enabled,
    db_path: dbPath,
    reason: enabled
      ? 'SQLite adapter enabled by environment flag'
      : 'Disabled by default; set CSP_RUNTIME_ENABLE_SQLITE=true'
  };
}
