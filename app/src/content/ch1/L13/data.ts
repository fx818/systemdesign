/** Shared data for Level 13, the boss (scene, quiz and mini-games). */
import type { ComponentKind } from '@/types/content';

/** The book's 8-point summary of how to scale to millions of users (p. 33). */
export interface Rule {
  id: string;
  text: string;
  short: string;
  /** Typed answers that count as "recalled" (lower-case substrings). */
  keywords: string[];
  why: string;
  /** Diagram node ids (Scene) lit up while the rule is explained. */
  focus: string[];
}

export const CHECKLIST: Rule[] = [
  {
    id: 'stateless',
    text: 'Keep the web tier stateless',
    short: 'Stateless web tier',
    keywords: ['stateless', 'state'],
    why: 'Session data lives in a shared store, so any web server can answer any request and autoscaling is easy.',
    focus: ['web1', 'web2', 'session'],
  },
  {
    id: 'redundancy',
    text: 'Build redundancy at every tier',
    short: 'Redundancy everywhere',
    keywords: ['redundan', 'failover', 'replica'],
    why: 'Several web servers, replicated databases and more than one cache server mean no single box can take PixelPost down.',
    focus: ['lb', 'web1', 'web2', 'cache1', 'cache2'],
  },
  {
    id: 'cache',
    text: 'Cache data as much as you can',
    short: 'Cache a lot',
    keywords: ['cache', 'caching'],
    why: 'Memory is much faster than the database, and every cache hit is a query the database never sees.',
    focus: ['cache1', 'cache2'],
  },
  {
    id: 'datacenters',
    text: 'Support multiple data centers',
    short: 'Multiple data centers',
    keywords: ['data center', 'datacenter', 'data centre', 'region', 'geo'],
    why: 'GeoDNS sends users to the nearest data center, and if one goes down the healthy one takes all the traffic.',
    focus: ['dc2', 'dns'],
  },
  {
    id: 'cdn',
    text: 'Host static assets in a CDN',
    short: 'Static assets on a CDN',
    keywords: ['cdn', 'static', 'content delivery'],
    why: 'Images, CSS and JavaScript come from a server close to the user instead of from your web servers.',
    focus: ['cdn'],
  },
  {
    id: 'shard',
    text: 'Scale your data tier by sharding',
    short: 'Shard the data tier',
    keywords: ['shard', 'partition'],
    why: 'One database server has hard limits. Shards split the data so each server holds only part of it.',
    focus: ['shard0', 'shard1', 'shard2', 'shard3'],
  },
  {
    id: 'services',
    text: 'Split tiers into individual services',
    short: 'Split into services',
    keywords: ['service', 'split', 'decouple', 'queue'],
    why: 'Smaller, decoupled pieces (like photo processing behind a queue) can be scaled and fixed independently.',
    focus: ['queue', 'worker1', 'worker2', 'session'],
  },
  {
    id: 'monitor',
    text: 'Monitor your system and use automation tools',
    short: 'Monitor + automate',
    keywords: ['monitor', 'automat', 'metric', 'logging', 'logs', 'ci'],
    why: 'Logs, metrics and automated build/test/deploy let a big team find problems early and ship safely.',
    focus: ['logging', 'metrics', 'ci'],
  },
];

/** Plausible-sounding wrong rules for the Checklist Recall mini-game. */
export const DISTRACTORS: { text: string; why: string }[] = [
  { text: 'Keep session data on each web server', why: 'That is a stateful web tier. The checklist says the opposite: move state out.' },
  { text: 'Buy one huge database server instead of sharding', why: 'Vertical scaling hits hardware limits, costs a lot and is a single point of failure.' },
  { text: 'Use sticky sessions on every load balancer', why: 'Sticky sessions add overhead and make adding or removing servers harder.' },
  { text: 'Avoid caching so data is never stale', why: 'The rule is to cache as much as you can, and handle staleness with sensible expiry.' },
  { text: 'Serve images from the web servers to keep things simple', why: 'Static assets belong in a CDN close to users.' },
  { text: 'Run everything in one data center to avoid sync problems', why: 'One data center is one big single point of failure. Support several.' },
  { text: 'Turn off logging in production to save disk', why: 'Large systems need logging, metrics and automation. That is rule eight.' },
  { text: 'Merge services back into one big server', why: 'The chapter ends by splitting tiers into even smaller services, not merging them.' },
];

/* ------------------------- Spot every SPOF mini-game ------------------------ */
export interface SpofNode {
  id: string;
  kind: ComponentKind;
  label: string;
  x: number;
  y: number;
  spof: boolean;
  why: string;
}

/** A flawed PixelPost design. Four parts would stop the whole system if they failed. */
export const SPOF_NODES: SpofNode[] = [
  { id: 'users', kind: 'client', label: 'Users', x: 80, y: 250, spof: false, why: 'Millions of independent clients. Losing one browser hurts nobody else.' },
  { id: 'cdn', kind: 'cdn', label: 'CDN', x: 80, y: 430, spof: false, why: 'A CDN is many servers around the world, and clients can fall back to the origin if it fails.' },
  { id: 'lb', kind: 'lb', label: 'Load balancer (only one)', x: 250, y: 340, spof: true, why: 'Every request passes through this single load balancer. If it dies, nothing reaches the web tier.' },
  { id: 'web1', kind: 'web', label: 'Web 1', x: 430, y: 200, spof: false, why: 'One of three stateless web servers. The load balancer routes around it.' },
  { id: 'web2', kind: 'web', label: 'Web 2', x: 430, y: 340, spof: false, why: 'One of three stateless web servers. The load balancer routes around it.' },
  { id: 'web3', kind: 'web', label: 'Web 3', x: 430, y: 480, spof: false, why: 'One of three stateless web servers. The load balancer routes around it.' },
  { id: 'sessions', kind: 'nosql', label: 'Session store ×3', x: 620, y: 470, spof: false, why: 'A replicated NoSQL cluster of three nodes. It survives losing one.' },
  { id: 'cache', kind: 'cache', label: 'Cache (one box)', x: 620, y: 200, spof: true, why: 'A single cache server is a classic SPOF. Run several, ideally across data centers.' },
  { id: 'db', kind: 'db', label: 'Database (no replicas)', x: 820, y: 290, spof: true, why: 'One database with no replicas: no failover, and possible data loss if it dies.' },
  { id: 'queue', kind: 'queue', label: 'Queue (replicated)', x: 820, y: 500, spof: false, why: 'A durable, replicated queue. Messages wait safely even if workers are down.' },
  { id: 'workers', kind: 'worker', label: 'Workers ×4', x: 1000, y: 500, spof: false, why: 'Four photo workers. Losing one only slows processing a little.' },
  { id: 'metrics', kind: 'metrics', label: 'Metrics', x: 1000, y: 160, spof: false, why: 'If monitoring blinks, users can still use PixelPost. It is important but not on the request path.' },
];

/** The whole design runs in one data center, drawn as a clickable frame around everything. */
export const SPOF_DC = {
  id: 'dc',
  label: 'One data center (US-East only)',
  spof: true,
  why: 'Everything lives in one data center. A power cut or network outage there takes all of PixelPost offline.',
} as const;

export const SPOF_IDS = [...SPOF_NODES.filter((n) => n.spof).map((n) => n.id), SPOF_DC.id];

export const SPOF_EDGES: [string, string][] = [
  ['users', 'lb'], ['users', 'cdn'], ['lb', 'web1'], ['lb', 'web2'], ['lb', 'web3'],
  ['web1', 'cache'], ['web2', 'cache'], ['web2', 'sessions'], ['web3', 'sessions'], ['cache', 'db'],
  ['web3', 'queue'], ['queue', 'workers'],
];
