import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getLevel } from '@/content/registry';

/**
 * `/render/:levelId` — renders ONLY the lesson scene, non-interactive, on a
 * fixed 1280x720 canvas at the top-left of the viewport. Time is driven
 * externally via `window.__setLessonTime(t)` (used by the MP4 export pipeline).
 */
export function RenderScene() {
  const { levelId } = useParams<{ levelId: string }>();
  const level = levelId ? getLevel(levelId) : undefined;
  const [time, setTime] = useState(0);

  useEffect(() => {
    window.__setLessonTime = (t: number) => setTime(Math.max(0, t));
    return () => {
      delete window.__setLessonTime;
    };
  }, []);

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
