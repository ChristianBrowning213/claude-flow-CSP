import { RuntimeMCPTool, RuntimeProvenance, RuntimeScope } from '../../types.js';
import { consolidateMemory, getMemoryObject, linkMemoryObjects, putMemoryObject, searchMemoryObjects } from '../../persistence/memory/memory-store.js';
import { MemoryStoreType } from '../../persistence/memory/types.js';

function parseScope(input: unknown): RuntimeScope {
  if (!input || typeof input !== 'object') return {};
  const scope = input as Record<string, unknown>;
  return {
    project: typeof scope.project === 'string' ? scope.project : undefined,
    repo: typeof scope.repo === 'string' ? scope.repo : undefined,
    run_id: typeof scope.run_id === 'string' ? scope.run_id : undefined,
    experiment_id: typeof scope.experiment_id === 'string' ? scope.experiment_id : undefined
  };
}

function parseProvenance(input: unknown): RuntimeProvenance {
  if (!input || typeof input !== 'object') {
    return { source: 'runtime.memory' };
  }
  const prov = input as Record<string, unknown>;
  return {
    source: typeof prov.source === 'string' ? prov.source : 'runtime.memory',
    actor: typeof prov.actor === 'string' ? prov.actor : undefined,
    note: typeof prov.note === 'string' ? prov.note : undefined
  };
}

function asStoreType(input: unknown): MemoryStoreType {
  const value = input as MemoryStoreType;
  if (!['ToolShape', 'PlanMemory', 'ConstraintMemory', 'RunMemory', 'EvidenceBundle'].includes(value)) {
    throw new Error(`Unsupported memory store_type: ${String(input)}`);
  }
  return value;
}

export const memoryServerTools: RuntimeMCPTool[] = [
  {
    name: 'memory.put',
    description: 'Store a structured memory object in file-first runtime persistence.',
    category: 'runtime-memory',
    tags: ['runtime', 'memory', 'put'],
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        store_type: { type: 'string' },
        scope: { type: 'object' },
        payload: { type: 'object' },
        tags: { type: 'array', items: { type: 'string' } },
        provenance: { type: 'object' },
        schema_version: { type: 'string' }
      },
      required: ['store_type', 'payload']
    },
    handler: async (input) => putMemoryObject({
      id: input.id as string | undefined,
      store_type: asStoreType(input.store_type),
      scope: parseScope(input.scope),
      payload: input.payload,
      tags: input.tags as string[] | undefined,
      provenance: parseProvenance(input.provenance),
      schema_version: input.schema_version as string | undefined
    })
  },
  {
    name: 'memory.get',
    description: 'Get one memory object by id and optional type.',
    category: 'runtime-memory',
    tags: ['runtime', 'memory', 'get'],
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        store_type: { type: 'string' }
      },
      required: ['id']
    },
    handler: async (input) => getMemoryObject({
      id: input.id as string,
      store_type: input.store_type ? asStoreType(input.store_type) : undefined
    })
  },
  {
    name: 'memory.search',
    description: 'Search memory objects by query, type, and scope filters.',
    category: 'runtime-memory',
    tags: ['runtime', 'memory', 'search'],
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        store_type: { type: 'string' },
        scope: { type: 'object' },
        limit: { type: 'number' }
      }
    },
    handler: async (input) => searchMemoryObjects({
      query: input.query as string | undefined,
      store_type: input.store_type ? asStoreType(input.store_type) : undefined,
      scope: parseScope(input.scope),
      limit: input.limit as number | undefined
    })
  },
  {
    name: 'memory.link',
    description: 'Create a typed link between two memory objects (artifact/run/constraint relationships).',
    category: 'runtime-memory',
    tags: ['runtime', 'memory', 'link'],
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        source_id: { type: 'string' },
        target_id: { type: 'string' },
        relation: { type: 'string' },
        metadata: { type: 'object' },
        provenance: { type: 'object' }
      },
      required: ['source_id', 'target_id', 'relation']
    },
    handler: async (input) => linkMemoryObjects({
      id: input.id as string | undefined,
      source_id: input.source_id as string,
      target_id: input.target_id as string,
      relation: input.relation as string,
      metadata: input.metadata as Record<string, unknown> | undefined,
      provenance: parseProvenance(input.provenance)
    })
  },
  {
    name: 'memory.consolidate',
    description: 'Consolidate episodic memory objects into a semantic summary object.',
    category: 'runtime-memory',
    tags: ['runtime', 'memory', 'consolidate'],
    inputSchema: {
      type: 'object',
      properties: {
        scope: { type: 'object' },
        store_types: { type: 'array', items: { type: 'string' } },
        limit: { type: 'number' },
        summary_type: { type: 'string' },
        provenance: { type: 'object' }
      }
    },
    handler: async (input) => consolidateMemory({
      scope: parseScope(input.scope),
      store_types: Array.isArray(input.store_types)
        ? input.store_types.map((s) => asStoreType(s))
        : undefined,
      limit: input.limit as number | undefined,
      summary_type: input.summary_type ? asStoreType(input.summary_type) : undefined,
      provenance: parseProvenance(input.provenance)
    })
  }
];
