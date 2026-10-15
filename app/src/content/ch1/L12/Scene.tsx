import type { ComponentKind, LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, Counter, CrossMark, Explosion, Hotspot, Label, Link, MONO, Meter, Node, Packet,
  Panel, Smoke, Sparkles, Stage, StatusBadge, Title, between, clamp, ease, fadeWindow, lerp, linkPath, progress, pulse, stagger,
  tween, type Pt,
} from '@/scenekit';
import { CELEBS, KEY_SCENARIOS, USERS, shardOf } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  vertical: 15,
  sharding: 58,
  key: 98,
  reshard: 128,
  celeb: 147,
  joins: 166,
  fig: 176,
  end: 190,
} as const;

type PartProps = { time: number; interactive: boolean; onHotspot?: (id: string) => void };
const SHARD_COLORS = [C.cyan, C.violet, C.emerald, C.amber, C.rose];

/** Simple bar histogram; (x, y) = bottom-left corner. */
function Bars({ x, y, w, h, dist, p = 1, color, title }: { x: number; y: number; w: number; h: number; dist: number[]; p?: number; color: string; title: string }) {
  const bw = w / dist.length;
  const hi = Math.max(...dist);
  return (
    <g opacity={clamp(p * 3)}>
      <Label x={x} y={y - h - 20} text={title} anchor="start" size={17} weight={800} color={color} mono />
      <line x1={x - 6} y1={y} x2={x + w + 6} y2={y} stroke={C.line} strokeWidth={2} />
      {dist.map((d, i) => {
        const bh = (d / hi) * h * ease.outCubic(clamp(p));
        const hot = d === hi && hi > 0.4;
        return (
          <g key={i}>
            <rect x={x + i * bw + 8} y={y - bh} width={bw - 16} height={bh} rx={8} fill={hot ? C.rose : color} opacity={0.85} filter={hot ? 'url(#sk-glow)' : undefined} />
            <text x={x + i * bw + bw / 2} y={y + 22} textAnchor="middle" fill={C.dim} fontSize={13}>
              shard {i}
            </text>
            <text x={x + i * bw + bw / 2} y={y - bh - 8} textAnchor="middle" fill={C.text} fontSize={13} fontWeight={700} opacity={p >= 1 ? 1 : 0}>
              {Math.round(d * 100)}%
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------ Intro + vertical ------------------------------ */
function VerticalPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, 0, T.sharding + 0.4, 0.5);
  if (vis <= 0) return null;
  const grow = tween(t, 16, 26, 120, 210, ease.outBack);
  const disk = t < 15 ? 0.9 + 0.06 * progress(t, 1, 14) : 0.96;
  const so = fadeWindow(t, 30, 41, 0.5);
  const cons = progress(t, 41, 42);
  const spofHit = between(t, 51.5, 55.5);
  const cost = Math.round(tween(t, 55, 57.5, 8, 96, ease.outCubic));
  const db: Pt = { x: 360, y: 370 };
  return (
    <g opacity={vis}>
      <Node kind="db" x={db.x} y={db.y} size={t < 15 ? 140 : grow} label="Master DB" time={t} appear={progress(t, 0.3, 1)}
        state={spofHit ? 'down' : t < 15 ? 'busy' : between(t, 41, 51) ? 'overloaded' : 'active'} />
      <Explosion x={db.x} y={db.y} t={progress(t, 51.5, 52.6)} size={170} />
      <Smoke x={db.x} y={db.y - 100} time={t} intensity={t < 15 ? 0.6 : 0} seed={4} />
      <Meter x={db.x - 120} y={600} w={240} value={t < 15 ? disk : between(t, 41, 51) ? 0.85 + 0.15 * progress(t, 41, 46) : 0.4} label={t < 15 ? 'Disk used' : 'Capacity used'} />
      <Character who="pager" mood="worried" x={1080} y={360} size={130} time={t} talking={between(t, 1, 8)} appear={fadeWindow(t, 0.5, 14, 0.4)}
        say="db-master disk 95%... 96%... growing every day." bubble="left" />
      {['+CPU', '+RAM', '+DISK'].map((s, i) => {
        const a = stagger(i, 16.5, 1.2);
        const p = progress(t, a, a + 1.4, ease.inOutCubic);
        return p > 0 && p < 1 ? <Chip key={s} x={lerp(760, db.x, p)} y={lerp(200 + i * 120, db.y, p)} text={s} color={C.emerald} filled size={18} /> : null;
      })}
      <Title text="Vertical scaling (scale up)" subtitle="More power for the same machine" y={70} size={30} appear={progress(t, 15, 16)} color={C.emerald} />
      <Chip x={db.x} y={160} text="Amazon RDS: up to 24 TB of RAM" color={C.amber} filled size={18} appear={fadeWindow(t, 20.5, 41, 0.4)} />
      {so > 0 && (
        <g opacity={so}>
          <Panel x={700} y={170} w={500} h={340} title="stackoverflow.com · 2013" color={C.orange} />
          <text x={950} y={300} textAnchor="middle" fill={C.orange} fontSize={84} fontWeight={900}>{`${Math.round(tween(t, 31, 34, 0, 10))}M+`}</text>
          <text x={950} y={340} textAnchor="middle" fill={C.text} fontSize={20} fontWeight={600}>monthly unique visitors</text>
          <Node kind="db" x={880} y={430} size={70} label="" time={t} appear={progress(t, 36, 37)} state="active" />
          <text x={930} y={440} fill={C.white} fontSize={24} fontWeight={800} opacity={progress(t, 36.5, 37.5)}>only 1 master DB</text>
        </g>
      )}
      {cons > 0 && (
        <Hotspot id="vertical-limits" interactive={interactive} onClick={onHotspot} active={t >= 42} x={1200} y={170} time={t} label="Vertical scaling drawbacks">
          <g opacity={cons}>
            <Panel x={700} y={170} w={500} h={380} title="Serious drawbacks" color={C.rose} tint={0.05} />
            {[
              { at: 42, title: 'Hardware limits', text: 'A single server is not enough for a large user base.' },
              { at: 51, title: 'Single point of failure', text: 'One box down = the whole data tier down.' },
              { at: 55, title: 'High cost', text: `Powerful servers are much more expensive: $${cost}K/month` },
            ].map((r, i) => (
              <Appear key={r.title} p={progress(t, r.at, r.at + 0.7)} from="left">
                <CrossMark x={740} y={250 + i * 105} t={progress(t, r.at + 0.3, r.at + 1)} size={34} />
                <text x={775} y={245 + i * 105} fill={C.white} fontSize={22} fontWeight={800}>{r.title}</text>
                <text x={775} y={272 + i * 105} fill={C.dim} fontSize={15}>{r.text}</text>
              </Appear>
            ))}
          </g>
        </Hotspot>
      )}
      {between(t, 43, 51) && (
        <g>
          <line x1={db.x - 150} y1={250} x2={db.x + 150} y2={250} stroke={C.rose} strokeWidth={5} strokeDasharray="12 8" />
          <Label x={db.x} y={238} text="hardware ceiling" size={15} color={C.rose} weight={800} />
        </g>
      )}
    </g>
  );
}

/* --------------------------------- Sharding --------------------------------- */
const SH_X = [220, 500, 780, 1060];
const SH_Y = 420;
const HASH: Pt = { x: 640, y: 175 };
const FLY = [8, 13, 2, 1003, 7];

function ShardingPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.sharding, T.key + 0.4, 0.5);
  if (vis <= 0) return null;
  const split = progress(t, 63, 67, ease.inOutCubic);
  const schema = between(t, 68, 73);
  const hashOn = progress(t, 78, 79);
  return (
    <g opacity={vis}>
      <Title text="Horizontal scaling = sharding" subtitle="Add more servers, each holding part of the data" y={62} size={30} appear={progress(t, T.sharding, T.sharding + 1)} color={C.cyan} />
      {split < 1 && <Node kind="db" x={640} y={lerp(300, SH_Y, split)} size={lerp(180, 100, split)} label="One big DB" time={t} appear={progress(t, 58.5, 59.3)} state="busy" />}
      {SH_X.map((x, k) => {
        const pos = { x: lerp(640, x, split), y: SH_Y };
        const rows = USERS.filter((u) => shardOf(u.id, 4) === k);
        return (
          <g key={k} opacity={split}>
            <Node kind="shard" x={pos.x} y={pos.y} size={100} label={`Shard ${k}`} color={SHARD_COLORS[k]} time={t}
              state={hashOn > 0 && FLY.some((id, i) => shardOf(id, 4) === k && between(t, 81.6 + i * 3.2, 83 + i * 3.2)) ? 'active' : 'idle'} />
            <g transform={`translate(${pos.x - 90} ${SH_Y + 70})`}>
              <rect width={180} height={30} rx={8} fill={schema ? `${C.amber}33` : C.panel2} stroke={schema ? C.amber : C.line} />
              <text x={90} y={20} textAnchor="middle" fill={schema ? C.amber : C.text} fontSize={13} fontFamily={MONO}>users(user_id, name)</text>
              {rows.map((u, i) => (
                <g key={u.id} opacity={progress(t, 73 + i * 0.4 + k * 0.2, 73.6 + i * 0.4 + k * 0.2)}>
                  <rect y={36 + i * 26} width={180} height={22} rx={6} fill={`${SHARD_COLORS[k]}1c`} />
                  <text x={14} y={52 + i * 26} fill={SHARD_COLORS[k]} fontSize={13} fontFamily={MONO}>{u.id}</text>
                  <text x={70} y={52 + i * 26} fill={C.text} fontSize={13} fontFamily={MONO}>{u.name}</text>
                </g>
              ))}
            </g>
          </g>
        );
      })}
      <Chip x={640} y={150} text="same schema · unique data" color={C.amber} size={18} appear={fadeWindow(t, 68.5, 78, 0.4)} />
      {hashOn > 0 && (
        <Hotspot id="hash-fn" interactive={interactive} onClick={onHotspot} active={t >= 80} x={HASH.x + 130} y={HASH.y - 40} time={t} label="Hash function">
          <Appear p={hashOn} from="pop" x={HASH.x} y={HASH.y}>
            <rect x={HASH.x - 130} y={HASH.y - 34} width={260} height={68} rx={20} fill={C.panel} stroke={C.cyan} strokeWidth={3} filter="url(#sk-glow)" />
            <text x={HASH.x} y={HASH.y + 10} textAnchor="middle" fill={C.cyan} fontSize={28} fontWeight={900} fontFamily={MONO}>user_id % 4</text>
          </Appear>
        </Hotspot>
      )}
      {FLY.map((id, i) => {
        const s = 80 + i * 3.2;
        const k = shardOf(id, 4);
        const from = { x: HASH.x, y: HASH.y + 34 };
        const to = { x: SH_X[k], y: SH_Y - 52 };
        return (
          <g key={id}>
            <Chip x={HASH.x - 230} y={HASH.y} text={`user ${id}`} color={C.white} size={16} appear={fadeWindow(t, s - 0.6, s + 0.4, 0.2)} />
            <Packet along={[from, to]} time={t} start={s + 0.3} end={s + 1.6} color={SHARD_COLORS[k]} label={`${id} % 4 = ${k}`} size={9} />
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------- Sharding key ------------------------------- */
function KeyPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.key, T.reshard + 0.4, 0.5);
  if (vis <= 0) return null;
  const sc = KEY_SCENARIOS[0];
  const even = sc.options.find((o) => o.id === 'user_id');
  const skew = sc.options.find((o) => o.id === 'country');
  const rows = USERS.slice(0, 6);
  const queryAt = 109;
  return (
    <g opacity={vis}>
      <Title text="The sharding key" subtitle="a.k.a. partition key: the column(s) that decide where data lives" y={62} size={30} appear={progress(t, T.key, T.key + 1)} color={C.amber} />
      <Hotspot id="shard-key" interactive={interactive} onClick={onHotspot} active={t >= 103} x={480} y={150} time={t} label="Sharding key">
        <Appear p={progress(t, 100, 101)} from="left">
          <rect x={80} y={150} width={400} height={300} rx={20} fill={C.panel} stroke={C.line} />
          <rect x={92} y={162} width={150} height={276} rx={12} fill={`${C.amber}22`} stroke={C.amber} strokeWidth={2.5} opacity={0.5 + 0.5 * pulse(t, 1.2)} />
          <text x={167} y={192} textAnchor="middle" fill={C.amber} fontSize={17} fontWeight={800} fontFamily={MONO}>user_id 🔑</text>
          <text x={340} y={192} textAnchor="middle" fill={C.text} fontSize={17} fontWeight={800} fontFamily={MONO}>name</text>
          {rows.map((u, i) => (
            <g key={u.id}>
              <text x={167} y={232 + i * 35} textAnchor="middle" fill={C.white} fontSize={16} fontFamily={MONO}>{u.id}</text>
              <text x={340} y={232 + i * 35} textAnchor="middle" fill={C.text} fontSize={16} fontFamily={MONO}>{u.name}</text>
            </g>
          ))}
        </Appear>
      </Hotspot>
      {/* query routing */}
      <Appear p={progress(t, queryAt - 1, queryAt)} from="up">
        <rect x={80} y={480} width={400} height={50} rx={14} fill={C.panel2} />
        <text x={100} y={512} fill={C.emerald} fontSize={16} fontFamily={MONO}>SELECT * FROM users WHERE user_id=7</text>
        <Packet along={[{ x: 280, y: 540 }, { x: 280, y: 610 }]} time={t} start={queryAt + 0.5} end={queryAt + 2} color={C.emerald} label="7 % 4 = 3" />
        <Chip x={280} y={640} text="→ shard 3 only" color={C.emerald} filled appear={progress(t, queryAt + 2, queryAt + 2.5)} />
      </Appear>
      {even && <Bars x={600} y={330} w={560} h={130} dist={even.dist} p={progress(t, 118, 120)} color={C.emerald} title="key: user_id % 4" />}
      <CheckMark x={1200} y={200} t={progress(t, 120, 121)} size={40} />
      {skew && <Bars x={600} y={600} w={560} h={130} dist={skew.dist} p={progress(t, 123, 125)} color={C.violet} title="key: country" />}
      <CrossMark x={1200} y={470} t={progress(t, 125, 126)} size={40} />
      <Callout x={850} y={110} width={360} title="Pick an even key" color={C.amber} size={14} text="One of the most important criteria: data must spread evenly." appear={fadeWindow(t, 113, 118.5, 0.4)} />
    </g>
  );
}

/* -------------------------------- Resharding -------------------------------- */
function ReshardPart({ time: t }: PartProps) {
  const vis = fadeWindow(t, T.reshard, T.celeb + 0.4, 0.5);
  if (vis <= 0) return null;
  const fills = [0.55, 0.62, 0.58, 0.7].map((f, i) => clamp(f + progress(t, 130, 141) * (i === 3 ? 0.3 : 0.18)));
  const n5 = progress(t, 142, 143);
  const xs = (k: number) => lerp(260 + k * 250, 200 + k * 220, n5);
  return (
    <g opacity={vis}>
      <Title text="Challenge 1 · Resharding data" y={62} size={30} appear={progress(t, T.reshard, T.reshard + 1)} color={C.rose} />
      <g transform="translate(640 150)">
        <rect x={-150} y={-32} width={300} height={64} rx={18} fill={C.panel} stroke={n5 > 0 ? C.amber : C.cyan} strokeWidth={3} />
        <text y={10} textAnchor="middle" fill={n5 > 0 ? C.amber : C.cyan} fontSize={28} fontWeight={900} fontFamily={MONO}>
          {n5 > 0 ? 'user_id % 5' : 'user_id % 4'}
        </text>
      </g>
      {[0, 1, 2, 3, 4].map((k) => {
        if (k === 4 && n5 <= 0) return null;
        const full = k < 4 ? fills[k] * (n5 > 0 ? 1 - 0.25 * n5 : 1) : 0.6 * progress(t, 143, 146);
        const exhausted = k === 3 && between(t, 138, 143);
        return (
          <g key={k}>
            <Node kind="shard" x={xs(k)} y={360} size={100} label={`Shard ${k}`} color={SHARD_COLORS[k]} time={t} appear={k === 4 ? n5 : progress(t, 128.5 + k * 0.2, 129.2 + k * 0.2)}
              state={exhausted ? 'overloaded' : 'idle'} />
            <Meter x={xs(k) - 70} y={460} w={140} value={full} label="disk" />
          </g>
        );
      })}
      <g opacity={fadeWindow(t, 138, 143, 0.3)}>
        <StatusBadge x={xs(3)} y={540} status="down" text="shard exhaustion" time={t} />
      </g>
      {n5 > 0 &&
        Array.from({ length: 8 }, (_, i) => {
          const a = 143 + i * 0.4;
          const from = { x: xs(i % 4), y: 300 };
          const to = { x: xs((i + 1) % 5), y: 300 };
          return <Packet key={i} along={linkPath(from, to, -60, 0)} time={t} start={a} end={a + 1.2} color={C.amber} size={7} shape="envelope" />;
        })}
      <Callout x={330} y={570} width={620} title="Why it hurts" color={C.rose} size={15}
        text="A shard is full from rapid growth, or fills early because data is uneven. Update the sharding function and move data around."
        appear={fadeWindow(t, 133, 142, 0.4)} />
      <Chip x={640} y={620} text="Consistent hashing (Chapter 5) eases this" color={C.violet} size={17} appear={progress(t, 144, 144.6)} />
    </g>
  );
}

/* ------------------------------ Celebrity problem ------------------------------ */
function CelebPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.celeb, T.joins + 0.4, 0.5);
  if (vis <= 0) return null;
  const fix = progress(t, 157, 159, ease.inOutCubic);
  const melt = between(t, 152, 158);
  const ded = (i: number): Pt => ({ x: 760 + i * 180, y: 470 });
  return (
    <g opacity={vis}>
      <Title text="Challenge 2 · Celebrity (hotspot key) problem" y={62} size={30} appear={progress(t, T.celeb, T.celeb + 1)} color={C.amber} />
      {SH_X.map((x, k) => (
        <Node key={k} kind="shard" x={x} y={260} size={100} label={`Shard ${k}`} color={SHARD_COLORS[k]} time={t}
          appear={progress(t, 147.5 + k * 0.2, 148.2 + k * 0.2)} state={k === 1 && melt ? 'overloaded' : 'idle'} load={k === 1 ? (melt ? 1.4 : fix > 0 ? 0.35 : 0.4) : 0.3} />
      ))}
      <Smoke x={SH_X[1]} y={200} time={t} intensity={melt ? 1 : 0} seed={9} />
      {melt &&
        Array.from({ length: 22 }, (_, i) => {
          const s = 152 + i * 0.25;
          const from = { x: 80 + (i % 6) * 40, y: 680 };
          return <Packet key={i} along={[from, { x: SH_X[1], y: 310 }]} time={t} start={s} end={s + 0.9} color={C.rose} size={5} trail={false} />;
        })}
      {CELEBS.map((c, i) => {
        const start = { x: 160 + i * 150, y: 600 };
        const onShard = { x: SH_X[1] - 95 + i * 95, y: 350 + (i % 2) * 40 };
        const p = progress(t, 150 + i * 0.6, 151.5 + i * 0.6, ease.inOutCubic);
        const pos = fix > 0 ? { x: lerp(onShard.x, ded(i).x, fix), y: lerp(onShard.y, ded(i).y - 75, fix) } : { x: lerp(start.x, onShard.x, p), y: lerp(start.y, onShard.y, p) };
        return (
          <g key={c.id} opacity={progress(t, 148.5 + i * 0.3, 149 + i * 0.3)}>
            <circle cx={pos.x} cy={pos.y} r={22} fill={C.amber} stroke={C.white} strokeWidth={2} />
            <text x={pos.x} y={pos.y + 6} textAnchor="middle" fill={C.bg} fontSize={16} fontWeight={900}>★</text>
            <text x={pos.x} y={pos.y + 42} textAnchor="middle" fill={C.white} fontSize={13} fontWeight={700}>{c.name}</text>
          </g>
        );
      })}
      {fix > 0 && (
        <Hotspot id="celebrity" interactive={interactive} onClick={onHotspot} active={t >= 158} x={1180} y={360} time={t} label="Celebrity shards">
          <g opacity={fix}>
            <Panel x={670} y={360} w={540} h={230} title="A dedicated shard per celebrity" color={C.emerald} tint={0.05} />
            {CELEBS.map((c, i) =>
              i === 0 && t >= 162 ? null : (
                <Node key={c.id} kind="shard" x={ded(i).x} y={ded(i).y + 20} size={80} label={`${c.name.split(' ')[1]} shard`} color={C.emerald} time={t} state="active" />
              ),
            )}
            <g opacity={progress(t, 162, 163)}>
              <Node kind="shard" x={ded(0).x - 32} y={ded(0).y + 20} size={56} label="" color={C.sky} time={t} state="active" />
              <Node kind="shard" x={ded(0).x + 32} y={ded(0).y + 20} size={56} label="" color={C.sky} time={t} state="active" />
              <Label x={ded(0).x} y={ded(0).y + 76} text="Perry: split again" size={14} color={C.sky} weight={700} />
            </g>
          </g>
        </Hotspot>
      )}
      <Callout x={40} y={500} width={420} title="17 % 4 = 25 % 4 = 33 % 4 = 1" color={C.rose} size={15}
        text="All three stars hash to shard 1. Their fans' reads overwhelm it." appear={fadeWindow(t, 152.5, 158, 0.4)} pointTo={{ x: SH_X[1], y: 320 }} />
    </g>
  );
}

/* --------------------------- Joins & de-normalization --------------------------- */
function JoinsPart({ time: t }: PartProps) {
  const vis = fadeWindow(t, T.joins, T.fig + 0.4, 0.5);
  if (vis <= 0) return null;
  const denorm = progress(t, 171, 172.5);
  return (
    <g opacity={vis}>
      <Title text="Challenge 3 · Joins & de-normalization" y={62} size={30} appear={progress(t, T.joins, T.joins + 1)} color={C.violet} />
      <g opacity={1 - 0.6 * denorm}>
        <Node kind="shard" x={250} y={260} size={90} label="Shard 0 · users" color={C.cyan} time={t} appear={progress(t, 166.5, 167.2)} />
        <Node kind="shard" x={250} y={500} size={90} label="Shard 2 · photos" color={C.emerald} time={t} appear={progress(t, 166.8, 167.5)} />
        <Link from={{ x: 250, y: 260 }} to={{ x: 250, y: 500 }} inset={60} color={C.rose} dashed label="JOIN?" draw={progress(t, 167.5, 168.5)} />
        <CrossMark x={330} y={380} t={progress(t, 168.5, 169.5)} size={44} />
      </g>
      <Appear p={denorm} from="right">
        <rect x={520} y={220} width={660} height={260} rx={22} fill={C.panel} stroke={C.violet} strokeWidth={2} />
        <text x={545} y={258} fill={C.violet} fontSize={18} fontWeight={800} fontFamily={MONO}>photos (de-normalized)</text>
        {[
          ['photo_id', 'owner_id', 'owner_name', 'title'],
          ['101', '0', 'maya', 'launch.jpg'],
          ['102', '2', 'mom', 'cat.jpg'],
          ['103', '2', 'mom', 'cat-again.jpg'],
        ].map((r, i) => (
          <g key={i}>
            {r.map((cell, j) => (
              <text key={j} x={545 + j * 155} y={300 + i * 40} fill={i === 0 ? C.dim : j === 2 ? C.amber : C.text} fontSize={16} fontFamily={MONO} fontWeight={i === 0 ? 700 : 400}>
                {cell}
              </text>
            ))}
          </g>
        ))}
        <CheckMark x={1130} y={440} t={progress(t, 172.5, 173.5)} size={40} />
      </Appear>
      <Callout x={520} y={520} width={660} title="Answer from one table" color={C.amber} size={15}
        text="Copy the owner's name into the photos table, so a query can be answered inside a single shard." appear={fadeWindow(t, 172, T.fig, 0.4)} />
    </g>
  );
}

/* -------------------------------- Figure 1-23 -------------------------------- */
const F: Record<string, Pt> = {
  client: { x: 90, y: 270 }, mobile: { x: 90, y: 450 }, dns: { x: 260, y: 110 }, cdn: { x: 260, y: 610 },
  lb: { x: 420, y: 360 }, web1: { x: 570, y: 270 }, web2: { x: 570, y: 450 }, cache: { x: 730, y: 190 },
  nosql: { x: 730, y: 360 }, queue: { x: 730, y: 530 },
  s0: { x: 920, y: 220 }, s1: { x: 1070, y: 220 }, s2: { x: 920, y: 380 }, s3: { x: 1070, y: 380 },
  worker: { x: 900, y: 590 }, tools: { x: 1090, y: 590 },
};
const FK: Record<string, ComponentKind> = {
  client: 'client', mobile: 'mobile', dns: 'dns', cdn: 'cdn', lb: 'lb', web1: 'web', web2: 'web', cache: 'cache', nosql: 'nosql',
  queue: 'queue', s0: 'shard', s1: 'shard', s2: 'shard', s3: 'shard', worker: 'worker', tools: 'metrics',
};
const FL: Record<string, string> = {
  client: 'Web', mobile: 'Mobile', dns: 'DNS', cdn: 'CDN', lb: 'Load balancer', web1: 'Web 1', web2: 'Web 2', cache: 'Cache', nosql: 'NoSQL',
  queue: 'Queue', s0: 'Shard 0', s1: 'Shard 1', s2: 'Shard 2', s3: 'Shard 3', worker: 'Workers', tools: 'Logs · metrics · CI',
};
const FE: [string, string][] = [
  ['client', 'dns'], ['mobile', 'dns'], ['client', 'cdn'], ['mobile', 'cdn'], ['client', 'lb'], ['mobile', 'lb'], ['lb', 'web1'], ['lb', 'web2'],
  ['web1', 'cache'], ['web1', 'nosql'], ['web2', 'nosql'], ['web2', 'queue'], ['queue', 'worker'], ['nosql', 's2'], ['cache', 's0'],
];

function FigPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.fig, T.end + 1, 0.5);
  if (vis <= 0) return null;
  const ids = Object.keys(F);
  const ap = (id: string) => progress(t, 176.5 + ids.indexOf(id) * 0.18, 177.1 + ids.indexOf(id) * 0.18);
  const nosqlHi = between(t, 181, 186);
  return (
    <g opacity={vis}>
      <Label x={640} y={50} text="Figure 1-23 · sharded databases + NoSQL" size={22} weight={800} color={C.white} opacity={progress(t, 176, 177)} />
      <Hotspot id="fig-1-23" interactive={interactive} onClick={onHotspot} active={t >= 178} x={1150} y={140} time={t} label="Figure 1-23">
        <Panel x={840} y={140} w={310} h={320} title="Databases (sharded)" color={C.cyan} dashed opacity={progress(t, 177, 178)} />
      </Hotspot>
      {FE.map(([a, b], i) => (
        <Link key={i} from={F[a]} to={F[b]} inset={42} color={C.line} draw={Math.min(ap(a), ap(b))} animated={t > 179} time={t} state={nosqlHi && (a === 'nosql' || b === 'nosql') ? 'hot' : 'ok'} />
      ))}
      {ids.map((id) => (
        <Node key={id} kind={FK[id]} x={F[id].x} y={F[id].y} size={74} label={FL[id]} time={t} appear={ap(id)}
          color={id.startsWith('s') && id.length === 2 ? SHARD_COLORS[Number(id[1])] : undefined} state={nosqlHi && id === 'nosql' ? 'active' : 'idle'} />
      ))}
      <Callout x={330} y={620} width={430} title="NoSQL takes some load" color={C.orange} size={14} text="Non-relational features move to a NoSQL store." appear={fadeWindow(t, 181, 186, 0.4)} pointTo={{ x: F.nosql.x, y: F.nosql.y + 50 }} />
      <Character who="maya" mood="happy" x={1200} y={640} size={90} time={t} talking={between(t, 186, 189)} appear={progress(t, 185.5, 186.2)} say="8 million! Next stop: launch night." bubble="left" />
      <Counter x={1140} y={50} value={8_000_000} time={t} bump={t > 186} />
      <Sparkles x={1140} y={50} t={progress(t, 186, 187.5)} />
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const intro = t < 7 ? progress(t, 0.2, 1) * (1 - progress(t, 5.2, 6.2)) : 0;
  const props = { time: t, interactive, onHotspot };
  return (
    <Stage time={t} drift title="Level 12 lesson: database scaling and sharding">
      {t < T.fig && <Counter x={1140} y={50} value={8_000_000} time={t} bump={between(t, 0, 3)} />}
      <VerticalPart {...props} />
      <ShardingPart {...props} />
      <KeyPart {...props} />
      <ReshardPart {...props} />
      <CelebPart {...props} />
      <JoinsPart {...props} />
      <FigPart {...props} />
      {intro > 0 && (
        <g>
          <rect width={1280} height={720} fill={C.bg} opacity={0.8 * intro} />
          <Title text="Divide and Conquer" kicker="LEVEL 12 · 8M USERS" subtitle="Scaling the data tier" y={330} appear={intro} color={C.cyan} />
          <g opacity={intro * (0.6 + 0.4 * pulse(t, 0.6))}>
            <StatusBadge x={640} y={450} status="warn" text="db-master disk 95%" time={t} />
          </g>
        </g>
      )}
    </Stage>
  );
}
