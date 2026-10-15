import { LoaderCircle } from 'lucide-react';

/** Shared by normal level routes and the standalone video renderer. */
export function LevelLoading({ id, error }: { id: string; error?: Error }) {
  return <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-cyan-400/20 bg-slate-900 p-10 text-center" role={error ? 'alert' : 'status'}>
    {!error && <LoaderCircle className="animate-spin text-cyan-300" size={32} aria-hidden="true" />}
    <h1 className="text-xl font-bold text-slate-100">{error ? 'Level could not be loaded' : `Loading ${id}…`}</h1>
    <p className="text-sm text-slate-400">{error ? 'Check your connection and reload this level.' : 'Preparing your next PixelPost mission.'}</p>
    {error && <button className="rounded-xl border border-cyan-400/50 px-4 py-2 font-semibold text-cyan-300"
      onClick={() => window.location.reload()}>Reload level</button>}
  </div>;
}
