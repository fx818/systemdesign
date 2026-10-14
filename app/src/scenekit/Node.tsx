import type { ComponentKind } from '@/types/content';
import { KindIcon } from './icons';
import { C, FONT, KIND_COLOR, KIND_LABEL } from './theme';
import { clamp, ease, pulse, shake } from './time';

export type NodeState = 'idle' | 'active' | 'busy' | 'overloaded' | 'down' | 'ghost';

export interface NodeProps {
  kind: ComponentKind;
  x: number;
  y: number;
  /** Text under the card. Defaults to the kind's name; pass '' to hide. */
  label?: string;
  sublabel?: string;
  state?: NodeState;
  /** Glow halo: true or 0..1 strength. */
  glow?: boolean | number;
  /** Seconds — drives pulses/shakes for busy/overloaded states. */
  time?: number;
  /** Card size in px (default 104). */
  size?: number;
  color?: string;
  /** 0..1 entrance (pop-in). Omit for fully visible. */
  appear?: number;
  /** Optional 0..1+ load bar under the icon. */
  load?: number;
}

const STATE_COLOR: Partial<Record<NodeState, string>> = { busy: C.amber, overloaded: C.rose, down: C.dim };

/** A component card with a recognisable icon. Centred on (x, y). */
export function Node({ kind, x, y, label, sublabel, state = 'idle', glow, time = 0, size = 104, color, appear, load }: NodeProps) {
  if (appear !== undefined && appear <= 0) return null;
  const base = color ?? KIND_COLOR[kind];
  const col = STATE_COLOR[state] ?? base;
  const half = size / 2;
  const sc = appear === undefined ? 1 : Math.max(0.001, ease.outBack(clamp(appear)));
  const jitter = state === 'overloaded' ? shake(time, 3, x + y) : { x: 0, y: 0 };
  const glowAmt = state === 'down' || state === 'ghost' ? 0 : glow === true ? 1 : glow === false || glow === undefined ? (state === 'active' ? 0.8 : 0) : glow;
  const ringPulse = state === 'overloaded' ? pulse(time, 0.45) : state === 'busy' ? pulse(time, 0.9) : 0;
  const text = label ?? KIND_LABEL[kind];
  const activity = state === 'down' ? 0 : state === 'idle' ? 0.2 : state === 'busy' || state === 'overloaded' ? (pulse(time, 0.3) > 0.5 ? 1 : 0.5) : pulse(time, 1.5);

  return (
    <g transform={`translate(${x + jitter.x} ${y + jitter.y}) scale(${sc})`} opacity={state === 'ghost' ? 0.4 : state === 'down' ? 0.75 : 1}>
      {glowAmt > 0 && (
        <rect x={-half - 6} y={-half - 6} width={size + 12} height={size + 12} rx={28} fill={col} opacity={0.18 * glowAmt + 0.08 * ringPulse} filter="url(#sk-soft)" />
      )}
      {ringPulse > 0 && (
        <rect x={-half - 8 - ringPulse * 8} y={-half - 8 - ringPulse * 8} width={size + 16 + ringPulse * 16} height={size + 16 + ringPulse * 16}
          rx={30} fill="none" stroke={col} strokeWidth={2} opacity={1 - ringPulse} />
      )}
      <rect x={-half} y={-half} width={size} height={size} rx={22} fill={C.panel} stroke={col} strokeWidth={state === 'active' ? 3 : 2}
        strokeDasharray={state === 'ghost' ? '8 6' : undefined} />
      <rect x={-half} y={-half} width={size} height={size} rx={22} fill={col} opacity={0.06} />
      <g filter={state === 'down' ? 'url(#sk-grey)' : undefined} transform={load !== undefined ? 'translate(0 -6)' : undefined}>
        <KindIcon kind={kind} size={size * 0.62} color={state === 'down' ? C.dim : base} activity={activity} />
      </g>
      {load !== undefined && (
        <g transform={`translate(${-half + 14} ${half - 16})`}>
          <rect width={size - 28} height={6} rx={3} fill={C.panel2} />
          <rect width={(size - 28) * clamp(load)} height={6} rx={3} fill={load < 0.6 ? C.emerald : load < 0.85 ? C.amber : C.rose} />
        </g>
      )}
      {state === 'down' && (
        <g stroke={C.rose} strokeWidth={6} strokeLinecap="round" opacity={0.9}>
          <line x1={-half * 0.45} y1={-half * 0.45} x2={half * 0.45} y2={half * 0.45} />
          <line x1={half * 0.45} y1={-half * 0.45} x2={-half * 0.45} y2={half * 0.45} />
        </g>
      )}
      {text && (
        <text y={half + 24} textAnchor="middle" fill={state === 'down' ? C.dim : C.text} fontSize={17} fontWeight={700} fontFamily={FONT}>
          {text}
        </text>
      )}
      {sublabel && (
        <text y={half + 44} textAnchor="middle" fill={col} fontSize={14} fontWeight={600} fontFamily={FONT}>
          {sublabel}
        </text>
      )}
    </g>
  );
}
