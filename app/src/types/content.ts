/**
 * SHARED CONTRACT — owned by the orchestrator. Do not change without approval.
 * Every level is pure data (LevelDef) + one animated Scene component.
 */
import type { ComponentType } from 'react';

/* ---------------------------------- Story --------------------------------- */
export type CharacterId = 'maya' | 'ravi' | 'pager' | 'player' | 'narrator';
export interface DialogueLine {
  who: CharacterId;
  text: string;
  mood?: 'neutral' | 'happy' | 'worried' | 'panic' | 'proud';
}

/* --------------------------------- Lesson --------------------------------- */
/** Scenes are DETERMINISTIC functions of time: same `time` => same pixels.
 *  This makes them scrubbable in the app and renderable to MP4 offline. */
export interface LessonSceneProps {
  time: number;          // seconds since lesson start
  width: number;         // logical canvas size (scene should use viewBox 0 0 1280 720)
  height: number;
  interactive: boolean;  // false while rendering to video (hide hover UI)
  onHotspot?: (id: string) => void;
}
export interface Caption { start: number; end: number; text: string; }
export interface Hotspot { id: string; title: string; body: string; }
/** Player pauses at `at` and asks a quick question before continuing. */
export interface Checkpoint { at: number; question: QuizQuestion; }
export interface LessonDef {
  duration: number;              // seconds
  chapters: { at: number; title: string }[];
  captions: Caption[];
  hotspots: Hotspot[];
  checkpoints: Checkpoint[];
  Scene: ComponentType<LessonSceneProps>;
}

/* ---------------------------------- Quiz ---------------------------------- */
interface QBase { id: string; prompt: string; explanation: string; page?: number; xp?: number; }
export type QuizQuestion =
  | (QBase & { kind: 'mcq'; options: string[]; answer: number })
  | (QBase & { kind: 'multi'; options: string[]; answers: number[] })
  | (QBase & { kind: 'order'; items: string[] /* correct order; UI shuffles */ })
  | (QBase & { kind: 'truefalse'; answer: boolean })
  | (QBase & { kind: 'bins'; bins: string[]; items: { text: string; bin: number }[] })
  | (QBase & { kind: 'numeric'; answer: number; tolerance?: number; unit?: string })
  /** click the right node(s) on a mini architecture diagram */
  | (QBase & { kind: 'spot'; diagram: ArchGraph; answers: string[] /* node ids */ })
  /** drag labels onto diagram nodes */
  | (QBase & { kind: 'label'; diagram: ArchGraph; labels: { nodeId: string; text: string }[] });

/* ------------------------------- Architecture ------------------------------ */
export type ComponentKind =
  | 'client' | 'mobile' | 'dns' | 'lb' | 'web' | 'db' | 'db-replica'
  | 'cache' | 'cdn' | 'session-store' | 'nosql' | 'queue' | 'worker'
  | 'datacenter' | 'shard' | 'logging' | 'metrics' | 'ci' | 'storage';
export interface ArchNode { id: string; kind: ComponentKind; label?: string; x: number; y: number; /* 0..1280 x 0..720 */ }
export interface ArchEdge { from: string; to: string; label?: string; }
export interface ArchGraph { nodes: ArchNode[]; edges: ArchEdge[]; }

/* -------------------------------- Simulator ------------------------------- */
export interface ComponentSpec {
  kind: ComponentKind;
  name: string;
  cost: number;            // credits per placement
  capacity: number;        // requests/sec it can serve
  latencyMs: number;       // base service latency
  description: string;
}
export type SimEvent =
  | { at: number; type: 'traffic'; rps: number; label?: string }          // set traffic level
  | { at: number; type: 'kill'; target: ComponentKind | string; label?: string } // kind or node id
  | { at: number; type: 'revive'; target: ComponentKind | string }
  | { at: number; type: 'region-down'; region: string; label?: string }
  | { at: number; type: 'hotkey'; share: number; label?: string }         // celebrity: share of reads to one shard
  | { at: number; type: 'jobs'; perSec: number; label?: string }          // async jobs into queue
  | { at: number; type: 'message'; who: CharacterId; text: string };
export interface SimGoals {
  minUptime?: number;      // 0..1
  maxP95Ms?: number;
  maxCost?: number;
  maxQueue?: number;
  minCacheHit?: number;    // 0..1
  durationSec: number;
}
export interface SimConfig {
  start: ArchGraph;                    // pre-placed (locked unless editable)
  palette: ComponentKind[];            // components the player may add
  budget: number;
  events: SimEvent[];
  goals: SimGoals;
  knobs?: Knob[];                      // lab sliders/toggles
  locked?: string[];                   // node ids that can't be removed
}
export interface Knob {
  id: 'ttl' | 'servers' | 'replicas' | 'workers' | 'rps' | 'split' | 'shards' | 'cacheSize' | 'eviction' | 'sticky' | 'cdn';
  label: string;
  type: 'slider' | 'toggle' | 'select';
  min?: number; max?: number; step?: number; options?: string[];
  initial: number | boolean | string;
}

/* ------------------------------ Mini-games -------------------------------- */
/** Bespoke per-level mini-game (e.g. LRU eviction, shard router, worker scaling).
 *  Must call onComplete with a 0..1 score. */
export interface MiniGameProps { onComplete: (score: number) => void; }
export interface MiniGameDef { id: string; title: string; intro: string; Component: ComponentType<MiniGameProps>; }

/* --------------------------------- Level ---------------------------------- */
export interface LevelDef {
  id: string;              // 'L01'
  number: number;          // 1..13
  title: string;           // 'Hello, World'
  subtitle: string;
  users: number;           // user-counter milestone reached on completion
  pages: [number, number]; // source pages in the book
  badge: { id: string; name: string; description: string; icon: string /* lucide icon name */ };
  incident: DialogueLine[];
  lesson: LessonDef;
  lab: { intro: string; config: SimConfig; tasks: string[] };
  miniGames: MiniGameDef[];
  mission: { brief: DialogueLine[]; config: SimConfig; hints: string[] };
  quiz: QuizQuestion[];    // 6-10 questions — the "interview round"
  cards: { front: string; back: string }[]; // key takeaways -> spaced repetition
  debrief: DialogueLine[];
  boss?: boolean;
}
