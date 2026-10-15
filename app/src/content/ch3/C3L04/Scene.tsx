import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, Chip, Counter, CrossMark, Explosion, Hotspot, Label, Link, Node, Panel, Sparkles, Stage, Title,
  between, ease, fadeWindow, progress, tween,
} from '@/scenekit';
import { CheckRow, FrameworkRail, InterviewClock, StickyNote } from '../kit';
import { DONTS, DOS, SESSION_MIN, STEPS } from '../framework';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  wrap: 16,
  directions: 30,
  dos: 92,
  time: 134,
  end: 172,
} as const;

const DIRECTIONS = [
  { at: 30, text: 'Bottlenecks and improvements' },
  { at: 40, text: 'Recap the design' },
  { at: 50, text: 'Error cases' },
  { at: 60, text: 'Operation issues' },
  { at: 70, text: 'The next scale curve' },
  { at: 80, text: 'Refinements, given more time' },
];

/** A small plane gliding onto a runway (intro). */
function Plane({ x, y, angle }: { x: number; y: number; angle: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M-60 0 L50 -6 Q70 0 50 6 Z" fill={C.white} />
      <path d="M-5 -4 L-30 -40 L-15 -40 L20 -4 Z" fill={C.cyan} />
      <path d="M-5 4 L-30 40 L-15 40 L20 4 Z" fill={C.cyan} />
      <path d="M-55 -2 L-70 -22 L-60 -22 L-45 -2 Z" fill={C.violet} />
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const introWin = 1 - progress(t, T.wrap - 0.6, T.wrap);
  const planeX = tween(t, 1, 13, 120, 900, ease.outCubic);
  const planeY = tween(t, 1, 13, 200, 470, ease.inOutQuad);
  const dirWin = fadeWindow(t, T.wrap, T.dos - 0.3, 0.5);
  const dosWin = fadeWindow(t, T.dos, T.time - 0.3, 0.5);
  const timeWin = fadeWindow(t, T.time, T.end + 1, 0.5);
  const dirActive = DIRECTIONS.reduce((acc, d, i) => (t >= d.at ? i : acc), -1);
  const users = Math.round(tween(t, 72, 78, 1_000_000, 10_000_000, ease.inOutCubic));
  const sweep = tween(t, 137, 155, 0, SESSION_MIN, ease.linear);

  return (
    <Stage time={t} drift title="Chapter 3, Level 4: wrap up, dos and don'ts, time allocation">
      <FrameworkRail active={t >= T.time ? 0 : 4} done={t >= T.time ? 4 : 3} time={t} appear={progress(t, 0.5, 1.5)} />

      {/* ============ Intro: landing ============ */}
      {introWin > 0 && (
        <g opacity={introWin}>
          <Title text="Land the Plane" kicker="CHAPTER 3 · LEVEL 4" subtitle="Step 4: wrap up" y={180} appear={progress(t, 0.3, 1.3)} />
          <rect x={560} y={520} width={680} height={40} rx={8} fill={C.panel2} />
          {Array.from({ length: 8 }, (_, i) => <rect key={i} x={590 + i * 82} y={537} width={44} height={6} rx={3} fill={C.amber} opacity={0.8} />)}
          <Plane x={planeX} y={planeY} angle={tween(t, 1, 13, 18, 0)} />
          <InterviewClock x={160} y={480} r={80} minute={tween(t, 1, 14, 38, 41, ease.linear)} appear={progress(t, 2, 3)} />
          <Character who="maya" mood="neutral" x={1110} y={330} size={110} time={t} talking={between(t, 9, 14)} bubble="left"
            appear={fadeWindow(t, 8.5, 15.8, 0.4)} say="We have about five minutes left..." />
        </g>
      )}

      {/* ============ Wrap-up directions ============ */}
      {dirWin > 0 && (
        <g opacity={dirWin}>
          <Panel x={50} y={100} w={440} h={420} title="Wrap-up directions" color={C.emerald} />
          {DIRECTIONS.map((d, i) => (
            <g key={d.text} opacity={i === dirActive ? 1 : 0.6}>
              <CheckRow x={70} y={160 + i * 60} w={400} text={d.text} ok appear={progress(t, d.at, d.at + 0.6)} size={i === dirActive ? 18 : 16} />
            </g>
          ))}
          {between(t, T.wrap, 30) && (
            <g>
              <Character who="maya" mood="neutral" x={700} y={330} size={110} time={t} talking={between(t, 16.5, 21)}
                appear={progress(t, 16.3, 17)} say="Any follow-ups you'd like to discuss?" />
              <Character who="player" mood={t < 25 ? 'proud' : 'worried'} x={1080} y={560} size={100} time={t} bubble="left" talking={between(t, 21.5, 25)}
                appear={progress(t, 21, 21.7)} say="Nope. My design is perfect." />
              {t >= 25 && <CrossMark x={1050} y={330} t={progress(t, 25, 25.8)} size={110} />}
              <Chip x={760} y={630} text="Never say it's perfect: there is always something to improve" color={C.rose} size={16} appear={progress(t, 25.5, 26.2)} />
            </g>
          )}
          {/* 1. bottlenecks */}
          {between(t, 30, 40) && (
            <Hotspot id="bottlenecks" interactive={interactive} onClick={onHotspot} x={1150} y={160} time={t} label="Bottlenecks">
              <g opacity={fadeWindow(t, 30, 40, 0.4)}>
                <Node kind="web" label="Web tier" x={640} y={300} time={t} />
                <Node kind="db" label="Single primary DB" x={940} y={300} time={t} state={t >= 32 ? 'overloaded' : 'idle'} />
                <Link from={{ x: 640, y: 300 }} to={{ x: 940, y: 300 }} color={C.rose} animated time={t} state="hot" />
                <Callout x={600} y={420} width={520} title="Show critical thinking" color={C.emerald} size={16}
                  text="Name the bottleneck and how you'd improve it: add read replicas, shard later. A great final impression." appear={progress(t, 33, 33.8)} />
              </g>
            </Hotspot>
          )}
          {/* 2. recap */}
          {between(t, 40, 50) && (
            <g opacity={fadeWindow(t, 40, 50, 0.4)}>
              <Label x={860} y={160} text="Recap: refresh the interviewer's memory" size={22} color={C.white} weight={800} />
              {['Scope: 10M DAU news feed', 'Blueprint: LB, web, cache, DB, queue', 'Deep dives: fan-out + retrieval', 'Option B we discussed: pull model'].map((s, i) => (
                <StickyNote key={s} x={560 + (i % 2) * 300} y={210 + Math.floor(i / 2) * 150} w={270} rot={i % 2 ? 2 : -2}
                  color={[C.cyan, C.violet, C.amber, C.emerald][i]} text={s} appear={progress(t, 41 + i * 1.3, 41.6 + i * 1.3)} />
              ))}
              <Label x={860} y={540} text="Especially useful if you suggested several solutions" size={16} color={C.dim} opacity={progress(t, 46, 46.6)} />
            </g>
          )}
          {/* 3. error cases */}
          {between(t, 50, 60) && (
            <Hotspot id="errors" interactive={interactive} onClick={onHotspot} x={1150} y={160} time={t} label="Error cases">
              <g opacity={fadeWindow(t, 50, 60, 0.4)}>
                <Node kind="web" label="Server failure" x={680} y={300} time={t} state={t >= 52 ? 'down' : 'idle'} />
                <Explosion x={680} y={300} t={progress(t, 52, 53)} size={110} />
                <Node kind="datacenter" label="Network loss" x={980} y={300} time={t} state={t >= 54 ? 'down' : 'idle'} />
                <Link from={{ x: 680, y: 300 }} to={{ x: 980, y: 300 }} color={C.dim} state={t >= 54 ? 'down' : 'ok'} />
                <Callout x={600} y={420} width={520} title="What happens when things break?" color={C.amber} size={16}
                  text="Server failure, network loss... Walking through error cases is always an interesting topic." appear={progress(t, 55, 55.8)} />
              </g>
            </Hotspot>
          )}
          {/* 4. operations */}
          {between(t, 60, 70) && (
            <Hotspot id="ops" interactive={interactive} onClick={onHotspot} x={1150} y={160} time={t} label="Operation issues">
              <g opacity={fadeWindow(t, 60, 70, 0.4)}>
                <Node kind="metrics" label="Metrics" x={620} y={290} time={t} appear={progress(t, 61, 61.7)} state="active" />
                <Node kind="logging" label="Error logs" x={840} y={290} time={t} appear={progress(t, 62, 62.7)} />
                <Node kind="ci" label="Rollout" x={1060} y={290} time={t} appear={progress(t, 63, 63.7)} />
                <Callout x={600} y={420} width={520} title="Operation issues" color={C.sky} size={16}
                  text="How do you monitor metrics and error logs? How do you roll the system out?" appear={progress(t, 64, 64.8)} />
              </g>
            </Hotspot>
          )}
          {/* 5. next scale curve */}
          {between(t, 70, 80) && (
            <g opacity={fadeWindow(t, 70, 80, 0.4)}>
              <Counter x={860} y={170} value={users} time={t} bump={between(t, 72, 78)} />
              {Array.from({ length: 10 }, (_, i) => (
                <Node key={i} kind="web" label="" x={600 + (i % 5) * 130} y={290 + Math.floor(i / 5) * 120} size={70} time={t}
                  appear={i < 2 ? 1 : progress(t, 72 + i * 0.5, 72.6 + i * 0.5)} />
              ))}
              <Label x={860} y={560} text="Supports 1M users today. What changes for 10M?" size={19} color={C.amber} weight={800} opacity={progress(t, 73, 73.6)} />
            </g>
          )}
          {/* 6. refinements */}
          {between(t, 80, 92) && (
            <g opacity={fadeWindow(t, 80, 92, 0.4)}>
              <Label x={860} y={170} text="If I had more time, I would..." size={24} color={C.white} weight={800} />
              {['...add a ranking model behind a flag', '...cache hot celebrity posts separately', '...rate-limit posting to stop spam'].map((s, i) => (
                <Appear key={s} p={progress(t, 81.5 + i * 1.5, 82.2 + i * 1.5)} from="left">
                  <Chip x={860} y={250 + i * 70} text={s} color={C.violet} size={18} />
                </Appear>
              ))}
              <Label x={860} y={500} text="Propose refinements. You are not done until the interviewer says so." size={17} color={C.dim} opacity={progress(t, 86, 86.6)} />
            </g>
          )}
        </g>
      )}

      {/* ============ Dos and don'ts ============ */}
      {dosWin > 0 && (
        <Hotspot id="dos-donts" interactive={interactive} onClick={onHotspot} active={t >= 93} x={1230} y={100} time={t} label="Dos and don'ts">
          <g opacity={dosWin}>
            <Panel x={40} y={100} w={590} h={540} title="Dos" color={C.emerald} />
            <Panel x={650} y={100} w={590} h={540} title="Don'ts" color={C.rose} />
            {DOS.map((d, i) => (
              <CheckRow key={d} x={56} y={150 + i * 60} w={560} text={d.length > 52 ? `${d.slice(0, 50)}…` : d} ok size={15}
                appear={progress(t, 93 + i * 2.6, 93.6 + i * 2.6)} />
            ))}
            {DONTS.map((d, i) => (
              <CheckRow key={d} x={666} y={150 + i * 60} w={560} text={d.length > 52 ? `${d.slice(0, 50)}…` : d} ok={false} size={15}
                appear={progress(t, 114 + i * 3, 114.6 + i * 3)} />
            ))}
          </g>
        </Hotspot>
      )}

      {/* ============ Time allocation ============ */}
      {timeWin > 0 && (
        <g opacity={timeWin}>
          <Hotspot id="time-split" interactive={interactive} onClick={onHotspot} active={t >= 135} x={420} y={140} time={t} label="Time allocation">
            <InterviewClock x={250} y={340} r={160} minute={sweep} />
          </Hotspot>
          <Label x={250} y={565} text="A rough guide for 45 minutes" size={17} color={C.dim} />
          {STEPS.map((s, i) => {
            const y = 170 + i * 90;
            const at = 136 + i * 3;
            const scale = 520 / 30;
            return (
              <g key={s.n} opacity={progress(t, at, at + 0.6) * (1 - progress(t, 155, 156))}>
                <text x={500} y={y} fontSize={18} fontWeight={800} fill={s.color}>{s.n}. {s.title}</text>
                <rect x={500} y={y + 14} width={520} height={20} rx={10} fill={C.panel2} />
                <rect x={500 + s.min * scale} y={y + 14} width={(s.max - s.min) * scale * progress(t, at, at + 1, ease.outCubic)} height={20} rx={10} fill={s.color} />
                <text x={1040} y={y + 30} fontSize={17} fontWeight={800} fill={C.white} fontFamily="ui-monospace, monospace">{s.min}-{s.max} min</text>
              </g>
            );
          })}
          <Label x={760} y={540} text="Rough estimate: the real split depends on the problem and the interviewer" size={15} color={C.dim} opacity={progress(t, 149, 150) * (1 - progress(t, 155, 156))} />
          {t >= 156 && (
            <g>
              <Sparkles x={880} y={380} t={progress(t, 156, 158)} radius={260} />
              <Appear p={progress(t, 156, 156.8, ease.outBack)} from="pop" x={880} y={330}>
                <rect x={600} y={250} width={560} height={180} rx={24} fill={C.panel} stroke={C.violet} strokeWidth={4} />
                <text x={880} y={310} textAnchor="middle" fontSize={20} fontWeight={800} fill={C.dim}>UNLOCKED</text>
                <text x={880} y={365} textAnchor="middle" fontSize={44} fontWeight={900} fill={C.violet}>Interview Mode</text>
                <text x={880} y={405} textAnchor="middle" fontSize={17} fontWeight={600} fill={C.text}>Real prompts. 45 minutes. All four steps.</text>
              </Appear>
              <Character who="ravi" mood="proud" x={640} y={570} size={100} time={t} talking={between(t, 160, 170)}
                appear={progress(t, 159, 159.8)} say="Clarify, blueprint, deep dive, wrap up. You're ready." />
            </g>
          )}
        </g>
      )}
    </Stage>
  );
}
