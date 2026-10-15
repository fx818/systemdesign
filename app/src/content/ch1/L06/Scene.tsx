import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, CodeBlock, Counter, CrossMark, Explosion, Hotspot, Label, Link, MONO, Meter, Node,
  Packet, Panel, Smoke, Sparkles, Stage, StatusBadge, Title, between, ease, fadeWindow, hash, linkPath, progress, pulse, tween,
  type Pt,
} from '@/scenekit';
import { MEMCACHED_CODE } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  tier: 18,
  flow: 44,
  api: 76,
  use: 94,
  ttl: 106,
  consistency: 120,
  spof: 134,
  evict: 150,
  end: 182,
} as const;

type HotspotHandler = ((id: string) => void) | undefined;
interface PartProps { time: number; interactive: boolean; onHotspot: HotspotHandler }

/* -------------------------- Chapters 1-3: the board ----------------------- */
const CLIENT: Pt = { x: 90, y: 400 };
const WEB: Pt = { x: 320, y: 400 };
const CACHE: Pt = { x: 640, y: 210 };
const DB: Pt = { x: 980, y: 480 };

function BoardPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, 0, T.api + 0.5, 0.6);
  if (vis <= 0) return null;
  const cacheIn = progress(t, T.tier + 1, T.tier + 2);
  const steady = t >= 66;
  const dbLoad = t < T.tier ? 0.93 : t < 66 ? 0.8 : tween(t, 66, 72, 0.8, 0.25);
  const hitRate = steady ? tween(t, 66, 72, 0.2, 0.9) : 0;
  const p95 = t < 66 ? 2400 : Math.round(tween(t, 66, 72, 2400, 120));
  const pe = (a: Pt, b: Pt, s: number, d: number, color: string, label?: string, key?: string) => (
    <Packet key={key} along={linkPath(a, b, 0, 56)} time={t} start={s} end={s + d} color={color} label={label} shape={label ? 'envelope' : 'dot'} size={label ? undefined : 6} trail={false} />
  );
  return (
    <g opacity={vis}>
      <Link from={CLIENT} to={WEB} inset={50} color={C.sky} animated time={t} />
      <Link from={WEB} to={DB} inset={56} color={C.emerald} animated time={t} label="SQL" />
      {cacheIn > 0 && <Link from={WEB} to={CACHE} inset={56} color={C.amber} animated time={t} draw={cacheIn} label="get / set" />}

      <Node kind="client" label="Users" x={CLIENT.x} y={CLIENT.y} size={80} time={t} appear={progress(t, 0.4, 1)} />
      <Node kind="web" label="Web servers" x={WEB.x} y={WEB.y} size={96} time={t} appear={progress(t, 0.6, 1.2)} />
      <Node kind="db" label="Database" x={DB.x} y={DB.y} size={104} time={t} appear={progress(t, 0.8, 1.4)}
        state={dbLoad > 0.9 ? 'overloaded' : dbLoad > 0.6 ? 'busy' : 'idle'} load={dbLoad} />
      <Hotspot id="cache-tier" interactive={interactive} onClick={onHotspot} active={between(t, 20, T.flow)} x={CACHE.x + 56} y={CACHE.y - 56} time={t} label="Cache tier">
        <Node kind="cache" label="Cache (in memory)" x={CACHE.x} y={CACHE.y} size={100} time={t} appear={cacheIn} state={t >= 44 ? 'active' : 'idle'} />
      </Hotspot>
      <Node kind="cache" label="Cache 2" x={CACHE.x + 140} y={CACHE.y} size={84} time={t} appear={progress(t, 39, 40) * (1 - progress(t, 43.2, 44))} />
      <Sparkles x={CACHE.x} y={CACHE.y} t={progress(t, T.tier + 1, T.tier + 2.3)} />

      {/* intro: every page = several DB calls */}
      {t < T.tier &&
        Array.from({ length: 10 }, (_, i) => {
          const s = 1.5 + i * 1.6;
          return (
            <g key={i}>
              {pe(CLIENT, WEB, s, 0.5, C.sky)}
              {[0, 1, 2].map((k) => pe(WEB, DB, s + 0.5 + k * 0.25, 0.8, C.emerald, undefined, `q${k}`))}
              {pe(DB, WEB, s + 1.6, 0.6, C.amber)}
            </g>
          );
        })}
      {between(t, 3, T.tier) && (
        <g>
          {['"feed takes forever" ★★', '"so slow 😩" ★', '"is it down?" ★★'].map((c, i) => (
            <Appear key={c} p={fadeWindow(t, 4 + i * 2.5, T.tier - 0.5)} from="up">
              <Chip x={180 + i * 220} y={200 + (i % 2) * 50} text={c} color={C.rose} size={14} />
            </Appear>
          ))}
        </g>
      )}

      {/* read-through: one miss, one hit */}
      {pe(CLIENT, WEB, 45, 1, C.sky, 'GET /photo/7', 'm0')}
      {pe(WEB, CACHE, 46.2, 1.3, C.amber, 'photo:7?', 'm1')}
      <CrossMark x={CACHE.x - 70} y={CACHE.y - 50} t={progress(t, 47.6, 48.3) * (t < 58 ? 1 : 0)} size={40} />
      {between(t, 47.6, 58) && <Label x={CACHE.x - 70} y={CACHE.y - 85} text="MISS" size={18} color={C.rose} anchor="middle" weight={900} />}
      {pe(WEB, DB, 49, 1.4, C.emerald, 'SELECT …', 'm2')}
      {pe(DB, WEB, 50.8, 1.4, C.emerald, 'row', 'm3')}
      {pe(WEB, CACHE, 52.6, 1.4, C.amber, 'set photo:7', 'm4')}
      {pe(WEB, CLIENT, 54.6, 1, C.sky, '200 OK', 'm5')}
      {pe(CLIENT, WEB, 59, 1, C.sky, 'GET /photo/7', 'h0')}
      {pe(WEB, CACHE, 60.2, 1.2, C.amber, 'photo:7?', 'h1')}
      <CheckMark x={CACHE.x - 70} y={CACHE.y - 50} t={progress(t, 61.4, 62) * (t < 66 ? 1 : 0)} size={40} />
      {between(t, 61.4, 66) && <Label x={CACHE.x - 70} y={CACHE.y - 85} text="HIT" size={18} color={C.emerald} anchor="middle" weight={900} />}
      {pe(CACHE, WEB, 62.1, 1, C.amber, 'cached!', 'h2')}
      {pe(WEB, CLIENT, 63.3, 0.9, C.sky, '200 OK', 'h3')}
      {steady &&
        Array.from({ length: 30 }, (_, i) => {
          const s = 66 + i * 0.35;
          const hit = hash(i + 3) < 0.9;
          return (
            <g key={`s${i}`}>
              {pe(CLIENT, WEB, s, 0.4, C.sky)}
              {hit ? pe(WEB, CACHE, s + 0.4, 0.5, C.amber) : pe(WEB, DB, s + 0.4, 0.6, C.emerald)}
            </g>
          );
        })}

      <StatusBadge x={330} y={560} status={p95 > 1000 ? 'down' : 'ok'} text={`p95 ${p95 >= 1000 ? `${(p95 / 1000).toFixed(1)} s` : `${p95} ms`}`} time={t} />
      {steady && (
        <g opacity={progress(t, 66, 67)}>
          <Meter x={560} y={600} w={300} value={hitRate} label="cache hit rate" color={C.amber} />
        </g>
      )}

      <Callout x={880} y={100} width={370} title="Cache" color={C.amber} size={15}
        text="A temporary storage area that keeps the results of expensive responses or frequently accessed data in memory, so later requests are served faster."
        appear={fadeWindow(t, 20, 31, 0.5)} />
      <Callout x={880} y={100} width={370} title="Why a separate cache tier?" color={C.amber} size={15}
        text="Much faster than the database. Better performance, less database workload, and you can scale the cache tier independently."
        appear={fadeWindow(t, 31, 43.5, 0.5)} />
      <Callout x={880} y={100} width={370} title="Read-through cache" color={C.cyan} size={15}
        text="Check the cache first. Hit: return it. Miss: query the database, store the response in the cache, then return it."
        appear={fadeWindow(t, 46, 75.5, 0.5)} />
      <Hotspot id="read-through" interactive={interactive} onClick={onHotspot} active={between(t, 46, T.api)} x={1250} y={100} time={t} label="Read-through" />
    </g>
  );
}

/* ---------------------------- Chapter 4: the API -------------------------- */
function ApiPart({ time: t }: { time: number }) {
  const vis = fadeWindow(t, T.api, T.use + 0.5, 0.6);
  if (vis <= 0) return null;
  const ttlLeft = 3600 - Math.floor(clamp01((t - 83) / 10) * 3500);
  return (
    <g opacity={vis}>
      <Title text="Talking to a cache" subtitle="typical Memcached-style API" y={70} size={28} appear={progress(t, T.api, T.api + 1)} color={C.amber} />
      <CodeBlock x={90} y={170} width={560} title="app.py" code={MEMCACHED_CODE} chars={(t - 78) * 18} appear={progress(t, 77, 78)} color={C.amber} size={20} />
      <Appear p={progress(t, 83, 84)} from="right">
        <rect x={720} y={190} width={470} height={110} rx={22} fill={C.panel} stroke={C.amber} strokeWidth={2} />
        <text x={745} y={232} fill={C.amber} fontSize={22} fontFamily={MONO} fontWeight={700}>myKey</text>
        <path d="M850 225 H900 M890 216 L900 225 L890 234" stroke={C.amber} strokeWidth={3} fill="none" />
        <text x={915} y={232} fill={C.emerald} fontSize={22} fontFamily={MONO}>'hi there'</text>
        <text x={745} y={276} fill={C.dim} fontSize={15}>expires in</text>
        <rect x={840} y={262} width={250} height={14} rx={7} fill={C.panel2} />
        <rect x={840} y={262} width={250 * (ttlLeft / 3600)} height={14} rx={7} fill={C.amber} />
        <text x={1170} y={276} textAnchor="end" fill={C.text} fontSize={15} fontFamily={MONO}>{ttlLeft}s</text>
      </Appear>
      <Packet along={[{ x: 650, y: 330 }, { x: 900, y: 330 }]} time={t} start={88} end={89.2} label="get('myKey')" shape="envelope" color={C.cyan} />
      <Packet along={[{ x: 900, y: 360 }, { x: 650, y: 360 }]} time={t} start={89.5} end={90.7} label="'hi there'" shape="envelope" color={C.emerald} />
      <Callout x={90} y={360} width={560} title="set(key, value, ttl)" color={C.amber} size={15}
        text="Stores 'hi there' under myKey for 3,600 seconds (one hour). After that the entry expires."
        appear={fadeWindow(t, 82, 94, 0.5)} />
      <Callout x={90} y={500} width={560} title="get(key)" color={C.cyan} size={15}
        text="Returns the value if it is still cached. Most cache servers offer APIs like this for common languages."
        appear={fadeWindow(t, 88, 94, 0.5)} />
    </g>
  );
}
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ------------------------- Chapter 5: when to use ------------------------- */
function UsePart({ time: t }: { time: number }) {
  const vis = fadeWindow(t, T.use, T.ttl + 0.5, 0.6);
  if (vis <= 0) return null;
  const restart = progress(t, 100.5, 101.5);
  const items = ['avatar:42', 'feed:home', 'tags:trending'];
  return (
    <g opacity={vis}>
      <Title text="When should you cache?" y={60} size={28} appear={progress(t, T.use, T.use + 1)} color={C.emerald} />
      <Panel x={80} y={120} w={520} h={280} title="Great fit" color={C.emerald} tint={0.05} />
      {['Read frequently', 'Modified infrequently', 'e.g. avatars, the feed, trending tags'].map((s, i) => (
        <Appear key={s} p={progress(t, 95.5 + i * 0.8, 96.3 + i * 0.8)} from="left">
          {i < 2 && <CheckMark x={120} y={185 + i * 60} t={progress(t, 96 + i * 0.8, 97 + i * 0.8)} size={34} />}
          <text x={i < 2 ? 150 : 110} y={193 + i * 60} fill={i < 2 ? C.white : C.dim} fontSize={i < 2 ? 22 : 17} fontWeight={i < 2 ? 800 : 500}>{s}</text>
        </Appear>
      ))}
      <Panel x={680} y={120} w={520} h={280} title="Memory is volatile" color={C.rose} tint={0.05} opacity={progress(t, 99, 100)} />
      {t >= 99 && (
        <g>
          <Node kind="cache" label="Cache" x={790} y={260} size={92} time={t} state={between(t, 100.5, 102) ? 'down' : 'idle'} />
          {items.map((k, i) => (
            <Chip key={k} x={960} y={200 + i * 44} text={k} color={C.amber} size={14} appear={1 - restart} />
          ))}
          {restart >= 1 && <Label x={960} y={250} text="(empty after restart)" size={16} color={C.rose} anchor="middle" weight={700} />}
          <Label x={790} y={355} text="restart = data gone" size={15} color={C.rose} anchor="middle" weight={800} opacity={progress(t, 101, 101.5)} />
        </g>
      )}
      <Callout x={80} y={440} width={1120} title="Rule of thumb" color={C.cyan} size={16}
        text="A cache is not a place to persist data. Save important data in a persistent data store (the database), and treat the cache as a fast copy."
        appear={fadeWindow(t, 102, T.ttl, 0.4)} />
    </g>
  );
}

/* ---------------------------- Chapter 6: TTL ----------------------------- */
function TtlPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.ttl, T.consistency + 0.5, 0.6);
  if (vis <= 0) return null;
  const knob = t < 110.5 ? tween(t, 107, 108.5, 0.5, 0.06) : t < 115.5 ? tween(t, 110.5, 112, 0.06, 0.94) : tween(t, 115.5, 117, 0.94, 0.5);
  const reload = 1 - knob * 0.85;
  const stale = knob * knob;
  const x0 = 200;
  const w = 880;
  const zone = knob < 0.2 ? 'short' : knob > 0.8 ? 'long' : 'ok';
  return (
    <g opacity={vis}>
      <Title text="Expiration policy (TTL)" y={60} size={28} appear={progress(t, T.ttl, T.ttl + 1)} color={C.amber} />
      <Hotspot id="ttl" interactive={interactive} onClick={onHotspot} active={between(t, 107, T.consistency)} x={x0 + w + 40} y={170} time={t} label="TTL">
        <rect x={x0} y={190} width={w} height={16} rx={8} fill={C.panel2} />
        <rect x={x0} y={190} width={w * 0.2} height={16} rx={8} fill={`${C.rose}66`} />
        <rect x={x0 + w * 0.8} y={190} width={w * 0.2} height={16} rx={8} fill={`${C.violet}66`} />
        <rect x={x0 + w * 0.3} y={190} width={w * 0.4} height={16} rx={8} fill={`${C.emerald}55`} />
      </Hotspot>
      <text x={x0} y={240} fill={C.rose} fontSize={15} fontWeight={700}>too short</text>
      <text x={x0 + w / 2} y={240} textAnchor="middle" fill={C.emerald} fontSize={15} fontWeight={700}>just right</text>
      <text x={x0 + w} y={240} textAnchor="end" fill={C.violet} fontSize={15} fontWeight={700}>too long</text>
      <circle cx={x0 + w * knob} cy={198} r={20} fill={C.amber} stroke={C.white} strokeWidth={3} filter="url(#sk-glow)" />
      <Node kind="cache" label="Cache" x={360} y={400} size={96} time={t} state={zone === 'long' ? 'busy' : 'idle'} />
      <Node kind="db" label="Database" x={880} y={400} size={96} time={t} state={zone === 'short' ? 'overloaded' : 'idle'} />
      <Link from={{ x: 360, y: 400 }} to={{ x: 880, y: 400 }} inset={60} color={zone === 'short' ? C.rose : C.emerald} animated time={t} speed={zone === 'short' ? 4 : 1} label="reload on expiry" />
      {Array.from({ length: 24 }, (_, i) => {
        const s = 107 + i * 0.5;
        const show = hash(i) < reload;
        return show ? <Packet key={i} along={[{ x: 820, y: 400 }, { x: 420, y: 400 }]} time={t} start={s} end={s + 0.6} color={C.emerald} size={6} trail={false} /> : null;
      })}
      <Meter x={240} y={520} w={340} value={reload} label="database reloads" color={C.rose} />
      <Meter x={700} y={520} w={340} value={stale} label="risk of stale data" color={C.violet} />
      <Callout x={200} y={570} width={880} title={zone === 'short' ? 'Too short' : zone === 'long' ? 'Too long' : 'Expiration policy'} size={15}
        color={zone === 'short' ? C.rose : zone === 'long' ? C.violet : C.emerald}
        text={zone === 'short' ? 'Entries expire constantly, so the system reloads from the database far too often.'
          : zone === 'long' ? 'Entries live so long that users see stale data (3 likes when there are really 57).'
            : 'Expired data is removed from the cache. Without any expiration it would stay in memory forever. Aim in between.'}
        appear={progress(t, 107, 108)} />
    </g>
  );
}

/* ------------------------- Chapter 7: consistency ------------------------- */
function ConsistencyPart({ time: t }: { time: number }) {
  const vis = fadeWindow(t, T.consistency, T.spof + 0.5, 0.6);
  if (vis <= 0) return null;
  const updated = t >= 123.5;
  const regions = progress(t, 128, 129);
  return (
    <g opacity={vis}>
      <Title text="Consistency" subtitle="keeping the data store and the cache in sync" y={60} size={28} appear={progress(t, T.consistency, T.consistency + 1)} color={C.violet} />
      <g opacity={1 - regions}>
        <Node kind="db" label="Database" x={330} y={300} size={96} time={t} state={between(t, 122.5, 124) ? 'active' : 'idle'} />
        <Node kind="cache" label="Cache" x={950} y={300} size={96} time={t} />
        <Chip x={330} y={400} text={updated ? "bio: 'dog person'" : "bio: 'cat person'"} color={C.emerald} filled={updated} size={16} />
        <Chip x={950} y={400} text="bio: 'cat person'" color={updated ? C.rose : C.amber} size={16} />
        <Packet along={[{ x: 140, y: 200 }, { x: 300, y: 260 }]} time={t} start={122} end={123.3} label="UPDATE bio" shape="envelope" color={C.amber} />
        {updated && (
          <g opacity={0.6 + 0.4 * pulse(t, 0.6)}>
            <path d="M615 290 H665 M615 310 H665 M652 276 L628 324" stroke={C.rose} strokeWidth={5} strokeLinecap="round" fill="none" />
          </g>
        )}
        <Callout x={390} y={450} width={500} title="Why it happens" color={C.rose} size={15}
          text="Changing the data store and changing the cache are not one single transaction, so for a moment they disagree."
          appear={fadeWindow(t, 124, 128.5, 0.4)} />
      </g>
      {regions > 0 && (
        <Appear p={regions} from="up">
          <Panel x={120} y={430} w={420} h={170} title="Region: US" color={C.cyan} tint={0.05} />
          <Panel x={740} y={430} w={420} h={170} title="Region: Europe" color={C.cyan} tint={0.05} />
          <Node kind="cache" label="" x={250} y={520} size={70} time={t} />
          <Node kind="db" label="" x={410} y={520} size={70} time={t} />
          <Node kind="cache" label="" x={870} y={520} size={70} time={t} />
          <Node kind="db" label="" x={1030} y={520} size={70} time={t} />
          <Link from={{ x: 540, y: 520 }} to={{ x: 740, y: 520 }} inset={0} color={C.violet} dashed animated time={t} label="sync?" />
          <Chip x={640} y={640} text='Further reading: "Scaling Memcache at Facebook"' color={C.violet} size={14} />
        </Appear>
      )}
      <Label x={640} y={170} text={regions > 0 ? 'Across multiple regions it gets even harder.' : ''} size={20} color={C.text} anchor="middle" weight={700} opacity={regions} />
    </g>
  );
}

/* ---------------------- Chapter 8: single point of failure ---------------- */
function SpofPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.spof, T.evict + 0.5, 0.6);
  if (vis <= 0) return null;
  const dead = between(t, 137.5, 141.5);
  const fixed = progress(t, 141.5, 142.5);
  const W: Pt = { x: 160, y: 380 };
  const ONE: Pt = { x: 520, y: 260 };
  const D: Pt = { x: 520, y: 540 };
  return (
    <g opacity={vis}>
      <Title text="Mitigating failures" y={60} size={28} appear={progress(t, T.spof, T.spof + 1)} color={C.rose} />
      <Node kind="web" label="Web servers" x={W.x} y={W.y} size={92} time={t} />
      <Link from={W} to={ONE} inset={54} color={dead ? C.rose : C.amber} animated={!dead} time={t} state={dead ? 'down' : 'ok'} opacity={1 - fixed} />
      <Link from={W} to={D} inset={54} color={dead ? C.rose : C.emerald} animated time={t} speed={dead ? 4 : 1} state={dead ? 'hot' : 'ok'} />
      <Hotspot id="spof" interactive={interactive} onClick={onHotspot} active={between(t, 135, T.evict)} x={1235} y={110} time={t} label="Single point of failure">
        <g opacity={1 - fixed}>
          <Node kind="cache" label="The only cache" x={ONE.x} y={ONE.y} size={96} time={t} state={t >= 137.5 ? 'down' : 'idle'} />
        </g>
      </Hotspot>
      <Explosion x={ONE.x} y={ONE.y} t={progress(t, 137.5, 138.8)} size={130} />
      <Node kind="db" label="Database" x={D.x} y={D.y} size={96} time={t} state={dead ? 'overloaded' : 'idle'} load={dead ? 1.3 : 0.3} />
      <Smoke x={D.x} y={D.y - 40} time={t} intensity={dead ? 0.8 : 0} seed={9} />
      {dead &&
        Array.from({ length: 16 }, (_, i) => (
          <Packet key={i} along={linkPath(W, D, 0, 54)} time={t} start={137.6 + i * 0.25} end={138.4 + i * 0.25} color={C.rose} size={6} trail={false} />
        ))}
      <Callout x={720} y={110} width={500} title="Single point of failure (SPOF)" color={C.rose} size={15}
        text='"A part of a system that, if it fails, will stop the entire system from working." One cache server is exactly that.'
        appear={fadeWindow(t, 135, 141.5, 0.5)} />
      {fixed > 0 && (
        <Appear p={fixed} from="right">
          <Panel x={330} y={130} w={190} h={200} title="Data center 1" color={C.cyan} tint={0.05} />
          <Panel x={540} y={130} w={190} h={200} title="Data center 2" color={C.cyan} tint={0.05} />
          <Node kind="cache" label="Cache A" x={425} y={240} size={80} time={t} />
          <Node kind="cache" label="Cache B" x={635} y={240} size={80} time={t} />
          <Link from={W} to={{ x: 425, y: 240 }} inset={50} color={C.amber} animated time={t} />
          <Link from={W} to={{ x: 635, y: 240 }} inset={50} color={C.amber} animated time={t} bend={50} />
          <Callout x={790} y={110} width={430} title="Fix 1: more cache servers" color={C.emerald} size={15}
            text="Run multiple cache servers across different data centers, so losing one is not fatal." />
        </Appear>
      )}
      {t >= 145 && (
        <Appear p={progress(t, 145, 146)} from="up">
          <rect x={790} y={300} width={430} height={150} rx={20} fill={C.panel} stroke={C.emerald} strokeWidth={2} />
          <text x={810} y={332} fill={C.emerald} fontSize={16} fontWeight={800}>Fix 2: overprovision memory</text>
          <rect x={810} y={355} width={390} height={30} rx={8} fill={C.panel2} />
          <rect x={810} y={355} width={390 * 0.7 * progress(t, 145.5, 147, ease.outCubic)} height={30} rx={8} fill={C.amber} />
          <rect x={810 + 390 * 0.7} y={355} width={390 * 0.3} height={30} rx={8} fill={`${C.emerald}33`} stroke={C.emerald} strokeDasharray="5 4" />
          <text x={820 + 390 * 0.35} y={376} textAnchor="middle" fill={C.bg} fontSize={14} fontWeight={800}>needed</text>
          <text x={810 + 390 * 0.85} y={376} textAnchor="middle" fill={C.emerald} fontSize={14} fontWeight={800}>buffer</text>
          <text x={810} y={425} fill={C.dim} fontSize={14}>Extra memory absorbs growth in usage.</text>
        </Appear>
      )}
    </g>
  );
}

/* ---------------------------- Chapter 9: eviction ------------------------- */
const ACCESSES = [
  { at: 152, key: 'A' },
  { at: 153.2, key: 'B' },
  { at: 154.4, key: 'C' },
  { at: 155.6, key: 'D' },
  { at: 157.2, key: 'A' },
  { at: 159, key: 'E' },
];
const EVICT_AT = 163.5;

function EvictPart({ time: t, interactive, onHotspot }: PartProps) {
  const vis = fadeWindow(t, T.evict, T.end + 1, 0.6);
  if (vis <= 0) return null;
  const slots = ['A', 'B', 'C', 'D'];
  const lastUse = (k: string, now: number) => Math.max(-1, ...ACCESSES.filter((a) => a.key === k && a.at <= now).map((a) => a.at));
  const replaced = t >= EVICT_AT + 1;
  const policies = [
    { name: 'LRU', text: 'Least recently used: the most popular policy', color: C.amber, at: 166 },
    { name: 'LFU', text: 'Least frequently used', color: C.cyan, at: 167.5 },
    { name: 'FIFO', text: 'First in, first out', color: C.violet, at: 169 },
  ];
  return (
    <g opacity={vis}>
      <Title text="Eviction policy" subtitle="the cache is full: who has to go?" y={60} size={28} appear={progress(t, T.evict, T.evict + 1)} color={C.amber} />
      <Hotspot id="eviction" interactive={interactive} onClick={onHotspot} active={t >= 151} x={1010} y={150} time={t} label="Eviction">
        <Panel x={270} y={150} w={740} h={210} title="Cache (4 slots, full)" color={C.amber} tint={0.04} />
      </Hotspot>
      {slots.map((k, i) => {
        const filled = ACCESSES[i].at;
        const x = 300 + i * 175;
        const isVictim = k === 'B';
        const flash = isVictim && between(t, EVICT_AT, EVICT_AT + 1);
        const show = isVictim && replaced ? 'E' : k;
        const lu = lastUse(show, t);
        return (
          <Appear key={k} p={progress(t, filled, filled + 0.5)} from="pop" x={x + 75} y={255}>
            <rect x={x} y={195} width={150} height={140} rx={18} fill={flash ? `${C.rose}44` : C.panel2}
              stroke={flash ? C.rose : between(t, lu, lu + 0.8) ? C.emerald : C.line} strokeWidth={flash ? 4 : 2} />
            <text x={x + 75} y={262} textAnchor="middle" fill={C.white} fontSize={46} fontWeight={900} fontFamily={MONO}>{show}</text>
            <text x={x + 75} y={315} textAnchor="middle" fill={C.dim} fontSize={13}>last used {lu > 0 ? `t=${Math.round(lu - 150)}` : '-'}</text>
          </Appear>
        );
      })}
      <CrossMark x={300 + 175 + 75} y={195} t={progress(t, EVICT_AT, EVICT_AT + 0.6) * (replaced ? 0 : 1)} size={50} />
      <g>
        <Label x={270} y={410} text="Requests:" size={16} color={C.dim} weight={700} />
        {ACCESSES.map((a, i) => (
          <Chip key={i} x={390 + i * 70} y={405} text={a.key} color={a.key === 'E' ? C.rose : C.cyan} filled={between(t, a.at, a.at + 1)} size={18} appear={progress(t, a.at, a.at + 0.3)} />
        ))}
      </g>
      <Callout x={270} y={450} width={740} title="E arrives, but the cache is full" color={C.rose} size={15}
        text="Adding E means an existing item must be removed: cache eviction. A was just used again, so under LRU the least recently used item, B, goes."
        appear={fadeWindow(t, 159, 165.8, 0.4)} />
      {policies.map((p, i) => (
        <Appear key={p.name} p={progress(t, p.at, p.at + 0.6)} from="left">
          <Chip x={330} y={470 + i * 50} text={p.name} color={p.color} filled size={18} />
          <text x={390} y={477 + i * 50} fill={C.text} fontSize={18} fontWeight={600}>{p.text}</text>
        </Appear>
      ))}
      <Sparkles x={1140} y={40} t={progress(t, 174, 175.5)} />
      <Character who="maya" mood="worried" x={1120} y={500} size={110} time={t} talking={between(t, 176, 181)} appear={fadeWindow(t, 175, T.end + 2, 0.5)}
        say="Europe says photos still load slowly..." bubble="left" />
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const intro = t < 6 ? progress(t, 0.3, 1.3) * (1 - progress(t, 4.6, 5.6)) : 0;
  return (
    <Stage time={t} drift title="Level 6 lesson: caching">
      <BoardPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <ApiPart time={t} />
      <UsePart time={t} />
      <TtlPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <ConsistencyPart time={t} />
      <SpofPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <EvictPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <Counter x={1140} y={40} value={300000} time={t} bump={between(t, 0, 4) || t > 174} />
      {intro > 0 && (
        <g>
          <rect width={1280} height={720} fill={C.bg} opacity={0.75 * intro} />
          <Title text="Memory Lane" kicker="LEVEL 6 · 300K USERS" subtitle="Stop asking the database the same question" y={330} appear={intro} />
        </g>
      )}
    </Stage>
  );
}
