import { useEffect, useSyncExternalStore } from 'react';
import type { LevelDef } from '@/types/content';
import { chapterOf, compareLevels, type LevelMeta } from './metadata';

export { chapterOf } from './metadata';
export type { LevelMeta } from './metadata';

/** Only tiny, generated metadata modules participate in the startup bundle. */
const metas = import.meta.glob<{ default: LevelMeta }>('./ch*/*/meta.ts', { eager: true });
const modules = import.meta.glob<{ default: LevelDef }>('./ch*/*/index.ts');
export const levelMetas = Object.values(metas).map(module => module.default).sort(compareLevels);
export const levelsInChapter = (chapter: number) => levelMetas.filter(level => chapterOf(level) === chapter);
export const getLevelMeta = (id: string) => levelMetas.find(level => level.id === id);

export interface LevelState {
  level?: LevelDef;
  loading: boolean;
  error?: Error;
}
const pending: LevelState = { loading: true };
const missing: LevelState = { loading: false };
const states = new Map<string, LevelState>();
const requests = new Map<string, Promise<LevelDef>>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

/** Deduplicates requests and caches success. Clear failed requests; browser recovery
 * reloads the page because browsers can retain rejected module imports. */
export function loadLevel(id: string): Promise<LevelDef> {
  const cached = states.get(id)?.level;
  if (cached) return Promise.resolve(cached);
  const request = requests.get(id);
  if (request) return request;
  const meta = getLevelMeta(id);
  const loader = meta && modules[`./ch${chapterOf(meta)}/${id}/index.ts`];
  if (!loader) return Promise.reject(new Error(`Unknown level: ${id}`));
  states.set(id, pending);
  const next = loader().then(module => {
    const level = module.default;
    states.set(id, { level, loading: false });
    requests.delete(id);
    notify();
    return level;
  }).catch((reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error('Could not download this level.');
    states.set(id, { loading: false, error });
    requests.delete(id);
    notify();
    throw error;
  });
  requests.set(id, next);
  notify();
  return next;
}

/** `enabled` lets route gates enforce unlocks before fetching any level content. */
export function useLevel(id: string | undefined, enabled = true): LevelState {
  const valid = enabled && id !== undefined && getLevelMeta(id) !== undefined;
  const snapshot = () => valid ? (states.get(id) ?? pending) : missing;
  const state = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => {
    if (valid) void loadLevel(id).catch(() => { /* Exposed in the snapshot for retry UI. */ });
  }, [id, valid]);
  return state;
}
