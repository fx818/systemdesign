import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getLevel } from '@/content/registry';

/**
 * `/render/:levelId` — renders ONLY the lesson scene, non-interactive, on a
 * fixed 1280x720 canvas at the top-left of the viewport. Time is driven
 * externally via `window.__setLessonTime(t)` (used by the MP4 export pipeline).
 */
export function RenderScene() {
  const { levelId } = useParams<{ levelId: string }>();
  const level = levelId ? getLevel(levelId) : undefined;
  const [params] = useSearchParams();
  const duration = level?.lesson.duration ?? 0;
  const clamp = (t: number) => Number.isFinite(t) ? Math.max(0, Math.min(duration, t)) : 0;
  const [time, setTime] = useState(() => clamp(Number(params.get('t'))));

  useEffect(() => {
    window.__setLessonTime = (t: number) => setTime(Number.isFinite(t) ? Math.max(0, Math.min(duration, t)) : 0);
    return () => {
      delete window.__setLessonTime;
    };
  }, [duration]);

  if (!level) {
    return (
      <div className="fixed inset-0 bg-slate-950">
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-slate-500"
          style={{ width: 1280, height: 720 }}
        >
          Level not found: {levelId}
        </div>
      </div>
    );
  }

  const { Scene } = level.lesson;
  return (
    <div className="fixed inset-0 bg-slate-950">
      <div className="absolute top-0 left-0 overflow-hidden" style={{ width: 1280, height: 720 }}>
        <Scene time={time} width={1280} height={720} interactive={false} />
      </div>
    </div>
  );
}
