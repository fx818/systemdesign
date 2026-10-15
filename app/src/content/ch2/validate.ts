import type { LevelDef } from '@/types/content';
import { validateLevel } from '../ch1/validate';

export const CH2_PAGES: [number, number] = [34, 41];

/** ch1's validator with chapter-2 id and page rules (ch1 hard-codes L01-style ids and pages 5-33). */
export function validateCh2Level(level: LevelDef): string[] {
  const L = level.id;
  const errs = validateLevel(level).filter(
    (e) => !e.startsWith(`${L}: id must look like`) && !e.startsWith(`${L}: number ${level.number} does not match`) && !e.startsWith(`${L}: pages `),
  );
  if (!/^C2L\d\d$/.test(L)) errs.push(`${L}: id must look like C2L01`);
  if (Number(L.slice(3)) !== level.number) errs.push(`${L}: number ${level.number} does not match id`);
  if (level.chapter !== 2) errs.push(`${L}: chapter must be 2`);
  const [p0, p1] = level.pages;
  if (p0 > p1 || p0 < CH2_PAGES[0] || p1 > CH2_PAGES[1]) errs.push(`${L}: pages ${p0}-${p1} invalid`);
  return errs;
}
