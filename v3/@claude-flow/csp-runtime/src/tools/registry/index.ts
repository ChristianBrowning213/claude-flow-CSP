import { memoryServerTools } from '../../servers/memory_server/memory-tools.js';
import { researchServerTools } from '../../servers/research_server/research-tools.js';
import { workspaceServerTools } from '../../servers/workspace_server/workspace-tools.js';
import { RuntimeToolRegistry } from './registry.js';
import { RuntimeToolDefinition } from './types.js';
import { runtimeTools } from '../runtime_tools/index.js';

function toDefinition(tool: {
  name: string;
  description: string;
  inputSchema: RuntimeToolDefinition['inputSchema'];
  category?: string;
  tags?: string[];
  handler: RuntimeToolDefinition['handler'];
}): RuntimeToolDefinition {
  return {
    id: tool.name,
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    category: tool.category,
    tags: tool.tags,
    handler: tool.handler
  };
}

export const runtimeToolRegistry = new RuntimeToolRegistry();
runtimeToolRegistry.registerMany([
  ...workspaceServerTools.map(toDefinition),
  ...memoryServerTools.map(toDefinition),
  ...researchServerTools.map(toDefinition),
  ...runtimeTools
]);
