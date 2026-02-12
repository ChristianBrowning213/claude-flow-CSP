import { researchServerTools } from '../../servers/research_server/research-tools.js';
import { RuntimeToolDefinition } from '../registry/types.js';

export const runtimeResearchTools: RuntimeToolDefinition[] = researchServerTools.map((tool) => ({
  id: `runtime:${tool.name}`,
  name: tool.name.replace('research.', 'runtime.research.'),
  description: tool.description,
  inputSchema: tool.inputSchema,
  category: 'runtime-research',
  tags: ['runtime', 'research'],
  handler: tool.handler
}));
