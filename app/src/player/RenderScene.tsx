import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useLevel } from '@/content/registry';
import type { LevelDef } from '@/types/content';
import { LevelLoading } from '@/components/ui/LevelLoading';

/**
 * `/render/:levelId` — renders ONLY the lesson scene (non-interactive, 1280x720 logical canvas).
 *
 * Modes:
 *  - Watch mode (default): the scene autoplays from `?t=` (or 0), with captions, scaled to fit the window,
 *    and loops at the end. Opening the URL in a browser shows the animated lesson.
 *  - Capture mode: `?capture=1`, or as soon as `window.__setLessonTime(t)` is called. Autoplay stops, the
 *    canvas is pinned at 1280x720 top-left and time is driven externally (MP4 export pipeline).
 *    Add `&captions=1` to burn captions into captured frames.
 */
export function RenderScene() {
  const { levelId } = useParams<{ levelId: string }>();
  const { level, loading, error } = useLevel(levelId);
  if (loading || error) return <div className="fixed inset-0 flex items-center justify-center bg-slate-950"><LevelLoading id={levelId ?? ''} error={error} /></div>;
  if (!level) return <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-slate-500">Level not found: {levelId}</div>;
  return <LoadedScene key={level.id} level={level} />;
}

// Mount only after loading: initial ?t= is clamped against the real duration,
// and the exporter control is never exposed before the scene has rendered.
function LoadedScene({ level }: { level: LevelDef }) {
  const [params] = useSearchParams();
  const duration = level.lesson.duration;
  const clamp = (t: number) => (Number.isFinite(t) ? Math.max(0, Math.min(duration, t)) : 0);
  const [time, setTime] = useState(() => clamp(Number(params.get('t'))));
  const [capture, setCapture] = useState(() => params.get('capture') === '1');
  const showCaptions = capture ? params.get('captions') === '1' : params.get('captions') !== '0';
  const timeRef = useRef(time);
  timeRef.current = time;

  // External control (MP4 export). Calling it switches to capture mode.
  useEffect(() => {
    window.__setLessonTime = (t: number) => {
      setCapture(true);
      setTime(Number.isFinite(t) ? Math.max(0, Math.min(duration, t)) : 0);
    };
    return () => {
      delete window.__setLessonTime;
    };
  }, [duration]);

  // Watch mode: autoplay with requestAnimationFrame, loop at the end.
  useEffect(() => {
    if (capture || !level || duration <= 0) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      let next = timeRef.current + dt;
      if (next > duration) next = 0;
      setTime(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [capture, level, duration]);

  // Watch mode: scale the 1280x720 canvas to fit the window.
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (capture) return;
    const fit = () => setScale(Math.min(window.innerWidth / 1280, window.innerHeight / 720));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [capture]);

  const { Scene, captions } = level.lesson;
  const caption = captions.find((c) => time >= c.start && time < c.end)?.text;

  const canvas = (
    <div className="relative overflow-hidden" style={{ width: 1280, height: 720 }}>
      <Scene time={time} width={1280} height={720} interactive={false} />
      {showCaptions && caption && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center px-16 pointer-events-none">
          <div
            className="rounded-xl bg-black/75 px-5 py-2.5 text-center text-slate-100"
            style={{ fontSize: 26, lineHeight: 1.3, maxWidth: 1100 }}
            data-testid="render-caption"
          >
            {caption}
          </div>
        </div>
      )}
    </div>
  );

  if (capture) {
    return (
      <div className="fixed inset-0 bg-slate-950">
        <div className="absolute top-0 left-0">{canvas}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
      <div style={{ width: 1280 * scale, height: 720 * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>{canvas}</div>
      </div>
      <div className="absolute bottom-2 right-3 text-xs text-slate-500 tabular-nums">
        {level.id} · {time.toFixed(1)}s / {duration}s
      </div>
    </div>
  );
}
