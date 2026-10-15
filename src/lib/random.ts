/** Small deterministic PRNG (mulberry32) for generative plates and seeds. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Identifier for records created on this device: prefix + time + randomness. */
export function newId(prefix: string): string {
  const time = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1679616)
    .toString(36)
    .padStart(4, '0');
  return `${prefix}-${time}${rand}`;
}
