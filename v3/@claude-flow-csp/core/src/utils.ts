import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

export async function ensureDir(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}

export function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export async function writeJsonFile(
  path: string,
  data: unknown,
  options: { stable?: boolean; pretty?: boolean } = {}
): Promise<void> {
  await ensureDir(dirname(path));
  const { stable = false, pretty = true } = options;
  const content = stable
    ? stableStringify(data)
    : JSON.stringify(data, null, pretty ? 2 : undefined);
  await fs.writeFile(path, content, 'utf8');
}

export async function readJsonFile<T>(path: string): Promise<T> {
  const content = await fs.readFile(path, 'utf8');
  return JSON.parse(content) as T;
}

export function clamp(value: number, min = 0, max = 1): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function toInt(value: unknown, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(num)) {
    return Math.trunc(num);
  }
  return fallback;
}

export function toOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(num)) return Math.trunc(num);
  return undefined;
}

export function toOptionalFloat(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(num)) return num;
  return undefined;
}

export function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return fallback;
}
