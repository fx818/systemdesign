import { Clapperboard, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { levels } from '@/content/registry';
import { Card } from '@/components/ui';

/** `/videos` — every lesson scene, renderable at 1280x720 for MP4 export. */
export function VideosScreen() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-50">Videos</h1>
          <p className="text-sm text-slate-400">Every lesson as a standalone, deterministic scene.</p>
        </div>
        <Link to="/" className="text-xs text-slate-500 hover:text-cyan-300">
          &larr; HQ
        </Link>
      </header>

      <Card accent="cyan">
        <div className="flex items-start gap-3">
          <Clapperboard size={20} className="mt-0.5 shrink-0 text-cyan-300" />
          <div className="text-sm text-slate-400">
            <p>
              Each scene renders at a fixed <code className="text-cyan-300">1280&times;720</code> and is a pure function
              of time, so a render pipeline can step the playhead with{' '}
              <code className="text-cyan-300">window.__setLessonTime(t)</code> and capture frames to MP4 without any
              animation drift.
            </p>
            <p className="mt-2">
              Open a level below to see its scene full-screen. Use the URL param{' '}
              <code className="text-cyan-300">?t=12.5</code> on a lesson to deep-link to a timestamp.
            </p>
          </div>
        </div>
      </Card>

      {levels.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-400">No lessons have shipped yet.</p>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {levels.map((l) => (
            <li key={l.id}>
              <Link
                to={`/render/${l.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-colors hover:border-cyan-400/50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-cyan-400/40 bg-cyan-400/10 font-mono text-sm font-bold text-cyan-300">
                  {l.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-slate-100 group-hover:text-cyan-300">{l.title}</span>
                  <span className="block text-xs text-slate-500">
                    {l.lesson.duration}s &middot; {l.lesson.chapters.length} chapters
                  </span>
                </span>
                <ExternalLink size={16} className="shrink-0 text-slate-600 group-hover:text-cyan-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
