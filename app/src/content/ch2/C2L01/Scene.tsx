import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, Counter, Hotspot, Label, MONO, Panel, Sparkles, Stage, Title,
  between, ease, fadeWindow, progress, pulse, tween, typewriter,
} from '@/scenekit';
import { POWERS } from '../common/numbers';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  bits: 20,
  ascii: 42,
  table: 66,
  ladder: 102,
  napkin: 126,
  end: 156,
} as const;

type HotspotHandler = ((id: string) => void) | undefined;
interface PartProps { time: number; interactive: boolean; onHotspot: HotspotHandler }

const WORD = 'PIXEL';
const bin = (ch: string) => ch.charCodeAt(0).toString(2).padStart(8, '0');

/* ------------------------------- Intro: pitch ------------------------------ */
function IntroPart({ time: t }: { time: number }) {
  const vis = fadeWindow(t, 0, T.bits + 0.3, 0.6);
  if (vis <= 0) return null;
  const q = typewriter('How much storage will 10M users need in 5 years?', t, 7.5, 28);
  return (
    <g opacity={vis}>
      <Title text="Chapter 2 · Back-of-the-envelope" subtitle="Level 1: Powers of Two" y={70} size={30} color={C.amber} appear={progress(t, 0.2, 1.2)} />
      {/* investor slide */}
      <Appear p={progress(t, 1, 2, ease.outBack)} from="scale" x={760} y={330}>
        <rect x={520} y={160} width={500} height={300} rx={22} fill={C.panel} stroke={C.violet} strokeWidth={2} />
        <rect x={520} y={160} width={500} height={44} rx={22} fill={`${C.violet}33`} />
        <text x={545} y={190} fill={C.white} fontSize={18} fontWeight={800}>PixelPost · Series A</text>
        {[0.25, 0.35, 0.5, 0.7, 1].map((h, i) => {
          const grow = progress(t, 2 + i * 0.3, 3 + i * 0.3, ease.outCubic);
          return <rect key={i} x={570 + i * 80} y={430 - 190 * h * grow} width={50} height={190 * h * grow} rx={8} fill={i === 4 ? C.emerald : `${C.violet}aa`} />;
        })}
        <text x={915} y={232} textAnchor="middle" fill={C.emerald} fontSize={26} fontWeight={900} opacity={progress(t, 3.5, 4)}>10M</text>
      </Appear>
      <Counter x={1140} y={50} value={10_000_000} time={t} bump={between(t, 3, 5)} />
      <Character who="maya" mood={t < 12 ? 'happy' : 'worried'} x={250} y={420} size={170} time={t} talking={between(t, 4, 14)}
        say={t < 7 ? 'Investors at 3 pm!' : t < 14 ? 'They asked a math question...' : undefined} appear={progress(t, 0.5, 1.5)} />
      {t >= 7.5 && <Callout x={520} y={490} width={500} title="Investor question" color={C.rose} text={q || ' '} size={18} />}
      <Character who="ravi" mood="happy" x={1120} y={560} size={140} time={t} talking={between(t, 15, 19.5)} bubble="left"
        say={t >= 15 ? 'Napkin time. Units first.' : undefined} appear={progress(t, 14, 15)} />
    </g>
  );
}

/* -------------------------------- Bits & bytes ---------------------------- */
function BitsPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.bits, T.ascii + 0.3, 0.6);
  if (vis <= 0) return null;
  const bits = '01010000';
  const group = progress(t, 29, 31, ease.inOutCubic);
  return (
    <g opacity={vis}>
      <Title text="Bits and bytes" subtitle="the smallest units of data" y={80} size={34} color={C.cyan} appear={progress(t, T.bits, T.bits + 1)} />
      {bits.split('').map((b, i) => {
        const p = progress(t, 21.5 + i * 0.5, 22.2 + i * 0.5, ease.outBack);
        const x = tween(group, 0, 1, 160 + i * 135, 372 + i * 68, ease.linear);
        const flip = Math.floor((t - 22) * 2 + i) % 2 === 0 && t < 26 ? (b === '0' ? '1' : '0') : b;
        return (
          <Appear key={i} p={p} from="pop" x={x + 28} y={300}>
            <rect x={x} y={268} width={56} height={64} rx={12} fill={flip === '1' ? `${C.cyan}33` : C.panel} stroke={flip === '1' ? C.cyan : C.line} strokeWidth={2} />
            <text x={x + 28} y={312} textAnchor="middle" fill={flip === '1' ? C.cyan : C.dim} fontSize={30} fontWeight={800} fontFamily={MONO}>{flip}</text>
          </Appear>
        );
      })}
      {t < 28 && <Label x={640} y={390} text="a bit is a single 0 or 1" size={20} color={C.dim} opacity={progress(t, 23, 24)} />}
      {group > 0 && (
        <g opacity={group}>
          <path d="M366 350 v20 h548 v-20" fill="none" stroke={C.amber} strokeWidth={3} />
          <Hotspot id="byte" interactive={interactive} onClick={onHotspot} active={between(t, 31, T.ascii)} x={940} y={420} time={t} label="Byte">
            <Label x={640} y={420} text="1 byte = 8 bits" size={40} color={C.amber} weight={900} glow />
          </Hotspot>
        </g>
      )}
      <Callout x={330} y={480} width={620} title="Why it matters" color={C.amber} size={17}
        text="Every estimate of storage or bandwidth ends in bytes. Get the unit wrong and your answer is off by a factor of 8, or of 1,000."
        appear={fadeWindow(t, 34, T.ascii, 0.5)} />
    </g>
  );
}

/* ---------------------------------- ASCII --------------------------------- */
function AsciiPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.ascii, T.table + 0.3, 0.6);
  if (vis <= 0) return null;
  const typed = typewriter(WORD, t, 44, 2);
  const total = typed.length;
  return (
    <g opacity={vis}>
      <Title text="One ASCII character = one byte" y={80} size={34} color={C.emerald} appear={progress(t, T.ascii, T.ascii + 1)} />
      <rect x={340} y={130} width={600} height={70} rx={18} fill={C.panel} stroke={C.line} />
      <text x={370} y={178} fill={C.white} fontSize={34} fontFamily={MONO} fontWeight={800}>caption: "{typed}<tspan fill={C.emerald} opacity={pulse(t, 0.8)}>|</tspan>"</text>
      {WORD.split('').map((ch, i) => {
        const p = progress(t, 44 + i * 0.5, 44.6 + i * 0.5, ease.outBack);
        const y = 250 + i * 64;
        return (
          <Appear key={ch} p={p} from="left" x={0} y={y}>
            <rect x={300} y={y} width={60} height={50} rx={12} fill={`${C.emerald}22`} stroke={C.emerald} strokeWidth={2} />
            <text x={330} y={y + 35} textAnchor="middle" fill={C.emerald} fontSize={28} fontWeight={900} fontFamily={MONO}>{ch}</text>
            <path d={`M372 ${y + 25} H430`} stroke={C.dim} strokeWidth={2} markerEnd="" />
            {bin(ch).split('').map((b, k) => (
              <g key={k}>
                <rect x={440 + k * 46} y={y + 4} width={40} height={42} rx={8} fill={b === '1' ? `${C.cyan}33` : C.panel} stroke={b === '1' ? C.cyan : C.line} />
                <text x={460 + k * 46} y={y + 33} textAnchor="middle" fill={b === '1' ? C.cyan : C.dim} fontSize={20} fontFamily={MONO} fontWeight={700}>{b}</text>
              </g>
            ))}
            <text x={830} y={y + 33} fill={C.amber} fontSize={20} fontWeight={800}>1 byte</text>
          </Appear>
        );
      })}
      <Hotspot id="ascii" interactive={interactive} onClick={onHotspot} active={between(t, 48, T.table)} x={1180} y={250} time={t} label="ASCII">
        <Panel x={960} y={260} w={240} h={200} title="Total" color={C.amber} tint={0.06} opacity={progress(t, 47, 48)}>
          <text x={1080} y={360} textAnchor="middle" fill={C.white} fontSize={60} fontWeight={900}>{total}</text>
          <text x={1080} y={395} textAnchor="middle" fill={C.amber} fontSize={18} fontWeight={700}>bytes = {total * 8} bits</text>
        </Panel>
      </Hotspot>
      <Callout x={960} y={490} width={260} title="Napkin rule" color={C.cyan} size={15}
        text="Plain text: about 1 byte per character. A 140-character caption is about 140 bytes."
        appear={fadeWindow(t, 55, T.table, 0.5)} />
    </g>
  );
}

/* --------------------------------- Table 2-1 ------------------------------ */
function TablePart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.table, T.ladder + 0.3, 0.6);
  if (vis <= 0) return null;
  const rowAt = (i: number) => 72 + i * 4;
  return (
    <g opacity={vis}>
      <Title text="Data volume as powers of two" y={70} size={34} color={C.violet} appear={progress(t, T.table, T.table + 1)} />
      <Hotspot id="powers" interactive={interactive} onClick={onHotspot} active={between(t, 70, T.ladder)} x={1110} y={130} time={t} label="Table">
        <g>
          {['Power', 'Approximate value', 'Full name', 'Short'].map((h, i) => (
            <text key={h} x={[180, 360, 650, 900][i]} y={150} fill={C.dim} fontSize={18} fontWeight={800}>{h}</text>
          ))}
          <line x1={170} y1={165} x2={1080} y2={165} stroke={C.line} strokeWidth={2} />
        </g>
      </Hotspot>
      {POWERS.map((r, i) => {
        const p = progress(t, rowAt(i), rowAt(i) + 0.8, ease.outCubic);
        const y = 215 + i * 78;
        const hot = between(t, rowAt(i), rowAt(i) + 4);
        return (
          <Appear key={r.short} p={p} from="left" x={0} y={y}>
            <rect x={160} y={y - 40} width={930} height={64} rx={16} fill={hot ? `${C.violet}22` : C.panel} stroke={hot ? C.violet : C.line} />
            <text x={180} y={y + 2} fill={C.white} fontSize={30} fontWeight={900} fontFamily={MONO}>2<tspan dy={-14} fontSize={18}>{r.power}</tspan></text>
            <text x={360} y={y} fill={C.text} fontSize={24} fontWeight={700}>{r.approx}</text>
            <text x={650} y={y} fill={C.text} fontSize={24}>1 {r.name}</text>
            <Chip x={940} y={y - 8} text={r.short} color={C.amber} filled={hot} size={20} />
            <rect x={1010} y={y - 20} width={60 * (i + 1) / 5} height={22} rx={6} fill={C.violet} opacity={0.7} />
          </Appear>
        );
      })}
      <Callout x={160} y={600} width={930} title="The trick" color={C.emerald} size={17}
        text="2^10 = 1,024, which is about 1,000. So every step of 10 in the power adds three zeros: thousand, million, billion, trillion, quadrillion."
        appear={fadeWindow(t, 93, T.ladder, 0.5)} />
    </g>
  );
}

/* --------------------------------- Ladder -------------------------------- */
const RUNGS = ['Byte', 'KB', 'MB', 'GB', 'TB', 'PB'];
const RUNG_EX = ['a letter', 'a short text', 'a photo', 'a movie', 'a big disk', 'a data center floor'];
function LadderPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.ladder, T.napkin + 0.3, 0.6);
  if (vis <= 0) return null;
  const climb = tween(t, 106, 121, 0, RUNGS.length - 1, ease.inOutQuad);
  return (
    <g opacity={vis}>
      <Title text="The unit ladder" subtitle="each rung is × 1,024 (about × 1,000)" y={70} size={34} color={C.amber} appear={progress(t, T.ladder, T.ladder + 1)} />
      <line x1={330} y1={150} x2={330} y2={660} stroke={C.line} strokeWidth={6} />
      <line x1={470} y1={150} x2={470} y2={660} stroke={C.line} strokeWidth={6} />
      {RUNGS.map((r, i) => {
        const y = 630 - i * 92;
        const reached = climb >= i - 0.05;
        return (
          <g key={r}>
            <line x1={330} y1={y} x2={470} y2={y} stroke={reached ? C.amber : C.line} strokeWidth={6} />
            <Chip x={400} y={y - 22} text={r} color={reached ? C.amber : C.dim} filled={Math.round(climb) === i} size={18} />
            {i > 0 && <text x={500} y={y + 40} fill={reached ? C.emerald : C.dim} fontSize={16} fontWeight={700} fontFamily={MONO}>× 1,024</text>}
            <text x={600} y={y + 6} fill={reached ? C.text : C.dim} fontSize={18}>{RUNG_EX[i]}</text>
          </g>
        );
      })}
      <circle cx={300} cy={630 - climb * 92 - 10} r={14} fill={C.emerald} filter="url(#sk-glow)" />
      <Hotspot id="ladder" interactive={interactive} onClick={onHotspot} active={between(t, 106, T.napkin)} x={1190} y={180} time={t} label="Conversions">
        <Panel x={840} y={190} w={360} h={250} title="Convert by counting rungs" color={C.cyan} tint={0.05} opacity={progress(t, 108, 109)}>
          {['1 MB = 2^10 KB', '1 GB = 2^20 KB', '1 TB = 2^40 bytes', 'down a rung: × 1,024', 'up a rung: ÷ 1,024'].map((s, i) => (
            <text key={s} x={865} y={255 + i * 36} fill={i < 3 ? C.white : C.dim} fontSize={19} fontFamily={MONO} opacity={progress(t, 109 + i, 110 + i)}>{s}</text>
          ))}
        </Panel>
      </Hotspot>
      <Callout x={840} y={470} width={360} title="Label your units" color={C.rose} size={16}
        text='Writing "5" is a trap. Is it 5 KB or 5 MB? Always write the unit next to the number.'
        appear={fadeWindow(t, 117, T.napkin, 0.5)} />
    </g>
  );
}

/* ---------------------------------- Napkin -------------------------------- */
function NapkinPart({ time: t }: { time: number }) {
  const vis = fadeWindow(t, T.napkin, T.end + 1, 0.6);
  if (vis <= 0) return null;
  const lines = [
    { at: 129, text: '10 million users' },
    { at: 132, text: '× 1 new photo / day' },
    { at: 135, text: '× 2 MB per photo' },
    { at: 139, text: '= 20 million MB / day' },
    { at: 143, text: '≈ 20 TB / day' },
  ];
  return (
    <g opacity={vis}>
      <g transform={`rotate(-2 640 330)`}>
        <rect x={380} y={90} width={520} height={380} rx={18} fill="#fef3c7" opacity={progress(t, T.napkin, T.napkin + 1)} />
        {lines.map((l, i) => (
          <text key={l.text} x={420} y={150 + i * 60} fill={i === 4 ? '#b45309' : '#1e293b'} fontSize={i === 4 ? 40 : 32} fontWeight={i >= 3 ? 900 : 700}
            fontFamily="'Comic Sans MS', 'Segoe Print', cursive">{typewriter(l.text, t, l.at, 18)}</text>
        ))}
      </g>
      <CheckMark x={950} y={400} t={progress(t, 145, 146)} size={60} />
      <Sparkles x={640} y={330} t={progress(t, 145, 147)} />
      <Character who="ravi" mood="proud" x={150} y={640} size={110} time={t} talking={between(t, 147, 152)}
        say={t >= 147 ? 'MB to TB: two rungs, ÷ 1,000,000.' : undefined} appear={progress(t, T.napkin, T.napkin + 1)} />
      <Character who="maya" mood={t > 150 ? 'happy' : 'neutral'} x={1130} y={640} size={110} time={t} bubble="left" talking={between(t, 151, 155)}
        say={t >= 151 ? 'I can say that out loud!' : undefined} appear={progress(t, T.napkin + 1, T.napkin + 2)} />
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = Math.max(0, Math.min(T.end, time));
  return (
    <Stage time={t} drift title="Powers of two: bits, bytes, ASCII and the KB to PB ladder">
      <IntroPart time={t} />
      <BitsPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <AsciiPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <TablePart time={t} interactive={interactive} onHotspot={onHotspot} />
      <LadderPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <NapkinPart time={t} />
    </Stage>
  );
}
