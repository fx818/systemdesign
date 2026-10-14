import type { ComponentKind } from '@/types/content';
import type { ReactNode } from 'react';
import { KIND_COLOR } from './theme';

export interface KindIconProps {
  kind: ComponentKind;
  /** Box size in px (icon is drawn centered on 0,0 in its parent's coordinates). */
  size?: number;
  color?: string;
  /** 0..1 — LEDs / activity intensity (purely visual). */
  activity?: number;
}

/**
 * Recognisable glyph for every ComponentKind, drawn in a 100x100 box centred
 * on (0,0) and scaled to `size`. Pure SVG, no state.
 */
export function KindIcon({ kind, size = 72, color, activity = 0 }: KindIconProps) {
  const c = color ?? KIND_COLOR[kind];
  const s = size / 100;
  const fill = `${c}22`;
  const sw = 3.5;
  const common = { stroke: c, strokeWidth: sw, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const led = (on: boolean) => (on ? c : `${c}55`);
  let body: ReactNode;

  switch (kind) {
    case 'client':
      body = (
        <g {...common}>
          <rect x={-34} y={-30} width={68} height={44} rx={5} fill={fill} />
          <rect x={-28} y={-24} width={56} height={32} rx={2} fill="none" strokeWidth={1.5} opacity={0.6} />
          <path d="M-44 22 H44 L38 30 H-38 Z" fill={fill} />
          <line x1={-8} y1={26} x2={8} y2={26} strokeWidth={2} />
        </g>
      );
      break;
    case 'mobile':
      body = (
        <g {...common}>
          <rect x={-20} y={-38} width={40} height={76} rx={8} fill={fill} />
          <line x1={-6} y1={-31} x2={6} y2={-31} strokeWidth={3} />
          <rect x={-14} y={-24} width={28} height={46} rx={2} fill="none" strokeWidth={1.5} opacity={0.6} />
          <circle cx={0} cy={30} r={3} fill={c} stroke="none" />
        </g>
      );
      break;
    case 'dns':
      body = (
        <g {...common} fill="none">
          <circle r={34} fill={fill} />
          <ellipse rx={14} ry={34} />
          <line x1={-34} y1={0} x2={34} y2={0} />
          <path d="M-29 -17 Q0 -10 29 -17" />
          <path d="M-29 17 Q0 10 29 17" />
        </g>
      );
      break;
    case 'lb':
      body = (
        <g {...common} fill="none">
          <rect x={-36} y={-36} width={72} height={72} rx={14} fill={fill} />
          <circle cx={-16} cy={0} r={6} fill={c} />
          <path d="M-10 0 H2 M2 0 L20 -18 M2 0 H22 M2 0 L20 18" />
          <path d="M14 -20 L21 -19 L20 -12 M16 -5 L22 0 L16 5 M14 20 L21 19 L20 12" />
        </g>
      );
      break;
    case 'web':
      body = (
        <g {...common}>
          {[-30, -8, 14].map((y, i) => (
            <g key={y}>
              <rect x={-34} y={y} width={68} height={18} rx={4} fill={fill} />
              <circle cx={-24} cy={y + 9} r={3} fill={led(activity > i * 0.33)} stroke="none" />
              <circle cx={-15} cy={y + 9} r={3} fill={led(activity > i * 0.33 + 0.15)} stroke="none" />
              <line x1={4} y1={y + 9} x2={26} y2={y + 9} strokeWidth={2} opacity={0.6} />
            </g>
          ))}
        </g>
      );
      break;
    case 'db':
    case 'db-replica':
    case 'session-store':
    case 'nosql': {
      const cyl = (dx: number, dy: number, k: number) => (
        <g transform={`translate(${dx} ${dy}) scale(${k})`} {...common}>
          <path d="M-30 -24 V24 A30 10 0 0 0 30 24 V-24" fill={fill} />
          <ellipse cx={0} cy={-24} rx={30} ry={10} fill={fill} />
          <path d="M-30 -2 A30 10 0 0 0 30 -2" fill="none" opacity={0.7} />
        </g>
      );
      if (kind === 'db-replica')
        body = (
          <g>
            {cyl(10, -6, 0.8)}
            {cyl(-8, 8, 0.8)}
          </g>
        );
      else if (kind === 'nosql')
        body = (
          <g>
            {cyl(0, 0, 1)}
            <text x={0} y={18} textAnchor="middle" fontSize={22} fontWeight={800} fill={c} fontFamily="monospace">{'{}'}</text>
          </g>
        );
      else if (kind === 'session-store')
        body = (
          <g>
            {cyl(0, 0, 1)}
            <g {...common} fill="none" transform="translate(0 12)">
              <circle cx={-8} cy={0} r={6} />
              <path d="M-2 0 H14 M10 0 V6 M14 0 V5" />
            </g>
          </g>
        );
      else body = cyl(0, 0, 1);
      break;
    }
    case 'cache':
      body = (
        <g {...common}>
          <rect x={-34} y={-34} width={68} height={68} rx={14} fill={fill} />
          <path d="M6 -26 L-14 4 H0 L-6 26 L16 -6 H2 Z" fill={c} />
        </g>
      );
      break;
    case 'cdn':
      body = (
        <g {...common}>
          <path d="M-30 18 A16 16 0 0 1 -26 -12 A20 20 0 0 1 10 -22 A18 18 0 0 1 32 -2 A14 14 0 0 1 28 18 Z" fill={fill} />
          {[-16, 0, 16].map((x) => (
            <circle key={x} cx={x} cy={4} r={3.5} fill={c} stroke="none" />
          ))}
        </g>
      );
      break;
    case 'queue':
      body = (
        <g {...common}>
          <rect x={-40} y={-18} width={80} height={36} rx={8} fill="none" />
          {[-28, -10, 8].map((x, i) => (
            <rect key={x} x={x} y={-10} width={14} height={20} rx={3} fill={i < 2 ? c : fill} />
          ))}
          <path d="M30 -6 L38 0 L30 6" fill="none" />
        </g>
      );
      break;
    case 'worker': {
      const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
      body = (
        <g {...common}>
          {teeth.map((a) => (
            <rect key={a} x={-6} y={-36} width={12} height={14} rx={2} fill={c} stroke="none" transform={`rotate(${a})`} />
          ))}
          <circle r={25} fill={fill} />
          <circle r={9} fill="none" />
        </g>
      );
      break;
    }
    case 'datacenter':
      body = (
        <g {...common}>
          <path d="M-38 34 V-18 L0 -36 L38 -18 V34 Z" fill={fill} />
          {[-22, 0, 22].map((x) => (
            <g key={x}>
              <rect x={x - 7} y={-8} width={14} height={36} rx={2} fill="none" strokeWidth={2} />
              <circle cx={x} cy={0} r={2} fill={c} stroke="none" />
              <circle cx={x} cy={10} r={2} fill={c} stroke="none" />
            </g>
          ))}
        </g>
      );
      break;
    case 'shard':
      body = (
        <g {...common}>
          {[-24, 0, 24].map((x, i) => (
            <g key={x} transform={`translate(${x} ${i === 1 ? -8 : 6})`}>
              <path d="M-11 -14 V14 A11 4 0 0 0 11 14 V-14" fill={fill} strokeWidth={2.5} />
              <ellipse cx={0} cy={-14} rx={11} ry={4} fill={fill} strokeWidth={2.5} />
            </g>
          ))}
        </g>
      );
      break;
    case 'logging':
      body = (
        <g {...common}>
          <path d="M-26 -36 H16 L28 -24 V36 H-26 Z" fill={fill} />
          <path d="M16 -36 V-24 H28" fill="none" />
          {[-12, 0, 12, 24].map((y, i) => (
            <line key={y} x1={-16} y1={y} x2={i % 2 ? 6 : 18} y2={y} strokeWidth={2.5} />
          ))}
        </g>
      );
      break;
    case 'metrics':
      body = (
        <g {...common}>
          <rect x={-36} y={-34} width={72} height={68} rx={8} fill={fill} />
          <path d="M-26 18 L-10 0 L4 10 L24 -18" fill="none" />
          <circle cx={24} cy={-18} r={4} fill={c} />
        </g>
      );
      break;
    case 'ci':
      body = (
        <g {...common} fill="none">
          <path d="M-8 0 C-20 -24 -42 -16 -40 0 C-38 16 -20 24 -8 0 C4 -24 26 -16 28 0 C30 16 8 24 -4 2" />
          <path d="M24 -14 L30 -2 L18 0" />
        </g>
      );
      break;
    case 'storage':
      body = (
        <g {...common}>
          <path d="M-32 -22 L-24 32 H24 L32 -22 Z" fill={fill} />
          <ellipse cx={0} cy={-22} rx={32} ry={9} fill={fill} />
        </g>
      );
      break;
  }

  return <g transform={`scale(${s})`}>{body}</g>;
}
