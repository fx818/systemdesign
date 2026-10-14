import type { ComponentKind } from '@/types/content';
import { Character } from './Character';
import { CheckMark, CrossMark, Explosion, Smoke, Sparkles } from './fx';
import { Hotspot } from './Hotspot';
import { Meter, Panel } from './layout';
import { Link, Packet, linkPath } from './Link';
import { Node } from './Node';
import { Stage } from './Stage';
import { Callout, CodeBlock, Counter, Label, StatusBadge, Title } from './text';
import { C } from './theme';
import { Chip } from './widgets';

const KINDS: ComponentKind[] = [
  'client', 'mobile', 'dns', 'lb', 'web', 'db', 'db-replica', 'cache', 'cdn', 'session-store',
  'nosql', 'queue', 'worker', 'datacenter', 'shard', 'logging', 'metrics', 'ci', 'storage',
];

export interface GalleryProps {
  /** Seconds. Drive it with requestAnimationFrame to see everything move. */
  time?: number;
  /** Which page: 'nodes' (every ComponentKind + states) or 'fx' (everything else). */
  page?: 'nodes' | 'fx';
  interactive?: boolean;
  onHotspot?: (id: string) => void;
}

/** Visual catalogue of every scenekit primitive. Also a determinism smoke test. */
export function Gallery({ time = 1.5, page = 'fx', interactive = false, onHotspot }: GalleryProps) {
  if (page === 'nodes') {
    return (
      <Stage time={time} title="Scenekit gallery: components">
        <Title text="Component icons" kicker="SCENEKIT" y={70} size={36} />
        {KINDS.map((k, i) => (
          <Node key={k} kind={k} x={115 + (i % 8) * 150} y={210 + Math.floor(i / 8) * 175} size={84} time={time} glow={0.5} />
        ))}
        <Node kind="web" label="busy" x={865} y={560} size={84} state="busy" time={time} />
        <Node kind="web" label="overloaded" x={1015} y={560} size={84} state="overloaded" time={time} load={1.2} />
        <Node kind="web" label="down" x={1165} y={560} size={84} state="down" time={time} />
      </Stage>
    );
  }
  const a = { x: 120, y: 420 };
  const b = { x: 420, y: 420 };
  const loop = (time % 3) / 3;
  return (
    <Stage time={time} title="Scenekit gallery: primitives">
      <Title text="Scenekit" subtitle="Every primitive is a pure function of time" kicker="GALLERY" y={90} size={44} />
      <Counter x={1110} y={50} value={Math.floor(1 + time * 137)} time={time} bump />
      <Node kind="client" x={a.x} y={a.y} time={time} />
      <Node kind="web" x={b.x} y={b.y} time={time} state="active" />
      <Link from={a} to={b} animated time={time} label="HTTP" />
      <Packet along={linkPath(a, b, 0, 60)} t={loop} label="GET /" />
      <Link from={{ x: 120, y: 560 }} to={{ x: 420, y: 600 }} draw={loop} bend={30} arrow color={C.violet} inset={0} />
      <Callout x={500} y={200} width={300} title="Callout" text="Explains what is happening, with an optional leader line." pointTo={{ x: 420, y: 360 }} appear={Math.min(1, time)} />
      <CodeBlock x={840} y={150} width={400} title="GET /users/12" code={'{\n  "id": 12,\n  "name": "Maya",\n  "pro": true\n}'} chars={(time * 25) % 80} />
      <StatusBadge x={620} y={420} status="ok" text="Online" time={time} />
      <StatusBadge x={620} y={470} status="down" text="Site down" time={time} />
      <Meter x={540} y={540} value={(time * 0.2) % 1.2} label="CPU" />
      <Chip x={620} y={610} text="MySQL" color={C.emerald} />
      <Explosion x={780} y={600} t={(time % 2) / 2} size={80} />
      <Smoke x={880} y={660} time={time} />
      <CheckMark x={960} y={600} t={loop * 1.5} />
      <CrossMark x={1030} y={600} t={loop * 1.5} />
      <Sparkles x={1140} y={600} t={loop} />
      <Panel x={30} y={640} w={160} h={60} title="Panel" color={C.violet} />
      <Hotspot id="gallery-hotspot" interactive={interactive} onClick={onHotspot} x={1050} y={380} time={time}>
        <Character who="ravi" mood="happy" x={1000} y={430} size={110} time={time} talking={time % 4 < 2} />
      </Hotspot>
      <Character who="maya" mood="panic" x={1180} y={430} size={90} time={time} />
      <Character who="pager" x={860} y={430} size={80} time={time} />
      <Label x={640} y={705} text="Scrub `time` and every frame is reproducible." size={14} color={C.dim} />
    </Stage>
  );
}
