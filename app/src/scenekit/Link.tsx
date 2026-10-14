import { C, FONT } from './theme';
import { clamp, pathPoint, progress, type Pt } from './time';

/** Shorten the segment a->b by `inset` px at both ends (so links stop at card edges). */
export function insetSegment(a: Pt, b: Pt, inset: number): [Pt, Pt] {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const k = Math.min(inset, d / 2 - 1) / d;
  return [
    { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k },
    { x: b.x - (b.x - a.x) * k, y: b.y - (b.y - a.y) * k },
  ];
}

/**
 * Points along the link a->b, optionally curved by `bend` px (perpendicular offset
 * of the midpoint). Feed this to <Packet along={...}/> so packets follow the link.
 */
export function linkPath(a: Pt, b: Pt, bend = 0, inset = 0, n = 24): Pt[] {
  const [p, q] = inset ? insetSegment(a, b, inset) : [a, b];
  if (!bend) return [p, q];
  const mx = (p.x + q.x) / 2;
  const my = (p.y + q.y) / 2;
  const d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
  const cx = mx + (-(q.y - p.y) / d) * bend * 2;
  const cy = my + ((q.x - p.x) / d) * bend * 2;
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push({
      x: (1 - t) ** 2 * p.x + 2 * (1 - t) * t * cx + t * t * q.x,
      y: (1 - t) ** 2 * p.y + 2 * (1 - t) * t * cy + t * t * q.y,
    });
  }
  return out;
}

const toD = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
const polyLen = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);

export interface LinkProps {
  from: Pt;
  to: Pt;
  /** Flowing dashes (needs `time`). */
  animated?: boolean;
  time?: number;
  /** Flow speed in px/s (negative = reverse). */
  speed?: number;
  color?: string;
  width?: number;
  dashed?: boolean;
  label?: string;
  /** 0..1 draw-in progress. */
  draw?: number;
  /** Shorten both ends by this many px (default 60 ≈ half a Node card). */
  inset?: number;
  bend?: number;
  arrow?: boolean;
  state?: 'ok' | 'down' | 'hot';
  opacity?: number;
}

/** Connection between two points. Use `linkPath` with the same args to move packets along it. */
export function Link({ from, to, animated, time = 0, speed = 60, color = C.cyan, width = 3, dashed, label, draw = 1, inset = 60, bend = 0, arrow, state = 'ok', opacity = 1 }: LinkProps) {
  if (draw <= 0) return null;
  const pts = linkPath(from, to, bend, inset);
  const len = polyLen(pts);
  const col = state === 'down' ? C.dim : state === 'hot' ? C.rose : color;
  const drawing = draw < 1;
  const d = toD(pts);
  const end = pathPoint(pts, clamp(draw));
  const mid = pathPoint(pts, 0.5);
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={col} strokeWidth={width + 6} strokeOpacity={0.12} strokeLinecap="round"
        strokeDasharray={drawing ? `${len * draw} ${len}` : undefined} />
      <path d={d} fill="none" stroke={col} strokeWidth={width} strokeLinecap="round" strokeOpacity={state === 'down' ? 0.5 : 0.9}
        strokeDasharray={drawing ? `${len * draw} ${len}` : animated || dashed || state === 'down' ? '10 12' : undefined}
        strokeDashoffset={!drawing && animated ? -(time * speed) % 22 : undefined} />
      {arrow && (draw >= 1 || drawing) && (
        <path d="M-10 -7 L2 0 L-10 7" fill="none" stroke={col} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
          transform={`translate(${end.x} ${end.y}) rotate(${end.angle})`} />
      )}
      {label && draw >= 1 && (
        <g transform={`translate(${mid.x} ${mid.y})`}>
          <rect x={-label.length * 4.4 - 10} y={-13} width={label.length * 8.8 + 20} height={26} rx={13} fill={C.bg} stroke={col} strokeOpacity={0.6} />
          <text y={5} textAnchor="middle" fill={col} fontSize={14} fontWeight={700} fontFamily={FONT}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

export interface PacketProps {
  /** Polyline to travel along (e.g. linkPath(a, b) or [a, b, c]). */
  along: Pt[];
  /** 0..1 position. Either pass `t`, or `time` + `start` + `end` (hidden outside the window). */
  t?: number;
  time?: number;
  start?: number;
  end?: number;
  color?: string;
  label?: string;
  size?: number;
  trail?: boolean;
  /** 'dot' (default) or 'envelope' (an HTTP message). */
  shape?: 'dot' | 'envelope';
}

/** A glowing request/response dot moving along a path. */
export function Packet({ along, t, time, start, end, color = C.cyan, label, size = 9, trail = true, shape = 'dot' }: PacketProps) {
  let k: number;
  if (t !== undefined) k = t;
  else if (time !== undefined && start !== undefined && end !== undefined) {
    if (time < start || time > end) return null;
    k = progress(time, start, end, (x) => x * x * (3 - 2 * x));
  } else return null;
  const p = pathPoint(along, k);
  const ghosts = trail ? [0.06, 0.12, 0.18].map((dt) => pathPoint(along, Math.max(0, k - dt))) : [];
  return (
    <g>
      {ghosts.map((g, i) => (
        <circle key={i} cx={g.x} cy={g.y} r={size * (0.8 - i * 0.2)} fill={color} opacity={0.35 - i * 0.1} />
      ))}
      <g transform={`translate(${p.x} ${p.y})`}>
        <circle r={size * 2.2} fill={color} opacity={0.25} filter="url(#sk-soft)" />
        {shape === 'envelope' ? (
          <g filter="url(#sk-glow)">
            <rect x={-size * 1.4} y={-size} width={size * 2.8} height={size * 2} rx={3} fill={color} />
            <path d={`M${-size * 1.4} ${-size} L0 ${size * 0.2} L${size * 1.4} ${-size}`} fill="none" stroke={C.bg} strokeWidth={2} />
          </g>
        ) : (
          <circle r={size} fill={color} filter="url(#sk-glow)" />
        )}
        {label && (
          <g transform={`translate(0 ${-size - 22})`}>
            <rect x={-label.length * 4.3 - 10} y={-13} width={label.length * 8.6 + 20} height={26} rx={13} fill={C.bg} stroke={color} strokeWidth={1.5} />
            <text y={5} textAnchor="middle" fill={color} fontSize={14} fontWeight={700} fontFamily="ui-monospace, monospace">
              {label}
            </text>
          </g>
        )}
      </g>
    </g>
  );
}
