import { useMemo, useRef, useState } from 'react';
import { ArchCanvas, SimRunner } from '@/sim';
import { LabAchievements } from './LabAchievements';
import { allComponents, sandboxConfig, starterGraph } from '@/practice/config';
import { download, exportPng, parseGraph, toMermaid } from '@/practice/exports';
import { PracticePage, action, panel } from './shared';

export function SandboxScreen() {
  const [graph, setGraph] = useState(starterGraph);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState('');
  const [mermaid, setMermaid] = useState('');
  const canvas = useRef<HTMLDivElement>(null);
  const config = useMemo(() => sandboxConfig(graph), [graph]);
  return <PracticePage title="Sandbox" intro="Build without a budget limit. Export your workspace, or run an experimental copy with every slider and chaos control.">
    <div className="flex flex-wrap gap-2"><button className={action} aria-pressed={!running} onClick={() => setRunning(false)}>Workspace & exports</button><button className={action} aria-pressed={running} onClick={() => { setRunning(true); }}>Run a copy</button></div>
    {running ? <LabAchievements><p className="mb-3 text-sm text-amber-200">This run is a disposable copy. Workspace exports use the saved diagram from the editor.</p><SimRunner config={config} mode="lab" onFinish={() => { setNotice('Experiment complete. Your workspace is ready.'); setRunning(false); }} /></LabAchievements> : <>
      <div className={`${panel} flex flex-wrap items-center gap-2`}>
        <button className={action} onClick={async () => { try { const svg = canvas.current?.querySelector<SVGSVGElement>('svg[aria-label="System architecture"]'); if (!svg) throw new Error('Canvas is not ready.'); await exportPng(svg); setNotice('PNG downloaded.'); } catch (error) { setNotice(error instanceof Error ? error.message : 'PNG export failed.'); } }}>Export PNG</button>
        <button className={action} onClick={async () => { const text = toMermaid(graph); setMermaid(text); try { await navigator.clipboard.writeText(text); setNotice('Mermaid copied.'); } catch { setNotice('Copy the Mermaid text below.'); } }}>Copy Mermaid</button>
        <button className={action} onClick={() => download(JSON.stringify(graph, null, 2), 'sd-quest-architecture.json', 'application/json')}>Download JSON</button>
        <label className={`${action} cursor-pointer`}>Import JSON<input aria-label="Import JSON" type="file" accept="application/json,.json" className="sr-only" onChange={async event => { const file = event.target.files?.[0]; if (!file) return; try { if (file.size > 1000000) throw new Error('Import files must be smaller than 1 MB.'); setGraph(parseGraph(await file.text())); setNotice('Diagram imported.'); setMermaid(''); } catch (error) { setNotice(error instanceof Error ? error.message : 'Invalid graph.'); } event.target.value = ''; }} /></label>
      </div>
      <div ref={canvas}><ArchCanvas graph={graph} editable onChange={setGraph} palette={allComponents} /></div>
    </>}
    {notice && <p role="status" className="text-sm text-cyan-200">{notice}</p>}
    {mermaid && <label className="block text-sm text-slate-300">Mermaid export<textarea readOnly aria-label="Mermaid export" className="mt-2 h-48 w-full rounded-xl bg-slate-950 p-4 font-mono text-xs" value={mermaid} /></label>}
  </PracticePage>;
}
