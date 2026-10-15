/**
 * Deterministic pseudo-random helpers. The `order` question shuffles its items
 * "deterministically by question id" so every player sees the same scramble and
 * re-renders never reshuffle. No Math.random anywhere.
 */

/** FNV-1a 32-bit hash of a string -> uint32. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // h *= 16777619 (FNV prime), kept in 32 bits.
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG: tiny, fast, deterministic. Returns () => float in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isIdentity = (arr: number[]) => arr.every((v, i) => v === i);

/**
 * Fisher-Yates shuffle of indices [0..n) seeded by `seedId` (e.g. question id).
 * When n > 1 the result is guaranteed NOT to be the identity permutation, so a
 * shuffled "put in order" list never starts already solved.
 */
export function shuffledIndices(length: number, seedId: string): number[] {
  const base = hashString(seedId);
  const out = Array.from({ length }, (_, i) => i);
  if (length <= 1) return out;
  // A few deterministic attempts; virtually always done on the first pass.
  for (let attempt = 0; attempt < 8; attempt++) {
    const rand = mulberry32(base + attempt * 0x9e3779b9);
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (!isIdentity(out)) return out;
    // Extremely unlikely: reset to identity and try the next seed.
    for (let i = 0; i < out.length; i++) out[i] = i;
  }
  // Deterministic fallback that is never the identity: rotate by one.
  return out.map((_, i) => (i + 1) % out.length);
}

/** Shuffle a copy of `items` using shuffledIndices seeded by `seedId`. */
export function seededShuffle<T>(items: readonly T[], seedId: string): T[] {
  return shuffledIndices(items.length, seedId).map((i) => items[i]);
}
