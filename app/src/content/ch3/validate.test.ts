import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LevelDef } from '@/types/content';
import { validateLevel } from '../ch1/validate';
import { CH3_PAGES } from './framework';

const mods = import.meta.glob<{ default: LevelDef }>('./C3L*/index.ts', { eager: true });
const levels = Object.entries(mods).map(([path, m]) => ({ path, level: m.default }));

const renderAt = (level: LevelDef, time: number, interactive = false) =>
  renderToStaticMarkup(createElement(level.lesson.Scene, { time, width: 1280, height: 720, interactive, onHotspot: () => {} }));

/** ch1's validator assumes L01-style ids and chapter-1 pages; we check those rules ourselves. */
const CH1_ONLY = [/id must look like L01/, /does not match id/, /pages \d+-\d+ invalid/];
const validate = (level: LevelDef) => validateLevel(level).filter((e) => !CH1_ONLY.some((re) => re.test(e)));

describe('ch3 levels', () => {
  it('has the four framework levels', () => {
    expect(levels.map((l) => l.level.id).sort()).toEqual(['C3L01', 'C3L02', 'C3L03', 'C3L04']);
  });

  describe.each(levels)('$path', ({ path, level }) => {
    it('folder name, id, chapter and number agree', () => {
      expect(path).toContain(`/${level.id}/`);
      expect(level.id).toMatch(/^C3L0\d$/);
      expect(level.chapter).toBe(3);
      expect(Number(level.id.slice(3))).toBe(level.number);
      expect(level.pages[0]).toBeGreaterThanOrEqual(CH3_PAGES[0]);
      expect(level.pages[1]).toBeLessThanOrEqual(CH3_PAGES[1]);
      expect(level.pages[0]).toBeLessThanOrEqual(level.pages[1]);
    });

    it('is structurally valid (shared validator)', () => {
      expect(validate(level)).toEqual([]);
    });

    it('meets the chapter content bar', () => {
      const ls = level.lesson;
      expect(ls.duration).toBeGreaterThanOrEqual(120);
      expect(ls.duration).toBeLessThanOrEqual(180);
      expect(ls.hotspots.length).toBeGreaterThanOrEqual(3);
      expect(ls.hotspots.length).toBeLessThanOrEqual(5);
      expect(ls.checkpoints).toHaveLength(2);
      expect(ls.captions[0].start).toBe(0);
      expect(ls.captions[ls.captions.length - 1].end).toBe(ls.duration);
      ls.captions.forEach((c, i) => {
        expect(c.end - c.start).toBeLessThanOrEqual(7);
        if (i) expect(c.start - ls.captions[i - 1].end).toBeLessThanOrEqual(0.5);
      });
      for (const q of [...level.quiz, ...ls.checkpoints.map((c) => c.question)]) {
        expect(q.page).toBeGreaterThanOrEqual(CH3_PAGES[0]);
        expect(q.page).toBeLessThanOrEqual(CH3_PAGES[1]);
      }
      expect(level.quiz.length).toBeGreaterThanOrEqual(6);
      expect(level.quiz.length).toBeLessThanOrEqual(8);
      expect(new Set(level.quiz.map((q) => q.kind)).size).toBeGreaterThanOrEqual(4);
      expect(level.cards.length).toBeGreaterThanOrEqual(4);
      expect(level.cards.length).toBeLessThanOrEqual(5);
      expect(level.incident.length).toBeGreaterThanOrEqual(5);
      expect(level.debrief.length).toBeGreaterThanOrEqual(5);
      expect(level.mission.hints.length).toBeGreaterThanOrEqual(3);
      expect(level.miniGames.length).toBeGreaterThanOrEqual(1);
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

  it('badges are unique across the chapter', () => {
    const ids = levels.map((l) => l.level.badge.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
