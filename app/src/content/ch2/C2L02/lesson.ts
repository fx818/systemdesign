import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 4, 'Level 2: PixelPost works great in California. In Amsterdam, it feels sluggish.'),
  c(4, 8, 'Every photo request crosses the Atlantic and comes back.'),
  c(8, 12, 'Maya wants to know why. The answer is in a famous list of numbers.'),
  c(12, 18, 'Dr. Jeff Dean published these typical operation times in 2010. Use them as historical estimates.'),
  c(18, 23, 'First, the units. Computers measure time in tiny slices.'),
  c(23, 27, 'A nanosecond, ns, is 10 to the minus 9 seconds.'),
  c(27, 31, 'A microsecond, µs, is 10 to the minus 6 seconds: 1,000 nanoseconds.'),
  c(31, 36, 'A millisecond, ms, is 10 to the minus 3 seconds: 1,000 microseconds, or a million nanoseconds.'),
  c(36, 42, 'Each step is a factor of 1,000. Keep that in mind when you compare numbers.'),
  c(42, 46, 'Now put the operations on one track. Each tick is ten times slower than the last.'),
  c(46, 49, 'An L1 cache reference: half a nanosecond.'),
  c(49, 52, 'A main memory reference: about 100 nanoseconds.'),
  c(52, 55, 'Compressing 1 KB with a fast algorithm: about 10 microseconds.'),
  c(55, 58, 'Sending 2 KB over a 1 Gbps network: about 20 microseconds.'),
  c(58, 61, 'Reading 1 MB sequentially from memory: about 250 microseconds.'),
  c(61, 64, 'A round trip inside the same data center: about half a millisecond.'),
  c(64, 67, 'A disk seek: 10 milliseconds.'),
  c(67, 70, 'Reading 1 MB sequentially from disk: about 30 milliseconds.'),
  c(70, 74, 'A packet from California to the Netherlands and back: 150 milliseconds.'),
  c(74, 78, 'Memory lives on the left. Disk lives far to the right.'),
  c(78, 82, 'Some numbers are outdated, but the ratios still guide your designs.'),
  c(82, 86, 'Hard to feel nanoseconds? Pretend one nanosecond lasts one whole second.'),
  c(86, 90, 'An L1 cache hit takes half a second: a heartbeat.'),
  c(90, 94, 'A memory reference: 100 seconds, under two minutes.'),
  c(94, 97, 'Compressing 1 KB: about 2.8 hours.'),
  c(97, 101, 'Reading 1 MB from memory: about three days.'),
  c(101, 104, 'A round trip in the data center: almost six days.'),
  c(104, 108, 'One disk seek: about four months.'),
  c(108, 112, 'Reading 1 MB from disk: almost a year.'),
  c(112, 116, 'And one round trip from California to the Netherlands: almost five years.'),
  c(116, 120, 'Now Amsterdam\'s complaint makes sense.'),
  c(120, 124, 'Studying these numbers, the book draws five conclusions.'),
  c(124, 128, 'One: memory is fast, but the disk is slow.'),
  c(128, 134, 'Two: avoid disk seeks if possible. Each one costs milliseconds.'),
  c(134, 140, 'Three: simple compression algorithms are fast, just microseconds per kilobyte.'),
  c(140, 146, 'Four: compress data before sending it over the internet, if possible.'),
  c(146, 152, 'Five: data centers are usually in different regions, and sending data between them takes time.'),
  c(152, 157, 'Squeeze 1 MB down to 300 KB with compression...'),
  c(157, 162, '...and the slow trip across the ocean carries far fewer bytes.'),
  c(162, 167, 'Keep hot data in memory, avoid the disk, and compress what travels far.'),
  c(167, 172, 'Next: when things break. How many nines can PixelPost promise?'),
];

export const hotspots: Hotspot[] = [
  { id: 'units', title: 'ns, µs, ms', body: '1 ns = 10^-9 s. 1 µs = 10^-6 s = 1,000 ns. 1 ms = 10^-3 s = 1,000 µs = 1,000,000 ns. Each unit is 1,000 times the previous one.' },
  { id: 'track', title: 'Memory vs disk', body: 'A main memory reference is about 100 ns; a disk seek is about 10 ms, around 100,000 times slower. Reading 1 MB from memory takes ~250 µs, from disk ~30 ms.' },
  { id: 'scaled', title: 'Human-scale latency', body: 'Multiply every number by a billion: a memory reference becomes ~2 minutes, a disk seek ~4 months and a cross-Atlantic round trip ~5 years. The gaps are enormous.' },
  { id: 'conclusions', title: 'Five conclusions', body: 'Memory is fast, disk is slow. Avoid disk seeks. Simple compression is fast. Compress before sending over the internet. Cross-region transfers take time.' },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.track - 2,
    question: {
      id: 'C2L02-cp1',
      kind: 'numeric',
      prompt: 'How many microseconds are in one millisecond?',
      answer: 1000,
      tolerance: 0,
      unit: 'µs',
      explanation: '1 ms = 10^-3 s and 1 µs = 10^-6 s, so 1 ms = 1,000 µs (and 1,000,000 ns).',
      page: 35,
    },
  },
  {
    at: T.lessons - 2,
    question: {
      id: 'C2L02-cp2',
      kind: 'mcq',
      prompt: 'A disk seek takes about 10 ms and a main memory reference about 100 ns. Roughly how many times slower is the seek?',
      options: ['About 100×', 'About 1,000×', 'About 100,000×', 'About 10 billion×'],
      answer: 2,
      explanation: '10 ms = 10,000,000 ns. Divided by 100 ns, that is 100,000×. Memory is fast, disk is slow.',
      page: 35,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'Slow in Amsterdam' },
    { at: T.units, title: 'ns, µs, ms' },
    { at: T.track, title: 'The latency track' },
    { at: T.scaled, title: 'If 1 ns were 1 s' },
    { at: T.lessons, title: 'Five conclusions' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
