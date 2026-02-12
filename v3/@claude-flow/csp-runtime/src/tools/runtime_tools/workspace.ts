import { workspaceServerTools } from '../../servers/workspace_server/workspace-tools.js';
import { RuntimeToolDefinition } from '../registry/types.js';

export const runtimeWorkspaceTools: RuntimeToolDefinition[] = workspaceServerTools.map((tool) => ({
  id: `runtime:${tool.name}`,
  name: tool.name.replace('workspace.', 'runtime.workspace.'),
  description: tool.description,
  inputSchema: tool.inputSchema,
  category: 'runtime-workspace',
  tags: ['runtime', 'workspace'],
  handler: tool.handler
}));
