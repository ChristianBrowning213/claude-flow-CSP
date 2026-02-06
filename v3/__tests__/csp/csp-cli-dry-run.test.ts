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

describe('CSP CLI dry-run', () => {
  it('runs end-to-end discovery and writes artifacts', async () => {
    const workspace = makeTempDir('csp-dry-run-');
    try {
      const { io, stdout } = createMemoryIO();
      const result = await runCspCli([
        'csp:discover',
        '--dry-run',
        '--workspace',
        workspace,
        '--seed',
        '1',
        '--objective',
        'Discover stable oxide',
      ], io);

      expect(result.exitCode).toBe(0);
      const output = stdout.toString().trim();
      const parsed = JSON.parse(output);

      expect(parsed.run_id).toBeTruthy();
      expect(parsed.selected_chemistry).toBeTruthy();
      expect(parsed.chosen_candidate_id).toBeTruthy();

      const runDir = path.join(workspace, 'runs', parsed.run_id);
      expect(fs.existsSync(runDir)).toBe(true);
      expect(fs.existsSync(path.join(runDir, 'run_manifest.json'))).toBe(true);
      expect(fs.existsSync(path.join(runDir, 'constraints.json'))).toBe(true);

      const candidatesDir = path.join(runDir, 'candidates');
      expect(fs.existsSync(candidatesDir)).toBe(true);
      const candidateFiles = fs.readdirSync(candidatesDir).filter((f) => f.endsWith('.cif'));
      expect(candidateFiles.length).toBe(5);

      const summaryPath = path.join(runDir, 'validation', 'summary.json');
      expect(fs.existsSync(summaryPath)).toBe(true);
    } finally {
      cleanup(workspace);
    }
  });
});
