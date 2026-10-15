import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 9: PixelPost has users all over the world.'),
  c(5, 9, 'They all reach one data center, on the US West Coast.'),
  c(9, 13, 'Then a storm rolls in.'),
  c(13, 17, 'The data center loses power, and every server in it goes dark at once.'),
  c(17, 20, 'All our redundancy lived in one building.'),
  c(20, 25, 'The fix: run PixelPost from two data centers. Here, US-West and US-East.'),
  c(25, 30, 'Users are geoDNS-routed, also called geo-routed, to the closest data center.'),
  c(30, 36, 'GeoDNS is a DNS service that resolves a domain name to IP addresses based on the user\'s location.'),
  c(36, 41, 'In normal operation the traffic is split: x% goes to US-East…'),
  c(41, 46, '…and the remaining (100 − x)% goes to US-West.'),
  c(46, 52, 'West-coast users get US-West, east-coast users get US-East. Shorter trips, faster pages.'),
  c(52, 58, 'And for the first time, no single building holds all of PixelPost. Quick check!'),
  c(58, 62, 'Now the storm hits US-West again.'),
  c(62, 67, 'US-West goes offline. This is a significant data center outage.'),
  c(67, 72, 'So we direct all traffic to the healthy data center.'),
  c(72, 77, '100% of users now go to US-East, including the ones on the West Coast.'),
  c(77, 81, 'Their pages are a little slower, but PixelPost stays up.'),
  c(81, 86, 'Making this work for real takes solving a few technical challenges.'),
  c(86, 91, 'Challenge one: traffic redirection. We need effective tools to send traffic to the correct data center.'),
  c(91, 98, 'GeoDNS does the job: it directs each user to the nearest data center based on location.'),
  c(98, 102, 'Challenge two: data synchronization.'),
  c(102, 106, 'Users in different regions may use different local databases or caches.'),
  c(106, 110, 'After a failover, a user can land in a data center where their data is unavailable.'),
  c(110, 115, 'A common strategy is to replicate data across multiple data centers.'),
  c(115, 122, 'Netflix, for example, has shown how it does asynchronous multi-data-center replication.'),
  c(122, 127, 'Challenge three: test and deployment.'),
  c(127, 132, 'With several data centers, it is important to test the site and app from different locations.'),
  c(132, 137, 'Automated deployment tools are vital to keep services consistent across every data center.'),
  c(137, 142, 'Same version, same config, everywhere. Check-in time!'),
  c(142, 147, 'Two data centers, two million users.'),
  c(147, 152, 'To scale further, we need to decouple the parts of the system so they can scale independently.'),
  c(152, 157, 'Photo filters are coming, and they would choke the web servers.'),
  c(157, 162, 'Many real distributed systems solve this with a message queue.'),
  c(162, 166, 'That is the next level.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'geodns',
    title: 'GeoDNS',
    body: 'A DNS service that resolves a domain name to IP addresses based on the user\'s location. Users are geo-routed to the closest data center, with traffic split x% to US-East and (100 − x)% to US-West.',
  },
  {
    id: 'failover',
    title: 'Data center failover',
    body: 'If a data center has a significant outage, all traffic is directed to a healthy data center. In the book\'s example US-West is offline, so 100% of the traffic goes to US-East.',
  },
  {
    id: 'replication',
    title: 'Data synchronization',
    body: 'Users in different regions may use different local databases or caches. To make sure failed-over users still find their data, replicate it across data centers; Netflix, for instance, uses asynchronous multi-data-center replication.',
  },
  {
    id: 'deploy',
    title: 'Test and deployment',
    body: 'With multiple data centers you need to test your website or app from different locations, and use automated deployment tools to keep services consistent across all data centers.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.failover - 1,
    question: {
      id: 'L09-cp1',
      kind: 'mcq',
      prompt: 'What does geoDNS do?',
      options: [
        'Stores user photos close to the user',
        'Resolves a domain name to IP addresses based on the user\'s location',
        'Replicates databases between data centers',
        'Balances load between web servers in one data center',
      ],
      answer: 1,
      explanation: 'GeoDNS resolves domain names to IP addresses depending on where the user is, so each user is routed to the closest data center.',
      page: 24,
    },
  },
  {
    at: T.teaser - 1,
    question: {
      id: 'L09-cp2',
      kind: 'multi',
      prompt: 'Which are technical challenges of a multi-data-center setup?',
      options: ['Traffic redirection', 'Data synchronization', 'Test and deployment', 'Choosing a CSS framework'],
      answers: [0, 1, 2],
      explanation: 'The book lists three: traffic redirection (GeoDNS), data synchronization (replication) and testing/deployment at different locations (automated tools).',
      page: 25,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'One building, one storm' },
    { at: T.geo, title: 'Two data centers + geoDNS' },
    { at: T.failover, title: 'Failover' },
    { at: T.challenges, title: 'Traffic redirection' },
    { at: T.sync, title: 'Data synchronization' },
    { at: T.deploy, title: 'Test and deployment' },
    { at: T.teaser, title: 'Next: decoupling' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
