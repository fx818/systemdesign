import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'pager', text: 'BZZZT. 03:04 AM. Upload errors 33%. BZZZZZT!', mood: 'panic' },
  { who: 'player', text: '(groggy) Okay... which server is it?', mood: 'worried' },
  { who: 'pager', text: 'Unknown. You have forty servers. Good luck. bzzt.', mood: 'neutral' },
  { who: 'maya', text: "Why am I awake? Why are YOU awake? Five million people are asleep and some of them can't post their cats!", mood: 'panic' },
  { who: 'player', text: "I'm SSH-ing into the servers one by one and reading log files. This is server number seven.", mood: 'worried' },
  { who: 'ravi', text: 'Stop. At five servers that was fine. At five million users you need eyes on the whole system at once.', mood: 'neutral' },
  { who: 'ravi', text: 'Logs in one searchable place, metrics on a dashboard, and machines that test every change for you.', mood: 'happy' },
  { who: 'maya', text: 'Fine. But build it fast. I need my beauty sleep.', mood: 'worried' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Mission: deploy day. Three releases go out today, and one of them is broken.' },
  { who: 'ravi', text: 'Add logging, metrics and a CI pipeline to the design so the bad release gets caught early, then keep uptime above target.' },
  { who: 'maya', text: 'We also launch "Memories" at noon. Expect a traffic bump.', mood: 'happy' },
  { who: 'pager', text: 'bzzt. I love deploy days.', mood: 'neutral' },
  { who: 'player', text: 'Not today, Pager. Eyes on everything.', mood: 'proud' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'You found the full disk in ninety seconds? Last time it took you until breakfast.', mood: 'happy' },
  { who: 'player', text: 'One search box for every log, and a disk graph that screamed "web-3".', mood: 'proud' },
  { who: 'ravi', text: 'Host metrics tell you which box, aggregated metrics tell you which tier, business metrics tell you whether anybody cares.', mood: 'happy' },
  { who: 'ravi', text: 'And CI checks every check-in automatically, so the next bug gets caught before it ever reaches users.', mood: 'proud' },
  { who: 'pager', text: 'bzzt... I feel... observed.', mood: 'worried' },
  { who: 'maya', text: 'Speaking of growth: the database server is at 95% disk. Is that bad?', mood: 'worried' },
  { who: 'ravi', text: "That's next level's problem. Time to talk about scaling the data tier.", mood: 'neutral' },
];
