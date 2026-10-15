import type { ComponentKind, LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, Counter, CrossMark, Hotspot, KindIcon, Label, Link, MONO, Meter, Node, Packet,
  Panel, Smoke, Sparkles, Stage, StatusBadge, Title, between, clamp, ease, fadeWindow, lerp, linkPath, progress, pulse, stagger,
  tween, typewriter, type Pt,
} from '@/scenekit';
import { CI_STEPS, DASH_SERIES, HOST_METRICS, LOGS } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  scale: 15,
  logging: 38,
  metrics: 78,
  automation: 118,
  fig: 146,
  end: 176,
} as const;

type PartProps = { time: number; interactive: boolean; onHotspot?: (id: string) => void };

/** A tiny line chart revealed left-to-right by `p` (0..1). (x, y) is the top-left corner. */
function Spark({ x, y, w, h, values, color, p = 1 }: { x: number; y: number; w: number; h: number; values: number[]; color: string; p?: number }) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const n = Math.max(2, Math.ceil(clamp(p) * values.length));
  const pts = values.slice(0, n).map((v, i) => `${x + (i / (values.length - 1)) * w},${y + h - ((v - lo) / span) * h}`);
  if (p <= 0) return null;
  return (
    <g>
      <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={10} fill={C.panel2} opacity={0.5} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" filter="url(#sk-glow)" />
    </g>
  );
}

/* --------------------------- Chapter 1: 3 AM page -------------------------- */
const GRID: Pt[] = Array.from({ length: 8 }, (_, i) => ({ x: 370 + (i % 4) * 160, y: 260 + Math.floor(i / 4) * 190 }));
const SICK = 6;

function IntroPart({ time: t }: PartProps) {
  const vis = fadeWindow(t, 0, T.scale + 0.4, 0.5);
  if (vis <= 0) return null;
  const hop = Math.floor(clamp((t - 8) / 0.9, 0, 7.99));
  const scanning = between(t, 8, 15);
  const lens = GRID[hop];
  return (
    <g opacity={vis}>
      <rect width={1280} height={720} fill="#000" opacity={0.35} />
      {GRID.map((p, i) => (
        <g key={i}>
          <Node kind="web" x={p.x} y={p.y} size={100} label={`web-${i + 1}`} time={t} appear={progress(t, 0.4 + i * 0.1, 1 + i * 0.1)}
            state={i === SICK ? 'busy' : scanning && hop === i ? 'active' : 'idle'} />
          <text x={p.x} y={p.y - 66} textAnchor="middle" fill={C.amber} fontSize={30} fontWeight={900} opacity={between(t, 3, 8) ? 0.4 + 0.6 * pulse(t, 1, i * 0.13) : 0}>
            ?
          </text>
        </g>
      ))}
      <Smoke x={GRID[SICK].x} y={GRID[SICK].y - 40} time={t} intensity={0.5} seed={11} />
      {scanning && (
        <g transform={`translate(${lens.x + 38} ${lens.y + 30})`}>
          <circle r={26} fill="none" stroke={C.cyan} strokeWidth={5} />
          <line x1={18} y1={18} x2={42} y2={42} stroke={C.cyan} strokeWidth={7} strokeLinecap="round" />
        </g>
      )}
      {scanning && (
        <g>
          <rect x={470} y={600} width={340} height={44} rx={22} fill={C.panel} stroke={C.line} />
          <text x={640} y={629} textAnchor="middle" fill={C.text} fontSize={18} fontFamily={MONO}>
            ssh web-{hop + 1} · reading logs… {hop + 1}/8
          </text>
        </g>
      )}
      <Character who="pager" mood="panic" x={130} y={300} size={120} time={t} talking={between(t, 1, 7)} appear={progress(t, 0.5, 1.2)}
        say="03:04 AM. Upload errors 33%. Which server? No idea!" bubble="right" />
      <Character who="ravi" mood="neutral" x={1170} y={630} size={100} time={t} talking={between(t, 11, 15)} appear={fadeWindow(t, 10.5, T.scale + 1, 0.4)}
        say="One box at a time? At this size you need eyes on everything at once." bubble="left" />
    </g>
  );
}

/* --------------------- Chapter 2: small site vs big business ------------------- */
function ScalePart({ time: t }: PartProps) {
  const vis = fadeWindow(t, T.scale, T.logging + 0.4, 0.5);
  if (vis <= 0) return null;
  const big = Array.from({ length: 15 }, (_, i) => ({ x: 750 + (i % 5) * 92, y: 230 + Math.floor(i / 5) * 92 }));
  const tools = [
    { kind: 'logging' as const, title: 'Logging', color: C.cyan },
    { kind: 'metrics' as const, title: 'Metrics', color: C.violet },
    { kind: 'ci' as const, title: 'Automation', color: C.emerald },
  ];
  const toolsOn = progress(t, 29, 30);
  return (
    <g opacity={vis}>
      <g opacity={1 - 0.75 * toolsOn}>
        <Panel x={70} y={150} w={480} h={360} title="Small site · a few servers" color={C.sky} opacity={progress(t, 15.5, 16.5)} />
        <Node kind="web" x={220} y={320} size={96} time={t} appear={progress(t, 16, 16.8)} />
        <Node kind="db" x={400} y={320} size={96} time={t} appear={progress(t, 16.3, 17.1)} />
        <Chip x={310} y={460} text="nice to have" color={C.sky} appear={progress(t, 18, 18.6)} size={20} />
        <Panel x={700} y={150} w={510} h={360} title="Large business · 5M users" color={C.amber} opacity={progress(t, 24, 25)} />
        {big.map((p, i) => (
          <Node key={i} kind={i % 5 === 4 ? 'db' : i % 5 === 3 ? 'cache' : 'web'} x={p.x} y={p.y} size={70} label="" time={t}
            appear={progress(t, stagger(i, 24.4, 0.08), stagger(i, 24.9, 0.08))} />
        ))}
        <Chip x={955} y={470} text="essential" color={C.amber} filled appear={progress(t, 26.5, 27.1)} size={20} />
      </g>
      {tools.map((tool, i) => {
        const p = progress(t, stagger(i, 30, 1), stagger(i, 30.8, 1), ease.outBack);
        const cx = 330 + i * 310;
        return (
          <Appear key={tool.kind} p={p} from="pop" x={cx} y={360}>
            <rect x={cx - 120} y={250} width={240} height={220} rx={28} fill={C.panel} stroke={tool.color} strokeWidth={3} />
            <g transform={`translate(${cx} 335)`}>
              <KindIcon kind={tool.kind} size={110} color={tool.color} activity={pulse(t, 1.2, i * 0.3)} />
            </g>
            <text x={cx} y={438} textAnchor="middle" fill={C.white} fontSize={26} fontWeight={800}>{tool.title}</text>
          </Appear>
        );
      })}
      <Title text="Three toolboxes" y={110} size={32} appear={toolsOn} color={C.emerald} />
    </g>
  );
}

/* ------------------------------ Chapter 3: Logging ----------------------------- */
const LOG_HOSTS = ['web-1', 'web-2', 'web-3'] as const;
const HOST_Y = [190, 360, 530];
const HUB: Pt = { x: 640, y: 360 };
const levelColor = (l: string) => (l === 'ERROR' ? C.rose : l === 'WARN' ? C.amber : C.dim);

function LoggingPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.logging, T.metrics + 0.4, 0.5);
  if (vis <= 0) return null;
  const central = progress(t, 53, 55);
  const hunt = between(t, 44, 53);
  const huntIdx = Math.floor(clamp((t - 44) / 3, 0, 2.99));
  const searchOn = progress(t, 60, 61);
  const query = typewriter('level:ERROR', t, 63.5, 7);
  const filtered = LOGS.filter((l) => l.level === 'ERROR');
  const shown = t >= 66 ? filtered : LOGS.slice(Math.floor((t - 58) * 2) % 8, Math.floor((t - 58) * 2) % 8 + 6);
  const culprit = t >= 68;
  return (
    <g opacity={vis}>
      <Title text="Logging" subtitle="Monitor error logs to find problems" y={64} size={30} appear={progress(t, T.logging, T.logging + 1)} color={C.cyan} />
      {LOG_HOSTS.map((h, i) => {
        const y = HOST_Y[i];
        const lines = LOGS.filter((l) => l.host === h);
        const off = Math.floor(t * 0.8 + i) % lines.length;
        const sick = h === 'web-3';
        const cardX = 230;
        return (
          <g key={h}>
            <Node kind="web" x={110} y={y} size={88} label={h} time={t} appear={progress(t, 38.5 + i * 0.3, 39.3 + i * 0.3)}
              state={sick && t > 40 ? 'busy' : hunt && huntIdx === i ? 'active' : 'idle'} />
            <Appear p={progress(t, 41 + i * 0.4, 42 + i * 0.4)} from="left">
              <rect x={cardX} y={y - 52} width={250} height={104} rx={14} fill={C.panel} stroke={hunt && huntIdx === i ? C.cyan : C.line} strokeWidth={2} />
              <text x={cardX + 12} y={y - 32} fill={C.dim} fontSize={12} fontFamily={MONO}>/var/log/{h}.log</text>
              {[0, 1, 2].map((k) => {
                const l = lines[(off + k) % lines.length];
                return (
                  <text key={k} x={cardX + 12} y={y - 10 + k * 22} fill={levelColor(l.level)} fontSize={12} fontFamily={MONO}>
                    {`${l.ts.slice(0, 5)} ${l.level.padEnd(5)} ${l.msg.slice(0, 19)}`}
                  </text>
                );
              })}
            </Appear>
            {central > 0 && (
              <>
                <Link from={{ x: cardX + 250, y }} to={HUB} inset={0} color={C.cyan} animated time={t} draw={progress(t, 53 + i * 0.4, 54.5 + i * 0.4)} />
                {Array.from({ length: 8 }, (_, k) => {
                  const s = 55 + k * 2.2 + i * 0.7;
                  return <Packet key={k} along={linkPath({ x: cardX + 250, y }, HUB, 0, 40)} time={t} start={s} end={s + 1} color={levelColor(lines[k % lines.length].level)} size={6} trail={false} />;
                })}
              </>
            )}
          </g>
        );
      })}
      {hunt && (
        <Callout x={230} y={600} width={420} title="Per-server logs" color={C.amber} size={15}
          text="Fine for a few machines. With dozens, you hunt file by file." appear={fadeWindow(t, 44, 53, 0.4)} />
      )}
      <Hotspot id="central-logs" interactive={interactive} onClick={onHotspot} active={t >= 56} x={HUB.x + 52} y={HUB.y - 62} time={t} label="Central logging">
        <Node kind="logging" x={HUB.x} y={HUB.y} size={110} label="Central logs" time={t} appear={central} state={t > 55 ? 'active' : 'idle'} />
      </Hotspot>
      {searchOn > 0 && (
        <Appear p={searchOn} from="right">
          <Link from={HUB} to={{ x: 760, y: 360 }} inset={58} color={C.cyan} />
          <rect x={760} y={130} width={490} height={470} rx={22} fill={C.panel} stroke={C.cyan} strokeWidth={2} />
          <text x={786} y={168} fill={C.cyan} fontSize={16} fontWeight={800}>logs.pixelpost.internal</text>
          <rect x={786} y={186} width={438} height={44} rx={12} fill={C.panel2} stroke={C.line} />
          <text x={804} y={215} fill={C.white} fontSize={17} fontFamily={MONO}>
            🔍 {query}
            {t > 63 && t < 67 && pulse(t, 0.8) > 0.5 ? '▌' : ''}
          </text>
          {shown.map((l, i) => {
            const hl = culprit && l.clue;
            return (
              <g key={`${l.ts}-${i}`} opacity={t >= 66 ? progress(t, 66 + i * 0.15, 66.4 + i * 0.15) : 1}>
                {hl && <rect x={780} y={248 + i * 46} width={450} height={40} rx={10} fill={`${C.rose}26`} stroke={C.rose} />}
                <text x={792} y={266 + i * 46} fill={C.dim} fontSize={12} fontFamily={MONO}>{l.ts} · {l.host}</text>
                <text x={792} y={282 + i * 46} fill={levelColor(l.level)} fontSize={13} fontFamily={MONO}>{l.msg.slice(0, 52)}</text>
              </g>
            );
          })}
          {culprit && <StatusBadge x={1005} y={560} status="down" text="web-3: disk full" time={t} />}
        </Appear>
      )}
      <Sparkles x={1005} y={560} t={progress(t, 68.5, 70)} />
      <Callout x={300} y={600} width={420} title="One search, every server" color={C.cyan} size={15}
        text="Aggregated logs are easy to search and view in one place." appear={fadeWindow(t, 72, T.metrics, 0.4)} />
    </g>
  );
}

/* ------------------------------ Chapter 4: Metrics ----------------------------- */
const COLS = [
  { x: 40, title: 'Host level', color: C.cyan, at: 88 },
  { x: 450, title: 'Aggregated level', color: C.violet, at: 98 },
  { x: 860, title: 'Key business', color: C.amber, at: 108 },
];

function MetricsPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.metrics, T.automation + 0.4, 0.5);
  if (vis <= 0) return null;
  const sample = Math.floor(clamp((t - 88) / 1.2, 0, 11));
  const err = DASH_SERIES.find((s) => s.id === 'err');
  const dbq = DASH_SERIES.find((s) => s.id === 'dbq');
  const hit = DASH_SERIES.find((s) => s.id === 'hit');
  const biz = [
    { label: 'Daily active users', value: `${(tween(t, 109, 112, 0, 2.1, ease.outCubic)).toFixed(1)}M`, color: C.amber },
    { label: '30-day retention', value: `${Math.round(tween(t, 110, 113, 0, 41, ease.outCubic))}%`, color: C.emerald },
    { label: 'Revenue today', value: `$${(tween(t, 111, 114, 0, 18.4, ease.outCubic)).toFixed(1)}K`, color: C.violet },
  ];
  return (
    <g opacity={vis}>
      <Title text="Metrics" subtitle="Health of the system + business insight" y={64} size={30} appear={progress(t, T.metrics, T.metrics + 1)} color={C.violet} />
      <Hotspot id="metric-types" interactive={interactive} onClick={onHotspot} active={t >= 108} x={1230} y={140} time={t} label="Three kinds of metrics">
        {COLS.map((c) => (
          <Panel key={c.title} x={c.x} y={140} w={380} h={470} title={c.title} color={c.color} tint={0.04} opacity={progress(t, c.at - 4, c.at - 3)} />
        ))}
      </Hotspot>
      {/* host */}
      {(['web-1', 'web-2', 'web-3'] as const).map((h, i) => {
        const m = HOST_METRICS[h];
        const y = 220 + i * 120;
        return (
          <Appear key={h} p={progress(t, 85 + i * 0.5, 86 + i * 0.5)} from="left">
            <Node kind="web" x={90} y={y + 16} size={56} label="" time={t} state={h === 'web-3' && t > 93 ? 'busy' : 'idle'} />
            <Label x={130} y={y - 14} anchor="start" text={h} size={16} weight={800} color={C.white} />
            <Meter x={130} y={y + 14} w={78} value={m.cpu[sample] / 100} label="CPU" color={C.cyan} />
            <Meter x={218} y={y + 14} w={78} value={m.mem[sample] / 100} label="Mem" color={C.sky} />
            <Meter x={306} y={y + 14} w={92} value={m.disk[sample] / 100} label="Disk" />
          </Appear>
        );
      })}
      <Callout x={50} y={545} width={360} color={C.rose} size={14} title="web-3 disk at 100%" text="Host metrics point at the exact machine."
        appear={fadeWindow(t, 94, 100, 0.4)} pointTo={{ x: 360, y: 470 }} />
      {/* aggregated */}
      {dbq && <Label x={480} y={214} anchor="start" text="DB tier p95 query time" size={15} color={C.text} opacity={progress(t, 98, 99)} />}
      {dbq && <Spark x={484} y={226} w={310} h={60} values={dbq.values} color={C.violet} p={progress(t, 98, 101)} />}
      {hit && <Label x={480} y={334} anchor="start" text="Cache tier hit rate" size={15} color={C.text} opacity={progress(t, 102, 103)} />}
      {hit && <Spark x={484} y={346} w={310} h={60} values={hit.values} color={C.emerald} p={progress(t, 102, 105)} />}
      {err && <Label x={480} y={454} anchor="start" text="Web tier error rate" size={15} color={C.text} opacity={progress(t, 104, 105)} />}
      {err && <Spark x={484} y={466} w={310} h={60} values={err.values} color={C.rose} p={progress(t, 104, 107)} />}
      <Chip x={640} y={580} text="whole tiers at a glance" color={C.violet} appear={progress(t, 106, 106.6)} size={14} />
      {/* business */}
      {biz.map((b, i) => (
        <Appear key={b.label} p={progress(t, 108.5 + i * 0.5, 109.3 + i * 0.5)} from="up">
          <text x={1050} y={250 + i * 120} textAnchor="middle" fill={b.color} fontSize={46} fontWeight={900}>{b.value}</text>
          <text x={1050} y={280 + i * 120} textAnchor="middle" fill={C.text} fontSize={16} fontWeight={600}>{b.label}</text>
        </Appear>
      ))}
      <Chip x={1050} y={580} text="is the business healthy?" color={C.amber} appear={progress(t, 113, 113.6)} size={14} />
    </g>
  );
}

/* ---------------------------- Chapter 5: Automation ---------------------------- */
const STAGE_X = [200, 480, 760, 1040];
const STAGE_KIND = ['client', 'worker', 'ci', 'web'] as const;
const PIPE_Y = 330;

function AutomationPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.automation, T.fig + 0.4, 0.5);
  if (vis <= 0) return null;
  const good = progress(t, 123, 128);
  const bad = progress(t, 129, 132);
  const goodX = lerp(90, 1180, good);
  const badX = lerp(90, STAGE_X[2], bad);
  const caught = t >= 132;
  const autoOn = progress(t, 138, 139);
  return (
    <g opacity={vis}>
      <Title text="Automation & continuous integration" y={64} size={30} appear={progress(t, T.automation, T.automation + 1)} color={C.emerald} />
      <Hotspot id="ci" interactive={interactive} onClick={onHotspot} active={t >= 124} x={1150} y={PIPE_Y - 90} time={t} label="Continuous integration">
        <rect x={90} y={PIPE_Y - 80} width={1090} height={160} rx={30} fill={C.panel} stroke={C.line} opacity={progress(t, 119, 120)} />
      </Hotspot>
      {CI_STEPS.map((s, i) => {
        const x = STAGE_X[i];
        const lit = (between(t, 123, 129) && goodX >= x) || (t >= 129 && t < 138 && badX >= x && i < 3) || autoOn > 0;
        const fail = caught && i === 2 && t < 138;
        const col = fail ? C.rose : lit ? C.emerald : C.dim;
        return (
          <Appear key={s} p={progress(t, stagger(i, 119.5, 0.5), stagger(i, 120.3, 0.5))} from="pop" x={x} y={PIPE_Y}>
            <rect x={x - 100} y={PIPE_Y - 55} width={200} height={110} rx={22} fill={`${col}1a`} stroke={col} strokeWidth={3} />
            <g transform={`translate(${x} ${PIPE_Y - 12})`}>
              <KindIcon kind={STAGE_KIND[i]} size={52} color={col} activity={lit ? pulse(t, 0.6) : 0.2} />
            </g>
            <text x={x} y={PIPE_Y + 38} textAnchor="middle" fill={C.white} fontSize={18} fontWeight={800}>{s}</text>
            {i < 3 && <path d={`M${x + 104} ${PIPE_Y} H${x + 176} M${x + 166} ${PIPE_Y - 9} L${x + 176} ${PIPE_Y} L${x + 166} ${PIPE_Y + 9}`} stroke={C.line} strokeWidth={3} fill="none" />}
          </Appear>
        );
      })}
      {between(t, 123, 128.2) && <Packet along={[{ x: 90, y: PIPE_Y - 70 }, { x: 1180, y: PIPE_Y - 70 }]} t={good} color={C.emerald} label="commit a1f" shape="envelope" />}
      {between(t, 129, 138) && <Packet along={[{ x: 90, y: PIPE_Y - 70 }, { x: STAGE_X[2], y: PIPE_Y - 70 }]} t={bad} color={C.rose} label="commit 7bd (bug)" shape="envelope" />}
      <CheckMark x={1140} y={PIPE_Y - 70} t={progress(t, 127.5, 128.5) * (1 - progress(t, 129, 129.3))} size={40} />
      <CrossMark x={STAGE_X[2]} y={PIPE_Y + 100} t={progress(t, 132, 133) * (1 - progress(t, 138, 138.4))} size={56} />
      <Callout x={640} y={470} width={420} title="Caught early" color={C.rose} size={15}
        text="The automated tests fail, so the bug never reaches users. The developer fixes it right away."
        appear={fadeWindow(t, 133, 138, 0.4)} pointTo={{ x: STAGE_X[2], y: PIPE_Y + 60 }} />
      <Character who="player" mood={caught && t < 138 ? 'worried' : 'happy'} x={140} y={560} size={110} time={t} talking={between(t, 123, 126) || between(t, 139, 144)}
        appear={progress(t, 120, 121)} say={t < 138 ? 'git push…' : 'Build, test, deploy: all automatic!'} bubble="right" />
      {autoOn > 0 && (
        <Appear p={autoOn} from="up">
          <g transform={`translate(1000 560) rotate(${t * 60})`}>
            <KindIcon kind="worker" size={80} color={C.emerald} activity={1} />
          </g>
          <Meter x={700} y={600} w={220} value={tween(t, 139, 143, 0.35, 0.9)} label="Developer productivity" color={C.emerald} />
        </Appear>
      )}
    </g>
  );
}

/* ---------------------------- Chapter 6: Figure 1-19 --------------------------- */
const F: Record<string, Pt> = {
  client: { x: 90, y: 260 }, mobile: { x: 90, y: 440 }, dns: { x: 270, y: 110 }, cdn: { x: 270, y: 600 },
  lb: { x: 480, y: 355 }, web1: { x: 630, y: 270 }, web2: { x: 630, y: 440 },
  cache: { x: 800, y: 250 }, db: { x: 960, y: 250 }, replica: { x: 1120, y: 250 },
  nosql: { x: 800, y: 455 }, queue: { x: 960, y: 455 }, worker: { x: 1120, y: 455 },
  logging: { x: 470, y: 645 }, metrics: { x: 660, y: 645 }, ci: { x: 910, y: 645 },
};
const FIG_EDGES: [string, string][] = [
  ['client', 'dns'], ['mobile', 'dns'], ['client', 'cdn'], ['mobile', 'cdn'], ['client', 'lb'], ['mobile', 'lb'],
  ['lb', 'web1'], ['lb', 'web2'], ['web1', 'cache'], ['cache', 'db'], ['db', 'replica'], ['web2', 'nosql'], ['web2', 'queue'], ['queue', 'worker'],
];

function FigPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.fig, T.end + 1, 0.5);
  if (vis <= 0) return null;
  const order = ['client', 'mobile', 'dns', 'cdn', 'lb', 'web1', 'web2', 'cache', 'db', 'replica', 'nosql', 'queue', 'worker'];
  const ap = (id: string) => progress(t, 147 + order.indexOf(id) * 0.3, 147.6 + order.indexOf(id) * 0.3);
  const queueHi = between(t, 156, 161);
  const toolsP = progress(t, 161, 162.5);
  const kinds: Record<string, ComponentKind> = {
    client: 'client', mobile: 'mobile', dns: 'dns', cdn: 'cdn', lb: 'lb', web1: 'web', web2: 'web', cache: 'cache', db: 'db',
    replica: 'db-replica', nosql: 'nosql', queue: 'queue', worker: 'worker',
  };
  const labels: Record<string, string> = {
    client: 'Web', mobile: 'Mobile', dns: 'DNS', cdn: 'CDN', lb: 'Load balancer', web1: 'Web 1', web2: 'Web 2', cache: 'Cache',
    db: 'Master DB', replica: 'Replica', nosql: 'Sessions', queue: 'Queue', worker: 'Workers',
  };
  return (
    <g opacity={vis}>
      <Label x={640} y={50} text="Figure 1-19 · message queue + tools (one data center shown)" anchor="middle" size={22} weight={800} color={C.white} opacity={progress(t, 146, 147)} />
      <Panel x={400} y={160} w={840} h={390} title="Data center 1" color={C.sky} dashed opacity={progress(t, 147, 148)} />
      {FIG_EDGES.map(([a, b], i) => (
        <Link key={i} from={F[a]} to={F[b]} inset={44} color={C.line} draw={Math.min(ap(a), ap(b))} animated={t > 152} time={t}
          state={queueHi && (a === 'queue' || b === 'queue') ? 'hot' : 'ok'} />
      ))}
      {order.map((id) => (
        <Node key={id} kind={kinds[id]} x={F[id].x} y={F[id].y} size={78} label={labels[id]} time={t} appear={ap(id)}
          state={(queueHi && (id === 'queue' || id === 'worker')) ? 'active' : 'idle'} />
      ))}
      {Array.from({ length: 6 }, (_, k) => {
        const s = 156 + k * 0.8;
        return <Packet key={k} along={linkPath(F.queue, F.worker, 0, 44)} time={t} start={s} end={s + 0.8} color={C.amber} size={6} />;
      })}
      <Callout x={430} y={575} width={420} title="Message queue" color={C.amber} size={14}
        text="More loosely coupled and more failure resilient." appear={fadeWindow(t, 156, 161, 0.4)} pointTo={{ x: F.queue.x - 20, y: F.queue.y + 40 }} />
      <Hotspot id="tools" interactive={interactive} onClick={onHotspot} active={t >= 163} x={1090} y={600} time={t} label="Tools">
        <g opacity={toolsP}>
          <rect x={420} y={592} width={680} height={106} rx={22} fill={`${C.emerald}12`} stroke={C.emerald} strokeWidth={2} strokeDasharray="8 6" />
          <Node kind="logging" x={F.logging.x} y={F.logging.y} size={64} label="" time={t} state="active" />
          <Node kind="metrics" x={F.metrics.x} y={F.metrics.y} size={64} label="" time={t} state="active" />
          <Node kind="ci" x={F.ci.x} y={F.ci.y} size={64} label="" time={t} state="active" />
          <Label x={F.logging.x + 42} y={F.logging.y + 6} anchor="start" text="Logging" size={16} weight={700} color={C.text} />
          <Label x={F.metrics.x + 42} y={F.metrics.y + 6} anchor="start" text="Monitoring · metrics" size={16} weight={700} color={C.text} />
          <Label x={F.ci.x + 42} y={F.ci.y + 6} anchor="start" text="Automation" size={16} weight={700} color={C.text} />
        </g>
      </Hotspot>
      <Character who="maya" mood="happy" x={1200} y={640} size={90} time={t} talking={between(t, 166, 170)} appear={fadeWindow(t, 165.5, 171, 0.4)}
        say="5 million users and I slept all night!" bubble="left" />
      <Character who="ravi" mood="worried" x={1200} y={640} size={90} time={t} talking={between(t, 171.5, 175)} appear={fadeWindow(t, 171, T.end + 2, 0.4)}
        say="Enjoy it. The database is getting crowded…" bubble="left" />
      <Counter x={1140} y={50} value={5_000_000} time={t} bump={t > 166} />
      <Sparkles x={1140} y={50} t={progress(t, 166, 167.5)} />
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const intro = t < 7 ? progress(t, 0.2, 1) * (1 - progress(t, 5.2, 6.2)) : 0;
  const props = { time: t, interactive, onHotspot };
  return (
    <Stage time={t} drift title="Level 11 lesson: logging, metrics and automation">
      {t < T.fig && <Counter x={1140} y={50} value={5_000_000} time={t} bump={between(t, 0, 3)} />}
      <IntroPart {...props} />
      <ScalePart {...props} />
      <LoggingPart {...props} />
      <MetricsPart {...props} />
      <AutomationPart {...props} />
      <FigPart {...props} />
      {intro > 0 && (
        <g>
          <rect width={1280} height={720} fill={C.bg} opacity={0.8 * intro} />
          <Title text="Eyes on the System" kicker="LEVEL 11 · 5M USERS" subtitle="Logging, metrics and automation" y={330} appear={intro} color={C.cyan} />
          <g opacity={intro * (0.6 + 0.4 * pulse(t, 0.6))}>
            <StatusBadge x={640} y={450} status="down" text="03:04 · upload errors 33%" time={t} />
          </g>
        </g>
      )}
    </Stage>
  );
}
