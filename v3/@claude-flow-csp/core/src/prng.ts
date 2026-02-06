function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 1;
  const normalized = Math.trunc(seed) >>> 0;
  return normalized === 0 ? 1 : normalized;
}

function hashStringToSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return normalizeSeed(hash >>> 0);
}

export class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = normalizeSeed(seed);
  }

  next(): number {
    // Mulberry32
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    this.state = t >>> 0;
    return result;
  }

  nextFloat(min = 0, max = 1): number {
    return min + (max - min) * this.next();
  }

  nextInt(min: number, max: number): number {
    const lower = Math.min(min, max);
    const upper = Math.max(min, max);
    return Math.floor(this.nextFloat(lower, upper + 1));
  }

  nextHex(length = 8): string {
    let out = '';
    for (let i = 0; i < length; i++) {
      out += this.nextInt(0, 15).toString(16);
    }
    return out;
  }

  fork(salt: string | number): SeededRng {
    const saltSeed = typeof salt === 'number' ? normalizeSeed(salt) : hashStringToSeed(String(salt));
    return new SeededRng(this.state ^ saltSeed);
  }
}

export function createSeededRng(seed: number): SeededRng {
  return new SeededRng(seed);
}

export function seedFromString(value: string): number {
  return hashStringToSeed(value);
}
