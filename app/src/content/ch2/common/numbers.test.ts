import { BOSS, DAY_S, MONTH_S, NINES, YEAR_S, downtimeSeconds, formatDuration, formatNs, humanScaled } from './numbers';

describe('chapter 2 numbers', () => {
  it('reproduces the book availability table', () => {
    expect(formatDuration(downtimeSeconds(99, DAY_S))).toBe('14.4 min');
    expect(formatDuration(downtimeSeconds(99, MONTH_S))).toBe('7.31 h');
    expect(formatDuration(downtimeSeconds(99, YEAR_S))).toBe('3.65 days');
    expect(formatDuration(downtimeSeconds(99.9, YEAR_S))).toBe('8.77 h');
    expect(formatDuration(downtimeSeconds(99.99, DAY_S))).toBe('8.64 s');
    expect(formatDuration(downtimeSeconds(99.99, MONTH_S))).toBe('4.38 min');
    expect(formatDuration(downtimeSeconds(99.999, DAY_S))).toBe('864 ms');
    expect(formatDuration(downtimeSeconds(99.9999, YEAR_S))).toBe('31.6 s');
    expect(NINES).toHaveLength(5);
  });
  it('formats latency numbers', () => {
    expect(formatNs(0.5)).toBe('0.5 ns');
    expect(formatNs(250_000)).toBe('250 µs');
    expect(formatNs(150_000_000)).toBe('150 ms');
    expect(humanScaled(100)).toBe('1.7 min');
    expect(humanScaled(150_000_000)).toBe('4.8 years');
  });
  it('boss estimate matches the worked example', () => {
    expect(BOSS.dau).toBe(5_000_000);
    expect(Math.round(BOSS.postQps)).toBe(116);
    expect(Math.round(BOSS.readQps)).toBe(2894);
    expect(BOSS.servers).toBe(6);
    expect(BOSS.storagePerDayTB).toBe(8);
    expect(BOSS.fiveYearPB).toBeCloseTo(14.6);
  });
});
