import { useMemo, useState } from 'react';
import { ArchCanvas, type SimResult } from '@/sim';
import type { ArchGraph } from '@/types/content';
import { todayKey, useGame } from '@/game';
import { gradeArchitecture } from '@/practice/architecture';
import { designCost } from '@/practice/config';
import { generatePuzzle, graphMoveCost, puzzleShare } from '@/practice/puzzle';
import { PracticePage, action, panel } from './shared';
import { SubmittedRun } from './SubmittedRun';

export function PuzzleScreen() {
  const [date] = useState(todayKey);
  const puzzle = useMemo(() => generatePuzzle(date), [date]);
  const [graph, setGraph] = useState<ArchGraph>(puzzle.graph);
  const [moves, setMoves] = useState(0);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<SimResult | null>(null);
  const saved = useGame(s => s.practice.puzzles[date]);
  const streak = useGame(s => s.practice.puzzleStreak);
  const grade = gradeArchitecture(graph, puzzle.rubric);
  const config = useMemo(() => ({ ...puzzle.config, start: graph, palette: [], locked: graph.nodes.map(n => n.id) }), [puzzle, graph]);
  function change(next: ArchGraph) {
    const cost = graphMoveCost(graph, next);
    if (moves + cost > puzzle.maxMoves) { setNotice('No moves left for that edit. Reset to try a different plan.'); return; }
    if (designCost(next) > puzzle.budget) { setNotice('That edit exceeds the budget.'); return; }
    setMoves(old => old + cost); setGraph(next); setResult(null); setNotice('');
  }
  return <PracticePage title="Daily Puzzle" intro={`#${puzzle.number} · ${date} · ${puzzle.title}. ${puzzle.briefing}`}>
    <div className={panel}><p className="text-amber-200">{moves} / {puzzle.maxMoves} moves · {designCost(graph)} / {puzzle.budget} credits · {streak.count} day puzzle streak</p><p className="mt-2 text-xs text-slate-400">Each box or wire added/removed costs a move. Repositioning is free. Traffic rises to {Math.max(...puzzle.config.events.flatMap(event => event.type === 'traffic' ? [event.rps] : [])).toLocaleString()} requests/s; chaos hits at 20s. Meet ≥97% uptime and ≤350ms p95.</p></div>
    {saved !== undefined && <p role="status" className="text-emerald-300">Solved today in {saved} moves. You can keep practicing; today’s XP is already saved.</p>}
    <div className="flex flex-wrap gap-2">
      <button className={action} onClick={() => { setTesting(false); setGraph(structuredClone(puzzle.graph)); setMoves(0); setResult(null); setNotice(''); }}>Reset puzzle</button>
      {testing ? <button className={action} onClick={() => setTesting(false)}>Back to repair</button> : <button className={action} disabled={!grade.passed || designCost(graph) > puzzle.budget} onClick={() => { setTesting(true); setResult(null); }}>Test chaos timeline</button>}
      {saved !== undefined && <button className={action} onClick={async () => { const text = puzzleShare(puzzle.number, saved); try { await navigator.clipboard.writeText(text); setNotice('Share text copied.'); } catch { setNotice(text); } }}>Share result</button>}
    </div>
    {!testing ? <ArchCanvas graph={graph} editable onChange={change} palette={puzzle.config.palette} budget={puzzle.budget} locked={['client']} /> : <SubmittedRun config={config} onFinish={run => { setResult(run); if (run.passed && grade.passed) useGame.getState().finishPuzzle(date, moves); }} />}
    <div className={panel}><h2 className="font-bold text-slate-100">Repair checklist</h2><ul className="mt-3 space-y-2 text-sm">{grade.checks.map(check => <li key={check.id} className={check.passed ? 'text-emerald-300' : 'text-amber-200'}>{check.passed ? '✓' : '○'} {check.explanation}</li>)}</ul></div>
    {result && <p role="status" className={result.passed ? 'text-emerald-300' : 'text-rose-300'}>{result.passed ? 'Puzzle solved. +100 XP for your first solution today.' : 'The chaos test failed. Return to repair and try a different plan.'}</p>}
    {notice && <p role="status" className="text-cyan-200">{notice}</p>}
  </PracticePage>;
}
