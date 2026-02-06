export interface RegistryItem {
  id: string;
  [key: string]: unknown;
}

const workflowRegistry = new Map<string, RegistryItem>();
const agentRegistry = new Map<string, RegistryItem>();
const verifyRegistry = new Map<string, RegistryItem>();

function registerAll(target: Map<string, RegistryItem>, items: RegistryItem[]): void {
  for (const item of items) {
    if (!item || typeof item.id !== 'string') {
      continue;
    }
    if (!target.has(item.id)) {
      target.set(item.id, item);
    }
  }
}

export function registerWorkflows(workflows: RegistryItem[]): void {
  registerAll(workflowRegistry, workflows);
}

export function registerAgents(agents: RegistryItem[]): void {
  registerAll(agentRegistry, agents);
}

export function registerVerifyPresets(presets: RegistryItem[]): void {
  registerAll(verifyRegistry, presets);
}

export function listWorkflows(): RegistryItem[] {
  return Array.from(workflowRegistry.values());
}

export function listAgents(): RegistryItem[] {
  return Array.from(agentRegistry.values());
}

export function listVerifyPresets(): RegistryItem[] {
  return Array.from(verifyRegistry.values());
}
