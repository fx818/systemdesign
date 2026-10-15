/**
 * Chapter 3 scene helpers: the interview room. Pure functions of their props (deterministic),
 * built on top of @/scenekit so they can be scrubbed and rendered to video.
 */
import type { ReactNode } from 'react';
import type { CharacterId } from '@/types/content';
import { C, CHARACTER_META, FONT, MONO, clamp, ease, pulse, wrapText } from '@/scenekit';
import { SESSION_MIN, STEPS } from './framework';

/** The 4-step framework as a horizontal rail. `active` = 1..4 (0 = none highlighted). */
export function FrameworkRail({ x = 640, y = 46, active, time, appear = 1, done = 0 }: { x?: number; y?: number; active: number; time: number; appear?: number; done?: number }) {
  if (appear <= 0) return null;
  const w = 238;
  const gap = 14;
  const total = STEPS.length * w + (STEPS.length - 1) * gap;
  const x0 = x - total / 2;
  return (
    <g opacity={clamp(appear)}>
      {STEPS.map((s, i) => {
        const on = s.n === active;
        const finished = s.n <= done;
        const bx = x0 + i * (w + gap);
        const glow = on ? 0.5 + 0.5 * pulse(time, 1.4) : 0;
        return (
          <g key={s.n}>
            {on && <rect x={bx - 4} y={y - 24} width={w + 8} height={48} rx={18} fill={s.color} opacity={0.18 * glow} filter="url(#sk-soft)" />}
            <rect x={bx} y={y - 20} width={w} height={40} rx={14} fill={on ? `${s.color}33` : C.panel} stroke={on || finished ? s.color : C.line} strokeWidth={on ? 2.5 : 1.5} />
            <circle cx={bx + 22} cy={y} r={12} fill={on || finished ? s.color : C.panel2} />
            <text x={bx + 22} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={900} fill={on || finished ? C.bg : C.dim} fontFamily={FONT}>
              {finished && !on ? '✓' : s.n}
            </text>
            <text x={bx + 42} y={y + 6} fontSize={16} fontWeight={800} fill={on ? C.white : finished ? s.color : C.dim} fontFamily={FONT}>
              {s.short}
            </text>
            <text x={bx + w - 12} y={y + 5} textAnchor="end" fontSize={12} fontWeight={600} fill={C.dim} fontFamily={MONO}>
              {s.min}-{s.max}m
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** One chat message. (x, y) = top-left. `chars` reveals the text typewriter-style. */
export function ChatBubble({ x, y, w = 420, who, text, chars, appear = 1, side = 'left', tag, tone }: {
  x: number; y: number; w?: number; who: CharacterId; text: string; chars?: number; appear?: number; side?: 'left' | 'right';
  tag?: string; tone?: 'good' | 'bad';
}) {
  if (appear <= 0) return null;
  const meta = CHARACTER_META[who];
  const color = tone === 'good' ? C.emerald : tone === 'bad' ? C.rose : meta.color;
  const lines = wrapText(text, Math.floor((w - 36) / 9.4));
  const shown = chars === undefined ? Infinity : Math.max(0, Math.floor(chars));
  let budget = shown;
  const h = 46 + lines.length * 24;
  const e = ease.outBack(clamp(appear));
  const cx = side === 'left' ? x : x + w;
  return (
    <g opacity={clamp(appear * 1.6)} transform={`translate(${cx} ${y}) scale(${Math.max(0.001, e)}) translate(${-cx} ${-y})`}>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={C.panel} stroke={color} strokeWidth={2} />
      <rect x={x} y={y} width={w} height={h} rx={18} fill={color} opacity={0.07} />
      <text x={x + 18} y={y + 26} fontSize={14} fontWeight={800} fill={color} fontFamily={FONT}>
        {meta.name}{tag ? ` · ${tag}` : ''}
      </text>
      {lines.map((l, i) => {
        const part = l.slice(0, Math.max(0, budget));
        budget -= l.length + 1;
        return (
          <text key={i} x={x + 18} y={y + 52 + i * 24} fontSize={17} fontWeight={500} fill={C.text} fontFamily={FONT}>
            {part}
          </text>
        );
      })}
    </g>
  );
}

/** A 45-minute interview clock: coloured step sectors + a hand at `minute`. */
export function InterviewClock({ x, y, r = 90, minute, appear = 1, plan, label = true }: {
  x: number; y: number; r?: number; minute: number; appear?: number; plan?: number[]; label?: boolean;
}) {
  if (appear <= 0) return null;
  const mins = plan ?? STEPS.map((s) => (s.min + s.max) / 2);
  const total = mins.reduce((a, b) => a + b, 0) || 1;
  const scale = SESSION_MIN / total;
  const arc = (a0: number, a1: number, rr: number) => {
    const p = (a: number) => ({ x: x + rr * Math.sin(a), y: y - rr * Math.cos(a) });
    const s = p(a0);
    const e = p(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${x} ${y} L${s.x.toFixed(2)} ${s.y.toFixed(2)} A${rr} ${rr} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
  };
  let acc = 0;
  const m = clamp(minute, 0, SESSION_MIN);
  const hand = (m / SESSION_MIN) * Math.PI * 2;
  const sc = Math.max(0.001, ease.outBack(clamp(appear)));
  return (
    <g transform={`translate(${x} ${y}) scale(${sc}) translate(${-x} ${-y})`} opacity={clamp(appear * 1.5)}>
      <circle cx={x} cy={y} r={r + 10} fill={C.panel} stroke={C.line} strokeWidth={2} />
      {mins.map((v, i) => {
        const a0 = (acc / SESSION_MIN) * Math.PI * 2;
        acc += v * scale;
        const a1 = (acc / SESSION_MIN) * Math.PI * 2;
        return <path key={i} d={arc(a0, Math.max(a0 + 0.001, a1 - 0.01), r)} fill={STEPS[i].color} opacity={acc - v * scale < m ? 0.85 : 0.25} />;
      })}
      <circle cx={x} cy={y} r={r * 0.55} fill={C.bg} />
      <line x1={x} y1={y} x2={x + r * 0.95 * Math.sin(hand)} y2={y - r * 0.95 * Math.cos(hand)} stroke={C.white} strokeWidth={4} strokeLinecap="round" />
      <circle cx={x} cy={y} r={6} fill={C.white} />
      {label && (
        <text x={x} y={y + r * 0.3} textAnchor="middle" fontSize={r * 0.2} fontWeight={800} fill={C.white} fontFamily={MONO}>
          {Math.floor(m)}:{String(Math.floor((m % 1) * 60)).padStart(2, '0')}
        </text>
      )}
    </g>
  );
}

/** A whiteboard panel with a marker tray. */
export function Whiteboard({ x, y, w, h, appear = 1, title, children }: { x: number; y: number; w: number; h: number; appear?: number; title?: string; children?: ReactNode }) {
  if (appear <= 0) return null;
  return (
    <g opacity={clamp(appear * 1.4)}>
      <rect x={x} y={y} width={w} height={h} rx={20} fill="#0b1324" stroke={C.line} strokeWidth={3} />
      <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} rx={14} fill="none" stroke={C.panel2} strokeWidth={1.5} />
      <rect x={x + w / 2 - 80} y={y + h - 2} width={160} height={10} rx={5} fill={C.panel2} />
      {[C.cyan, C.rose, C.emerald].map((c, i) => <rect key={c} x={x + w / 2 - 60 + i * 44} y={y + h - 6} width={34} height={8} rx={4} fill={c} />)}
      {title && (
        <text x={x + 26} y={y + 40} fontSize={20} fontWeight={800} fill={C.dim} fontFamily={FONT}>
          {title}
        </text>
      )}
      {children}
    </g>
  );
}

/** A tilted sticky note for written-down assumptions / requirements. */
export function StickyNote({ x, y, text, color = C.amber, appear = 1, rot = -3, w = 200 }: { x: number; y: number; text: string; color?: string; appear?: number; rot?: number; w?: number }) {
  if (appear <= 0) return null;
  const lines = wrapText(text, Math.floor((w - 24) / 8.6));
  const h = 24 + lines.length * 21;
  const sc = Math.max(0.001, ease.outBack(clamp(appear)));
  return (
    <g transform={`translate(${x + w / 2} ${y + h / 2}) rotate(${rot}) scale(${sc}) translate(${-w / 2} ${-h / 2})`} opacity={clamp(appear * 1.5)}>
      <rect x={3} y={4} width={w} height={h} rx={6} fill="#000" opacity={0.35} />
      <rect width={w} height={h} rx={6} fill={color} />
      {lines.map((l, i) => (
        <text key={i} x={12} y={28 + i * 21} fontSize={16} fontWeight={700} fill={C.bg} fontFamily={FONT}>
          {l}
        </text>
      ))}
    </g>
  );
}

/** A checklist row with a tick or a cross. */
export function CheckRow({ x, y, text, ok, appear = 1, w = 480, size = 17 }: { x: number; y: number; text: string; ok: boolean; appear?: number; w?: number; size?: number }) {
  if (appear <= 0) return null;
  const color = ok ? C.emerald : C.rose;
  const p = clamp(appear);
  return (
    <g opacity={clamp(p * 1.6)} transform={`translate(${(1 - ease.outCubic(p)) * -30} 0)`}>
      <rect x={x} y={y - 20} width={w} height={36} rx={12} fill={`${color}14`} stroke={`${color}66`} strokeWidth={1.5} />
      <circle cx={x + 20} cy={y - 2} r={11} fill={color} />
      <text x={x + 20} y={y + 3} textAnchor="middle" fontSize={14} fontWeight={900} fill={C.bg} fontFamily={FONT}>
        {ok ? '✓' : '✕'}
      </text>
      <text x={x + 42} y={y + 4} fontSize={size} fontWeight={600} fill={C.text} fontFamily={FONT}>
        {text}
      </text>
    </g>
  );
}

/** Simple labelled box for whiteboard box diagrams (not a ComponentKind). */
export function Box({ x, y, w = 170, h = 54, text, color = C.cyan, appear = 1, state }: { x: number; y: number; w?: number; h?: number; text: string; color?: string; appear?: number; state?: 'hot' | 'dim' }) {
  if (appear <= 0) return null;
  const sc = Math.max(0.001, ease.outBack(clamp(appear)));
  const col = state === 'hot' ? C.rose : state === 'dim' ? C.dim : color;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={state === 'dim' ? 0.5 : 1}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={C.panel} stroke={col} strokeWidth={2.5} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={col} opacity={0.1} />
      <text y={6} textAnchor="middle" fontSize={16} fontWeight={800} fill={C.white} fontFamily={FONT}>
        {text}
      </text>
    </g>
  );
}
