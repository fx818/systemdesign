import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import type { DialogueLine } from '@/types/content';
import { Button } from '@/components/ui';
import { Avatar, CHARACTERS } from './characters';

export interface DialogueProps {
  lines: DialogueLine[];
  onDone?: () => void;
}

const CHARS_PER_TICK = 2;
const TICK_MS = 24;

/**
 * Visual-novel dialogue: typewriter text, click/space to advance (first click
 * completes the line), skip button. Narrator lines render as centered captions.
 */
export function Dialogue({ lines, onDone }: DialogueProps) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const line = lines[Math.min(index, lines.length - 1)];

  // typewriter
  useEffect(() => {
    setShown(0);
    if (!line) return;
    const iv = window.setInterval(() => {
      setShown((s) => {
        if (s >= line.text.length) {
          window.clearInterval(iv);
          return s;
        }
        return Math.min(line.text.length, s + CHARS_PER_TICK);
      });
    }, TICK_MS);
    return () => window.clearInterval(iv);
  }, [index, line]);

  const advance = useCallback(() => {
    if (!line) return;
    if (shown < line.text.length) {
      setShown(line.text.length); // finish typing first
      return;
    }
    if (index >= lines.length - 1) onDone?.();
    else setIndex((i) => i + 1);
  }, [line, shown, index, lines.length, onDone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  if (!line) {
    return (
      <div className="flex justify-center p-10 text-slate-500">No dialogue written yet.</div>
    );
  }

  const typing = shown < line.text.length;
  const meta = CHARACTERS[line.who];

  return (
    <div className="flex select-none flex-col gap-4" onClick={advance} role="button" tabIndex={0}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="flex items-end gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
        >
          {line.who !== 'narrator' && (
            <div className="flex flex-col items-center gap-1.5">
              <Avatar who={line.who} mood={line.mood} size={56} />
              <span className="text-xs font-semibold text-slate-400">{meta.name}</span>
            </div>
          )}
          <p className="min-h-16 flex-1 text-base leading-relaxed text-slate-200 sm:text-lg">
            {line.text.slice(0, shown)}
            {typing && <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-cyan-400 align-middle" />}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <span className="font-mono text-xs text-slate-500">
          {index + 1} / {lines.length}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-600 sm:inline">click or press space</span>
          <Button size="sm" variant="ghost" onClick={() => onDone?.()}>
            Skip
          </Button>
          <Button size="sm" variant="outline" onClick={advance}>
            {typing ? 'Reveal' : index >= lines.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
