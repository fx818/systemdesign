import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, Counter, CrossMark, Explosion, Hotspot, Label, Link, MONO, Node, Packet,
  Panel, Smoke, Sparkles, Stage, StatusBadge, Title, between, ease, fadeWindow, hash, linkPath, progress, pulse, tween, type Pt,
} from '@/scenekit';
import { TIERS } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  up: 20,
  limits: 50,
  out: 92,
  direct: 125,
  end: 165,
} as const;

type HotspotHandler = ((id: string) => void) | undefined;
interface PartProps { time: number; interactive: boolean; onHotspot: HotspotHandler }

/* ----------------------- Chapters 1-3: one server ------------------------ */
const SERVER: Pt = { x: 600, y: 390 };
const LAPTOP: Pt = { x: 130, y: 280 };
const PHONE: Pt = { x: 130, y: 500 };
const CEILING_Y = 262;
const UPGRADE_AT = [26, 31, 36] as const;
const CRASH = 72;

/** Current hardware tier (0..3) of the single server. */
const tierAt = (t: number) => UPGRADE_AT.filter((u) => t >= u).length;

function serverSize(t: number) {
  let s = 104;
  UPGRADE_AT.forEach((u, i) => {
    s += [26, 26, 24][i] * ease.outBack(progress(t, u, u + 0.8));
  });
  // t 60-64: tries to grow past the ceiling and bounces back
  const push = progress(t, 60, 61.5) * (1 - progress(t, 62.5, 64));
  return s + 26 * push;
}

function serverLoad(t: number) {
  if (t < UPGRADE_AT[0]) return 0.98;
  if (t < 52) return [0.98, 0.78, 0.6, 0.42][tierAt(t)];
  if (t < CRASH) return tween(t, 52, 59, 0.42, 1.0);
  return 0;
}

function OneServerPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, 0, T.out + 0.5, 0.6);
  if (vis <= 0) return null;
  const tier = tierAt(t);
  const size = serverSize(t);
  const load = serverLoad(t);
  const dead = t >= CRASH + 0.3;
  const state = dead ? 'down' : load > 0.95 ? 'overloaded' : load > 0.8 ? 'busy' : 'idle';
  const ceiling = progress(t, 55, 56.5);
  const bump = between(t, 61, 63.5);

  return (
    <g opacity={vis}>
      {/* clients and traffic */}
      <Node kind="client" label="Web" x={LAPTOP.x} y={LAPTOP.y} size={84} time={t} appear={progress(t, 0.8, 1.4)} />
      <Node kind="mobile" label="Mobile" x={PHONE.x} y={PHONE.y} size={84} time={t} appear={progress(t, 1, 1.6)} />
      {[LAPTOP, PHONE].map((c, k) => (
        <Link key={k} from={c} to={SERVER} inset={70} color={dead ? C.rose : C.sky} animated={!dead} time={t} draw={progress(t, 1.4 + k * 0.3, 2.2 + k * 0.3)}
          state={dead ? 'down' : 'ok'} />
      ))}
      {Array.from({ length: 64 }, (_, i) => {
        const s = 2 + i * 1.3 + hash(i) * 0.8;
        if (s > T.out) return null;
        const from = i % 2 ? PHONE : LAPTOP;
        const failed = s > CRASH;
        return (
          <Packet key={i} along={linkPath(from, SERVER, 0, 70)} time={t} start={s} end={s + 1.2} color={failed ? C.rose : C.sky} size={6} trail={false} />
        );
      })}

      {/* hardware ceiling */}
      {ceiling > 0 && (
        <Hotspot id="hard-limit" interactive={interactive} onClick={onHotspot} active={t >= 58} x={830} y={CEILING_Y} time={t} label="Hard limit">
          <g opacity={ceiling}>
            <rect x={380} y={CEILING_Y - 14} width={440} height={14} rx={4} fill={`${C.rose}33`} stroke={C.rose} strokeWidth={2} />
            {Array.from({ length: 11 }, (_, i) => (
              <line key={i} x1={392 + i * 40} y1={CEILING_Y - 14} x2={412 + i * 40} y2={CEILING_Y} stroke={C.rose} strokeWidth={2} opacity={0.7} />
            ))}
            <Label x={600} y={CEILING_Y - 24} text="THE BIGGEST SERVER YOU CAN BUY" size={14} color={C.rose} anchor="middle" weight={800} />
          </g>
        </Hotspot>
      )}
      {bump && <rect x={SERVER.x - 100} y={CEILING_Y - 2} width={200} height={6} rx={3} fill={C.amber} opacity={0.6 + 0.4 * pulse(t, 0.3)} filter="url(#sk-glow)" />}
      <CrossMark x={SERVER.x + 130} y={CEILING_Y + 40} t={progress(t, 62.5, 63.5)} size={44} />
      {t > 62.5 && t < 70 && <Label x={SERVER.x + 165} y={CEILING_Y + 48} text="no bigger box exists" size={15} color={C.rose} weight={700} opacity={fadeWindow(t, 62.5, 70)} />}

      {/* the server */}
      <Hotspot id="scale-up" interactive={interactive} onClick={onHotspot} active={between(t, 22, T.limits)} x={SERVER.x + size / 2 + 6} y={SERVER.y - size / 2 - 6} time={t} label="Scale up">
        <Node kind="web" label="web-1" sublabel={`${TIERS[tier].cpu} · ${TIERS[tier].ram}`} x={SERVER.x} y={SERVER.y} size={size} time={t}
          appear={progress(t, 0.5, 1.2)} state={state} load={dead ? undefined : load} />
      </Hotspot>
      {UPGRADE_AT.map((u, i) => (
        <g key={u}>
          <Sparkles x={SERVER.x} y={SERVER.y} t={progress(t, u, u + 1.2)} radius={110} seed={i + 3} />
          <Appear p={fadeWindow(t, u, u + 3)} from="up">
            <Chip x={SERVER.x} y={SERVER.y + 150} text={`UPGRADE → ${TIERS[i + 1].name}`} color={C.emerald} filled />
          </Appear>
        </g>
      ))}
      <Explosion x={SERVER.x} y={SERVER.y} t={progress(t, CRASH, CRASH + 1.4)} size={190} />
      <Smoke x={SERVER.x} y={SERVER.y - 60} time={t} intensity={dead ? 0.9 : t < UPGRADE_AT[0] ? 0.5 : 0} seed={3} />
      <CrossMark x={260} y={390} t={progress(t, CRASH + 1, CRASH + 2)} size={56} />

      {/* cost ladder */}
      <Appear p={progress(t, 33, 34) * (1 - progress(t, 50, 51))} from="right">
        <Panel x={900} y={300} w={330} h={290} title="Monthly cost per tier" color={C.amber} tint={0.05} />
        {TIERS.map((tr, i) => {
          const h = Math.min(190, 12 + Math.sqrt(tr.cost) * 3.2);
          const lit = i <= tier;
          return (
            <g key={tr.name}>
              <rect x={930 + i * 74} y={570 - h * progress(t, 34 + i * 0.4, 35 + i * 0.4)} width={52} height={h * progress(t, 34 + i * 0.4, 35 + i * 0.4)}
                rx={8} fill={lit ? `${C.amber}aa` : `${C.amber}33`} stroke={C.amber} />
              <text x={956 + i * 74} y={560 - h} textAnchor="middle" fill={C.white} fontSize={14} fontWeight={800} fontFamily={MONO}
                opacity={progress(t, 35 + i * 0.4, 35.5 + i * 0.4)}>{tr.cost}</text>
              <text x={956 + i * 74} y={588} textAnchor="middle" fill={C.dim} fontSize={12} fontWeight={700}>{tr.name}</text>
            </g>
          );
        })}
      </Appear>

      {/* status + talk */}
      <StatusBadge x={SERVER.x} y={110} time={t}
        status={dead ? 'down' : load > 0.95 ? 'down' : load > 0.8 ? 'warn' : 'ok'}
        text={dead ? 'Site down: 100% of users' : `web-1 CPU ${Math.round(load * 100)}%`} />
      <Character who="maya" mood="happy" x={1110} y={330} size={130} time={t} talking={between(t, 10, 15)} appear={fadeWindow(t, 7, 19.5, 0.5)}
        say="Just buy a bigger server! The biggest one!" bubble="left" />
      <Callout x={880} y={110} width={350} title="Scale up (vertical scaling)" color={C.cyan} size={15}
        text="Add more power (CPU, RAM, etc.) to the server you already have."
        appear={fadeWindow(t, 21, 32, 0.5)} pointTo={{ x: SERVER.x + 90, y: SERVER.y - 40 }} />
      <Callout x={880} y={110} width={350} title="Main advantage: simplicity" color={C.emerald} size={15}
        text="Still one server, nothing new to run. A great option while traffic is low."
        appear={fadeWindow(t, 40, 50, 0.5)} />
      <Callout x={880} y={330} width={350} title="Limitation 1: hard limit" color={C.rose} size={15}
        text="It is impossible to add unlimited CPU and memory to a single server."
        appear={fadeWindow(t, 60, 70.5, 0.5)} pointTo={{ x: 820, y: CEILING_Y }} />
      <Callout x={880} y={330} width={350} title="Limitation 2: no failover" color={C.rose} size={15}
        text="No redundancy. If the one server goes down, the website/app goes down with it completely."
        appear={fadeWindow(t, 75, 91, 0.5)} pointTo={{ x: SERVER.x + 80, y: SERVER.y }} />
      <Hotspot id="no-failover" interactive={interactive} onClick={onHotspot} active={between(t, 75, T.out)} x={1230} y={330} time={t} label="No failover" />
      <Appear p={progress(t, 86, 87)} from="up">
        <Chip x={SERVER.x} y={SERVER.y + 150} text="Large-scale apps prefer horizontal scaling" color={C.violet} />
      </Appear>
    </g>
  );
}

/* --------------------------- Chapter 4: scale out ------------------------- */
const POOL = { x: 420, y: 130, w: 400, h: 450 };
const POOL_SERVERS: Pt[] = [
  { x: 520, y: 250 },
  { x: 720, y: 250 },
  { x: 520, y: 450 },
  { x: 720, y: 450 },
];
const POOL_AT = [92.5, 98, 103, 105] as const;
const POOL_KILL = 108;

function ScaleOutPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.out, T.direct + 0.5, 0.6);
  if (vis <= 0) return null;
  const alive = POOL_AT.filter((a, i) => t >= a && !(i === 2 && t >= POOL_KILL)).length;
  const traffic = tween(t, 96, 106, 0.9, 2.6);
  const entry: Pt = { x: POOL.x, y: POOL.y + POOL.h / 2 };
  const compare = progress(t, 111, 112);
  return (
    <g opacity={vis}>
      <Title text="Scale out (horizontal scaling)" y={60} size={30} appear={progress(t, T.out, T.out + 1)} color={C.violet} />
      <Node kind="client" label="Web" x={LAPTOP.x} y={LAPTOP.y} size={84} time={t} />
      <Node kind="mobile" label="Mobile" x={PHONE.x} y={PHONE.y} size={84} time={t} />
      {[LAPTOP, PHONE].map((c, k) => (
        <Link key={k} from={c} to={entry} inset={50} color={C.sky} animated time={t} />
      ))}
      {Array.from({ length: 40 }, (_, i) => {
        const s = T.out + i * 0.8 + hash(i + 50) * 0.5;
        const from = i % 2 ? PHONE : LAPTOP;
        return <Packet key={i} along={[{ x: from.x + 50, y: from.y }, { x: entry.x - 4, y: entry.y }]} time={t} start={s} end={s + 1.1} color={C.sky} size={6} trail={false} />;
      })}
      <Hotspot id="scale-out" interactive={interactive} onClick={onHotspot} active={t >= 97} x={POOL.x + POOL.w} y={POOL.y} time={t} label="Scale out">
        <Panel x={POOL.x} y={POOL.y} w={POOL.w} h={POOL.h} title="Pool of resources" color={C.violet} tint={0.05} opacity={progress(t, 93, 94)} />
      </Hotspot>
      {POOL_SERVERS.map((p, i) => {
        const killed = i === 2 && t >= POOL_KILL;
        return (
          <g key={i}>
            <Node kind="web" label={`web-${i + 1}`} x={p.x} y={p.y} size={96} time={t} appear={progress(t, POOL_AT[i], POOL_AT[i] + 0.8)}
              state={killed ? 'down' : 'idle'} load={killed ? undefined : Math.min(0.95, traffic / Math.max(1, alive) / 1.2)} />
            {i > 0 && <Sparkles x={p.x} y={p.y} t={progress(t, POOL_AT[i], POOL_AT[i] + 1.2)} radius={70} seed={i + 9} />}
          </g>
        );
      })}
      <Explosion x={POOL_SERVERS[2].x} y={POOL_SERVERS[2].y} t={progress(t, POOL_KILL, POOL_KILL + 1.2)} size={110} />
      <Appear p={progress(t, 99, 100) * (1 - progress(t, 106.5, 107))} from="up">
        <Chip x={620} y={610} text="+1 server = +capacity" color={C.emerald} filled />
      </Appear>
      {t >= 107 && <StatusBadge x={620} y={610} status="ok" text="One server down, site still up" time={t} />}

      <Callout x={880} y={140} width={350} title="Scale out" color={C.violet} size={15}
        text="Add more servers into your pool of resources. Need more? Add another."
        appear={fadeWindow(t, 95, 111, 0.5)} pointTo={{ x: POOL.x + POOL.w, y: 250 }} />
      <Callout x={880} y={330} width={350} title="Redundancy" color={C.emerald} size={15}
        text="When one server dies, the others keep serving."
        appear={fadeWindow(t, 108, 111, 0.4)} />
      {compare > 0 && (
        <Appear p={compare} from="right">
          <Panel x={870} y={130} w={370} h={210} title="Scale up" color={C.cyan} tint={0.05} />
          {[
            ['Simple: still one box', true],
            ['Hard limit on CPU and RAM', false],
            ['No failover or redundancy', false],
          ].map(([txt, ok], i) => (
            <g key={String(txt)}>
              {ok ? <CheckMark x={905} y={196 + i * 44} t={progress(t, 112.5 + i * 0.5, 113 + i * 0.5)} size={26} />
                : <CrossMark x={905} y={196 + i * 44} t={progress(t, 112.5 + i * 0.5, 113 + i * 0.5)} size={26} />}
              <text x={930} y={202 + i * 44} fill={C.text} fontSize={17} fontWeight={600}>{String(txt)}</text>
            </g>
          ))}
          <Panel x={870} y={370} w={370} h={210} title="Scale out" color={C.violet} tint={0.05} />
          {['More servers whenever you need', 'One dies, the rest keep going', 'Preferred for large-scale apps'].map((txt, i) => (
            <g key={txt} opacity={progress(t, 118 + i * 0.6, 118.6 + i * 0.6)}>
              <CheckMark x={905} y={436 + i * 44} t={progress(t, 118 + i * 0.6, 118.8 + i * 0.6)} size={26} />
              <text x={930} y={442 + i * 44} fill={C.text} fontSize={17} fontWeight={600}>{txt}</text>
            </g>
          ))}
        </Appear>
      )}
    </g>
  );
}

/* ----------------------- Chapter 5: direct connection --------------------- */
const S1: Pt = { x: 700, y: 280 };
const S2: Pt = { x: 700, y: 480 };
const DOWN_AT = 135;
const BACK_AT = 145;
const LB_GHOST: Pt = { x: 420, y: 400 };

function DirectPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.direct, T.end + 1, 0.6);
  if (vis <= 0) return null;
  const down = between(t, DOWN_AT, BACK_AT);
  const flood = between(t, BACK_AT + 0.5, 156);
  const s1Load = flood ? tween(t, BACK_AT + 0.5, 149, 0.4, 1.35) : down ? 0 : 0.45;
  const s1State = down ? 'down' : s1Load > 1 ? 'overloaded' : 'idle';
  const ghost = progress(t, 156, 157.5);
  return (
    <g opacity={vis}>
      <Title text="Users connect straight to one server" y={60} size={28} appear={progress(t, T.direct, T.direct + 1)} color={C.amber} />
      <Node kind="client" label="Web" x={LAPTOP.x + 20} y={260} size={84} time={t} />
      <Node kind="mobile" label="Mobile" x={PHONE.x + 20} y={480} size={84} time={t} />
      <Appear p={progress(t, 130, 131)} from="down">
        <Chip x={420} y={150} text="DNS: api.pixelpost.com → 15.125.23.214" color={C.cyan} size={15} />
      </Appear>
      {[{ x: LAPTOP.x + 20, y: 260 }, { x: PHONE.x + 20, y: 480 }].map((c, k) => (
        <Link key={k} from={c} to={S1} inset={58} color={down ? C.rose : flood ? C.amber : C.sky} animated={!down} time={t} state={down ? 'down' : flood ? 'hot' : 'ok'} />
      ))}
      {Array.from({ length: 70 }, (_, i) => {
        const dense = i >= 30;
        const s = dense ? BACK_AT + 0.5 + (i - 30) * 0.25 : T.direct + 1 + i * 0.6;
        const from = i % 2 ? { x: PHONE.x + 20, y: 480 } : { x: LAPTOP.x + 20, y: 260 };
        const failing = between(s, DOWN_AT, BACK_AT);
        return (
          <Packet key={i} along={linkPath(from, S1, 0, 58)} time={t} start={s} end={s + (dense ? 1.8 : 1.1)}
            color={failing ? C.rose : dense ? C.amber : C.sky} size={6} trail={false} />
        );
      })}
      <Hotspot id="direct-connection" interactive={interactive} onClick={onHotspot} active={t >= 128} x={S1.x + 56} y={S1.y - 56} time={t} label="Direct connection">
        <Node kind="web" label="Server 1" sublabel="15.125.23.214" x={S1.x} y={S1.y} size={100} time={t} state={s1State} load={down ? undefined : s1Load}
          appear={progress(t, T.direct, T.direct + 0.8)} />
      </Hotspot>
      <Node kind="web" label="Server 2" sublabel="15.125.23.215 · idle" x={S2.x} y={S2.y} size={100} time={t} load={0.02}
        appear={progress(t, 128, 129)} />
      <Explosion x={S1.x} y={S1.y} t={progress(t, DOWN_AT, DOWN_AT + 1.2)} size={120} />
      <CrossMark x={S1.x - 90} y={S1.y} t={progress(t, DOWN_AT + 1, DOWN_AT + 2) * (down ? 1 : 0)} size={44} />
      <Smoke x={S1.x} y={S1.y - 40} time={t} intensity={down ? 0.7 : flood ? 0.4 : 0} seed={7} />
      <Callout x={880} y={160} width={350} title="Server offline = site offline" color={C.rose} size={15}
        text="Users only know Server 1's IP. When it goes down, they cannot reach the website at all."
        appear={fadeWindow(t, DOWN_AT + 0.5, BACK_AT, 0.4)} pointTo={{ x: S1.x + 55, y: S1.y }} />
      <Callout x={880} y={430} width={350} title="Nobody talks to Server 2" color={C.amber} size={15}
        text="A spare server does not help while users connect directly to the first one."
        appear={fadeWindow(t, 140, BACK_AT, 0.4)} pointTo={{ x: S2.x + 55, y: S2.y }} />
      <Callout x={880} y={160} width={350} title="Overloaded = slow or failing" color={C.amber} size={15}
        text="Too many users at once push the server past its load limit: slower responses, or no connection."
        appear={fadeWindow(t, BACK_AT + 1, 155.5, 0.4)} pointTo={{ x: S1.x + 55, y: S1.y }} />
      <StatusBadge x={700} y={612} time={t} status={down ? 'down' : flood ? 'warn' : 'ok'}
        text={down ? 'Cannot connect' : flood ? 'p95 3.8 s · timeouts' : 'Connected'} />
      {ghost > 0 && (
        <g>
          <Node kind="lb" label="Load balancer?" x={LB_GHOST.x} y={LB_GHOST.y} size={96} time={t} state="ghost" appear={ghost} />
          <Label x={LB_GHOST.x} y={LB_GHOST.y + 8} text="?" size={40} color={C.violet} anchor="middle" weight={900} opacity={ghost * (0.6 + 0.4 * pulse(t, 0.8))} />
        </g>
      )}
      <Character who="ravi" mood="happy" x={1170} y={470} size={130} time={t} talking={between(t, 156, 162)} appear={fadeWindow(t, 155.5, T.end + 2, 0.5)}
        say="Put something in front that spreads the traffic: a load balancer." bubble="left" />
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const intro = t < 7 ? progress(t, 0.3, 1.3) * (1 - progress(t, 5.5, 6.5)) : 0;
  return (
    <Stage time={t} drift title="Level 3 lesson: vertical vs horizontal scaling">
      <Counter x={1140} y={50} value={10000} time={t} bump={between(t, 0, 4) || t > 160} />
      <OneServerPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <ScaleOutPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <DirectPart time={t} interactive={interactive} onHotspot={onHotspot} />
      {intro > 0 && (
        <g>
          <rect width={1280} height={720} fill={C.bg} opacity={0.75 * intro} />
          <Title text="Bigger or More?" kicker="LEVEL 3 · 10K USERS" subtitle="Scale up, or scale out?" y={330} appear={intro} />
          <g opacity={intro * (0.6 + 0.4 * pulse(t, 0.6))}>
            <StatusBadge x={640} y={450} status="down" text="Pager: web-1 CPU 98%" time={t} />
          </g>
        </g>
      )}
      <Sparkles x={1140} y={50} t={progress(t, 161, 162.5)} seed={11} />
    </Stage>
  );
}
