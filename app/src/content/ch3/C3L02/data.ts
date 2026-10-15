/** Shared literals for C3L02: the news-feed high-level design (Figures 3-1 and 3-2, simplified). */

/** Napkin math used in the scene, quiz and lab (our own illustrative assumption: ~10 feed views per user per day). */
export const DAU = 10_000_000;
export const VIEWS_PER_DAY = 10;
export const QPS = Math.round((DAU * VIEWS_PER_DAY) / 86_400); // ≈ 1,157
export const PEAK_QPS = QPS * 2;

export interface FlowStep { id: string; text: string; flow: 'publish' | 'build' }

export const PUBLISH_FLOW: FlowStep[] = [
  { id: 'p1', flow: 'publish', text: 'A user publishes a post (through the load balancer to the web servers)' },
  { id: 'p2', flow: 'publish', text: 'The post service writes the post into the post cache and database' },
  { id: 'p3', flow: 'publish', text: 'The fanout service pushes the post into friends’ news feed caches' },
  { id: 'p4', flow: 'publish', text: 'The notification service tells friends there is something new' },
];

export const BUILD_FLOW: FlowStep[] = [
  { id: 'b1', flow: 'build', text: 'A user opens their news feed' },
  { id: 'b2', flow: 'build', text: 'The web servers hand the request to the news feed service' },
  { id: 'b3', flow: 'build', text: 'The news feed service aggregates friends’ posts from the news feed cache' },
  { id: 'b4', flow: 'build', text: 'The feed comes back in reverse chronological order' },
];

/** Whiteboard slots of the feed-publishing diagram, with a hint shown on the empty slot. */
export interface Slot { id: string; answer: string; hint: string; x: number; y: number }
export const PUBLISH_SLOTS: Slot[] = [
  { id: 'lb', answer: 'Load balancer', hint: 'spreads the traffic', x: 22, y: 50 },
  { id: 'web', answer: 'Web servers', hint: 'handle every request', x: 40, y: 50 },
  { id: 'post', answer: 'Post service', hint: 'saves the post', x: 60, y: 20 },
  { id: 'fanout', answer: 'Fanout service', hint: 'pushes it to friends', x: 60, y: 50 },
  { id: 'notify', answer: 'Notification service', hint: 'tells friends', x: 60, y: 80 },
  { id: 'post-cache', answer: 'Post cache', hint: 'hot posts in memory', x: 82, y: 10 },
  { id: 'post-db', answer: 'Post DB', hint: 'durable post storage', x: 82, y: 30 },
  { id: 'feed-cache', answer: 'News feed cache', hint: 'friends’ feeds in memory', x: 82, y: 55 },
];

/** Over-engineered or irrelevant boxes: placing one is a red flag. */
export const DECOYS = ['EdgeRank ML ranker', 'Blockchain ledger', 'Mainframe'];
