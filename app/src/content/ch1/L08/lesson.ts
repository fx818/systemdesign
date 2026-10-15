import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 8: we added a third web server, and users started getting logged out.'),
  c(5, 9, 'Three users, a load balancer and three healthy web servers.'),
  c(9, 12, 'User A logs in on server 1. All good.'),
  c(12, 16, 'The next request lands on server 3, which has never heard of User A.'),
  c(16, 20, '"Please log in again." Nothing is broken, yet everyone is annoyed.'),
  c(20, 25, 'The culprit is state. A stateful server remembers client data from one request to the next.'),
  c(25, 30, 'A stateless server keeps no state information at all.'),
  c(30, 34, 'Here, User A\'s session data and profile image live on server 1.'),
  c(34, 40, 'To authenticate User A, the request must reach server 1. There, the session is found.'),
  c(40, 46, 'Send User A to server 2 instead and authentication fails: server 2 has no session for A.'),
  c(46, 52, 'Likewise, User B\'s requests must all go to server 2, and User C\'s to server 3.'),
  c(52, 58, 'So every request from the same client has to be routed to the same server.'),
  c(58, 63, 'Most load balancers can do that with sticky sessions.'),
  c(63, 69, 'But it adds overhead: the balancer has to track which user belongs to which server.'),
  c(69, 74, 'Adding or removing servers gets much harder. A new server 4 starts with nobody\'s sessions.'),
  c(74, 79, 'And failures hurt. What happens if server 2 goes down?'),
  c(79, 84, 'Its memory disappears, and with it every session it held.'),
  c(84, 88, 'User B is logged out. Check-in time!'),
  c(88, 93, 'The better way: move the state out of the web tier.'),
  c(93, 98, 'Session data goes into a shared data store, kept out of the web servers.'),
  c(98, 103, 'Now any request can go to any web server. The server fetches the state it needs from the store.'),
  c(103, 107, 'Users A, B and C can land anywhere and stay logged in.'),
  c(107, 112, 'A stateless system is simpler, more robust and more scalable.'),
  c(112, 117, 'The shared store could be a relational database, Memcached or Redis, or a NoSQL store.'),
  c(117, 122, 'We pick NoSQL, because it is easy to scale.'),
  c(122, 127, 'Here is the updated PixelPost design with a stateless web tier.'),
  c(127, 132, 'Session data has moved out of the web tier into a persistent data store.'),
  c(132, 137, 'The web servers keep nothing of their own. Any of them can take any request.'),
  c(137, 141, 'The CDN, cache and replicated database from earlier levels stay where they are.'),
  c(141, 146, 'Quick check before the last trick.'),
  c(146, 151, 'Because servers are interchangeable, we can autoscale.'),
  c(151, 156, 'Autoscaling adds web servers automatically as the traffic load climbs.'),
  c(156, 161, 'Two servers become five while the evening rush peaks.'),
  c(161, 166, 'When the rush is over, it removes servers again, and the bill shrinks.'),
  c(166, 172, 'One million users. Next: they are all over the world.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'session',
    title: 'Session data (state)',
    body: 'State is client data a server remembers between requests, such as the login session and profile image. In a stateful tier it lives in one server\'s memory, so only that server can authenticate the user, and it vanishes if the server dies.',
  },
  {
    id: 'sticky',
    title: 'Sticky sessions',
    body: 'Most load balancers can route every request from the same client to the same server. It works, but it adds overhead, makes adding or removing servers much harder, and makes server failures painful.',
  },
  {
    id: 'shared-store',
    title: 'Shared data store',
    body: 'In a stateless web tier, state lives in a shared store outside the web servers. It could be a relational database, Memcached/Redis or NoSQL. The book picks NoSQL because it is easy to scale.',
  },
  {
    id: 'autoscale',
    title: 'Autoscaling',
    body: 'Autoscaling means adding or removing web servers automatically based on traffic load. Once the state is out of the web servers, any server can be added or removed without logging anybody out.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.stateless - 1,
    question: {
      id: 'L08-cp1',
      kind: 'mcq',
      prompt: 'With sticky sessions, server 2 crashes. What happens to User B, whose session lived there?',
      options: [
        'Nothing: the load balancer copies the session to server 1',
        'User B loses the session and has to log in again',
        'User B is automatically moved to the database',
        'The other servers go down too',
      ],
      answer: 1,
      explanation: 'In a stateful tier the session lives only in server 2\'s memory. Handling server failures is one of the big challenges of sticky sessions.',
      page: 21,
    },
  },
  {
    at: T.autoscale - 1,
    question: {
      id: 'L08-cp2',
      kind: 'truefalse',
      prompt: 'In a stateless web tier, a user\'s requests may be served by a different web server each time.',
      answer: true,
      explanation: 'HTTP requests can go to any web server, which fetches state from the shared data store.',
      page: 22,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'Randomly logged out' },
    { at: T.stateful, title: 'Stateful servers' },
    { at: T.sticky, title: 'Sticky sessions' },
    { at: T.stateless, title: 'Going stateless' },
    { at: T.design, title: 'The updated design' },
    { at: T.autoscale, title: 'Autoscaling' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
