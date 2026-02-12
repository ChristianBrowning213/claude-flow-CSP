import { memoryServerTools } from './servers/memory_server/memory-tools.js';
import { researchServerTools } from './servers/research_server/research-tools.js';
import { workspaceServerTools } from './servers/workspace_server/workspace-tools.js';
import { runtimeToolRegistry } from './tools/registry/index.js';
import { RuntimeMCPTool } from './types.js';

export { runtimePaths, ensureRuntimeDirectories } from './persistence/paths.js';
export { workspaceServerTools } from './servers/workspace_server/workspace-tools.js';
export { memoryServerTools } from './servers/memory_server/memory-tools.js';
export { researchServerTools } from './servers/research_server/research-tools.js';
export { runtimeToolRegistry } from './tools/registry/index.js';

export const runtimeServerTools: RuntimeMCPTool[] = [
  ...workspaceServerTools,
  ...memoryServerTools,
  ...researchServerTools
];

export const runtimeMcpTools: RuntimeMCPTool[] = runtimeToolRegistry.list().map((tool) => ({
  name: tool.name,
  description: tool.description,
  inputSchema: tool.inputSchema,
  category: tool.category,
  tags: tool.tags,
  handler: tool.handler
}));
