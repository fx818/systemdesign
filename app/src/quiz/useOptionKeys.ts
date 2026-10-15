/**
 * Global "1..n selects option n" keyboard support for option-style answers
 * (mcq, multi, truefalse). Ignores keystrokes while typing in an input.
 */
import { useEffect } from 'react';

export function useOptionKeys(count: number, onPick: (index: number) => void, enabled = true): void {
  useEffect(() => {
    if (!enabled || count <= 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > count || n > 9) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      onPick(n - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [count, onPick, enabled]);
}
