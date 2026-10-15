import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, CodeBlock, Counter, CrossMark, Hotspot, Label, Link, Meter, Node, Packet,
  Panel, Sparkles, Stage, Title, between, ease, fadeWindow, hash, linkPath, progress, tween, type Pt,
} from '@/scenekit';
import { AKAMAI_URL, CDN_STEP_SHORT, CDN_URL } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  what: 22,
  near: 50,
  flow: 80,
  consider: 126,
  design: 154,
  end: 176,
} as const;

/* ------------------------------ World map ------------------------------ */
const CONTINENTS = [
  'M90 200 L330 160 L420 210 L360 300 L300 330 L250 420 L180 380 L120 300 Z',
  'M300 440 L380 450 L360 560 L320 620 L300 540 Z',
  'M600 170 L720 150 L760 200 L700 260 L620 250 Z',
  'M620 290 L740 290 L760 400 L700 520 L650 450 L610 360 Z',
  'M760 150 L1120 140 L1180 240 L1080 330 L980 380 L880 360 L800 260 Z',
  'M1040 470 L1150 460 L1170 540 L1060 550 Z',
];
const SF: Pt = { x: 150, y: 285 };
const LA: Pt = { x: 300, y: 345 };
const LONDON: Pt = { x: 640, y: 200 };
const MUMBAI: Pt = { x: 905, y: 350 };
const TOKYO: Pt = { x: 1120, y: 250 };
const EDGES: Pt[] = [LONDON, MUMBAI, TOKYO, { x: 330, y: 250 }];

function WorldMap({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      {CONTINENTS.map((d, i) => (
        <path key={i} d={d} fill={C.panel2} stroke={C.line} strokeWidth={2} strokeLinejoin="round" opacity={0.75} />
      ))}
    </g>
  );
}

/** A user pin with a load-time chip. */
function CityUser({ p, name, secs, time, appear }: { p: Pt; name: string; secs: number; time: number; appear: number }) {
  if (appear <= 0) return null;
  const col = secs > 2 ? C.rose : secs > 1 ? C.amber : C.emerald;
  return (
    <Appear p={appear} from="pop" x={p.x} y={p.y}>
      <circle cx={p.x} cy={p.y} r={10 + 4 * Math.sin(time * 3 + p.x)} fill={col} opacity={0.25} />
      <circle cx={p.x} cy={p.y} r={7} fill={col} />
      <Label x={p.x} y={p.y + 30} text={name} size={14} color={C.text} />
      <Chip x={p.x} y={p.y - 30} text={`${secs.toFixed(1)} s`} color={col} size={13} filled={secs > 2} />
    </Appear>
  );
}

/* --------------------------- Flow diagram layout --------------------------- */
const USER_A: Pt = { x: 170, y: 250 };
const USER_B: Pt = { x: 170, y: 540 };
const EDGE: Pt = { x: 620, y: 395 };
const ORIGIN: Pt = { x: 1060, y: 330 };
const S3: Pt = { x: 1060, y: 520 };

function StepRail({ time }: { time: number }) {
  const o = fadeWindow(time, T.flow + 1, T.consider - 0.5, 0.5);
  if (o <= 0) return null;
  const at = [83, 89, 96, 102, 108, 113];
  return (
    <g opacity={o}>
      {CDN_STEP_SHORT.map((s, i) => {
        const on = time >= at[i];
        const x = 110 + i * 172;
        return (
          <g key={s}>
            {i > 0 && <line x1={x - 100} y1={52} x2={x - 72} y2={52} stroke={on ? C.sky : C.line} strokeWidth={2} />}
            <Chip x={x} y={52} text={s} color={on ? C.sky : C.dim} filled={on && time < at[i] + 1.2} size={13} />
          </g>
        );
      })}
    </g>
  );
}

/* ---------------------------- Consideration cards ---------------------------- */
const CARDS = [
  { title: 'Cost', color: C.amber, at: 127, lines: ['Third-party service:', 'you pay per GB in and out.', 'Drop rarely used assets.'] },
  { title: 'Cache expiry', color: C.violet, at: 133, lines: ['Not too long: stale files.', 'Not too short: origin', 'reloads again and again.'] },
  { title: 'CDN fallback', color: C.rose, at: 139, lines: ['CDN outage? Clients detect', 'it and fetch from the', 'origin instead.'] },
  { title: 'Invalidation', color: C.emerald, at: 146, lines: ['Vendor API to purge, or', 'a new version in the URL:', 'image.png?v=2'] },
];

function ConsiderCard({ i, time }: { i: number; time: number }) {
  const c = CARDS[i];
  const x = 40 + i * 305;
  const y = 120;
  const app = progress(time, c.at - 0.6, c.at + 0.2, ease.outBack);
  const lit = time >= c.at && time < (CARDS[i + 1]?.at ?? T.design);
  if (app <= 0) return null;
  return (
    <Appear p={app} from="up">
      <Panel x={x} y={y} w={285} h={430} title={c.title} color={c.color} tint={lit ? 0.16 : 0.05} opacity={lit ? 1 : 0.6} />
      {c.lines.map((l, k) => (
        <Label key={k} x={x + 142} y={y + 60 + k * 26} text={l} size={16} color={lit ? C.text : C.dim} weight={500} />
      ))}
    </Appear>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const users = Math.round(tween(t, 158, 168, 300_000, 500_000, ease.inOutQuad));

  /* --------------- map phase (intro, what, near) --------------- */
  const mapO = fadeWindow(t, 4, T.flow, 0.8);
  // load times: slow from SF only, then fast once edges exist
  const edgesOn = t >= 25 && t < 50 ? progress(t, 25, 28) : t >= 66 ? progress(t, 66, 70) : 0;
  const sfCdnOnly = between(t, 52, 66);
  const londonSecs = sfCdnOnly ? 2.6 : edgesOn >= 1 ? 0.3 : t < 22 ? tween(t, 8, 12, 0.5, 6.1) : lerpSecs(6.1, 0.3, edgesOn);
  const mumbaiSecs = sfCdnOnly ? 3.1 : edgesOn >= 1 ? 0.4 : t < 22 ? tween(t, 8, 12, 0.5, 6.4) : lerpSecs(6.4, 0.4, edgesOn);
  const laSecs = sfCdnOnly || edgesOn > 0 ? 0.2 : 0.4;
  const tokyoSecs = sfCdnOnly ? 2.9 : edgesOn >= 1 ? 0.3 : t < 22 ? tween(t, 8, 12, 0.5, 5.8) : lerpSecs(5.8, 0.3, edgesOn);

  /* --------------- flow phase --------------- */
  const flowO = fadeWindow(t, T.flow + 0.5, T.consider, 0.6);
  const cached = t >= 102.5;
  const ttlLeft = t < 102.5 ? 1 : 1 - progress(t, 102.5, 123);
  const expired = t >= 123;

  /* --------------- final design phase --------------- */
  const designO = fadeWindow(t, T.design + 0.5, T.end + 1, 0.6);

  return (
    <Stage time={t} drift title="Level 7 lesson: content delivery networks">
      <Title text="Closer to Home" kicker="LEVEL 7 · 500K USERS" subtitle="Content delivery networks" y={130}
        appear={t < 6 ? progress(t, 0.3, 1.3) : 1 - progress(t, 5, 6)} />
      <Counter x={1140} y={52} value={users} time={t} bump={between(t, 158, 168)} />

      {/* ====================== Map: intro / what / near ====================== */}
      <WorldMap opacity={mapO} />
      {mapO > 0 && (
        <g opacity={mapO}>
          <Hotspot id="origin" interactive={interactive} onClick={onHotspot} active={between(t, 6, T.flow - 1)} x={SF.x + 40} y={SF.y - 40} time={t} label="Origin server">
            <Node kind="web" label="Origin · San Francisco" x={SF.x} y={SF.y} size={64} time={t} state={between(t, 8, 22) ? 'busy' : 'idle'} />
          </Hotspot>
          <CityUser p={LA} name="Los Angeles" secs={laSecs} time={t} appear={progress(t, 52, 53)} />
          <CityUser p={LONDON} name="London" secs={londonSecs} time={t} appear={progress(t, 7, 8)} />
          <CityUser p={MUMBAI} name="Mumbai" secs={mumbaiSecs} time={t} appear={progress(t, 7.4, 8.4)} />
          <CityUser p={TOKYO} name="Tokyo" secs={tokyoSecs} time={t} appear={progress(t, 7.8, 8.8)} />
          {/* long-haul packets from SF in the intro, from the SF CDN in the example */}
          {[LONDON, MUMBAI, TOKYO].map((p, i) => (
            <g key={i}>
              <Packet along={linkPath(SF, p, -80, 20)} time={t} start={8 + i * 0.7} end={14 + i * 0.7} color={C.rose} size={6} label={i === 0 ? 'photo.jpg' : undefined} />
              <Packet along={linkPath(SF, p, -80, 20)} time={t} start={14 + i * 0.7} end={20 + i * 0.7} color={C.rose} size={6} />
            </g>
          ))}
          <Packet along={linkPath(SF, LA, 0, 10)} time={t} start={55} end={56.2} color={C.emerald} size={6} label="fast" />
          <Packet along={linkPath(SF, LONDON, -80, 20)} time={t} start={57} end={63} color={C.amber} size={6} label="slow" />
          {/* CDN edge servers */}
          {sfCdnOnly && <Node kind="cdn" label="CDN · SF" x={SF.x} y={SF.y + 130} size={56} time={t} state="active" appear={progress(t, 52, 53)} />}
          {sfCdnOnly && <Link from={{ x: SF.x, y: SF.y + 130 }} to={LA} inset={30} color={C.emerald} width={2} animated time={t} />}
          {edgesOn > 0 &&
            EDGES.map((p, i) => (
              <Hotspot key={i} id="cdn-edge" interactive={interactive && i === 0} onClick={onHotspot} active={t >= 66 || between(t, 26, 50)} x={p.x + 60} y={p.y - 30} time={t} label="CDN edge server">
                <Node kind="cdn" label="" x={p.x + 40} y={p.y + 4} size={46} time={t} state="active" glow={0.6} appear={progress(t, (t < 50 ? 25 : 66) + i * 0.5, (t < 50 ? 26 : 67) + i * 0.5, ease.outBack)} />
              </Hotspot>
            ))}
        </g>
      )}
      <Character who="maya" mood="panic" x={1110} y={560} size={110} time={t} talking={between(t, 13, 19)} bubble="left"
        appear={fadeWindow(t, 12, 21.5, 0.5)} say="Six seconds to see a cat photo in London?!" />

      {/* what is a CDN */}
      <Callout x={380} y={430} width={420} title="Content delivery network" color={C.sky}
        text="A network of servers spread around the globe that caches and delivers static content close to your users."
        appear={fadeWindow(t, 23, 36, 0.5)} pointTo={{ x: LONDON.x + 40, y: LONDON.y + 30 }} />
      {['Images', 'Videos', 'CSS', 'JavaScript'].map((s, i) => (
        <Chip key={s} x={460 + i * 130} y={600} text={s} color={C.sky} filled size={16} appear={fadeWindow(t, 30 + i * 0.8, 49, 0.4)} />
      ))}
      <Label x={640} y={650} text="static content" size={14} color={C.dim} opacity={fadeWindow(t, 31, 49)} />
      <Appear p={fadeWindow(t, 39, 49.5, 0.5)} from="right">
        <Chip x={1040} y={470} text="Dynamic content caching" color={C.dim} size={15} />
        <CrossMark x={1040} y={470} t={progress(t, 40, 41)} size={40} />
        <Label x={1040} y={510} text="(HTML by path, query, cookies…)" size={13} color={C.dim} />
        <Label x={1040} y={532} text="beyond this chapter's scope" size={13} color={C.amber} />
      </Appear>

      {/* the closest server wins */}
      <Callout x={420} y={470} width={380} title="Distance = latency" color={C.amber} size={15}
        text="With CDN servers only in San Francisco, Los Angeles is fast but Europe is still slow. The closest edge delivers."
        appear={fadeWindow(t, 56, 66, 0.5)} />
      <Character who="ravi" mood="happy" x={1110} y={560} size={110} time={t} talking={between(t, 70, 76)} bubble="left"
        appear={fadeWindow(t, 69, 79.5, 0.5)} say="Same photo, now served from an edge a few hundred km away." />
      <Sparkles x={LONDON.x} y={LONDON.y} t={progress(t, 69, 70.5)} radius={60} seed={3} />

      {/* ====================== The 6-step CDN workflow ====================== */}
      <StepRail time={t} />
      {flowO > 0 && (
        <g opacity={flowO}>
          <Node kind="client" label="User A" x={USER_A.x} y={USER_A.y} time={t} state={between(t, 83, 88) || between(t, 104, 107) ? 'active' : 'idle'} />
          <Node kind="mobile" label="User B" x={USER_B.x} y={USER_B.y} time={t} appear={progress(t, 107.5, 108.3)} state={between(t, 108, 118) ? 'active' : 'idle'} />
          <Node kind="cdn" label="CDN edge" x={EDGE.x} y={EDGE.y} size={110} time={t} glow={cached ? 0.7 : 0.2}
            state={between(t, 89, 95) ? 'busy' : between(t, 113, 118) ? 'active' : 'idle'} />
          <Hotspot id="origin" interactive={interactive} onClick={onHotspot} active={between(t, 89, T.consider - 1)} x={ORIGIN.x + 60} y={ORIGIN.y - 62} time={t} label="Origin">
            <Panel x={ORIGIN.x - 120} y={ORIGIN.y - 90} w={240} h={360} title="Origin" color={C.cyan} tint={0.06} />
          </Hotspot>
          <Node kind="web" label="Web server" x={ORIGIN.x} y={ORIGIN.y + 10} size={80} time={t} state={between(t, 95, 98) ? 'active' : 'idle'} />
          <Node kind="storage" label="or Amazon S3" x={S3.x} y={S3.y - 20} size={80} time={t} />
          <Link from={USER_A} to={EDGE} color={C.sky} width={2} dashed />
          <Link from={USER_B} to={EDGE} color={C.sky} width={2} dashed draw={progress(t, 108, 109)} />
          <Link from={EDGE} to={{ x: ORIGIN.x - 120, y: EDGE.y - 40 }} inset={60} color={C.cyan} width={2} dashed />
          {/* step 1 */}
          <Packet along={linkPath(USER_A, EDGE, 0, 60)} time={t} start={84} end={88} color={C.sky} label="GET image.png" shape="envelope" />
          <Callout x={300} y={110} width={480} title="1 · The URL points at the CDN" color={C.sky} size={14}
            text={`${CDN_URL}   or   ${AKAMAI_URL}`} appear={fadeWindow(t, 84, 89, 0.4)} />
          {/* step 2: miss */}
          <Appear p={fadeWindow(t, 88.5, 95, 0.3)} from="pop" x={EDGE.x} y={EDGE.y - 90}>
            <Chip x={EDGE.x} y={EDGE.y - 90} text="MISS" color={C.rose} filled size={16} />
          </Appear>
          <Packet along={linkPath(EDGE, { x: ORIGIN.x - 120, y: EDGE.y - 40 }, -20, 60)} time={t} start={90} end={94.5} color={C.rose} label="image.png?" shape="envelope" />
          {/* step 3: origin returns with TTL */}
          <Packet along={linkPath({ x: ORIGIN.x - 120, y: EDGE.y - 40 }, EDGE, -20, 60)} time={t} start={96.5} end={101} color={C.emerald} label="image.png + TTL" shape="envelope" />
          <Hotspot id="ttl" interactive={interactive} onClick={onHotspot} active={between(t, 97, T.consider - 1)} x={760} y={150} time={t} label="Time-to-live">
            <CodeBlock x={300} y={150} width={460} title="HTTP/1.1 200 OK  ·  from origin" color={C.emerald} size={15}
              code={'Content-Type: image/png\nCache-Control: max-age=3600   ← TTL'} chars={(t - 97) * 30} appear={fadeWindow(t, 96.5, 107, 0.4)} />
          </Hotspot>
          {/* step 4: cached + returned */}
          {cached && (
            <g>
              <rect x={EDGE.x - 40} y={EDGE.y + 96} width={80} height={10} rx={5} fill={C.panel2} />
              <rect x={EDGE.x - 40} y={EDGE.y + 96} width={80 * ttlLeft} height={10} rx={5} fill={expired ? C.rose : C.violet} />
              <Label x={EDGE.x} y={EDGE.y + 128} text={expired ? 'TTL expired: next request goes to origin' : 'cached · TTL counting down'} size={13} color={expired ? C.rose : C.violet} />
            </g>
          )}
          <Packet along={linkPath(EDGE, USER_A, 0, 60)} time={t} start={103} end={106.5} color={C.emerald} label="image.png" shape="envelope" />
          {/* step 5/6: user B hits the cache */}
          <Packet along={linkPath(USER_B, EDGE, 0, 60)} time={t} start={108.5} end={112} color={C.sky} label="GET image.png" shape="envelope" />
          <Appear p={fadeWindow(t, 112.5, 119, 0.3)} from="pop" x={EDGE.x} y={EDGE.y - 90}>
            <Chip x={EDGE.x} y={EDGE.y - 90} text="HIT" color={C.emerald} filled size={16} />
          </Appear>
          <Packet along={linkPath(EDGE, USER_B, 0, 60)} time={t} start={113.5} end={116} color={C.emerald} label="image.png (cache)" shape="envelope" />
          <CheckMark x={USER_B.x + 80} y={USER_B.y - 50} t={progress(t, 116, 117)} size={36} />
          <Callout x={300} y={600} width={520} title="Origin never sees User B" color={C.emerald} size={14}
            text="Every user near this edge gets the cached copy until the TTL expires." appear={fadeWindow(t, 116.5, 123, 0.4)} />
        </g>
      )}

      {/* ====================== Considerations ====================== */}
      {between(t, T.consider - 1, T.design + 1) && (
        <g opacity={fadeWindow(t, T.consider - 0.5, T.design + 0.5, 0.6)}>
          <Label x={640} y={80} text="Four things to think about before you sign the CDN contract" size={22} color={C.white} weight={800} />
          {CARDS.map((_, i) => <ConsiderCard key={i} i={i} time={t} />)}
          {/* cost: coins drain */}
          {t >= 127 && <Meter x={70} y={330} w={225} value={tween(t, 128, 132, 0.2, 0.9)} label="CDN bill" />}
          {t >= 127 && <Node kind="cdn" label="" x={182} y={440} size={70} time={t} />}
          {/* expiry: TTL dial */}
          {t >= 133 && (
            <g>
              <rect x={370} y={330} width={225} height={12} rx={6} fill={C.panel2} />
              <circle cx={370 + 225 * (0.5 + 0.45 * Math.sin((t - 133) * 1.1))} cy={336} r={11} fill={C.violet} />
              <Label x={385} y={372} text="short" size={13} color={C.rose} anchor="start" />
              <Label x={580} y={372} text="long" size={13} color={C.amber} anchor="end" />
              <Label x={482} y={420} text="origin reloads ⟷ stale photos" size={13} color={C.dim} />
            </g>
          )}
          {/* fallback */}
          <Hotspot id="fallback" interactive={interactive} onClick={onHotspot} active={t >= 139} x={895} y={140} time={t} label="CDN fallback">
            {t >= 139 && (
              <g>
                <Node kind="client" label="" x={710} y={340} size={54} time={t} />
                <Node kind="cdn" label="" x={830} y={340} size={54} time={t} state={t >= 140.5 ? 'down' : 'idle'} />
                <Node kind="web" label="origin" x={770} y={470} size={54} time={t} />
                <Link from={{ x: 710, y: 340 }} to={{ x: 770, y: 470 }} inset={34} color={C.emerald} width={2} draw={progress(t, 142, 143)} animated time={t} />
                <Packet along={linkPath({ x: 710, y: 340 }, { x: 770, y: 470 }, 0, 34)} time={t} start={143} end={145} color={C.emerald} size={6} />
              </g>
            )}
          </Hotspot>
          {/* versioning */}
          <Hotspot id="versioning" interactive={interactive} onClick={onHotspot} active={t >= 146} x={1200} y={140} time={t} label="Object versioning">
            {t >= 146 && (
              <g>
                <Chip x={1097} y={350} text="image.png?v=1" color={C.dim} size={13} />
                <CrossMark x={1097} y={350} t={progress(t, 148, 149)} size={30} />
                <Chip x={1097} y={420} text="image.png?v=2" color={C.emerald} filled size={13} appear={progress(t, 149, 150, ease.outBack)} />
                <Sparkles x={1097} y={420} t={progress(t, 149.5, 151)} radius={70} seed={7} />
              </g>
            )}
          </Hotspot>
        </g>
      )}

      {/* ====================== Figure 1-11: CDN + cache design ====================== */}
      {designO > 0 && (
        <g opacity={designO}>
          <Node kind="client" label="Web browser" x={130} y={250} size={84} time={t} />
          <Node kind="mobile" label="Mobile app" x={130} y={480} size={84} time={t} />
          <Node kind="cdn" label="CDN" x={500} y={130} size={90} time={t} state="active" glow={0.6} />
          <Node kind="lb" label="Load balancer" x={500} y={400} size={84} time={t} />
          <Node kind="web" label="Web 1" x={770} y={320} size={74} time={t} />
          <Node kind="web" label="Web 2" x={770} y={490} size={74} time={t} />
          <Node kind="cache" label="Cache" x={1010} y={250} size={74} time={t} state={between(t, 163, 170) ? 'active' : 'idle'} />
          <Node kind="db" label="DB master" x={1010} y={430} size={74} time={t} load={tween(t, 160, 166, 0.8, 0.3)} />
          <Node kind="db-replica" label="Replica" x={1180} y={560} size={64} time={t} />
          <Link from={{ x: 130, y: 250 }} to={{ x: 500, y: 130 }} color={C.sky} width={2} animated time={t} label="static" />
          <Link from={{ x: 130, y: 480 }} to={{ x: 500, y: 130 }} color={C.sky} width={2} animated time={t} bend={-40} />
          <Link from={{ x: 130, y: 250 }} to={{ x: 500, y: 400 }} color={C.cyan} width={2} />
          <Link from={{ x: 130, y: 480 }} to={{ x: 500, y: 400 }} color={C.cyan} width={2} />
          <Link from={{ x: 500, y: 400 }} to={{ x: 770, y: 320 }} color={C.cyan} width={2} inset={50} />
          <Link from={{ x: 500, y: 400 }} to={{ x: 770, y: 490 }} color={C.cyan} width={2} inset={50} />
          <Link from={{ x: 770, y: 320 }} to={{ x: 1010, y: 250 }} color={C.amber} width={2} inset={46} />
          <Link from={{ x: 770, y: 320 }} to={{ x: 1010, y: 430 }} color={C.emerald} width={2} inset={46} />
          <Link from={{ x: 1010, y: 430 }} to={{ x: 1180, y: 560 }} color={C.emerald} width={2} inset={42} dashed />
          {Array.from({ length: 10 }, (_, i) => (
            <Packet key={i} along={linkPath({ x: 130, y: i % 2 ? 480 : 250 }, { x: 500, y: 130 }, i % 2 ? -40 : 0, 50)} time={t}
              start={156 + i * 1.6 + hash(i) * 0.5} end={157.4 + i * 1.6 + hash(i) * 0.5} color={C.sky} size={5} />
          ))}
          <Callout x={620} y={40} width={330} title="1 · Static from the CDN" color={C.sky} size={14}
            text="JS, CSS and images no longer touch the web servers." appear={fadeWindow(t, 157, T.end, 0.4)} />
          <Callout x={880} y={600} width={360} title="2 · DB load lightened by the cache" color={C.amber} size={14}
            text="Data reads hit the cache first." appear={fadeWindow(t, 162, T.end, 0.4)} />
        </g>
      )}
      <Character who="pager" mood="neutral" x={330} y={630} size={90} time={t} talking={between(t, 169, 174)}
        appear={fadeWindow(t, 168.5, T.end + 1, 0.4)} say="bzzt… cute. Wait until you add a third web server." />
    </Stage>
  );
}

function lerpSecs(from: number, to: number, p: number) {
  return from + (to - from) * p;
}
