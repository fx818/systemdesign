import type { ComponentKind, LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, Counter, Explosion, Hotspot, Label, Link, Meter, Node, Packet, Smoke,
  Sparkles, Stage, StatusBadge, Title, between, ease, fadeWindow, hash, lerp, linkPath, progress, pulse, type Pt,
} from '@/scenekit';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  roles: 18,
  why: 58,
  failures: 92,
  flow: 140,
  end: 180,
} as const;

type HotspotHandler = ((id: string) => void) | undefined;
interface PartProps { time: number; interactive: boolean; onHotspot: HotspotHandler }

/* ------------------------------ Chapter 1 -------------------------------- */
function IntroPart({ time: t }: { time: number }) {
  const vis = fadeWindow(t, 0, T.roles + 0.5, 0.6);
  if (vis <= 0) return null;
  const U: Pt = { x: 110, y: 360 };
  const LB: Pt = { x: 340, y: 360 };
  const W = [{ x: 590, y: 240 }, { x: 590, y: 480 }];
  const DB: Pt = { x: 900, y: 360 };
  const down = t >= 6;
  return (
    <g opacity={vis}>
      <Node kind="client" label="Users" x={U.x} y={U.y} size={84} time={t} appear={progress(t, 0.5, 1.1)} />
      <Node kind="lb" label="Load balancer" x={LB.x} y={LB.y} size={84} time={t} appear={progress(t, 0.7, 1.3)} />
      <Link from={U} to={LB} inset={50} color={C.sky} animated time={t} />
      {W.map((w, i) => (
        <g key={i}>
          <Link from={LB} to={w} inset={50} color={C.cyan} animated time={t} />
          <Link from={w} to={DB} inset={56} color={down ? C.rose : C.emerald} animated={!down} time={t} state={down ? 'down' : 'ok'} />
          <Node kind="web" label={`Server ${i + 1}`} x={w.x} y={w.y} size={88} time={t} appear={progress(t, 0.9 + i * 0.2, 1.5 + i * 0.2)} state={down ? 'busy' : 'idle'} />
        </g>
      ))}
      {Array.from({ length: 30 }, (_, i) => {
        const s = 1 + i * 0.55;
        const w = W[i % 2];
        const failed = s + 0.6 >= 6;
        return (
          <g key={i}>
            <Packet along={[U, LB, w]} time={t} start={s} end={s + 0.8} color={C.sky} size={6} trail={false} />
            <Packet along={linkPath(w, DB, 0, 56)} time={t} start={s + 0.8} end={s + 1.4} color={failed ? C.rose : C.emerald} size={6} trail={false} />
          </g>
        );
      })}
      <Node kind="db" label="The only database" x={DB.x} y={DB.y} size={110} time={t} appear={progress(t, 1.2, 1.8)} state={down ? 'down' : 'active'} />
      <Explosion x={DB.x} y={DB.y} t={progress(t, 6, 7.3)} size={150} />
      <Smoke x={DB.x} y={DB.y - 50} time={t} intensity={down ? 0.8 : 0} seed={4} />
      <StatusBadge x={640} y={110} status={down ? 'down' : 'ok'} text={down ? 'db-1 down · every page failing' : 'All systems normal'} time={t} />
      <Character who="maya" mood="panic" x={1150} y={570} size={130} time={t} talking={between(t, 9, 14)} appear={fadeWindow(t, 8, T.roles, 0.5)}
        say="ALL our photos are in that ONE box?!" bubble="left" />
    </g>
  );
}

/* --------------------------- Chapters 2-4: board -------------------------- */
type Id = 'M' | 'R0' | 'R1' | 'R2' | 'R3';
const WEB: Pt = { x: 190, y: 360 };
const MS: Pt = { x: 540, y: 170 };
const RS: Pt[] = [{ x: 900, y: 200 }, { x: 900, y: 360 }, { x: 900, y: 520 }];
const IDS: Id[] = ['M', 'R0', 'R1', 'R2', 'R3'];
const CITY: Record<Id, string> = { M: 'Bengaluru', R0: 'Mumbai', R1: 'Tokyo', R2: 'Manila', R3: 'Mumbai' };
const PROMOTE = 123;
const MASTER_DOWN = 120;

function visOf(id: Id, t: number): number {
  switch (id) {
    case 'M': return fadeWindow(t, T.roles, MASTER_DOWN + 2.5, 0.6);
    case 'R0': return progress(t, 24, 25);
    case 'R1': return t < 100 ? progress(t, 24.5, 25.5) * (1 - progress(t, 95.5, 96.5)) : fadeWindow(t, 107.5, 118.5, 0.5);
    case 'R2': return t < 100 ? progress(t, 25, 26) * (1 - progress(t, 95.5, 96.5)) : fadeWindow(t, 107.5, 118.5, 0.5);
    case 'R3': return progress(t, 128, 129);
  }
}
function deadOf(id: Id, t: number): boolean {
  switch (id) {
    case 'M': return t >= MASTER_DOWN;
    case 'R0': return between(t, 99, 105);
    case 'R1': return between(t, 111, 115.5);
    case 'R2': return between(t, 75, 88);
    case 'R3': return false;
  }
}
const posOf = (id: Id, t: number): Pt => {
  if (id === 'M') return MS;
  if (id === 'R0') {
    const k = progress(t, PROMOTE, PROMOTE + 2, ease.inOutCubic);
    return { x: lerp(RS[0].x, MS.x, k), y: lerp(RS[0].y, MS.y, k) };
  }
  return id === 'R3' ? RS[0] : RS[Number(id[1])];
};
const isMaster = (id: Id, t: number) => (id === 'M' && t < MASTER_DOWN) || (id === 'R0' && t >= PROMOTE);
const aliveOf = (id: Id, t: number) => visOf(id, t) > 0.5 && !deadOf(id, t);
const masterAt = (t: number): Id | null => (t < MASTER_DOWN ? 'M' : t >= PROMOTE ? 'R0' : null);
const replicasAt = (t: number) => IDS.filter((id) => id !== 'M' && !isMaster(id, t) && aliveOf(id, t));

function labelOf(id: Id, t: number) {
  if (id === 'M') return 'Primary (master)';
  if (id === 'R0') return t >= PROMOTE ? 'New master (promoted)' : t >= 105 ? 'Replica 1 (new)' : 'Replica 1';
  if (id === 'R1') return t >= 115.5 ? 'Replica 2 (new)' : 'Replica 2';
  if (id === 'R2') return between(t, 88, 96) ? 'Replica 3 (new)' : 'Replica 3';
  return 'New replica';
}

const SPAWNS = Array.from({ length: 300 }, (_, i) => T.roles + 1 + i * 0.4).filter((s) => s < T.flow - 1);

function BoardPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.roles, T.flow + 0.5, 0.6);
  if (vis <= 0) return null;
  const master = masterAt(t);
  const mPos = master ? posOf(master, t) : MS;
  const cities = between(t, 68, 92);
  return (
    <g opacity={vis}>
      <Node kind="web" label="Web tier" sublabel="servers 1 + 2" x={WEB.x} y={WEB.y} size={100} time={t} appear={progress(t, T.roles, T.roles + 0.8)} />

      {/* web → DB links */}
      {IDS.map((id) => {
        const v = visOf(id, t);
        if (v <= 0) return null;
        const m = isMaster(id, t) || (id === 'M' && t < PROMOTE);
        const dead = deadOf(id, t);
        return (
          <Link key={`w${id}`} from={WEB} to={posOf(id, t)} inset={58} color={dead ? C.rose : m ? C.amber : C.cyan} dashed={!m} opacity={v * (dead ? 0.5 : 1)}
            animated={!dead} time={t} state={dead ? 'down' : 'ok'} />
        );
      })}
      {/* replication links */}
      {master && IDS.filter((id) => id !== master && visOf(id, t) > 0 && id !== 'M').map((id) => (
        <Link key={`r${id}`} from={mPos} to={posOf(id, t)} inset={58} color={C.emerald} width={2} dashed opacity={visOf(id, t) * (deadOf(id, t) ? 0.3 : 0.8)}
          arrow label={id === 'R0' && t < 60 ? 'copies' : undefined} />
      ))}
      {master &&
        Array.from({ length: 100 }, (_, i) => {
          const s = 26 + i * 1.15;
          if (t < s || t > s + 1) return null;
          return (
            <g key={`c${i}`}>
              {replicasAt(s).map((id) => (
                <Packet key={id} along={linkPath(mPos, posOf(id, t), 0, 58)} time={t} start={s} end={s + 1} color={C.emerald} size={4} trail={false} />
              ))}
            </g>
          );
        })}

      {/* queries */}
      {SPAWNS.map((s, i) => {
        if (t < s || t > s + 1) return null;
        const write = hash(i * 7 + 1) < 0.14;
        const reps = replicasAt(s);
        const m = masterAt(s);
        let target: Id | null;
        if (write) target = m;
        else if (reps.length) target = reps[i % reps.length];
        else target = m;
        const to = target ? posOf(target, t) : MS;
        const failed = target === null;
        return (
          <Packet key={i} along={linkPath(WEB, to, 0, 58)} time={t} start={s} end={s + 1} size={write ? 8 : 6} trail={false}
            color={failed ? C.rose : write ? C.amber : C.cyan} />
        );
      })}

      {/* the databases */}
      {IDS.map((id) => {
        const v = visOf(id, t);
        if (v <= 0) return null;
        const p = posOf(id, t);
        const m = isMaster(id, t) || id === 'M';
        const kind: ComponentKind = m ? 'db' : 'db-replica';
        const dead = deadOf(id, t);
        const node = (
          <Node kind={kind} label={labelOf(id, t)} sublabel={cities ? CITY[id] : undefined} x={p.x} y={p.y} size={m ? 108 : 92} time={t}
            appear={id === 'M' ? progress(t, T.roles, T.roles + 0.8) : v} state={dead ? 'down' : m ? 'active' : 'idle'} />
        );
        if (id === 'M') {
          return (
            <Hotspot key={id} id="master" interactive={interactive} onClick={onHotspot} active={between(t, 28, MASTER_DOWN)} x={p.x + 56} y={p.y - 56} time={t} label="Master">
              <g opacity={v}>{node}</g>
            </Hotspot>
          );
        }
        return <g key={id} opacity={id === 'R3' ? 1 : Math.min(1, v * 1.2)}>{node}</g>;
      })}
      <Hotspot id="replicas" interactive={interactive} onClick={onHotspot} active={between(t, 30, 96)} x={960} y={140} time={t} label="Replicas" />

      {/* failures fx */}
      <Explosion x={RS[2].x} y={RS[2].y} t={progress(t, 75, 76.3)} size={120} />
      <Explosion x={RS[0].x} y={RS[0].y} t={progress(t, 99, 100.2)} size={110} />
      <Explosion x={RS[1].x} y={RS[1].y} t={progress(t, 111, 112.2)} size={110} />
      <Explosion x={MS.x} y={MS.y} t={progress(t, MASTER_DOWN, MASTER_DOWN + 1.3)} size={150} />
      <Smoke x={RS[2].x} y={RS[2].y - 40} time={t} intensity={between(t, 75, 88) ? 0.7 : 0} seed={8} />
      <Sparkles x={RS[2].x} y={RS[2].y} t={progress(t, 88, 89.3)} radius={80} seed={2} />
      <Sparkles x={RS[0].x} y={RS[0].y} t={progress(t, 105, 106.3)} radius={80} seed={3} />
      <Sparkles x={RS[1].x} y={RS[1].y} t={progress(t, 115.5, 116.8)} radius={80} seed={4} />
      <Sparkles x={RS[0].x} y={RS[0].y} t={progress(t, 128, 129.3)} radius={80} seed={6} />
      {/* typhoon */}
      {between(t, 71.5, 76) && (
        <g transform={`translate(${RS[2].x + 100} ${RS[2].y - 30}) rotate(${-t * 260})`} opacity={fadeWindow(t, 71.5, 76, 0.5)}>
          {[0, 120, 240].map((a) => (
            <path key={a} d="M0 0 C 20 -10, 40 0, 46 22" transform={`rotate(${a})`} fill="none" stroke={C.sky} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
          ))}
          <circle r={7} fill={C.sky} />
        </g>
      )}
      {between(t, 71.5, 76) && <Label x={RS[2].x + 60} y={RS[2].y + 45} text="TYPHOON!" size={18} color={C.sky} weight={900} />}

      {/* promotion */}
      {t >= PROMOTE && (
        <g>
          <Sparkles x={MS.x} y={MS.y} t={progress(t, PROMOTE + 1.6, PROMOTE + 3)} radius={130} />
          <Appear p={progress(t, PROMOTE + 1.8, PROMOTE + 2.4)} from="pop" x={MS.x} y={MS.y - 92}>
            <Chip x={MS.x} y={MS.y - 92} text="👑 PROMOTED" color={C.amber} filled size={15} />
          </Appear>
        </g>
      )}
      {master === null && t >= MASTER_DOWN + 0.5 && (
        <g opacity={0.6 + 0.4 * pulse(t, 0.5)}>
          <StatusBadge x={MS.x} y={MS.y + 120} status="down" text="no master: writes failing" time={t} />
        </g>
      )}
      <Hotspot id="promotion" interactive={interactive} onClick={onHotspot} active={between(t, PROMOTE + 2, T.flow)} x={MS.x + 60} y={MS.y - 60} time={t} label="Promotion" />

      {/* stale data */}
      {between(t, 132.5, T.flow) && (
        <g opacity={fadeWindow(t, 132.5, T.flow, 0.4)}>
          <rect x={360} y={480} width={360} height={110} rx={18} fill={C.panel} stroke={C.amber} strokeWidth={2} />
          <text x={380} y={510} fill={C.amber} fontSize={15} fontWeight={800}>New master might be behind:</text>
          {['INSERT photo 9921', 'UPDATE bio user 42', 'INSERT comment 77'].map((w, i) => (
            <g key={w}>
              <text x={380} y={535 + i * 20} fill={C.text} fontSize={13} fontFamily="ui-monospace, monospace" opacity={1 - 0.6 * progress(t, 135.5, 136.5)}>{w}</text>
              <CheckMark x={640} y={530 + i * 20} t={progress(t, 134.5 + i * 0.4, 135.2 + i * 0.4)} size={16} />
            </g>
          ))}
          <text x={680} y={575} textAnchor="end" fill={C.emerald} fontSize={12} fontWeight={800} opacity={progress(t, 134.5, 135)}>recovery script</text>
        </g>
      )}

      {/* legend */}
      <g opacity={progress(t, 20, 21)}>
        <circle cx={140} cy={600} r={7} fill={C.cyan} />
        <text x={154} y={605} fill={C.text} fontSize={14} fontWeight={700}>read (SELECT)</text>
        <circle cx={290} cy={600} r={8} fill={C.amber} />
        <text x={304} y={605} fill={C.text} fontSize={14} fontWeight={700}>write (INSERT / UPDATE / DELETE)</text>
        <circle cx={580} cy={600} r={5} fill={C.emerald} />
        <text x={594} y={605} fill={C.text} fontSize={14} fontWeight={700}>replication copy</text>
      </g>
    </g>
  );
}

/* Callouts and side panels for the board chapters */
function BoardNotes({ time: t, interactive, onHotspot }: PartProps) {
  if (t < T.roles || t > T.flow + 1) return null;
  const ops = [
    { sql: 'INSERT INTO photos …', at: 43.5, to: MS },
    { sql: 'UPDATE users …', at: 45, to: MS },
    { sql: 'DELETE FROM likes …', at: 46.5, to: MS },
    { sql: 'SELECT * FROM feed …', at: 48, to: RS[1] },
  ];
  const adv = fadeWindow(t, 59, T.failures, 0.5);
  return (
    <g>
      <Title text="Database replication" subtitle="one master, many replicas" y={58} size={28} appear={fadeWindow(t, T.roles, 27, 0.5)} color={C.emerald} />
      <Callout x={990} y={110} width={265} title="Master / slave" color={C.violet} size={14}
        text={'The book\'s terms: an original (master) and its copies (slaves). Our UI says primary and replicas.'}
        appear={fadeWindow(t, 23, 33, 0.5)} />
      <Callout x={990} y={110} width={265} title="Master: writes" color={C.amber} size={14}
        text="The master generally supports only write operations. INSERT, UPDATE and DELETE all go here."
        appear={fadeWindow(t, 33, 48, 0.5)} pointTo={{ x: MS.x + 50, y: MS.y - 40 }} />
      <Callout x={990} y={330} width={265} title="Replicas: reads" color={C.cyan} size={14}
        text="Replicas get copies of the data from the master and only support reads."
        appear={fadeWindow(t, 38, 48, 0.5)} />
      {ops.map((o) => (
        <Packet key={o.sql} along={linkPath(WEB, o.to, 0, 58)} time={t} start={o.at} end={o.at + 1.6} label={o.sql} shape="envelope"
          color={o.to === MS ? C.amber : C.cyan} />
      ))}
      {fadeWindow(t, 48.5, T.why, 0.5) > 0 && (
        <g opacity={fadeWindow(t, 48.5, T.why, 0.5)}>
          <rect x={990} y={110} width={265} height={170} rx={18} fill={C.panel} stroke={C.line} />
          <text x={1010} y={140} fill={C.white} fontSize={16} fontWeight={800}>Reads ≫ writes</text>
          <Meter x={1010} y={180} w={225} value={0.9 * progress(t, 49, 50.5)} label="reads 90%" color={C.cyan} />
          <Meter x={1010} y={225} w={225} value={0.1 * progress(t, 49, 50.5)} label="writes 10%" color={C.amber} />
          <text x={1010} y={262} fill={C.dim} fontSize={13} opacity={progress(t, 53, 54)}>→ more replicas than masters</text>
        </g>
      )}

      <Hotspot id="advantages" interactive={interactive} onClick={onHotspot} active={between(t, 60, T.failures)} x={1250} y={100} time={t} label="Advantages" />
      {[
        { title: '1 · Better performance', text: 'Writes on the master, reads spread over replicas: more queries in parallel.', at: 59, color: C.cyan },
        { title: '2 · Reliability', text: 'A typhoon or earthquake destroys a server? The data is preserved in other locations.', at: 68, color: C.emerald },
        { title: '3 · High availability', text: 'One database is offline, yet the site keeps running on the others.', at: 83, color: C.violet },
      ].map((c, i) => (
        <Callout key={c.title} x={990} y={110 + i * 150} width={265} title={c.title} text={c.text} color={c.color} size={14}
          appear={progress(t, c.at, c.at + 0.8) * adv} />
      ))}

      <Title text="What if a database goes offline?" y={58} size={26} appear={fadeWindow(t, T.failures, 97, 0.4)} color={C.rose} />
      <Callout x={990} y={110} width={265} title="Case 1: the only replica dies" color={C.rose} size={14}
        text="Reads go to the master temporarily, until a new replica replaces the old one."
        appear={fadeWindow(t, 98, 108, 0.5)} />
      <Callout x={990} y={110} width={265} title="Case 2: one of several dies" color={C.amber} size={14}
        text="Reads are redirected to the other healthy replicas. A new server replaces the broken one."
        appear={fadeWindow(t, 109, 118, 0.5)} />
      <Callout x={990} y={110} width={265} title="Case 3: the master dies" color={C.rose} size={14}
        text="A replica is promoted to be the new master. All operations temporarily run on it; a new replica replaces the old one right away."
        appear={fadeWindow(t, 119, 133, 0.5)} />
      <Callout x={990} y={110} width={265} title="Stale data" color={C.amber} size={14}
        text="The promoted replica may be missing recent writes. Data recovery scripts fill the gap."
        appear={fadeWindow(t, 133, 137.5, 0.4)} />
      <Callout x={990} y={110} width={265} title="Beyond this level" color={C.violet} size={14}
        text="Multi-master and circular replication can help, but they are far more complicated setups."
        appear={fadeWindow(t, 137.2, T.flow + 0.5, 0.3)} />
    </g>
  );
}

/* ------------------------- Chapter 5: the full flow ----------------------- */
const F = {
  user: { x: 100, y: 400 },
  dns: { x: 290, y: 190 },
  lb: { x: 420, y: 400 },
  s1: { x: 650, y: 270 },
  s2: { x: 650, y: 530 },
  m: { x: 960, y: 230 },
  ra: { x: 900, y: 520 },
  rb: { x: 1110, y: 520 },
};
const STEPS = [
  { at: 145, text: '1 · The user gets the load balancer\'s IP from DNS' },
  { at: 150, text: '2 · The user connects to the load balancer with that IP' },
  { at: 155, text: '3 · The HTTP request is routed to server 1 or server 2' },
  { at: 160, text: '4 · The web server reads user data from a replica' },
  { at: 165, text: '5 · Writes, updates and deletes go to the master' },
];

function FlowPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.flow, T.end + 1, 0.6);
  if (vis <= 0) return null;
  const step = STEPS.filter((s) => t >= s.at).length - 1;
  const ap = (a: number) => progress(t, T.flow + a, T.flow + a + 0.7);
  return (
    <g opacity={vis}>
      <Title text="The full picture" y={50} size={28} appear={progress(t, T.flow, T.flow + 1)} color={C.cyan} />
      {step >= 0 && <Label x={640} y={100} text={STEPS[step].text} size={20} color={C.amber} anchor="middle" weight={800} />}
      <Hotspot id="full-flow" interactive={interactive} onClick={onHotspot} active={t >= 145} x={860} y={42} time={t} label="Full request flow" />

      <Link from={F.user} to={F.dns} inset={50} color={C.amber} dashed draw={ap(0.5)} />
      <Link from={F.user} to={F.lb} inset={50} color={C.sky} animated time={t} draw={ap(0.8)} />
      <Link from={F.lb} to={F.s1} inset={50} color={C.cyan} animated time={t} draw={ap(1)} />
      <Link from={F.lb} to={F.s2} inset={50} color={C.cyan} animated time={t} draw={ap(1.1)} />
      {[F.s1, F.s2].map((s, i) => (
        <g key={i}>
          <Link from={s} to={F.m} inset={54} color={C.amber} draw={ap(1.3)} width={2} />
          <Link from={s} to={F.ra} inset={54} color={C.cyan} dashed draw={ap(1.4)} width={2} />
          <Link from={s} to={F.rb} inset={54} color={C.cyan} dashed draw={ap(1.5)} width={2} />
        </g>
      ))}
      <Link from={F.m} to={F.ra} inset={54} color={C.emerald} dashed arrow draw={ap(1.7)} width={2} />
      <Link from={F.m} to={F.rb} inset={54} color={C.emerald} dashed arrow draw={ap(1.8)} width={2} label="replication" />

      <Node kind="client" label="User" x={F.user.x} y={F.user.y} size={84} time={t} appear={ap(0)} />
      <Node kind="dns" label="DNS" x={F.dns.x} y={F.dns.y} size={76} time={t} appear={ap(0.2)} state={between(t, 145, 150) ? 'active' : 'idle'} />
      <Node kind="lb" label="Load balancer" x={F.lb.x} y={F.lb.y} size={88} time={t} appear={ap(0.4)} state={between(t, 150, 155) ? 'active' : 'idle'} />
      <Node kind="web" label="Server 1" x={F.s1.x} y={F.s1.y} size={84} time={t} appear={ap(0.6)} state={between(t, 155, 170) ? 'active' : 'idle'} />
      <Node kind="web" label="Server 2" x={F.s2.x} y={F.s2.y} size={84} time={t} appear={ap(0.7)} />
      <Node kind="db" label="Master" x={F.m.x} y={F.m.y} size={96} time={t} appear={ap(0.9)} state={between(t, 165, 170) ? 'active' : 'idle'} />
      <Node kind="db-replica" label="Replica 1" x={F.ra.x} y={F.ra.y} size={84} time={t} appear={ap(1)} state={between(t, 160, 165) ? 'active' : 'idle'} />
      <Node kind="db-replica" label="Replica 2" x={F.rb.x} y={F.rb.y} size={84} time={t} appear={ap(1.1)} />

      <Packet along={linkPath(F.user, F.dns, 0, 50)} time={t} start={145.5} end={146.8} label="api.pixelpost.com?" shape="envelope" color={C.amber} />
      <Packet along={linkPath(F.dns, F.user, 0, 50)} time={t} start={147.2} end={148.5} label="LB IP" shape="envelope" color={C.amber} />
      <Packet along={linkPath(F.user, F.lb, 0, 50)} time={t} start={150.5} end={152} label="HTTP" shape="envelope" color={C.sky} />
      <Packet along={linkPath(F.lb, F.s1, 0, 50)} time={t} start={155.5} end={157} color={C.cyan} size={9} />
      <Packet along={linkPath(F.s1, F.ra, 0, 54)} time={t} start={160.5} end={162} label="SELECT" shape="envelope" color={C.cyan} />
      <Packet along={linkPath(F.ra, F.s1, 0, 54)} time={t} start={162.3} end={163.5} color={C.emerald} size={8} />
      <Packet along={linkPath(F.s1, F.m, 0, 54)} time={t} start={165.5} end={167} label="UPDATE" shape="envelope" color={C.amber} />
      {Array.from({ length: 4 }, (_, i) => (
        <g key={i}>
          <Packet along={linkPath(F.m, F.ra, 0, 54)} time={t} start={167.2 + i * 1.5} end={168.2 + i * 1.5} color={C.emerald} size={5} trail={false} />
          <Packet along={linkPath(F.m, F.rb, 0, 54)} time={t} start={167.2 + i * 1.5} end={168.4 + i * 1.5} color={C.emerald} size={5} trail={false} />
        </g>
      ))}
      <Character who="ravi" mood="proud" x={130} y={590} size={100} time={t} talking={between(t, 171, 177)} appear={fadeWindow(t, 170, T.end + 2, 0.5)}
        say="Both tiers are redundant now. Next: speed." bubble="right" />
      <Sparkles x={1140} y={40} t={progress(t, 171, 172.5)} />
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const intro = t < 6 ? progress(t, 0.3, 1.3) * (1 - progress(t, 4.6, 5.6)) : 0;
  return (
    <Stage time={t} drift title="Level 5 lesson: database replication">
      <IntroPart time={t} />
      <BoardPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <BoardNotes time={t} interactive={interactive} onHotspot={onHotspot} />
      <FlowPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <Counter x={1140} y={40} value={100000} time={t} bump={between(t, 0, 4) || t > 170} />
      {intro > 0 && (
        <g>
          <rect width={1280} height={720} fill={C.bg} opacity={0.75 * intro} />
          <Title text="Copy That" kicker="LEVEL 5 · 100K USERS" subtitle="One database is one too few" y={330} appear={intro} />
        </g>
      )}
    </Stage>
  );
}
