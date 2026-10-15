import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, Counter, CrossMark, Hotspot, Link, Meter, Node, Packet, Panel,
  Sparkles, Stage, Title, between, clamp, ease, fadeWindow, lerp, progress, tween, type NodeState, type Pt,
} from '@/scenekit';
import { USER_COLOR, type UserId } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  stateful: 20,
  sticky: 58,
  stateless: 88,
  design: 122,
  autoscale: 146,
  end: 172,
} as const;

/* ------------------------- Figures 1-12 / 1-13 layout ------------------------- */
const USERS: Record<UserId, Pt> = { A: { x: 130, y: 180 }, B: { x: 130, y: 360 }, C: { x: 130, y: 540 } };
const LB: Pt = { x: 420, y: 360 };
const SRV: Pt[] = [
  { x: 740, y: 150 },
  { x: 740, y: 290 },
  { x: 740, y: 430 },
  { x: 740, y: 570 },
];
const STORE: Pt = { x: 1120, y: 360 };

const route = (u: UserId, s: number): Pt[] => [
  { x: USERS[u].x + 48, y: USERS[u].y },
  { x: LB.x - 40, y: LB.y },
  { x: LB.x + 40, y: LB.y },
  { x: SRV[s].x - 46, y: SRV[s].y },
];

/** A request from user `u` to server index `s`, with a tick or cross at `start + 2.4`. */
function Req({ time, start, u, s, ok, note }: { time: number; start: number; u: UserId; s: number; ok: boolean; note?: string }) {
  const mark = progress(time, start + 2.3, start + 3);
  const vis = fadeWindow(time, start + 2.3, start + 6, 0.3);
  return (
    <g>
      <Packet along={route(u, s)} time={time} start={start} end={start + 2.3} color={USER_COLOR[u]} label={`user ${u}`} shape="envelope" size={8} />
      {vis > 0 && (
        <g opacity={vis}>
          {ok ? <CheckMark x={SRV[s].x - 80} y={SRV[s].y - 40} t={mark} size={32} /> : <CrossMark x={SRV[s].x - 80} y={SRV[s].y - 40} t={mark} size={32} />}
          {note && <Chip x={SRV[s].x - 200} y={SRV[s].y - 40} text={note} color={ok ? C.emerald : C.rose} filled size={12} />}
        </g>
      )}
    </g>
  );
}

/* --------------------------- Figure 1-14 layout --------------------------- */
const D = {
  client: { x: 110, y: 260 },
  mobile: { x: 110, y: 480 },
  dns: { x: 330, y: 110 },
  cdn: { x: 560, y: 100 },
  lb: { x: 360, y: 380 },
  nosql: { x: 960, y: 260 },
  cache: { x: 960, y: 440 },
  db: { x: 960, y: 610 },
  replica: { x: 1170, y: 610 },
};
const WEB_X = 650;
const webY = (i: number) => 220 + i * 95;

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const users = Math.round(tween(t, 150, 162, 500_000, 1_000_000, ease.inOutQuad));

  /* ---------------- chapters 1-4: the stateful / stateless board ---------------- */
  const boardO = fadeWindow(t, 6, T.design, 0.6);
  const s4 = between(t, 70, T.stateless) ? progress(t, 70, 71.5, ease.outBack) : 0;
  const s2Down = between(t, 79, T.stateless);
  // sessions fly from the servers into the shared store at 90-95
  const fly = progress(t, 90, 95, ease.inOutCubic);
  const sessionsInStore = t >= 90;
  const pinned = fadeWindow(t, 47, T.stateless, 0.6);
  const stateless = t >= 88;

  const serverState = (i: number): NodeState => {
    if (i === 1 && s2Down) return 'down';
    if (i === 3 && between(t, 71.5, 78)) return 'ghost';
    return 'idle';
  };

  /* ---------------- chapters 5-6: figure 1-14 and autoscaling ---------------- */
  const designO = fadeWindow(t, T.design + 0.5, T.end + 1, 0.6);
  const load = t < 148 ? 0.35 : t < 158 ? tween(t, 148, 157, 0.35, 0.95) : tween(t, 160, 167, 0.95, 0.3);
  const servers = t < T.autoscale ? 3 : lerp(2, 5, clamp((load - 0.3) / 0.65));

  return (
    <Stage time={t} drift title="Level 8 lesson: a stateless web tier">
      <Title text="Forget Me Not" kicker="LEVEL 8 · 1M USERS" subtitle="Stateless web tier" y={130}
        appear={t < 6 ? progress(t, 0.3, 1.3) : 1 - progress(t, 5, 6)} />
      <Counter x={1140} y={52} value={users} time={t} bump={between(t, 150, 162)} />

      {boardO > 0 && (
        <g opacity={boardO}>
          {(['A', 'B', 'C'] as UserId[]).map((u, i) => (
            <Node key={u} kind={i === 1 ? 'mobile' : 'client'} label={`User ${u}`} x={USERS[u].x} y={USERS[u].y} size={84} time={t}
              color={USER_COLOR[u]} appear={progress(t, 6 + i * 0.3, 7 + i * 0.3)} />
          ))}
          <Hotspot id="sticky" interactive={interactive} onClick={onHotspot} active={between(t, 59, T.stateless)} x={LB.x + 50} y={LB.y - 56} time={t} label="Sticky sessions">
            <Node kind="lb" label={between(t, 58, T.stateless) ? 'LB · sticky sessions' : 'Load balancer'} x={LB.x} y={LB.y} size={90} time={t}
              state={between(t, 64, 70) ? 'busy' : 'idle'} appear={progress(t, 7, 8)} />
          </Hotspot>
          {[0, 1, 2].map((i) => (
            <Node key={i} kind="web" label={`Server ${i + 1}`} x={SRV[i].x} y={SRV[i].y} size={84} time={t} state={serverState(i)} appear={progress(t, 7.5 + i * 0.3, 8.5 + i * 0.3)} />
          ))}
          {s4 > 0 && <Node kind="web" label="Server 4 (new)" x={SRV[3].x} y={SRV[3].y} size={84} time={t} state={serverState(3)} appear={s4} />}
          {s4 > 0 && t >= 72 && <Chip x={SRV[3].x + 150} y={SRV[3].y} text="0 sessions · nobody routed here" color={C.amber} size={12} appear={progress(t, 72, 73)} />}
          <Link from={LB} to={SRV[0]} inset={50} width={2} color={C.line} />
          <Link from={LB} to={SRV[1]} inset={50} width={2} color={C.line} />
          <Link from={LB} to={SRV[2]} inset={50} width={2} color={C.line} />
          {(['A', 'B', 'C'] as UserId[]).map((u) => (
            <Link key={u} from={USERS[u]} to={LB} inset={50} width={2} color={C.line} />
          ))}

          {/* sticky pins: A→1, B→2, C→3 */}
          {pinned > 0 && (
            <g opacity={pinned}>
              {(['A', 'B', 'C'] as UserId[]).map((u, i) => (
                <polyline key={u} points={route(u, i).map((p) => `${p.x},${p.y + (i - 1) * 6}`).join(' ')} fill="none" stroke={USER_COLOR[u]} strokeWidth={3} strokeDasharray="10 8" opacity={0.75} />
              ))}
            </g>
          )}

          {/* session data on each server, then in the shared store */}
          <Hotspot id="session" interactive={interactive} onClick={onHotspot} active={between(t, 28, T.stateless)} x={SRV[0].x + 236} y={SRV[0].y - 34} time={t} label="Session data">
            {(['A', 'B', 'C'] as UserId[]).map((u, i) => {
              const from = { x: SRV[i].x + 150, y: SRV[i].y };
              const to = { x: STORE.x, y: STORE.y + 100 + i * 32 };
              const p = sessionsInStore ? fly : 0;
              const lost = i === 1 && s2Down;
              return (
                <Chip key={u} x={lerp(from.x, to.x, p)} y={lerp(from.y, to.y, p)} text={i === 0 && p === 0 ? 'session A + profile pic' : `session ${u}`}
                  color={lost ? C.dim : USER_COLOR[u]} filled={!lost} size={13} appear={progress(t, 28 + i * 1.2, 29 + i * 1.2, ease.outBack)} />
              );
            })}
          </Hotspot>
          {s2Down && <CrossMark x={SRV[1].x + 150} y={SRV[1].y} t={progress(t, 80, 81)} size={30} />}

          {/* intro: requests bouncing */}
          <Req time={t} start={8.5} u="A" s={0} ok note="200 OK" />
          <Req time={t} start={11.5} u="A" s={2} ok={false} note="401 · please log in" />
          {/* fig 1-12 */}
          <Req time={t} start={34} u="A" s={0} ok note="session found" />
          <Req time={t} start={40} u="A" s={1} ok={false} note="auth fails: who is A?" />
          {/* sticky: server 2 dies */}
          <Req time={t} start={81.5} u="B" s={0} ok={false} note="B logged out!" />

          {/* stateless */}
          {stateless && (
            <Hotspot id="shared-store" interactive={interactive} onClick={onHotspot} active={between(t, 92, T.design)} x={STORE.x + 52} y={STORE.y - 60} time={t} label="Shared data store">
              <Node kind="nosql" label="Shared session store" x={STORE.x} y={STORE.y} size={96} time={t} glow={0.6} appear={progress(t, 88.5, 89.5, ease.outBack)}
                state={between(t, 97, 99) || between(t, 101, 103) || between(t, 105, 107) ? 'active' : 'idle'} />
            </Hotspot>
          )}
          {stateless && [0, 1, 2].map((i) => <Link key={i} from={SRV[i]} to={STORE} inset={56} width={2} color={C.orange} dashed draw={progress(t, 89, 90)} animated time={t} />)}
          <Req time={t} start={95} u="A" s={1} ok note="state from store" />
          <Packet along={[{ x: SRV[1].x + 46, y: SRV[1].y }, { x: STORE.x - 52, y: STORE.y }]} time={t} start={96.6} end={97.8} color={C.orange} size={6} />
          <Req time={t} start={99} u="B" s={2} ok />
          <Packet along={[{ x: SRV[2].x + 46, y: SRV[2].y }, { x: STORE.x - 52, y: STORE.y }]} time={t} start={100.6} end={101.8} color={C.orange} size={6} />
          <Req time={t} start={103} u="C" s={0} ok />
          <Packet along={[{ x: SRV[0].x + 46, y: SRV[0].y }, { x: STORE.x - 52, y: STORE.y }]} time={t} start={104.6} end={105.8} color={C.orange} size={6} />
          {['Simpler', 'More robust', 'Scalable'].map((s, i) => (
            <Chip key={s} x={360 + i * 170} y={650} text={s} color={C.emerald} filled size={16} appear={fadeWindow(t, 106 + i * 1.2, 121.5, 0.4)} />
          ))}
          <Appear p={fadeWindow(t, 112, 121.6, 0.4)} from="left">
            <Chip x={1120} y={210} text="Relational DB" color={C.dim} size={13} />
            <Chip x={1120} y={170} text="Memcached / Redis" color={C.dim} size={13} />
            <Chip x={1120} y={130} text="NoSQL ✓ easy to scale" color={C.orange} filled size={13} />
          </Appear>
        </g>
      )}

      {/* chapter callouts */}
      <Character who="pager" mood="panic" x={1110} y={590} size={100} time={t} talking={between(t, 14, 19)} bubble="left"
        appear={fadeWindow(t, 13.5, 19.8, 0.4)} say="BZZT! Logged in on server 1, a stranger on server 3!" />
      <Callout x={260} y={20} width={420} title="Stateful server" color={C.rose} size={15}
        text="Remembers client data (state) from one request to the next, e.g. who is logged in."
        appear={fadeWindow(t, 20.5, 33, 0.4)} />
      <Callout x={700} y={20} width={300} title="Stateless server" color={C.emerald} size={15}
        text="Keeps no state information at all." appear={fadeWindow(t, 25, 33, 0.4)} />
      <Callout x={300} y={30} width={480} title="Every request must go back home" color={C.amber} size={15}
        text="A's session is on server 1, so all of A's requests must reach server 1. Same for B → 2 and C → 3."
        appear={fadeWindow(t, 47, 58, 0.4)} />
      <Callout x={300} y={30} width={480} title="Sticky sessions: possible, but…" color={C.amber} size={15}
        text="Most load balancers can pin users to servers. It adds overhead, makes adding or removing servers hard, and server failures painful."
        appear={fadeWindow(t, 59, 78.5, 0.4)} />
      <Callout x={300} y={30} width={480} title="Stateless web tier" color={C.emerald} size={15}
        text="Requests can go to any web server. Servers fetch state from a shared data store, kept out of the web tier."
        appear={fadeWindow(t, 91, 111.5, 0.4)} />
      <Callout x={300} y={30} width={480} title="Which shared store?" color={C.orange} size={15}
        text="A relational DB, Memcached/Redis or NoSQL all work. PixelPost picks NoSQL because it is easy to scale."
        appear={fadeWindow(t, 112, 121.6, 0.4)} />

      {/* ---------------- figure 1-14 + autoscaling ---------------- */}
      {designO > 0 && (
        <g opacity={designO}>
          <Node kind="client" label="Web browser" x={D.client.x} y={D.client.y} size={80} time={t} />
          <Node kind="mobile" label="Mobile app" x={D.mobile.x} y={D.mobile.y} size={80} time={t} />
          <Node kind="dns" label="DNS" x={D.dns.x} y={D.dns.y} size={70} time={t} />
          <Node kind="cdn" label="CDN" x={D.cdn.x} y={D.cdn.y} size={70} time={t} />
          <Node kind="lb" label="Load balancer" x={D.lb.x} y={D.lb.y} size={80} time={t} />
          <Hotspot id="autoscale" interactive={interactive} onClick={onHotspot} active={t >= T.autoscale} x={WEB_X + 110} y={170} time={t} label="Autoscaling">
            <Panel x={WEB_X - 90} y={160} w={180} h={510} title={t >= T.autoscale ? `Web tier · ${Math.round(servers)} servers` : 'Web tier (stateless)'} color={C.cyan} tint={0.06} />
          </Hotspot>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = i < 2 ? 1 : clamp(servers - i + 0.5);
            return a > 0 ? (
              <g key={i}>
                <Node kind="web" label="" x={WEB_X} y={webY(i)} size={64} time={t} appear={a} state={load > 0.85 ? 'busy' : 'idle'} />
                <Link from={D.lb} to={{ x: WEB_X, y: webY(i) }} inset={44} width={1.5} color={C.cyan} opacity={a} />
                <Link from={{ x: WEB_X, y: webY(i) }} to={D.nosql} inset={44} width={1.5} color={C.orange} opacity={a * 0.6} dashed />
              </g>
            ) : null;
          })}
          <Node kind="nosql" label="Session store (NoSQL)" x={D.nosql.x} y={D.nosql.y} size={84} time={t} glow={0.6} />
          <Node kind="cache" label="Cache" x={D.cache.x} y={D.cache.y} size={76} time={t} />
          <Node kind="db" label="DB master" x={D.db.x} y={D.db.y} size={76} time={t} />
          <Node kind="db-replica" label="Replica" x={D.replica.x} y={D.replica.y} size={68} time={t} />
          <Link from={D.client} to={D.lb} width={2} color={C.cyan} />
          <Link from={D.mobile} to={D.lb} width={2} color={C.cyan} />
          <Link from={D.client} to={D.dns} width={1.5} color={C.violet} dashed />
          <Link from={D.client} to={D.cdn} width={1.5} color={C.sky} dashed bend={-30} />
          <Link from={{ x: WEB_X, y: webY(2) }} to={D.cache} inset={44} width={1.5} color={C.amber} />
          <Link from={{ x: WEB_X, y: webY(3) }} to={D.db} inset={44} width={1.5} color={C.emerald} />
          <Link from={D.db} to={D.replica} inset={44} width={1.5} color={C.emerald} dashed />
          <Callout x={840} y={95} width={380} title="State moved out" color={C.orange} size={14}
            text="Session data now lives in a persistent NoSQL store, not on any web server." appear={fadeWindow(t, 124, 145.5, 0.4)} pointTo={{ x: D.nosql.x, y: D.nosql.y - 50 }} />
          {t >= T.autoscale && (
            <g>
              <Meter x={180} y={640} w={300} value={load} label="Traffic load" />
              <Callout x={840} y={95} width={380} title="Autoscaling" color={C.cyan} size={14}
                text="Add or remove web servers automatically based on traffic load. Easy once the web tier is stateless."
                appear={fadeWindow(t, 147, T.end + 1, 0.4)} />
              <Sparkles x={WEB_X} y={webY(4)} t={progress(t, 156, 157.5)} radius={70} seed={5} />
            </g>
          )}
        </g>
      )}
      <Character who="ravi" mood="neutral" x={1170} y={420} size={100} time={t} talking={between(t, 166, 171)} bubble="left"
        appear={fadeWindow(t, 165.5, T.end + 1, 0.4)} say="Next: users all over the planet." />
    </Stage>
  );
}
