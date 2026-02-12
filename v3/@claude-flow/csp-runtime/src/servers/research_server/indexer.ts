import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtimePaths } from '../../persistence/paths.js';

export interface IndexedArtifact {
  artifact_id: string;
  title: string;
  source_ref: string;
  snippet: string;
}

export interface KeywordIndexStore {
  schema_version: string;
  updated_at: string;
  artifacts: Record<string, IndexedArtifact>;
  inverted: Record<string, Record<string, number>>;
}

export interface SearchResult {
  artifact_id: string;
  score: number;
  title: string;
  source_ref: string;
  snippet: string;
}

const INDEX_FILE = join(runtimePaths.artifactsResearch, 'keyword-index.json');
const INDEX_VERSION = '1.0.0';

function normalizeTerm(term: string): string {
  return term.trim().toLowerCase();
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/g)
    .filter((token) => token.length >= 2);
}

export function loadKeywordIndex(): KeywordIndexStore {
  if (!existsSync(INDEX_FILE)) {
    return {
      schema_version: INDEX_VERSION,
      updated_at: new Date().toISOString(),
      artifacts: {},
      inverted: {}
    };
  }
  return JSON.parse(readFileSync(INDEX_FILE, 'utf-8')) as KeywordIndexStore;
}

export function saveKeywordIndex(index: KeywordIndexStore): void {
  index.updated_at = new Date().toISOString();
  writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
}

export function indexArtifact(
  index: KeywordIndexStore,
  artifact: IndexedArtifact,
  content: string
): KeywordIndexStore {
  index.artifacts[artifact.artifact_id] = artifact;
  const termCounts = new Map<string, number>();
  for (const token of tokenize(content)) {
    termCounts.set(token, (termCounts.get(token) || 0) + 1);
  }

  for (const [term, count] of termCounts) {
    const normalized = normalizeTerm(term);
    if (!index.inverted[normalized]) {
      index.inverted[normalized] = {};
    }
    index.inverted[normalized][artifact.artifact_id] = count;
  }

  return index;
}

export function searchKeywordIndex(index: KeywordIndexStore, query: string, limit = 5): SearchResult[] {
  const scores = new Map<string, number>();
  const terms = tokenize(query).map(normalizeTerm);

  for (const term of terms) {
    const postings = index.inverted[term];
    if (!postings) continue;
    for (const [artifactId, count] of Object.entries(postings)) {
      scores.set(artifactId, (scores.get(artifactId) || 0) + count);
    }
  }

  const ranked = Array.from(scores.entries())
    .map(([artifactId, score]) => {
      const artifact = index.artifacts[artifactId];
      return artifact
        ? {
            artifact_id: artifactId,
            score,
            title: artifact.title,
            source_ref: artifact.source_ref,
            snippet: artifact.snippet
          }
        : undefined;
    })
    .filter((item): item is SearchResult => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 50)));

  return ranked;
}
