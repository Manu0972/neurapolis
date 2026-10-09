/**
 * Deterministic Pseudo-Random Number Generator (PRNG) Module.
 * Implements a 32-bit Mulberry32 generator seeded via string hash or integer.
 * Guarantees 100% reproducible procedural generations across runs.
 */

export class DeterministicPRNG {
  private state: number;
  public readonly seedString: string;

  constructor(seed: string | number = 'character-designer-seed-default') {
    this.seedString = typeof seed === 'number' ? seed.toString() : seed;
    this.state = typeof seed === 'number' ? seed >>> 0 : DeterministicPRNG.hashString(seed);
    if (this.state === 0) {
      this.state = 0x6d2b79f5;
    }
  }

  /**
   * Hashes an arbitrary string into a 32-bit unsigned integer using FNV-1a.
   */
  public static hashString(str: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /**
   * Returns a deterministic float in range [0, 1).
   * Mulberry32 algorithm.
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a float in range [min, max].
   */
  public floatInRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Returns an integer in range [min, max] inclusive.
   */
  public intInRange(min: number, max: number): number {
    return Math.floor(this.floatInRange(min, max + 1));
  }

  /**
   * Picks a random item from an array.
   */
  public pick<T>(arr: readonly T[] | T[]): T {
    if (arr.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }

  /**
   * Picks multiple unique items from an array.
   */
  public pickMultiple<T>(arr: readonly T[] | T[], count: number): T[] {
    const copy = [...arr];
    const result: T[] = [];
    const n = Math.min(count, copy.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(this.next() * copy.length);
      result.push(copy[idx]);
      copy.splice(idx, 1);
    }
    return result;
  }

  /**
   * Returns true with given probability [0, 1].
   */
  public booleanWithProbability(prob: number): boolean {
    return this.next() < prob;
  }
}
