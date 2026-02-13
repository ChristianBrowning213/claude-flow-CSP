import type { MCPTool } from './types.js';

interface RuntimeRegistryLike {
  get: (name: string) => {
    handler: (input: Record<string, unknown>, context?: Record<string, unknown>) => Promise<unknown>;
  } | undefined;
}

interface RuntimeModuleLike {
  runtimeToolRegistry?: RuntimeRegistryLike;
}

let runtimeModuleCache: RuntimeModuleLike | null = null;

async function loadRuntimeModule(): Promise<RuntimeModuleLike> {
  if (runtimeModuleCache) return runtimeModuleCache;

  const moduleOverride = process.env.CSP_RUNTIME_MODULE_PATH;
  const candidates = [
    moduleOverride,
    new URL('../../../csp-runtime/dist/index.js', import.meta.url).href,
    new URL('../../../../csp-runtime/dist/index.js', import.meta.url).href,
  ].filter((value): value is string => Boolean(value));

  let lastError: Error | undefined;
  for (const candidate of candidates) {
    try {
      const mod = await import(candidate);
      runtimeModuleCache = mod as RuntimeModuleLike;
      return runtimeModuleCache;
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw new Error(
    `Failed to load @claude-flow/csp-runtime runtime module. Build runtime package first. ${lastError ? `Last error: ${lastError.message}` : ''}`
  );
}

async function invokeRuntimeTool(
  toolName: string,
  input: Record<string, unknown>,
  context?: Record<string, unknown>
): Promise<unknown> {
  const runtime = await loadRuntimeModule();
  const registry = runtime.runtimeToolRegistry;
  if (!registry) {
    throw new Error('runtimeToolRegistry not available in runtime module');
  }
  const tool = registry.get(toolName);
  if (!tool) {
    throw new Error(`Runtime tool not found: ${toolName}`);
  }
  return tool.handler(input, context);
}

function createRuntimeTool(
  name: string,
  description: string,
  required: readonly string[] = []
): MCPTool {
  return {
    name,
    description,
    category: 'runtime',
    tags: ['runtime', 'cascade-cannibalisation'],
    inputSchema: {
      type: 'object',
      properties: {},
      required: [...required]
    },
    handler: async (input, context) => invokeRuntimeTool(name, input, context)
  };
}

const workspaceNames = [
  ['workspace.exec', 'Execute shell command in runtime workspace', ['cmd']],
  ['workspace.run_python', 'Execute Python in runtime workspace', []],
  ['workspace.fetch_and_stage', 'Fetch URL and stage into runtime workspace', ['url']],
  ['runtime.workspace.exec', 'Runtime alias for workspace.exec', ['cmd']],
  ['runtime.workspace.run_python', 'Runtime alias for workspace.run_python', []],
  ['runtime.workspace.fetch_and_stage', 'Runtime alias for workspace.fetch_and_stage', ['url']],
] as const;

const memoryNames = [
  ['memory.put', 'Store structured runtime memory object', ['store_type', 'payload']],
  ['memory.get', 'Get runtime memory object by id', ['id']],
  ['memory.search', 'Search runtime memory objects', []],
  ['memory.link', 'Link runtime memory objects', ['source_id', 'target_id', 'relation']],
  ['memory.consolidate', 'Consolidate runtime memory records', []],
  ['runtime.memory.put', 'Runtime alias for memory.put', ['store_type', 'payload']],
  ['runtime.memory.get', 'Runtime alias for memory.get', ['id']],
  ['runtime.memory.search', 'Runtime alias for memory.search', []],
  ['runtime.memory.link', 'Runtime alias for memory.link', ['source_id', 'target_id', 'relation']],
  ['runtime.memory.consolidate', 'Runtime alias for memory.consolidate', []],
] as const;

const researchNames = [
  ['research.ingest_repo', 'Ingest repository into runtime research index', ['path']],
  ['research.ingest_file', 'Ingest file or URL into runtime research index', []],
  ['research.search', 'Search runtime research index', ['query']],
  ['research.open_artifact', 'Open runtime research artifact', ['artifact_id']],
  ['research.cite_bundle', 'Create runtime evidence bundle', ['artifact_ids']],
  ['runtime.research.ingest_repo', 'Runtime alias for research.ingest_repo', ['path']],
  ['runtime.research.ingest_file', 'Runtime alias for research.ingest_file', []],
  ['runtime.research.search', 'Runtime alias for research.search', ['query']],
  ['runtime.research.open_artifact', 'Runtime alias for research.open_artifact', ['artifact_id']],
  ['runtime.research.cite_bundle', 'Runtime alias for research.cite_bundle', ['artifact_ids']],
] as const;

export const runtimeTools: MCPTool[] = [
  ...workspaceNames.map(([name, description, required]) => createRuntimeTool(name, description, required)),
  ...memoryNames.map(([name, description, required]) => createRuntimeTool(name, description, required)),
  ...researchNames.map(([name, description, required]) => createRuntimeTool(name, description, required)),
];
