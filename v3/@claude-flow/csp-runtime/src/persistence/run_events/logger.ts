import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureRuntimeDirectories, runtimePaths } from '../paths.js';

export interface RuntimeRunEvent {
  event_type: string;
  timestamp: string;
  subsystem: 'workspace' | 'memory' | 'research';
  payload: Record<string, unknown>;
}

export function logRuntimeEvent(event: RuntimeRunEvent): void {
  ensureRuntimeDirectories();
  const line = JSON.stringify(event);
  const outFile = join(runtimePaths.runEvents, 'events.jsonl');
  appendFileSync(outFile, `${line}\n`, 'utf-8');
}

export function makeEvent(
  subsystem: RuntimeRunEvent['subsystem'],
  eventType: string,
  payload: Record<string, unknown>
): RuntimeRunEvent {
  return {
    event_type: eventType,
    timestamp: new Date().toISOString(),
    subsystem,
    payload
  };
}
