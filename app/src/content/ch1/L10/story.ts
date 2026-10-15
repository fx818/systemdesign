import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'narrator', text: 'Launch day for PixelPost Filters. Crop! Sharpen! Blur! The marketing video has dramatic violins.' },
  { who: 'maya', text: 'Filters are LIVE! Everyone is blurring their exes out of group photos. Engagement is through the roof!', mood: 'happy' },
  { who: 'pager', text: 'BZZT! Upload p95: 21 seconds. Web servers at 100% CPU. Even the login page is timing out. BZZT!', mood: 'panic' },
  { who: 'player', text: 'Every upload makes a web server sit there sharpening pixels while the user stares at a spinner.', mood: 'worried' },
  { who: 'maya', text: 'Twenty seconds to post a selfie?! People will go back to... to the OTHER app!', mood: 'panic' },
  { who: 'ravi', text: 'The web tier is doing slow work it doesn\'t need to finish before answering the user.', mood: 'neutral' },
  { who: 'ravi', text: 'Write the job down, hand it off, reply right away. Let someone else do the heavy lifting.', mood: 'neutral' },
  { who: 'player', text: 'Like a deli counter. Take a number, someone calls it when your sandwich is ready.', mood: 'happy' },
  { who: 'ravi', text: 'Exactly. In our world, that ticket machine is a message queue.', mood: 'proud' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Mission: put a message queue between the web servers and the photo processing. Workers do the filters.' },
  { who: 'ravi', text: 'Keep web p95 low and keep the queue under the red line. Scale workers when it grows.' },
  { who: 'maya', text: 'We\'re running a "Blur Your Boss" contest at the 30-second mark. Expect... a lot of blurring.', mood: 'worried' },
  { who: 'pager', text: 'bzzt. I might kill a worker or two. You know, for character building.', mood: 'neutral' },
  { who: 'player', text: 'Producers publish, consumers process. Nobody waits on a spinner. Let\'s go.', mood: 'proud' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'Uploads finish in half a second! The filters pop in a moment later and nobody minds!', mood: 'happy' },
  { who: 'ravi', text: 'Web servers publish jobs and answer at once. Workers pick jobs off the queue and process them asynchronously.', mood: 'proud' },
  { who: 'player', text: 'And when a worker died, the jobs just waited in the queue. The producer never noticed.', mood: 'happy' },
  { who: 'ravi', text: 'That\'s decoupling. Producers and consumers scale independently: more workers when the queue grows, fewer when it\'s empty.', mood: 'neutral' },
  { who: 'maya', text: 'Three million users! Investors want a dashboard. With charts. Lots of charts.', mood: 'proud' },
  { who: 'pager', text: 'bzzt... dashboards? You can\'t even see me coming yet.', mood: 'neutral' },
  { who: 'ravi', text: 'Then it\'s time for logs, metrics and automation. Next level.', mood: 'neutral' },
];
