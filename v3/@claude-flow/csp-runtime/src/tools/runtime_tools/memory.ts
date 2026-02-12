import { memoryServerTools } from '../../servers/memory_server/memory-tools.js';
import { RuntimeToolDefinition } from '../registry/types.js';

export const runtimeMemoryTools: RuntimeToolDefinition[] = memoryServerTools.map((tool) => ({
  id: `runtime:${tool.name}`,
  name: tool.name.replace('memory.', 'runtime.memory.'),
  description: tool.description,
  inputSchema: tool.inputSchema,
  category: 'runtime-memory',
  tags: ['runtime', 'memory'],
  handler: tool.handler
}));
