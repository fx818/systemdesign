import { useState } from 'react';
import { ACHIEVEMENTS, useGame } from '@/game';
import { action, panel } from './shared';

export function PracticeProfile() {
  const achievements = useGame(s => s.achievements);
  const stats = useGame(s => s.practice);
  const [key, setKey] = useState(() => localStorage.getItem('anthropicKey') ?? '');
  const [saved, setSaved] = useState(false);
  return <section className="space-y-5">
    <div className={panel}><h2 className="text-xl font-bold text-slate-100">Practice stats</h2><p className="mt-3 text-sm text-slate-300">{stats.interviews} interviews · best rubric {stats.bestInterview}% · survival best {Math.floor(stats.survivalBest)}s · {Object.keys(stats.puzzles).length} puzzles solved · puzzle streak {stats.puzzleStreak.count}</p></div>
    <div><h2 className="mb-3 text-xl font-bold text-slate-100">Hidden achievements</h2><div className="grid gap-3 sm:grid-cols-2">{ACHIEVEMENTS.map(item => <div key={item.id} className={panel}><h3 className={achievements[item.id] !== undefined ? 'font-bold text-amber-200' : 'font-bold text-slate-500'}>{achievements[item.id] !== undefined ? item.name : '???'}</h3><p className="mt-1 text-xs text-slate-400">{achievements[item.id] !== undefined ? item.description : 'Keep exploring to reveal this achievement.'}</p></div>)}</div></div>
    <form className={`${panel} space-y-3`} onSubmit={event => { event.preventDefault(); if (key.trim()) localStorage.setItem('anthropicKey', key.trim()); else localStorage.removeItem('anthropicKey'); setSaved(true); }}><h2 className="text-xl font-bold text-slate-100">Optional AI interviewer</h2><p className="text-sm text-slate-400">Add your Anthropic API key to get a bonus follow-up from Ravi in Interview Mode. It is stored only in this browser. Enabling it sends your prompt and graph to Anthropic and uses your API credits. Scripted questions always remain available.</p><label className="block text-sm text-slate-300">Anthropic API key<input type="password" autoComplete="off" spellCheck={false} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3" value={key} onChange={event => { setKey(event.target.value); setSaved(false); }} /></label><button className={action} type="submit">Save AI setting</button><button className={`${action} ml-2`} type="button" onClick={() => { setKey(''); localStorage.removeItem('anthropicKey'); setSaved(true); }}>Remove key</button>{saved && <p role="status" className="text-sm text-emerald-300">Setting saved.</p>}</form>
  </section>;
}
