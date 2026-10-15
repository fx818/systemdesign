import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import type { LessonDef } from '@/types/content';
import { QuestionViewFallback } from './QuestionViewFallback';
import { useQuizModule } from './quizBridge';

export interface LessonPlayerProps {
  lesson: LessonDef;
  onComplete?: () => void;
}

const SPEEDS = [0.5, 1, 1.5, 2] as const;

function fmtTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Responsive 16:9 box; children render on a fixed 1280x720 logical canvas. */
function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 1280);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative w-full overflow-hidden rounded-2xl bg-slate-950" style={{ aspectRatio: '16 / 9' }}>
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: 1280, height: 720, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Plays a deterministic lesson scene: rAF-driven clock, play/pause (space),
 * scrub bar with chapter markers, speed control, captions, hotspot drawer and
 * auto-pausing checkpoint questions. Deep-link with `?t=12.5`; external control
 * via `window.__setLessonTime(t)`.
 */
export function LessonPlayer({ lesson, onComplete }: LessonPlayerProps) {
  const { Scene, duration } = lesson;
  const [searchParams] = useSearchParams();

  const [time, setTime] = useState(() => {
    const t = Number(searchParams.get('t'));
    return Number.isFinite(t) && t > 0 ? Math.min(t, duration) : 0;
  });
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showChapters, setShowChapters] = useState(false);
  const [hotspotId, setHotspotId] = useState<string | null>(null);
  const [checkpointIdx, setCheckpointIdx] = useState<number | null>(null);

  const timeRef = useRef(time);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completedRef = useRef(false);
  const firedRef = useRef<Set<number>>(new Set(checkpointsFiredBefore(lesson, timeRef.current)));

  const checkpoints = useMemo(() => [...lesson.checkpoints].sort((a, b) => a.at - b.at), [lesson]);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const quiz = useQuizModule();
  const QuestionView = quiz?.QuestionView ?? QuestionViewFallback;

  /* ------------------------------ transport ------------------------------ */
  const seek = useCallback(
    (v: number) => {
      const t = Math.max(0, Math.min(duration, v));
      timeRef.current = t;
      setTime(t);
      // Scrubbing re-arms checkpoints ahead of the playhead, disarms those passed.
      firedRef.current = new Set(checkpointsFiredBefore(lesson, t));
    },
    [duration, lesson],
  );

  const toggle = useCallback(() => {
    // pressing play at the very end restarts the lesson
    if (!playingRef.current && timeRef.current >= duration) {
      seek(0);
      completedRef.current = false;
      setPlaying(true);
      return;
    }
    setPlaying(!playingRef.current);
  }, [duration, seek]);

  /* --------------------------------- rAF loop ----------------------------- */
  useEffect(() => {
    if (!playing || checkpointIdx !== null) return;
    let raf = 0;
    let last: number | null = null;
    const tick = (ts: number) => {
      if (last === null) last = ts;
      const dt = ((ts - last) / 1000) * speed;
      last = ts;
      let next = timeRef.current + dt;
      // fire a checkpoint when the playhead crosses it
      for (let i = 0; i < checkpoints.length; i++) {
        const cp = checkpoints[i];
        if (!firedRef.current.has(i) && cp.at > timeRef.current && cp.at <= next) {
          firedRef.current.add(i);
          next = cp.at;
          setCheckpointIdx(i);
          setPlaying(false);
          break;
        }
      }
      if (next >= duration) {
        next = duration;
        setPlaying(false);
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
      }
      timeRef.current = next;
      setTime(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, checkpointIdx, checkpoints, duration]);

  /* -------------------------------- keyboard ------------------------------ */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'ArrowLeft') {
        seek(timeRef.current - 5);
      } else if (e.code === 'ArrowRight') {
        seek(timeRef.current + 5);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, seek]);

  /* ----------------------- external control (video) ----------------------- */
  useEffect(() => {
    window.__setLessonTime = (t: number) => seek(t);
    return () => {
      delete window.__setLessonTime;
    };
  }, [seek]);

  /* -------------------------------- derived ------------------------------- */
  const caption = lesson.captions.find((c) => time >= c.start && time < c.end);
  const hotspot = hotspotId ? lesson.hotspots.find((h) => h.id === hotspotId) : null;
  const checkpoint = checkpointIdx !== null ? checkpoints[checkpointIdx] : null;
  const currentChapter = [...lesson.chapters].reverse().find((c) => time >= c.at);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Stage>
          <Scene time={time} width={1280} height={720} interactive onHotspot={(id) => setHotspotId(id)} />
        </Stage>

        {/* captions */}
        <AnimatePresence>
          {caption && !checkpoint && (
            <motion.div
              key={caption.text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-6"
            >
              <span className="max-w-2xl rounded-xl bg-slate-950/85 px-4 py-2 text-center text-sm text-slate-100 shadow-lg backdrop-blur sm:text-base">
                {caption.text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* checkpoint question */}
        <AnimatePresence>
          {checkpoint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.92, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-lg rounded-2xl border border-cyan-400/30 bg-slate-900 p-5 shadow-[0_0_40px_rgba(34,211,238,0.15)]"
              >
                <div className="mb-3 text-xs font-bold tracking-widest text-cyan-300 uppercase">Ravi checks in</div>
                <QuestionView
                  question={checkpoint.question}
                  onAnswer={() => {
                    setCheckpointIdx(null);
                    setPlaying(true);
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* hotspot drawer */}
        <AnimatePresence>
          {hotspot && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-0 right-0 z-10 h-full w-full max-w-xs border-l border-slate-700 bg-slate-900/95 p-5 backdrop-blur"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold text-cyan-300">{hotspot.title}</h3>
                <button
                  onClick={() => setHotspotId(null)}
                  aria-label="Close hotspot"
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{hotspot.body}</p>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* chapters drawer */}
        <AnimatePresence>
          {showChapters && (
            <motion.aside
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-0 left-0 z-10 h-full w-64 border-r border-slate-700 bg-slate-900/95 p-4 backdrop-blur"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-widest text-slate-400 uppercase">Chapters</h3>
                <button
                  onClick={() => setShowChapters(false)}
                  aria-label="Close chapters"
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                >
                  <X size={16} />
                </button>
              </div>
              <ul className="flex flex-col gap-1">
                {lesson.chapters.map((c) => {
                  const active = currentChapter?.title === c.title;
                  return (
                    <li key={c.at}>
                      <button
                        onClick={() => {
                          seek(c.at);
                          setShowChapters(false);
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          active ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="mr-2 font-mono text-xs text-slate-500">{fmtTime(c.at)}</span>
                        {c.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* scrub bar with chapter markers */}
      <div className="relative px-1 pt-1">
        {lesson.chapters.map((c) => (
          <button
            key={c.at}
            title={c.title}
            onClick={() => seek(c.at)}
            className="absolute h-3 w-1 -translate-x-1/2 rounded-full bg-violet-400/70 transition-colors hover:bg-violet-300"
            style={{ left: `${(c.at / duration) * 100}%`, top: '0.35rem' }}
          />
        ))}
        <input
          type="range"
          aria-label="Seek"
          min={0}
          max={duration}
          step={0.1}
          value={time}
          onChange={(e) => seek(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-cyan-400"
        />
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        <span className="font-mono text-xs text-slate-400 tabular-nums">
          {fmtTime(time)} / {fmtTime(duration)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded-lg px-2 py-1 font-mono text-xs transition-colors ${
                speed === s ? 'bg-cyan-400/15 text-cyan-300' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              {s}x
            </button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setShowChapters((v) => !v)}>
            Chapters
          </Button>
        </div>
      </div>
    </div>
  );
}

function checkpointsFiredBefore(lesson: LessonDef, t: number): number[] {
  return lesson.checkpoints.map((cp, i) => (cp.at < t ? i : -1)).filter((i) => i >= 0);
}
