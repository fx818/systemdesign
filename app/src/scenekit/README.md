# `@/scenekit`: deterministic SVG building blocks for lesson scenes

Every lesson `Scene` is a **pure function of `time`**. The same `time` always produces the same pixels.
That is what makes lessons scrubbable in the player and renderable to MP4 frame by frame.

So inside a scene:

- **no** `useState`, `useEffect`, `setInterval`, `requestAnimationFrame`, framer-motion autoplay or `Math.random()`;
- compute every position, opacity and colour from `time` with the helpers below;
- use `hash(n)` / `rng(seed)` when you need "randomness".

All scenekit components are stateless and take `time` (or a `0..1` progress value) as a prop.
The canvas is always `viewBox="0 0 1280 720"`.

## Quick example

```tsx
import type { LessonSceneProps } from '@/types/content';
import { Stage, Node, Link, Packet, Callout, Hotspot, Counter, linkPath, progress, fadeWindow, between } from '@/scenekit';

const CLIENT = { x: 200, y: 360 };
const SERVER = { x: 1000, y: 360 };

export default function Scene({ time: t, interactive, onHotspot }: LessonSceneProps) {
  return (
    <Stage time={t} drift>
      <Counter x={1140} y={50} value={1} />
      <Node kind="client" x={CLIENT.x} y={CLIENT.y} time={t} appear={progress(t, 0.5, 1.2)} />
      <Hotspot id="server" interactive={interactive} onClick={onHotspot} active={t > 2} x={SERVER.x + 52} y={SERVER.y - 52} time={t}>
        <Node kind="web" x={SERVER.x} y={SERVER.y} time={t} state={between(t, 4, 6) ? 'active' : 'idle'} appear={progress(t, 1, 1.8)} />
      </Hotspot>
      <Link from={CLIENT} to={SERVER} animated time={t} draw={progress(t, 2, 3)} label="HTTP" />
      <Packet along={linkPath(CLIENT, SERVER, 0, 60)} time={t} start={3} end={5} label="GET /" shape="envelope" />
      <Callout x={420} y={120} title="Request" text="The browser sends an HTTP request." appear={fadeWindow(t, 3, 8)} pointTo={{ x: 600, y: 350 }} />
    </Stage>
  );
}
```

Recipe: give each element a **time window**. `progress(t, a, b)` is its entrance (0 to 1),
`fadeWindow(t, a, b)` shows it during `[a, b]` with fades, and `between(t, a, b)` switches state.
Keep chapter cue times in an exported `T` object so `lesson.ts` can reuse them for chapters and checkpoints
(see `src/content/ch1/L01/Scene.tsx`).

## Timing helpers (`time.ts`)

| Helper | Description |
|---|---|
| `progress(time, a, b, ease?)` | 0..1 progress through `[a, b]`, clamped. |
| `tween(time, start, end, from, to, ease?)` | Interpolates a number and holds it before and after (default `ease.inOutCubic`). |
| `between(time, a, b)` | `a <= time < b`. |
| `fadeWindow(time, a, b, fade=0.4)` | Opacity for an element visible in `[a, b]`, fading in and out. |
| `stagger(i, base, gap)` | Start time of the i-th item in a sequence: `base + i*gap`. |
| `typewriter(text, time, start, cps=20)` | Substring revealed at `cps` characters per second. |
| `pathPoint(points, t)` | `{x, y, angle}` at fraction `t` along a polyline (arc-length). |
| `cueIndex(time, cues)` | Index of the last cue reached (-1 before the first). |
| `ease.*` | `linear, inQuad, outQuad, inOutQuad, inCubic, outCubic, inOutCubic, outBack, outElastic, outBounce`. |
| `pulse(time, period, phase)` | Smooth 0..1 oscillation. |
| `shake(time, amp, seed)` | Deterministic jitter `{x, y}`. |
| `hash(n)`, `rng(seed)` | Deterministic pseudo-randomness. |
| `clamp`, `lerp`, `formatCount` (1.2K, 10M), `withCommas` (1,234,567). | |

## Primitives

| Component | Key props | Notes |
|---|---|---|
| `<Stage>` | `time, grid, drift, vignette, title` | Root `<svg>` (1280x720): slate-950 background, grid, vignette, shared filters `url(#sk-glow)`, `url(#sk-glow-strong)`, `url(#sk-soft)`, `url(#sk-grey)`. |
| `<Node>` | `kind, x, y, label, sublabel, state, glow, time, size, appear, load` | Card with an icon for every `ComponentKind`. `state`: `idle, active, busy, overloaded (shakes), down (grey + X), ghost (dashed)`. `load` draws a mini load bar. |
| `<KindIcon>` | `kind, size, color, activity` | Just the glyph (laptop, phone, globe, server rack, DB cylinder, lightning cache, CDN cloud, queue, gear, data center...). |
| `<Link>` | `from, to, animated, time, speed, color, dashed, label, draw, inset, bend, arrow, state` | `draw` 0..1 draws it in; `animated` makes dashes flow. `inset` (default 60) stops it at card edges. |
| `linkPath(a, b, bend, inset)` | | Points for a packet to follow the same (curved) link. |
| `<Packet>` | `along, t` **or** `time+start+end`, `color, label, size, trail, shape` | Glowing dot or `'envelope'` moving along a polyline. Hidden outside `[start, end]`. |
| `<Callout>` | `x, y, width, title, text, color, appear, pointTo, size` | Info card with word wrap and an optional leader line. |
| `<Label>` | `x, y, text, size, color, anchor, weight, opacity, mono, glow` | Plain text. |
| `<Title>` | `text, subtitle, kicker, x, y, appear, color, size` | Glowing chapter heading. |
| `<Counter>` | `x, y, value, label, color, time, bump` | PixelPost user counter pill (`bump` makes it glow). |
| `<StatusBadge>` | `x, y, status (ok, warn, down, info, busy), text, time` | Pill with a blinking dot. |
| `<CodeBlock>` | `x, y, width, title, code, chars, color, appear, size` | Terminal card with JSON highlighting; `chars` gives a typewriter effect. |
| `<Character>` | `who, mood, x, y, size, time, talking, say, bubble, nameTag, appear, flip` | Maya (violet CEO), Ravi (cyan mentor, glasses + beard), Pager (buzzing rose villain), player (emerald hoodie), narrator. Moods: `neutral, happy, worried, panic, proud`. Blinks and talks from `time`. |
| `<Hotspot>` | `id, onClick, interactive, active, x, y, ring, time, label` | Wraps children; when `interactive && active` it becomes a keyboard-accessible button (`data-hotspot=id`) with a pulsing **?** badge at `(x, y)`. Renders plain children in video mode. |
| `<Explosion>` | `x, y, t (0..1), size, color, seed` | Flash, shockwave and shards. |
| `<Smoke>` | `x, y, time, intensity, seed` | Looping rising puffs. |
| `<CheckMark>` / `<CrossMark>` | `x, y, t (0..1), size, color` | Self-drawing tick / X. |
| `<Sparkles>` | `x, y, t (0..1), radius, seed` | Confetti burst. |
| `<Appear>` | `p (0..1), from ('fade', 'up', 'down', 'left', 'right', 'scale', 'pop'), x, y` | Entrance wrapper for any group. |
| `<Panel>` | `x, y, w, h, title, color, dashed, tint, opacity` | Rounded container ("Web tier", "One server"). |
| `<Meter>` | `x, y, w, value, label, color` | Load bar; turns emerald, then amber, then rose as `value` rises. |
| `<BrowserWindow>` | `x, y, w, h, url, chars, caret, appear` | Browser with an address bar; children render in the page area. |
| `<DataTable>` | `x, y, title, columns, rows, widths, highlight, rowsShown, appear` | Relational table card. Row i centre y = `y + 81 + 34*i`. |
| `<Chip>` | `x, y, text, color, filled, size, appear` | Small tag. |
| `<Gallery>` | `time, page ('nodes' or 'fx'), interactive, onHotspot` | Visual catalogue of everything above. |

Colours: `C.cyan, C.violet, C.emerald, C.amber, C.rose, C.sky, C.orange` plus `C.bg, C.panel, C.panel2, C.line, C.dim, C.text, C.white`.
`KIND_COLOR[kind]` and `KIND_LABEL[kind]` give the defaults for each component.

## Checklist for level authors

1. `Scene.tsx` default-exports the scene and exports `T` (chapter cue times).
2. `lesson.ts`: captions every 3-6 s with no gaps, chapters taken from `T`, 3-5 hotspots, 2 checkpoints.
3. Every hotspot id in `lesson.hotspots` must be rendered by the scene (with `active` while its target is visible),
   and the scene must not render unknown ids. `src/content/ch1/validate.test.ts` checks this, plus determinism
   (renders each scene twice at several times and compares the markup) and the absence of `NaN`.
4. Preview: render `<Gallery time={t}/>` or your scene with any `time`. Same input, same frame.
