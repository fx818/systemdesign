import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { loadLevel, useLevel } from './registry';
import { testLevel } from '@/screens/testLevel';

const download = vi.hoisted(() => {
  let resolve!: () => void;
  const ready = new Promise<void>(done => { resolve = done; });
  return { ready, resolve, calls: 0 };
});
vi.mock('./ch1/L01/index.ts', async () => {
  download.calls++;
  await download.ready;
  const { testLevel: level } = await import('@/screens/testLevel');
  return { default: level };
});

describe('on-demand level loading', () => {
  it('does not fetch a gated level, deduplicates downloads and reuses loaded content', async () => {
    const { result, rerender } = renderHook(({ enabled }) => useLevel('L01', enabled), { initialProps: { enabled: false } });
    expect(result.current).toEqual({ loading: false });
    expect(download.calls).toBe(0);
    rerender({ enabled: true });
    expect(result.current.loading).toBe(true);
    let first!: Promise<unknown>;
    act(() => {
      first = loadLevel('L01');
      expect(loadLevel('L01')).toBe(first);
      download.resolve();
    });
    await act(async () => { await first; });
    await waitFor(() => expect(result.current.level).toBe(testLevel));
    expect(download.calls).toBe(1);
    expect(await loadLevel('L01')).toBe(testLevel);
    rerender({ enabled: false });
    expect(result.current).toEqual({ loading: false });
    rerender({ enabled: true });
    expect(result.current.level).toBe(testLevel);
    expect(download.calls).toBe(1);
  });

  it('does not show the previous level while the route id changes', async () => {
    await act(async () => { download.resolve(); await loadLevel('L01'); });
    const { result, rerender } = renderHook(({ id }) => useLevel(id), { initialProps: { id: 'L01' } });
    expect(result.current.level?.id).toBe('L01');
    rerender({ id: 'C2L01' });
    expect(result.current.level).toBeUndefined();
    expect(result.current.loading).toBe(true);
    rerender({ id: 'missing' });
    expect(result.current).toEqual({ loading: false });
    await act(async () => { await loadLevel('C2L01'); });
    expect(result.current).toEqual({ loading: false });
  });

  it('rejects an unknown id instead of returning unrelated content', async () => {
    await expect(loadLevel('missing')).rejects.toThrow('Unknown level: missing');
  });
});
