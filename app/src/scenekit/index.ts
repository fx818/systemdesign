/**
 * @/scenekit — deterministic SVG building blocks for lesson scenes.
 * Everything is a pure function of its props (and `time`). See README.md.
 */
export * from './time';
export * from './theme';
export { KindIcon, type KindIconProps } from './icons';
export { Stage, StageDefs, STAGE_W, STAGE_H, type StageProps } from './Stage';
export { Node, type NodeProps, type NodeState } from './Node';
export { Link, Packet, linkPath, insetSegment, type LinkProps, type PacketProps } from './Link';
export {
  Label, Title, Callout, CodeBlock, Counter, StatusBadge, wrapText,
  type LabelProps, type TitleProps, type CalloutProps, type CodeBlockProps, type CounterProps, type StatusBadgeProps, type Status,
} from './text';
export { Explosion, Smoke, CheckMark, CrossMark, Sparkles, type ExplosionProps, type SmokeProps, type MarkProps, type SparklesProps } from './fx';
export { Character, CHARACTER_META, type CharacterProps, type Mood } from './Character';
export { Hotspot, type HotspotProps } from './Hotspot';
export { Appear, Panel, Meter, type AppearProps, type PanelProps, type MeterProps } from './layout';
export { BrowserWindow, DataTable, Chip, type BrowserWindowProps, type DataTableProps, type ChipProps } from './widgets';
export { Gallery, type GalleryProps } from './Gallery';
