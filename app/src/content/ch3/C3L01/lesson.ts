import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Chapter 3. You just landed an on-site interview at your dream company.'),
  c(5, 10, 'Then one line on the schedule makes your stomach drop: System Design Interview.'),
  c(10, 15, 'The prompt can be as vague as "design a well-known product X". In about an hour.'),
  c(15, 22, 'Relax. Nobody expects you to rebuild what took hundreds of engineers. That is not the test.'),
  c(22, 27, 'The interview simulates two co-workers solving an ambiguous problem together.'),
  c(27, 32, 'There is no perfect answer. The design process matters more than the final design.'),
  c(32, 37, 'So interviewers look for more than technical skill. Can you collaborate?'),
  c(37, 42, 'Can you work under pressure, and resolve ambiguity constructively?'),
  c(42, 47, 'And can you ask good questions? Many interviewers look for exactly that skill.'),
  c(47, 52, 'They also watch for red flags. A big one is over-engineering.'),
  c(52, 57, 'Chasing design purity while ignoring trade-offs creates costs that keep compounding.'),
  c(57, 62, 'Narrow-mindedness and stubbornness are red flags too.'),
  c(62, 67, 'Meet Jimmy. "Why did the tiger roar?" His hand is always up first.'),
  c(67, 72, '"Because he was HUNGRY!" Fast answers made Jimmy a classroom star.'),
  c(72, 77, 'In a design interview, answering fast without thinking earns you no bonus points.'),
  c(77, 82, 'Answering before you understand the requirements is a huge red flag.'),
  c(82, 87, 'It is not a trivia contest, and there is no single right answer. Don\'t be like Jimmy.'),
  c(87, 92, 'Slow down. Think deeply. Ask questions to clarify requirements and assumptions.'),
  c(92, 97, 'Jump straight to the final design and you will likely design the wrong system.'),
  c(97, 102, 'Ask: what specific features are we going to build?'),
  c(102, 107, 'How many users does the product have?'),
  c(107, 112, 'How fast will it scale? What scale do we expect in 3 months, 6 months, a year?'),
  c(112, 117, 'What is the tech stack? Which existing services could simplify the design?'),
  c(117, 122, 'If the interviewer says "you decide", write your assumptions down. You may need them later.'),
  c(122, 126, 'Let\'s see it work. Maya plays the interviewer: "Design a news feed system."'),
  c(126, 131, 'Mobile app, web app, or both? Both.'),
  c(131, 136, 'Most important features? Making a post, and seeing friends\' news feed.'),
  c(136, 142, 'Reverse chronological order, or weighted posts? Keep it simple: reverse chronological.'),
  c(142, 147, 'How many friends can a user have? 5,000.'),
  c(147, 152, 'What is the traffic volume? 10 million daily active users.'),
  c(152, 157, 'Can the feed contain images and videos, or just text? Media too: images and videos.'),
  c(157, 162, 'A handful of questions, and a vague prompt became a clear, written scope.'),
  c(162, 168, 'Now you know what to build. Next level: turn that scope into a blueprint.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'signals',
    title: 'What the interviewer is looking for',
    body: 'Not just technical design skill. A good session gives strong signals about your ability to collaborate, to work under pressure and to resolve ambiguity constructively. Asking good questions is an essential skill, and many interviewers look for it specifically.',
  },
  {
    id: 'red-flags',
    title: 'Red flags',
    body: 'Over-engineering: delighting in design purity and ignoring trade-offs. Its costs compound over time and companies pay a high price for it. Narrow-mindedness and stubbornness are red flags too.',
  },
  {
    id: 'jimmy',
    title: 'Don\'t be like Jimmy',
    body: 'Jimmy always answers first, whether or not he knows the answer. In a system design interview a fast answer without thinking earns no bonus points, and answering without understanding the requirements is a huge red flag.',
  },
  {
    id: 'assumptions',
    title: 'Write down your assumptions',
    body: 'When you ask a question, the interviewer either answers it or asks you to make an assumption. If you assume, write it on the whiteboard or paper: you might need it later in the session.',
  },
  {
    id: 'requirements',
    title: 'The clarified news feed',
    body: 'Web and mobile. Make a post and see friends\' feed. Reverse chronological order. Up to 5,000 friends. 10 million DAU. Posts can contain images and videos. Now the design has a target.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.jimmy - 1,
    question: {
      id: 'C3L01-cp1',
      kind: 'mcq',
      prompt: 'Which of these is a red flag the interviewer is watching for?',
      options: ['Asking clarifying questions', 'Over-engineering for design purity', 'Thinking out loud', 'Discussing trade-offs'],
      answer: 1,
      explanation: 'Over-engineering (delighting in design purity and ignoring trade-offs) is a red flag. Asking questions, thinking aloud and weighing trade-offs are good signals.',
      page: 43,
    },
  },
  {
    at: T.example - 1,
    question: {
      id: 'C3L01-cp2',
      kind: 'multi',
      prompt: 'You are asked to "design a chat app". Which are good opening questions?',
      options: [
        'What specific features are we going to build?',
        'Should I use Cassandra or MongoDB?',
        'How many users does the product have?',
        'What scale do we expect in 3 months, 6 months and a year?',
        'Can I start drawing the sharding scheme now?',
      ],
      answers: [0, 2, 3],
      explanation: 'Features, user count and growth are exactly the scope questions to start with. Picking databases or sharding before you know the requirements is jumping into a solution.',
      page: 43,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'The dreaded interview' },
    { at: T.signals, title: 'Signals and red flags' },
    { at: T.jimmy, title: 'Don\'t be like Jimmy' },
    { at: T.questions, title: 'What to ask' },
    { at: T.example, title: 'Example: a news feed' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
