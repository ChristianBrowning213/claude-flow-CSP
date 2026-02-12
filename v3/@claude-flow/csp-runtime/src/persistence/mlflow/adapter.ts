export interface MlflowAdapterState {
  enabled: boolean;
  tracking_uri: string;
  reason: string;
}

export function mlflowAdapterState(): MlflowAdapterState {
  const enabled = process.env.CSP_RUNTIME_ENABLE_MLFLOW === 'true';
  const trackingUri = process.env.MLFLOW_TRACKING_URI || 'http://localhost:5001';
  return {
    enabled,
    tracking_uri: trackingUri,
    reason: enabled
      ? 'MLflow adapter enabled by environment flag'
      : 'Disabled by default; set CSP_RUNTIME_ENABLE_MLFLOW=true'
  };
}
