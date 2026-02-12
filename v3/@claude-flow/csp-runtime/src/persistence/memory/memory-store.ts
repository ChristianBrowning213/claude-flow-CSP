import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ensureRuntimeDirectories, runtimePaths } from '../paths.js';
import {
  MemoryConsolidationInput,
  MemoryLinkRecord,
  MemoryRecord,
  MemorySearchInput,
  MemoryStoreType
} from './types.js';
import { logRuntimeEvent, makeEvent } from '../run_events/logger.js';
import { RuntimeProvenance, RuntimeScope } from '../../types.js';

const MEMORY_SCHEMA_VERSION = '1.0.0';

function objectTypeDir(storeType: MemoryStoreType): string {
  return join(runtimePaths.memoryObjects, storeType);
}

function objectPath(storeType: MemoryStoreType, id: string): string {
  return join(objectTypeDir(storeType), `${id}.json`);
}

function linkPath(id: string): string {
  return join(runtimePaths.memoryLinks, `${id}.json`);
}

function ensureMemoryStoreDirs(): void {
  ensureRuntimeDirectories();
  for (const storeType of ['ToolShape', 'PlanMemory', 'ConstraintMemory', 'RunMemory', 'EvidenceBundle'] as MemoryStoreType[]) {
    mkdirSync(objectTypeDir(storeType), { recursive: true });
  }
  mkdirSync(runtimePaths.memoryLinks, { recursive: true });
}

function scopeMatches(filter: RuntimeScope | undefined, candidate: RuntimeScope): boolean {
  if (!filter) return true;
  if (filter.project && filter.project !== candidate.project) return false;
  if (filter.repo && filter.repo !== candidate.repo) return false;
  if (filter.run_id && filter.run_id !== candidate.run_id) return false;
  if (filter.experiment_id && filter.experiment_id !== candidate.experiment_id) return false;
  return true;
}

function queryMatches(query: string | undefined, record: MemoryRecord): boolean {
  if (!query || query.trim().length === 0) return true;
  const lowerQuery = query.toLowerCase();
  const haystack = JSON.stringify(record).toLowerCase();
  return haystack.includes(lowerQuery);
}

function listAllObjects(storeType?: MemoryStoreType): MemoryRecord[] {
  ensureMemoryStoreDirs();
  const types = storeType
    ? [storeType]
    : (['ToolShape', 'PlanMemory', 'ConstraintMemory', 'RunMemory', 'EvidenceBundle'] as MemoryStoreType[]);

  const out: MemoryRecord[] = [];
  for (const type of types) {
    const dir = objectTypeDir(type);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const raw = readFileSync(join(dir, file), 'utf-8');
      out.push(JSON.parse(raw) as MemoryRecord);
    }
  }
  out.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return out;
}

export function putMemoryObject<T>(params: {
  id?: string;
  store_type: MemoryStoreType;
  scope: RuntimeScope;
  payload: T;
  provenance: RuntimeProvenance;
  tags?: string[];
  schema_version?: string;
}): MemoryRecord<T> {
  ensureMemoryStoreDirs();
  const id = params.id || `mem-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const path = objectPath(params.store_type, id);
  const existing = existsSync(path)
    ? JSON.parse(readFileSync(path, 'utf-8')) as MemoryRecord<T>
    : undefined;

  const record: MemoryRecord<T> = {
    id,
    store_type: params.store_type,
    scope: params.scope,
    schema_version: params.schema_version || existing?.schema_version || MEMORY_SCHEMA_VERSION,
    created_at: existing?.created_at || now,
    updated_at: now,
    provenance: params.provenance,
    payload: params.payload,
    tags: params.tags
  };
  writeFileSync(path, JSON.stringify(record, null, 2), 'utf-8');

  logRuntimeEvent(makeEvent('memory', 'memory.put', {
    id: record.id,
    store_type: record.store_type,
    scope: record.scope
  }));

  return record;
}

export function getMemoryObject(params: { id: string; store_type?: MemoryStoreType }): MemoryRecord | null {
  ensureMemoryStoreDirs();
  if (params.store_type) {
    const path = objectPath(params.store_type, params.id);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8')) as MemoryRecord;
  }

  for (const storeType of ['ToolShape', 'PlanMemory', 'ConstraintMemory', 'RunMemory', 'EvidenceBundle'] as MemoryStoreType[]) {
    const path = objectPath(storeType, params.id);
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, 'utf-8')) as MemoryRecord;
    }
  }
  return null;
}

export function searchMemoryObjects(input: MemorySearchInput): MemoryRecord[] {
  const limit = Math.max(1, Math.min(200, input.limit || 20));
  return listAllObjects(input.store_type)
    .filter((record) => scopeMatches(input.scope, record.scope))
    .filter((record) => queryMatches(input.query, record))
    .slice(0, limit);
}

export function linkMemoryObjects(params: {
  source_id: string;
  target_id: string;
  relation: string;
  provenance: RuntimeProvenance;
  metadata?: Record<string, unknown>;
  id?: string;
}): MemoryLinkRecord {
  ensureMemoryStoreDirs();
  if (!getMemoryObject({ id: params.source_id })) {
    throw new Error(`source_id not found: ${params.source_id}`);
  }
  if (!getMemoryObject({ id: params.target_id })) {
    throw new Error(`target_id not found: ${params.target_id}`);
  }

  const now = new Date().toISOString();
  const id = params.id || `link-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const record: MemoryLinkRecord = {
    id,
    source_id: params.source_id,
    target_id: params.target_id,
    relation: params.relation,
    schema_version: MEMORY_SCHEMA_VERSION,
    created_at: now,
    updated_at: now,
    provenance: params.provenance,
    metadata: params.metadata
  };
  writeFileSync(linkPath(id), JSON.stringify(record, null, 2), 'utf-8');

  logRuntimeEvent(makeEvent('memory', 'memory.link', {
    id: record.id,
    source_id: record.source_id,
    target_id: record.target_id,
    relation: record.relation
  }));

  return record;
}

export function consolidateMemory(input: MemoryConsolidationInput): MemoryRecord {
  const candidates = listAllObjects()
    .filter((r) => scopeMatches(input.scope, r.scope))
    .filter((r) => !input.store_types || input.store_types.includes(r.store_type))
    .slice(0, Math.max(1, Math.min(input.limit || 100, 500)));

  const counts = candidates.reduce<Record<string, number>>((acc, item) => {
    acc[item.store_type] = (acc[item.store_type] || 0) + 1;
    return acc;
  }, {});

  const summaryPayload = {
    summary_kind: 'episodic_to_semantic',
    source_count: candidates.length,
    counts_by_type: counts,
    source_ids: candidates.map((c) => c.id),
    latest_update: candidates[0]?.updated_at ?? null
  };

  const summary = putMemoryObject({
    store_type: input.summary_type || 'RunMemory',
    scope: input.scope || {},
    payload: summaryPayload,
    provenance: input.provenance,
    tags: ['consolidated', 'semantic-summary']
  });

  logRuntimeEvent(makeEvent('memory', 'memory.consolidate', {
    summary_id: summary.id,
    source_count: candidates.length
  }));

  return summary;
}
