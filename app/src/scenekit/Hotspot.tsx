import type { ReactNode } from 'react';
import { C, FONT } from './theme';
import { pulse } from './time';

export interface HotspotProps {
  id: string;
  /** Usually LessonSceneProps.onHotspot. */
  onClick?: (id: string) => void;
  /** LessonSceneProps.interactive — when false (video export) this is a plain <g>. */
  interactive?: boolean;
  /** Set false while the target is off screen (no badge, not clickable). Default true. */
  active?: boolean;
  /** Position of the pulsing "?" badge. Omit to make only the children clickable. */
  x?: number;
  y?: number;
  /** Optional dashed ring radius drawn around the badge position. */
  ring?: number;
  /** Seconds — drives the badge pulse. */
  time?: number;
  /** Accessible name. */
  label?: string;
  color?: string;
  children?: ReactNode;
}

/**
 * Makes part of a scene clickable ("tap to explore"). Only interactive when
 * `interactive` and `active` are true, so exported video frames contain no hover UI.
 */
export function Hotspot({ id, onClick, interactive, active = true, x, y, ring, time = 0, label, color = C.amber, children }: HotspotProps) {
  if (!interactive || !onClick || !active) return <g>{children}</g>;
  const p = pulse(time, 1.6);
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label ?? id}
      data-hotspot={id}
      style={{ cursor: 'pointer', outline: 'none' }}
      onClick={() => onClick(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(id);
        }
      }}
    >
      {children}
      {x !== undefined && y !== undefined && (
        <g transform={`translate(${x} ${y})`} pointerEvents="all">
          {ring && <circle r={ring} fill="none" stroke={color} strokeWidth={2} strokeDasharray="6 8" opacity={0.25 + 0.35 * p} />}
          <circle r={14 + 12 * p} fill={color} opacity={0.35 * (1 - p)} />
          <circle r={14} fill={color} stroke={C.bg} strokeWidth={2} />
          <text y={5} textAnchor="middle" fontSize={16} fontWeight={900} fill={C.bg} fontFamily={FONT}>
            ?
          </text>
        </g>
      )}
    </g>
  );
}
