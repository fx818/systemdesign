/** XP ranks (thresholds from the game design). Pure helpers — unit tested. */

export interface Rank {
  name: string;
  minXp: number;
}

export const RANKS: readonly Rank[] = [
  { name: 'Intern', minXp: 0 },
  { name: 'Junior', minXp: 300 },
  { name: 'Engineer', minXp: 900 },
  { name: 'Senior', minXp: 1800 },
  { name: 'Staff', minXp: 3000 },
  { name: 'Principal', minXp: 4500 },
] as const;

/** Highest rank whose threshold is <= xp. */
export function rankForXp(xp: number): Rank {
  let current: Rank = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXp) current = rank;
    else break;
  }
  return current;
}

export interface RankProgress {
  rank: Rank;
  /** Next rank, or null when maxed out. */
  next: Rank | null;
  /** 0..1 progress from current rank towards the next one (1 when maxed). */
  ratio: number;
}

export function rankProgress(xp: number): RankProgress {
  const rank = rankForXp(xp);
  const idx = RANKS.findIndex((r) => r.name === rank.name);
  const next = idx >= 0 && idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  if (!next) return { rank, next: null, ratio: 1 };
  const span = next.minXp - rank.minXp;
  const ratio = span <= 0 ? 1 : Math.min(1, Math.max(0, (xp - rank.minXp) / span));
  return { rank, next, ratio };
}
