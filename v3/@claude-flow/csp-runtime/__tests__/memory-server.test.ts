import { existsSync, rmSync } from 'node:fs';
import { describe, expect, it, beforeEach } from 'vitest';
import { runtimePaths } from '../src/persistence/paths.js';
import { consolidateMemory, getMemoryObject, putMemoryObject, searchMemoryObjects } from '../src/persistence/memory/memory-store.js';

describe('memory server persistence', () => {
  beforeEach(() => {
    rmSync(runtimePaths.root, { recursive: true, force: true });
  });

  it('roundtrips store and retrieve', () => {
    const saved = putMemoryObject({
      store_type: 'ToolShape',
      scope: { project: 'alpha', repo: 'repo-a' },
      payload: { tool: 'workspace.exec', args: { cmd: 'echo hi' } },
      provenance: { source: 'test' }
    });

    const loaded = getMemoryObject({ id: saved.id, store_type: 'ToolShape' });
    expect(loaded?.id).toBe(saved.id);
    expect((loaded?.payload as any).tool).toBe('workspace.exec');
  });

  it('applies search filtering by query and scope', () => {
    putMemoryObject({
      store_type: 'PlanMemory',
      scope: { repo: 'repo-a', run_id: 'r1' },
      payload: { step: 'ingest repo and search symbols' },
      provenance: { source: 'test' }
    });
    putMemoryObject({
      store_type: 'PlanMemory',
      scope: { repo: 'repo-b', run_id: 'r2' },
      payload: { step: 'deploy docker service' },
      provenance: { source: 'test' }
    });

    const results = searchMemoryObjects({
      query: 'ingest',
      scope: { repo: 'repo-a' }
    });

    expect(results.length).toBe(1);
    expect((results[0].payload as any).step).toContain('ingest');
  });

  it('consolidates into summary without deleting source records', () => {
    const first = putMemoryObject({
      store_type: 'ConstraintMemory',
      scope: { project: 'p1', experiment_id: 'exp-1' },
      payload: { rule: 'no orchestrator replacement' },
      provenance: { source: 'test' }
    });
    const second = putMemoryObject({
      store_type: 'RunMemory',
      scope: { project: 'p1', experiment_id: 'exp-1' },
      payload: { metrics: { latency_ms: 20 } },
      provenance: { source: 'test' }
    });

    const summary = consolidateMemory({
      scope: { project: 'p1', experiment_id: 'exp-1' },
      provenance: { source: 'test' }
    });

    expect(summary.store_type).toBe('RunMemory');
    expect(existsSync(`${runtimePaths.memoryObjects}/ConstraintMemory/${first.id}.json`)).toBe(true);
    expect(existsSync(`${runtimePaths.memoryObjects}/RunMemory/${second.id}.json`)).toBe(true);
    expect(getMemoryObject({ id: summary.id })?.id).toBe(summary.id);
  });
});
