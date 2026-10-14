import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';
import { IP } from './data';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 1: PixelPost has exactly one user. Let us build the system that serves them.'),
  c(5, 10, 'Every big system starts small. Ours starts with a single server.'),
  c(10, 14, 'On that one machine we run the web app, the database and a cache.'),
  c(14, 19, 'Everything lives in one box. Easy to build, easy to reason about.'),
  c(19, 24, "To understand this setup, let's follow one request from start to finish."),
  c(24, 29, 'A visitor opens a browser and types our domain name: api.pixelpost.com.'),
  c(29, 34, 'Computers do not route by names, though. They need an IP address.'),
  c(34, 38, 'Step 1: the browser asks the Domain Name System (DNS) where that name lives.'),
  c(38, 43, 'DNS is usually a paid service run by a third party, not hosted on our server.'),
  c(43, 48, `Step 2: DNS answers with an IP address: ${IP}.`),
  c(48, 54, 'Think of DNS as the internet\'s phone book: name in, number out.'),
  c(54, 60, 'Now the browser knows exactly which machine to talk to.'),
  c(60, 63, 'Quick check before we continue!'),
  c(63, 68, 'Step 3: the browser sends an HTTP request straight to our web server at that IP.'),
  c(68, 72, 'The web app handles it, reading data from the database on the same machine.'),
  c(72, 77, 'Step 4: the server sends back a response, here an HTML page.'),
  c(77, 82, 'The browser renders the HTML, and the PixelPost feed appears.'),
  c(82, 87, 'Four steps: ask DNS, get the IP, send HTTP, receive HTML or JSON.'),
  c(87, 92, 'That round trip happens for every single page view.'),
  c(92, 97, 'Where does our traffic come from? Two places: the web app and the mobile app.'),
  c(97, 102, 'The web app uses server-side languages like Java or Python for business logic and storage.'),
  c(102, 107, 'The browser gets HTML and JavaScript back: client-side code for presentation.'),
  c(107, 113, 'So the work is split: the server decides what to show, the browser decides how it looks.'),
  c(113, 118, 'The mobile app talks to the same web server, and it also uses HTTP.'),
  c(118, 123, 'It asks for data, for example GET /users/12: fetch the user whose id is 12.'),
  c(123, 128, 'The server replies in JSON (JavaScript Object Notation).'),
  c(128, 133, 'JSON is the go-to API format because it is simple to read and to parse.'),
  c(133, 138, 'The app takes that JSON and draws its own native screens.'),
  c(138, 142, 'Check-in time: can you put the four steps in order?'),
  c(142, 147, "Then Maya's launch post goes viral. Users start pouring in."),
  c(147, 152, '10 users… 100 users… every visit is another request to our one server.'),
  c(152, 157, 'The web app, the database and the cache all compete for the same CPU and memory.'),
  c(157, 162, 'Responses slow down. The CPU meter climbs into the red.'),
  c(162, 167, 'At around 1,000 users the box is maxed out and requests start timing out.'),
  c(167, 172, 'And if this one server dies, all of PixelPost goes down with it.'),
  c(172, 177, 'One server was the perfect start, but it will not get us any further.'),
  c(177, 180, 'Next level: split the tiers.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'single-server',
    title: 'Single server setup',
    body: 'The simplest possible deployment: the web app, database, cache and so on all run on one machine. It is cheap and easy to start with, but every part competes for the same resources, and one failure takes everything down.',
  },
  {
    id: 'dns',
    title: 'Domain Name System',
    body: 'Users reach sites by domain name (api.pixelpost.com). DNS turns that name into the IP address of the server. DNS is normally a paid third-party service, not something running on our own servers.',
  },
  {
    id: 'ip',
    title: `IP address ${IP}`,
    body: 'The Internet Protocol address is the number that identifies our server on the network. Once the browser or mobile app has it, HTTP requests go directly to that address.',
  },
  {
    id: 'json',
    title: 'JSON API responses',
    body: 'Mobile apps talk to the web server over HTTP, and JSON (JavaScript Object Notation) is the common response format because it is simple. GET /users/12 means "give me the user object whose id is 12".',
  },
  {
    id: 'cpu',
    title: 'Why the box groans',
    body: 'With everything on one server, the web app and the database fight over the same CPU, memory and disk. When traffic grows, there is no way to scale one part without the other.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.http - 1,
    question: {
      id: 'L01-cp1',
      kind: 'mcq',
      prompt: 'The browser asked DNS about api.pixelpost.com. What does DNS send back?',
      options: ['The HTML of the home page', 'The IP address of the server', 'A JSON user object', 'A copy of the database'],
      answer: 1,
      explanation: `DNS only translates the name into an IP address (here ${IP}). The page itself comes from our web server afterwards.`,
      page: 6,
    },
  },
  {
    at: T.growth - 2,
    question: {
      id: 'L01-cp2',
      kind: 'order',
      prompt: 'Put the request flow in order.',
      items: [
        'User enters a domain name and DNS is asked for it',
        'An IP address is returned to the browser or app',
        'HTTP request is sent directly to the web server',
        'The web server returns HTML or JSON',
      ],
      explanation: 'Name, then IP, then HTTP request, then HTML/JSON response: the four-step request flow.',
      page: 6,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'One box to rule them all' },
    { at: T.dns, title: 'Ask the phone book (DNS)' },
    { at: T.http, title: 'The HTTP round trip' },
    { at: T.sources, title: 'Web app vs mobile app' },
    { at: T.growth, title: 'Growing pains' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
