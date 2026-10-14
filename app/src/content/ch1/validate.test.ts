import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LevelDef } from '@/types/content';
import { validateLevel } from './validate';

const mods = import.meta.glob<{ default: LevelDef }>('./L*/index.ts', { eager: true });
const levels = Object.entries(mods).map(([path, m]) => ({ path, level: m.default }));

const renderAt = (level: LevelDef, time: number, interactive = false) =>
  renderToStaticMarkup(createElement(level.lesson.Scene, { time, width: 1280, height: 720, interactive, onHotspot: () => {} }));

describe('ch1 levels', () => {
  it('found at least one level', () => {
    expect(levels.length).toBeGreaterThan(0);
  });

  describe.each(levels)('$path', ({ path, level }) => {
    it('folder name matches level id', () => {
      expect(path).toContain(`/${level.id}/`);
    });

    it('is structurally valid', () => {
      expect(validateLevel(level)).toEqual([]);
    });

    it('scene renders deterministically and without NaN', () => {
      const d = level.lesson.duration;
      for (const t of [0, 0.5, d * 0.25, d * 0.5 + 0.123, d * 0.75, d - 0.01, d]) {
        const a = renderAt(level, t);
        expect(renderAt(level, t)).toBe(a);
        expect(a).not.toMatch(/NaN|Infinity|undefined/);
      }
    });

    it('every lesson hotspot is reachable in the scene, and the scene shows no unknown hotspots', () => {
      const declared = new Set(level.lesson.hotspots.map((h) => h.id));
      const seen = new Set<string>();
      for (let t = 0; t <= level.lesson.duration; t += 1) {
        for (const m of renderAt(level, t, true).matchAll(/data-hotspot="([^"]+)"/g)) seen.add(m[1]);
      }
      expect([...seen].filter((id) => !declared.has(id))).toEqual([]);
      expect([...declared].filter((id) => !seen.has(id))).toEqual([]);
    });

    it('video mode (interactive=false) renders no hotspot UI', () => {
      for (let t = 0; t <= level.lesson.duration; t += 5) expect(renderAt(level, t, false)).not.toContain('data-hotspot');
    });
  });
});

/** Extra bar for the two showcase levels (task Claude-kit). */
describe.each(levels.filter((l) => ['L01', 'L02'].includes(l.level.id)))('showcase $level.id', ({ level }) => {
  it('meets the showcase content bar', () => {
    const ls = level.lesson;
    expect(ls.duration).toBeGreaterThanOrEqual(120);
    expect(ls.duration).toBeLessThanOrEqual(200);
    expect(ls.hotspots.length).toBeGreaterThanOrEqual(3);
    expect(ls.hotspots.length).toBeLessThanOrEqual(5);
    expect(ls.checkpoints).toHaveLength(2);
    // captions every 3-6 s with no holes
    ls.captions.forEach((c, i) => {
      expect(c.end - c.start).toBeLessThanOrEqual(7);
      if (i) expect(c.start - ls.captions[i - 1].end).toBeLessThanOrEqual(0.5);
    });
    expect(ls.captions[0].start).toBe(0);
    expect(ls.captions[ls.captions.length - 1].end).toBe(ls.duration);
    expect(level.incident.length).toBeGreaterThanOrEqual(6);
    expect(level.incident.length).toBeLessThanOrEqual(10);
    expect(level.debrief.length).toBeGreaterThanOrEqual(6);
    expect(level.debrief.length).toBeLessThanOrEqual(10);
    expect(level.quiz).toHaveLength(8);
    const kinds = new Set(level.quiz.map((q) => q.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(5);
    for (const k of ['order', 'bins', 'spot'] as const) expect(kinds.has(k)).toBe(true);
    expect(level.cards.length).toBeGreaterThanOrEqual(4);
    expect(level.mission.hints).toHaveLength(3);
    expect(level.miniGames.length).toBeGreaterThanOrEqual(1);
  });
});
