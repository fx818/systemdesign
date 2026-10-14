import type { ReactNode } from 'react';
import { C, FONT, MONO } from './theme';
import { clamp, ease } from './time';

export interface BrowserWindowProps {
  x: number;
  y: number;
  w?: number;
  h?: number;
  url: string;
  /** Characters of the URL typed so far (typewriter). Default: all. */
  chars?: number;
  /** Show the blinking caret even when fully typed. */
  caret?: boolean;
  appear?: number;
  color?: string;
  children?: ReactNode;
}

/** A browser window with an address bar. Children render inside the page area (local coords, origin at page top-left). */
export function BrowserWindow({ x, y, w = 420, h = 260, url, chars, caret, appear = 1, color = C.sky, children }: BrowserWindowProps) {
  if (appear <= 0) return null;
  const e = ease.outCubic(clamp(appear));
  const shown = chars === undefined ? url : url.slice(0, Math.max(0, Math.floor(chars)));
  const typing = caret || (chars !== undefined && shown.length < url.length);
  return (
    <g transform={`translate(${x} ${y + (1 - e) * 20})`} opacity={e}>
      <rect width={w} height={h} rx={16} fill={C.panel} stroke={color} strokeWidth={2} />
      <rect width={w} height={52} rx={16} fill={C.panel2} />
      <rect y={36} width={w} height={16} fill={C.panel2} />
      {[C.rose, C.amber, C.emerald].map((c, i) => (
        <circle key={c} cx={22 + i * 18} cy={26} r={6} fill={c} />
      ))}
      <rect x={84} y={11} width={w - 100} height={30} rx={15} fill={C.bg} stroke={color} strokeOpacity={0.5} />
      <g transform="translate(102 26)" stroke={C.emerald} strokeWidth={2} fill="none">
        <rect x={-5} y={-2} width={10} height={8} rx={2} fill={C.emerald} stroke="none" />
        <path d="M-3 -2 V-5 A3 3 0 0 1 3 -5 V-2" />
      </g>
      <text x={116} y={32} fill={C.text} fontSize={16} fontFamily={MONO}>
        {shown}
        {typing && <tspan fill={color}>▍</tspan>}
      </text>
      <g transform="translate(0 52)">{children}</g>
    </g>
  );
}

export interface DataTableProps {
  x: number;
  y: number;
  title: string;
  columns: string[];
  rows: (string | number)[][];
  /** Column widths in px (default 110 each). */
  widths?: number[];
  color?: string;
  /** Row indexes to highlight. */
  highlight?: number[];
  highlightColor?: string;
  appear?: number;
  /** Number of rows revealed (default all). */
  rowsShown?: number;
}

/** A relational table card (title + header + rows). (x, y) is top-left. Row i centre y = y + 64 + i*34 + 17. */
export function DataTable({ x, y, title, columns, rows, widths, color = C.emerald, highlight = [], highlightColor = C.amber, appear = 1, rowsShown }: DataTableProps) {
  if (appear <= 0) return null;
  const ws = widths ?? columns.map(() => 110);
  const W = ws.reduce((a, b) => a + b, 0);
  const n = rowsShown === undefined ? rows.length : Math.min(rows.length, Math.floor(rowsShown));
  const H = 64 + rows.length * 34 + 8;
  const e = ease.outCubic(clamp(appear));
  const xs = ws.map((_, i) => ws.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <g transform={`translate(${x} ${y + (1 - e) * 20})`} opacity={e}>
      <rect width={W} height={H} rx={14} fill={C.panel} stroke={color} strokeWidth={2} />
      <text x={14} y={22} fill={color} fontSize={15} fontWeight={800} fontFamily={MONO}>
        {title}
      </text>
      <rect y={32} width={W} height={30} fill={`${color}22`} />
      {columns.map((c, i) => (
        <text key={c} x={xs[i] + 12} y={52} fill={C.text} fontSize={14} fontWeight={700} fontFamily={MONO}>
          {c}
        </text>
      ))}
      {rows.slice(0, n).map((r, ri) => {
        const hl = highlight.includes(ri);
        return (
          <g key={ri} transform={`translate(0 ${64 + ri * 34})`}>
            {hl && <rect x={4} y={1} width={W - 8} height={32} rx={8} fill={`${highlightColor}33`} stroke={highlightColor} strokeWidth={1.5} />}
            {r.map((cell, ci) => (
              <text key={ci} x={xs[ci] + 12} y={22} fill={hl ? C.white : C.text} fontSize={14} fontFamily={MONO} opacity={hl ? 1 : 0.85}>
                {String(cell)}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
}

export interface ChipProps {
  x: number;
  y: number;
  text: string;
  color?: string;
  filled?: boolean;
  size?: number;
  appear?: number;
}

/** Small rounded tag ("MySQL", "JSON", "Step 2"...). Centred on (x, y). */
export function Chip({ x, y, text, color = C.cyan, filled, size = 15, appear = 1 }: ChipProps) {
  if (appear <= 0) return null;
  const w = text.length * size * 0.6 + 26;
  const s = Math.max(0.001, ease.outBack(clamp(appear)));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-w / 2} y={-size} width={w} height={size * 2} rx={size} fill={filled ? color : `${color}1f`} stroke={color} strokeWidth={1.5} />
      <text y={size * 0.36} textAnchor="middle" fill={filled ? C.bg : color} fontSize={size} fontWeight={700} fontFamily={FONT}>
        {text}
      </text>
    </g>
  );
}
