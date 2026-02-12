export interface RuntimeScope {
  project?: string;
  repo?: string;
  run_id?: string;
  experiment_id?: string;
}

export interface RuntimeProvenance {
  source: string;
  actor?: string;
  note?: string;
}

export interface RuntimeMCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  category?: string;
  tags?: string[];
  handler: (input: Record<string, unknown>, context?: Record<string, unknown>) => Promise<unknown>;
}

export interface CommandExecutionResult {
  success: boolean;
  runId: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  logPath: string;
  artifactDir: string;
}
