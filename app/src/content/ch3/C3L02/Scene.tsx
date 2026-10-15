import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, CrossMark, Hotspot, Label, Link, Meter, Node, Packet, Panel, Sparkles, Stage, Title,
  between, cueIndex, ease, fadeWindow, linkPath, progress, pulse, type Pt,
} from '@/scenekit';
import { Box, FrameworkRail, StickyNote, Whiteboard } from '../kit';
import { PEAK_QPS, QPS } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  buyin: 18,
  boxes: 48,
  envelope: 80,
  usecases: 104,
  publish: 128,
  build: 152,
  end: 174,
} as const;

const LOOP = ['Propose', 'Feedback', 'Refine'];

/* Box-diagram layout (chapter 3 of the lesson) */
const BD = {
  client: { x: 150, y: 250 }, mobile: { x: 150, y: 470 }, cdn: { x: 420, y: 150 }, web: { x: 470, y: 360 },
  db: { x: 820, y: 230 }, cache: { x: 820, y: 400 }, queue: { x: 820, y: 540 }, worker: { x: 1090, y: 540 },
} satisfies Record<string, Pt>;

/* Flow layouts (chapters 6 and 7) */
const PUB = {
  user: { x: 110, y: 380 }, dns: { x: 250, y: 200 }, lb: { x: 270, y: 380 }, web: { x: 450, y: 380 },
  post: { x: 690, y: 230 }, fanout: { x: 690, y: 380 }, notify: { x: 690, y: 530 },
  postCache: { x: 930, y: 170 }, postDb: { x: 1150, y: 270 }, feedCache: { x: 990, y: 380 }, friends: { x: 990, y: 560 },
} satisfies Record<string, Pt>;
const BLD = {
  user: { x: 130, y: 380 }, lb: { x: 340, y: 380 }, web: { x: 550, y: 380 }, feed: { x: 800, y: 380 }, feedCache: { x: 1080, y: 380 },
} satisfies Record<string, Pt>;

const NAPKIN = [
  { at: 90.5, text: '10M DAU × 10 feed views/day = 100M views/day', color: C.text },
  { at: 95.5, text: `100M ÷ 86,400 s ≈ ${QPS.toLocaleString('en-US')} QPS (~1,200)`, color: C.cyan },
  { at: 100, text: `Peak ≈ 2 × QPS ≈ ${PEAK_QPS.toLocaleString('en-US')} QPS`, color: C.amber },
];

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const loopStep = cueIndex(t, [19, 24, 29, 34, 39]);
  const boxesWin = fadeWindow(t, T.boxes, T.envelope - 0.3, 0.5);
  const napkinWin = fadeWindow(t, T.envelope, T.usecases - 0.3, 0.5);
  const useWin = fadeWindow(t, T.usecases, T.publish - 0.3, 0.5);
  const pubWin = fadeWindow(t, T.publish, T.build - 0.3, 0.5);
  const bldWin = fadeWindow(t, T.build, T.end + 1, 0.5);
  const webLoad = t < 100 ? 1157 / 2000 : PEAK_QPS / 2000;

  return (
    <Stage time={t} drift title="Chapter 3, Level 2: propose a high-level design and get buy-in">
      <FrameworkRail active={2} done={1} time={t} appear={progress(t, 0.5, 1.5)} />

      {/* ============ Intro ============ */}
      <Title text="Blueprint" kicker="CHAPTER 3 · LEVEL 2" subtitle="Step 2: propose a high-level design and get buy-in" y={170}
        appear={t < 7 ? progress(t, 0.3, 1.3) : 1 - progress(t, 6.5, 7.5)} />
      <Character who="maya" mood="neutral" x={900} y={420} size={120} time={t} talking={between(t, 6, 9.5)} bubble="left" nameTag
        appear={fadeWindow(t, 5.5, 17.5, 0.5)} say="Scope agreed. Now show me a design." />
      <Character who="ravi" mood="happy" x={330} y={430} size={120} time={t} talking={between(t, 10.5, 17)} nameTag
        appear={fadeWindow(t, 10, 17.5, 0.5)} say="It's a team sport. Design WITH her, not at her." />

      {/* ============ Buy-in loop ============ */}
      {between(t, T.buyin, T.boxes) && (
        <g opacity={fadeWindow(t, T.buyin, T.boxes, 0.5)}>
          <Whiteboard x={60} y={100} w={640} h={470} title="Initial blueprint" />
          <Box x={190} y={260} w={140} text="Web client" color={C.sky} appear={progress(t, 19.5, 20.2)} />
          <Box x={190} y={380} w={140} text="Mobile client" color={C.sky} appear={progress(t, 31, 31.7)} />
          <Box x={400} y={320} w={140} text="Web servers" color={C.cyan} appear={progress(t, 20.5, 21.2)} />
          <Box x={600} y={320} w={120} text="Database" color={C.emerald} appear={progress(t, 21.5, 22.2)} />
          {t >= 21 && <Link from={{ x: 190, y: 260 }} to={{ x: 400, y: 320 }} inset={72} color={C.sky} draw={progress(t, 21, 21.6)} />}
          {t >= 31.5 && <Link from={{ x: 190, y: 380 }} to={{ x: 400, y: 320 }} inset={72} color={C.sky} draw={progress(t, 31.5, 32.1)} />}
          {t >= 22 && <Link from={{ x: 400, y: 320 }} to={{ x: 600, y: 320 }} inset={70} color={C.emerald} draw={progress(t, 22, 22.6)} />}
          {/* feedback loop */}
          <g transform="translate(960 300)">
            <circle r={120} fill="none" stroke={C.line} strokeWidth={3} strokeDasharray="10 10" />
            {LOOP.map((s, i) => {
              const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
              const on = loopStep >= 0 && loopStep % 3 === i;
              return (
                <g key={s} transform={`translate(${Math.cos(a) * 120} ${Math.sin(a) * 120})`}>
                  <circle r={on ? 50 + pulse(t, 0.8) * 4 : 46} fill={on ? `${C.violet}44` : C.panel} stroke={on ? C.violet : C.line} strokeWidth={on ? 3 : 2} />
                  <text y={6} textAnchor="middle" fontSize={17} fontWeight={800} fill={on ? C.white : C.dim}>{s}</text>
                </g>
              );
            })}
            <circle cx={Math.cos(t * 1.3) * 120} cy={Math.sin(t * 1.3) * 120} r={7} fill={C.violet} filter="url(#sk-glow)" />
          </g>
          <Character who="maya" mood="neutral" x={1150} y={540} size={90} time={t} talking={between(t, 28, 31)} bubble="left"
            appear={fadeWindow(t, 27.5, 33, 0.4)} say="Where do mobile users connect?" />
          <Character who="player" mood="happy" x={800} y={545} size={90} time={t} talking={between(t, 24, 27)}
            appear={fadeWindow(t, 23.5, 27.5, 0.4)} say="Here's my first sketch. Thoughts?" />
          {t >= 38 && (
            <Hotspot id="buy-in" interactive={interactive} onClick={onHotspot} x={1080} y={500} time={t} label="Buy-in">
              <Appear p={progress(t, 38, 38.8, ease.outBack)} from="pop" x={960} y={500}>
                <rect x={840} y={470} width={240} height={60} rx={20} fill={`${C.emerald}22`} stroke={C.emerald} strokeWidth={3} />
                <text x={960} y={509} textAnchor="middle" fontSize={24} fontWeight={900} fill={C.emerald}>Buy-in ✓</text>
              </Appear>
            </Hotspot>
          )}
        </g>
      )}

      {/* ============ Box diagram ============ */}
      {boxesWin > 0 && (
        <g opacity={boxesWin}>
          <Hotspot id="box-diagram" interactive={interactive} onClick={onHotspot} active={t >= 50} x={1230} y={110} time={t} label="Box diagram">
            <Panel x={50} y={90} w={1180} h={540} title="Whiteboard: key components" color={C.violet} tint={0.04} />
          </Hotspot>
          <Node kind="client" label="Web" x={BD.client.x} y={BD.client.y} size={88} time={t} appear={progress(t, 53.5, 54.3)} />
          <Node kind="mobile" label="Mobile" x={BD.mobile.x} y={BD.mobile.y} size={88} time={t} appear={progress(t, 54, 54.8)} />
          <Node kind="web" label="APIs / web servers" x={BD.web.x} y={BD.web.y} size={96} time={t} appear={progress(t, 56, 56.8)} />
          <Node kind="db" label="Data store" x={BD.db.x} y={BD.db.y} size={88} time={t} appear={progress(t, 58.5, 59.3)} />
          <Node kind="cache" label="Cache" x={BD.cache.x} y={BD.cache.y} size={88} time={t} appear={progress(t, 60.5, 61.3)} />
          <Node kind="cdn" label="CDN (media)" x={BD.cdn.x} y={BD.cdn.y} size={84} time={t} appear={progress(t, 63.5, 64.3)} />
          <Node kind="queue" label="Message queue" x={BD.queue.x} y={BD.queue.y} size={84} time={t} appear={progress(t, 65.5, 66.3)} />
          <Node kind="worker" label="Workers" x={BD.worker.x} y={BD.worker.y} size={84} time={t} appear={progress(t, 66.5, 67.3)} />
          {t >= 56.5 && <Link from={BD.client} to={BD.web} inset={56} color={C.sky} draw={progress(t, 56.5, 57.2)} animated time={t} />}
          {t >= 56.8 && <Link from={BD.mobile} to={BD.web} inset={56} color={C.sky} draw={progress(t, 56.8, 57.5)} animated time={t} />}
          {t >= 59.3 && <Link from={BD.web} to={BD.db} inset={58} color={C.emerald} draw={progress(t, 59.3, 60)} />}
          {t >= 61.3 && <Link from={BD.web} to={BD.cache} inset={58} color={C.amber} draw={progress(t, 61.3, 62)} />}
          {t >= 64.3 && <Link from={BD.client} to={BD.cdn} inset={56} color={C.orange} dashed draw={progress(t, 64.3, 65)} />}
          {t >= 64.5 && <Link from={BD.mobile} to={BD.cdn} inset={56} bend={-80} color={C.orange} dashed draw={progress(t, 64.5, 65.2)} />}
          {t >= 66.3 && <Link from={BD.web} to={BD.queue} inset={58} color={C.violet} draw={progress(t, 66.3, 67)} />}
          {t >= 67.3 && <Link from={BD.queue} to={BD.worker} inset={50} color={C.violet} draw={progress(t, 67.3, 68)} animated time={t} />}
          <Callout x={940} y={150} width={260} title="Boxes, not classes" color={C.violet} size={15}
            text="High level: key components and how requests flow. Details come later." appear={fadeWindow(t, 68.5, 79.5, 0.4)} />
          <Chip x={420} y={610} text="Every box needs a reason from the requirements" color={C.amber} size={16} appear={fadeWindow(t, 74, 79.5, 0.4)} />
        </g>
      )}

      {/* ============ Back of the envelope ============ */}
      {napkinWin > 0 && (
        <g opacity={napkinWin}>
          <Hotspot id="envelope" interactive={interactive} onClick={onHotspot} active={t >= 81} x={760} y={130} time={t} label="Back-of-the-envelope">
            <g transform="rotate(-2 420 330)">
              <rect x={80} y={130} width={680} height={330} rx={10} fill="#f5ecd6" />
              <path d="M80 130 L420 300 L760 130" fill="none" stroke="#d6c7a1" strokeWidth={3} />
              <text x={110} y={175} fontSize={22} fontWeight={800} fill="#6b4f1d">Back of the envelope</text>
              {NAPKIN.map((l, i) => (
                <text key={l.text} x={110} y={330 + i * 40} fontSize={22} fontWeight={700} fill="#1e293b" fontFamily="ui-monospace, monospace"
                  opacity={progress(t, l.at, l.at + 0.6)}>
                  {l.text}
                </text>
              ))}
            </g>
          </Hotspot>
          <Character who="player" mood="neutral" x={940} y={300} size={110} time={t} talking={between(t, 85, 89.5)}
            appear={fadeWindow(t, 84.5, 90, 0.4)} say="Thinking out loud: is a quick estimate useful here?" />
          <Character who="maya" mood="happy" x={1120} y={300} size={110} time={t} bubble="left" talking={between(t, 89.5, 91)}
            appear={fadeWindow(t, 89, 93, 0.3)} say="Go for it." />
          <g opacity={progress(t, 100, 101)}>
            <Node kind="web" label="2 web servers" x={960} y={480} size={92} time={t} state={t >= 101 ? 'busy' : 'idle'} />
            <Meter x={1030} y={480} w={200} value={webLoad} label="capacity used at peak" />
            <Label x={1080} y={590} text="→ we need more servers" size={18} color={C.amber} weight={800} opacity={progress(t, 102, 102.6)} />
          </g>
        </g>
      )}

      {/* ============ Use cases + API/schema ============ */}
      {useWin > 0 && (
        <g opacity={useWin}>
          <StickyNote x={90} y={120} w={330} rot={-2} color={C.sky} text="Use case: Priya (5,000 friends) posts a video" appear={progress(t, 105, 105.8)} />
          {['Upload', 'Save post', 'Fan out to 5,000 feeds'].map((s, i) => (
            <g key={s}>
              <Box x={160 + i * 230} y={300} w={200} text={s} color={i === 2 && t >= 114 ? C.rose : C.cyan} appear={progress(t, 108 + i * 1.5, 108.6 + i * 1.5)} state={i === 2 && t >= 114 ? 'hot' : undefined} />
              {i > 0 && t >= 108 + i * 1.5 && <Link from={{ x: 160 + (i - 1) * 230, y: 300 }} to={{ x: 160 + i * 230, y: 300 }} inset={100} color={C.cyan} draw={progress(t, 108 + i * 1.5, 108.5 + i * 1.5)} arrow />}
            </g>
          ))}
          <Packet along={[{ x: 60, y: 300 }, { x: 700, y: 300 }]} time={t} start={110} end={113.5} color={C.sky} label="video post" shape="envelope" />
          <Chip x={390} y={400} text="Edge case found: one post → 5,000 feed writes!" color={C.rose} size={17} appear={progress(t, 114.5, 115.2)} />
          <g opacity={progress(t, 119, 120)}>
            <Panel x={780} y={110} w={440} h={210} title="API endpoints + schema now?" color={C.amber} />
            <Label x={1000} y={170} text="It depends on the problem" size={18} color={C.text} weight={700} />
            <Box x={900} y={225} w={200} h={46} text="Google search" color={C.dim} appear={progress(t, 124, 124.5)} />
            <CrossMark x={1050} y={225} t={progress(t, 124.6, 125.2)} size={34} />
            <Label x={1135} y={231} text="too low level" size={15} color={C.rose} opacity={progress(t, 124.8, 125.3)} />
            <Box x={900} y={285} w={200} h={46} text="Poker backend" color={C.emerald} appear={progress(t, 125.4, 125.9)} />
            <CheckMark x={1050} y={285} t={progress(t, 126, 126.6)} size={34} />
            <Label x={1135} y={291} text="fair game" size={15} color={C.emerald} opacity={progress(t, 126.2, 126.7)} />
          </g>
        </g>
      )}

      {/* ============ Feed publishing (Fig. 3-1, simplified) ============ */}
      {pubWin > 0 && (
        <Hotspot id="publishing" interactive={interactive} onClick={onHotspot} active={t >= 130} x={1230} y={110} time={t} label="Feed publishing flow">
          <g opacity={pubWin}>
            <Panel x={40} y={90} w={1190} h={540} title="Flow 1 · Feed publishing" color={C.violet} tint={0.03} />
            <Link from={PUB.user} to={PUB.dns} inset={44} color={C.line} dashed />
            <Link from={PUB.user} to={PUB.lb} inset={44} color={C.sky} />
            <Link from={PUB.lb} to={PUB.web} inset={46} color={C.sky} />
            <Link from={PUB.web} to={PUB.post} inset={60} color={C.cyan} />
            <Link from={PUB.web} to={PUB.fanout} inset={60} color={C.violet} />
            <Link from={PUB.web} to={PUB.notify} inset={60} color={C.rose} />
            <Link from={PUB.post} to={PUB.postCache} inset={60} color={C.amber} />
            <Link from={PUB.post} to={PUB.postDb} inset={70} color={C.emerald} />
            <Link from={PUB.fanout} to={PUB.feedCache} inset={70} color={C.violet} />
            <Link from={PUB.notify} to={PUB.friends} inset={70} color={C.rose} />
            <Node kind="client" label="User" x={PUB.user.x} y={PUB.user.y} size={80} time={t} state={between(t, 133, 135) ? 'active' : 'idle'} />
            <Node kind="dns" label="DNS" x={PUB.dns.x} y={PUB.dns.y} size={70} time={t} />
            <Node kind="lb" label="Load balancer" x={PUB.lb.x} y={PUB.lb.y} size={80} time={t} />
            <Node kind="web" label="Web servers" x={PUB.web.x} y={PUB.web.y} size={84} time={t} state={between(t, 135, 138) ? 'active' : 'idle'} />
            <Box x={PUB.post.x} y={PUB.post.y} w={190} text="Post service" color={C.cyan} state={between(t, 138, 143) ? undefined : 'dim'} />
            <Box x={PUB.fanout.x} y={PUB.fanout.y} w={190} text="Fanout service" color={C.violet} state={between(t, 143, 148) ? undefined : 'dim'} />
            <Box x={PUB.notify.x} y={PUB.notify.y} w={190} text="Notification service" color={C.rose} state={between(t, 145, 150) ? undefined : 'dim'} />
            <Node kind="cache" label="Post cache" x={PUB.postCache.x} y={PUB.postCache.y} size={76} time={t} state={between(t, 139.5, 142) ? 'active' : 'idle'} />
            <Node kind="db" label="Post DB" x={PUB.postDb.x} y={PUB.postDb.y} size={76} time={t} state={between(t, 140.5, 143) ? 'active' : 'idle'} />
            <Node kind="cache" label="News feed cache" x={PUB.feedCache.x} y={PUB.feedCache.y} size={80} time={t} state={between(t, 145, 148) ? 'active' : 'idle'} />
            <Node kind="mobile" label="Friends" x={PUB.friends.x} y={PUB.friends.y} size={70} time={t} state={between(t, 147, 150) ? 'active' : 'idle'} />
            <Packet along={[PUB.user, PUB.lb, PUB.web]} time={t} start={133.5} end={136.5} color={C.sky} label="POST /feed" shape="envelope" />
            <Packet along={linkPath(PUB.web, PUB.post, 0, 40)} time={t} start={137} end={138.5} color={C.cyan} />
            <Packet along={linkPath(PUB.post, PUB.postCache, 0, 60)} time={t} start={139} end={140.3} color={C.amber} />
            <Packet along={linkPath(PUB.post, PUB.postDb, 0, 70)} time={t} start={139.5} end={141.2} color={C.emerald} />
            <Packet along={linkPath(PUB.web, PUB.fanout, 0, 40)} time={t} start={143} end={144.2} color={C.violet} />
            <Packet along={linkPath(PUB.fanout, PUB.feedCache, 0, 70)} time={t} start={144.3} end={145.6} color={C.violet} label="post id → friends' feeds" />
            <Packet along={linkPath(PUB.web, PUB.notify, 0, 40)} time={t} start={145} end={146.2} color={C.rose} />
            <Packet along={linkPath(PUB.notify, PUB.friends, 0, 60)} time={t} start={146.3} end={147.5} color={C.rose} label="new post!" />
            <Chip x={640} y={605} text="Write once → spread to friends' feeds" color={C.violet} size={17} appear={fadeWindow(t, 148, 151.7, 0.3)} />
          </g>
        </Hotspot>
      )}

      {/* ============ News feed building (Fig. 3-2, simplified) ============ */}
      {bldWin > 0 && (
        <Hotspot id="building" interactive={interactive} onClick={onHotspot} active={t >= 154} x={1230} y={110} time={t} label="News feed building flow">
          <g opacity={bldWin}>
            <Panel x={40} y={90} w={1190} h={540} title="Flow 2 · News feed building" color={C.emerald} tint={0.03} />
            <Link from={BLD.user} to={BLD.lb} inset={48} color={C.sky} animated time={t} />
            <Link from={BLD.lb} to={BLD.web} inset={48} color={C.sky} animated time={t} />
            <Link from={BLD.web} to={BLD.feed} inset={60} color={C.emerald} />
            <Link from={BLD.feed} to={BLD.feedCache} inset={70} color={C.amber} />
            <Node kind="mobile" label="User" x={BLD.user.x} y={BLD.user.y} size={84} time={t} state={between(t, 153, 155) ? 'active' : 'idle'} />
            <Node kind="lb" label="Load balancer" x={BLD.lb.x} y={BLD.lb.y} size={84} time={t} />
            <Node kind="web" label="Web servers" x={BLD.web.x} y={BLD.web.y} size={88} time={t} state={between(t, 157, 159) ? 'active' : 'idle'} />
            <Box x={BLD.feed.x} y={BLD.feed.y} w={200} h={64} text="News feed service" color={C.emerald} state={between(t, 159, 167) ? undefined : 'dim'} />
            <Node kind="cache" label="News feed cache" x={BLD.feedCache.x} y={BLD.feedCache.y} size={88} time={t} state={between(t, 162, 165) ? 'active' : 'idle'} />
            <Packet along={[BLD.user, BLD.lb, BLD.web]} time={t} start={154} end={157} color={C.sky} label="GET /feed" shape="envelope" />
            <Packet along={linkPath(BLD.web, BLD.feed, 0, 50)} time={t} start={158} end={159.5} color={C.emerald} />
            <Packet along={linkPath(BLD.feed, BLD.feedCache, 0, 70)} time={t} start={160} end={161.5} color={C.amber} />
            <Packet along={linkPath(BLD.feedCache, BLD.feed, 0, 70)} time={t} start={162} end={163.5} color={C.amber} label="friends' posts" />
            <Packet along={[BLD.feed, BLD.web, BLD.lb, BLD.user]} time={t} start={164} end={167} color={C.emerald} label="feed (newest first)" shape="envelope" />
            {['Newest post', 'A bit older', 'Older still'].map((s, i) => (
              <g key={s} opacity={progress(t, 165 + i * 0.4, 165.6 + i * 0.4)}>
                <rect x={70} y={470 + i * 40} width={150} height={32} rx={8} fill={C.panel2} stroke={C.emerald} strokeWidth={1.5} />
                <text x={145} y={491 + i * 40} textAnchor="middle" fontSize={14} fontWeight={700} fill={C.text}>{s}</text>
              </g>
            ))}
            {t >= 168 && (
              <g>
                <Sparkles x={800} y={240} t={progress(t, 168, 170)} radius={220} />
                <Appear p={progress(t, 168, 168.8, ease.outBack)} from="pop" x={800} y={200}>
                  <g transform="rotate(-6 800 200)">
                    <rect x={610} y={160} width={380} height={76} rx={16} fill="none" stroke={C.emerald} strokeWidth={6} />
                    <text x={800} y={211} textAnchor="middle" fontSize={32} fontWeight={900} fill={C.emerald}>BLUEPRINT APPROVED</text>
                  </g>
                </Appear>
              </g>
            )}
          </g>
        </Hotspot>
      )}
    </Stage>
  );
}
