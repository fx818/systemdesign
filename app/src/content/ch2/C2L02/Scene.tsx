import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, Hotspot, Label, MONO, Packet, Panel, Stage, StatusBadge, Title,
  between, ease, fadeWindow, progress, pulse,
} from '@/scenekit';
import { formatNs, humanScaled, latencyOf } from '../common/numbers';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  units: 18,
  track: 42,
  scaled: 82,
  lessons: 120,
  end: 172,
} as const;

type HotspotHandler = ((id: string) => void) | undefined;
interface PartProps { time: number; interactive: boolean; onHotspot: HotspotHandler }

const KIND_COL = { cpu: C.cyan, memory: C.emerald, network: C.violet, disk: C.rose } as const;

/* ------------------------------ Intro: Europe ----------------------------- */
const US = { x: 330, y: 300 };
const EU = { x: 930, y: 250 };
function IntroPart({ time: t }: { time: number }) {
  const vis = fadeWindow(t, 0, T.units + 0.3, 0.6);
  if (vis <= 0) return null;
  const arc = (p: number) => {
    const x = US.x + (EU.x - US.x) * p;
    const y = US.y + (EU.y - US.y) * p - Math.sin(p * Math.PI) * 70;
    return { x, y };
  };
  const pts = Array.from({ length: 25 }, (_, i) => arc(i / 24));
  return (
    <g opacity={vis}>
      <Title text="Level 2 · Need for Speed" subtitle="latency numbers every programmer should know" y={70} size={32} color={C.violet} appear={progress(t, 0.2, 1.2)} />
      {/* two continents as soft blobs */}
      <ellipse cx={US.x} cy={US.y + 30} rx={210} ry={120} fill={`${C.sky}14`} stroke={`${C.sky}55`} />
      <ellipse cx={EU.x} cy={EU.y + 30} rx={170} ry={110} fill={`${C.violet}14`} stroke={`${C.violet}55`} />
      <Label x={US.x} y={US.y + 120} text="California (servers)" size={18} color={C.sky} />
      <Label x={EU.x} y={EU.y + 115} text="Netherlands (users)" size={18} color={C.violet} />
      <path d={`M${pts.map((p) => `${p.x} ${p.y}`).join(' L')}`} fill="none" stroke={C.line} strokeWidth={3} strokeDasharray="8 8" />
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <Packet along={pts} time={t} start={3 + k * 4} end={4.6 + k * 4} color={C.violet} label="photo" shape="envelope" />
          <Packet along={[...pts].reverse()} time={t} start={4.7 + k * 4} end={6.3 + k * 4} color={C.sky} size={8} />
        </g>
      ))}
      <StatusBadge x={640} y={450} status="warn" text="round trip ≈ 150 ms, every time" time={t} />
      <Character who="maya" mood="worried" x={200} y={600} size={130} time={t} talking={between(t, 5, 11)}
        say={t >= 5 && t < 12 ? 'Amsterdam says we are slow!' : undefined} appear={progress(t, 2, 3)} />
      <Character who="ravi" mood="neutral" x={1100} y={600} size={130} time={t} bubble="left" talking={between(t, 12, 17)}
        say={t >= 12 ? 'Some operations are just slow. Know which.' : undefined} appear={progress(t, 11, 12)} />
    </g>
  );
}

/* ------------------------------- Time units ------------------------------- */
function UnitsPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.units, T.track + 0.3, 0.6);
  if (vis <= 0) return null;
  const units = [
    { u: 'ns', name: 'nanosecond', exp: '10⁻⁹ s', col: C.cyan },
    { u: 'µs', name: 'microsecond', exp: '10⁻⁶ s', col: C.emerald },
    { u: 'ms', name: 'millisecond', exp: '10⁻³ s', col: C.amber },
    { u: 's', name: 'second', exp: '1 s', col: C.rose },
  ];
  return (
    <g opacity={vis}>
      <Title text="Tiny units of time" y={80} size={34} color={C.cyan} appear={progress(t, T.units, T.units + 1)} />
      {units.map((u, i) => {
        const x = 170 + i * 290;
        const p = progress(t, 20 + i * 2.5, 21 + i * 2.5, ease.outBack);
        return (
          <g key={u.u}>
            <Appear p={p} from="pop" x={x} y={280}>
              <circle cx={x} cy={280} r={86} fill={`${u.col}1a`} stroke={u.col} strokeWidth={3} />
              <text x={x} y={295} textAnchor="middle" fill={u.col} fontSize={54} fontWeight={900} fontFamily={MONO}>{u.u}</text>
              <text x={x} y={400} textAnchor="middle" fill={C.white} fontSize={20} fontWeight={700}>{u.name}</text>
              <text x={x} y={430} textAnchor="middle" fill={C.dim} fontSize={18} fontFamily={MONO}>{u.exp}</text>
            </Appear>
            {i > 0 && (
              <g opacity={progress(t, 21 + i * 2.5, 22 + i * 2.5)}>
                <path d={`M${x - 195} 280 H${x - 100}`} stroke={C.dim} strokeWidth={3} />
                <path d={`M${x - 110} 271 L${x - 98} 280 L${x - 110} 289`} stroke={C.dim} strokeWidth={3} fill="none" />
                <text x={x - 145} y={262} textAnchor="middle" fill={C.amber} fontSize={18} fontWeight={800} fontFamily={MONO}>× 1,000</text>
              </g>
            )}
          </g>
        );
      })}
      <Hotspot id="units" interactive={interactive} onClick={onHotspot} active={between(t, 30, T.track)} x={1080} y={500} time={t} label="Units">
        <Panel x={200} y={480} w={880} h={150} title="Conversions" color={C.amber} tint={0.05} opacity={progress(t, 30, 31)}>
          {['1 µs = 1,000 ns', '1 ms = 1,000 µs = 1,000,000 ns', '1 s = 1,000 ms'].map((s, i) => (
            <text key={s} x={240} y={540 + i * 30} fill={C.white} fontSize={21} fontFamily={MONO} opacity={progress(t, 31 + i * 2, 32 + i * 2)}>{s}</text>
          ))}
        </Panel>
      </Hotspot>
    </g>
  );
}

/* ----------------------------- Log-scale track ----------------------------- */
const TRACK = { x0: 120, x1: 1160, y: 250 };
const logX = (ns: number) => TRACK.x0 + ((Math.log10(ns) + 1) / 10) * (TRACK.x1 - TRACK.x0); // 0.1 ns .. 1 s
const TRACK_OPS = ['l1', 'mem', 'zippy', 'send2k', 'mem1mb', 'dc', 'seek', 'disk1mb', 'xregion'];
function TrackPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.track, T.scaled + 0.3, 0.6);
  if (vis <= 0) return null;
  const ticks = ['0.1 ns', '1 ns', '10 ns', '100 ns', '1 µs', '10 µs', '100 µs', '1 ms', '10 ms', '100 ms', '1 s'];
  const zoneP = progress(t, 72, 73);
  return (
    <g opacity={vis}>
      <Title text="From nanoseconds to a whole ocean" subtitle="each tick is 10× slower (log scale)" y={70} size={32} color={C.violet} appear={progress(t, T.track, T.track + 1)} />
      <line x1={TRACK.x0} y1={TRACK.y} x2={TRACK.x0 + (TRACK.x1 - TRACK.x0) * progress(t, 43, 45)} y2={TRACK.y} stroke={C.line} strokeWidth={6} strokeLinecap="round" />
      {ticks.map((tk, i) => {
        const x = TRACK.x0 + (i / 10) * (TRACK.x1 - TRACK.x0);
        return (
          <g key={tk} opacity={progress(t, 43 + i * 0.15, 44 + i * 0.15)}>
            <line x1={x} y1={TRACK.y - 12} x2={x} y2={TRACK.y + 12} stroke={C.dim} strokeWidth={2} />
            <text x={x} y={TRACK.y - 22} textAnchor="middle" fill={C.dim} fontSize={14} fontFamily={MONO}>{tk}</text>
          </g>
        );
      })}
      {/* memory vs disk zones */}
      <rect x={logX(50)} y={TRACK.y + 20} width={logX(300_000) - logX(50)} height={8} rx={4} fill={C.emerald} opacity={0.5 * zoneP} />
      <rect x={logX(5_000_000)} y={TRACK.y + 20} width={logX(40_000_000) - logX(5_000_000)} height={8} rx={4} fill={C.rose} opacity={0.5 * zoneP} />
      {TRACK_OPS.map((id, i) => {
        const op = latencyOf(id);
        const at = 46 + i * 2.8;
        const p = progress(t, at, at + 0.8, ease.outBack);
        const x = logX(op.ns);
        const y = TRACK.y + 70 + (i % 4) * 85;
        const col = KIND_COL[op.kind];
        const fresh = between(t, at, at + 2.8);
        return (
          <g key={id} opacity={p}>
            <circle cx={x} cy={TRACK.y} r={fresh ? 12 + 3 * pulse(t, 0.6) : 9} fill={col} filter="url(#sk-glow)" />
            <line x1={x} y1={TRACK.y + 10} x2={x} y2={y - 24} stroke={col} strokeWidth={1.5} strokeDasharray="4 4" />
            <rect x={x - 95} y={y - 24} width={190} height={56} rx={14} fill={fresh ? `${col}2a` : C.panel} stroke={col} strokeWidth={fresh ? 2 : 1} />
            <text x={x} y={y - 2} textAnchor="middle" fill={C.white} fontSize={15} fontWeight={800}>{op.short}</text>
            <text x={x} y={y + 21} textAnchor="middle" fill={col} fontSize={15} fontFamily={MONO} fontWeight={700}>{formatNs(op.ns)}</text>
          </g>
        );
      })}
      <Hotspot id="track" interactive={interactive} onClick={onHotspot} active={between(t, 72, T.scaled)} x={1200} y={170} time={t} label="Memory vs disk">
        <g opacity={zoneP}>
          <Chip x={logX(4000)} y={TRACK.y + 46} text="memory land" color={C.emerald} size={13} />
          <Chip x={logX(14_000_000)} y={TRACK.y + 46} text="disk land" color={C.rose} size={13} />
        </g>
      </Hotspot>
      <Callout x={60} y={622} width={420} title="Dr. Dean's numbers (2010)" color={C.amber} size={14}
        text="Some are outdated as hardware gets faster, but the ratios still tell you what is fast and what is slow."
        appear={fadeWindow(t, 74, T.scaled, 0.5)} />
    </g>
  );
}

/* --------------------------- If 1 ns were 1 second ------------------------- */
const SCALED_OPS = ['l1', 'mem', 'zippy', 'mem1mb', 'dc', 'seek', 'disk1mb', 'xregion'];
const FEEL: Record<string, string> = {
  l1: 'a heartbeat',
  mem: 'brushing your teeth',
  zippy: 'a long movie',
  mem1mb: 'a long weekend',
  dc: 'a work week',
  seek: 'a whole season',
  disk1mb: 'almost a year',
  xregion: 'a university degree',
};
function ScaledPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.scaled, T.lessons + 0.3, 0.6);
  if (vis <= 0) return null;
  const maxLog = Math.log10(150_000_000) + 1;
  return (
    <g opacity={vis}>
      <Hotspot id="scaled" interactive={interactive} onClick={onHotspot} active={between(t, 86, T.lessons)} x={1150} y={60} time={t} label="Human scale">
        <Title text="If 1 nanosecond were 1 second..." y={70} size={34} color={C.amber} appear={progress(t, T.scaled, T.scaled + 1)} />
      </Hotspot>
      {SCALED_OPS.map((id, i) => {
        const op = latencyOf(id);
        const at = 86 + i * 3.6;
        const y = 140 + i * 66;
        const grow = progress(t, at, at + 1.6, ease.outCubic);
        const w = ((Math.log10(op.ns) + 1) / maxLog) * 560 * grow;
        const col = KIND_COL[op.kind];
        return (
          <g key={id} opacity={progress(t, at - 0.3, at)}>
            <text x={60} y={y + 26} fill={C.white} fontSize={18} fontWeight={700}>{op.short}</text>
            <text x={290} y={y + 26} fill={C.dim} fontSize={16} fontFamily={MONO}>{formatNs(op.ns)}</text>
            <rect x={390} y={y + 8} width={Math.max(4, w)} height={26} rx={8} fill={col} opacity={0.8} />
            <text x={400 + Math.max(4, w)} y={y + 28} fill={col} fontSize={19} fontWeight={900}>{grow > 0.95 ? humanScaled(op.ns) : ''}</text>
            <text x={1220} y={y + 28} textAnchor="end" fill={C.dim} fontSize={16} fontStyle="italic" opacity={progress(t, at + 1.4, at + 2)}>{FEEL[id]}</text>
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------ Five conclusions ---------------------------- */
const LESSONS = [
  { at: 122, icon: '⚡', text: 'Memory is fast but the disk is slow.', col: C.emerald },
  { at: 128, icon: '🌀', text: 'Avoid disk seeks if possible.', col: C.rose },
  { at: 134, icon: '🗜️', text: 'Simple compression algorithms are fast.', col: C.cyan },
  { at: 140, icon: '📦', text: 'Compress data before sending it over the internet if possible.', col: C.amber },
  { at: 146, icon: '🌍', text: 'Sending data between regions takes time.', col: C.violet },
];
function LessonsPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.lessons, T.end + 1, 0.6);
  if (vis <= 0) return null;
  const squash = progress(t, 154, 156, ease.inOutCubic);
  return (
    <g opacity={vis}>
      <Hotspot id="conclusions" interactive={interactive} onClick={onHotspot} active={between(t, 122, T.end)} x={900} y={60} time={t} label="Conclusions">
        <Title text="Five conclusions" y={70} size={34} color={C.emerald} appear={progress(t, T.lessons, T.lessons + 1)} />
      </Hotspot>
      {LESSONS.map((l, i) => (
        <Appear key={l.text} p={progress(t, l.at, l.at + 0.8, ease.outCubic)} from="left" x={0} y={0}>
          <rect x={60} y={120 + i * 74} width={700} height={60} rx={18} fill={between(t, l.at, l.at + 6) ? `${l.col}22` : C.panel} stroke={l.col} strokeWidth={between(t, l.at, l.at + 6) ? 2 : 1} />
          <text x={90} y={159 + i * 74} fontSize={26}>{l.icon}</text>
          <text x={135} y={157 + i * 74} fill={C.white} fontSize={18} fontWeight={700}>{l.text}</text>
          <CheckMark x={730} y={150 + i * 74} t={progress(t, l.at + 1, l.at + 1.6)} size={26} />
        </Appear>
      ))}
      {/* memory vs disk, linear scale: the memory bar is invisible next to the disk */}
      <g opacity={fadeWindow(t, 124, 151, 0.5)}>
        <text x={60} y={530} fill={C.dim} fontSize={16} fontWeight={700}>Same 1 MB read, linear scale</text>
        <rect x={60} y={548} width={Math.max(2, 700 * (250 / 30_000) * progress(t, 125, 127))} height={26} rx={6} fill={C.emerald} />
        <text x={80} y={567} fill={C.emerald} fontSize={16} fontWeight={800}>memory 250 µs</text>
        <rect x={60} y={590} width={700 * progress(t, 126, 130)} height={26} rx={6} fill={C.rose} opacity={0.85} />
        <text x={70} y={609} fill={C.white} fontSize={16} fontWeight={800}>disk 30 ms</text>
      </g>
      {/* compress-then-send vignette */}
      <g opacity={progress(t, 152, 153)}>
        <Panel x={800} y={120} w={420} h={300} title="Compress, then cross the ocean" color={C.amber} tint={0.05} />
        <rect x={910 - (120 - squash * 50) / 2} y={250 - (120 - squash * 50) / 2} width={120 - squash * 50} height={120 - squash * 50} rx={12} fill={`${C.amber}33`} stroke={C.amber} strokeWidth={2} />
        <text x={910} y={262} textAnchor="middle" fill={C.white} fontSize={16} fontWeight={800}>{squash < 1 ? '1 MB' : '300 KB'}</text>
        <Packet along={[{ x: 960, y: 370 }, { x: 1180, y: 370 }]} time={t} start={157} end={160} color={C.amber} label="gzip" shape="envelope" />
        <Label x={1010} y={235} text="compress: ~µs per KB" size={16} color={C.cyan} anchor="start" />
        <Label x={1010} y={300} text="ocean: ~150 ms" size={16} color={C.violet} anchor="start" />
      </g>
      <Character who="ravi" mood="proud" x={1010} y={600} size={130} time={t} bubble="left" talking={between(t, 162, 171)}
        say={t >= 162 ? 'Fewer bytes on the slow road. Memory over disk.' : undefined} appear={progress(t, 161, 162)} />
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = Math.max(0, Math.min(T.end, time));
  return (
    <Stage time={t} drift title="Latency numbers: ns, µs, ms, the log-scale track and five conclusions">
      <IntroPart time={t} />
      <UnitsPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <TrackPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <ScaledPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <LessonsPart time={t} interactive={interactive} onHotspot={onHotspot} />
    </Stage>
  );
}

