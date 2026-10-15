import type { ChapterDef } from '@/types/content';

/** Book: System Design Interview (Alex Xu). Chapters with `available: false` show as "coming soon". */
export const chapters: ChapterDef[] = [
  { number: 1, title: 'Scale From Zero To Millions', subtitle: 'Grow PixelPost from 1 user to 10M', pages: [5, 33], color: '#22d3ee', icon: 'Rocket', available: true },
  { number: 2, title: 'Back-of-the-Envelope Estimation', subtitle: 'Numbers every architect carries in their head', pages: [34, 41], color: '#fbbf24', icon: 'Calculator', available: true },
  { number: 3, title: 'The Interview Framework', subtitle: 'The 4-step playbook, then Interview Mode', pages: [42, 50], color: '#a78bfa', icon: 'MessagesSquare', available: true },
  { number: 4, title: 'Design a Rate Limiter', subtitle: 'Coming soon', pages: [51, 70], color: '#fb7185', icon: 'Gauge', available: false },
  { number: 5, title: 'Design Consistent Hashing', subtitle: 'Coming soon', pages: [71, 85], color: '#34d399', icon: 'CircleDot', available: false },
  { number: 6, title: 'Design a Key-Value Store', subtitle: 'Coming soon', pages: [86, 108], color: '#60a5fa', icon: 'KeyRound', available: false },
];

export const getChapter = (n: number) => chapters.find((c) => c.number === n);
