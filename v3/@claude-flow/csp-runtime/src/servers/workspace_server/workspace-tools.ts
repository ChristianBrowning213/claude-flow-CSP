import { RuntimeMCPTool } from '../../types.js';
import { workspaceExec, workspaceFetchAndStage, workspaceRunPython } from './workspace-service.js';

export const workspaceServerTools: RuntimeMCPTool[] = [
  {
    name: 'workspace.exec',
    description: 'Execute a shell command in the runtime workspace with optional Docker isolation.',
    category: 'runtime-workspace',
    tags: ['runtime', 'workspace', 'exec'],
    inputSchema: {
      type: 'object',
      properties: {
        cmd: { type: 'string', description: 'Shell command to execute' },
        working_dir: { type: 'string', description: 'Runtime workspace-relative working directory' },
        timeout_ms: { type: 'number', description: 'Execution timeout in milliseconds' },
        use_docker: { type: 'boolean', description: 'Execute inside workspace runner Docker image' },
        run_id: { type: 'string', description: 'Optional run identifier' }
      },
      required: ['cmd']
    },
    handler: async (input) => workspaceExec({
      cmd: input.cmd as string,
      working_dir: input.working_dir as string | undefined,
      timeout_ms: input.timeout_ms as number | undefined,
      use_docker: (input.use_docker as boolean | undefined) ?? false,
      run_id: input.run_id as string | undefined
    })
  },
  {
    name: 'workspace.run_python',
    description: 'Run Python code or file in the runtime workspace with optional requirements install.',
    category: 'runtime-workspace',
    tags: ['runtime', 'workspace', 'python'],
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Inline Python source code' },
        file: { type: 'string', description: 'Runtime workspace-relative path to a Python file' },
        requirements: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional pip requirements specifiers'
        },
        timeout_ms: { type: 'number', description: 'Execution timeout in milliseconds' },
        use_docker: { type: 'boolean', description: 'Execute inside workspace runner Docker image' },
        run_id: { type: 'string', description: 'Optional run identifier' }
      }
    },
    handler: async (input) => workspaceRunPython({
      code: input.code as string | undefined,
      file: input.file as string | undefined,
      requirements: input.requirements as string[] | undefined,
      timeout_ms: input.timeout_ms as number | undefined,
      use_docker: (input.use_docker as boolean | undefined) ?? true,
      run_id: input.run_id as string | undefined
    })
  },
  {
    name: 'workspace.fetch_and_stage',
    description: 'Fetch a remote URL and stage it into runtime workspace and artifacts.',
    category: 'runtime-workspace',
    tags: ['runtime', 'workspace', 'staging'],
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'HTTP/HTTPS URL to download' },
        filename: { type: 'string', description: 'Optional staged file name override' }
      },
      required: ['url']
    },
    handler: async (input) => workspaceFetchAndStage({
      url: input.url as string,
      filename: input.filename as string | undefined
    })
  }
];
