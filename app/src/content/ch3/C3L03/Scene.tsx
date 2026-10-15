import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, Hotspot, Label, Link, Node, Packet, Panel, Stage, Title,
  between, ease, fadeWindow, hash, linkPath, progress, tween, type Pt,
} from '@/scenekit';
import { Box, CheckRow, FrameworkRail, InterviewClock } from '../kit';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  checklist: 18,
  priorities: 44,
  time: 76,
  examples: 108,
  retrieval: 143,
  end: 170,
} as const;

const OBJECTIVES = [
  { at: 18.5, text: 'Agreed on the overall goals and feature scope' },
  { at: 23.5, text: 'Sketched a high-level blueprint' },
  { at: 28.5, text: 'Got the interviewer’s feedback on it' },
  { at: 33.5, text: 'Have initial ideas about where to dig deeper' },
];

const PUB = {
  user: { x: 110, y: 360 }, web: { x: 290, y: 360 }, fanout: { x: 480, y: 360 }, queue: { x: 680, y: 360 },
} satisfies Record<string, Pt>;
const WORKERS: Pt[] = [{ x: 870, y: 230 }, { x: 870, y: 360 }, { x: 870, y: 490 }];
const FEEDS: Pt[] = Array.from({ length: 8 }, (_, i) => ({ x: 1100 + (i % 2) * 90, y: 180 + Math.floor(i / 2) * 100 }));

const RET = {
  user: { x: 110, y: 380 }, web: { x: 290, y: 380 }, feed: { x: 500, y: 380 }, feedCache: { x: 760, y: 220 },
  postCache: { x: 760, y: 400 }, userCache: { x: 760, y: 570 }, cdn: { x: 1060, y: 380 },
} satisfies Record<string, Pt>;

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const checkWin = fadeWindow(t, T.checklist - 0.5, T.priorities - 0.3, 0.5);
  const prioWin = fadeWindow(t, T.priorities, T.time - 0.3, 0.5);
  const timeWin = fadeWindow(t, T.time, T.examples - 0.3, 0.5);
  const pubWin = fadeWindow(t, T.examples, T.retrieval - 0.3, 0.5);
  const retWin = fadeWindow(t, T.retrieval, T.end + 1, 0.5);
  /* the rabbit hole: the clock races while EdgeRank is explained */
  const minute = t < 86 ? tween(t, 76, 86, 20, 22, ease.linear) : t < 97 ? tween(t, 86, 96, 22, 40, ease.inQuad) : 40;

  return (
    <Stage time={t} drift title="Chapter 3, Level 3: design deep dive">
      <FrameworkRail active={3} done={2} time={t} appear={progress(t, 0.5, 1.5)} />

      {/* ============ Intro ============ */}
      <Title text="Dig Deep" kicker="CHAPTER 3 · LEVEL 3" subtitle="Step 3: design deep dive" y={170}
        appear={t < 7 ? progress(t, 0.3, 1.3) : 1 - progress(t, 6.5, 7.5)} />
      {t < T.checklist + 0.5 && (
        <g opacity={1 - progress(t, 17.5, 18.3)}>
          <Appear p={progress(t, 2, 3)} from="pop" x={640} y={420}>
            <Box x={520} y={420} w={150} text="Fanout" color={C.violet} />
            <Box x={760} y={420} w={150} text="Feed retrieval" color={C.emerald} />
            <g transform={`translate(${tween(t, 4, 9, 470, 760)} 410)`}>
              <circle r={70} fill={`${C.cyan}11`} stroke={C.cyan} strokeWidth={6} />
              <line x1={50} y1={50} x2={100} y2={100} stroke={C.cyan} strokeWidth={12} strokeLinecap="round" />
            </g>
          </Appear>
          <Character who="maya" mood="neutral" x={1050} y={520} size={110} time={t} talking={between(t, 6, 10.5)} bubble="left"
            appear={fadeWindow(t, 5.5, 17.5, 0.4)} say="Nice blueprint. Now show me how deep you can go." />
          <Character who="ravi" mood="neutral" x={200} y={540} size={110} time={t} talking={between(t, 11, 17)}
            appear={fadeWindow(t, 10.5, 17.5, 0.4)} say="First, check you've reached the starting line." />
        </g>
      )}

      {/* ============ Objectives before the dive ============ */}
      {checkWin > 0 && (
        <g opacity={checkWin}>
          <Hotspot id="objectives" interactive={interactive} onClick={onHotspot} active={t >= 19} x={760} y={110} time={t} label="Before the deep dive">
            <Panel x={80} y={110} w={680} h={290} title="Before the deep dive, you should have..." color={C.amber} />
          </Hotspot>
          {OBJECTIVES.map((o, i) => (
            <CheckRow key={o.text} x={110} y={175 + i * 56} w={620} text={o.text} ok appear={progress(t, o.at, o.at + 0.6)} size={18} />
          ))}
          <Label x={1000} y={150} text="Prioritise with the interviewer" size={20} color={C.amber} weight={800} opacity={progress(t, 38, 38.6)} />
          {[
            { text: 'Feed publishing', n: 1, color: C.violet },
            { text: 'Feed retrieval', n: 2, color: C.emerald },
            { text: 'Login page CSS', n: 0, color: C.dim },
          ].map((b, i) => (
            <g key={b.text}>
              <Box x={1000} y={220 + i * 80} w={230} text={b.text} color={b.color} appear={progress(t, 38.5 + i * 0.8, 39.1 + i * 0.8)} state={b.n ? undefined : 'dim'} />
              {b.n > 0 && <Chip x={860} y={220 + i * 80} text={`#${b.n}`} color={b.color} filled appear={progress(t, 40 + i, 40.6 + i)} />}
            </g>
          ))}
        </g>
      )}

      {/* ============ Every interview is different ============ */}
      {prioWin > 0 && (
        <Hotspot id="priorities" interactive={interactive} onClick={onHotspot} active={t >= 45} x={1230} y={100} time={t} label="Where to dig">
          <g opacity={prioWin}>
            <Label x={640} y={125} text="Every interview is different: read the signals" size={24} color={C.white} weight={800} />
            <Callout x={60} y={160} width={360} title='"Stay high level"' color={C.sky} size={16}
              text="Some interviewers hint they'd rather keep focusing on the high-level design." appear={progress(t, 49, 49.8)} />
            <Callout x={460} y={160} width={360} title="Senior candidate" color={C.amber} size={16}
              text="The discussion may be about performance: bottlenecks and resource estimations." appear={progress(t, 54, 54.8)} />
            <Callout x={860} y={160} width={360} title="Most interviews" color={C.violet} size={16}
              text="Dig into the details of some system components." appear={progress(t, 60, 60.8)} />
            <g opacity={progress(t, 65, 66)}>
              <Panel x={60} y={360} w={560} h={220} title="URL shortener" color={C.cyan} />
              <Chip x={340} y={425} text="https://very.long/url/with/many/parts" color={C.dim} size={13} />
              <Packet along={[{ x: 340, y: 445 }, { x: 260, y: 500 }]} time={t} start={66.5} end={68} color={C.cyan} />
              <Box x={240} y={515} w={170} h={46} text="hash function" color={C.cyan} />
              <Chip x={450} y={515} text="sho.rt/x7Gk" color={C.emerald} size={14} appear={progress(t, 68, 68.6)} />
              <Label x={340} y={565} text="the interesting deep dive" size={15} color={C.cyan} opacity={progress(t, 68.5, 69)} />
            </g>
            <g opacity={progress(t, 70, 71)}>
              <Panel x={660} y={360} w={560} h={220} title="Chat system" color={C.rose} />
              <Box x={800} y={450} w={220} h={46} text="Reduce latency" color={C.rose} />
              <Box x={1060} y={450} w={220} h={46} text="Online / offline" color={C.rose} />
              {[0, 1, 2].map((i) => (
                <circle key={i} cx={980 + i * 40} cy={530} r={10} fill={i === 2 ? C.dim : C.emerald} opacity={i === 2 ? 1 : 0.6 + 0.4 * Math.sin(t * 3 + i)} />
              ))}
              <Label x={940} y={565} text="presence dots" size={14} color={C.dim} />
            </g>
          </g>
        </Hotspot>
      )}

      {/* ============ Time management ============ */}
      {timeWin > 0 && (
        <g opacity={timeWin}>
          <InterviewClock x={250} y={340} r={150} minute={minute} />
          <Label x={250} y={560} text="45-minute session" size={18} color={C.dim} />
          <Hotspot id="edgerank" interactive={interactive} onClick={onHotspot} active={between(t, 86, T.examples)} x={1210} y={150} time={t} label="The EdgeRank rabbit hole">
            <g>
              <Character who="player" mood={t < 92 ? 'happy' : 'worried'} x={560} y={330} size={110} time={t} talking={between(t, 86, 95)}
                appear={fadeWindow(t, 85.5, 97.5, 0.4)} say="...and EdgeRank multiplies affinity by weight by time decay, and then..." />
              {between(t, 86, 97.5) && (
                <g>
                  {Array.from({ length: 10 }, (_, i) => (
                    <text key={i} x={760 + hash(i) * 380} y={160 + ((t * 40 + i * 47) % 380)} fontSize={18 + hash(i * 3) * 10} fill={C.dim}
                      opacity={0.6} fontFamily="ui-monospace, monospace">
                      {['affinity', 'weight', 'decay', 'Σ', 'edges', 'u·w·d', 'score', 'rank', 'ln(t)', '∂/∂t'][i]}
                    </text>
                  ))}
                  <Chip x={980} y={560} text={`−${Math.round(minute - 22)} min on a detail`} color={C.rose} filled size={18} appear={progress(t, 89, 89.6)} />
                </g>
              )}
            </g>
          </Hotspot>
          <Character who="maya" mood={t < 92 ? 'neutral' : 'worried'} x={1170} y={500} size={100} time={t} bubble="left"
            appear={fadeWindow(t, 91, 97.5, 0.4)} say="Interesting... but can it scale?" talking={between(t, 92, 95)} />
          {t >= 97 && (
            <g>
              <Label x={850} y={190} text="Show signals, not minutiae" size={26} color={C.emerald} weight={900} opacity={progress(t, 97, 97.8)} />
              {['Scalability', 'Trade-offs', 'Bottlenecks', 'Critical components first'].map((s, i) => (
                <CheckRow key={s} x={620} y={260 + i * 60} w={460} text={s} ok appear={progress(t, 98 + i * 1.2, 98.6 + i * 1.2)} size={19} />
              ))}
            </g>
          )}
        </g>
      )}

      {/* ============ Deep dive 1: feed publishing ============ */}
      {pubWin > 0 && (
        <Hotspot id="publish-deep" interactive={interactive} onClick={onHotspot} active={t >= 118} x={1230} y={100} time={t} label="Deep dive: feed publishing">
          <g opacity={pubWin}>
            <Panel x={40} y={100} w={1190} h={520} title="Deep dive 1 · Feed publishing (simplified preview)" color={C.violet} tint={0.03} />
            <Label x={640} y={160} text={t < 118 ? 'Two use cases to dig into: 1) feed publishing  2) news feed retrieval' : 'A user with 5,000 friends posts a photo'} size={20} color={C.white} weight={700} />
            <Link from={PUB.user} to={PUB.web} inset={46} color={C.sky} />
            <Link from={PUB.web} to={PUB.fanout} inset={60} color={C.violet} />
            {t >= 128 && <Link from={PUB.fanout} to={PUB.queue} inset={60} color={C.violet} draw={progress(t, 128, 128.8)} />}
            {t >= 129 && WORKERS.map((w, i) => <Link key={i} from={PUB.queue} to={w} inset={48} color={C.violet} draw={progress(t, 129 + i * 0.3, 129.6 + i * 0.3)} />)}
            <Node kind="client" label="User" x={PUB.user.x} y={PUB.user.y} size={78} time={t} />
            <Node kind="web" label="Web servers" x={PUB.web.x} y={PUB.web.y} size={82} time={t} state={t >= 123 && t < 128 ? 'overloaded' : 'idle'} />
            <Box x={PUB.fanout.x} y={PUB.fanout.y} w={150} text="Fanout svc" color={C.violet} />
            <Node kind="queue" label="Message queue" x={PUB.queue.x} y={PUB.queue.y} size={80} time={t} appear={progress(t, 128, 128.8)} />
            {WORKERS.map((w, i) => (
              <Node key={i} kind="worker" label={i === 1 ? 'Fanout workers' : ''} x={w.x} y={w.y} size={70} time={t} appear={progress(t, 129 + i * 0.3, 129.8 + i * 0.3)} state={t >= 133 ? 'active' : 'idle'} />
            ))}
            {FEEDS.map((f, i) => (
              <g key={i}>
                <Node kind="cache" label="" x={f.x} y={f.y} size={54} time={t} appear={progress(t, 132 + i * 0.2, 132.6 + i * 0.2)} state={t >= 134 + i * 0.4 ? 'active' : 'idle'} />
                {t >= 133 && <Packet along={linkPath(WORKERS[i % 3], f, 0, 36)} time={t} start={133 + i * 0.4} end={134 + i * 0.4} color={C.violet} size={6} />}
              </g>
            ))}
            {t >= 132 && <Label x={1145} y={590} text="friends' news feed caches ×5,000" size={15} color={C.amber} />}
            <Packet along={[PUB.user, PUB.web, PUB.fanout]} time={t} start={119} end={121.5} color={C.sky} label="new post" shape="envelope" />
            {between(t, 123, 128) && (
              <g>
                <Chip x={290} y={250} text="5,000 writes inside one request?!" color={C.rose} filled size={16} />
                <Label x={290} y={470} text="posting takes forever..." size={16} color={C.rose} />
              </g>
            )}
            <Chip x={640} y={590} text="Posting stays fast; the heavy work happens in the background" color={C.emerald} size={16} appear={fadeWindow(t, 138, 142.7, 0.3)} />
          </g>
        </Hotspot>
      )}

      {/* ============ Deep dive 2: news feed retrieval ============ */}
      {retWin > 0 && (
        <Hotspot id="retrieval-deep" interactive={interactive} onClick={onHotspot} active={t >= 145} x={1230} y={100} time={t} label="Deep dive: news feed retrieval">
          <g opacity={retWin}>
            <Panel x={40} y={100} w={1190} h={540} title="Deep dive 2 · News feed retrieval (simplified preview)" color={C.emerald} tint={0.03} />
            <Link from={RET.user} to={RET.web} inset={46} color={C.sky} />
            <Link from={RET.web} to={RET.feed} inset={60} color={C.emerald} />
            <Link from={RET.feed} to={RET.feedCache} inset={70} color={C.amber} draw={progress(t, 147, 147.8)} />
            <Link from={RET.feed} to={RET.postCache} inset={70} color={C.amber} draw={progress(t, 152, 152.8)} />
            <Link from={RET.feed} to={RET.userCache} inset={70} color={C.amber} draw={progress(t, 152.5, 153.3)} />
            <Link from={RET.user} to={RET.cdn} inset={50} bend={-170} color={C.orange} dashed draw={progress(t, 157.5, 158.5)} />
            <Node kind="mobile" label="User" x={RET.user.x} y={RET.user.y} size={78} time={t} />
            <Node kind="web" label="Web servers" x={RET.web.x} y={RET.web.y} size={82} time={t} />
            <Box x={RET.feed.x} y={RET.feed.y} w={180} text="News feed svc" color={C.emerald} />
            <Node kind="cache" label="News feed cache (post IDs)" x={RET.feedCache.x} y={RET.feedCache.y} size={78} time={t} appear={progress(t, 147, 147.8)} state={between(t, 149, 151) ? 'active' : 'idle'} />
            <Node kind="cache" label="Post cache" x={RET.postCache.x} y={RET.postCache.y} size={78} time={t} appear={progress(t, 152, 152.8)} state={between(t, 154, 156) ? 'active' : 'idle'} />
            <Node kind="cache" label="User cache" x={RET.userCache.x} y={RET.userCache.y} size={78} time={t} appear={progress(t, 152.5, 153.3)} state={between(t, 154, 156) ? 'active' : 'idle'} />
            <Node kind="cdn" label="CDN (images, video)" x={RET.cdn.x} y={RET.cdn.y} size={88} time={t} appear={progress(t, 157.5, 158.3)} state={t >= 159 ? 'active' : 'idle'} />
            <Packet along={[RET.user, RET.web, RET.feed]} time={t} start={144} end={146.5} color={C.sky} label="GET /feed" shape="envelope" />
            <Packet along={linkPath(RET.feedCache, RET.feed, 0, 70)} time={t} start={149} end={150.5} color={C.amber} label="[812, 799, 790…]" />
            <Packet along={linkPath(RET.postCache, RET.feed, 0, 70)} time={t} start={154} end={155.3} color={C.amber} label="posts" />
            <Packet along={linkPath(RET.userCache, RET.feed, 0, 70)} time={t} start={154.3} end={155.6} color={C.amber} label="names, avatars" />
            <Packet along={linkPath(RET.cdn, RET.user, 170, 50)} time={t} start={159} end={161} color={C.orange} label="photo.jpg" />
            {t >= 164 && (
              <g>
                <CheckMark x={1060} y={520} t={progress(t, 164, 165)} size={56} />
                <Label x={1060} y={585} text="Deep dives where it matters" size={17} color={C.emerald} weight={800} opacity={progress(t, 164.5, 165.2)} />
              </g>
            )}
          </g>
        </Hotspot>
      )}
    </Stage>
  );
}
