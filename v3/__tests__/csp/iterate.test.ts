import { describe, it, expect } from 'vitest';
import { runCspCli } from '@claude-flow-csp/cli';
import { createMemoryIO } from './helpers.js';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('CSP iterate command', () => {
  it('creates iteration artifacts and increments manifest', async () => {
    const workspace = makeTempDir('csp-iter-');
    try {
      const { io: ioDiscover, stdout: outDiscover } = createMemoryIO();
      const discoverResult = await runCspCli([
        'csp:discover',
        '--dry-run',
        '--workspace',
        workspace,
        '--seed',
        '3',
        '--objective',
        'Iterate test',
      ], ioDiscover);

      expect(discoverResult.exitCode).toBe(0);
      const discoverPayload = JSON.parse(outDiscover.toString().trim());
      const runId = discoverPayload.run_id as string;

      const { io: ioIterate, stdout: outIterate } = createMemoryIO();
      const iterateResult = await runCspCli([
        'csp:iterate',
        '--dry-run',
        '--workspace',
        workspace,
        '--seed',
        '3',
        '--run-id',
        runId,
      ], ioIterate);

      expect(iterateResult.exitCode).toBe(0);
      expect(JSON.parse(outIterate.toString().trim()).iteration).toBe(1);

      const runDir = path.join(workspace, 'runs', runId);
      const iterationPath = path.join(runDir, 'iteration_1.json');
      expect(fs.existsSync(iterationPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(path.join(runDir, 'run_manifest.json'), 'utf8'));
      expect(manifest.iteration).toBe(1);
    } finally {
      cleanup(workspace);
    }
  });
});
