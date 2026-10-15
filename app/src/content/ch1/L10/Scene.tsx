import type { LessonSceneProps } from '@/types/content';
import {
  Appear, C, Callout, Character, CheckMark, Chip, Counter, CrossMark, Hotspot, Label, Link, Meter, Node, Packet,
  Smoke, Stage, Title, between, clamp, ease, fadeWindow, hash, progress, tween, type NodeState, type Pt,
} from '@/scenekit';
import { FILTERS } from './data';

/** Chapter cue times (also used by lesson.ts). */
export const T = {
  intro: 0,
  what: 22,
  decouple: 56,
  photo: 86,
  scale: 118,
  end: 162,
} as const;

/* ------------------------------ queue widget ------------------------------ */
const Q = { x: 440, y: 330, w: 400, h: 70, slots: 12 };
const PRODUCER: Pt = { x: 230, y: 365 };
const CONSUMER: Pt = { x: 1060, y: 365 };

function QueueTube({ length, time, label, color = C.amber }: { length: number; time: number; label: string; color?: string }) {
  const n = Math.max(0, Math.min(Q.slots, Math.round(length)));
  const slotW = Q.w / Q.slots;
  return (
    <g>
      <rect x={Q.x} y={Q.y} width={Q.w} height={Q.h} rx={18} fill={C.panel} stroke={n >= Q.slots - 1 ? C.rose : color} strokeWidth={2.5} />
      {Array.from({ length: n }, (_, i) => {
        // newest at the tail (left), oldest at the head (right)
        const x = Q.x + Q.w - (i + 1) * slotW + 4;
        const wob = Math.sin(time * 3 + i) * 1.5;
        return (
          <g key={i}>
            <rect x={x} y={Q.y + 14 + wob} width={slotW - 8} height={Q.h - 28} rx={6} fill={hash(i) > 0.5 ? C.amber : C.orange} opacity={0.9} />
            <rect x={x + 6} y={Q.y + 24 + wob} width={slotW - 20} height={4} rx={2} fill={C.bg} opacity={0.5} />
          </g>
        );
      })}
      <Label x={Q.x + Q.w / 2} y={Q.y - 16} text={label} size={16} color={color} weight={800} />
      <Label x={Q.x + Q.w / 2} y={Q.y + Q.h + 26} text={`${n} message${n === 1 ? '' : 's'} waiting`} size={14} color={C.dim} />
      <Label x={Q.x - 6} y={Q.y + Q.h + 26} text="tail" size={12} color={C.dim} anchor="start" />
      <Label x={Q.x + Q.w + 6} y={Q.y + Q.h + 26} text="head" size={12} color={C.dim} anchor="end" />
    </g>
  );
}

/** Queue length over the lesson (deterministic story of the buffer). */
function queueLength(t: number): number {
  if (t < T.decouple + 2) return 2 + Math.round(pulseStep(t));
  if (t < 70) return tween(t, 58, 70, 3, 11, ease.linear); // consumer down: grows
  if (t < 76) return tween(t, 70, 75, 11, 5, ease.linear); // consumer back: drains
  if (t < T.photo) return tween(t, 76, 84, 5, 0, ease.linear); // producer down: consumer empties it
  if (t < T.scale) return 2 + Math.round(pulseStep(t));
  if (t < 136) return tween(t, 121, 134, 2, 12, ease.linear); // burst, 2 workers
  if (t < 146) return tween(t, 136, 145, 12, 1, ease.linear); // 5 workers drain
  return 0;
}
const pulseStep = (t: number) => (Math.sin(t * 1.7) + 1) / 2;

export default function Scene({ time, interactive, onHotspot }: LessonSceneProps) {
  const t = time;
  const users = Math.round(tween(t, 146, 156, 2_000_000, 3_000_000, ease.inOutQuad));

  /* ---------------- intro: synchronous filters choke the web tier ---------------- */
  const introO = fadeWindow(t, 5, T.what, 0.6);
  const cpu = tween(t, 7, 16, 0.3, 1.1, ease.inQuad);
  const spinner = Math.min(21, Math.max(0, (t - 8) * 2.2));

  /* ---------------- figure 1-17 + decoupling ---------------- */
  const modelO = fadeWindow(t, T.what + 0.5, T.photo, 0.6);
  const consumerDown = between(t, 58, 70);
  const producerDown = between(t, 76, T.photo);
  const qLen = queueLength(t);

  /* ---------------- figure 1-18 + scaling ---------------- */
  const photoO = fadeWindow(t, T.photo + 0.5, T.end + 1, 0.6);
  const workers = t < 135 ? 2 : t < 147 ? 2 + Math.min(3, Math.floor(progress(t, 135, 138) * 3.99)) : 5 - Math.min(3, Math.floor(progress(t, 148, 154) * 3.99));
  const workerY = (i: number) => 175 + i * 105;

  // message dots in/out of the queue (chapters 2-5)
  const inMsgs = (from: Pt, startAt: number, endAt: number, every: number, skip: (s: number) => boolean) =>
    Array.from({ length: Math.max(0, Math.floor((endAt - startAt) / every)) }, (_, i) => {
      const s = startAt + i * every;
      return skip(s) ? null : <Packet key={`in${i}`} along={[from, { x: Q.x - 4, y: Q.y + Q.h / 2 }]} time={t} start={s} end={s + 1.4} color={C.amber} size={7} trail={false} />;
    });

  return (
    <Stage time={t} drift title="Level 10 lesson: message queues">
      <Title text="Take a Number" kicker="LEVEL 10 · 3M USERS" subtitle="Message queues" y={130}
        appear={t < 6 ? progress(t, 0.3, 1.3) : 1 - progress(t, 5, 6)} />
      <Counter x={1140} y={52} value={users} time={t} bump={between(t, 146, 156)} />

      {/* ====================== intro ====================== */}
      {introO > 0 && (
        <g opacity={introO}>
          {Array.from({ length: 5 }, (_, i) => (
            <Node key={i} kind={i % 2 ? 'mobile' : 'client'} label="" x={150} y={150 + i * 105} size={60} time={t} />
          ))}
          {Array.from({ length: 14 }, (_, i) => {
            const s = 7 + i * 0.95;
            return <Packet key={i} along={[{ x: 190, y: 150 + (i % 5) * 105 }, { x: 600, y: 370 }]} time={t} start={s} end={s + 1.6} color={C.sky} size={6} label={i === 0 ? 'upload + blur' : undefined} />;
          })}
          <Node kind="web" label="Web servers" x={640} y={370} size={120} time={t} state={cpu > 1 ? 'overloaded' : cpu > 0.75 ? 'busy' : 'active'} />
          <Meter x={540} y={470} w={200} value={cpu} label="CPU" />
          {FILTERS.map((f, i) => (
            <Chip key={f} x={540 + i * 100} y={250} text={`${f}…`} color={C.rose} size={14} appear={progress(t, 8 + i * 0.6, 8.6 + i * 0.6, ease.outBack)} />
          ))}
          <Smoke x={640} y={300} time={t} intensity={progress(t, 14, 18)} seed={3} />
          <g opacity={progress(t, 9, 10)}>
            <circle cx={960} cy={370} r={46} fill="none" stroke={C.line} strokeWidth={8} />
            <path d={`M960 324 A46 46 0 0 1 ${960 + 46 * Math.sin(t * 5)} ${370 - 46 * Math.cos(t * 5)}`} fill="none" stroke={C.rose} strokeWidth={8} strokeLinecap="round" />
            <Label x={960} y={378} text={`${spinner.toFixed(0)} s`} size={22} color={C.white} weight={800} />
            <Label x={960} y={445} text="user waits for the filter to finish" size={14} color={C.dim} />
          </g>
          <Character who="maya" mood="panic" x={1110} y={590} size={100} time={t} talking={between(t, 15, 20)} bubble="left"
            appear={fadeWindow(t, 14.5, 21.5, 0.4)} say="Twenty seconds to post a selfie?!" />
        </g>
      )}

      {/* ====================== the model + decoupling ====================== */}
      {modelO > 0 && (
        <g opacity={modelO}>
          <Hotspot id="queue" interactive={interactive} onClick={onHotspot} active={between(t, 26, T.photo)} x={Q.x + Q.w} y={Q.y - 10} time={t} label="Message queue">
            <QueueTube length={qLen} time={t} label="Message queue" />
          </Hotspot>
          <Node kind="web" label="Producer / publisher" x={PRODUCER.x} y={PRODUCER.y} size={100} time={t}
            state={producerDown ? 'down' : 'active'} appear={progress(t, 27, 28)} />
          <Node kind="worker" label="Consumer / subscriber" x={CONSUMER.x} y={CONSUMER.y} size={100} time={t}
            state={consumerDown ? 'down' : 'active'} appear={progress(t, 32, 33)} />
          <Link from={PRODUCER} to={{ x: Q.x, y: Q.y + Q.h / 2 }} inset={0} width={2} color={C.line} dashed />
          <Link from={{ x: Q.x + Q.w, y: Q.y + Q.h / 2 }} to={CONSUMER} inset={0} width={2} color={C.line} dashed />
          {t >= 28 && inMsgs({ x: PRODUCER.x + 52, y: PRODUCER.y }, 28.5, T.photo, 2, (s) => between(s, 76, T.photo))}
          {t >= 33 &&
            Array.from({ length: 26 }, (_, i) => {
              const s = 34 + i * 2;
              if (between(s, 57, 70.5) || s > 84) return null;
              const fast = between(s, 70, 76);
              return <Packet key={`out${i}`} along={[{ x: Q.x + Q.w + 4, y: Q.y + Q.h / 2 }, { x: CONSUMER.x - 52, y: CONSUMER.y }]} time={t} start={s} end={s + (fast ? 0.8 : 1.4)} color={C.emerald} size={7} trail={false} />;
            })}
          <Callout x={300} y={70} width={680} title="Message queue" color={C.amber} size={15}
            text="A durable component, stored in memory, that supports asynchronous communication. It buffers messages and distributes asynchronous requests."
            appear={fadeWindow(t, 23, 38, 0.4)} />
          <Callout x={300} y={70} width={680} title="Producers and consumers" color={C.amber} size={15}
            text="Producers (publishers) create messages and publish them to the queue. Consumers (subscribers) connect to the queue and perform the actions the messages describe."
            appear={fadeWindow(t, 38.5, 55.5, 0.4)} />
          <Hotspot id="decoupling" interactive={interactive} onClick={onHotspot} active={between(t, 58, T.photo)} x={980} y={500} time={t} label="Decoupling">
            <Callout x={300} y={500} width={680} title={producerDown ? 'Producer down: consumer keeps reading' : consumerDown ? 'Consumer down: producer keeps posting' : 'Decoupled'} color={producerDown || consumerDown ? C.rose : C.emerald} size={15}
              text={producerDown ? 'The consumer can read messages from the queue even when the producer is unavailable.' : 'The producer can post messages even when the consumer is not available to process them. They wait safely in the queue.'}
              appear={fadeWindow(t, 58.5, T.photo - 0.5, 0.4)} />
          </Hotspot>
          {consumerDown && <CrossMark x={CONSUMER.x} y={CONSUMER.y - 80} t={progress(t, 58.5, 59.3)} size={34} />}
          {producerDown && <CrossMark x={PRODUCER.x} y={PRODUCER.y - 80} t={progress(t, 76.5, 77.3)} size={34} />}
        </g>
      )}

      {/* ====================== photo processing + scaling ====================== */}
      {photoO > 0 && (
        <g opacity={photoO}>
          <Node kind="client" label="Users" x={110} y={365} size={80} time={t} />
          <Node kind="web" label="Web servers (producers)" x={290} y={365} size={96} time={t} state="active" />
          <Link from={{ x: 110, y: 365 }} to={{ x: 290, y: 365 }} inset={48} width={2} color={C.sky} />
          <QueueTube length={qLen} time={t} label="Photo processing queue" />
          {Array.from({ length: 5 }, (_, i) => {
            const on = i < workers;
            const st: NodeState = on ? (qLen > 8 ? 'busy' : qLen > 0.5 ? 'active' : 'idle') : 'ghost';
            return (
              <g key={i}>
                <Node kind="worker" label={i === 0 ? 'Photo workers (consumers)' : ''} x={1060} y={workerY(i)} size={70} time={t} state={st}
                  appear={on ? 1 : t >= T.scale ? 0.35 : 0} />
                {on && <Link from={{ x: Q.x + Q.w, y: Q.y + Q.h / 2 }} to={{ x: 1060, y: workerY(i) }} inset={36} width={1.5} color={C.emerald} opacity={0.6} />}
              </g>
            );
          })}
          {inMsgs({ x: 340, y: 365 }, 90, 146, 1.1, (s) => between(s, 136, 146) && hash(s * 10) > 0.6)}
          {Array.from({ length: 40 }, (_, i) => {
            const s = 91 + i * 1.3;
            const w = i % Math.max(1, workers);
            return s < 147 ? <Packet key={`w${i}`} along={[{ x: Q.x + Q.w + 4, y: Q.y + Q.h / 2 }, { x: 1020, y: workerY(w) }]} time={t} start={s} end={s + 1} color={C.emerald} size={6} trail={false} /> : null;
          })}
          {/* user gets an instant reply */}
          <Packet along={[{ x: 250, y: 330 }, { x: 150, y: 330 }]} time={t} start={92} end={93.2} color={C.emerald} label="202 · uploaded!" shape="envelope" />
          <CheckMark x={110} y={280} t={progress(t, 93, 94)} size={34} />
          <Appear p={fadeWindow(t, 95, T.scale, 0.4)} from="pop" x={1060} y={110}>
            {FILTERS.map((f, i) => <Chip key={f} x={960 + i * 95} y={110} text={f} color={C.emerald} filled size={13} />)}
          </Appear>
          <Hotspot id="workers" interactive={interactive} onClick={onHotspot} active={t >= 92} x={1110} y={130} time={t} label="Photo processing workers" />
          <Callout x={330} y={470} width={620} title="Photo customization goes async" color={C.emerald} size={15}
            text="Web servers publish photo processing jobs to the queue and reply right away. Workers pick the jobs up and crop, sharpen and blur asynchronously."
            appear={fadeWindow(t, 96, T.scale - 0.5, 0.4)} />
          <Hotspot id="scale" interactive={interactive} onClick={onHotspot} active={t >= T.scale + 1} x={640} y={480} time={t} label="Scaling workers">
            {t >= T.scale && (
              <g>
                <Meter x={440} y={520} w={400} value={clamp(qLen / 12, 0, 1.2)} label="Queue size" />
                <Chip x={640} y={580} text={`${workers} worker${workers === 1 ? '' : 's'}`} color={C.cyan} filled size={18} />
              </g>
            )}
          </Hotspot>
          <Callout x={330} y={620} width={620} title={t < 135 ? 'Scale each side independently' : t < 147 ? 'Queue is big → add workers' : 'Queue mostly empty → fewer workers'} color={C.cyan} size={14}
            text={t < 135 ? 'Producers and consumers can be scaled on their own. Watch the queue during a burst.' : t < 147 ? 'More consumers drain the queue and cut the processing time.' : 'Idle workers cost money, so reduce them when there is nothing to do.'}
            appear={fadeWindow(t, T.scale + 1, 157, 0.4)} />
        </g>
      )}
      <Character who="pager" mood="neutral" x={1200} y={640} size={90} time={t} talking={between(t, 157, 161)} bubble="left"
        appear={fadeWindow(t, 156.5, T.end + 1, 0.4)} say="bzzt… can you even see what I break?" />
    </Stage>
  );
}
