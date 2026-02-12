import { RuntimeToolDefinition } from '../registry/types.js';
import { runtimeMemoryTools } from './memory.js';
import { runtimeResearchTools } from './research.js';
import { runtimeWorkspaceTools } from './workspace.js';

export const runtimeTools: RuntimeToolDefinition[] = [
  ...runtimeWorkspaceTools,
  ...runtimeMemoryTools,
  ...runtimeResearchTools
];
