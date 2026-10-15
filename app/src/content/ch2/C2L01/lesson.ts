import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 4, 'Chapter 2: back-of-the-envelope estimation. PixelPost just passed 10 million users.'),
  c(4, 8, 'Maya is pitching investors this afternoon, and the numbers have to be right.'),
  c(8, 12, 'Their question: how much storage will 10 million users need over five years?'),
  c(12, 16, 'Back-of-the-envelope estimates mix thought experiments with common performance numbers.'),
  c(16, 20, 'They show which designs will meet your requirements. Step one: know your units.'),
  c(20, 25, 'The smallest unit of data is a bit: a single 0 or 1.'),
  c(25, 30, 'Bits on their own are tiny. We group them.'),
  c(30, 35, 'A byte is a sequence of 8 bits.'),
  c(35, 42, 'Storage uses bytes; network rates often use bits per second. Label the units to avoid an eightfold error.'),
  c(42, 47, 'How big is text? An ASCII character uses one byte of memory: 8 bits.'),
  c(47, 52, 'The caption "PIXEL" is five characters, so five bytes, or 40 bits.'),
  c(52, 57, 'Each letter maps to its own 8-bit code. P is 01010000.'),
  c(57, 62, 'Napkin rule for ASCII text: one byte per character. Other encodings can need more.'),
  c(62, 66, 'Now the big units. They are all powers of two.'),
  c(66, 72, 'To get correct calculations, you need to know data volume units as powers of 2.'),
  c(72, 76, '2 to the 10th is about a thousand: one kilobyte, KB.'),
  c(76, 80, '2 to the 20th is about a million: one megabyte, MB.'),
  c(80, 84, '2 to the 30th is about a billion: one gigabyte, GB.'),
  c(84, 88, '2 to the 40th is about a trillion: one terabyte, TB.'),
  c(88, 93, '2 to the 50th is about a quadrillion: one petabyte, PB.'),
  c(93, 98, 'The trick: 2 to the 10th is 1,024, roughly 1,000.'),
  c(98, 102, 'So every ten in the exponent adds about three zeros.'),
  c(102, 106, 'Picture the units as a ladder.'),
  c(106, 111, 'Byte, kilobyte, megabyte, gigabyte, terabyte, petabyte.'),
  c(111, 116, 'Each rung is 1,024 times the one below, about a thousand times.'),
  c(116, 121, 'To convert, count the rungs. MB to TB is two rungs: divide by about a million.'),
  c(121, 126, 'And label your units. A bare "5" could be 5 KB or 5 MB.'),
  c(126, 131, 'Back to the investors. Assume 10 million users...'),
  c(131, 135, '...each uploading one photo a day, about 2 MB per photo.'),
  c(135, 140, 'That is 20 million megabytes every day.'),
  c(140, 145, 'Two rungs up the ladder: roughly 20 terabytes per day.'),
  c(145, 151, 'No calculator, no panic. Just powers of two and round numbers.'),
  c(151, 156, 'Next: how fast is a byte? Latency numbers every programmer should know.'),
];

export const hotspots: Hotspot[] = [
  { id: 'byte', title: 'Byte', body: 'A byte is a sequence of 8 bits. Storage and memory use bytes and their multiples; network bandwidth is often in bits per second. Keep volume and rate units explicit.' },
  { id: 'ascii', title: 'ASCII character', body: 'An ASCII character uses one byte (8 bits) of memory: "PIXEL" is 5 bytes. Non-ASCII characters can use multiple bytes, so state the encoding assumption.' },
  { id: 'powers', title: 'Table 2-1: powers of two', body: '2^10 ≈ 1 thousand (KB), 2^20 ≈ 1 million (MB), 2^30 ≈ 1 billion (GB), 2^40 ≈ 1 trillion (TB), 2^50 ≈ 1 quadrillion (PB).' },
  { id: 'ladder', title: 'Converting units', body: 'Each unit is 2^10 = 1,024 times the previous one. Count the rungs between two units and multiply or divide by about 1,000 per rung.' },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.table - 2,
    question: {
      id: 'C2L01-cp1',
      kind: 'numeric',
      prompt: 'The ASCII caption "PIXEL" has 5 characters. How many bits does it take?',
      answer: 40,
      tolerance: 0,
      unit: 'bits',
      explanation: 'One ASCII character uses 1 byte, and 1 byte is 8 bits: 5 × 8 = 40 bits.',
      page: 34,
    },
  },
  {
    at: T.napkin - 2,
    question: {
      id: 'C2L01-cp2',
      kind: 'mcq',
      prompt: 'Which unit is about 2^40 bytes?',
      options: ['1 GB', '1 TB', '1 PB', '1 MB'],
      answer: 1,
      explanation: '2^40 is about a trillion: one terabyte. 2^30 is a GB, 2^50 a PB.',
      page: 34,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'The investor question' },
    { at: T.bits, title: 'Bits and bytes' },
    { at: T.ascii, title: 'ASCII' },
    { at: T.table, title: 'Powers of two' },
    { at: T.ladder, title: 'The unit ladder' },
    { at: T.napkin, title: 'First napkin' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
