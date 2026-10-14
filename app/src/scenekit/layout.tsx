import type { ReactNode } from 'react';
import { C, FONT } from './theme';
import { clamp, ease } from './time';

export interface AppearProps {
  /** 0..1 entrance progress (e.g. progress(time, 3, 3.6)). 0 = hidden. */
  p: number;
  /** Entrance style. */
  from?: 'fade' | 'up' | 'down' | 'left' | 'right' | 'scale' | 'pop';
  /** Pivot for scale/pop. */
  x?: number;
  y?: number;
  distance?: number;
  children?: ReactNode;
}

/** Wraps children with an entrance animation driven by `p` (0..1). Renders nothing at p <= 0. */
export function Appear({ p, from = 'up', x = 0, y = 0, distance = 30, children }: AppearProps) {
  if (p <= 0) return null;
  const k = clamp(p);
  const e = ease.outCubic(k);
  let tf = '';
  if (from === 'up') tf = `translate(0 ${(1 - e) * distance})`;
  else if (from === 'down') tf = `translate(0 ${-(1 - e) * distance})`;
  else if (from === 'left') tf = `translate(${-(1 - e) * distance} 0)`;
  else if (from === 'right') tf = `translate(${(1 - e) * distance} 0)`;
  else if (from === 'scale' || from === 'pop') {
    const s = from === 'pop' ? Math.max(0.001, ease.outBack(k)) : 0.6 + 0.4 * e;
    tf = `translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`;
  }
  return (
    <g transform={tf || undefined} opacity={Math.min(1, k * 1.6)}>
      {children}
    </g>
  );
}

export interface PanelProps {
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  color?: string;
  dashed?: boolean;
  /** 0..1 fill strength. */
  tint?: number;
  opacity?: number;
  children?: ReactNode;
}

/** Rounded neon container ("everything runs on this one server", "Data tier", ...). */
export function Panel({ x, y, w, h, title, color = C.cyan, dashed, tint = 0.08, opacity = 1, children }: PanelProps) {
  const a = Math.round(clamp(tint) * 255)
    .toString(16)
    .padStart(2, '0');
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={22} fill={`${color}${a}`} stroke={color} strokeWidth={2}
        strokeDasharray={dashed ? '10 8' : undefined} strokeOpacity={0.8} />
      {title && (
        <g>
          <rect x={x + 18} y={y - 14} width={title.length * 9.4 + 24} height={28} rx={14} fill={C.bg} stroke={color} strokeWidth={1.5} />
          <text x={x + 30} y={y + 5} fill={color} fontSize={15} fontWeight={700} fontFamily={FONT} letterSpacing={1}>
            {title.toUpperCase()}
          </text>
        </g>
      )}
      {children}
    </g>
  );
}

export interface MeterProps {
  x: number;
  y: number;
  w?: number;
  /** 0..1+ (values above 1 render as "overloaded"). */
  value: number;
  label?: string;
  /** Force a colour; default goes emerald -> amber -> rose with value. */
  color?: string;
  showValue?: boolean;
}

/** Horizontal load bar (CPU, memory...). */
export function Meter({ x, y, w = 160, value, label, color, showValue = true }: MeterProps) {
  const v = Math.max(0, value);
  const col = color ?? (v < 0.6 ? C.emerald : v < 0.85 ? C.amber : C.rose);
  return (
    <g transform={`translate(${x} ${y})`}>
      {label && (
        <text x={0} y={-8} fill={C.text} fontSize={14} fontWeight={600} fontFamily={FONT}>
          {label}
        </text>
      )}
      {showValue && (
        <text x={w} y={-8} fill={col} fontSize={14} fontWeight={800} textAnchor="end" fontFamily={FONT}>
          {Math.round(v * 100)}%
        </text>
      )}
      <rect width={w} height={12} rx={6} fill={C.panel2} />
      <rect width={Math.min(1, v) * w} height={12} rx={6} fill={col} filter={v > 0.85 ? 'url(#sk-glow)' : undefined} />
    </g>
  );
}
