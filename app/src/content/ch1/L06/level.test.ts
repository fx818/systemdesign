import level from './index';
import { validateLevel } from '../validate';

/** Same bar as the showcase levels (L01/L02). */
describe(`${level.id} content bar`, () => {
  it('is structurally valid', () => expect(validateLevel(level)).toEqual([]));

  it('meets the showcase content bar', () => {
    const ls = level.lesson;
    expect(ls.duration).toBeGreaterThanOrEqual(120);
    expect(ls.duration).toBeLessThanOrEqual(200);
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
      expect(d.length).toBeGreaterThanOrEqual(6);
      expect(d.length).toBeLessThanOrEqual(10);
    }
    expect(level.quiz).toHaveLength(8);
    expect(new Set(level.quiz.map((q) => q.kind)).size).toBeGreaterThanOrEqual(5);
    expect(level.cards.length).toBeGreaterThanOrEqual(4);
    expect(level.mission.hints).toHaveLength(3);
    expect(level.miniGames.length).toBeGreaterThanOrEqual(1);
  });
});
