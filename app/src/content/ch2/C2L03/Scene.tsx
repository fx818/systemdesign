import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, Chip, CrossMark, Explosion, Hotspot, Label, MONO, Panel, Stage, StatusBadge, Title,
  between, ease, fadeWindow, hash, progress, pulse, tween, typewriter,
} from '@/scenekit';
import { MONTH_S, NINES, PERIODS, downtimeSeconds, formatDuration } from '../common/numbers';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  avail: 18,
  sla: 44,
  table: 70,
  formula: 112,
  scenario: 136,
  end: 168,
} as const;

type HotspotHandler = ((id: string) => void) | undefined;
interface PartProps { time: number; interactive: boolean; onHotspot: HotspotHandler }

/* --------------------------------- Intro ---------------------------------- */
function IntroPart({ time: t }: { time: number }) {
  const vis = fadeWindow(t, 0, T.avail + 0.3, 0.6);
  if (vis <= 0) return null;
  const spin = Math.floor(t * 7);
  const shown = t < 9 ? `99.${'9'.repeat(1 + (spin % 4))}%` : '99.?%';
  return (
    <g opacity={vis}>
      <Title text="Level 3 · Count the Nines" subtitle="availability, SLAs and downtime budgets" y={70} size={32} color={C.emerald} appear={progress(t, 0.2, 1.2)} />
      <Appear p={progress(t, 1, 2, ease.outBack)} from="scale" x={640} y={300}>
        <rect x={440} y={170} width={400} height={230} rx={22} fill={C.panel} stroke={C.emerald} strokeWidth={2} />
        <text x={640} y={215} textAnchor="middle" fill={C.dim} fontSize={18} fontWeight={700}>status.pixelpost.com</text>
        <text x={640} y={310} textAnchor="middle" fill={C.white} fontSize={72} fontWeight={900} fontFamily={MONO}>{shown}</text>
        <text x={640} y={365} textAnchor="middle" fill={C.emerald} fontSize={18} fontWeight={700}>uptime (promised)</text>
      </Appear>
      <Character who="maya" mood="happy" x={210} y={600} size={130} time={t} talking={between(t, 3, 9)}
        say={t >= 3 && t < 10 ? 'I promised "a lot of nines"!' : undefined} appear={progress(t, 2, 3)} />
      <Character who="pager" mood="happy" x={1080} y={600} size={120} time={t} bubble="left" talking={between(t, 10, 16)}
        say={t >= 10 ? 'How many minutes is "a lot"?' : undefined} appear={progress(t, 9.5, 10.5)} />
    </g>
  );
}

/* ------------------------------ Availability ------------------------------ */
const DAYS = 30;
const OUTAGE = new Set([6, 17, 23]);
function AvailPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.avail, T.sla + 0.3, 0.6);
  if (vis <= 0) return null;
  const sweep = progress(t, 26, 36);
  const upDays = Array.from({ length: Math.floor(sweep * DAYS) }, (_, i) => i).filter((i) => !OUTAGE.has(i)).length;
  const seen = Math.max(1, Math.floor(sweep * DAYS));
  const pct = sweep > 0 ? (upDays / seen) * 100 : 100;
  return (
    <g opacity={vis}>
      <Title text="High availability" y={70} size={34} color={C.emerald} appear={progress(t, T.avail, T.avail + 1)} />
      <Hotspot id="availability" interactive={interactive} onClick={onHotspot} active={between(t, 20, T.sla)} x={1130} y={150} time={t} label="Availability">
        <Callout x={140} y={120} width={1000} title="Definition" color={C.emerald} size={18}
          text="The ability of a system to be continuously operational for a desirably long period of time. Measured as a percentage: 100% means zero downtime."
          appear={progress(t, 19, 20)} />
      </Hotspot>
      {Array.from({ length: DAYS }, (_, i) => {
        const on = i < sweep * DAYS;
        const bad = OUTAGE.has(i);
        return (
          <rect key={i} x={140 + i * 33.5} y={290} width={28} height={70} rx={6}
            fill={!on ? C.panel : bad ? C.rose : C.emerald} opacity={on ? 0.9 : 0.6} stroke={C.line} />
        );
      })}
      <Label x={140} y={390} text="day 1" size={14} color={C.dim} anchor="start" />
      <Label x={1140} y={390} text="day 30" size={14} color={C.dim} anchor="end" />
      {sweep > 0 && <Label x={640} y={460} text={`${pct.toFixed(1)}% of days fully up`} size={30} color={pct > 95 ? C.emerald : C.amber} weight={900} />}
      <g opacity={progress(t, 37, 38)}>
        <rect x={140} y={510} width={1000} height={34} rx={17} fill={C.panel} stroke={C.line} />
        <rect x={140 + 1000 * 0.9} y={510} width={100} height={34} rx={17} fill={`${C.amber}55`} />
        <Label x={140} y={575} text="0%" size={14} color={C.dim} anchor="start" />
        <Label x={1040} y={575} text="99% ... 100%" size={16} color={C.amber} weight={800} />
        <Label x={640} y={620} text="most real services live in this last sliver" size={18} color={C.text} />
      </g>
    </g>
  );
}

/* ---------------------------------- SLA ----------------------------------- */
function SlaPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.sla, T.table + 0.3, 0.6);
  if (vis <= 0) return null;
  const sig = typewriter('Maya, PixelPost', t, 52, 12);
  const clouds = ['Amazon', 'Google', 'Microsoft'];
  return (
    <g opacity={vis}>
      <Title text="Service level agreement (SLA)" y={70} size={34} color={C.amber} appear={progress(t, T.sla, T.sla + 1)} />
      <Hotspot id="sla" interactive={interactive} onClick={onHotspot} active={between(t, 46, T.table)} x={560} y={140} time={t} label="SLA">
        <Appear p={progress(t, 45, 46.5, ease.outBack)} from="up" x={0} y={0}>
          <rect x={120} y={140} width={430} height={460} rx={18} fill="#f8fafc" />
          <text x={335} y={190} textAnchor="middle" fill="#0f172a" fontSize={24} fontWeight={900}>Service Level Agreement</text>
          {['Provider: PixelPost', 'Customer: you', 'Uptime: 99.9% per month', 'Measured: every minute'].map((l, i) => (
            <text key={l} x={150} y={250 + i * 44} fill={i === 2 ? '#b45309' : '#334155'} fontSize={20} fontWeight={i === 2 ? 900 : 600}>{l}</text>
          ))}
          {[0, 1, 2].map((i) => <rect key={i} x={150} y={440 + i * 18} width={360 - i * 60} height={8} rx={4} fill="#cbd5e1" />)}
          <line x1={150} y1={560} x2={400} y2={560} stroke="#94a3b8" strokeWidth={2} />
          <text x={155} y={552} fill="#4c1d95" fontSize={26} fontStyle="italic" fontFamily="'Segoe Script', cursive">{sig}</text>
        </Appear>
      </Hotspot>
      <Callout x={620} y={150} width={560} title="What it is" color={C.amber} size={17}
        text="An agreement between you (the service provider) and your customer that formally defines the level of uptime your service will deliver."
        appear={progress(t, 48, 49)} />
      {clouds.map((c, i) => (
        <Appear key={c} p={progress(t, 58 + i * 1.2, 59 + i * 1.2, ease.outBack)} from="pop" x={720 + i * 180} y={420}>
          <rect x={650 + i * 180} y={360} width={150} height={120} rx={20} fill={C.panel} stroke={C.sky} strokeWidth={2} />
          <text x={725 + i * 180} y={405} textAnchor="middle" fill={C.white} fontSize={20} fontWeight={800}>{c}</text>
          <text x={725 + i * 180} y={450} textAnchor="middle" fill={C.emerald} fontSize={24} fontWeight={900} fontFamily={MONO}>≥ 99.9%</text>
        </Appear>
      ))}
      <Label x={905} y={530} text="Cloud providers set their SLAs at 99.9% or above" size={18} color={C.sky} weight={700} opacity={progress(t, 62, 63)} />
    </g>
  );
}

/* --------------------------------- Table 2-3 ------------------------------- */
function TablePart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.table, T.formula + 0.3, 0.6);
  if (vis <= 0) return null;
  const colX = [150, 400, 600, 800, 1000];
  return (
    <g opacity={vis}>
      <Title text="The nines" subtitle="allowed downtime for each availability level" y={70} size={34} color={C.violet} appear={progress(t, T.table, T.table + 1)} />
      <Hotspot id="nines" interactive={interactive} onClick={onHotspot} active={between(t, 74, T.formula)} x={1180} y={160} time={t} label="Table">
        <g>
          {['Availability', ...PERIODS.map((p) => p.label)].map((h, i) => (
            <text key={h} x={colX[i]} y={170} fill={C.dim} fontSize={18} fontWeight={800}>{h}</text>
          ))}
        </g>
      </Hotspot>
      {NINES.map((n, r) => {
        const at = 74 + r * 5;
        const p = progress(t, at, at + 0.8, ease.outCubic);
        const y = 225 + r * 72;
        const hot = between(t, at, at + 5);
        return (
          <Appear key={n} p={p} from="left" x={0} y={y}>
            <rect x={130} y={y - 38} width={1040} height={60} rx={16} fill={hot ? `${C.violet}22` : C.panel} stroke={hot ? C.violet : C.line} />
            <text x={colX[0]} y={y + 2} fill={C.white} fontSize={26} fontWeight={900} fontFamily={MONO}>{n}%</text>
            {PERIODS.map((pd, c) => (
              <text key={pd.id} x={colX[c + 1]} y={y} fill={c === 0 ? C.emerald : C.text} fontSize={21} fontWeight={c === 0 ? 800 : 600} fontFamily={MONO}
                opacity={progress(t, at + 0.6 + c * 0.4, at + 1 + c * 0.4)}>{formatDuration(downtimeSeconds(n, pd.seconds))}</text>
            ))}
            {r > 0 && <text x={1160} y={y} textAnchor="end" fill={C.amber} fontSize={14} fontWeight={800} opacity={progress(t, at + 2, at + 3)}>÷ 10</text>}
          </Appear>
        );
      })}
      <Callout x={130} y={590} width={1040} title="The pattern" color={C.amber} size={17}
        text="Every extra nine cuts allowed downtime by 10×. More nines are better, and much harder (and more expensive) to deliver."
        appear={fadeWindow(t, 100, T.formula, 0.5)} />
    </g>
  );
}

/* --------------------------------- Formula -------------------------------- */
function FormulaPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.formula, T.scenario + 0.3, 0.6);
  if (vis <= 0) return null;
  const steps = [
    { at: 114, text: 'downtime = (100% − availability) × period' },
    { at: 119, text: '99.9% per day: 0.1% × 86,400 s' },
    { at: 123, text: '= 0.001 × 86,400 s = 86.4 s' },
    { at: 127, text: '≈ 1.44 minutes per day' },
  ];
  const sand = 1 - progress(t, 126, 135);
  return (
    <g opacity={vis}>
      <Hotspot id="formula" interactive={interactive} onClick={onHotspot} active={between(t, 114, T.scenario)} x={820} y={120} time={t} label="Formula">
        <Title text="Compute it yourself" y={70} size={34} color={C.cyan} appear={progress(t, T.formula, T.formula + 1)} />
      </Hotspot>
      {steps.map((s, i) => (
        <text key={s.text} x={120} y={190 + i * 70} fill={i === 0 ? C.cyan : i === 3 ? C.emerald : C.white} fontSize={i === 0 ? 30 : 28} fontWeight={i === 0 || i === 3 ? 900 : 600} fontFamily={MONO}>
          {typewriter(s.text, t, s.at, 30)}
        </text>
      ))}
      {/* error-budget hourglass */}
      <g opacity={progress(t, 125, 126)}>
        <path d="M960 160 H1120 L1050 330 L1120 500 H960 L1030 330 Z" fill="none" stroke={C.amber} strokeWidth={4} />
        <path d={`M${975 + (1 - sand) * 60} ${160 + (1 - sand) * 150} H${1105 - (1 - sand) * 60} L1040 325 Z`} fill={C.amber} opacity={0.8} />
        <path d={`M1040 ${495 - (1 - sand) * 120} L${1040 + (1 - sand) * 55} 495 H${1040 - (1 - sand) * 55} Z`} fill={C.amber} opacity={0.8} />
        <Label x={1040} y={545} text="daily error budget" size={18} color={C.amber} weight={800} />
        <Label x={1040} y={575} text={`${(86.4 * sand).toFixed(1)} s left`} size={18} color={C.white} mono />
      </g>
    </g>
  );
}

/* --------------------------------- Scenario -------------------------------- */
function ScenarioPart({ time: t }: { time: number }) {
  const vis = fadeWindow(t, T.scenario, T.end + 1, 0.6);
  if (vis <= 0) return null;
  const budgetMin = downtimeSeconds(99.99, MONTH_S) / 60; // 4.38
  const used = tween(t, 145, 153, 0, 9, ease.linear);
  const W = 800;
  const scale = W / 10;
  const breached = used > budgetMin;
  return (
    <g opacity={vis}>
      <Title text="Did Maya break her promise?" y={70} size={34} color={C.rose} appear={progress(t, T.scenario, T.scenario + 1)} />
      <Character who="maya" mood={breached ? 'panic' : 'neutral'} x={160} y={330} size={140} time={t} talking={between(t, 137, 142)}
        say={t < 144 ? 'I promised 99.99% a month!' : undefined} appear={progress(t, 136, 137)} />
      <Panel x={330} y={170} w={880} h={300} title="This month" color={breached ? C.rose : C.emerald} tint={0.05} opacity={progress(t, 138, 139)}>
        <text x={370} y={235} fill={C.dim} fontSize={18}>99.99% of a 30.44-day month allows</text>
        <text x={370} y={275} fill={C.emerald} fontSize={30} fontWeight={900} fontFamily={MONO} opacity={progress(t, 140, 141)}>0.01% × 43,834 min ≈ {budgetMin.toFixed(2)} min</text>
        <rect x={370} y={320} width={W} height={46} rx={12} fill={C.panel2} />
        <rect x={370} y={320} width={budgetMin * scale} height={46} rx={12} fill={`${C.emerald}44`} stroke={C.emerald} />
        <rect x={370} y={320} width={Math.min(W, used * scale)} height={46} rx={12} fill={breached ? C.rose : C.amber} opacity={0.75} />
        <line x1={370 + budgetMin * scale} y1={305} x2={370 + budgetMin * scale} y2={380} stroke={C.white} strokeWidth={3} strokeDasharray="6 4" />
        <text x={370 + budgetMin * scale} y={398} textAnchor="middle" fill={C.white} fontSize={15} fontWeight={800}>budget</text>
        <text x={380} y={352} fill={C.white} fontSize={20} fontWeight={900}>{used > 0 ? `deploy: ${used.toFixed(1)} min` : ''}</text>
        {between(t, 143, 145) && <text x={370} y={440} fill={C.amber} fontSize={18} fontWeight={700}>A deploy takes the site down...</text>}
      </Panel>
      <Explosion x={370 + 9 * scale} y={343} t={progress(t, 153, 154.5)} size={90} />
      <g opacity={progress(t, 154, 155)}>
        <StatusBadge x={770} y={438} status="down" text={`SLA BREACHED · 9 min > ${budgetMin.toFixed(2)} min`} time={t} />
        <CrossMark x={1140} y={438} t={progress(t, 154, 155)} size={46} />
      </g>
      <Character who="ravi" mood="neutral" x={1110} y={650} size={110} time={t} bubble="left" talking={between(t, 158, 167)}
        say={t >= 158 ? 'Four nines leaves no room for a 9-minute deploy.' : undefined} appear={progress(t, 157, 158)} />
      {t >= 158 && (
        <g opacity={progress(t, 158, 159)}>
          {['rolling deploys', 'spare servers', 'automatic failover'].map((s, i) => (
            <Chip key={s} x={180 + i * 200} y={620} text={s} color={C.cyan} size={16} />
          ))}
        </g>
      )}
      {/* a few sparks of "pager" noise while breached */}
      {breached && t < 158 && Array.from({ length: 6 }, (_, i) => (
        <circle key={i} cx={360 + hash(i) * 860} cy={150 + hash(i + 9) * 40} r={3 + 3 * pulse(t, 0.5, i * 0.2)} fill={C.rose} opacity={0.6} />
      ))}
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = Math.max(0, Math.min(T.end, time));
  return (
    <Stage time={t} drift title="Availability numbers: SLAs, the nines table and a downtime budget">
      <IntroPart time={t} />
      <AvailPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <SlaPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <TablePart time={t} interactive={interactive} onHotspot={onHotspot} />
      <FormulaPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <ScenarioPart time={t} />
    </Stage>
  );
}

