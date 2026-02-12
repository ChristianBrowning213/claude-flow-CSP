import { RuntimeMCPTool, RuntimeProvenance } from '../../types.js';
import { citeBundle, ingestFile, ingestRepo, openArtifact, searchResearch } from './research-store.js';
import { mlflowAdapterState, neo4jAdapterState, postgresAdapterState } from './adapters.js';

function parseProvenance(input: unknown): RuntimeProvenance {
  if (!input || typeof input !== 'object') return { source: 'runtime.research' };
  const p = input as Record<string, unknown>;
  return {
    source: typeof p.source === 'string' ? p.source : 'runtime.research',
    actor: typeof p.actor === 'string' ? p.actor : undefined,
    note: typeof p.note === 'string' ? p.note : undefined
  };
}

export const researchServerTools: RuntimeMCPTool[] = [
  {
    name: 'research.ingest_repo',
    description: 'Ingest a local repository directory into runtime research artifacts and keyword index.',
    category: 'runtime-research',
    tags: ['runtime', 'research', 'ingest'],
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        provenance: { type: 'object' }
      },
      required: ['path']
    },
    handler: async (input) => ingestRepo(
      input.path as string,
      parseProvenance(input.provenance)
    )
  },
  {
    name: 'research.ingest_file',
    description: 'Ingest a local file or URL document into runtime research artifacts.',
    category: 'runtime-research',
    tags: ['runtime', 'research', 'ingest'],
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        url: { type: 'string' },
        provenance: { type: 'object' }
      }
    },
    handler: async (input) => ingestFile({
      path: input.path as string | undefined,
      url: input.url as string | undefined,
      provenance: parseProvenance(input.provenance)
    })
  },
  {
    name: 'research.search',
    description: 'Search ingested artifacts using keyword index (embedding-free baseline).',
    category: 'runtime-research',
    tags: ['runtime', 'research', 'search'],
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['query']
    },
    handler: async (input) => searchResearch(input.query as string, input.limit as number | undefined)
  },
  {
    name: 'research.open_artifact',
    description: 'Open one persisted research artifact by id.',
    category: 'runtime-research',
    tags: ['runtime', 'research', 'artifact'],
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string' }
      },
      required: ['artifact_id']
    },
    handler: async (input) => openArtifact(input.artifact_id as string)
  },
  {
    name: 'research.cite_bundle',
    description: 'Create an evidence bundle from selected artifacts with stable hashes and snippets.',
    category: 'runtime-research',
    tags: ['runtime', 'research', 'evidence'],
    inputSchema: {
      type: 'object',
      properties: {
        artifact_ids: { type: 'array', items: { type: 'string' } },
        query: { type: 'string' },
        provenance: { type: 'object' }
      },
      required: ['artifact_ids']
    },
    handler: async (input) => citeBundle({
      artifact_ids: input.artifact_ids as string[],
      query: input.query as string | undefined,
      provenance: parseProvenance(input.provenance)
    })
  },
  {
    name: 'research.adapter_status',
    description: 'Report optional adapter states for Postgres/Neo4j/MLflow.',
    category: 'runtime-research',
    tags: ['runtime', 'research', 'adapters'],
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => ({
      postgres: postgresAdapterState(),
      neo4j: neo4jAdapterState(),
      mlflow: mlflowAdapterState()
    })
  }
];
