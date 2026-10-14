# System Design Quest: Game Design (Chapter 1)

Chapter 1 of the book = "Scale From Zero To Millions Of Users".
In the game you live through that story instead of reading it.

## 1. Story

You are the first engineer at PixelPost, a tiny photo-sharing startup.
- Maya, the founder and CEO, keeps bringing growth news ("We got featured on
  TV tonight!") and that growth keeps breaking your system.
- Ravi, a senior architect, is your mentor. He shows up in the lessons, gives
  hints and runs your "interview rounds".
- "The Pager" is the villain: incidents that fire in the middle of a level.

The user counter on screen climbs from 1 to 10,000,000. Every level starts with
an incident caused by growth and ends with you fixing it by learning one new
building block. PixelPost is a photo app on purpose, because the book's own
examples (photo-processing queue, celebrity hotspot) fit it naturally.

## 2. The loop inside every level (a "mission")

1. Incident (story scene, 20-40 s): the pager goes off, something breaks in
   the animation, and Maya or Ravi frames the problem.
2. Briefing (animated lesson, 2-4 min): step-by-step animated explanation with
   captions. Play, pause, scrub, and "tap to explore" hotspots on the diagram.
   It pauses for quick check-in questions.
3. Lab (interactive sandbox): you play with the concept and break things on
   purpose (kill a server, change the TTL, push traffic).
4. Mission (the game part): fix the live system in the architecture builder
   while simulated traffic runs. You have goals (uptime, latency) and a budget
   in cloud credits, and the system throws failure events at you.
5. Interview round (quiz): 6-10 mixed questions asked by Ravi. Every answer
   comes with an explanation.
6. Debrief: key-takeaway cards, XP, stars, a badge, and a new piece added to
   your architecture map.

## 3. Game systems

- XP and ranks: Intern -> Junior Engineer -> Engineer -> Senior -> Staff ->
  Principal Architect.
- 3 stars per mission:
  - 1 star: goals met.
  - 2 stars: goals met and within budget.
  - 3 stars: goals met, within budget, and no hints used.
- Cloud credits: every component costs credits. You learn trade-offs, not just
  definitions.
- Uptime / latency / cost meters on screen during missions. Crossing a red line
  costs you a "life" (3 per mission).
- Hints from Ravi cost XP.
- Badges (one per level, plus hidden achievements), for example:
  - "Chaos Monkey": you kill every server in a lab.
  - "Zero Downtime": you finish the boss level without a single outage.
- Daily streak, plus a daily "Flashback": 5 spaced-repetition questions from
  levels you already finished, so earlier topics don't fade.
- Architecture map: a home screen showing PixelPost's system. It grows one
  component per level and every piece is clickable to revisit its lesson.
- Unlocks: the next level opens after 1 star. The boss level needs all 12
  levels done.

## 4. Question types (used across all quizzes)

- Multiple choice (one answer)
- Pick all that apply
- Put the steps in order (e.g. the 4-step request flow, the 6-step CDN flow)
- Spot the single point of failure: click the component on the diagram
- "What happens if...?": a component dies, you predict the outcome
- Sort into bins: drag items into groups (SQL vs NoSQL, which metric type)
- Calculate: e.g. which shard does user 1003 go to with user_id % 4?
- Label the diagram: drag names onto the boxes
- True/false, followed by "why?"

## 5. The 13 levels

Users  | # | Level | What you learn | Mission and mini-games | Badge
------ | - | ----- | -------------- | ---------------------- | -----
1 | 1 | Hello, World | single server, DNS, request flow, web vs mobile traffic, JSON | Lab: type api.pixelpost.com and watch the DNS lookup, IP, HTTP request and JSON response travel. Mission: wire the first deploy and order the 4 flow steps | First Request
1K | 2 | Split the Tiers | web tier vs data tier, SQL vs NoSQL and when NoSQL fits | Incident: app and DB fight for one CPU. Mini-game: sort PixelPost features into SQL or NoSQL. Mission: separate the tiers | Data Whisperer
10K | 3 | Bigger or More? | vertical vs horizontal scaling, hard limits, no failover | Lab: an upgrade slider hits a hardware wall, then the server dies and the site goes down. Mission: choose a strategy for a spike under a budget | Scale Thinker
50K | 4 | Traffic Cop | load balancer, public vs private IPs, failover, adding to the pool | Incident: TV launch spike. Lab: kill server 1 and watch traffic reroute. Mission: hold 99.9% uptime through a surge | Load Balanced
100K | 5 | Copy That | master/replica replication, read/write split, failover, promotion, stale data | Mini-game: route each query (SELECT/INSERT/UPDATE) to the right DB. Lab: kill a replica, then kill the master and watch the promotion | Replicator
300K | 6 | Memory Lane | cache tier, read-through, when to cache, TTL, consistency, single point of failure, eviction (LRU/LFU/FIFO) | Lab: a TTL slider (too short hammers the DB, too long serves stale data). Mini-game: predict which item LRU evicts. Mission: bring latency under target | Cache Money
500K | 7 | Closer to Home | CDN, distance and latency, the 6-step CDN flow, TTL, cost, fallback, invalidation (?v=2) | Lab: world map showing load times for users in different cities. Mission: choose which assets go on the CDN within budget, then survive a CDN outage via fallback | Edge Lord
1M | 8 | Forget Me Not | stateful vs stateless, sticky sessions, shared session store, autoscaling | Incident: users randomly logged out after adding server 3. Lab: sticky sessions break when a server dies. Mission: move sessions out, then autoscale through a traffic wave | Stateless
2M | 9 | Going Global | multiple data centers, geoDNS, traffic split, failover, data sync, testing and deployment | Lab: drag the US-East/US-West split slider. Mission: survive a full US-West outage without losing data | Globetrotter
3M | 10 | Take a Number | message queue, producers and consumers, decoupling, async photo jobs, scaling workers | Feature launch: photo filters make uploads slow. Timed mini-game: add or remove workers to keep the queue short | Queue Master
5M | 11 | Eyes on the System | logging, metrics (host, aggregated, business), automation and CI | Detective mini-game: a mystery outage, solved by reading logs and dashboards to find the root cause. Sort metrics into types; order the CI pipeline | Detective
8M | 12 | Divide and Conquer | DB vertical scaling limits (24 TB RAM, Stack Overflow's single master), sharding, sharding key, resharding, celebrity hotspot, joins and denormalization | Mini-game: shard router, predict user_id % 4. Lab: good vs bad sharding keys. Incident: a celebrity post melts one shard | Shard Lord
10M | 13 | BOSS: Launch Night | everything | Build PixelPost from scratch within budget, then survive waves: spike, server crash, cache crash, data-center outage, celebrity post, queue backlog. Final quiz: recall the 8-point scaling checklist | Principal Architect

After the boss there is also an Interview Mode: an open prompt
("Design a system for 1M users") where you build the architecture and get
graded against a checklist rubric.

## 6. One shared simulation engine (keeps it consistent and buildable)

Labs, missions and the boss level all run on one engine:
- Components: client, DNS, load balancer, web server, DB master/replica,
  cache, CDN, session store, queue, worker, data center, shard, metrics.
- Each component has a capacity, a latency, a cost and a health state.
- Requests are animated dots moving along the connections.
- Scripted events: traffic spike, kill a component, a region goes down,
  a celebrity post.
- Live meters: uptime, p95 latency, cost, queue length, cache hit rate.

Each level is mostly data: an incident script, a lab config, mission goals and
events, and a quiz.

## 7. Content per level (written from the book text, pages 5-33)

- story.json: incident and debrief dialogue
- lesson: animated React scene plus captions and check-in questions
- lab.json / mission.json: simulator config, goals, events, budget
- quiz.json: 6-10 questions, each with an explanation and a page reference
- cards.json: 3-5 key-takeaway cards, which also feed the Flashback reviews

Estimated total: about 100 quiz questions, 13 animated lessons, 13 labs,
13 missions, 1 boss level.
