import { C, FONT, MONO } from './theme';
import { clamp, ease, pulse, withCommas, type Pt } from './time';

/** Greedy word-wrap for SVG text (SVG has no auto-wrap). */
export function wrapText(text: string, maxChars: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      if (!line) line = word;
      else if ((line + ' ' + word).length <= maxChars) line += ' ' + word;
      else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

export interface LabelProps {
  x: number;
  y: number;
  text: string;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  opacity?: number;
  mono?: boolean;
  glow?: boolean;
}

/** Plain text in the scene font. */
export function Label({ x, y, text, size = 20, color = C.text, anchor = 'middle', weight = 600, opacity = 1, mono, glow }: LabelProps) {
  if (opacity <= 0) return null;
  return (
    <text x={x} y={y} fill={color} fontSize={size} fontWeight={weight} textAnchor={anchor} opacity={opacity}
      fontFamily={mono ? MONO : FONT} filter={glow ? 'url(#sk-glow)' : undefined}>
      {text}
    </text>
  );
}

export interface TitleProps {
  text: string;
  subtitle?: string;
  /** Small caps line above the title, e.g. "LEVEL 1 · 1 USER". */
  kicker?: string;
  x?: number;
  y?: number;
  /** 0..1 entrance. Default 1. */
  appear?: number;
  color?: string;
  size?: number;
}

/** Big glowing heading for chapter cards. */
export function Title({ text, subtitle, kicker, x = 640, y = 120, appear = 1, color = C.cyan, size = 56 }: TitleProps) {
  if (appear <= 0) return null;
  const e = ease.outCubic(clamp(appear));
  return (
    <g transform={`translate(${x} ${y + (1 - e) * 24})`} opacity={e}>
      {kicker && (
        <text y={-size * 0.95} textAnchor="middle" fill={C.violet} fontSize={16} fontWeight={800} letterSpacing={4} fontFamily={FONT}>
          {kicker}
        </text>
      )}
      <text textAnchor="middle" fill={color} fontSize={size} fontWeight={900} fontFamily={FONT} filter="url(#sk-glow)">
        {text}
      </text>
      <rect x={-e * 90} y={18} width={e * 180} height={4} rx={2} fill={color} opacity={0.8} />
      {subtitle && (
        <text y={56} textAnchor="middle" fill={C.text} fontSize={22} fontWeight={500} fontFamily={FONT} opacity={0.85}>
          {subtitle}
        </text>
      )}
    </g>
  );
}

export interface CalloutProps {
  x: number;
  y: number;
  width?: number;
  title?: string;
  text: string;
  color?: string;
  /** 0..1 entrance. Default 1. */
  appear?: number;
  /** Draw a leader line from the box to this point. */
  pointTo?: Pt;
  /** Font size of the body. */
  size?: number;
}

/** Info card with optional leader line. (x, y) is the top-left corner. */
export function Callout({ x, y, width = 300, title, text, color = C.amber, appear = 1, pointTo, size = 16 }: CalloutProps) {
  if (appear <= 0) return null;
  const e = ease.outBack(clamp(appear));
  const lines = wrapText(text, Math.floor((width - 32) / (size * 0.52)));
  const lh = size * 1.35;
  const h = 24 + (title ? 26 : 0) + lines.length * lh + 6;
  const cx = x + width / 2;
  const cy = y + h / 2;
  let anchor: Pt | null = null;
  if (pointTo) {
    const nx = Math.max(x, Math.min(x + width, pointTo.x));
    const ny = Math.max(y, Math.min(y + h, pointTo.y));
    anchor = { x: nx === pointTo.x && ny === pointTo.y ? cx : nx, y: ny };
  }
  return (
    <g opacity={clamp(appear * 1.5)}>
      {pointTo && anchor && (
        <g opacity={clamp(appear)}>
          <line x1={anchor.x} y1={anchor.y} x2={pointTo.x} y2={pointTo.y} stroke={color} strokeWidth={2} strokeDasharray="4 5" />
          <circle cx={pointTo.x} cy={pointTo.y} r={5} fill={color} />
        </g>
      )}
      <g transform={`translate(${cx} ${cy}) scale(${Math.max(0.001, e)}) translate(${-cx} ${-cy})`}>
        <rect x={x} y={y} width={width} height={h} rx={16} fill={C.panel} stroke={color} strokeWidth={2} />
        <rect x={x} y={y} width={6} height={h} rx={3} fill={color} />
        {title && (
          <text x={x + 20} y={y + 30} fill={color} fontSize={size + 2} fontWeight={800} fontFamily={FONT}>
            {title}
          </text>
        )}
        {lines.map((l, i) => (
          <text key={i} x={x + 20} y={y + (title ? 56 : 30) + i * lh} fill={C.text} fontSize={size} fontWeight={500} fontFamily={FONT}>
            {l}
          </text>
        ))}
      </g>
    </g>
  );
}

/** Very small JSON-ish tokenizer for colouring. */
function tokenize(line: string): { t: string; c: string }[] {
  const out: { t: string; c: string }[] = [];
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?)|(true|false|null)|([{}[\],:])|(\s+)|([^\s"{}[\],:]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) {
      out.push({ t: m[1], c: m[2] ? C.violet : C.emerald });
      if (m[2]) out.push({ t: m[2], c: C.dim });
    } else if (m[3]) out.push({ t: m[3], c: C.amber });
    else if (m[4]) out.push({ t: m[4], c: C.rose });
    else if (m[5]) out.push({ t: m[5], c: C.dim });
    else out.push({ t: m[0], c: C.text });
  }
  return out;
}

export interface CodeBlockProps {
  x: number;
  y: number;
  width?: number;
  /** Header text, e.g. "GET /users/12". */
  title?: string;
  code: string;
  /** Characters revealed so far (typewriter). Default: all. */
  chars?: number;
  color?: string;
  appear?: number;
  size?: number;
}

/** Terminal-style code card with JSON highlighting. (x, y) is top-left. */
export function CodeBlock({ x, y, width = 420, title, code, chars, color = C.cyan, appear = 1, size = 16 }: CodeBlockProps) {
  if (appear <= 0) return null;
  const shown = chars === undefined ? code : code.slice(0, Math.max(0, Math.floor(chars)));
  const all = code.split('\n');
  const lines = shown.split('\n');
  const lh = size * 1.45;
  const head = 40;
  const h = head + all.length * lh + 18;
  const e = ease.outCubic(clamp(appear));
  const typing = chars !== undefined && shown.length < code.length;
  return (
    <g transform={`translate(${x} ${y + (1 - e) * 20})`} opacity={e}>
      <rect width={width} height={h} rx={16} fill="#0b1222" stroke={color} strokeWidth={2} />
      <rect width={width} height={head} rx={16} fill={C.panel2} />
      <rect y={head - 16} width={width} height={16} fill={C.panel2} />
      {[C.rose, C.amber, C.emerald].map((c, i) => (
        <circle key={c} cx={22 + i * 18} cy={20} r={6} fill={c} />
      ))}
      {title && (
        <text x={86} y={26} fill={color} fontSize={15} fontWeight={700} fontFamily={MONO}>
          {title}
        </text>
      )}
      {lines.map((ln, i) => {
        let cx = 18;
        return (
          <text key={i} y={head + 14 + (i + 0.75) * lh} fontSize={size} fontFamily={MONO} xmlSpace="preserve">
            {tokenize(ln).map((tk, j) => {
              const el = (
                <tspan key={j} x={cx} fill={tk.c}>
                  {tk.t}
                </tspan>
              );
              cx += tk.t.length * size * 0.6;
              return el;
            })}
            {typing && i === lines.length - 1 && <tspan x={cx} fill={color}>▍</tspan>}
          </text>
        );
      })}
    </g>
  );
}

export interface CounterProps {
  x: number;
  y: number;
  value: number;
  label?: string;
  color?: string;
  /** Seconds — makes the badge glow briefly while `bump` is true. */
  time?: number;
  bump?: boolean;
}

/** The PixelPost user counter pill (top-right in most scenes). Centred on (x, y). */
export function Counter({ x, y, value, label = 'users', color = C.emerald, time = 0, bump }: CounterProps) {
  const num = withCommas(value);
  const w = Math.max(150, num.length * 17 + label.length * 9 + 70);
  const g = bump ? 0.5 + 0.5 * pulse(time, 0.4) : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      {g > 0 && <rect x={-w / 2 - 6} y={-28} width={w + 12} height={56} rx={28} fill={color} opacity={0.25 * g} filter="url(#sk-soft)" />}
      <rect x={-w / 2} y={-24} width={w} height={48} rx={24} fill={C.panel} stroke={color} strokeWidth={2} />
      <g transform={`translate(${-w / 2 + 26} 0)`}>
        <circle cx={0} cy={-5} r={6} fill={color} />
        <path d="M-10 11 A10 9 0 0 1 10 11" fill={color} />
      </g>
      <text x={-w / 2 + 46} y={9} fill={C.white} fontSize={26} fontWeight={900} fontFamily={MONO}>
        {num}
      </text>
      <text x={w / 2 - 18} y={7} textAnchor="end" fill={color} fontSize={15} fontWeight={700} fontFamily={FONT}>
        {label}
      </text>
    </g>
  );
}

export type Status = 'ok' | 'warn' | 'down' | 'info' | 'busy';
const STATUS_COLOR: Record<Status, string> = { ok: C.emerald, warn: C.amber, down: C.rose, info: C.cyan, busy: C.violet };

export interface StatusBadgeProps {
  x: number;
  y: number;
  status: Status;
  text: string;
  time?: number;
}

/** Small pill with a blinking status dot ("ONLINE", "500 ERRORS"...). Centred on (x, y). */
export function StatusBadge({ x, y, status, text, time = 0 }: StatusBadgeProps) {
  const col = STATUS_COLOR[status];
  const w = text.length * 9.5 + 46;
  const blink = status === 'down' || status === 'warn' ? 0.35 + 0.65 * pulse(time, 0.8) : 1;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-16} width={w} height={32} rx={16} fill={`${col}22`} stroke={col} strokeWidth={1.5} />
      <circle cx={-w / 2 + 18} cy={0} r={6} fill={col} opacity={blink} filter="url(#sk-glow)" />
      <text x={-w / 2 + 32} y={5} fill={col} fontSize={14} fontWeight={800} letterSpacing={1} fontFamily={FONT}>
        {text.toUpperCase()}
      </text>
    </g>
  );
}
