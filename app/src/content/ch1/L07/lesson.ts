import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';
import { CDN_STEPS } from './data';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 4, 'Level 7: PixelPost is going global, and the photos are crawling.'),
  c(4, 8, 'Every image still comes from one origin server in San Francisco.'),
  c(8, 12, 'For users in London, Mumbai and Tokyo, each photo crosses an ocean.'),
  c(12, 17, 'Load times climb past six seconds. The cache cannot fix distance.'),
  c(17, 22, 'We need copies of our files that live close to the people looking at them.'),
  c(22, 27, 'Enter the CDN: a content delivery network.'),
  c(27, 31, 'It is a set of servers spread across the globe, called edge servers.'),
  c(31, 36, 'They cache static content: images, videos, CSS and JavaScript files.'),
  c(36, 40, 'Files that are the same for every user are the perfect fit.'),
  c(40, 45, 'Caching dynamic HTML, based on paths, query strings, cookies or headers, also exists…'),
  c(45, 50, '…but it is a newer idea and beyond this chapter. We use the CDN for static content.'),
  c(50, 55, 'How does it help? The CDN server closest to the user delivers the content.'),
  c(55, 59, 'Say our CDN servers sit only in San Francisco. Los Angeles loads quickly.'),
  c(59, 64, 'Europe is still far away, so it still loads slowly. Distance is latency.'),
  c(64, 69, 'The further a user is from a CDN server, the slower the site feels.'),
  c(69, 74, 'Add edges near Europe and Asia, and their load times drop to a fraction of a second.'),
  c(74, 80, 'Quick check before we see how a CDN actually gets the file.'),
  c(80, 84, 'Here is the CDN workflow, in six steps.'),
  c(84, 89, 'Step 1: User A asks for image.png using a URL on the CDN provider\'s domain, like cloudfront.net or akamai.com.'),
  c(89, 95, 'Step 2: the edge does not have it yet. Cache miss! It asks the origin: our web server or online storage like Amazon S3.'),
  c(95, 98, 'Step 3: the origin sends image.png back to the CDN…'),
  c(98, 102, '…with an optional HTTP header, Time-to-Live (TTL), saying how long to cache it.'),
  c(102, 107, 'Step 4: the CDN caches the image and returns it to User A.'),
  c(107, 112, 'Step 5: User B requests the same image.png.'),
  c(112, 117, 'Step 6: cache hit. The CDN returns it straight from its cache.'),
  c(117, 122, 'That keeps working for everyone nearby, as long as the TTL has not expired.'),
  c(122, 126, 'Once the TTL runs out, the next request goes back to the origin. Check-in time!'),
  c(126, 130, 'Before you switch it on, four things to think about.'),
  c(130, 133, 'Cost: CDNs are run by third parties and charge for data in and out. Rarely used files are not worth it.'),
  c(133, 136, 'Cache expiry: for time-sensitive content, pick the expiry with care.'),
  c(136, 139, 'Too long and content goes stale. Too short and the origin reloads files over and over.'),
  c(139, 143, 'CDN fallback: if the CDN has a temporary outage…'),
  c(143, 146, '…clients should detect it and fetch resources from the origin instead.'),
  c(146, 150, 'Invalidation: to remove a file before its TTL expires, call the CDN vendor\'s API…'),
  c(150, 154, '…or use object versioning: add a version to the URL, like image.png?v=2.'),
  c(154, 158, 'Here is PixelPost with both a CDN and a cache.'),
  c(158, 162, 'One: static assets like JS, CSS and images are no longer served by the web servers. They come from the CDN.'),
  c(162, 166, 'Two: the database load is lightened, because data reads are cached.'),
  c(166, 169, 'Faster pages worldwide, and half a million users.'),
  c(169, 173, 'But the web tier still remembers things it should not…'),
  c(173, 176, 'Next level: make it stateless.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'origin',
    title: 'The origin',
    body: 'The origin is where the real file lives: one of our web servers, or online storage such as Amazon S3. The CDN only goes back to the origin on a cache miss or after the TTL has expired.',
  },
  {
    id: 'cdn-edge',
    title: 'CDN edge servers',
    body: 'A CDN is a network of geographically dispersed servers that cache static content (images, videos, CSS, JavaScript). The edge closest to a user serves them, so the further a user is from any edge, the slower the site loads.',
  },
  {
    id: 'ttl',
    title: 'Time-to-Live (TTL)',
    body: 'When the origin returns a file it can add an optional TTL HTTP header that says how long the CDN may cache it. The file stays cached until the TTL expires. Too long risks stale content; too short makes the CDN keep reloading from the origin.',
  },
  {
    id: 'fallback',
    title: 'CDN fallback',
    body: 'A CDN can have temporary outages too. Your website or app should detect the problem and request resources directly from the origin, so a CDN failure only makes things slower, not broken.',
  },
  {
    id: 'versioning',
    title: 'Invalidating files',
    body: 'Two ways to remove a file before it expires: invalidate the object with the CDN vendor\'s API, or use object versioning by adding a version parameter to the URL (image.png?v=2) so clients fetch a new object.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.flow - 1,
    question: {
      id: 'L07-cp1',
      kind: 'mcq',
      prompt: 'A user in London opens PixelPost. Which server delivers the photos when a CDN is in place?',
      options: [
        'Always the origin server in San Francisco',
        'The CDN server closest to the user',
        'A random CDN server anywhere in the world',
        'The database, through the cache',
      ],
      answer: 1,
      explanation: 'The CDN server closest to the user delivers the static content. The further users are from CDN servers, the slower the site loads.',
      page: 17,
    },
  },
  {
    at: T.consider - 1,
    question: {
      id: 'L07-cp2',
      kind: 'order',
      prompt: 'Put the first four steps of the CDN workflow in order.',
      items: CDN_STEPS.slice(0, 4),
      explanation: 'Request via the CDN URL, cache miss, origin returns the file with a TTL, then the CDN caches it and returns it. Steps 5-6 repeat the request and hit the cache.',
      page: 18,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'Six seconds in London' },
    { at: T.what, title: 'What a CDN is' },
    { at: T.near, title: 'The closest server wins' },
    { at: T.flow, title: 'The 6-step workflow' },
    { at: T.consider, title: 'Cost, expiry, fallback, invalidation' },
    { at: T.design, title: 'CDN + cache design' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
