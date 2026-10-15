import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 4. Step 4: wrap up. Time to land the plane.'),
  c(5, 10, 'The deep dive is done and the clock is close to the end of the session.'),
  c(10, 16, 'The interviewer may ask a few follow-up questions, or give you freedom to discuss other points.'),
  c(16, 21, 'Maya asks: "Any follow-ups you\'d like to discuss?"'),
  c(21, 25, 'The worst possible answer: "Nope. My design is perfect."'),
  c(25, 30, 'Never say your design is perfect. There is always something to improve.'),
  c(30, 35, 'Direction one: identify the system\'s bottlenecks and discuss potential improvements.'),
  c(35, 40, 'It is a great chance to show critical thinking and leave a good final impression.'),
  c(40, 45, 'Two: give the interviewer a recap of your design.'),
  c(45, 50, 'Especially if you suggested a few solutions. After a long session, a refresher helps.'),
  c(50, 55, 'Three: error cases. What happens on a server failure, or a network loss?'),
  c(55, 60, 'Error cases are always interesting to talk about.'),
  c(60, 65, 'Four: operation issues. How do you monitor metrics and error logs?'),
  c(65, 70, 'And how will you roll out the system?'),
  c(70, 75, 'Five: the next scale curve. Your design supports 1 million users today...'),
  c(75, 80, '...so what would you change to support 10 million?'),
  c(80, 86, 'Six: propose other refinements you would make if you had more time.'),
  c(86, 92, 'And remember: you are not done until the interviewer says you are done.'),
  c(92, 97, 'To wrap up the chapter: the dos. Always ask for clarification; don\'t assume your assumption is right.'),
  c(97, 102, 'Understand the requirements. There is no right or best answer, only one that fits them.'),
  c(102, 107, 'Let the interviewer know what you are thinking, and suggest multiple approaches if possible.'),
  c(107, 113, 'Agree on the blueprint, design the most critical components first, bounce ideas off the interviewer. Never give up.'),
  c(113, 118, 'The don\'ts. Don\'t be unprepared for typical interview questions.'),
  c(118, 123, 'Don\'t jump into a solution without clarifying the requirements and assumptions.'),
  c(123, 128, 'Don\'t go deep on one component at the start: high-level design first, then drill down.'),
  c(128, 134, 'Stuck? Ask for a hint. Don\'t think in silence, and ask for feedback early and often.'),
  c(134, 139, 'Finally, time. Questions are broad and 45 minutes is not enough to cover everything.'),
  c(139, 144, 'A rough guide: 3 to 10 minutes to understand the problem and set the scope.'),
  c(144, 149, '10 to 15 minutes for the high-level design and buy-in. 10 to 25 for the deep dive.'),
  c(149, 155, '3 to 5 minutes to wrap up. The real split depends on the problem and the interviewer.'),
  c(155, 160, 'That is the whole framework: four steps, one conversation.'),
  c(160, 166, 'Clarify, blueprint, deep dive, wrap up. And with that...'),
  c(166, 172, '...Interview Mode is unlocked. Real prompts, a real clock, all four steps.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'bottlenecks',
    title: 'Bottlenecks and improvements',
    body: 'The interviewer may ask you to identify bottlenecks and discuss improvements. Never say your design is perfect: there is always something to improve, and this is a chance to show critical thinking and leave a good final impression.',
  },
  {
    id: 'errors',
    title: 'Error cases',
    body: 'Server failure, network loss and other error cases are interesting to talk about. Explain what breaks and how the design copes.',
  },
  {
    id: 'ops',
    title: 'Operation issues',
    body: 'How do you monitor metrics and error logs? How do you roll the system out? Operations are worth mentioning in the wrap-up.',
  },
  {
    id: 'dos-donts',
    title: 'Dos and don\'ts',
    body: 'Do: ask for clarification, understand the requirements, communicate, suggest several approaches, design critical components first, treat the interviewer as a teammate, never give up. Don\'t: arrive unprepared, jump into a solution, go deep too early, think in silence, hesitate to ask for hints, or assume you are done before the interviewer says so.',
  },
  {
    id: 'time-split',
    title: 'Time allocation (45 minutes)',
    body: 'A very rough guide. Step 1: 3-10 min. Step 2: 10-15 min. Step 3: 10-25 min. Step 4: 3-5 min. The actual split depends on the scope of the problem and on what the interviewer wants.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.dos - 1,
    question: {
      id: 'C3L04-cp1',
      kind: 'multi',
      prompt: 'Which are good wrap-up directions?',
      options: [
        'Identify bottlenecks and possible improvements',
        'Recap the design',
        'Discuss error cases and operation issues',
        'Insist the design cannot be improved',
        'Explain what changes for the next scale curve',
      ],
      answers: [0, 1, 2, 4],
      explanation: 'Bottlenecks, recap, error cases, operations, the next scale curve and further refinements. Never claim the design is perfect.',
      page: 48,
    },
  },
  {
    at: T.time - 1,
    question: {
      id: 'C3L04-cp2',
      kind: 'mcq',
      prompt: 'You finished presenting your design. The interviewer hasn\'t said anything yet. What now?',
      options: ['Stand up and leave: you\'re done', 'Ask for feedback; you\'re not done until the interviewer says so', 'Start a new design from scratch', 'Sit silently and wait'],
      answer: 1,
      explanation: 'Don\'t think your interview is done once you give the design. You are not done until the interviewer says so. Ask for feedback early and often.',
      page: 49,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'Final approach' },
    { at: T.wrap, title: 'Never say "perfect"' },
    { at: T.directions, title: 'Six wrap-up directions' },
    { at: T.dos, title: 'Dos and don\'ts' },
    { at: T.time, title: 'The 45-minute split' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
