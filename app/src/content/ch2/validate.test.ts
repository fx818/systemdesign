import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LevelDef } from '@/types/content';
import { validateCh2Level } from './validate';

const mods = import.meta.glob<{ default: LevelDef }>('./C2L*/index.ts', { eager: true });
const levels = Object.entries(mods).map(([path, m]) => ({ path, level: m.default }));

const renderAt = (level: LevelDef, time: number, interactive = false) =>
  renderToStaticMarkup(createElement(level.lesson.Scene, { time, width: 1280, height: 720, interactive, onHotspot: () => {} }));

describe('ch2 levels', () => {
  it('has the four chapter-2 levels', () => {
    expect(levels.map((l) => l.level.id).sort()).toEqual(['C2L01', 'C2L02', 'C2L03', 'C2L04']);
    expect(levels.map((l) => l.level.number).sort()).toEqual([1, 2, 3, 4]);
  });

  describe.each(levels)('$path', ({ path, level }) => {
    it('folder name matches level id', () => expect(path).toContain(`/${level.id}/`));

    it('is structurally valid', () => expect(validateCh2Level(level)).toEqual([]));

    it('meets the content bar', () => {
      const ls = level.lesson;
      expect(ls.duration).toBeGreaterThanOrEqual(120);
      expect(ls.duration).toBeLessThanOrEqual(180);
      expect(ls.hotspots.length).toBeGreaterThanOrEqual(3);
      expect(ls.hotspots.length).toBeLessThanOrEqual(5);
      expect(ls.checkpoints).toHaveLength(2);
      ls.captions.forEach((c, i) => {
        expect(c.end - c.start).toBeGreaterThanOrEqual(3);
        expect(c.end - c.start).toBeLessThanOrEqual(7);
        if (i) expect(c.start).toBe(ls.captions[i - 1].end);
      });
      expect(ls.captions[0].start).toBe(0);
      expect(ls.captions[ls.captions.length - 1].end).toBe(ls.duration);
      for (const d of [level.incident, level.debrief]) {
        expect(d.length).toBeGreaterThanOrEqual(5);
        expect(d.length).toBeLessThanOrEqual(10);
      }
      expect(level.quiz.length).toBeGreaterThanOrEqual(6);
      expect(level.quiz.length).toBeLessThanOrEqual(8);
      expect(level.quiz.some((q) => q.kind === 'numeric')).toBe(true);
      expect(new Set(level.quiz.map((q) => q.kind)).size).toBeGreaterThanOrEqual(3);
      expect(level.cards.length).toBeGreaterThanOrEqual(4);
      expect(level.cards.length).toBeLessThanOrEqual(5);
      expect(level.miniGames.length).toBeGreaterThanOrEqual(1);
      expect(level.mission.hints.length).toBeGreaterThanOrEqual(2);
    });

    it('scene renders deterministically and without NaN', () => {
      const d = level.lesson.duration;
      for (const t of [0, 0.5, d * 0.25, d * 0.5 + 0.123, d * 0.75, d - 0.01, d]) {
        const a = renderAt(level, t);
        expect(renderAt(level, t)).toBe(a);
        expect(a).not.toMatch(/NaN|Infinity|undefined/);
      }
    });

    it('every lesson hotspot is reachable in the scene, and no unknown hotspots appear', () => {
      const declared = new Set(level.lesson.hotspots.map((h) => h.id));
      const seen = new Set<string>();
      for (let t = 0; t <= level.lesson.duration; t += 1) {
        for (const m of renderAt(level, t, true).matchAll(/data-hotspot="([^"]+)"/g)) seen.add(m[1]);
      }
      expect([...seen].filter((id) => !declared.has(id))).toEqual([]);
      expect([...declared].filter((id) => !seen.has(id))).toEqual([]);
    });

    it('video mode renders no hotspot UI', () => {
      for (let t = 0; t <= level.lesson.duration; t += 5) expect(renderAt(level, t, false)).not.toContain('data-hotspot');
    });
  });
});
