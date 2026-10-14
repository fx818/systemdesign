import type { LevelDef } from '@/types/content';

/** Auto-discovers every level folder: src/content/ch1/LXX/index.ts must `export default` a LevelDef.
 *  Agents never edit this file — adding a folder is enough. */
const mods = import.meta.glob<{ default: LevelDef }>('./ch1/L*/index.ts', { eager: true });

export const levels: LevelDef[] = Object.values(mods)
  .map((m) => m.default)
  .sort((a, b) => a.number - b.number);

export const getLevel = (id: string) => levels.find((l) => l.id === id);
