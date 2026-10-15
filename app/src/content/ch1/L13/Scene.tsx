import type { ComponentKind, LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, Counter, Explosion, Hotspot, Link, Node, Packet, Panel, Sparkles, Stage,
  StatusBadge, Title, between, cueIndex, ease, fadeWindow, lerp, linkPath, progress, pulse, type Pt,
} from '@/scenekit';
import { CHECKLIST } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  build: 8,
  scaleOut: 24,
  edge: 41,
  global: 65,
  shards: 90,
  stress: 98,
  checklist: 118,
  beyond: 158,
  end: 176,
} as const;

/** Each of the 8 rules gets 5 s, starting at T.checklist. */
export const RULE_GAP = 5;
const ruleStart = (i: number) => T.checklist + i * RULE_GAP;

interface Piece {
  kind: ComponentKind;
  label: string;
  x: number;
  y: number;
  from: number;
  to?: number;
  /** level that introduced it (shown as a chip while it appears) */
  lvl: string;
}

/** The whole PixelPost architecture, built up in the order the chapter introduces it. */
const P: Record<string, Piece> = {
  client: { kind: 'client', label: 'Web', x: 70, y: 260, from: 8, lvl: 'L1' },
  mobile: { kind: 'mobile', label: 'Mobile', x: 70, y: 450, from: 8.4, lvl: 'L1' },
  dns: { kind: 'dns', label: 'GeoDNS', x: 230, y: 100, from: 9, lvl: 'L1' },
  web1: { kind: 'web', label: 'Web 1', x: 530, y: 260, from: 9.5, lvl: 'L1' },
  db: { kind: 'db', label: 'Master DB', x: 900, y: 360, from: 16.5, to: 90.5, lvl: 'L2' },
  lb: { kind: 'lb', label: 'Load balancer', x: 380, y: 355, from: 29, lvl: 'L4' },
  web2: { kind: 'web', label: 'Web 2', x: 530, y: 450, from: 26, lvl: 'L3' },
  replica: { kind: 'db-replica', label: 'Replica', x: 1050, y: 360, from: 33.5, to: 90.5, lvl: 'L5' },
  cache1: { kind: 'cache', label: 'Cache', x: 690, y: 150, from: 41.5, lvl: 'L6' },
  cache2: { kind: 'cache', label: 'Cache', x: 820, y: 150, from: 45.5, lvl: 'L6' },
  cdn: { kind: 'cdn', label: 'CDN', x: 230, y: 620, from: 49.5, lvl: 'L7' },
  session: { kind: 'nosql', label: 'Sessions (NoSQL)', x: 690, y: 560, from: 57.5, lvl: 'L8' },
  dc2: { kind: 'datacenter', label: 'DC 2 (US-West)', x: 1200, y: 140, from: 65.5, lvl: 'L9' },
  queue: { kind: 'queue', label: 'Queue', x: 840, y: 600, from: 74.5, lvl: 'L10' },
  worker1: { kind: 'worker', label: 'Worker', x: 970, y: 600, from: 76, lvl: 'L10' },
  worker2: { kind: 'worker', label: 'Worker', x: 1090, y: 600, from: 77, lvl: 'L10' },
  logging: { kind: 'logging', label: 'Logs', x: 1200, y: 290, from: 82.5, lvl: 'L11' },
  metrics: { kind: 'metrics', label: 'Metrics', x: 1200, y: 410, from: 83.2, lvl: 'L11' },
  ci: { kind: 'ci', label: 'CI', x: 1200, y: 530, from: 84, lvl: 'L11' },
  shard0: { kind: 'shard', label: 'Shard 0', x: 900, y: 300, from: 90.6, lvl: 'L12' },
  shard1: { kind: 'shard', label: 'Shard 1', x: 1040, y: 300, from: 90.9, lvl: 'L12' },
  shard2: { kind: 'shard', label: 'Shard 2', x: 900, y: 430, from: 91.2, lvl: 'L12' },
  shard3: { kind: 'shard', label: 'Shard 3', x: 1040, y: 430, from: 91.5, lvl: 'L12' },
};

/** Edges with the time window in which they exist. */
const E: { a: string; b: string; from: number; to?: number; label?: string }[] = [
  { a: 'client', b: 'dns', from: 9.5 },
  { a: 'mobile', b: 'dns', from: 9.8 },
  { a: 'client', b: 'web1', from: 11, to: 29 },
  { a: 'mobile', b: 'web1', from: 11.3, to: 29 },
  { a: 'web1', b: 'db', from: 17.5, to: 90.5 },
  { a: 'client', b: 'lb', from: 29.5 },
  { a: 'mobile', b: 'lb', from: 29.8 },
  { a: 'lb', b: 'web1', from: 30, label: 'private IP' },
  { a: 'lb', b: 'web2', from: 30.3 },
  { a: 'web2', b: 'db', from: 30.6, to: 90.5 },
  { a: 'db', b: 'replica', from: 34, to: 90.5, label: 'replicate' },
  { a: 'web1', b: 'cache1', from: 42 },
  { a: 'cache1', b: 'cache2', from: 46 },
  { a: 'client', b: 'cdn', from: 50 },
  { a: 'mobile', b: 'cdn', from: 50.3 },
  { a: 'web2', b: 'session', from: 58 },
  { a: 'web1', b: 'session', from: 58.3 },
  { a: 'web2', b: 'queue', from: 75 },
  { a: 'queue', b: 'worker1', from: 76.4 },
  { a: 'worker1', b: 'worker2', from: 77.4 },
  { a: 'cache2', b: 'shard0', from: 91.5 },
  { a: 'web2', b: 'shard2', from: 91.8 },
];

const LEVEL_CHIPS: { at: number; text: string }[] = [
  { at: 8, text: 'L1 · single server + DNS' },
  { at: 16, text: 'L2 · web tier / data tier' },
  { at: 24, text: 'L3-L4 · scale out + load balancer' },
  { at: 33, text: 'L5 · replication' },
  { at: 41, text: 'L6 · cache tier' },
  { at: 49, text: 'L7 · CDN' },
  { at: 57, text: 'L8 · stateless web tier' },
  { at: 65, text: 'L9 · multiple data centers' },
  { at: 74, text: 'L10 · message queue' },
  { at: 82, text: 'L11 · logging, metrics, automation' },
  { at: 90, text: 'L12 · sharding + NoSQL' },
  { at: 98, text: 'Stress test' },
];

const RULE_COLORS = [C.cyan, C.violet, C.amber, C.sky, C.orange, C.emerald, C.rose, C.cyan];

function Diagram({ time: t, interactive, onHotspot }: { time: number; interactive: boolean; onHotspot?: (id: string) => void }) {
  const rule = t >= T.checklist && t < T.beyond ? Math.min(7, Math.floor((t - T.checklist) / RULE_GAP)) : -1;
  const focus = rule >= 0 ? CHECKLIST[rule].focus : null;
  const web1Down = between(t, 103, 113);
  const present = (id: string) => {
    const p = P[id];
    return progress(t, p.from, p.from + 0.7) * (p.to === undefined ? 1 : 1 - progress(t, p.to - 0.6, p.to));
  };
  const dim = (id: string) => (focus ? (focus.includes(id) ? 1 : 0.22) : 1);
  const newest = cueIndex(t, LEVEL_CHIPS.map((c) => c.at));
  const dcPanel = progress(t, 65, 66);

  const nodeEl = (id: string) => {
    const p = P[id];
    const a = present(id);
    if (a <= 0) return null;
    const lit = focus?.includes(id) || (t < T.stress && between(t, p.from, p.from + 3));
    const state = id === 'web1' && web1Down ? 'down' : lit ? 'active' : 'idle';
    return (
      <g key={id} opacity={dim(id)}>
        <Node kind={p.kind} x={p.x} y={p.y} size={70} label={p.label} time={t} appear={a} state={state} />
      </g>
    );
  };

  const traffic = t >= 96 && t < T.checklist;
  const healthyWeb = web1Down ? ['web2'] : ['web1', 'web2'];

  return (
    <g>
      {dcPanel > 0 && (
        <g opacity={dcPanel * (focus ? (focus.includes('dc2') ? 1 : 0.3) : 0.8)}>
          <Panel x={320} y={70} w={810} h={600} title="Data center 1 (US-East)" color={C.sky} dashed tint={0.02} />
        </g>
      )}
      {E.map((e, i) => {
        const d = progress(t, e.from, e.from + 0.6) * (e.to === undefined ? 1 : 1 - progress(t, e.to - 0.6, e.to));
        if (d <= 0) return null;
        const op = focus ? (focus.includes(e.a) && focus.includes(e.b) ? 1 : 0.15) : 1;
        const down = web1Down && (e.a === 'web1' || e.b === 'web1');
        return (
          <g key={i} opacity={op}>
            <Link from={P[e.a]} to={P[e.b]} inset={40} color={C.line} draw={d} animated={!down} time={t} state={down ? 'down' : 'ok'} label={t < T.stress ? e.label : undefined} />
          </g>
        );
      })}
      {/* geo-DNS link to the second data center */}
      {present('dc2') > 0 && (
        <g opacity={focus ? (focus.includes('dc2') ? 1 : 0.15) : 1}>
          <Link from={P.dns} to={P.dc2} inset={40} color={C.sky} dashed draw={present('dc2')} label="geo-routed" />
        </g>
      )}
      {Object.keys(P)
        .filter((id) => !['session', 'dc2', 'shard0', 'shard1', 'shard2', 'shard3'].includes(id))
        .map(nodeEl)}
      <Hotspot id="session-store" interactive={interactive} onClick={onHotspot} active={t >= 58 && present('session') > 0} x={P.session.x + 40} y={P.session.y - 46} time={t} label="Shared session store">
        {nodeEl('session')}
      </Hotspot>
      <Hotspot id="geo-dc" interactive={interactive} onClick={onHotspot} active={t >= 66} x={P.dc2.x + 40} y={P.dc2.y - 46} time={t} label="Second data center">
        {nodeEl('dc2')}
      </Hotspot>
      <Hotspot id="shards" interactive={interactive} onClick={onHotspot} active={t >= 92} x={P.shard1.x + 40} y={P.shard1.y - 46} time={t} label="Sharded data tier">
        {['shard0', 'shard1', 'shard2', 'shard3'].map(nodeEl)}
      </Hotspot>

      {/* stress test traffic */}
      {traffic &&
        Array.from({ length: 40 }, (_, k) => {
          const s = 96 + k * 0.5;
          const from = k % 2 ? P.client : P.mobile;
          const web = P[healthyWeb[k % healthyWeb.length]];
          return (
            <g key={k}>
              <Packet along={[...linkPath(from, P.lb, 0, 40), ...linkPath(P.lb, web, 0, 40)]} time={t} start={s} end={s + 1.3} color={C.sky} size={6} trail={false} />
              {k % 3 === 0 && <Packet along={linkPath(from, P.cdn, 0, 40)} time={t} start={s + 0.2} end={s + 1} color={C.orange} size={5} trail={false} />}
              {k % 2 === 0 && <Packet along={linkPath(web, P.cache1, 0, 40)} time={t} start={s + 1.3} end={s + 1.9} color={C.amber} size={5} trail={false} />}
            </g>
          );
        })}
      <Explosion x={P.web1.x} y={P.web1.y} t={progress(t, 103, 104.2)} size={120} />
      {t < T.checklist && newest >= 0 && (
        <g key={newest} opacity={fadeWindow(t, LEVEL_CHIPS[newest].at, (LEVEL_CHIPS[newest + 1]?.at ?? T.checklist) - 0.2, 0.3)}>
          <Chip x={640} y={700} text={LEVEL_CHIPS[newest].text} color={C.emerald} filled size={17} />
        </g>
      )}
    </g>
  );
}

function ChecklistPanel({ time: t, interactive, onHotspot }: { time: number; interactive: boolean; onHotspot?: (id: string) => void }) {
  const vis = fadeWindow(t, T.checklist - 0.5, T.beyond + 0.4, 0.6);
  if (vis <= 0) return null;
  return (
    <g opacity={vis}>
      <Hotspot id="checklist" interactive={interactive} onClick={onHotspot} active={t >= ruleStart(7)} x={440} y={110} time={t} label="The 8 rules">
        <Panel x={24} y={110} w={420} h={580} title="Scale to millions: 8 rules" color={C.amber} tint={0.04} />
      </Hotspot>
      {CHECKLIST.map((r, i) => {
        const at = ruleStart(i);
        const on = t >= at;
        const cur = between(t, at, at + RULE_GAP);
        const y = 160 + i * 66;
        return (
          <Appear key={r.id} p={progress(t, at, at + 0.6)} from="left">
            <rect x={40} y={y - 26} width={388} height={58} rx={16} fill={cur ? `${RULE_COLORS[i]}22` : 'transparent'} stroke={cur ? RULE_COLORS[i] : 'transparent'} strokeWidth={2} />
            <circle cx={70} cy={y + 3} r={17} fill={on ? RULE_COLORS[i] : C.panel2} />
            <text x={70} y={y + 9} textAnchor="middle" fill={C.bg} fontSize={17} fontWeight={900}>{i + 1}</text>
            <text x={98} y={y + 9} fill={C.white} fontSize={19} fontWeight={800}>{r.short}</text>
            <CheckMark x={405} y={y + 3} t={progress(t, at + 1, at + 1.8)} size={26} />
          </Appear>
        );
      })}
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const intro = t < 8 ? progress(t, 0.2, 1) * (1 - progress(t, 6.6, 7.6)) : 0;
  // shrink the diagram to the right while the checklist is on screen, then bring it back for the outro
  const shrink = progress(t, T.checklist - 1, T.checklist + 0.5, ease.inOutCubic) * (1 - progress(t, T.beyond, T.beyond + 1.5, ease.inOutCubic));
  const s = lerp(1, 0.64, shrink);
  const tx = lerp(0, 462, shrink);
  const ty = lerp(0, 140, shrink);
  const outro = progress(t, T.beyond + 1, T.beyond + 2);
  const rule = t >= T.checklist && t < T.beyond ? Math.min(7, Math.floor((t - T.checklist) / RULE_GAP)) : -1;
  const users = Math.round(lerp(8_000_000, 10_000_000, progress(t, 166, 170)));
  const p: Pt = { x: 640, y: 360 };
  return (
    <Stage time={t} drift title="Level 13 boss lesson: the whole architecture and the 8 rules">
      <g transform={`translate(${tx} ${ty}) scale(${s})`} opacity={1 - 0.9 * outro}>
        <Diagram time={t} interactive={interactive} onHotspot={onHotspot} />
      </g>
      <ChecklistPanel time={t} interactive={interactive} onHotspot={onHotspot} />
      {rule >= 0 && (
        <g opacity={fadeWindow(t, ruleStart(rule), ruleStart(rule) + RULE_GAP, 0.3)}>
          <Callout x={470} y={40} width={780} title={`Rule ${rule + 1}: ${CHECKLIST[rule].text}`} color={RULE_COLORS[rule]} size={15} text={CHECKLIST[rule].why} />
        </g>
      )}
      <g opacity={fadeWindow(t, T.stress - 1, T.checklist - 0.5, 0.4)}>
        <StatusBadge x={640} y={40} status={between(t, 103, 113) ? 'warn' : 'ok'} text={between(t, 103, 113) ? 'web 1 down · still serving' : 'all systems go'} time={t} />
      </g>

      {/* outro */}
      {outro > 0 && (
        <g>
          <Title text="Scaling is an iterative process" subtitle="Keep iterating · split into even smaller services" y={140} appear={outro} color={C.emerald} size={36} />
          <Appear p={progress(t, 162, 163)} from="up">
            {['web', 'queue', 'cache', 'shard', 'cdn', 'metrics'].map((k, i) => {
              const a = (i / 6) * Math.PI * 2 + t * 0.4;
              return (
                <Node key={k} kind={k as ComponentKind} x={p.x + Math.cos(a) * 190} y={p.y + 40 + Math.sin(a) * 110} size={64} label="" time={t} state="active" />
              );
            })}
            <circle cx={p.x} cy={p.y + 40} r={56 + 6 * pulse(t, 1.4)} fill={`${C.emerald}22`} stroke={C.emerald} strokeWidth={3} />
            <text x={p.x} y={p.y + 50} textAnchor="middle" fill={C.white} fontSize={30} fontWeight={900}>You</text>
          </Appear>
          <Character who="ravi" mood="proud" x={170} y={560} size={130} time={t} talking={between(t, 166, 171)} appear={progress(t, 165, 166)}
            say="This is your foundation. Now go win launch night." bubble="right" />
          <Character who="maya" mood="happy" x={1110} y={560} size={130} time={t} talking={between(t, 171, 175)} appear={progress(t, 170, 171)}
            say="Ad goes live in 3... 2... 1..." bubble="left" />
          <Sparkles x={640} y={400} t={progress(t, 170, 172)} radius={260} />
        </g>
      )}
      <Counter x={1140} y={680} value={users} time={t} bump={t > 166} />

      {intro > 0 && (
        <g>
          <rect width={1280} height={720} fill={C.bg} opacity={0.85 * intro} />
          <Title text="Launch Night" kicker="BOSS · LEVEL 13 · 10M USERS" subtitle="Everything you learned. One shot." y={330} appear={intro} color={C.amber} size={60} />
          <g opacity={intro * (0.6 + 0.4 * pulse(t, 0.6))}>
            <StatusBadge x={640} y={460} status="warn" text="Super Bowl ad airs tonight" time={t} />
          </g>
        </g>
      )}
    </Stage>
  );
}
