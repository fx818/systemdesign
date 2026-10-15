import type { LevelDef } from '@/types/content';

/** Catalog data only: never import a scene, quiz or simulator from a meta file. */
export type LevelMeta = Pick<LevelDef,
  'id' | 'chapter' | 'number' | 'title' | 'subtitle' | 'users' | 'pages' | 'badge' | 'boss'
> & { lesson: { duration: number; sectionCount: number } };

export const chapterOf = (level: { chapter?: number }) => level.chapter ?? 1;
export const compareLevels = (a: LevelMeta, b: LevelMeta) => chapterOf(a) - chapterOf(b) || a.number - b.number;

/** Used by the metadata generator and drift validator. */
export function toLevelMeta(level: LevelDef): LevelMeta {
  return {
    id: level.id,
    chapter: chapterOf(level),
    number: level.number,
    title: level.title,
    subtitle: level.subtitle,
    users: level.users,
    pages: level.pages,
    badge: level.badge,
    boss: level.boss ?? false,
    lesson: { duration: level.lesson.duration, sectionCount: level.lesson.chapters.length },
  };
}
