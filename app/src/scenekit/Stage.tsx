import type { CSSProperties, ReactNode } from 'react';
import { C, FONT } from './theme';

export const STAGE_W = 1280;
export const STAGE_H = 720;

export interface StageProps {
  children?: ReactNode;
  /** Seconds — only used for the optional slow grid drift. */
  time?: number;
  grid?: boolean;
  /** Grid drifts slowly with time (still deterministic). */
  drift?: boolean;
  vignette?: boolean;
  /** Accessible description of the scene. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Root <svg> for every scene: 1280x720 viewBox, slate-950 background,
 * neon grid, vignette and shared filters (`url(#sk-glow)`, `url(#sk-glow-strong)`,
 * `url(#sk-soft)`). Scales to fill its parent while keeping 16:9.
 */
export function Stage({ children, time = 0, grid = true, drift = false, vignette = true, title, className, style }: StageProps) {
  const off = drift ? (time * 6) % 40 : 0;
  return (
    <svg
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={title}
      className={className}
      style={{ display: 'block', background: C.bg, fontFamily: FONT, ...style }}
    >
      <StageDefs />
      <rect width={STAGE_W} height={STAGE_H} fill={C.bg} />
      <rect width={STAGE_W} height={STAGE_H} fill="url(#sk-bg-glow)" />
      {grid && (
        <g transform={`translate(${-off} ${-off})`} opacity={0.55}>
          <rect width={STAGE_W + 80} height={STAGE_H + 80} fill="url(#sk-grid)" />
        </g>
      )}
      {children}
      {vignette && <rect width={STAGE_W} height={STAGE_H} fill="url(#sk-vignette)" pointerEvents="none" />}
    </svg>
  );
}

/** Shared <defs>. Rendered by <Stage>; render it yourself only if you build your own <svg>. */
export function StageDefs() {
  return (
    <defs>
      <pattern id="sk-grid" width={40} height={40} patternUnits="userSpaceOnUse">
        <path d="M40 0 H0 V40" fill="none" stroke="#1e293b" strokeWidth={1} />
        <circle cx={0} cy={0} r={1.4} fill="#334155" />
      </pattern>
      <radialGradient id="sk-vignette" cx="50%" cy="50%" r="75%">
        <stop offset="60%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#000" stopOpacity={0.75} />
      </radialGradient>
      <radialGradient id="sk-bg-glow" cx="50%" cy="38%" r="65%">
        <stop offset="0%" stopColor="#1e1b4b" stopOpacity={0.55} />
        <stop offset="100%" stopColor={C.bg} stopOpacity={0} />
      </radialGradient>
      <filter id="sk-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={4} result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="sk-glow-strong" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation={10} result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="sk-soft" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={8} />
      </filter>
      <filter id="sk-grey">
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>
  );
}
