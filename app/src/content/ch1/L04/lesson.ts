import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 4: PixelPost was just featured on national TV. 50,000 users, all at once.'),
  c(5, 10, 'Everyone connects straight to server 1. It is drowning, while server 2 sits idle.'),
  c(10, 14, 'This is the direct-connection problem from Level 3, live.'),
  c(14, 18, "Ravi's fix: put a traffic cop in front of the servers."),
  c(18, 23, 'Meet the load balancer.'),
  c(23, 28, 'A load balancer evenly distributes incoming traffic among the web servers in a load-balanced set.'),
  c(28, 33, 'Request one goes to server 1, request two to server 2, and so on.'),
  c(33, 38, 'Now both servers share the work, and neither one is overwhelmed.'),
  c(38, 44, 'The servers behind the load balancer form the load-balanced set: the server pool.'),
  c(44, 50, "So how do users find the load balancer? Let's follow the IP addresses."),
  c(50, 55, 'DNS now returns the public IP of the load balancer, not the IP of a web server.'),
  c(55, 60, 'Users connect to that public IP directly.'),
  c(60, 65, 'With this setup, clients cannot reach the web servers directly any more.'),
  c(65, 70, 'For better security, the servers talk to each other over private IPs.'),
  c(70, 76, 'A private IP is an address reachable only between servers in the same network.'),
  c(76, 82, 'It is unreachable over the internet. Nobody outside can call 10.0.0.1.'),
  c(82, 88, 'The load balancer communicates with the web servers through these private IPs.'),
  c(88, 94, 'Now the real test. What happens when a server fails?'),
  c(94, 99, 'Server 1 goes offline.'),
  c(99, 104, 'All the traffic is routed to server 2, so the website does not go offline.'),
  c(104, 109, 'Then we add a new healthy web server to the pool to balance the load again.'),
  c(109, 115, 'A load balancer plus a second web server solves the no-failover problem.'),
  c(115, 122, 'It also improves the availability of the whole web tier.'),
  c(122, 127, 'Next scenario: traffic grows rapidly. The TV clip is going viral.'),
  c(127, 132, 'Two servers are no longer enough. Both are running hot.'),
  c(132, 137, 'The load balancer handles this gracefully. You only add more servers to the pool.'),
  c(137, 142, 'The load balancer automatically starts sending requests to the new servers.'),
  c(142, 148, 'More traffic? More servers. Horizontal scaling, done right.'),
  c(148, 154, 'The web tier looks good now. But what about the data tier?'),
  c(154, 160, 'There is still only one database, so there is no failover or redundancy. That is next.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'load-balancer',
    title: 'Load balancer',
    body: 'Evenly distributes incoming traffic among the web servers in a load-balanced set. Users only ever talk to the load balancer.',
  },
  {
    id: 'public-ip',
    title: 'Public IP',
    body: "DNS returns the load balancer's public IP, and users connect to it directly. The web servers are no longer reachable by clients.",
  },
  {
    id: 'private-ip',
    title: 'Private IPs',
    body: 'A private IP is reachable only between servers in the same network and is unreachable over the internet. The load balancer talks to the web servers through private IPs, which is better for security.',
  },
  {
    id: 'failover',
    title: 'Failover',
    body: 'If server 1 goes offline, all traffic is routed to server 2, so the website stays online. A new healthy server is then added to the pool to balance the load.',
  },
  {
    id: 'add-servers',
    title: 'Growing the pool',
    body: 'When traffic grows rapidly and the current servers are not enough, just add more servers to the web server pool. The load balancer automatically starts sending requests to them.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.ips - 1,
    question: {
      id: 'L04-cp1',
      kind: 'mcq',
      prompt: 'What does a load balancer do?',
      options: [
        'Evenly distributes incoming traffic among the web servers in its set',
        'Stores copies of the database',
        'Translates domain names into IP addresses',
        'Makes one web server more powerful',
      ],
      answer: 0,
      explanation: 'A load balancer evenly distributes incoming traffic among the web servers defined in a load-balanced set.',
      page: 9,
    },
  },
  {
    at: T.grow - 2,
    question: {
      id: 'L04-cp2',
      kind: 'mcq',
      prompt: 'Server 1 goes offline. What happens to PixelPost?',
      options: [
        'Traffic is routed to server 2 and the site stays online',
        'The whole site goes down until server 1 restarts',
        'Users must type server 2\'s IP address themselves',
        'DNS stops answering',
      ],
      answer: 0,
      explanation: 'The load balancer routes all traffic to the healthy server 2, so the website does not go offline. Then a new healthy server is added to the pool.',
      page: 10,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'Drowning server 1' },
    { at: T.lb, title: 'The load balancer' },
    { at: T.ips, title: 'Public and private IPs' },
    { at: T.failover, title: 'Failover' },
    { at: T.grow, title: 'Growing the pool' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
