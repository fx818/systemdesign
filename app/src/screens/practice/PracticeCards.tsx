import { Link } from 'react-router-dom';
import { useGame } from '@/game';
import { practiceModes } from '@/practice/navigation';
import { interviewUnlocked } from '@/practice/access';

export function PracticeCards() {
  const progress = useGame(s => s.progress);
  return <section><h2 className="mb-3 text-xl font-bold text-slate-100">Practice</h2>
    <div className="grid gap-3 sm:grid-cols-2">{practiceModes.map(mode => <Link key={mode.path} to={mode.path} className="rounded-2xl border border-violet-400/30 bg-slate-900 p-5 hover:border-violet-300">
      <h3 className="font-bold text-violet-200">{mode.title}</h3><p className="mt-1 text-sm text-slate-400">{mode.text}</p>
      {mode.path === '/interview' && !interviewUnlocked(progress) && <p className="mt-2 text-xs text-amber-300">Unlock: finish Chapter 1’s boss or C3L04</p>}
    </Link>)}</div></section>;
}
