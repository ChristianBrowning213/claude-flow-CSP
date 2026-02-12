import type { Command, CommandContext, CommandResult } from '../types.js';
import { output } from '../output.js';
import { callMCPTool } from '../mcp-client.js';

function parseJsonFlag(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {};
  } catch {
    throw new Error('Invalid JSON input');
  }
}

function parseStringArray(value: unknown): string[] | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const items = value.split(',').map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

async function runTool(ctx: CommandContext, toolName: string, payload: Record<string, unknown>): Promise<CommandResult> {
  try {
    const result = await callMCPTool(toolName, payload);
    if (ctx.flags.format === 'json') {
      output.printJson(result);
    } else {
      output.printSuccess(`${toolName} completed`);
      output.printJson(result);
    }
    return { success: true, data: result };
  } catch (error) {
    output.printError(`${toolName} failed: ${(error as Error).message}`);
    return { success: false, exitCode: 1 };
  }
}

const runtimeWorkspaceRunPythonCommand: Command = {
  name: 'run-python',
  description: 'Run Python code in runtime workspace',
  options: [
    { name: 'file', description: 'Workspace-relative python file path', type: 'string' },
    { name: 'code', description: 'Inline Python code', type: 'string' },
    { name: 'requirements', description: 'Comma-separated pip requirements', type: 'string' },
    { name: 'docker', description: 'Run with docker runner', type: 'boolean', default: true },
    { name: 'timeout', description: 'Timeout in milliseconds', type: 'number', default: 120000 }
  ],
  action: async (ctx) => runTool(ctx, 'workspace.run_python', {
    file: ctx.flags.file as string | undefined,
    code: ctx.flags.code as string | undefined,
    requirements: parseStringArray(ctx.flags.requirements),
    use_docker: (ctx.flags.docker as boolean | undefined) ?? true,
    timeout_ms: ctx.flags.timeout as number | undefined
  })
};

const runtimeWorkspaceExecCommand: Command = {
  name: 'exec',
  description: 'Execute shell command in runtime workspace',
  options: [
    { name: 'cmd', description: 'Command to execute', type: 'string', required: true },
    { name: 'working-dir', description: 'Workspace-relative working directory', type: 'string' },
    { name: 'docker', description: 'Run with docker runner', type: 'boolean', default: false },
    { name: 'timeout', description: 'Timeout in milliseconds', type: 'number', default: 120000 }
  ],
  action: async (ctx) => runTool(ctx, 'workspace.exec', {
    cmd: ctx.flags.cmd as string,
    working_dir: ctx.flags['working-dir'] as string | undefined,
    use_docker: (ctx.flags.docker as boolean | undefined) ?? false,
    timeout_ms: ctx.flags.timeout as number | undefined
  })
};

const runtimeWorkspaceFetchCommand: Command = {
  name: 'fetch-and-stage',
  description: 'Fetch URL and stage into runtime workspace',
  options: [
    { name: 'url', description: 'HTTP/HTTPS URL', type: 'string', required: true },
    { name: 'filename', description: 'Optional staged filename', type: 'string' }
  ],
  action: async (ctx) => runTool(ctx, 'workspace.fetch_and_stage', {
    url: ctx.flags.url as string,
    filename: ctx.flags.filename as string | undefined
  })
};

const runtimeWorkspaceCommand: Command = {
  name: 'workspace',
  description: 'Workspace runtime tools',
  subcommands: [
    runtimeWorkspaceRunPythonCommand,
    runtimeWorkspaceExecCommand,
    runtimeWorkspaceFetchCommand
  ]
};

const runtimeMemoryPutCommand: Command = {
  name: 'put',
  description: 'Store runtime memory object',
  options: [
    { name: 'store-type', description: 'Memory store type', type: 'string', required: true },
    { name: 'payload', description: 'JSON payload', type: 'string', required: true },
    { name: 'scope', description: 'Scope JSON', type: 'string' },
    { name: 'provenance', description: 'Provenance JSON', type: 'string' }
  ],
  action: async (ctx) => runTool(ctx, 'memory.put', {
    store_type: ctx.flags['store-type'] as string,
    payload: parseJsonFlag(ctx.flags.payload),
    scope: parseJsonFlag(ctx.flags.scope),
    provenance: parseJsonFlag(ctx.flags.provenance)
  })
};

const runtimeMemoryGetCommand: Command = {
  name: 'get',
  description: 'Get runtime memory object',
  options: [
    { name: 'id', description: 'Memory object id', type: 'string', required: true },
    { name: 'store-type', description: 'Optional memory store type', type: 'string' }
  ],
  action: async (ctx) => runTool(ctx, 'memory.get', {
    id: ctx.flags.id as string,
    store_type: ctx.flags['store-type'] as string | undefined
  })
};

const runtimeMemorySearchCommand: Command = {
  name: 'search',
  description: 'Search runtime memory',
  options: [
    { name: 'query', description: 'Search query', type: 'string' },
    { name: 'store-type', description: 'Memory store type', type: 'string' },
    { name: 'scope', description: 'Scope JSON', type: 'string' },
    { name: 'limit', description: 'Max results', type: 'number', default: 20 }
  ],
  action: async (ctx) => runTool(ctx, 'memory.search', {
    query: ctx.flags.query as string | undefined,
    store_type: ctx.flags['store-type'] as string | undefined,
    scope: parseJsonFlag(ctx.flags.scope),
    limit: ctx.flags.limit as number | undefined
  })
};

const runtimeMemoryLinkCommand: Command = {
  name: 'link',
  description: 'Link two runtime memory objects',
  options: [
    { name: 'source-id', description: 'Source memory id', type: 'string', required: true },
    { name: 'target-id', description: 'Target memory id', type: 'string', required: true },
    { name: 'relation', description: 'Relation name', type: 'string', required: true },
    { name: 'metadata', description: 'Metadata JSON', type: 'string' }
  ],
  action: async (ctx) => runTool(ctx, 'memory.link', {
    source_id: ctx.flags['source-id'] as string,
    target_id: ctx.flags['target-id'] as string,
    relation: ctx.flags.relation as string,
    metadata: parseJsonFlag(ctx.flags.metadata)
  })
};

const runtimeMemoryConsolidateCommand: Command = {
  name: 'consolidate',
  description: 'Consolidate runtime memory to semantic summary',
  options: [
    { name: 'scope', description: 'Scope JSON', type: 'string' },
    { name: 'store-types', description: 'Comma-separated store types', type: 'string' },
    { name: 'limit', description: 'Max source records', type: 'number', default: 100 },
    { name: 'summary-type', description: 'Summary store type', type: 'string' }
  ],
  action: async (ctx) => runTool(ctx, 'memory.consolidate', {
    scope: parseJsonFlag(ctx.flags.scope),
    store_types: parseStringArray(ctx.flags['store-types']),
    limit: ctx.flags.limit as number | undefined,
    summary_type: ctx.flags['summary-type'] as string | undefined
  })
};

const runtimeMemoryCommand: Command = {
  name: 'memory',
  description: 'Runtime memory tools',
  subcommands: [
    runtimeMemoryPutCommand,
    runtimeMemoryGetCommand,
    runtimeMemorySearchCommand,
    runtimeMemoryLinkCommand,
    runtimeMemoryConsolidateCommand
  ]
};

const runtimeResearchIngestRepoCommand: Command = {
  name: 'ingest-repo',
  description: 'Ingest repository into runtime research index',
  options: [
    { name: 'path', description: 'Repository path', type: 'string', required: true }
  ],
  action: async (ctx) => runTool(ctx, 'research.ingest_repo', {
    path: ctx.flags.path as string
  })
};

const runtimeResearchIngestFileCommand: Command = {
  name: 'ingest-file',
  description: 'Ingest file or URL into runtime research index',
  options: [
    { name: 'path', description: 'Local file path', type: 'string' },
    { name: 'url', description: 'Remote URL', type: 'string' }
  ],
  action: async (ctx) => runTool(ctx, 'research.ingest_file', {
    path: ctx.flags.path as string | undefined,
    url: ctx.flags.url as string | undefined
  })
};

const runtimeResearchSearchCommand: Command = {
  name: 'search',
  description: 'Search runtime research index',
  options: [
    { name: 'query', description: 'Search query', type: 'string', required: true },
    { name: 'limit', description: 'Max results', type: 'number', default: 5 }
  ],
  action: async (ctx) => runTool(ctx, 'research.search', {
    query: ctx.flags.query as string,
    limit: ctx.flags.limit as number | undefined
  })
};

const runtimeResearchOpenArtifactCommand: Command = {
  name: 'open-artifact',
  description: 'Open runtime research artifact',
  options: [
    { name: 'artifact-id', description: 'Artifact id', type: 'string', required: true }
  ],
  action: async (ctx) => runTool(ctx, 'research.open_artifact', {
    artifact_id: ctx.flags['artifact-id'] as string
  })
};

const runtimeResearchCiteBundleCommand: Command = {
  name: 'cite-bundle',
  description: 'Create evidence bundle from artifact ids',
  options: [
    { name: 'artifact-ids', description: 'Comma-separated artifact ids', type: 'string', required: true },
    { name: 'query', description: 'Optional query context', type: 'string' }
  ],
  action: async (ctx) => runTool(ctx, 'research.cite_bundle', {
    artifact_ids: parseStringArray(ctx.flags['artifact-ids']) || [],
    query: ctx.flags.query as string | undefined
  })
};

const runtimeResearchCommand: Command = {
  name: 'research',
  description: 'Runtime research tools',
  subcommands: [
    runtimeResearchIngestRepoCommand,
    runtimeResearchIngestFileCommand,
    runtimeResearchSearchCommand,
    runtimeResearchOpenArtifactCommand,
    runtimeResearchCiteBundleCommand
  ]
};

export const runtimeCommand: Command = {
  name: 'runtime',
  description: 'Runtime subsystem bridge commands (workspace, memory, research)',
  subcommands: [
    runtimeWorkspaceCommand,
    runtimeMemoryCommand,
    runtimeResearchCommand
  ]
};

export default runtimeCommand;
