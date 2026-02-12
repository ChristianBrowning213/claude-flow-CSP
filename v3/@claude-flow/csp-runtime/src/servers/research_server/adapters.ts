export interface OptionalAdapterState {
  enabled: boolean;
  reason: string;
}

function envEnabled(name: string): boolean {
  return process.env[name]?.toLowerCase() === 'true';
}

export function postgresAdapterState(): OptionalAdapterState {
  const enabled = envEnabled('CSP_RUNTIME_ENABLE_POSTGRES');
  return {
    enabled,
    reason: enabled
      ? 'Postgres adapter enabled by environment flag'
      : 'Disabled by default; set CSP_RUNTIME_ENABLE_POSTGRES=true'
  };
}

export function neo4jAdapterState(): OptionalAdapterState {
  const enabled = envEnabled('CSP_RUNTIME_ENABLE_NEO4J');
  return {
    enabled,
    reason: enabled
      ? 'Neo4j adapter enabled by environment flag'
      : 'Disabled by default; set CSP_RUNTIME_ENABLE_NEO4J=true'
  };
}

export function mlflowAdapterState(): OptionalAdapterState {
  const enabled = envEnabled('CSP_RUNTIME_ENABLE_MLFLOW');
  return {
    enabled,
    reason: enabled
      ? 'MLflow adapter enabled by environment flag'
      : 'Disabled by default; set CSP_RUNTIME_ENABLE_MLFLOW=true'
  };
}
