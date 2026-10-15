import type { LevelDef } from '@/types/content';

/** Auto-discovers every level folder: src/content/ch<N>/<ID>/index.ts must `export default` a LevelDef.
 *  Agents never edit this file — adding a folder is enough. */
const mods = import.meta.glob<{ default: LevelDef }>('./ch*/*/index.ts', { eager: true });

export const chapterOf = (l: LevelDef) => l.chapter ?? 1;

export const levels: LevelDef[] = Object.values(mods)
  .map((m) => m.default)
  .sort((a, b) => chapterOf(a) - chapterOf(b) || a.number - b.number);

export const levelsInChapter = (chapter: number) => levels.filter((l) => chapterOf(l) === chapter);

export const getLevel = (id: string) => levels.find((l) => l.id === id);
