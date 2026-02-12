import { RuntimeProvenance, RuntimeScope } from '../../types.js';

export type MemoryStoreType =
  | 'ToolShape'
  | 'PlanMemory'
  | 'ConstraintMemory'
  | 'RunMemory'
  | 'EvidenceBundle';

export interface MemoryRecord<T = unknown> {
  id: string;
  store_type: MemoryStoreType;
  scope: RuntimeScope;
  schema_version: string;
  created_at: string;
  updated_at: string;
  provenance: RuntimeProvenance;
  payload: T;
  tags?: string[];
}

export interface MemoryLinkRecord {
  id: string;
  source_id: string;
  target_id: string;
  relation: string;
  schema_version: string;
  created_at: string;
  updated_at: string;
  provenance: RuntimeProvenance;
  metadata?: Record<string, unknown>;
}

export interface MemorySearchInput {
  query?: string;
  store_type?: MemoryStoreType;
  scope?: RuntimeScope;
  limit?: number;
}

export interface MemoryConsolidationInput {
  scope?: RuntimeScope;
  store_types?: MemoryStoreType[];
  limit?: number;
  summary_type?: MemoryStoreType;
  provenance: RuntimeProvenance;
}
