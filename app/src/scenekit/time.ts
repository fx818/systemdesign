/**
 * Timing helpers. Every function here is PURE: same inputs => same output.
 * Scenes compute everything from `time` (seconds) using these, which keeps
 * lessons scrubbable and exportable to video.
 */

export type Ease = (t: number) => number;
export interface Pt { x: number; y: number }

export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Easing functions: map 0..1 -> 0..1 (some overshoot: outBack, outElastic). */
export const ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - (1 - t) ** 3,
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
  outElastic: (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
  outBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
} satisfies Record<string, Ease>;

/** 0..1 progress of `time` through [a, b], clamped. Optional easing. */
export function progress(time: number, a: number, b: number, e: Ease = ease.linear): number {
  if (b <= a) return time >= b ? 1 : 0;
  return e(clamp((time - a) / (b - a)));
}

/** True while a <= time < b. */
export const between = (time: number, a: number, b: number) => time >= a && time < b;

/** Interpolate from -> to while time goes start -> end (held before/after). Default ease: inOutCubic. */
export function tween(time: number, start: number, end: number, from: number, to: number, e: Ease = ease.inOutCubic): number {
  return lerp(from, to, progress(time, start, end, e));
}

/** Start time of the i-th item in a staggered sequence. */
export const stagger = (i: number, base: number, gap: number) => base + i * gap;

/** Text revealed at `cps` characters per second starting at `start`. */
export function typewriter(text: string, time: number, start: number, cps = 20): string {
  const n = Math.floor(Math.max(0, time - start) * cps);
  return text.slice(0, Math.min(text.length, n));
}

/** Opacity for an element shown in [a, b] that fades in and out over `fade` seconds. */
export function fadeWindow(time: number, a: number, b: number, fade = 0.4): number {
  if (time < a || time > b) return 0;
  return Math.min(progress(time, a, a + fade), 1 - progress(time, b - fade, b));
}

/** Smooth 0..1 oscillation with the given period (seconds). */
export const pulse = (time: number, period = 1.2, phase = 0) =>
  0.5 - 0.5 * Math.cos(((time + phase) / period) * Math.PI * 2);

/** Deterministic hash -> [0, 1). Use instead of Math.random. */
export function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Seeded PRNG (mulberry32). Same seed => same sequence. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic jitter offset for "shaking" things; amp in px. */
export function shake(time: number, amp: number, seed = 1): Pt {
  if (amp === 0) return { x: 0, y: 0 };
  return {
    x: Math.sin(time * 53 + seed * 7.1) * amp * 0.6 + Math.sin(time * 31 + seed) * amp * 0.4,
    y: Math.cos(time * 47 + seed * 3.3) * amp * 0.6 + Math.sin(time * 29 + seed * 2) * amp * 0.4,
  };
}

/**
 * Point at fraction t (0..1) along a polyline (by arc length).
 * Returns position and heading angle in degrees.
 */
export function pathPoint(points: Pt[], t: number): Pt & { angle: number } {
  if (points.length === 0) return { x: 0, y: 0, angle: 0 };
  if (points.length === 1) return { ...points[0], angle: 0 };
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const l = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    lens.push(l);
    total += l;
  }
  let d = clamp(t) * total;
  for (let i = 0; i < lens.length; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (d <= lens[i] || i === lens.length - 1) {
      const f = lens[i] === 0 ? 0 : clamp(d / lens[i]);
      return {
        x: lerp(a.x, b.x, f),
        y: lerp(a.y, b.y, f),
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
    }
    d -= lens[i];
  }
  const last = points[points.length - 1];
  return { ...last, angle: 0 };
}

/** Index of the active segment in a list of cue times (e.g. which step is showing). -1 before first. */
export function cueIndex(time: number, cues: number[]): number {
  let idx = -1;
  for (let i = 0; i < cues.length; i++) if (time >= cues[i]) idx = i;
  return idx;
}

/** Compact, locale-independent number formatting: 1, 999, 1.2K, 10M. */
export function formatCount(n: number): string {
  const v = Math.round(n);
  const fmt = (x: number, s: string) => `${x >= 100 ? Math.round(x) : Math.round(x * 10) / 10}${s}`;
  if (v >= 1_000_000) return fmt(v / 1_000_000, 'M');
  if (v >= 1_000) return fmt(v / 1_000, 'K');
  return String(v);
}

/** Locale-independent thousands separators: 1234567 -> "1,234,567". */
export function withCommas(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
