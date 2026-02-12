import { RuntimeToolDefinition } from './types.js';

export class RuntimeToolRegistry {
  private readonly tools = new Map<string, RuntimeToolDefinition>();

  register(tool: RuntimeToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  registerMany(toolDefs: RuntimeToolDefinition[]): void {
    for (const tool of toolDefs) {
      this.register(tool);
    }
  }

  get(name: string): RuntimeToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(): RuntimeToolDefinition[] {
    return Array.from(this.tools.values());
  }
}
