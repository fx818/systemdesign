import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Chip, Counter, CrossMark, Explosion, Hotspot, Label, Link, Node, Packet, Panel, Smoke, Sparkles, Stage,
  StatusBadge, Title, between, fadeWindow, linkPath, progress, pulse, tween, type Pt,
} from '@/scenekit';
import { LB_PUBLIC_IP, PRIVATE_IPS } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  lb: 18,
  ips: 44,
  failover: 88,
  grow: 122,
  end: 160,
} as const;

const LAPTOP: Pt = { x: 110, y: 240 };
const PHONE: Pt = { x: 110, y: 480 };
const DNS: Pt = { x: 300, y: 110 };
const LB: Pt = { x: 420, y: 360 };
const DB: Pt = { x: 1150, y: 450 };
const SLOTS: Pt[] = [
  { x: 740, y: 190 },
  { x: 740, y: 360 },
  { x: 740, y: 530 },
  { x: 920, y: 275 },
  { x: 920, y: 445 },
];
const LB_ON = 20;
const ROUTE_ON = 22;
const S1_DOWN = 95;
const S1_GONE = 121;
/** When each server joins the pool. */
const JOIN = [0.6, 0.9, 105, 133, 137];

const alive = (i: number, t: number) => t >= JOIN[i] + 0.4 && !(i === 0 && t >= S1_DOWN);
const aliveList = (t: number) => SLOTS.map((_, i) => i).filter((i) => alive(i, t));
const rpsAt = (t: number) => (t < ROUTE_ON ? 1.25 : t < T.grow ? 0.95 : tween(t, T.grow, 128, 0.95, 2.6));

function loadOf(i: number, t: number) {
  if (!alive(i, t)) return 0;
  if (t < ROUTE_ON) return i === 0 ? 1.3 : 0.04;
  return rpsAt(t) / Math.max(1, aliveList(t).length);
}

/** Deterministic request spawn times: denser once traffic grows. */
const SPAWNS: number[] = (() => {
  const out: number[] = [];
  for (let s = 1; s < T.end; s += s < T.grow ? 0.5 : 0.3) out.push(Math.round(s * 100) / 100);
  return out;
})();
const HOP = 0.7;

function Requests({ t }: { t: number }) {
  return (
    <g>
      {SPAWNS.map((s, i) => {
        if (t < s || t > s + 2 * HOP + 0.1) return null;
        const from = i % 2 ? PHONE : LAPTOP;
        if (s < ROUTE_ON) {
          return <Packet key={i} along={linkPath(from, SLOTS[0], 0, 56)} time={t} start={s} end={s + 1.2} color={C.sky} size={6} trail={false} />;
        }
        const live = aliveList(s + HOP);
        const target = live.length ? live[i % live.length] : 0;
        const col = [C.cyan, C.violet, C.emerald, C.amber, C.orange][target];
        return (
          <g key={i}>
            <Packet along={linkPath(from, LB, 0, 56)} time={t} start={s} end={s + HOP} color={C.sky} size={6} trail={false} />
            <Packet along={linkPath(LB, SLOTS[target], 0, 56)} time={t} start={s + HOP} end={s + 2 * HOP} color={col} size={6} trail={false} />
          </g>
        );
      })}
    </g>
  );
}

function serverState(i: number, t: number) {
  if (i === 0 && t >= S1_DOWN) return 'down' as const;
  const l = loadOf(i, t);
  return l > 1 ? ('overloaded' as const) : l > 0.8 ? ('busy' as const) : ('idle' as const);
}

function Servers({ time: t, interactive, onHotspot }: { time: number; interactive: boolean; onHotspot?: (id: string) => void }) {
  const showPrivate = t >= 66 && t < T.failover + 4;
  return (
    <g>
      {SLOTS.map((p, i) => {
        const gone = i === 0 ? 1 - progress(t, S1_GONE, S1_GONE + 1) : 1;
        if (gone <= 0) return null;
        const st = serverState(i, t);
        return (
          <g key={i} opacity={gone}>
            <Node kind="web" label={`Server ${i + 1}`} sublabel={showPrivate ? `private ${PRIVATE_IPS[i]}` : undefined} x={p.x} y={p.y} size={92} time={t}
              appear={progress(t, JOIN[i], JOIN[i] + 0.8)} state={st} load={st === 'down' ? undefined : loadOf(i, t)} />
            {i >= 2 && <Sparkles x={p.x} y={p.y} t={progress(t, JOIN[i], JOIN[i] + 1.3)} radius={80} seed={i + 4} />}
          </g>
        );
      })}
      <Explosion x={SLOTS[0].x} y={SLOTS[0].y} t={progress(t, S1_DOWN, S1_DOWN + 1.3)} size={120} />
      <Smoke x={SLOTS[0].x} y={SLOTS[0].y - 40} time={t} intensity={between(t, S1_DOWN, S1_GONE) ? 0.7 : t < ROUTE_ON ? 0.5 : 0} seed={5} />
      <Hotspot id="failover" interactive={interactive} onClick={onHotspot} active={between(t, S1_DOWN + 1, S1_GONE)} x={SLOTS[0].x + 52} y={SLOTS[0].y - 52} time={t} label="Failover" />
    </g>
  );
}

function Wiring({ t }: { t: number }) {
  const lbIn = progress(t, LB_ON, LB_ON + 1.5);
  const direct = 1 - progress(t, LB_ON, LB_ON + 1);
  return (
    <g>
      {direct > 0 &&
        [LAPTOP, PHONE].map((c, k) => (
          <Link key={`d${k}`} from={c} to={SLOTS[0]} inset={56} color={C.rose} animated time={t} state="hot" opacity={direct} draw={progress(t, 1.2, 2)} />
        ))}
      {lbIn > 0 &&
        [LAPTOP, PHONE].map((c, k) => <Link key={`c${k}`} from={c} to={LB} inset={56} color={C.sky} animated time={t} draw={lbIn} />)}
      {lbIn > 0 &&
        SLOTS.map((p, i) => {
          const vis = i === 0 ? 1 - progress(t, S1_GONE, S1_GONE + 1) : progress(t, JOIN[i], JOIN[i] + 1);
          if (vis <= 0) return null;
          const dead = i === 0 && t >= S1_DOWN;
          return (
            <Link key={`s${i}`} from={LB} to={p} inset={56} color={dead ? C.rose : C.cyan} animated={!dead} time={t} state={dead ? 'down' : 'ok'}
              draw={i < 2 ? lbIn : vis} opacity={vis} />
          );
        })}
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const intro = t < 7 ? progress(t, 0.3, 1.3) * (1 - progress(t, 5.5, 6.5)) : 0;
  const ipVis = fadeWindow(t, 50, T.failover + 1, 0.5);
  const privVis = fadeWindow(t, 64, T.failover + 1, 0.5);
  const poolW = 180 + 180 * progress(t, 132, 133.5);
  const dbIn = progress(t, 148, 149);
  const live = aliveList(t);
  const hot = live.some((i) => loadOf(i, t) > 1);
  const status =
    t < ROUTE_ON ? { s: 'down' as const, txt: 'web-1 140% · timeouts' }
      : between(t, S1_DOWN, 105) ? { s: 'warn' as const, txt: 'Server 1 down · site still online' }
        : hot ? { s: 'warn' as const, txt: 'Pool running hot' }
          : { s: 'ok' as const, txt: `Load balanced across ${live.length} servers` };

  return (
    <Stage time={t} drift title="Level 4 lesson: the load balancer">
      <Counter x={1140} y={50} value={50000} time={t} bump={between(t, 0, 4) || between(t, 122, 126)} />

      {/* private network zone */}
      {privVis > 0 && (
        <Hotspot id="private-ip" interactive={interactive} onClick={onHotspot} active={between(t, 66, T.failover)} x={1000} y={92} time={t} label="Private IPs">
          <g opacity={privVis}>
            <Panel x={330} y={92} w={670} h={540} title="Private network" color={C.emerald} dashed tint={0.04} />
            <Label x={210} y={640} text="THE INTERNET" size={14} color={C.dim} anchor="middle" weight={800} />
          </g>
        </Hotspot>
      )}

      {/* pool */}
      <Hotspot id="add-servers" interactive={interactive} onClick={onHotspot} active={between(t, 133, T.end + 1)} x={650 + poolW} y={110} time={t} label="Add servers to the pool">
        <Panel x={650} y={110} w={poolW} h={505} title="Load-balanced set" color={C.cyan} tint={0.04} opacity={progress(t, 24, 25.5)} />
      </Hotspot>

      <Wiring t={t} />
      <Requests t={t} />

      {/* clients */}
      <Node kind="client" label="Web" x={LAPTOP.x} y={LAPTOP.y} size={84} time={t} appear={progress(t, 0.4, 1)} />
      <Node kind="mobile" label="Mobile" x={PHONE.x} y={PHONE.y} size={84} time={t} appear={progress(t, 0.6, 1.2)} />

      {/* the load balancer */}
      <Hotspot id="load-balancer" interactive={interactive} onClick={onHotspot} active={t >= LB_ON + 1} x={LB.x + 54} y={LB.y - 54} time={t} label="Load balancer">
        <Node kind="lb" label="Load balancer" sublabel={ipVis > 0 ? `public ${LB_PUBLIC_IP}` : undefined} x={LB.x} y={LB.y} size={100} time={t}
          appear={progress(t, LB_ON - 1, LB_ON)} state={t >= LB_ON ? 'active' : 'idle'} />
      </Hotspot>
      <Sparkles x={LB.x} y={LB.y} t={progress(t, LB_ON, LB_ON + 1.4)} radius={120} />

      <Servers time={t} interactive={interactive} onHotspot={onHotspot} />

      {/* DNS + public IP */}
      {ipVis > 0 && (
        <g opacity={ipVis}>
          <Node kind="dns" label="DNS" x={DNS.x} y={DNS.y} size={76} time={t} appear={progress(t, 50, 50.8)} />
          <Link from={LAPTOP} to={DNS} inset={48} color={C.amber} dashed draw={progress(t, 50.5, 51.5)} />
          <Packet along={linkPath(LAPTOP, DNS, 0, 48)} time={t} start={51.5} end={52.5} label="api.pixelpost.com?" color={C.amber} shape="envelope" />
          <Packet along={linkPath(DNS, LAPTOP, 0, 48)} time={t} start={53} end={54} label={LB_PUBLIC_IP} color={C.amber} shape="envelope" />
          <Hotspot id="public-ip" interactive={interactive} onClick={onHotspot} active={between(t, 54, T.failover)} x={250} y={50} time={t} label="Public IP">
            <Appear p={progress(t, 54, 55)} from="down">
              <Chip x={440} y={50} text={`DNS → ${LB_PUBLIC_IP} (the load balancer)`} color={C.amber} size={15} />
            </Appear>
          </Hotspot>
        </g>
      )}

      {/* a client trying to skip the load balancer */}
      {between(t, 60, 66) && (
        <g>
          <Link from={LAPTOP} to={SLOTS[0]} inset={56} bend={-60} color={C.rose} dashed draw={progress(t, 60, 61)} opacity={1 - progress(t, 65, 66)} />
          <Packet along={linkPath(LAPTOP, { x: 560, y: 150 }, -30, 56)} time={t} start={60.5} end={61.8} color={C.rose} size={9} />
          <CrossMark x={560} y={150} t={progress(t, 61.8, 62.6)} size={46} />
          <Label x={470} y={200} text="web servers: unreachable from outside" size={14} color={C.rose} anchor="middle" weight={800} opacity={progress(t, 62, 62.5)} />
        </g>
      )}

      {/* data tier tease */}
      {dbIn > 0 && (
        <g>
          {live.map((i) => (
            <Link key={i} from={SLOTS[i]} to={DB} inset={56} color={C.emerald} dashed draw={progress(t, 148.5, 149.5)} />
          ))}
          <Node kind="db" label="The only database" x={DB.x} y={DB.y} size={100} time={t} appear={dbIn} state={t > 153 ? 'busy' : 'idle'} />
          {t > 153 && (
            <g opacity={0.6 + 0.4 * pulse(t, 0.8)}>
              <StatusBadge x={DB.x} y={DB.y + 110} status="warn" text="No failover" time={t} />
            </g>
          )}
        </g>
      )}

      <StatusBadge x={850} y={50} status={status.s} text={status.txt} time={t} />

      {/* callouts */}
      <Callout x={980} y={120} width={270} title="Load balancer" color={C.violet} size={15}
        text="Evenly distributes incoming traffic among the web servers in a load-balanced set."
        appear={fadeWindow(t, 23, 43, 0.5)} pointTo={{ x: LB.x + 50, y: LB.y - 30 }} />
      <Callout x={980} y={350} width={270} title="Round and round" color={C.cyan} size={15}
        text="Request 1 to server 1, request 2 to server 2... Nobody is overwhelmed."
        appear={fadeWindow(t, 28, 43, 0.5)} />
      <Callout x={1010} y={140} width={250} title="Public IP" color={C.amber} size={15}
        text="Users connect to the load balancer's public IP. The web servers are no longer reachable directly."
        appear={fadeWindow(t, 55, 66, 0.5)} />
      <Callout x={1010} y={140} width={250} title="Private IP" color={C.emerald} size={15}
        text="Reachable only between servers in the same network, never over the internet. Better security."
        appear={fadeWindow(t, 67, 82, 0.5)} />
      <Callout x={1010} y={400} width={250} title="LB → servers" color={C.emerald} size={15}
        text="The load balancer talks to the web servers through their private IPs."
        appear={fadeWindow(t, 82, 88.5, 0.4)} />
      <Callout x={1010} y={140} width={250} title="Failover" color={C.rose} size={15}
        text="Server 1 is offline, so all traffic goes to server 2. The website stays online."
        appear={fadeWindow(t, 97, 112, 0.5)} pointTo={{ x: SLOTS[1].x + 50, y: SLOTS[1].y }} />
      <Callout x={1010} y={400} width={250} title="Add a healthy server" color={C.emerald} size={15}
        text="A new server joins the pool and the load is balanced again."
        appear={fadeWindow(t, 105, 121, 0.5)} pointTo={{ x: SLOTS[2].x + 50, y: SLOTS[2].y }} />
      <Callout x={1010} y={110} width={250} title="Traffic grows fast?" color={C.amber} size={15}
        text="Just add more servers to the pool. The load balancer starts sending them requests automatically."
        appear={fadeWindow(t, 127, 147, 0.5)} />
      <Callout x={1010} y={150} width={250} title="What about the data tier?" color={C.rose} size={15}
        text="One database: no failover, no redundancy. That is the next level."
        appear={fadeWindow(t, 150, T.end + 1, 0.5)} pointTo={{ x: DB.x, y: DB.y - 55 }} />

      {intro > 0 && (
        <g>
          <rect width={1280} height={720} fill={C.bg} opacity={0.75 * intro} />
          <Title text="Traffic Cop" kicker="LEVEL 4 · 50K USERS" subtitle="We were on national TV" y={330} appear={intro} />
          <g opacity={intro * (0.6 + 0.4 * pulse(t, 0.6))}>
            <StatusBadge x={640} y={450} status="down" text="Pager: web-1 140%" time={t} />
          </g>
        </g>
      )}
    </Stage>
  );
}
