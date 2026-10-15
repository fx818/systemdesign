import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { levels } from '@/content/registry';
import type { ArchGraph, ComponentKind } from '@/types/content';
import { useGame, isDone } from '@/game';
import { Icon } from '@/components/ui';

/** Level at which each component kind enters the story (chapters 1-13). */
export const INTRO_LEVEL: Record<ComponentKind, number> = {
  client: 1,
  mobile: 1,
  dns: 1,
  web: 1,
  db: 2,
  nosql: 2,
  storage: 2,
  lb: 4,
  'db-replica': 5,
  cache: 6,
  cdn: 7,
  'session-store': 8,
  datacenter: 9,
  queue: 10,
  worker: 10,
  logging: 11,
  metrics: 11,
  ci: 11,
  shard: 12,
};

const KIND_ICON: Record<ComponentKind, string> = {
  client: 'monitor',
  mobile: 'smartphone',
  dns: 'compass',
  lb: 'split',
  web: 'server',
  db: 'database',
  'db-replica': 'database-backup',
  cache: 'zap',
  cdn: 'globe',
  'session-store': 'key-round',
  nosql: 'braces',
  queue: 'list-ordered',
  worker: 'cog',
  datacenter: 'building-2',
  shard: 'puzzle',
  logging: 'scroll-text',
  metrics: 'activity',
  ci: 'git-branch',
  storage: 'hard-drive',
};

/** Fallback "full architecture" used until the boss level's graph lands. */
export const FALLBACK_GRAPH: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Web client', x: 70, y: 280 },
    { id: 'mobile', kind: 'mobile', label: 'Mobile', x: 70, y: 430 },
    { id: 'dns', kind: 'dns', label: 'DNS', x: 200, y: 355 },
    { id: 'cdn', kind: 'cdn', label: 'CDN', x: 330, y: 180 },
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 345, y: 355 },
    { id: 'web1', kind: 'web', label: 'Web 1', x: 490, y: 275 },
    { id: 'web2', kind: 'web', label: 'Web 2', x: 490, y: 435 },
    { id: 'cache', kind: 'cache', label: 'Cache', x: 650, y: 170 },
    { id: 'sessions', kind: 'session-store', label: 'Sessions', x: 650, y: 285 },
    { id: 'db', kind: 'db', label: 'DB master', x: 650, y: 415 },
    { id: 'replica', kind: 'db-replica', label: 'Replica', x: 650, y: 545 },
    { id: 'queue', kind: 'queue', label: 'Queue', x: 800, y: 355 },
    { id: 'workers', kind: 'worker', label: 'Workers', x: 925, y: 355 },
    { id: 'shard1', kind: 'shard', label: 'Shard 1', x: 800, y: 500 },
    { id: 'shard2', kind: 'shard', label: 'Shard 2', x: 925, y: 500 },
    { id: 'dc-east', kind: 'datacenter', label: 'US-East', x: 1100, y: 230 },
    { id: 'dc-west', kind: 'datacenter', label: 'US-West', x: 1100, y: 480 },
    { id: 'metrics', kind: 'metrics', label: 'Metrics', x: 800, y: 630 },
    { id: 'logging', kind: 'logging', label: 'Logging', x: 960, y: 630 },
    { id: 'ci', kind: 'ci', label: 'CI', x: 1120, y: 630 },
  ],
  edges: [
    { from: 'client', to: 'dns' },
    { from: 'mobile', to: 'dns' },
    { from: 'dns', to: 'lb' },
    { from: 'client', to: 'cdn' },
    { from: 'lb', to: 'web1' },
    { from: 'lb', to: 'web2' },
    { from: 'web1', to: 'cache' },
    { from: 'web1', to: 'sessions' },
    { from: 'web1', to: 'db' },
    { from: 'web2', to: 'db' },
    { from: 'db', to: 'replica' },
    { from: 'web2', to: 'queue' },
    { from: 'queue', to: 'workers' },
    { from: 'db', to: 'shard1' },
    { from: 'db', to: 'shard2' },
    { from: 'web1', to: 'dc-east' },
    { from: 'web2', to: 'dc-west' },
    { from: 'workers', to: 'metrics' },
    { from: 'workers', to: 'logging' },
    { from: 'ci', to: 'web1' },
  ],
};

/**
 * The home-screen architecture map: PixelPost's full system, drawn as neon
 * nodes. A node is revealed once the level that introduces it is complete;
 * locked nodes render as dim silhouettes. Clicking a revealed node opens the
 * level that teaches it.
 */
export function ArchitectureMap() {
  const navigate = useNavigate();
  const progress = useGame((s) => s.progress);

  const boss = levels.find((l) => l.boss);
  // Launch Night starts with users only. Use the full design for the HQ map
  // until a boss definition actually includes the finished architecture.
  const graph = boss && boss.mission.config.start.nodes.some((node) => node.kind === 'web')
    ? boss.mission.config.start : FALLBACK_GRAPH;

  const completedNumbers = useMemo(
    () => new Set(levels.filter((l) => isDone(progress, l)).map((l) => l.number)),
    [progress],
  );

  const nodeById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);

  const revealLevel = (kind: ComponentKind) => completedNumbers.has(INTRO_LEVEL[kind] ?? 99);

  const openLevel = (kind: ComponentKind) => {
    const n = INTRO_LEVEL[kind];
    const level = levels.find((l) => l.number === n);
    if (level && completedNumbers.has(n)) navigate(`/level/${level.id}`);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950" style={{ aspectRatio: '16 / 9' }}>
      {/* edges */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1280 720" preserveAspectRatio="none">
        {graph.edges.map((e) => {
          const a = nodeById.get(e.from);
          const b = nodeById.get(e.to);
          if (!a || !b) return null;
          const lit = revealLevel(a.kind) && revealLevel(b.kind);
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={lit ? 'rgba(34,211,238,0.45)' : 'rgba(51,65,85,0.5)'}
              strokeWidth={lit ? 2.5 : 2}
              strokeDasharray={lit ? undefined : '6 6'}
            />
          );
        })}
      </svg>

      {/* nodes */}
      {graph.nodes.map((n) => {
        const revealed = revealLevel(n.kind);
        return (
          <button
            key={n.id}
            onClick={() => openLevel(n.kind)}
            disabled={!revealed}
            className={`group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition-all ${
              revealed ? 'cursor-pointer' : 'cursor-default'
            }`}
            style={{ left: `${(n.x / 1280) * 100}%`, top: `${(n.y / 720) * 100}%` }}
            title={revealed ? `${n.label ?? n.kind} — revisit the lesson` : 'Locked: keep playing to reveal'}
          >
            <span
              className={`flex items-center justify-center rounded-xl border-2 transition-all ${
                revealed
                  ? 'border-cyan-400/70 bg-slate-900 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.35)] group-hover:scale-110'
                  : 'border-dashed border-slate-700 bg-slate-900/60 text-slate-700'
              }`}
              style={{ width: 'clamp(22px, 3.4vw, 44px)', height: 'clamp(22px, 3.4vw, 44px)' }}
            >
              {revealed ? <Icon name={KIND_ICON[n.kind]} size="55%" /> : <Icon name="lock" size="50%" />}
            </span>
            <span
              className={`font-mono whitespace-nowrap ${revealed ? 'text-slate-300' : 'text-slate-700'}`}
              style={{ fontSize: 'clamp(7px, 0.9vw, 12px)' }}
            >
              {revealed ? (n.label ?? n.kind) : '???'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
