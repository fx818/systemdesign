import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Gallery } from './Gallery';
import { between, cueIndex, ease, fadeWindow, formatCount, hash, pathPoint, progress, rng, stagger, tween, typewriter, withCommas, wrapText } from './index';

describe('timing helpers', () => {
  it('progress clamps and eases', () => {
    expect(progress(0, 1, 3)).toBe(0);
    expect(progress(2, 1, 3)).toBe(0.5);
    expect(progress(9, 1, 3)).toBe(1);
    expect(progress(2, 1, 3, ease.inQuad)).toBe(0.25);
  });
  it('tween holds before and after', () => {
    expect(tween(0, 1, 2, 10, 20)).toBe(10);
    expect(tween(5, 1, 2, 10, 20)).toBe(20);
    expect(tween(1.5, 1, 2, 10, 20, ease.linear)).toBe(15);
  });
  it('between is half-open', () => {
    expect(between(1, 1, 2)).toBe(true);
    expect(between(2, 1, 2)).toBe(false);
  });
  it('stagger / typewriter / cueIndex / fadeWindow', () => {
    expect(stagger(3, 10, 0.5)).toBe(11.5);
    expect(typewriter('hello', 0.1, 0, 20)).toBe('he');
    expect(typewriter('hello', 99, 0, 20)).toBe('hello');
    expect(typewriter('hello', -1, 0, 20)).toBe('');
    expect(cueIndex(5, [0, 4, 8])).toBe(1);
    expect(cueIndex(-1, [0])).toBe(-1);
    expect(fadeWindow(5, 0, 10)).toBe(1);
    expect(fadeWindow(11, 0, 10)).toBe(0);
  });
  it('pathPoint walks a polyline by arc length', () => {
    const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
    expect(pathPoint(pts, 0)).toMatchObject({ x: 0, y: 0 });
    expect(pathPoint(pts, 0.5)).toMatchObject({ x: 100, y: 0 });
    const q = pathPoint(pts, 0.75);
    expect(q.x).toBe(100);
    expect(q.y).toBe(50);
    expect(q.angle).toBe(90);
    expect(pathPoint(pts, 1)).toMatchObject({ x: 100, y: 100 });
  });
  it('random helpers are deterministic', () => {
    expect(hash(3)).toBe(hash(3));
    const a = rng(42);
    const b = rng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('formats numbers without locale', () => {
    expect(withCommas(1234567)).toBe('1,234,567');
    expect(formatCount(1500)).toBe('1.5K');
    expect(formatCount(10_000_000)).toBe('10M');
    expect(formatCount(7)).toBe('7');
  });
  it('wraps text', () => {
    expect(wrapText('one two three four', 9)).toEqual(['one two', 'three', 'four']);
  });
});

describe('Gallery', () => {
  it('renders deterministically for the same time', () => {
    for (const page of ['nodes', 'fx'] as const) {
      for (const t of [0, 1.234, 7.5]) {
        const a = renderToStaticMarkup(<Gallery time={t} page={page} />);
        const b = renderToStaticMarkup(<Gallery time={t} page={page} />);
        expect(a).toBe(b);
        expect(a).toContain('<svg');
        expect(a).not.toContain('NaN');
      }
    }
  });
});
