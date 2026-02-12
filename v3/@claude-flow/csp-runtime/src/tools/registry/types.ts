export interface RuntimeToolDefinition {
  id: string;
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
