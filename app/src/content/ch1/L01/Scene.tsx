import type { LessonSceneProps } from '@/types/content';
import {
  Appear, BrowserWindow, C, Callout, Character, CheckMark, Chip, CodeBlock, Counter, Hotspot, Link, Meter, Node,
  Packet, Panel, Smoke, Stage, StatusBadge, Title, between, ease, fadeWindow, hash, linkPath, progress, tween,
  type NodeState, type Pt,
} from '@/scenekit';
import { IP, URL_TEXT, USER_JSON } from './data';

/* Layout (viewBox 1280x720) */
const BROWSER = { x: 40, y: 130, w: 440, h: 260 };
const BROWSER_PORT: Pt = { x: 480, y: 250 };
const DNS: Pt = { x: 690, y: 170 };
const PANEL = { x: 840, y: 230, w: 400, h: 360 };
const SERVER_PORT: Pt = { x: 840, y: 390 };
const WEB: Pt = { x: 935, y: 330 };
const DB: Pt = { x: 1145, y: 330 };
const CACHE: Pt = { x: 1040, y: 465 };
const LAPTOP: Pt = { x: 190, y: 250 };
const PHONE: Pt = { x: 190, y: 500 };

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  dns: 24,
  http: 62,
  sources: 92,
  growth: 140,
  end: 180,
} as const;

const STEPS = [
  { at: 33, text: '1 · Ask DNS' },
  { at: 44, text: '2 · Get the IP' },
  { at: 63, text: '3 · HTTP request' },
  { at: 72, text: '4 · HTML / JSON back' },
];

function StepRail({ time }: { time: number }) {
  const o = fadeWindow(time, 26, T.sources + 2, 0.6);
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      {STEPS.map((s, i) => {
        const on = time >= s.at;
        const x = 250 + i * 190;
        return (
          <g key={s.text}>
            {i > 0 && <line x1={x - 120} y1={52} x2={x - 72} y2={52} stroke={time >= s.at ? C.cyan : C.line} strokeWidth={2} />}
            <Chip x={x} y={52} text={s.text} color={on ? C.cyan : C.dim} filled={on && time < s.at + 1.2} size={14} />
          </g>
        );
      })}
    </g>
  );
}

/** Little PixelPost home page drawn inside the browser. */
function PixelPostPage({ time, start }: { time: number; start: number }) {
  if (time < start) return null;
  const tiles = [C.violet, C.cyan, C.rose, C.amber, C.emerald, C.sky];
  return (
    <g>
      <Appear p={progress(time, start, start + 0.5)} from="down" distance={10}>
        <rect x={16} y={14} width={408} height={34} rx={10} fill={C.panel2} />
        <circle cx={36} cy={31} r={9} fill={C.violet} />
        <text x={54} y={37} fill={C.white} fontSize={17} fontWeight={800}>PixelPost</text>
      </Appear>
      {tiles.map((c, i) => {
        const p = progress(time, start + 0.4 + i * 0.25, start + 0.9 + i * 0.25, ease.outBack);
        const x = 16 + (i % 3) * 138;
        const y = 60 + Math.floor(i / 3) * 74;
        return p > 0 ? (
          <g key={i} transform={`translate(${x + 63} ${y + 32}) scale(${p}) translate(${-x - 63} ${-y - 32})`}>
            <rect x={x} y={y} width={126} height={64} rx={10} fill={`${c}33`} stroke={c} strokeWidth={1.5} />
            <path d={`M${x + 14} ${y + 52} L${x + 44} ${y + 26} L${x + 64} ${y + 44} L${x + 82} ${y + 32} L${x + 112} ${y + 52} Z`} fill={c} opacity={0.7} />
            <circle cx={x + 100} cy={y + 18} r={7} fill={c} />
          </g>
        ) : null;
      })}
    </g>
  );
}

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;

  /* --- user counter: 1 until the growth chapter, then climbs to 1,000 --- */
  const users = Math.round(tween(t, 143, 166, 1, 1000, ease.inQuad));

  /* --- server load / state --- */
  const cpu = between(t, T.growth, T.end + 1) ? tween(t, 143, 168, 0.12, 1.12, ease.inQuad) : t >= 63 && t < 92 ? 0.18 : 0.08;
  const serverState: NodeState = cpu > 1 ? 'overloaded' : cpu > 0.8 ? 'busy' : between(t, 68, 72) || between(t, 98, 104) || between(t, 116, 121) ? 'active' : 'idle';
  const panelOpacity = progress(t, 6, 7);
  const ipShown = t >= 49;

  /* --- browser vs. the two-device view --- */
  const browserAppear = t < T.sources ? progress(t, 24, 25) : 1 - progress(t, T.sources, T.sources + 1);
  const devices = progress(t, T.sources + 0.8, T.sources + 2);
  const browserPath = [BROWSER_PORT, { x: 660, y: 310 }, SERVER_PORT];
  const laptopPath = linkPath(LAPTOP, SERVER_PORT, -20, 60);
  const phonePath = linkPath(PHONE, SERVER_PORT, 20, 60);
  const reverse = (p: Pt[]) => [...p].reverse();

  /* --- growth swarm: deterministic request dots from many clients --- */
  const swarm =
    t >= 142
      ? Array.from({ length: 140 }, (_, i) => {
          const spawn = 142 + 36 * Math.sqrt(i / 140) + hash(i) * 0.6; // more frequent over time
          const from = { x: 60 + hash(i * 3) * 220, y: 170 + hash(i * 7) * 420 };
          return { i, spawn, path: [from, { x: 560 + hash(i * 11) * 80, y: 380 + (hash(i * 5) - 0.5) * 120 }, SERVER_PORT] };
        })
      : [];

  return (
    <Stage time={t} drift title="Level 1 lesson: a single server and the request flow">
      {/* ---------------- Chapter 1: title + single server ---------------- */}
      <Title text="Hello, World" kicker="LEVEL 1 · 1 USER" subtitle="PixelPost's very first server" y={150}
        appear={t < 6 ? progress(t, 0.3, 1.3) : 1 - progress(t, 5, 6)} />
      <Counter x={1140} y={52} value={users} time={t} bump={between(t, 143, 167)} />
      <StepRail time={t} />

      {/* server panel */}
      <Hotspot id="single-server" interactive={interactive} onClick={onHotspot} active={t >= 7} x={PANEL.x + PANEL.w} y={PANEL.y} time={t} label="The single server">
        <Panel x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} title="One server" color={cpu > 1 ? C.rose : cpu > 0.8 ? C.amber : C.cyan}
          opacity={panelOpacity} tint={cpu > 0.8 ? 0.14 : 0.07} />
      </Hotspot>
      <Node kind="web" label="Web app" x={WEB.x} y={WEB.y} size={84} time={t} state={serverState} appear={progress(t, 8, 8.8)} glow={serverState === 'active'} />
      <Node kind="db" label="Database" x={DB.x} y={DB.y} size={84} time={t} state={cpu > 1 ? 'overloaded' : cpu > 0.8 ? 'busy' : 'idle'} appear={progress(t, 9.5, 10.3)} />
      <Node kind="cache" label="Cache" x={CACHE.x} y={CACHE.y} size={84} time={t} state={cpu > 0.9 ? 'busy' : 'idle'} appear={progress(t, 11, 11.8)} />
      {t >= 8.8 && <Link from={WEB} to={DB} inset={50} color={C.emerald} draw={progress(t, 10.3, 11)} width={2} animated={between(t, 68, 72)} time={t} />}
      {t >= 11.8 && <Link from={WEB} to={CACHE} inset={50} color={C.amber} draw={progress(t, 11.8, 12.4)} width={2} />}
      <Packet along={linkPath(WEB, DB, 0, 45)} time={t} start={68.6} end={69.8} color={C.emerald} size={6} />
      <Packet along={linkPath(DB, WEB, 0, 45)} time={t} start={70} end={71.2} color={C.emerald} size={6} />
      {panelOpacity > 0 && (
        <Meter x={PANEL.x + 30} y={PANEL.y + PANEL.h - 22} w={PANEL.w - 60} value={cpu} label="CPU (shared by everything)" />
      )}
      {ipShown && (
        <Hotspot id="ip" interactive={interactive} onClick={onHotspot} x={1110 - 90} y={PANEL.y} time={t} label="IP address">
          <Chip x={1110} y={PANEL.y} text={IP} color={C.amber} appear={progress(t, 49, 49.8)} />
        </Hotspot>
      )}
      {t >= 7 && (
        <StatusBadge x={1040} y={PANEL.y + PANEL.h + 34} time={t}
          status={cpu > 1 ? 'down' : cpu > 0.8 ? 'warn' : 'ok'} text={cpu > 1 ? 'Timeouts' : cpu > 0.8 ? 'Slow' : 'Online'} />
      )}
      <Callout x={420} y={430} width={340} title="Everything on one box" color={C.cyan}
        text="Web app, database and cache all share a single machine. Simple to start with, and the classic first step."
        appear={fadeWindow(t, 12.5, 23.5, 0.5)} pointTo={{ x: PANEL.x, y: 470 }} />
      <Character who="ravi" mood="happy" x={170} y={330} size={130} time={t} talking={between(t, 14, 20)}
        appear={fadeWindow(t, 13, 23.5, 0.5)} say="Every giant system starts life as one humble box." />

      {/* ---------------- Chapter 2: DNS ---------------- */}
      <BrowserWindow x={BROWSER.x} y={BROWSER.y} w={BROWSER.w} h={BROWSER.h} url={URL_TEXT}
        chars={t < 26 ? 0 : (t - 26) * 2.6} caret={t < 34} appear={browserAppear}>
        {t >= 77 && <PixelPostPage time={t} start={77} />}
        {between(t, 34, 77) && (
          <text x={220} y={110} textAnchor="middle" fill={C.dim} fontSize={18}>
            {t < 49 ? 'Looking up address…' : t < 72 ? 'Connecting…' : 'Receiving…'}
          </text>
        )}
      </BrowserWindow>
      <Hotspot id="dns" interactive={interactive} onClick={onHotspot} active={between(t, 31, T.sources - 1)} x={DNS.x + 52} y={DNS.y - 52} time={t} label="DNS">
        <Node kind="dns" label="DNS (3rd party)" x={DNS.x} y={DNS.y} time={t} appear={progress(t, 30, 31) - progress(t, T.sources - 1, T.sources)}
          state={between(t, 37.5, 44.5) ? 'active' : 'idle'} glow={between(t, 37.5, 44.5)} />
      </Hotspot>
      {between(t, 33, 62) && (
        <Link from={BROWSER_PORT} to={DNS} inset={8} color={C.violet} dashed draw={progress(t, 33, 34)} opacity={1 - progress(t, 60, 62)} />
      )}
      <Packet along={linkPath(BROWSER_PORT, DNS, 0, 60)} time={t} start={34} end={38} color={C.violet} label={`${URL_TEXT}?`} shape="envelope" />
      <Packet along={linkPath(DNS, BROWSER_PORT, 0, 60)} time={t} start={44} end={48.5} color={C.amber} label={IP} />
      <Callout x={505} y={262} width={320} title="DNS = the internet's phone book" color={C.violet} size={15}
        text="It turns api.pixelpost.com into an IP address. Usually a paid service from a third party, not something we host."
        appear={fadeWindow(t, 38.5, 51, 0.5)} pointTo={{ x: DNS.x, y: DNS.y + 54 }} />
      {between(t, 48.5, 62) && (
        <g>
          <Chip x={BROWSER.x + BROWSER.w / 2} y={BROWSER.y + BROWSER.h + 40} text={`IP: ${IP}`} color={C.amber} filled appear={progress(t, 48.5, 49.3)} size={18} />
          <CheckMark x={BROWSER.x + BROWSER.w / 2 + 150} y={BROWSER.y + BROWSER.h + 40} t={progress(t, 49.3, 50.3)} size={36} />
        </g>
      )}

      {/* ---------------- Chapter 3: HTTP round trip ---------------- */}
      {between(t, 62.5, 92) && (
        <Link from={BROWSER_PORT} to={{ x: 660, y: 310 }} inset={0} color={C.cyan} draw={progress(t, 62.5, 63.2)} opacity={1 - progress(t, 90, 92)} />
      )}
      {between(t, 63.2, 92) && (
        <Link from={{ x: 660, y: 310 }} to={SERVER_PORT} inset={0} color={C.cyan} draw={progress(t, 63.2, 63.8)} animated time={t} arrow opacity={1 - progress(t, 90, 92)} />
      )}
      <Packet along={browserPath} time={t} start={63.5} end={68} color={C.cyan} label="GET / (HTTP)" shape="envelope" />
      <Packet along={reverse(browserPath)} time={t} start={72} end={76.5} color={C.emerald} label="HTML" shape="envelope" />
      <Callout x={540} y={470} width={260} title="Straight to our server" color={C.cyan} size={15}
        text={`With the IP in hand, the browser sends HTTP requests directly to ${IP}.`}
        appear={fadeWindow(t, 64, 72, 0.4)} pointTo={{ x: 660, y: 318 }} />
      <Callout x={540} y={470} width={260} title="HTML comes back" color={C.emerald} size={15}
        text="The web server answers with an HTML page that the browser renders."
        appear={fadeWindow(t, 76, 90, 0.4)} pointTo={{ x: 600, y: 290 }} />

      {/* ---------------- Chapter 4: web vs mobile ---------------- */}
      <Node kind="client" label="Web app (browser)" x={LAPTOP.x} y={LAPTOP.y} time={t} appear={between(t, T.sources, T.growth + 1) ? devices * (1 - progress(t, T.growth, T.growth + 1)) : 0}
        state={between(t, 96, 106) ? 'active' : 'idle'} />
      <Node kind="mobile" label="Mobile app" x={PHONE.x} y={PHONE.y} time={t} appear={between(t, T.sources, T.growth + 1) ? devices * (1 - progress(t, T.growth, T.growth + 1)) : 0}
        state={between(t, 114, 124) ? 'active' : 'idle'} />
      {between(t, 94, 140) && (
        <>
          <Link from={LAPTOP} to={SERVER_PORT} inset={60} bend={-20} color={C.sky} draw={progress(t, 94, 95)} animated time={t} label="HTTP" opacity={1 - progress(t, 138, 140)} />
          <Link from={PHONE} to={SERVER_PORT} inset={60} bend={20} color={C.sky} draw={progress(t, 94.5, 95.5)} animated time={t} label="HTTP" opacity={1 - progress(t, 138, 140)} />
        </>
      )}
      <Packet along={laptopPath} time={t} start={96} end={99} color={C.sky} label="GET /" shape="envelope" />
      <Packet along={reverse(laptopPath)} time={t} start={102} end={105} color={C.emerald} label="HTML + JS" shape="envelope" />
      <Appear p={fadeWindow(t, 98, 113, 0.5)} from="pop" x={WEB.x} y={WEB.y - 70}>
        <Chip x={WEB.x - 40} y={WEB.y - 72} text="Java" color={C.amber} size={13} />
        <Chip x={WEB.x + 40} y={WEB.y - 72} text="Python" color={C.amber} size={13} />
      </Appear>
      <Appear p={fadeWindow(t, 104, 113, 0.5)} from="pop" x={LAPTOP.x + 150} y={LAPTOP.y}>
        <Chip x={LAPTOP.x + 120} y={LAPTOP.y - 30} text="HTML" color={C.rose} size={13} />
        <Chip x={LAPTOP.x + 135} y={LAPTOP.y + 6} text="JavaScript" color={C.amber} size={13} />
      </Appear>
      <Callout x={380} y={70} width={400} title="Web application" color={C.sky} size={15}
        text="Server-side code (Java, Python…) runs the business logic and storage. Client-side HTML + JavaScript handle presentation in the browser."
        appear={fadeWindow(t, 99, 113, 0.5)} />
      <Packet along={phonePath} time={t} start={115} end={118.5} color={C.sky} label="GET /users/12" shape="envelope" />
      <Packet along={reverse(phonePath)} time={t} start={120.5} end={124} color={C.amber} label="JSON" shape="envelope" />
      <Hotspot id="json" interactive={interactive} onClick={onHotspot} active={between(t, 124, 139)} x={780} y={120} time={t} label="JSON response">
        <CodeBlock x={350} y={120} width={430} title="GET /users/12  →  200 OK" code={USER_JSON}
          chars={(t - 124) * 34} appear={fadeWindow(t, 123.5, 139.5, 0.5)} color={C.amber} />
      </Hotspot>
      <Callout x={380} y={52} width={360} title="Mobile app" color={C.amber} size={15}
        text="Speaks HTTP too. The answer is usually JSON: small, simple and easy to parse."
        appear={fadeWindow(t, 115.5, 123.3, 0.4)} />

      {/* ---------------- Chapter 5: growing pains ---------------- */}
      {swarm.map((s) => (
        <Packet key={s.i} along={s.path} time={t} start={s.spawn} end={s.spawn + 1.6} color={hash(s.i * 13) > 0.5 ? C.sky : C.cyan} size={6} />
      ))}
      {t >= 142 &&
        Array.from({ length: 12 }, (_, i) => {
          const at = 142 + i * 1.9;
          return (
            <Node key={i} kind={i % 2 ? 'mobile' : 'client'} label="" x={90 + (i % 3) * 110} y={190 + Math.floor(i / 3) * 120} size={58}
              time={t} appear={progress(t, at, at + 0.6)} />
          );
        })}
      <Smoke x={1040} y={PANEL.y + 10} time={t} intensity={progress(t, 161, 168)} seed={4} />
      <Smoke x={950} y={PANEL.y + 30} time={t} intensity={progress(t, 164, 170) * 0.7} seed={9} />
      <Hotspot id="cpu" interactive={interactive} onClick={onHotspot} active={t >= 150} x={PANEL.x + PANEL.w} y={PANEL.y + PANEL.h} time={t} label="Shared CPU" />
      <Character who="maya" mood="happy" x={610} y={560} size={110} time={t} talking={between(t, 145, 150)}
        appear={fadeWindow(t, 144, 155, 0.5)} say="We just hit 1,000 users! Champagne!" />
      <Character who="pager" mood="panic" x={640} y={560} size={100} time={t} talking={between(t, 160, 165)}
        appear={fadeWindow(t, 158, 170, 0.4)} say="BZZT! CPU at 100%. Requests are timing out!" bubble="left" />
      <Character who="ravi" mood="worried" x={640} y={565} size={110} time={t} talking={between(t, 171, 177)}
        appear={fadeWindow(t, 170.5, 180.5, 0.5)} say="The web app and the database are fighting over one CPU. Time to split them up." bubble="left" />
    </Stage>
  );
}
