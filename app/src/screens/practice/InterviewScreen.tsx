import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArchCanvas, type SimResult } from '@/sim';
import { QuizRunner, type QuizResult } from '@/quiz';
import { useGame } from '@/game';
import { aiFollowup } from '@/practice/ai';
import { interviewUnlocked } from '@/practice/access';
import { gradeArchitecture } from '@/practice/architecture';
import { allComponents, designCost } from '@/practice/config';
import { bottlenecks, clarifyOptions, gradeEstimates, interviewConfig, interviewGrade, interviewPrompts, wrapOptions, type InterviewPrompt } from '@/practice/interview';
import type { ArchGraph } from '@/types/content';
import { PracticePage, action, panel } from './shared';
import { SubmittedRun } from './SubmittedRun';

const emptyGraph = (): ArchGraph => ({ nodes: [{ id: 'client', kind: 'client', label: 'Users', x: 80, y: 360 }], edges: [] });
const phaseNames = ['Clarify', 'Estimate', 'Design', 'Deep dive & wrap-up'];
const estimateLabels = ['Daily active users', 'Average requests / second', 'Peak requests / second', 'Retained storage (GB, decimal)'];

export function InterviewScreen() {
  const unlocked = useGame(s => interviewUnlocked(s.progress));
  const [selected, setSelected] = useState(interviewPrompts[0].id);
  const [sessionPrompt, setSessionPrompt] = useState<InterviewPrompt | null>(null);
  if (!unlocked) return <PracticePage title="Interview Mode" intro="A complete 45-minute system design interview with Ravi."><div className={panel}><h2 className="font-bold text-amber-200">Interview Mode locked</h2><p className="mt-2 text-sm text-slate-300">Earn at least one star on Chapter 1’s boss or C3L04 to unlock.</p><Link className="mt-3 block text-cyan-300" to="/">Return to the chapter path →</Link></div></PracticePage>;
  if (sessionPrompt) return <InterviewSession key={sessionPrompt.id} prompt={sessionPrompt} onExit={() => setSessionPrompt(null)} />;
  return <PracticePage title="Interview Mode" intro="Choose one of eight prompts. You have 45 minutes to clarify requirements, estimate scale, build and test an architecture, then explain its trade-offs.">
    <div className="grid gap-3 sm:grid-cols-2">{interviewPrompts.map(prompt => <button key={prompt.id} aria-pressed={selected === prompt.id} className={`${panel} text-left ${selected === prompt.id ? 'border-violet-400' : ''}`} onClick={() => setSelected(prompt.id)}><h2 className="font-bold text-violet-200">{prompt.title}</h2><p className="mt-2 text-sm text-slate-400">{prompt.brief}</p></button>)}</div>
    <button className={action} onClick={() => setSessionPrompt(interviewPrompts.find(prompt => prompt.id === selected)!)}>Start 45-minute interview</button>
  </PracticePage>;
}

function InterviewSession({ prompt, onExit }: { prompt: InterviewPrompt; onExit: () => void }) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [deadline] = useState(() => Date.now() + 45 * 60 * 1000);
  const [now, setNow] = useState(Date.now);
  const [phase, setPhase] = useState(0);
  const [clarify, setClarify] = useState<number[]>([]);
  const [estimates, setEstimates] = useState(['', '', '', '']);
  const [graph, setGraph] = useState(emptyGraph);
  const [testing, setTesting] = useState(false);
  const [simulation, setSimulation] = useState<SimResult | null>(null);
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [bottleneck, setBottleneck] = useState('');
  const [wrap, setWrap] = useState<number[]>([]);
  const [bonus, setBonus] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState('');
  const [reflection, setReflection] = useState('');
  const [timedOut, setTimedOut] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof interviewGrade> | null>(null);
  const [finalScores, setFinalScores] = useState<number[]>([]);
  const completed = useRef(false);
  const finishRef = useRef<(expired: boolean) => void>(() => {});
  const structural = gradeArchitecture(graph, prompt.rubric);
  const numeric = gradeEstimates(prompt, estimates.map(value => value.trim() === '' ? NaN : Number(value)));
  const clarifyScore = Math.max(0, clarify.reduce((sum, index) => sum + (clarifyOptions[index].quality === 'good' ? 25 : clarifyOptions[index].quality === 'bad' ? -25 : 0), 0));
  const wrapScore = Math.max(0, wrap.reduce((sum, index) => sum + (wrapOptions[index].good ? 1 : -1), 0)) / 3 * 25;
  const scores = [clarifyScore, numeric.score, structural.score * 0.5 + (simulation?.passed ? 50 : 0), (bottleneck === prompt.bottleneck ? 25 : 0) + (quiz ? quiz.correct / quiz.total * 50 : 0) + wrapScore];
  const config = useMemo(() => interviewConfig(prompt, graph), [prompt, graph]);
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  const toggle = (values: number[], value: number) => values.includes(value) ? values.filter(item => item !== value) : [...values, value];
  function finish(expired = false) {
    if (completed.current) return;
    completed.current = true;
    const grade = interviewGrade(scores, simulation?.passed === true, structural.passed);
    setTimedOut(expired); setFinalScores(scores); setResult(grade); setPhase(4);
    useGame.getState().finishInterview(sessionId, grade.score, grade.xp);
  }
  useEffect(() => { finishRef.current = finish; });
  useEffect(() => {
    if (result) return;
    const timer = window.setInterval(() => { const current = Date.now(); setNow(current); if (current >= deadline) finishRef.current(true); }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, result]);
  useEffect(() => {
    if (phase !== 3) return;
    const abort = new AbortController();
    const key = localStorage.getItem('anthropicKey');
    if (!key) return;
    aiFollowup(graph, prompt.title, abort.signal).then(text => {
      if (abort.signal.aborted) return;
      setBonus(text); setAiStatus(text ? 'Ravi’s optional AI follow-up' : 'AI unavailable; the scripted follow-ups below are ready.');
    });
    return () => abort.abort();
  }, [phase, graph, prompt.title]);
  return <PracticePage title={prompt.title} intro={prompt.brief}>
    {!result && <div className={`${panel} flex flex-wrap justify-between gap-3`}><ol className="flex flex-wrap gap-3 text-sm">{phaseNames.map((name, index) => <li key={name} aria-current={phase === index ? 'step' : undefined} className={phase === index ? 'font-bold text-cyan-200' : 'text-slate-500'}>{index + 1}. {name}</li>)}</ol><span aria-label="Time remaining" className="font-mono text-amber-200">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</span></div>}
    {phase === 0 && <section className={`${panel} space-y-4`}><h2 className="text-xl font-bold text-violet-200">1. Clarify</h2><p className="text-sm text-slate-400">Choose the questions you would ask before proposing a system. Some questions help, some distract, and some make unsafe assumptions.</p>{clarifyOptions.map((option, index) => <label key={option.text} className="flex items-start gap-3 text-sm text-slate-200"><input type="checkbox" className="mt-1 accent-cyan-300" checked={clarify.includes(index)} onChange={() => setClarify(old => toggle(old, index))} />{option.text}</label>)}<button className={action} onClick={() => setPhase(1)}>Reveal requirements & estimate</button></section>}
    {phase > 0 && !result && <section className={panel}><h2 className="font-bold text-slate-100">Agreed requirements</h2><ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-300">{prompt.requirements.map(requirement => <li key={requirement}>{requirement}</li>)}</ul></section>}
    {phase === 1 && <section className={`${panel} space-y-5`}><h2 className="text-xl font-bold text-violet-200">2. Estimate</h2><p className="text-sm leading-relaxed text-slate-300">Assume {prompt.registered.toLocaleString()} registered users, {prompt.activeFraction * 100}% active daily, {prompt.requestsPerUser} requests per active user per day and a {prompt.peakFactor}× peak. Each active user writes {prompt.writesPerUser} records/day, at {prompt.bytesPerWrite.toLocaleString()} bytes each, retained for {prompt.retentionDays} days. Use 86,400 seconds/day and 10⁹ bytes/GB. Exclude replicas and indexes. Answers within 20% earn credit.</p><div className="grid gap-4 sm:grid-cols-2">{estimateLabels.map((label, index) => <label key={label} className="text-sm text-slate-300">{label}<input className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-cyan-200" type="number" min={0} step="any" value={estimates[index]} onChange={event => setEstimates(old => old.map((value, i) => i === index ? event.target.value : value))} /></label>)}</div><button className={action} disabled={estimates.some(value => value.trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0)} onClick={() => setPhase(2)}>Continue to design</button></section>}
    {phase === 2 && <section className="space-y-4"><div className={panel}><h2 className="text-xl font-bold text-violet-200">3. Design & stress test</h2><p className="mt-2 text-sm text-slate-300">Budget: 3,600 credits. The simulation samples the workload at 700 → 1,200 requests/s for 60 seconds, with one web server crashing at 25s and recovering at 40s. Your production estimates remain part of the interview rubric.</p><p className="mt-2 text-sm text-amber-200">{designCost(graph)} / 3,600 credits · Structural score: {structural.score}%</p></div>
      {testing ? <><button className={action} onClick={() => setTesting(false)}>Back to design editor</button><SubmittedRun config={config} onFinish={run => { setSimulation(run); useGame.getState().recordPracticeEvent({ type: 'mission', boss: false, passed: run.passed, uptime: run.uptime, cost: run.cost, budget: config.budget }); }} /></> : <><ArchCanvas graph={graph} editable onChange={next => { setGraph(next); setSimulation(null); }} palette={allComponents.filter(kind => !['client', 'mobile'].includes(kind))} budget={3600} locked={['client']} /><button className={action} disabled={!graph.nodes.some(n => n.kind === 'web') || designCost(graph) > 3600} onClick={() => setTesting(true)}>Submit design to simulation</button></>}
      <ul className={`${panel} space-y-2 text-sm`}>{structural.checks.map(check => <li key={check.id} className={check.passed ? 'text-emerald-300' : 'text-amber-200'}>{check.passed ? '✓' : '○'} {check.explanation}</li>)}</ul>
      {simulation && <p role="status" className={simulation.passed ? 'text-emerald-300' : 'text-rose-300'}>{simulation.passed ? 'SLOs passed. Explain the trade-offs next.' : 'SLOs failed. You can revise the design before moving on.'}</p>}
      <button className={action} disabled={!simulation} onClick={() => setPhase(3)}>Continue to deep dive</button>
    </section>}
    {phase === 3 && <section className="space-y-5"><div className={`${panel} space-y-3`}><h2 className="text-xl font-bold text-violet-200">4. Deep dive & wrap-up</h2><label className="block text-sm text-slate-300">Which bottleneck deserves the first deep dive for this prompt?<select className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3" value={bottleneck} onChange={event => setBottleneck(event.target.value)}><option value="">Choose a bottleneck</option>{bottlenecks.map(value => <option key={value}>{value}</option>)}</select></label></div>
      {aiStatus && <div className={panel}><h3 className="font-bold text-violet-200">{aiStatus}</h3>{bonus && <><p className="mt-2 text-sm text-slate-300">{bonus}</p><label className="mt-3 block text-sm text-slate-400">Your response (practice reflection)<textarea className="mt-2 block h-28 w-full rounded-lg bg-slate-950 p-3 text-slate-200" value={reflection} onChange={event => setReflection(event.target.value)} /></label><p className="mt-2 text-xs text-slate-500">The bonus question is for reflection; the scripted rubric determines your score.</p></>}</div>}
      {!quiz ? <QuizRunner questions={prompt.followups} onFinish={run => { setQuiz(run); useGame.getState().recordPracticeEvent({ type: 'quiz', maxCombo: run.maxCombo }); }} /> : <p className="text-emerald-300">Follow-ups complete: {quiz.correct} / {quiz.total}</p>}
      <div className={`${panel} space-y-3`}><h3 className="font-bold text-slate-100">Choose your wrap-up talking points</h3>{wrapOptions.map((option, index) => <label key={option.text} className="flex gap-3 text-sm text-slate-300"><input type="checkbox" className="accent-cyan-300" checked={wrap.includes(index)} onChange={() => setWrap(old => toggle(old, index))} />{option.text}</label>)}</div><button className={action} disabled={!quiz || !bottleneck} onClick={() => finish()}>Finish interview & see rubric</button>
    </section>}
    {result && <section className={`${panel} space-y-5`}><h2 className="text-3xl font-black text-cyan-200">{result.grade}</h2><p className="text-amber-200">{result.score} / 100 · +{result.xp} XP{timedOut ? ' · Time expired; uncompleted work received no credit.' : ''}</p><p className="text-sm text-slate-400">Strong Hire ≥85, Hire ≥70, Lean Hire ≥55. An architecture that fails the simulator SLOs receives No Hire; incomplete structural requirements cap the result at Lean Hire.</p><div className="grid gap-3 sm:grid-cols-2">{phaseNames.map((name, index) => <div key={name} className="rounded-xl bg-slate-950 p-4"><h3 className="font-bold text-violet-200">{name}: {Math.round(finalScores[index])}%</h3><p className="mt-1 text-xs text-slate-400">{['Scope, scale, quality guarantees and retention; premature assumptions lose credit.', 'DAU → average QPS → peak QPS; retained bytes use writes/day × retention.', 'Half topology, half passing the sampled simulation; explain how to scale the sample.', 'Identify the prompt’s bottleneck, defend three follow-ups and close with trade-offs.'][index]}</p></div>)}</div>
      <div><h3 className="font-bold text-slate-100">Estimate feedback</h3><ul className="mt-2 space-y-1 text-sm text-slate-300">{numeric.expected.map((value, index) => <li key={index}>{numeric.correct[index] ? '✓' : '○'} {estimateLabels[index]}: {value.toLocaleString('en-US', { maximumFractionDigits: 2 })} expected; your answer: {estimates[index] || 'unanswered'}</li>)}</ul></div>
      <ul className="space-y-2 text-sm">{structural.checks.map(check => <li key={check.id} className={check.passed ? 'text-emerald-300' : 'text-amber-200'}>{check.passed ? '✓' : '○'} {check.explanation}</li>)}</ul>
      <p className="text-sm text-slate-300">Recommended deep dive: {prompt.bottleneck}.</p><ul className="space-y-1 text-xs text-slate-400">{clarify.map(index => <li key={index}>{clarifyOptions[index].text} — {clarifyOptions[index].reason}</li>)}</ul><button className={action} onClick={onExit}>Choose another prompt</button>
    </section>}
  </PracticePage>;
}
