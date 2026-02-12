import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { runtimePaths } from '../src/persistence/paths.js';
import { citeBundle, ingestRepo, searchResearch } from '../src/servers/research_server/research-store.js';

describe('research server', () => {
  beforeEach(() => {
    rmSync(runtimePaths.root, { recursive: true, force: true });
  });

  it('ingests fixture repo and finds expected snippet', () => {
    const fixtureRepo = join(process.cwd(), '__tests__', 'fixtures', 'research_repo');
    const ingestion = ingestRepo(fixtureRepo, { source: 'test.research' });
    expect(ingestion.ingested_count).toBeGreaterThan(0);

    const results = searchResearch('searchTargetSymbol', 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source_ref).toContain('sample.ts');
  });

  it('builds cite bundle with stable hashes and references', () => {
    const fixtureRepo = join(process.cwd(), '__tests__', 'fixtures', 'research_repo');
    const ingestion = ingestRepo(fixtureRepo, { source: 'test.research' });

    const bundle = citeBundle({
      artifact_ids: ingestion.artifact_ids.slice(0, 2),
      query: 'RuntimeProbe',
      provenance: { source: 'test.research' }
    });

    expect(bundle.references.length).toBeGreaterThan(0);
    expect(bundle.references[0].hash.length).toBe(64);
  });
});
