import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, CodeBlock, Counter, CrossMark, DataTable, Hotspot, KindIcon, Label, Link, MONO,
  Meter, Node, Packet, Panel, Smoke, Sparkles, Stage, StatusBadge, Title, between, ease, fadeWindow, hash, lerp, linkPath,
  progress, pulse, stagger, type Pt,
} from '@/scenekit';
import { JOIN_SQL, NOSQL_FITS, PHOTOS_ROWS, USERS_ROWS } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  split: 22,
  sql: 58,
  nosql: 100,
  fit: 142,
  end: 185,
} as const;

/* ------------------------------ Chapter 1-2 ------------------------------ */
const MERGED = { x: 430, y: 200, w: 420, h: 330 };
const WEB_PANEL = { x: 250, y: 200, w: 390, h: 330 };
const DATA_PANEL = { x: 760, y: 200, w: 340, h: 330 };
const LAPTOP: Pt = { x: 110, y: 290 };
const PHONE: Pt = { x: 110, y: 460 };

function TiersPart({ time: t, interactive, onHotspot }: { time: number; interactive: boolean; onHotspot?: (id: string) => void }) {
  const vis = fadeWindow(t, 0, T.sql + 0.5, 0.6);
  if (vis <= 0) return null;
  const sp = progress(t, 23, 28, ease.inOutCubic); // split progress
  const lerpRect = (a: typeof MERGED, b: typeof MERGED) => ({ x: lerp(a.x, b.x, sp), y: a.y, w: lerp(a.w, b.w, sp), h: a.h });
  const wp = lerpRect(MERGED, WEB_PANEL);
  const dp = lerpRect(MERGED, DATA_PANEL);
  const web: Pt = { x: lerp(545, WEB_PANEL.x + WEB_PANEL.w / 2, sp), y: 350 };
  const db: Pt = { x: lerp(735, DATA_PANEL.x + DATA_PANEL.w / 2, sp), y: 350 };
  const fight = between(t, 2, 23);
  const webShare = fight ? 0.5 + 0.35 * Math.sin(t * 2.3) : tween01(t);
  const dbShare = fight ? 1 - webShare : tween01(t) * 0.85;
  const scaleWeb = progress(t, 38, 40);
  const dbGrow = progress(t, 44, 47, ease.outBack);
  const webState = fight ? 'overloaded' : 'idle';
  const flows = t >= 29;
  const extra = [
    { x: WEB_PANEL.x + 70, y: 350 },
    { x: WEB_PANEL.x + WEB_PANEL.w - 70, y: 350 },
  ];

  return (
    <g opacity={vis}>
      {/* clients */}
      <Node kind="client" label="Web" x={LAPTOP.x} y={LAPTOP.y} size={84} time={t} appear={progress(t, 1, 1.6)} />
      <Node kind="mobile" label="Mobile" x={PHONE.x} y={PHONE.y} size={84} time={t} appear={progress(t, 1.3, 1.9)} />
      <Link from={{ x: LAPTOP.x + 50, y: LAPTOP.y }} to={{ x: wp.x, y: 330 }} inset={0} color={C.sky} animated time={t} draw={progress(t, 1.6, 2.4)} />
      <Link from={{ x: PHONE.x + 50, y: PHONE.y }} to={{ x: wp.x, y: 380 }} inset={0} color={C.sky} animated time={t} draw={progress(t, 1.9, 2.7)} />
      {Array.from({ length: 24 }, (_, i) => {
        const s = 2 + i * 2.2 + hash(i) * 1.2;
        const from = i % 2 ? PHONE : LAPTOP;
        return <Packet key={i} along={[{ x: from.x + 50, y: from.y }, { x: wp.x, y: i % 2 ? 380 : 330 }]} time={t} start={s} end={s + 1.3} color={C.sky} size={6} trail={false} />;
      })}

      {/* panels */}
      {sp < 1 && (
        <Panel x={wp.x} y={wp.y} w={sp > 0 ? wp.w : MERGED.w} h={MERGED.h} title={sp > 0 ? undefined : 'One server · 1,000 users'}
          color={fight ? C.rose : C.cyan} tint={fight ? 0.12 : 0.06} opacity={sp > 0 ? 1 - sp : progress(t, 0.5, 1.2)} />
      )}
      {sp > 0 && (
        <>
          <Hotspot id="web-tier" interactive={interactive} onClick={onHotspot} active={t >= 28} x={WEB_PANEL.x + WEB_PANEL.w} y={WEB_PANEL.y} time={t} label="Web tier">
            <Panel x={wp.x} y={wp.y} w={wp.w} h={wp.h} title="Web tier" color={C.cyan} opacity={sp} />
          </Hotspot>
          <Hotspot id="data-tier" interactive={interactive} onClick={onHotspot} active={t >= 28} x={DATA_PANEL.x + DATA_PANEL.w} y={DATA_PANEL.y} time={t} label="Data tier">
            <Panel x={dp.x} y={dp.y} w={dp.w} h={dp.h} title="Data tier" color={C.emerald} opacity={sp} />
          </Hotspot>
        </>
      )}

      {/* nodes */}
      {sp > 0.9 && <Link from={web} to={db} inset={70} color={C.emerald} animated={flows} time={t} label={flows ? 'queries' : undefined} />}
      {flows &&
        Array.from({ length: 12 }, (_, i) => {
          const s = 29 + i * 2.4;
          return (
            <g key={i}>
              <Packet along={linkPath(web, db, 0, 60)} time={t} start={s} end={s + 1} color={C.emerald} size={5} trail={false} />
              <Packet along={linkPath(db, web, 0, 60)} time={t} start={s + 1.1} end={s + 2.1} color={C.amber} size={5} trail={false} />
            </g>
          );
        })}
      {extra.map((p, i) => (
        <Node key={i} kind="web" label="" x={p.x} y={p.y} size={84} time={t} appear={progress(t, 38 + i * 0.6, 39 + i * 0.6)}
          state={t < 39 + i * 0.6 ? 'ghost' : 'idle'} />
      ))}
      <Node kind="web" label="Web app" x={web.x} y={web.y} size={scaleWeb > 0 ? 84 : 96} time={t} appear={progress(t, 0.6, 1.3)} state={webState} />
      <Node kind="db" label="Database" x={db.x} y={db.y} size={96 + 34 * dbGrow} time={t} appear={progress(t, 0.9, 1.6)} state={webState} />
      <Smoke x={640} y={210} time={t} intensity={fight ? 0.8 : 1 - progress(t, 23, 25)} seed={2} />

      {/* meters */}
      {sp < 1 ? (
        <g opacity={1 - sp}>
          <Meter x={MERGED.x + 30} y={MERGED.y + MERGED.h - 60} w={MERGED.w - 60} value={webShare} label="Web app's share of CPU" color={C.cyan} />
          <Meter x={MERGED.x + 30} y={MERGED.y + MERGED.h - 22} w={MERGED.w - 60} value={dbShare} label="Database's share of CPU" color={C.emerald} />
        </g>
      ) : (
        <>
          <Meter x={WEB_PANEL.x + 30} y={WEB_PANEL.y + WEB_PANEL.h - 22} w={WEB_PANEL.w - 60} value={t < 38 ? 0.62 : 0.32} label="Web tier CPU" />
          <Meter x={DATA_PANEL.x + 30} y={DATA_PANEL.y + DATA_PANEL.h - 22} w={DATA_PANEL.w - 60} value={t < 44 ? 0.55 : 0.3} label="Data tier CPU" />
        </>
      )}
      <StatusBadge x={640} y={580} time={t} status={fight ? 'down' : 'ok'} text={fight ? 'p95 latency 4.2 s' : 'p95 latency 120 ms'} />

      {/* talk */}
      <Character who="ravi" mood="worried" x={1150} y={300} size={120} time={t} talking={between(t, 6, 12)} appear={fadeWindow(t, 5, 21, 0.5)}
        say="Web app and database share one CPU. Every spike in one starves the other." bubble="left" />
      <Callout x={860} y={450} width={360} title="Two tiers, two machines" color={C.cyan} size={15}
        text="Web tier: handles web & mobile traffic. Data tier: runs the database. Separate servers, connected over the network."
        appear={fadeWindow(t, 29, 37, 0.5)} />
      <Callout x={250} y={86} width={390} title="More web servers" color={C.cyan} size={15}
        text="Traffic up? Add web servers without touching the database."
        appear={fadeWindow(t, 39, 50, 0.5)} pointTo={{ x: WEB_PANEL.x + 70, y: 300 }} />
      <Callout x={760} y={86} width={340} title="A beefier database" color={C.emerald} size={15}
        text="Data growing? Give the data tier more power, independently."
        appear={fadeWindow(t, 45, 56, 0.5)} pointTo={{ x: DATA_PANEL.x + DATA_PANEL.w / 2, y: 280 }} />
    </g>
  );
}
const tween01 = (t: number) => 0.55 - 0.15 * progress(t, 23, 30);

/* ------------------------------- Chapter 3 ------------------------------- */
const USERS_AT = { x: 80, y: 120 };
const PHOTOS_AT = { x: 500, y: 120 };
const rowY = (y0: number, i: number) => y0 + 64 + i * 34 + 17;

function SqlPart({ time: t, interactive, onHotspot }: { time: number; interactive: boolean; onHotspot?: (id: string) => void }) {
  const vis = fadeWindow(t, T.sql, T.nosql + 0.5, 0.6);
  if (vis <= 0) return null;
  const joinOn = t >= 72;
  const momIdx = USERS_ROWS.findIndex((r) => r[0] === 3);
  const photoIdx = PHOTOS_ROWS.map((r, i) => (r[1] === 3 ? i : -1)).filter((i) => i >= 0);
  const usersW = 320;
  return (
    <g opacity={vis}>
      <Title text="Relational databases (SQL)" y={60} size={30} appear={progress(t, T.sql, T.sql + 1)} color={C.emerald} />
      <DataTable x={USERS_AT.x} y={USERS_AT.y} title="users" columns={['id', 'username', 'city']} widths={[60, 120, 140]}
        rows={USERS_ROWS} rowsShown={(t - 61) * 2} appear={progress(t, 60, 61)} highlight={joinOn ? [momIdx] : []} />
      <DataTable x={PHOTOS_AT.x} y={PHOTOS_AT.y} title="photos" columns={['id', 'user_id', 'title']} widths={[70, 100, 170]}
        rows={PHOTOS_ROWS} rowsShown={(t - 64) * 2} appear={progress(t, 63, 64)} highlight={joinOn ? photoIdx : []} />
      {joinOn &&
        photoIdx.map((pi, k) => (
          <Link key={pi} from={{ x: USERS_AT.x + usersW, y: rowY(USERS_AT.y, momIdx) }} to={{ x: PHOTOS_AT.x + 70 + 50, y: rowY(PHOTOS_AT.y, pi) }}
            inset={0} bend={-20} color={C.amber} draw={progress(t, 72.5 + k * 0.4, 73.5 + k * 0.4)} width={2.5} arrow />
        ))}
      <Hotspot id="sql-join" interactive={interactive} onClick={onHotspot} active={t >= 74} x={80 + 520} y={418} time={t} label="SQL join">
        <CodeBlock x={80} y={418} width={520} title="query.sql" code={JOIN_SQL} chars={(t - 70) * 40} appear={progress(t, 69.5, 70.5)} color={C.emerald} size={15} />
      </Hotspot>
      <DataTable x={660} y={430} title="result" columns={['username', 'title']} widths={[120, 160]}
        rows={photoIdx.map((pi) => ['mom', String(PHOTOS_ROWS[pi][2])])} appear={progress(t, 78, 79)} color={C.amber} />
      <Sparkles x={800} y={500} t={progress(t, 79, 80.5)} />
      <Appear p={progress(t, 84, 85)} from="right">
        <Label x={1070} y={150} text="Popular choices" size={16} color={C.dim} />
        <Chip x={1070} y={190} text="MySQL" color={C.emerald} appear={progress(t, 85, 85.6)} />
        <Chip x={1070} y={236} text="PostgreSQL" color={C.emerald} appear={progress(t, 85.5, 86.1)} />
        <Chip x={1070} y={282} text="Oracle" color={C.emerald} appear={progress(t, 86, 86.6)} />
      </Appear>
      <Appear p={progress(t, 90, 91)} from="pop" x={1070} y={400}>
        <circle cx={1070} cy={400} r={62} fill={`${C.amber}1a`} stroke={C.amber} strokeWidth={3} />
        <text x={1070} y={402} textAnchor="middle" fill={C.amber} fontSize={40} fontWeight={900}>40+</text>
        <text x={1070} y={428} textAnchor="middle" fill={C.text} fontSize={15} fontWeight={700}>years proven</text>
      </Appear>
      <Callout x={940} y={480} width={280} title="Also called" color={C.emerald} size={14} text="RDBMS or SQL database. Data lives in tables and rows, and SQL can JOIN across tables."
        appear={fadeWindow(t, 61, 71, 0.4)} />
    </g>
  );
}

/* ------------------------------- Chapter 4 ------------------------------- */
const CARDS = [
  { key: 'kv', title: 'Key-value store', db: 'DynamoDB', x: 70, y: 90, color: C.amber },
  { key: 'graph', title: 'Graph store', db: 'Neo4j', x: 660, y: 90, color: C.violet },
  { key: 'column', title: 'Column store', db: 'Cassandra · HBase', x: 70, y: 360, color: C.cyan },
  { key: 'doc', title: 'Document store', db: 'CouchDB', x: 660, y: 360, color: C.orange },
] as const;
const CW = 550;
const CH = 240;

function FamilyBody({ k, t, x, y, color }: { k: (typeof CARDS)[number]['key']; t: number; x: number; y: number; color: string }) {
  if (k === 'kv') {
    const rows = [
      ['session:9f2c', '{ cart, theme }'],
      ['likes:photo:7', '1,024'],
      ['user:12:name', '"maya"'],
    ];
    return (
      <g>
        {rows.map(([kk, v], i) => (
          <g key={kk} transform={`translate(${x + 26} ${y + 70 + i * 50})`} opacity={progress(t, 103 + i * 0.5, 103.6 + i * 0.5)}>
            <rect width={190} height={36} rx={10} fill={`${color}22`} stroke={color} />
            <text x={12} y={24} fill={C.text} fontSize={15} fontFamily={MONO}>{kk}</text>
            <path d="M206 18 H252 M244 11 L252 18 L244 25" stroke={color} strokeWidth={2.5} fill="none" />
            <rect x={266} width={230} height={36} rx={10} fill={C.panel2} />
            <text x={278} y={24} fill={C.emerald} fontSize={15} fontFamily={MONO}>{v}</text>
          </g>
        ))}
      </g>
    );
  }
  if (k === 'graph') {
    const N: [string, number, number][] = [
      ['maya', 120, 120], ['mom', 260, 80], ['ravi', 300, 190], ['you', 160, 205], ['club', 420, 130],
    ];
    const E: [number, number][] = [[0, 1], [1, 4], [0, 2], [2, 3], [3, 0], [1, 3], [4, 2]];
    return (
      <g transform={`translate(${x} ${y})`}>
        {E.map(([a, b], i) => (
          <Link key={i} from={{ x: N[a][1], y: N[a][2] }} to={{ x: N[b][1], y: N[b][2] }} inset={22} color={color} width={2}
            draw={progress(t, 106 + i * 0.3, 106.6 + i * 0.3)} arrow />
        ))}
        {N.map(([n, nx, ny], i) => (
          <g key={n} transform={`translate(${nx} ${ny}) scale(${ease.outBack(progress(t, 105 + i * 0.2, 105.6 + i * 0.2))})`}>
            <circle r={22} fill={C.panel2} stroke={color} strokeWidth={2.5} />
            <text y={5} textAnchor="middle" fill={C.text} fontSize={13} fontWeight={700}>{n}</text>
          </g>
        ))}
        <text x={470} y={215} textAnchor="end" fill={C.dim} fontSize={13}>"follows"</text>
      </g>
    );
  }
  if (k === 'column') {
    const cols = ['10-01', '10-02', '10-03', '10-04', '10-05', '…'];
    return (
      <g transform={`translate(${x + 24} ${y + 64})`} opacity={progress(t, 109, 110)}>
        <text x={0} y={16} fill={C.dim} fontSize={13} fontFamily={MONO}>row key</text>
        {cols.map((c, i) => (
          <text key={c} x={120 + i * 68} y={16} fill={color} fontSize={13} fontFamily={MONO}>{c}</text>
        ))}
        {['photo:7 views', 'photo:9 views', 'photo:12 views'].map((r, ri) => (
          <g key={r} transform={`translate(0 ${30 + ri * 44})`}>
            <text x={0} y={22} fill={C.text} fontSize={13} fontFamily={MONO}>{r}</text>
            {cols.map((c, i) => (
              <g key={c} opacity={progress(t, 110 + (ri * 6 + i) * 0.08, 110.3 + (ri * 6 + i) * 0.08)}>
                <rect x={116 + i * 68} y={4} width={60} height={28} rx={6} fill={`${color}${hash(ri * 7 + i) > 0.5 ? '44' : '22'}`} />
                <text x={146 + i * 68} y={23} textAnchor="middle" fill={C.text} fontSize={12} fontFamily={MONO}>
                  {c === '…' ? '…' : Math.floor(hash(ri * 11 + i) * 900 + 50)}
                </text>
              </g>
            ))}
          </g>
        ))}
      </g>
    );
  }
  return (
    <CodeBlock x={x + 24} y={y + 52} width={500} title="photos/7.json" color={color} size={14} appear={progress(t, 112, 113)} chars={(t - 113) * 50}
      code={`{ "id": 7, "owner": "mom", "tags": ["cat", "sofa"],\n  "exif": { "iso": 200, "lens": "26mm" } }`} />
  );
}

function NoSqlPart({ time: t, interactive, onHotspot }: { time: number; interactive: boolean; onHotspot?: (id: string) => void }) {
  const vis = fadeWindow(t, T.nosql, T.fit + 0.5, 0.6);
  if (vis <= 0) return null;
  const noJoin = progress(t, 128, 129);
  return (
    <g opacity={vis}>
      <Title text="Non-relational (NoSQL): 4 families" y={52} size={28} appear={progress(t, T.nosql, T.nosql + 1)} color={C.orange} />
      {CARDS.map((c, i) => (
        <Appear key={c.key} p={progress(t, stagger(i, 102, 2.5), stagger(i, 102.8, 2.5))} from="pop" x={c.x + CW / 2} y={c.y + CH / 2}>
          <Panel x={c.x} y={c.y} w={CW} h={CH} title={c.title} color={c.color} tint={0.05} />
          <Chip x={c.x + CW - 20 - c.db.length * 4.2} y={c.y + 26} text={c.db} color={c.color} size={13} />
          <FamilyBody k={c.key} t={t} x={c.x} y={c.y} color={c.color} />
        </Appear>
      ))}
      <Hotspot id="nosql-families" interactive={interactive} onClick={onHotspot} active={t >= 112} x={1210} y={90} time={t} label="NoSQL families" />
      {noJoin > 0 && (
        <g opacity={noJoin * (1 - progress(t, 140, 141.5))}>
          <rect x={0} y={0} width={1280} height={720} fill={C.bg} opacity={0.6} />
          <Appear p={noJoin} from="pop" x={640} y={330}>
            <rect x={430} y={250} width={420} height={170} rx={24} fill={C.panel} stroke={C.rose} strokeWidth={2} />
            <Chip x={590} y={300} text="JOIN" color={C.rose} size={22} />
            <CrossMark x={700} y={300} t={progress(t, 129, 130)} size={50} />
            <text x={640} y={370} textAnchor="middle" fill={C.text} fontSize={18} fontWeight={600}>Joins are generally not supported.</text>
            <text x={640} y={398} textAnchor="middle" fill={C.dim} fontSize={15}>Design data around how you read it.</text>
          </Appear>
        </g>
      )}
    </g>
  );
}

/* ------------------------------- Chapter 5 ------------------------------- */
const FIT_ICONS = ['cache', 'nosql', 'mobile', 'storage'] as const;

function FitPart({ time: t, interactive, onHotspot }: { time: number; interactive: boolean; onHotspot?: (id: string) => void }) {
  const vis = fadeWindow(t, T.fit, T.end + 1, 0.6);
  if (vis <= 0) return null;
  return (
    <g opacity={vis}>
      <Title text="When does NoSQL fit?" y={60} size={32} appear={progress(t, T.fit, T.fit + 1)} color={C.amber} />
      <Character who="ravi" mood="neutral" x={150} y={330} size={140} time={t} talking={between(t, 143, 150)} appear={progress(t, 142.5, 143.3)}
        say="Default to relational. It has worked well for over 40 years. Reach for NoSQL when…" />
      <Hotspot id="nosql-fit" interactive={interactive} onClick={onHotspot} active={t >= 152} x={1240} y={150} time={t} label="When NoSQL fits">
        <Panel x={560} y={150} w={680} h={400} title="NoSQL might be right if" color={C.amber} opacity={progress(t, 149, 150)} tint={0.04} />
      </Hotspot>
      {NOSQL_FITS.map((f, i) => {
        const at = stagger(i, 151, 6);
        const y = 210 + i * 86;
        return (
          <Appear key={f.title} p={progress(t, at, at + 0.7)} from="left">
            <g transform={`translate(612 ${y})`}>
              <KindIcon kind={FIT_ICONS[i]} size={50} />
            </g>
            <text x={660} y={y - 4} fill={C.white} fontSize={22} fontWeight={800}>{f.title}</text>
            <text x={660} y={y + 22} fill={C.dim} fontSize={16}>{f.example}</text>
            <CheckMark x={1190} y={y} t={progress(t, at + 1, at + 2)} size={44} />
          </Appear>
        );
      })}
      <Character who="maya" mood="happy" x={150} y={560} size={110} time={t} talking={between(t, 176, 181)} appear={fadeWindow(t, 175, T.end + 2, 0.5)}
        say="Tiers split, latency down. 1,000 happy users!" />
      <Counter x={1140} y={630} value={1000} time={t} bump={t > 175} />
      <Sparkles x={1140} y={630} t={progress(t, 176, 177.5)} />
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const intro = t < 7 ? progress(t, 0.3, 1.3) * (1 - progress(t, 5.5, 6.5)) : 0;
  return (
    <Stage time={t} drift title="Level 2 lesson: web tier vs data tier, SQL vs NoSQL">
      {t < T.sql + 1 && <Counter x={1140} y={50} value={1000} time={t} bump={between(t, 0, 4)} />}
      <TiersPart time={t} interactive={interactive} onHotspot={onHotspot} />
      {intro > 0 && (
        <g>
          <rect width={1280} height={720} fill={C.bg} opacity={0.75 * intro} />
          <Title text="Split the Tiers" kicker="LEVEL 2 · 1K USERS" subtitle="One machine is not enough any more" y={330} appear={intro} />
          <g opacity={intro * (0.6 + 0.4 * pulse(t, 0.6))}>
            <StatusBadge x={640} y={450} status="down" text="Pager: CPU 100%" time={t} />
          </g>
        </g>
      )}
      <SqlPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <NoSqlPart time={t} interactive={interactive} onHotspot={onHotspot} />
      <FitPart time={t} interactive={interactive} onHotspot={onHotspot} />
    </Stage>
  );
}
