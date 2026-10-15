import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 4, 'Boss level: tonight PixelPost airs a Super Bowl ad. Ten million users.'),
  c(4, 8, "Before launch, let's rebuild everything we learned, piece by piece."),
  c(8, 12, 'It started with one server. DNS turned api.pixelpost.com into an IP address.'),
  c(12, 16, 'Web and mobile clients sent HTTP requests and got HTML or JSON back.'),
  c(16, 20, 'Then we split the tiers: the database moved onto its own server.'),
  c(20, 24, 'Now the web tier and the data tier can scale independently.'),
  c(24, 29, 'Scaling up hits a hardware limit and has no failover, so for big apps we scale out instead.'),
  c(29, 33, 'A load balancer spreads traffic across web servers and talks to them over private IPs.'),
  c(33, 37, 'Database replication: the master handles writes, replicas serve the reads.'),
  c(37, 41, 'If one database goes offline, another takes over. Reliability and availability go up.'),
  c(41, 45, 'A cache tier keeps hot data in memory, so many reads never reach the database.'),
  c(45, 49, 'Several cache servers, so the cache itself is not a single point of failure.'),
  c(49, 53, 'A CDN serves static assets like images, CSS and JavaScript from servers close to the user.'),
  c(53, 57, 'Web servers stop serving static files, and pages load faster everywhere.'),
  c(57, 61, 'Session data moved out of the web servers into a shared NoSQL store.'),
  c(61, 65, 'With a stateless web tier, any server can handle any request, and autoscaling is easy.'),
  c(65, 70, 'GeoDNS routes each user to the nearest data center.'),
  c(70, 74, 'If a whole data center goes down, traffic fails over to the healthy one.'),
  c(74, 78, 'A message queue decouples the web servers from slow photo processing.'),
  c(78, 82, 'Producers publish jobs, workers consume them, and each side scales on its own.'),
  c(82, 86, 'Logging, metrics and automation keep a large system observable and safe to change.'),
  c(86, 90, 'Central logs, host-to-business metrics, and CI on every check-in.'),
  c(90, 94, 'Finally, the data tier is sharded: the sharding key picks the shard.'),
  c(94, 98, 'Non-relational data lives in NoSQL. This is the full picture.'),
  c(98, 103, "Let's stress it. A traffic spike arrives, and the load balancer spreads it out."),
  c(103, 108, 'A web server crashes. Traffic simply flows to the healthy one.'),
  c(108, 113, 'Cached reads stay fast, and static files keep streaming from the CDN.'),
  c(113, 118, 'No single failure takes PixelPost down. That is redundancy at work.'),
  c(118, 123, 'The chapter sums it up in eight rules. One: keep the web tier stateless.'),
  c(123, 128, 'Two: build redundancy at every tier.'),
  c(128, 133, 'Three: cache data as much as you can.'),
  c(133, 138, 'Four: support multiple data centers.'),
  c(138, 143, 'Five: host static assets in a CDN.'),
  c(143, 148, 'Six: scale your data tier by sharding.'),
  c(148, 153, 'Seven: split tiers into individual services.'),
  c(153, 158, 'Eight: monitor your system and use automation tools.'),
  c(158, 162, 'Scaling a system is an iterative process. Iterating on these ideas gets you far.'),
  c(162, 166, 'Past millions of users you will fine-tune, and decouple the system into even smaller services.'),
  c(166, 171, 'Everything in this chapter is the foundation for those new challenges.'),
  c(171, 176, 'Ten million users are waiting. Good luck, architect. One shot.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'session-store',
    title: 'Stateless web tier',
    body: 'Session data lives in a shared store (here NoSQL), not on the web servers. Any server can answer any request, so servers can be added or removed automatically.',
  },
  {
    id: 'geo-dc',
    title: 'Multiple data centers',
    body: 'GeoDNS sends users to the closest data center. If one goes down, all traffic is directed to a healthy one. Data must be replicated across data centers.',
  },
  {
    id: 'shards',
    title: 'Sharded data tier',
    body: 'Data is split across shards with the same schema, chosen by a sharding key such as user_id. Watch out for resharding, hotspot keys and cross-shard joins.',
  },
  {
    id: 'checklist',
    title: 'The 8 rules',
    body: 'Keep the web tier stateless · build redundancy at every tier · cache as much as you can · support multiple data centers · host static assets in a CDN · shard the data tier · split tiers into individual services · monitor and automate.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.stress - 1,
    question: {
      id: 'L13-cp1',
      kind: 'truefalse',
      prompt: 'In a stateless web tier, an HTTP request from a user can be sent to any web server.',
      answer: true,
      explanation: 'State (like sessions) is fetched from a shared data store, so any web server can serve any request.',
      page: 21,
    },
  },
  {
    at: T.beyond - 1,
    question: {
      id: 'L13-cp2',
      kind: 'multi',
      prompt: 'Which of these are in the chapter\'s summary of how to scale to millions of users? Pick all that apply.',
      options: ['Keep the web tier stateless', 'Cache data as much as you can', 'Use sticky sessions everywhere', 'Scale your data tier by sharding', 'Keep everything in one data center'],
      answers: [0, 1, 3],
      explanation: 'Stateless web tier, caching and sharding are all on the list. Sticky sessions and a single data center are the opposite of the advice.',
      page: 33,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'Launch night' },
    { at: T.build, title: 'One server, two tiers' },
    { at: T.scaleOut, title: 'Scale out + replicate' },
    { at: T.edge, title: 'Cache, CDN, stateless' },
    { at: T.global, title: 'Global, queue, tools' },
    { at: T.shards, title: 'Shards' },
    { at: T.stress, title: 'Stress test' },
    { at: T.checklist, title: 'The 8 rules' },
    { at: T.beyond, title: 'Beyond millions' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
