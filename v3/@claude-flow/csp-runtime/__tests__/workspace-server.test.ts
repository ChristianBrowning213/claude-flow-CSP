import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runtimePaths } from '../src/persistence/paths.js';
import { workspaceFetchAndStage, workspaceRunPython } from '../src/servers/workspace_server/workspace-service.js';

function dockerAndImageReady(): boolean {
  try {
    const dockerVersion = spawnSync('docker', ['--version']);
    if (dockerVersion.status !== 0) return false;
    const imageInspect = spawnSync('docker', ['image', 'inspect', 'claude-flow-csp-workspace-runner']);
    return imageInspect.status === 0;
  } catch {
    return false;
  }
}

describe('workspace server', () => {
  let server: ReturnType<typeof createServer>;
  let baseUrl = '';
  const dockerReady = dockerAndImageReady();

  beforeAll(async () => {
    rmSync(runtimePaths.root, { recursive: true, force: true });
    server = createServer((req, res) => {
      if (req.url === '/sample.txt') {
        res.writeHead(200, { 'content-type': 'text/plain' });
        res.end('stage-me');
        return;
      }
      res.writeHead(404);
      res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    if (address && typeof address === 'object') {
      baseUrl = `http://127.0.0.1:${address.port}`;
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  (dockerReady ? it : it.skip)('runs print(1+1) in docker runner when available', async () => {
    const result = await workspaceRunPython({
      code: 'print(1+1)',
      use_docker: true
    });
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('2');
  });

  it('fetches and stages file content', async () => {
    const result = await workspaceFetchAndStage({
      url: `${baseUrl}/sample.txt`,
      filename: 'staged.txt'
    });

    expect(result.success).toBe(true);
    expect(existsSync(result.stagedPath)).toBe(true);
    expect(readFileSync(result.stagedPath, 'utf-8')).toBe('stage-me');
  });
});
