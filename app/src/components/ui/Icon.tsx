import * as icons from 'lucide-react';
import type { ReactElement } from 'react';

export interface IconProps {
  /** lucide icon name — PascalCase ('Flame') or kebab-case ('trending-up'). */
  name: string;
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}

const toPascal = (name: string): string =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');

type IconComponent = (props: { size?: number | string; className?: string; strokeWidth?: number }) => ReactElement;

const registry = icons as unknown as Record<string, IconComponent>;

/** Renders a lucide icon resolved by name string. Falls back to a help circle. */
export function Icon({ name, size = 18, className, strokeWidth = 2 }: IconProps) {
  const key = toPascal(name);
  const Cmp = registry[key] ?? registry[`${key}Icon`] ?? registry.HelpCircle;
  return <Cmp size={size} className={className} strokeWidth={strokeWidth} />;
}
