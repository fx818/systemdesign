import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, Counter, Hotspot, KindIcon, Label, MONO, Panel, Sparkles, Stage, Title,
  between, ease, fadeWindow, progress, pulse, typewriter, wrapText,
} from '@/scenekit';
import { BOSS, PIXELPOST } from '../common/numbers';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  assume: 18,
  qps: 48,
  peak: 82,
  storage: 104,
  tips: 140,
  end: 176,
} as const;

type HotspotHandler = ((id: string) => void) | undefined;
interface PartProps { time: number; interactive: boolean; onHotspot: HotspotHandler }

const HAND = "'Comic Sans MS', 'Segoe Print', cursive";
const INK = '#1e293b';

/** A cream "napkin" card with hand-written lines typed in over time. */
function Napkin({ x, y, w, h, lines, t, tilt = -1.5, size = 26 }: {
  x: number; y: number; w: number; h: number; t: number; tilt?: number; size?: number;
  lines: { at: number; text: string; color?: string; bold?: boolean }[];
}) {
  return (
    <g transform={`rotate(${tilt} ${x + w / 2} ${y + h / 2})`}>
      <rect x={x} y={y} width={w} height={h} rx={16} fill="#fef3c7" />
      {Array.from({ length: Math.floor((h - 30) / 44) }, (_, i) => (
        <line key={i} x1={x + 20} x2={x + w - 20} y1={y + 62 + i * 44} y2={y + 62 + i * 44} stroke="#fcd34d" strokeWidth={1} />
      ))}
      {lines.map((l, i) => (
        <text key={i} x={x + 26} y={y + 52 + i * 44} fill={l.color ?? INK} fontSize={size} fontWeight={l.bold ? 900 : 700} fontFamily={HAND}>
          {typewriter(l.text, t, l.at, 30)}
        </text>
      ))}
    </g>
  );
}

/* --------------------------------- Intro ---------------------------------- */
function IntroPart({ time: t }: { time: number }) {
  const vis = fadeWindow(t, 0, T.assume + 0.3, 0.6);
  if (vis <= 0) return null;
  const clock = Math.max(0, 300 - Math.floor(progress(t, 8, 18) * 300));
  return (
    <g opacity={vis}>
      <Title text="BOSS · Napkin Math" subtitle="estimate PixelPost's QPS and storage, live" y={70} size={36} color={C.amber} appear={progress(t, 0.2, 1.2)} />
      <Counter x={1140} y={50} value={PIXELPOST.mau} time={t} bump={between(t, 2, 4)} />
      <Appear p={progress(t, 2, 3, ease.outBack)} from="scale" x={640} y={320}>
        <rect x={420} y={200} width={440} height={220} rx={22} fill={C.panel} stroke={C.rose} strokeWidth={2} />
        <text x={640} y={250} textAnchor="middle" fill={C.rose} fontSize={20} fontWeight={800}>Final investor question</text>
        {['Peak QPS?', 'Photo storage per day?', 'Storage after 5 years?'].map((q, i) => (
          <text key={q} x={640} y={300 + i * 36} textAnchor="middle" fill={C.white} fontSize={24} fontWeight={700} opacity={progress(t, 3 + i, 4 + i)}>{q}</text>
        ))}
      </Appear>
      <g opacity={progress(t, 8, 9)}>
        <circle cx={640} cy={490} r={42} fill={C.panel} stroke={C.amber} strokeWidth={3} />
        <text x={640} y={500} textAnchor="middle" fill={C.amber} fontSize={24} fontWeight={900} fontFamily={MONO}>{`${Math.floor(clock / 60)}:${String(clock % 60).padStart(2, '0')}`}</text>
      </g>
      <Character who="maya" mood="worried" x={200} y={600} size={130} time={t} talking={between(t, 4, 9)}
        say={t >= 4 && t < 10 ? 'Five minutes. No spreadsheet.' : undefined} appear={progress(t, 3, 4)} />
      <Character who="ravi" mood="happy" x={1090} y={600} size={130} time={t} bubble="left" talking={between(t, 11, 17)}
        say={t >= 11 ? 'Write assumptions first. Then multiply.' : undefined} appear={progress(t, 10, 11)} />
    </g>
  );
}

/* ------------------------------ Assumptions ------------------------------- */
function AssumePart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.assume, T.qps + 0.3, 0.6);
  if (vis <= 0) return null;
  const lines = [
    { at: 21, text: `• ${PIXELPOST.mau / 1_000_000} million monthly active users` },
    { at: 25, text: `• ${PIXELPOST.dailyShare * 100}% of them use PixelPost daily` },
    { at: 29, text: `• ${PIXELPOST.postsPerUser} posts per user per day` },
    { at: 33, text: `• ${PIXELPOST.viewsPerUser} photo views per user per day` },
    { at: 37, text: `• ${PIXELPOST.photoShare * 100}% of posts carry a ${PIXELPOST.photoMB} MB photo` },
    { at: 41, text: `• keep everything for ${PIXELPOST.years} years` },
  ];
  return (
    <g opacity={vis}>
      <Hotspot id="assumptions" interactive={interactive} onClick={onHotspot} active={between(t, 21, T.qps)} x={880} y={110} time={t} label="Assumptions">
        <Napkin x={150} y={110} w={720} h={370} t={t} lines={[{ at: 19, text: 'ASSUMPTIONS', bold: true, color: '#b45309' }, ...lines]} />
      </Hotspot>
      <Callout x={910} y={150} width={320} title="Same recipe as the book" color={C.cyan} size={15}
        text="The book estimates Twitter with 300M MAU, 50% daily, 2 tweets a day, 10% media, 5 years. We swap in PixelPost's numbers."
        appear={fadeWindow(t, 24, T.qps, 0.5)} />
      <Callout x={910} y={360} width={320} title="Why write them down?" color={C.amber} size={15}
        text="You will reference them later, and the interviewer can see (and challenge) your reasoning."
        appear={fadeWindow(t, 42, T.qps, 0.5)} />
    </g>
  );
}

/* ---------------------------------- QPS ----------------------------------- */
function QpsPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.qps, T.peak + 0.3, 0.6);
  if (vis <= 0) return null;
  const lines = [
    { at: 50, text: 'DAU = 10M × 50% = 5M' },
    { at: 56, text: 'posts/s = 5M × 2 / 86,400 s' },
    { at: 61, text: '≈ 10M / 100,000 ≈ 100  (exact: 116)', color: '#047857' },
    { at: 68, text: 'views/s = 5M × 50 / 86,400 s' },
    { at: 73, text: '≈ 2,900 read QPS', color: '#047857', bold: true },
  ];
  return (
    <g opacity={vis}>
      <Hotspot id="qps" interactive={interactive} onClick={onHotspot} active={between(t, 50, T.peak)} x={830} y={110} time={t} label="QPS">
        <Napkin x={110} y={110} w={710} h={300} t={t} lines={lines} size={27} />
      </Hotspot>
      {/* a day is ~10^5 seconds */}
      <g opacity={progress(t, 57, 58)}>
        <circle cx={1040} cy={250} r={110} fill={C.panel} stroke={C.violet} strokeWidth={3} />
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
          return <line key={i} x1={1040 + Math.cos(a) * 92} y1={250 + Math.sin(a) * 92} x2={1040 + Math.cos(a) * 104} y2={250 + Math.sin(a) * 104} stroke={C.dim} strokeWidth={2} />;
        })}
        <line x1={1040} y1={250} x2={1040 + Math.cos(t * 2) * 80} y2={250 + Math.sin(t * 2) * 80} stroke={C.violet} strokeWidth={4} strokeLinecap="round" />
        <text x={1040} y={240} textAnchor="middle" fill={C.white} fontSize={22} fontWeight={900} fontFamily={MONO}>86,400 s</text>
        <text x={1040} y={275} textAnchor="middle" fill={C.amber} fontSize={20} fontWeight={800} fontFamily={MONO} opacity={progress(t, 61, 62)}>≈ 10⁵ s</text>
        <Label x={1040} y={395} text="one day" size={18} color={C.violet} weight={800} />
      </g>
      <Callout x={110} y={450} width={710} title="QPS = queries per second" color={C.emerald} size={16}
        text="Daily actions ÷ 86,400 seconds. Round a day to 100,000 seconds and the division becomes moving a decimal point."
        appear={fadeWindow(t, 63, T.peak, 0.5)} />
      <Callout x={880} y={450} width={330} title="Book: Twitter" color={C.cyan} size={15}
        text="150M DAU × 2 tweets / 86,400 s ≈ 3,500 QPS."
        appear={fadeWindow(t, 76, T.peak, 0.5)} />
    </g>
  );
}

/* ---------------------------------- Peak ---------------------------------- */
function PeakPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.peak, T.storage + 0.3, 0.6);
  if (vis <= 0) return null;
  const draw = progress(t, 84, 89);
  const curve = (h: number) => 2900 * (1 + 0.95 * Math.sin(((h - 13) / 24) * Math.PI * 2)) * 0.98 + 120;
  const X0 = 110, W = 640, Y0 = 520, H = 330;
  const pts = Array.from({ length: 49 }, (_, i) => i / 2).filter((h) => h / 24 <= draw)
    .map((h) => `${X0 + (h / 24) * W} ${Y0 - (curve(h) / 6500) * H}`);
  const servers = Math.min(BOSS.servers, Math.floor(progress(t, 94, 99) * BOSS.servers + 0.001));
  return (
    <g opacity={vis}>
      <Title text="Peak QPS ≈ 2 × average" y={70} size={34} color={C.rose} appear={progress(t, T.peak, T.peak + 1)} />
      <line x1={X0} y1={Y0} x2={X0 + W} y2={Y0} stroke={C.line} strokeWidth={2} />
      <line x1={X0} y1={Y0} x2={X0} y2={Y0 - H} stroke={C.line} strokeWidth={2} />
      {[0, 6, 12, 18, 24].map((h) => <text key={h} x={X0 + (h / 24) * W} y={Y0 + 26} textAnchor="middle" fill={C.dim} fontSize={14}>{h}:00</text>)}
      <line x1={X0} y1={Y0 - (2900 / 6500) * H} x2={X0 + W} y2={Y0 - (2900 / 6500) * H} stroke={C.emerald} strokeDasharray="8 6" strokeWidth={2} opacity={progress(t, 86, 87)} />
      <text x={X0 + W + 10} y={Y0 - (2900 / 6500) * H + 5} fill={C.emerald} fontSize={16} fontWeight={800} opacity={progress(t, 86, 87)}>avg 2,900</text>
      <line x1={X0} y1={Y0 - (5800 / 6500) * H} x2={X0 + W} y2={Y0 - (5800 / 6500) * H} stroke={C.rose} strokeDasharray="8 6" strokeWidth={2} opacity={progress(t, 89, 90)} />
      <text x={X0 + W + 10} y={Y0 - (5800 / 6500) * H + 5} fill={C.rose} fontSize={16} fontWeight={800} opacity={progress(t, 89, 90)}>peak ≈ 5,800</text>
      {pts.length > 1 && <path d={`M${pts.join(' L')}`} fill="none" stroke={C.amber} strokeWidth={4} strokeLinecap="round" />}
      <Hotspot id="peak" interactive={interactive} onClick={onHotspot} active={between(t, 90, T.storage)} x={1220} y={150} time={t} label="Servers">
        <Panel x={900} y={160} w={320} h={360} title="Web servers needed" color={C.cyan} tint={0.05} opacity={progress(t, 92, 93)}>
          <text x={1060} y={215} textAnchor="middle" fill={C.white} fontSize={17} fontFamily={MONO}>5,800 ÷ 1,000 per server</text>
          {Array.from({ length: servers }, (_, i) => (
            <g key={i} transform={`translate(${935 + (i % 3) * 90} ${270 + Math.floor(i / 3) * 100})`}>
              <KindIcon kind="web" size={70} color={C.cyan} activity={pulse(t, 1, i * 0.2)} />
            </g>
          ))}
          <text x={1060} y={495} textAnchor="middle" fill={C.cyan} fontSize={24} fontWeight={900} opacity={progress(t, 99, 100)}>≈ 6 servers</text>
        </Panel>
      </Hotspot>
    </g>
  );
}

/* -------------------------------- Storage --------------------------------- */
function StoragePart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.storage, T.tips + 0.3, 0.6);
  if (vis <= 0) return null;
  const lines = [
    { at: 106, text: 'photos/day = 10M posts × 40%' },
    { at: 111, text: '= 4M photos × 2 MB = 8M MB' },
    { at: 116, text: '≈ 8 TB per day', color: '#047857', bold: true },
    { at: 121, text: '5 years: 8 TB × 365 × 5' },
    { at: 126, text: '= 14,600 TB ≈ 15 PB', color: '#b91c1c', bold: true },
  ];
  const stack = Math.floor(progress(t, 121, 130) * 15);
  return (
    <g opacity={vis}>
      <Hotspot id="storage" interactive={interactive} onClick={onHotspot} active={between(t, 106, T.tips)} x={830} y={90} time={t} label="Storage">
        <Napkin x={110} y={90} w={710} h={290} t={t} lines={lines} size={27} />
      </Hotspot>
      {/* 15 PB as a stack of 1 PB disks */}
      <g>
        {Array.from({ length: stack }, (_, i) => (
          <g key={i} transform={`translate(${930 + (i % 5) * 62} ${520 - Math.floor(i / 5) * 70})`}>
            <rect x={0} y={0} width={54} height={58} rx={10} fill={`${C.violet}33`} stroke={C.violet} strokeWidth={2} />
            <text x={27} y={36} textAnchor="middle" fill={C.white} fontSize={14} fontWeight={800}>1 PB</text>
          </g>
        ))}
        {stack > 0 && <Label x={1085} y={620} text={`${stack} PB`} size={26} color={C.violet} weight={900} />}
      </g>
      <Callout x={110} y={420} width={710} title="Book: Twitter" color={C.cyan} size={16}
        text="150M × 2 tweets × 10% media × 1 MB = 30 TB per day. 30 TB × 365 × 5 ≈ 55 PB. Only media is counted: text is tiny next to photos."
        appear={fadeWindow(t, 130, T.tips, 0.5)} />
      <CheckMark x={790} y={330} t={progress(t, 128, 129)} size={44} />
    </g>
  );
}

/* ---------------------------------- Tips ---------------------------------- */
const TIPS = [
  { at: 142, title: 'Round and approximate', text: '99,987 ÷ 9.1 → 100,000 ÷ 10 = 10,000. Precision is not expected.', col: C.amber },
  { at: 149, title: 'Write down assumptions', text: 'MAU, daily %, actions per user, sizes, retention. You will reference them later.', col: C.emerald },
  { at: 155, title: 'Label your units', text: 'Is "5" 5 KB or 5 MB? Write "5 MB" and remove the ambiguity.', col: C.rose },
  { at: 161, title: 'Practise the usual suspects', text: 'QPS, peak QPS, storage, cache, number of servers.', col: C.cyan },
];
function TipsPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.tips, T.end + 1, 0.6);
  if (vis <= 0) return null;
  return (
    <g opacity={vis}>
      <Hotspot id="tips" interactive={interactive} onClick={onHotspot} active={between(t, 142, T.end)} x={900} y={60} time={t} label="Tips">
        <Title text="It is about the process" y={70} size={34} color={C.emerald} appear={progress(t, T.tips, T.tips + 1)} />
      </Hotspot>
      {TIPS.map((tip, i) => (
        <Appear key={tip.title} p={progress(t, tip.at, tip.at + 0.8, ease.outBack)} from="pop" x={330 + (i % 2) * 620} y={210 + Math.floor(i / 2) * 170}>
          <rect x={60 + (i % 2) * 600} y={130 + Math.floor(i / 2) * 170} width={560} height={140} rx={20} fill={C.panel} stroke={tip.col} strokeWidth={2} />
          <text x={90 + (i % 2) * 600} y={175 + Math.floor(i / 2) * 170} fill={tip.col} fontSize={24} fontWeight={900}>{i + 1}. {tip.title}</text>
          {wrapText(tip.text, 46).map((line, k) => (
            <text key={k} x={90 + (i % 2) * 600} y={210 + Math.floor(i / 2) * 170 + k * 26} fill={C.text} fontSize={18}>{line}</text>
          ))}
        </Appear>
      ))}
      <g opacity={progress(t, 167, 168)}>
        <Chip x={640} y={500} text="Solving the problem matters more than the exact result" color={C.amber} filled size={18} />
      </g>
      <Character who="maya" mood="proud" x={240} y={650} size={110} time={t} talking={between(t, 169, 175)}
        say={t >= 169 ? 'Term sheet signed!' : undefined} appear={progress(t, 168, 169)} />
      <Sparkles x={640} y={430} t={progress(t, 169, 171.5)} />
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = Math.max(0, Math.min(T.end, time));
  return (
    <Stage time={t} drift title="Napkin math: assumptions, QPS, peak QPS, storage and estimation tips">
      <IntroPart time={t} />
      <AssumePart time={t} interactive={interactive} onHotspot={onHotspot} />
      <QpsPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <PeakPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <StoragePart time={t} interactive={interactive} onHotspot={onHotspot} />
      <TipsPart time={t} interactive={interactive} onHotspot={onHotspot} />
    </Stage>
  );
}
