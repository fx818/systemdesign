import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, Counter, CrossMark, Hotspot, Label, Link, Node, Packet, Panel,
  Sparkles, Stage, Title, between, ease, fadeWindow, hash, linkPath, progress, tween, type Pt,
} from '@/scenekit';
import { CONTINENTS } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  geo: 20,
  failover: 58,
  challenges: 86,
  sync: 98,
  deploy: 122,
  teaser: 142,
  end: 166,
} as const;

/* ------------------------------ Figure 1-15 layout ------------------------------ */
const WEST_USERS: Pt = { x: 330, y: 100 };
const EAST_USERS: Pt = { x: 950, y: 100 };
const GEODNS: Pt = { x: 640, y: 130 };
const DC = {
  west: { x: 80, y: 260, cx: 320 },
  east: { x: 720, y: 260, cx: 960 },
};
const DC_W = 480;
const DC_H = 330;

function DataCenter({ which, time, down, appear, dbNote }: { which: 'west' | 'east'; time: number; down: boolean; appear: number; dbNote?: string }) {
  if (appear <= 0) return null;
  const d = DC[which];
  const st = down ? 'down' : 'idle';
  return (
    <Appear p={appear} from="up">
      <Panel x={d.x} y={d.y} w={DC_W} h={DC_H} title={which === 'west' ? 'DC 2 · US-West' : 'DC 1 · US-East'} color={down ? C.dim : C.violet} tint={down ? 0.02 : 0.06} />
      <Node kind="lb" label="Load balancer" x={d.cx} y={d.y + 60} size={70} time={time} state={st} />
      <Node kind="web" label="Web" x={d.cx - 110} y={d.y + 160} size={66} time={time} state={st} />
      <Node kind="web" label="Web" x={d.cx + 110} y={d.y + 160} size={66} time={time} state={st} />
      <Node kind="cache" label="Cache" x={d.cx - 110} y={d.y + 265} size={62} time={time} state={st} />
      <Node kind="db" label="Database" x={d.cx + 110} y={d.y + 265} size={62} time={time} state={st} />
      {dbNote && <Chip x={d.cx + 110} y={d.y + 225} text={dbNote} color={C.emerald} size={12} />}
      <Link from={{ x: d.cx, y: d.y + 60 }} to={{ x: d.cx - 110, y: d.y + 160 }} inset={40} width={1.5} color={down ? C.line : C.cyan} />
      <Link from={{ x: d.cx, y: d.y + 60 }} to={{ x: d.cx + 110, y: d.y + 160 }} inset={40} width={1.5} color={down ? C.line : C.cyan} />
    </Appear>
  );
}

/** Rain + lightning over a point, intensity 0..1. */
function Storm({ x, y, time, intensity }: { x: number; y: number; time: number; intensity: number }) {
  if (intensity <= 0) return null;
  const flash = (time * 1.3) % 2.2 < 0.12 ? 1 : 0;
  return (
    <g opacity={intensity}>
      <ellipse cx={x} cy={y} rx={110} ry={34} fill={C.panel2} stroke={C.dim} />
      <ellipse cx={x - 50} cy={y - 18} rx={56} ry={28} fill={C.panel2} />
      <ellipse cx={x + 40} cy={y - 22} rx={60} ry={30} fill={C.panel2} />
      {Array.from({ length: 16 }, (_, i) => {
        const fx = x - 95 + hash(i) * 190;
        const fy = y + 30 + ((time * 160 + hash(i * 7) * 120) % 120);
        return <line key={i} x1={fx} y1={fy} x2={fx - 6} y2={fy + 14} stroke={C.sky} strokeWidth={2} opacity={0.6} />;
      })}
      {flash > 0 && <path d={`M${x + 10} ${y + 20} L${x - 14} ${y + 70} L${x + 6} ${y + 70} L${x - 16} ${y + 120}`} stroke={C.amber} strokeWidth={5} fill="none" filter="url(#sk-glow)" />}
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const users = Math.round(tween(t, 144, 156, 1_000_000, 2_000_000, ease.inOutQuad));

  /* intro: world map */
  const mapO = fadeWindow(t, 5, T.geo, 0.8);
  const westDarkIntro = t >= 13;

  /* figure 1-15 / 1-16 */
  const figO = fadeWindow(t, T.geo + 0.5, T.challenges, 0.6);
  const westDown = between(t, 62, T.challenges);
  const x = t < 40 ? 50 : t < 48 ? Math.round(tween(t, 40, 44, 50, 60)) : t < 62 ? 60 : Math.round(tween(t, 62, 66, 60, 100));
  const westShare = 100 - x;

  /* challenges */
  const chO = fadeWindow(t, T.challenges + 0.5, T.teaser, 0.6);
  const replicating = t >= 110;

  /* teaser */
  const teaserO = fadeWindow(t, T.teaser + 0.5, T.end + 1, 0.6);

  return (
    <Stage time={t} drift title="Level 9 lesson: multiple data centers">
      <Title text="Going Global" kicker="LEVEL 9 · 2M USERS" subtitle="Multiple data centers" y={130}
        appear={t < 6 ? progress(t, 0.3, 1.3) : 1 - progress(t, 5, 6)} />
      <Counter x={1140} y={52} value={users} time={t} bump={between(t, 144, 156)} />

      {/* ====================== intro map ====================== */}
      {mapO > 0 && (
        <g opacity={mapO}>
          {CONTINENTS.map((d, i) => (
            <path key={i} d={d} fill={C.panel2} stroke={C.line} strokeWidth={2} strokeLinejoin="round" opacity={0.75} />
          ))}
          <Node kind="datacenter" label={westDarkIntro ? 'US-West · DARK' : 'US-West (our only DC)'} x={160} y={290} size={70} time={t} state={westDarkIntro ? 'down' : 'active'} />
          {Array.from({ length: 14 }, (_, i) => {
            const p = { x: 120 + hash(i * 3) * 1040, y: 170 + hash(i * 5) * 330 };
            const st = 6 + i * 0.4;
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={6} fill={westDarkIntro ? C.rose : C.sky} opacity={progress(t, st, st + 0.4)} />
                {!westDarkIntro && <Packet along={linkPath(p, { x: 160, y: 290 }, 30, 10)} time={t} start={st} end={st + 3} color={C.sky} size={4} trail={false} />}
              </g>
            );
          })}
          <Storm x={170} y={170} time={t} intensity={progress(t, 10, 12)} />
          <Character who="pager" mood="panic" x={1110} y={590} size={100} time={t} talking={between(t, 13.5, 18.5)} bubble="left"
            appear={fadeWindow(t, 13, 19.8, 0.4)} say="BZZT! US-West lost power. All of PixelPost is dark!" />
        </g>
      )}

      {/* ====================== figure 1-15 / 1-16 ====================== */}
      {figO > 0 && (
        <g opacity={figO}>
          <Node kind="client" label="Users · West" x={WEST_USERS.x} y={WEST_USERS.y} size={72} time={t} />
          <Node kind="mobile" label="Users · East" x={EAST_USERS.x} y={EAST_USERS.y} size={72} time={t} />
          <Hotspot id="geodns" interactive={interactive} onClick={onHotspot} active={t >= 24} x={GEODNS.x + 46} y={GEODNS.y - 46} time={t} label="GeoDNS">
            <Node kind="dns" label="geoDNS" x={GEODNS.x} y={GEODNS.y} size={80} time={t} glow={0.5} state={between(t, 26, 34) ? 'active' : 'idle'} />
          </Hotspot>
          <Link from={WEST_USERS} to={GEODNS} width={1.5} color={C.violet} dashed inset={44} />
          <Link from={EAST_USERS} to={GEODNS} width={1.5} color={C.violet} dashed inset={44} />
          <Hotspot id="failover" interactive={interactive} onClick={onHotspot} active={t >= 62} x={DC.west.x + DC_W - 10} y={DC.west.y} time={t} label="Failover">
            <DataCenter which="west" time={t} down={westDown} appear={progress(t, 21, 22.5)} />
          </Hotspot>
          <DataCenter which="east" time={t} down={false} appear={progress(t, 22, 23.5)} />
          {/* routing lines with split percentages */}
          <Link from={GEODNS} to={{ x: DC.west.cx, y: DC.west.y + 70 }} inset={44} width={2 + westShare / 25} color={westDown ? C.line : C.violet} animated={!westDown} time={t}
            label={t >= 36 ? `${westShare}%` : undefined} dashed={westDown} />
          <Link from={GEODNS} to={{ x: DC.east.cx, y: DC.east.y + 70 }} inset={44} width={2 + x / 25} color={C.violet} animated time={t} label={t >= 36 ? `${x}%` : undefined} />
          {/* west users → west DC, east users → east DC (until failover) */}
          {Array.from({ length: 8 }, (_, i) => {
            const s = 27 + i * 3.6;
            const west = i % 2 === 0;
            const tgt = west ? DC.west : DC.east;
            return (
              <Packet key={i} along={[west ? WEST_USERS : EAST_USERS, GEODNS, { x: tgt.cx, y: tgt.y + 40 }]} time={t} start={s} end={s + 3}
                color={west ? C.sky : C.amber} size={6} />
            );
          })}
          {Array.from({ length: 6 }, (_, i) => {
            const s = 67 + i * 2.6;
            return <Packet key={i} along={[WEST_USERS, GEODNS, { x: DC.east.cx, y: DC.east.y + 40 }]} time={t} start={s} end={s + 3} color={C.sky} size={6} />;
          })}
          <Storm x={DC.west.cx} y={DC.west.y - 10} time={t} intensity={fadeWindow(t, 59, T.challenges, 1)} />
          {westDown && <CrossMark x={DC.west.cx} y={DC.west.y + 165} t={progress(t, 62.5, 63.5)} size={90} />}
          <Callout x={330} y={608} width={620} title="geoDNS" color={C.violet} size={15}
            text="A DNS service that resolves a domain name to different IP addresses depending on where the user is. Each user is geo-routed to the closest data center."
            appear={fadeWindow(t, 25, 36, 0.4)} />
          <Callout x={330} y={608} width={620} title="Split traffic" color={C.violet} size={15}
            text="In normal operation: x% of traffic goes to US-East and (100 − x)% to US-West."
            appear={fadeWindow(t, 36.5, 57.5, 0.4)} />
          <Callout x={330} y={608} width={620} title="Data center outage → 100% to the healthy one" color={C.rose} size={15}
            text="US-West is offline, so geoDNS sends all traffic to US-East until it recovers."
            appear={fadeWindow(t, 64, 85.5, 0.4)} />
        </g>
      )}

      {/* ====================== challenges ====================== */}
      {chO > 0 && (
        <g opacity={chO}>
          <Label x={640} y={80} text="Three challenges of going multi-data-center" size={24} color={C.white} weight={800} />
          {[
            { at: 86.5, title: '1 · Traffic redirection', c: C.violet, until: T.sync },
            { at: T.sync, title: '2 · Data synchronization', c: C.emerald, until: T.deploy },
            { at: T.deploy, title: '3 · Test and deployment', c: C.amber, until: T.teaser },
          ].map((k, i) => (
            <Chip key={k.title} x={250 + i * 390} y={130} text={k.title} color={k.c} filled={between(t, k.at, k.until)} size={17} appear={progress(t, k.at, k.at + 0.6, ease.outBack)} />
          ))}
          {/* 1: redirection */}
          <Appear p={fadeWindow(t, 87, T.sync, 0.5)} from="up">
            <Node kind="dns" label="geoDNS" x={640} y={330} size={100} time={t} glow={0.6} />
            <Callout x={420} y={430} width={440} title="Effective tools to direct traffic" color={C.violet} size={15}
              text="GeoDNS points each user at the nearest data center, and away from a broken one." />
            {[0, 1, 2, 3].map((i) => (
              <Packet key={i} along={[{ x: 200 + i * 300, y: 230 }, { x: 640, y: 330 }, { x: i < 2 ? 300 : 980, y: 420 }]} time={t} start={88 + i * 1.5} end={91 + i * 1.5} color={C.violet} size={6} />
            ))}
          </Appear>
          {/* 2: data sync */}
          {between(t, T.sync - 0.5, T.deploy) && (
            <g opacity={fadeWindow(t, T.sync - 0.5, T.deploy, 0.5)}>
              <Panel x={110} y={200} w={420} h={330} title="US-West" color={C.violet} tint={0.05} />
              <Panel x={750} y={200} w={420} h={330} title="US-East" color={C.violet} tint={0.05} />
              <Node kind="db" label="local DB" x={320} y={330} size={90} time={t} state={between(t, 102, 110) ? 'down' : 'idle'} />
              <Hotspot id="replication" interactive={interactive} onClick={onHotspot} active={t >= 110} x={640} y={290} time={t} label="Cross-DC replication">
                <Node kind="db" label="local DB" x={960} y={330} size={90} time={t} glow={replicating ? 0.6 : 0} />
              </Hotspot>
              <Node kind="mobile" label="West user" x={180} y={470} size={60} time={t} />
              <Chip x={320} y={455} text="cat.jpg · lunch.jpg" color={C.sky} size={13} />
              {!replicating && (
                <g>
                  <Packet along={[{ x: 180, y: 470 }, { x: 640, y: 560 }, { x: 960, y: 400 }]} time={t} start={103} end={106} color={C.sky} size={7} label="failover" />
                  <Chip x={960} y={455} text="cat.jpg? lunch.jpg? not here" color={C.rose} filled size={13} appear={progress(t, 106, 106.6)} />
                  <CrossMark x={1100} y={330} t={progress(t, 106.2, 107)} size={44} />
                </g>
              )}
              {replicating && (
                <g>
                  <Link from={{ x: 320, y: 330 }} to={{ x: 960, y: 330 }} inset={56} width={3} color={C.emerald} animated time={t} label="async replication" arrow />
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Packet key={i} along={linkPath({ x: 320, y: 330 }, { x: 960, y: 330 }, 0, 56)} time={t} start={110.5 + i * 1.2} end={112.5 + i * 1.2} color={C.emerald} size={6} />
                  ))}
                  <Chip x={960} y={455} text="cat.jpg · lunch.jpg" color={C.emerald} size={13} appear={progress(t, 113, 113.8)} />
                  <CheckMark x={1100} y={330} t={progress(t, 114, 115)} size={44} />
                </g>
              )}
              <Callout x={300} y={570} width={680} title={replicating ? 'Replicate data across data centers' : 'Failover to a DC without your data'} color={replicating ? C.emerald : C.rose} size={15}
                text={replicating
                  ? 'A common strategy is to copy data to every data center. Netflix, for example, uses asynchronous multi-data-center replication.'
                  : 'Each region may use its own local databases and caches. After a failover, users can land where their data is not available.'}
                appear={fadeWindow(t, 100, T.deploy, 0.4)} />
            </g>
          )}
          {/* 3: test + deploy */}
          {between(t, T.deploy - 0.5, T.teaser) && (
            <g opacity={fadeWindow(t, T.deploy - 0.5, T.teaser, 0.5)}>
              <Hotspot id="deploy" interactive={interactive} onClick={onHotspot} active={t >= 124} x={690} y={250} time={t} label="Automated deployment">
                <Node kind="ci" label="Automated deploy" x={640} y={300} size={100} time={t} state="active" />
              </Hotspot>
              <Node kind="datacenter" label="US-West" x={300} y={480} size={90} time={t} />
              <Node kind="datacenter" label="US-East" x={980} y={480} size={90} time={t} />
              <Link from={{ x: 640, y: 300 }} to={{ x: 300, y: 480 }} width={2} color={C.amber} animated time={t} />
              <Link from={{ x: 640, y: 300 }} to={{ x: 980, y: 480 }} width={2} color={C.amber} animated time={t} />
              <Packet along={linkPath({ x: 640, y: 300 }, { x: 300, y: 480 }, 0, 60)} time={t} start={126} end={128.5} color={C.amber} label="v42" shape="envelope" />
              <Packet along={linkPath({ x: 640, y: 300 }, { x: 980, y: 480 }, 0, 60)} time={t} start={126} end={128.5} color={C.amber} label="v42" shape="envelope" />
              <Chip x={300} y={570} text="v42 ✓ tested here" color={C.emerald} size={14} appear={progress(t, 129, 130)} />
              <Chip x={980} y={570} text="v42 ✓ tested here" color={C.emerald} size={14} appear={progress(t, 130, 131)} />
              <Callout x={340} y={620} width={600} title="Same version everywhere" color={C.amber} size={15}
                text="Test the app from different locations, and use automated deployment tools so every data center stays consistent."
                appear={fadeWindow(t, 124, T.teaser, 0.4)} />
            </g>
          )}
        </g>
      )}

      {/* ====================== teaser: decoupling ====================== */}
      {teaserO > 0 && (
        <g opacity={teaserO}>
          <Node kind="datacenter" label="US-West" x={240} y={300} size={90} time={t} state="active" />
          <Node kind="datacenter" label="US-East" x={240} y={500} size={90} time={t} state="active" />
          <Sparkles x={240} y={400} t={progress(t, 145, 147)} radius={140} seed={9} />
          <Node kind="web" label="Web servers" x={640} y={400} size={100} time={t} state={t > 152 ? 'overloaded' : 'busy'} />
          {['crop', 'sharpen', 'blur'].map((f, i) => (
            <Chip key={f} x={640 + (i - 1) * 110} y={270} text={f} color={C.rose} size={14} appear={progress(t, 150 + i * 0.6, 151 + i * 0.6, ease.outBack)} />
          ))}
          <Node kind="queue" label="Message queue?" x={980} y={400} size={100} time={t} state="ghost" appear={progress(t, 156, 157.5)} />
          <Link from={{ x: 640, y: 400 }} to={{ x: 980, y: 400 }} width={2} dashed color={C.amber} draw={progress(t, 156.5, 158)} />
          <Character who="ravi" mood="neutral" x={1080} y={600} size={100} time={t} talking={between(t, 158, 164)} bubble="left"
            appear={fadeWindow(t, 157.5, T.end + 1, 0.4)} say="To scale further, decouple the pieces." />
        </g>
      )}
    </Stage>
  );
}
