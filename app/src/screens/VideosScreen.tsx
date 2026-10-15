import { useEffect, useState } from 'react';
import { Clapperboard, Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { levels } from '@/content/registry';
import { getChapter } from '@/content/chapters';
import { Card } from '@/components/ui';

interface VideoEntry {
  id: string;
  title: string;
  file: string;
  poster: string;
  duration: number;
  sizeBytes: number;
  renderedAt: string;
}

function isVideoEntry(value: unknown): value is VideoEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.title === 'string'
    && typeof v.file === 'string' && /^[\w-]+\.mp4$/.test(v.file)
    && typeof v.poster === 'string' && /^[\w-]+\.jpg$/.test(v.poster)
    && typeof v.duration === 'number' && Number.isFinite(v.duration) && v.duration > 0
    && typeof v.sizeBytes === 'number' && Number.isFinite(v.sizeBytes) && v.sizeBytes > 0
    && typeof v.renderedAt === 'string';
}

function durationLabel(seconds: number) {
  const rounded = Math.ceil(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

/** Also exposes the built lesson catalog to scripts/render/render.mjs. */
export function VideosScreen() {
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/videos/manifest.json', { signal: controller.signal, cache: 'no-store' });
        if (response.status === 404) return;
        if (!response.ok) throw new Error('Video catalog unavailable');
        // SPA hosts sometimes return index.html with status 200 for a missing file.
        if (response.headers.get('content-type')?.includes('text/html')) return;
        const data: unknown = await response.json();
        if (!Array.isArray(data) || !data.every(isVideoEntry)) throw new Error('Invalid video catalog');
        if (!controller.signal.aborted) setVideos(data);
      } catch {
        if (!controller.signal.aborted) setLoadFailed(true);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  const chapterNumbers = [...new Set(levels.map((level) => level.chapter ?? 1))];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-50">Videos</h1>
          <p className="text-sm text-slate-400">Watch a lesson, revisit a concept, or download an MP4 for later.</p>
        </div>
        <Link to="/" className="shrink-0 text-xs text-slate-500 hover:text-cyan-300">&larr; HQ</Link>
      </header>
      <Card accent="cyan">
        <div className="flex items-start gap-3 text-sm text-slate-400">
          <Clapperboard size={20} className="mt-0.5 shrink-0 text-cyan-300" />
          <p>Every animated lesson is available to watch now. Downloadable 720p videos appear here when exported.</p>
        </div>
      </Card>
      {loadFailed && <p role="status" className="text-sm text-amber-300">Downloads could not be loaded. You can still watch every animated lesson.</p>}
      {levels.length === 0 && <Card><p className="text-sm text-slate-400">No lessons have shipped yet.</p></Card>}
      {chapterNumbers.map((number) => (
        <section key={number} aria-labelledby={`video-chapter-${number}`} className="space-y-3">
          <h2 id={`video-chapter-${number}`} className="text-lg font-bold text-slate-100">
            Chapter {number} · {getChapter(number)?.title ?? `Chapter ${number}`}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {levels.filter((level) => (level.chapter ?? 1) === number).map((level) => {
              const video = videos.find((entry) => entry.id === level.id);
              return (
                <li key={level.id} data-video-level={level.id} data-video-title={level.title} data-video-duration={level.lesson.duration}
                  className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
                  {video ? (
                    <video controls preload="none" poster={`/videos/${video.poster}`} src={`/videos/${video.file}`}
                      aria-label={`${level.title} video`} className="aspect-video w-full bg-slate-950" />
                  ) : (
                    <Link to={`/render/${level.id}`} aria-label={`Watch ${level.title}`} className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-950 to-cyan-950/50 text-cyan-300">
                      <Clapperboard size={48} aria-hidden="true" />
                    </Link>
                  )}
                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="font-bold text-slate-100"><span className="mr-2 font-mono text-xs text-cyan-300">{level.id}</span>{level.title}</h3>
                      <p className="mt-1 text-xs text-slate-400">{durationLabel(level.lesson.duration)} · {level.lesson.chapters.length} lesson sections</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <Link to={`/render/${level.id}`} className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200">
                        <ExternalLink size={15} /> Watch animated
                      </Link>
                      {video && <a href={`/videos/${video.file}`} download={video.file} className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200">
                        <Download size={15} /> Download MP4
                      </a>}
                    </div>
                    {video ? (
                      <p className="text-xs text-slate-500">MP4 · {durationLabel(video.duration)} · {(video.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
                    ) : (
                      <details className="text-xs text-slate-500">
                        <summary className="cursor-pointer hover:text-slate-300">Generate this MP4</summary>
                        <p className="mt-2">From the repository root:</p>
                        <code className="mt-1 block break-words text-slate-400">npm --prefix app run build &amp;&amp; node scripts/render/render.mjs --levels {level.id} --fps 24 --captions</code>
                      </details>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
