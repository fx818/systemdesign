import { WAVES } from '../data';
import { addServer, canUpgrade, initialWall, MAX_TIER, runWave, upgrade, wallCapacity, wallScore, type WallState } from './HardwareWall';

const play = (plan: ((s: WallState) => WallState)[][]) => {
  let s = initialWall;
  for (const actions of plan) {
    for (const a of actions) s = a(s);
    s = runWave(s);
  }
  return s;
};

describe('HardwareWall logic', () => {
  it('upgrades stop at the hardware wall', () => {
    let s = initialWall;
    for (let i = 0; i < 10; i++) s = upgrade(s);
    expect(s.tier).toBe(MAX_TIER);
    expect(canUpgrade(s)).toBe(false);
    expect(wallCapacity(s)).toBeLessThan(WAVES[3].rps);
  });

  it('scaling up only cannot survive the big wave or the crash', () => {
    const s = play([[], [upgrade], [upgrade], [upgrade], []]);
    expect(s.results).toEqual([true, true, true, false, false]);
    expect(wallScore(s)).toBe(0.6);
  });

  it('scaling out survives every wave within budget', () => {
    const s = play([[], [addServer], [addServer], [addServer], []]);
    expect(s.results.every(Boolean)).toBe(true);
    expect(s.spent).toBeLessThanOrEqual(600);
    expect(wallScore(s)).toBe(1);
  });

  it('a crashed main server contributes no capacity', () => {
    expect(wallCapacity({ tier: 3, extra: 0 }, true)).toBe(0);
    expect(wallCapacity({ tier: 0, extra: 2 }, true)).toBe(2000);
  });
});
