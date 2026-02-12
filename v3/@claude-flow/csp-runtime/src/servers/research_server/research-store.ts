import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RuntimeProvenance } from '../../types.js';
import { putMemoryObject } from '../../persistence/memory/memory-store.js';
import { ensureRuntimeDirectories, runtimePaths } from '../../persistence/paths.js';
import { logRuntimeEvent, makeEvent } from '../../persistence/run_events/logger.js';
import { extractArtifactFromLocalFile, extractArtifactFromUrl, extractArtifactsFromRepo, ExtractedArtifact, researchArtifactPath } from './extractors.js';
import { indexArtifact, loadKeywordIndex, saveKeywordIndex, searchKeywordIndex, SearchResult } from './indexer.js';

const RESEARCH_SCHEMA_VERSION = '1.0.0';

export interface StoredResearchArtifact extends ExtractedArtifact {
  artifact_id: string;
  schema_version: string;
  created_at: string;
  provenance: RuntimeProvenance;
}

function ensureResearchDirs(): void {
  ensureRuntimeDirectories();
  mkdirSync(runtimePaths.artifactsResearch, { recursive: true });
  mkdirSync(runtimePaths.artifactsEvidence, { recursive: true });
}

function persistArtifact(extracted: ExtractedArtifact, provenance: RuntimeProvenance): StoredResearchArtifact {
  ensureResearchDirs();
  const artifactId = `art-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const artifact: StoredResearchArtifact = {
    artifact_id: artifactId,
    schema_version: RESEARCH_SCHEMA_VERSION,
    created_at: new Date().toISOString(),
    provenance,
    ...extracted
  };
  writeFileSync(researchArtifactPath(artifactId), JSON.stringify(artifact, null, 2), 'utf-8');

  const index = loadKeywordIndex();
  indexArtifact(index, {
    artifact_id: artifact.artifact_id,
    title: artifact.title,
    source_ref: artifact.source_ref,
    snippet: artifact.snippets[0] || artifact.content.slice(0, 240)
  }, artifact.content);
  saveKeywordIndex(index);

  logRuntimeEvent(makeEvent('research', 'research.artifact_stored', {
    artifact_id: artifactId,
    source_type: artifact.source_type,
    source_ref: artifact.source_ref
  }));

  return artifact;
}

export function ingestRepo(repoPath: string, provenance: RuntimeProvenance): {
  ingested_count: number;
  artifact_ids: string[];
} {
  const artifacts = extractArtifactsFromRepo(repoPath);
  const stored = artifacts.map((artifact) => persistArtifact(artifact, provenance));
  return {
    ingested_count: stored.length,
    artifact_ids: stored.map((a) => a.artifact_id)
  };
}

export async function ingestFile(params: {
  path?: string;
  url?: string;
  provenance: RuntimeProvenance;
}): Promise<StoredResearchArtifact> {
  if (params.path) {
    const extracted = extractArtifactFromLocalFile(params.path);
    return persistArtifact(extracted, params.provenance);
  }
  if (params.url) {
    const extracted = await extractArtifactFromUrl(params.url);
    return persistArtifact(extracted, params.provenance);
  }
  throw new Error('ingest_file requires either path or url');
}

export function searchResearch(query: string, limit = 5): SearchResult[] {
  ensureResearchDirs();
  const index = loadKeywordIndex();
  return searchKeywordIndex(index, query, limit);
}

export function openArtifact(artifactId: string): StoredResearchArtifact {
  const path = researchArtifactPath(artifactId);
  if (!existsSync(path)) {
    throw new Error(`Artifact not found: ${artifactId}`);
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as StoredResearchArtifact;
}

export function citeBundle(params: {
  artifact_ids: string[];
  query?: string;
  provenance: RuntimeProvenance;
}): {
  bundle_id: string;
  schema_version: string;
  created_at: string;
  query?: string;
  references: Array<{
    artifact_id: string;
    source_ref: string;
    hash: string;
    snippet: string;
  }>;
  path: string;
} {
  ensureResearchDirs();
  const references = params.artifact_ids.map((id) => {
    const artifact = openArtifact(id);
    return {
      artifact_id: id,
      source_ref: artifact.source_ref,
      hash: createHash('sha256').update(artifact.content, 'utf-8').digest('hex'),
      snippet: artifact.snippets[0] || artifact.content.slice(0, 220)
    };
  });

  const bundleId = `bundle-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const bundle = {
    bundle_id: bundleId,
    schema_version: RESEARCH_SCHEMA_VERSION,
    created_at: new Date().toISOString(),
    query: params.query,
    references
  };
  const bundlePath = join(runtimePaths.artifactsEvidence, `${bundleId}.json`);
  writeFileSync(bundlePath, JSON.stringify(bundle, null, 2), 'utf-8');

  putMemoryObject({
    store_type: 'EvidenceBundle',
    scope: {},
    payload: bundle,
    provenance: params.provenance,
    tags: ['research', 'evidence']
  });

  logRuntimeEvent(makeEvent('research', 'research.cite_bundle', {
    bundle_id: bundleId,
    reference_count: references.length
  }));

  return {
    ...bundle,
    path: bundlePath
  };
}
