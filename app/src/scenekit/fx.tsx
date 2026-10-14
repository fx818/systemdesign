import { C } from './theme';
import { clamp, ease, hash } from './time';

export interface ExplosionProps {
  x: number;
  y: number;
  /** 0..1 progress of the blast (e.g. progress(time, 40, 41.2)). Hidden at 0 and 1. */
  t: number;
  size?: number;
  color?: string;
  seed?: number;
}

/** Flash + shockwave + flying shards. Deterministic given `t` and `seed`. */
export function Explosion({ x, y, t, size = 120, color = C.rose, seed = 1 }: ExplosionProps) {
  if (t <= 0 || t >= 1) return null;
  const e = ease.outCubic(t);
  const shards = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + hash(seed * 31 + i) * 0.5;
    const d = size * (0.4 + hash(seed * 17 + i) * 0.8) * e;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d + t * t * 40, a: (a * 180) / Math.PI, l: 6 + hash(seed + i * 3) * 12 };
  });
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      <circle r={size * 0.55 * (0.3 + e)} fill={C.amber} opacity={(1 - t) * 0.55} filter="url(#sk-soft)" />
      <circle r={size * 0.35 * (1 - t)} fill={C.white} opacity={(1 - t) * 0.9} />
      <circle r={size * e} fill="none" stroke={color} strokeWidth={6 * (1 - t) + 1} opacity={1 - t} />
      {shards.map((s, i) => (
        <rect key={i} x={-s.l / 2} y={-2} width={s.l} height={4} rx={2} fill={i % 3 ? color : C.amber}
          opacity={1 - t} transform={`translate(${s.x} ${s.y}) rotate(${s.a + t * 200})`} />
      ))}
    </g>
  );
}

export interface SmokeProps {
  x: number;
  y: number;
  /** Seconds — puffs loop continuously with time. */
  time: number;
  /** 0..1 how much smoke. 0 renders nothing. */
  intensity?: number;
  seed?: number;
  color?: string;
}

/** Rising looping smoke puffs (overheating / dead server). */
export function Smoke({ x, y, time, intensity = 1, seed = 1, color = '#94a3b8' }: SmokeProps) {
  if (intensity <= 0) return null;
  const puffs = Array.from({ length: 7 }, (_, i) => {
    const speed = 0.45 + hash(seed * 13 + i) * 0.3;
    const life = (((time * speed + i / 7 + hash(seed + i)) % 1) + 1) % 1;
    const drift = (hash(seed * 7 + i) - 0.5) * 60;
    return { x: drift * life + Math.sin(time * 2 + i) * 6, y: -life * 130, r: 10 + life * 30, o: (1 - life) * 0.45 * clamp(intensity) * clamp(life * 6) };
  });
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      {puffs.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={color} opacity={p.o} filter="url(#sk-soft)" />
      ))}
    </g>
  );
}

export interface MarkProps {
  x: number;
  y: number;
  /** 0..1 draw progress. */
  t: number;
  size?: number;
  color?: string;
}

/** Circle + tick that draws itself. */
export function CheckMark({ x, y, t, size = 48, color = C.emerald }: MarkProps) {
  if (t <= 0) return null;
  const k = clamp(t);
  const ring = ease.outCubic(clamp(k * 1.6));
  const tick = ease.outCubic(clamp((k - 0.35) / 0.65));
  const r = size / 2;
  const len = size * 0.9;
  return (
    <g transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * ease.outBack(ring)})`}>
      <circle r={r} fill={`${color}22`} stroke={color} strokeWidth={3} opacity={ring} />
      <path d={`M${-r * 0.45} 0 L${-r * 0.1} ${r * 0.35} L${r * 0.5} ${-r * 0.35}`} fill="none" stroke={color} strokeWidth={size / 10}
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${len * tick} ${len}`} />
    </g>
  );
}

/** Circle + X that draws itself (wrong answer / failure). */
export function CrossMark({ x, y, t, size = 48, color = C.rose }: MarkProps) {
  if (t <= 0) return null;
  const k = clamp(t);
  const ring = ease.outCubic(clamp(k * 1.6));
  const a = ease.outCubic(clamp((k - 0.3) / 0.35));
  const b = ease.outCubic(clamp((k - 0.6) / 0.4));
  const q = size * 0.2;
  const len = q * 2 * Math.SQRT2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={size / 2} fill={`${color}22`} stroke={color} strokeWidth={3} opacity={ring} />
      <g stroke={color} strokeWidth={size / 10} strokeLinecap="round">
        <line x1={-q} y1={-q} x2={q} y2={q} strokeDasharray={`${len * a} ${len}`} />
        <line x1={q} y1={-q} x2={-q} y2={q} strokeDasharray={`${len * b} ${len}`} />
      </g>
    </g>
  );
}

export interface SparklesProps {
  x: number;
  y: number;
  /** 0..1 burst progress. */
  t: number;
  radius?: number;
  seed?: number;
  colors?: string[];
}

/** Celebration burst of confetti stars (success moments). */
export function Sparkles({ x, y, t, radius = 110, seed = 3, colors = [C.cyan, C.violet, C.emerald, C.amber, C.rose] }: SparklesProps) {
  if (t <= 0 || t >= 1) return null;
  const e = ease.outCubic(t);
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2 + hash(seed + i) * 0.4;
        const d = radius * (0.5 + hash(seed * 5 + i) * 0.6) * e;
        const s = 4 + hash(seed * 9 + i) * 5;
        return (
          <path key={i} d={`M0 ${-s} L${s * 0.3} ${-s * 0.3} L${s} 0 L${s * 0.3} ${s * 0.3} L0 ${s} L${-s * 0.3} ${s * 0.3} L${-s} 0 L${-s * 0.3} ${-s * 0.3} Z`}
            fill={colors[i % colors.length]} opacity={1 - t}
            transform={`translate(${Math.cos(a) * d} ${Math.sin(a) * d + t * t * 30}) rotate(${t * 180 + i * 20})`} />
        );
      })}
    </g>
  );
}
