export class RuntimeProbe {
  constructor(private readonly value: number) {}

  compute(): number {
    return this.value * 2;
  }
}

export function searchTargetSymbol(input: string): string {
  return input.toUpperCase();
}
