import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, CrossMark, Hotspot, Label, Meter, Panel, Sparkles, Stage, Title,
  between, ease, fadeWindow, progress, pulse, tween, typewriter,
} from '@/scenekit';
import { Box, ChatBubble, CheckRow, FrameworkRail, StickyNote, Whiteboard } from '../kit';
import { STARTER_QUESTIONS } from '../framework';
import { QA, REQUIREMENT_NOTES } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  signals: 22,
  jimmy: 62,
  questions: 92,
  example: 122,
  end: 168,
} as const;

/** Start of each news-feed Q&A pair (question; the answer follows 2.5 s later). */
export const QA_AT = [126, 131, 136, 142, 147, 152];

const SCHEDULE = [
  ['09:00', 'Coding round'],
  ['10:00', 'Behavioral'],
  ['11:00', 'Lunch with the team'],
  ['12:00', 'System Design Interview'],
];

const SIGNALS = [
  { at: 33, text: 'Collaborates like a teammate' },
  { at: 37.5, text: 'Works well under pressure' },
  { at: 40, text: 'Resolves ambiguity constructively' },
  { at: 43, text: 'Asks good questions' },
];

/** A cartoon classroom kid; Jimmy (index 0) raises his hand. */
function Kid({ x, y, color, hand, time }: { x: number; y: number; color: string; hand: number; time: number }) {
  const wave = hand > 0 ? Math.sin(time * 9) * 6 * hand : 0;
  return (
    <g>
      {hand > 0 && <line x1={x + 18} y1={y + 10} x2={x + 30 + wave} y2={y - 46 * hand} stroke={color} strokeWidth={9} strokeLinecap="round" />}
      <rect x={x - 26} y={y + 6} width={52} height={44} rx={16} fill={color} opacity={0.8} />
      <circle cx={x} cy={y - 10} r={20} fill="#fcd9b6" />
      <circle cx={x - 7} cy={y - 12} r={2.5} fill={C.bg} />
      <circle cx={x + 7} cy={y - 12} r={2.5} fill={C.bg} />
      <path d={`M${x - 7} ${y - 2} Q${x} ${y + 4} ${x + 7} ${y - 2}`} stroke={C.bg} strokeWidth={2} fill="none" />
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;

  /* ---------------- Chapter 1: the dreaded line on the schedule ---------------- */
  const introOut = 1 - progress(t, 20.5, 22);
  const schedule = progress(t, 3, 4.5) * introOut;

  /* ---------------- Chapter 2: signals and red flags ---------------- */
  const signalsWin = fadeWindow(t, T.signals + 0.5, T.jimmy - 0.5, 0.6);
  const tower = Math.floor(tween(t, 48.5, 56, 0, 9, ease.linear));
  const towerCost = tween(t, 48.5, 56.5, 0.1, 1.15, ease.inQuad);

  /* ---------------- Chapter 3: Jimmy ---------------- */
  const classWin = fadeWindow(t, T.jimmy + 0.4, T.questions - 0.3, 0.6);
  const hand = between(t, 64.5, 82) ? progress(t, 64.5, 65.2, ease.outBack) : 0;

  /* ---------------- Chapter 4 & 5: the whiteboard ---------------- */
  const boardWin = progress(t, T.questions + 0.3, T.questions + 1.3);
  const qaIndex = QA_AT.reduce((acc, at, i) => (t >= at ? i : acc), -1);
  const qaDone = t >= 157;

  return (
    <Stage time={t} drift title="Chapter 3, Level 1: understand the problem and establish design scope">
      <FrameworkRail active={t >= T.questions ? 1 : 0} time={t} appear={progress(t, T.questions, T.questions + 1)} />

      {/* ============ Chapter 1 ============ */}
      <Title text="Ask Before You Build" kicker="CHAPTER 3 · LEVEL 1 · THE INTERVIEW" subtitle="Step 1: understand the problem and establish design scope" y={140}
        appear={t < 6 ? progress(t, 0.3, 1.3) : 1 - progress(t, 5, 6)} />
      {schedule > 0 && (
        <g opacity={schedule}>
          <Panel x={420} y={230} w={440} h={250} title="Your on-site schedule" color={C.sky} />
          {SCHEDULE.map(([at, what], i) => {
            const hot = i === 3 && t >= 6.5;
            return (
              <g key={at}>
                <rect x={440} y={276 + i * 46} width={400} height={38} rx={10} fill={hot ? `${C.rose}33` : C.panel2}
                  stroke={hot ? C.rose : 'none'} strokeWidth={hot ? 2 + pulse(t, 0.8) * 2 : 0} />
                <text x={458} y={301 + i * 46} fontSize={16} fill={C.dim} fontWeight={700} fontFamily="monospace">{at}</text>
                <text x={530} y={301 + i * 46} fontSize={17} fill={hot ? C.white : C.text} fontWeight={hot ? 800 : 500}>{what}</text>
              </g>
            );
          })}
        </g>
      )}
      <Character who="player" mood={t < 7 ? 'happy' : 'worried'} x={170} y={610} size={130} time={t} talking={between(t, 7, 10)}
        appear={fadeWindow(t, 4, 21.5, 0.5)} say={t < 15 ? 'Design a WHOLE product... in one hour?!' : undefined} />
      <Chip x={860} y={530} text={'"Design a well-known product X"'} color={C.amber} size={18} appear={fadeWindow(t, 10.5, 15.5, 0.4)} />
      <Character who="ravi" mood="happy" x={1060} y={380} size={130} time={t} talking={between(t, 15.5, 21)}
        appear={fadeWindow(t, 15, 21.5, 0.5)} bubble="left" say="Nobody expects that. They want to see HOW you think." />

      {/* ============ Chapter 2 ============ */}
      {signalsWin > 0 && (
        <g opacity={signalsWin}>
          <Character who="player" mood="neutral" x={160} y={250} size={110} time={t} talking={false} nameTag />
          <Character who="maya" mood="happy" x={160} y={470} size={110} time={t} nameTag />
          <Label x={160} y={385} text="+ co-worker" size={15} color={C.dim} />
          <Callout x={60} y={560} width={300} title="Two co-workers, one problem" color={C.violet} size={15}
            text="Open-ended, no perfect answer. The process beats the final design." appear={fadeWindow(t, 23, 32, 0.4)} />
          <Hotspot id="signals" interactive={interactive} onClick={onHotspot} active={between(t, 33, T.jimmy)} x={850} y={110} time={t} label="What interviewers look for">
            <Panel x={330} y={110} w={520} h={250} title="Interviewer's scorecard: signals" color={C.emerald} />
          </Hotspot>
          {SIGNALS.map((s, i) => (
            <CheckRow key={s.text} x={350} y={170 + i * 46} w={480} text={s.text} ok appear={progress(t, s.at, s.at + 0.6)} />
          ))}
          <Hotspot id="red-flags" interactive={interactive} onClick={onHotspot} active={between(t, 47, T.jimmy)} x={1230} y={110} time={t} label="Red flags">
            <Panel x={880} y={110} w={350} h={520} title="Red flags" color={C.rose} opacity={progress(t, 47, 48)} />
          </Hotspot>
          {t >= 48 && (
            <g>
              <Label x={1055} y={168} text="Over-engineering" size={19} color={C.rose} weight={800} />
              {Array.from({ length: tower }, (_, i) => (
                <rect key={i} x={985 + (i % 2) * 10} y={430 - i * 26} width={130 - (i % 2) * 20} height={22} rx={6}
                  fill={[C.cyan, C.violet, C.amber, C.sky, C.orange][i % 5]} opacity={0.85} />
              ))}
              <Meter x={920} y={470} w={270} value={towerCost} label="Compounding cost" />
            </g>
          )}
          <CheckRow x={900} y={530} w={310} text="Narrow-mindedness" ok={false} appear={progress(t, 58, 58.6)} />
          <CheckRow x={900} y={580} w={310} text="Stubbornness" ok={false} appear={progress(t, 59, 59.6)} />
          <Callout x={330} y={400} width={520} title="Design purity ≠ good design" color={C.rose} size={15}
            text="Engineers who chase purity and ignore trade-offs build systems whose costs compound. Don't show that tendency in the room."
            appear={fadeWindow(t, 52.5, 61.5, 0.4)} />
        </g>
      )}

      {/* ============ Chapter 3: Jimmy ============ */}
      {classWin > 0 && (
        <g opacity={classWin}>
          <Hotspot id="jimmy" interactive={interactive} onClick={onHotspot} active={between(t, 64, T.questions)} x={1150} y={120} time={t} label="Don't be like Jimmy">
            <Panel x={130} y={120} w={1020} h={430} title="Classroom" color={C.amber} />
          </Hotspot>
          <rect x={360} y={160} width={560} height={90} rx={12} fill="#0f2a1f" stroke="#3f6212" strokeWidth={4} />
          <text x={640} y={215} textAnchor="middle" fontSize={28} fontWeight={700} fill={C.white} fontFamily="'Comic Sans MS', ui-rounded, sans-serif">
            {typewriter('Why did the tiger roar?', t, 63, 14)}
          </text>
          {[0, 1, 2, 3, 4].map((i) => (
            <Kid key={i} x={300 + i * 170} y={430} color={[C.emerald, C.sky, C.violet, C.orange, C.rose][i]} hand={i === 0 ? hand : 0} time={t} />
          ))}
          <Label x={300} y={510} text="Jimmy" size={16} color={C.emerald} weight={800} />
          {fadeWindow(t, 67, 76, 0.3) > 0 && (
            <Appear p={progress(t, 67, 67.6, ease.outBack)} from="pop" x={330} y={300}>
              <g opacity={fadeWindow(t, 67, 76, 0.3)}>
                <rect x={330} y={270} width={300} height={56} rx={18} fill={C.white} />
                <path d="M350 322 L320 352 L380 326 Z" fill={C.white} />
                <text x={480} y={306} textAnchor="middle" fontSize={22} fontWeight={800} fill={C.bg}>Because he was HUNGRY!</text>
              </g>
            </Appear>
          )}
          <Chip x={640} y={590} text="Fast answer ≠ good answer. No bonus points for speed." color={C.amber} size={17} appear={fadeWindow(t, 72.5, 82, 0.4)} />
          {t >= 77 && (
            <Appear p={progress(t, 77, 77.8, ease.outBack)} from="scale" x={760} y={330}>
              <g transform="rotate(-8 760 330)">
                <rect x={560} y={290} width={400} height={84} rx={16} fill="none" stroke={C.rose} strokeWidth={6} />
                <text x={760} y={345} textAnchor="middle" fontSize={34} fontWeight={900} fill={C.rose}>DON'T be like Jimmy</text>
              </g>
            </Appear>
          )}
          <Character who="ravi" mood="neutral" x={1040} y={420} size={110} time={t} talking={between(t, 87, 91.5)} bubble="left"
            appear={fadeWindow(t, 86.5, 92, 0.4)} say="Slow down. Think. Ask questions first." />
        </g>
      )}

      {/* ============ Chapter 4 & 5: the whiteboard ============ */}
      {boardWin > 0 && (
        <Whiteboard x={640} y={100} w={600} h={520} appear={boardWin}
          title={t < T.example ? 'Design ...something?' : 'Design a news feed system'} />
      )}
      {/* temptation: drawing the final design straight away */}
      {between(t, 92.5, 97.5) && (
        <g opacity={1 - progress(t, 96.8, 97.5)}>
          <Box x={760} y={240} w={150} text="Kafka?!" color={C.orange} appear={progress(t, 93, 93.5)} />
          <Box x={940} y={240} w={150} text="Sharded DB" color={C.violet} appear={progress(t, 93.5, 94)} />
          <Box x={1110} y={240} w={150} text="ML ranker" color={C.sky} appear={progress(t, 94, 94.5)} />
          <Box x={850} y={340} w={170} text="10 caches" color={C.amber} appear={progress(t, 94.5, 95)} />
          <CrossMark x={940} y={300} t={progress(t, 95.2, 96)} size={150} />
          <Label x={940} y={430} text="The wrong system, built very fast" size={18} color={C.rose} weight={800} opacity={progress(t, 95.4, 96)} />
        </g>
      )}
      {between(t, T.questions, T.example) && (
        <g opacity={1 - progress(t, T.example - 0.6, T.example)}>
          <Character who="player" mood="happy" x={610} y={590} size={80} time={t} talking={between(t, 97, 117)} />
          {STARTER_QUESTIONS.map((q, i) => (
            <ChatBubble key={q} x={40} y={108 + i * 104} w={560} who="player" tag={`question ${i + 1}`} text={q}
              chars={(t - (97 + i * 5)) * 30} appear={progress(t, 97 + i * 5, 97.6 + i * 5)} />
          ))}
          {t >= 117 && (
            <g>
              <Label x={940} y={240} text={'Interviewer: "You decide."'} size={20} color={C.violet} weight={700} opacity={progress(t, 117, 117.5)} />
              <Hotspot id="assumptions" interactive={interactive} onClick={onHotspot} x={1100} y={300} time={t} label="Write down assumptions">
                <StickyNote x={800} y={290} w={300} text="Assumption: launch in one country first" appear={progress(t, 118, 118.8)} />
              </Hotspot>
              <Label x={940} y={420} text="Write it down. You may need it later." size={17} color={C.dim} opacity={progress(t, 119, 119.5)} />
            </g>
          )}
        </g>
      )}

      {/* news-feed example */}
      {t >= T.example && (
        <g>
          <Character who="maya" mood="neutral" x={110} y={170} size={90} time={t} talking={between(t, 122, 125.5)} nameTag
            say={t < 126 ? 'Design a news feed system.' : undefined} appear={progress(t, 122, 122.8)} />
          {QA.map((qa, i) => {
            const at = QA_AT[i];
            const next = QA_AT[i + 1] ?? 157;
            const win = fadeWindow(t, at, next - 0.2, 0.3);
            if (win <= 0) return null;
            return (
              <g key={qa.key} opacity={win}>
                <ChatBubble x={60} y={270} w={540} who="player" tag="candidate" text={qa.q} chars={(t - at) * 40} appear={progress(t, at, at + 0.5)} />
                <ChatBubble x={60} y={390} w={540} who="maya" tag="interviewer" text={qa.a} chars={(t - at - 2.5) * 40} appear={progress(t, at + 2.4, at + 2.9)} />
              </g>
            );
          })}
          <Hotspot id="requirements" interactive={interactive} onClick={onHotspot} active={t >= 157} x={1220} y={150} time={t} label="Clarified requirements">
            <g>
              {QA.map((qa, i) => (
                <StickyNote key={qa.key} x={680 + (i % 3) * 186} y={170 + Math.floor(i / 3) * 140} w={172} rot={i % 2 ? 3 : -3}
                  color={[C.amber, C.emerald, C.sky, C.violet, C.rose, C.orange][i]} text={REQUIREMENT_NOTES[qa.key]}
                  appear={qaIndex >= i ? progress(t, QA_AT[i] + 3, QA_AT[i] + 3.6) : 0} />
              ))}
            </g>
          </Hotspot>
          {qaDone && (
            <g>
              <CheckMark x={940} y={520} t={progress(t, 157.5, 158.5)} size={70} />
              <Sparkles x={940} y={420} t={progress(t, 157.5, 159.5)} radius={240} />
              <Label x={940} y={585} text="Vague prompt → clear, written scope" size={20} color={C.emerald} weight={800} opacity={progress(t, 158, 159)} />
            </g>
          )}
          <Character who="ravi" mood="proud" x={330} y={565} size={90} time={t} talking={between(t, 162, 167)}
            appear={fadeWindow(t, 161.5, 168.5, 0.4)} say="Now you know what to build. Next: the blueprint." />
        </g>
      )}
    </Stage>
  );
}
