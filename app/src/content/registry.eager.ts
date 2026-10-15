import type { LevelDef } from '@/types/content';
import { chapterOf } from './metadata';

/** Test/validator/generator access ONLY. Application code must use registry.ts. */
const modules = import.meta.glob<{ default: LevelDef }>('./ch*/*/index.ts', { eager: true });
export const levels = Object.values(modules).map(module => module.default)
  .sort((a, b) => chapterOf(a) - chapterOf(b) || a.number - b.number);
export const levelsInChapter = (chapter: number) => levels.filter(level => chapterOf(level) === chapter);
export const getLevel = (id: string) => levels.find(level => level.id === id);
