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

async function runDiscover(workspace: string) {
  const { io, stdout } = createMemoryIO();
  const result = await runCspCli([
    'csp:discover',
    '--dry-run',
    '--workspace',
    workspace,
    '--seed',
    '7',
    '--objective',
    'Determinism test',
  ], io);

  expect(result.exitCode).toBe(0);
  return JSON.parse(stdout.toString().trim());
}

describe('CSP determinism', () => {
  it('produces identical outputs for the same seed', async () => {
    const workspaceA = makeTempDir('csp-det-a-');
    const workspaceB = makeTempDir('csp-det-b-');

    try {
      const resultA = await runDiscover(workspaceA);
      const resultB = await runDiscover(workspaceB);

      expect(resultA.candidate_ids).toEqual(resultB.candidate_ids);
      expect(resultA.summary_hash).toBe(resultB.summary_hash);
      expect(resultA.chosen_candidate_id).toBe(resultB.chosen_candidate_id);
    } finally {
      cleanup(workspaceA);
      cleanup(workspaceB);
    }
  });
});
