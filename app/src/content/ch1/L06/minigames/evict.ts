import { CACHE_SLOTS, type Policy } from '../data';

export interface Slot { key: string; enteredAt: number; lastUsed: number; uses: number }
export interface Step {
  index: number;
  key: string;
  hit: boolean;
  /** Cache contents before this access. */
  before: Slot[];
  /** Key evicted to make room (null if none). */
  victim: string | null;
  after: Slot[];
}

/** Which key the policy evicts from a full cache. */
export function pickVictim(slots: Slot[], policy: Policy): string {
  const sorted = [...slots].sort((a, b) => {
    if (policy === 'FIFO') return a.enteredAt - b.enteredAt;
    if (policy === 'LFU') return a.uses - b.uses || a.lastUsed - b.lastUsed;
    return a.lastUsed - b.lastUsed;
  });
  return sorted[0].key;
}

/** Replays an access stream through a cache with the given policy. */
export function playStream(stream: string[], policy: Policy, size = CACHE_SLOTS): Step[] {
  let slots: Slot[] = [];
  return stream.map((key, index) => {
    const before = slots.map((s) => ({ ...s }));
    const found = slots.find((s) => s.key === key);
    let victim: string | null = null;
    if (found) {
      slots = slots.map((s) => (s.key === key ? { ...s, lastUsed: index, uses: s.uses + 1 } : s));
    } else {
      if (slots.length >= size) {
        victim = pickVictim(slots, policy);
        // the newcomer takes the victim's place so the slot layout stays stable
        slots = slots.map((s) => (s.key === victim ? { key, enteredAt: index, lastUsed: index, uses: 1 } : s));
      } else slots = [...slots, { key, enteredAt: index, lastUsed: index, uses: 1 }];
    }
    return { index, key, hit: Boolean(found), before, victim, after: slots.map((s) => ({ ...s })) };
  });
}
