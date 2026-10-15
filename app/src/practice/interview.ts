import type { QuizQuestion, SimConfig, ArchGraph } from '@/types/content';
import type { ArchitectureRubric } from './architecture';

export interface InterviewPrompt {
  id: string; title: string; brief: string; registered: number; activeFraction: number;
  requestsPerUser: number; peakFactor: number; writesPerUser: number; bytesPerWrite: number; retentionDays: number;
  requirements: string[]; rubric: ArchitectureRubric; bottleneck: string;
  followups: QuizQuestion[];
}
export const clarifyOptions = [
  { text: 'Which user actions and features are in scope?', quality: 'good', reason: 'Scope prevents spending the session on the wrong features.' },
  { text: 'How many daily active users and requests per user should we expect?', quality: 'good', reason: 'Traffic assumptions set the capacity target.' },
  { text: 'What latency, availability and consistency guarantees matter?', quality: 'good', reason: 'Quality requirements determine trade-offs and failure behavior.' },
  { text: 'How long is data retained, and what is the typical record size?', quality: 'good', reason: 'Retention and payload size make a storage estimate possible.' },
  { text: 'What programming language does the team prefer?', quality: 'neutral', reason: 'Useful later, but it does not settle the system scope.' },
  { text: 'Can we assume infinite budget and zero failures?', quality: 'bad', reason: 'This discards the constraints the design needs to address.' },
  { text: 'Can I choose a database before discussing requirements?', quality: 'bad', reason: 'Choose storage after understanding access patterns and guarantees.' },
] as const;
export const wrapOptions = [
  { text: 'Restate the requirements and how the design meets them', good: true },
  { text: 'Explain failure modes, monitoring and recovery', good: true },
  { text: 'Describe trade-offs and the next scaling bottleneck', good: true },
  { text: 'Claim the design has no limitations', good: false },
  { text: 'Introduce a major new feature in the final minute', good: false },
] as const;
export const bottlenecks = ['Read amplification and hot keys', 'Write volume and fan-out', 'Queue backlog and slow consumers', 'Metadata index and lookup throughput'];
const question = (id: string, prompt: string, options: string[], answer: number, explanation: string): QuizQuestion => ({ id, kind: 'mcq', prompt, options, answer, explanation, page: 49 });
function followups(id: string): QuizQuestion[] {
  return [
    question(`${id}-failure`, 'A primary fails just after acknowledging a write. What must you clarify?', ['Whether replication was synchronous and what durability was promised', 'The color of the database icon', 'Whether CSS loaded'], 0, 'Acknowledgement and replication guarantees determine whether the accepted write can be lost.'),
    question(`${id}-tradeoff`, 'A cache removes most read load. What trade-off remains?', ['Cache entries are always consistent by default', 'Freshness, invalidation and stampede control still need a policy', 'Durable storage is no longer necessary'], 1, 'Caching improves latency while introducing freshness and failure concerns.'),
    question(`${id}-observe`, 'Which signal best validates your latency promise?', ['Average CPU on one machine', 'Total lines of source code', 'End-to-end p95/p99 latency and error rate'], 2, 'Measure user-visible latency distributions and errors, then use host metrics to diagnose them.'),
  ];
}
const baseRubric: ArchitectureRubric = { loadBalancing: true, databaseRedundancy: true, noSinglePointOfFailure: true };
export const interviewPrompts: InterviewPrompt[] = [
  { id: 'pixelpost', title: 'PixelPost for 10M users', brief: 'Design the next version of our photo-sharing service.', registered: 10000000, activeFraction: 0.2, requestsPerUser: 30, peakFactor: 5, writesPerUser: 2, bytesPerWrite: 2000000, retentionDays: 365, requirements: ['Upload photos and read a feed.', 'Keep metadata durable; use CDN delivery for media.', 'p95 ≤350ms, ≥98% availability during the sampled failure test.'], rubric: { ...baseRubric, readHeavy: true, media: true, async: true }, bottleneck: bottlenecks[0], followups: followups('pixelpost') },
  { id: 'shortener', title: 'URL shortener-lite', brief: 'Support short-link creation and fast redirects.', registered: 5000000, activeFraction: 0.2, requestsPerUser: 20, peakFactor: 5, writesPerUser: 1, bytesPerWrite: 500, retentionDays: 365, requirements: ['Create a stable short URL and redirect from it.', 'Redirect traffic is read-heavy; prevent identifier collisions.', 'p95 ≤350ms; ≥98% availability during the sampled failure test.'], rubric: { ...baseRubric, readHeavy: true }, bottleneck: bottlenecks[0], followups: followups('shortener') },
  { id: 'chat', title: 'Chat app at 1M DAU', brief: 'Design durable one-to-one messaging.', registered: 5000000, activeFraction: 0.2, requestsPerUser: 80, peakFactor: 5, writesPerUser: 40, bytesPerWrite: 1000, retentionDays: 30, requirements: ['Send and receive one-to-one messages; preserve per-conversation order.', 'Queue offline delivery, define acknowledgement semantics.', 'p95 ≤350ms; ≥98% availability during the sampled failure test.'], rubric: { ...baseRubric, async: true }, bottleneck: bottlenecks[1], followups: followups('chat') },
  { id: 'feed', title: 'News feed', brief: 'Deliver a personalized feed of followed accounts.', registered: 20000000, activeFraction: 0.25, requestsPerUser: 40, peakFactor: 5, writesPerUser: 2, bytesPerWrite: 2000, retentionDays: 90, requirements: ['Publish a post and read a recent feed.', 'Handle celebrity fan-out without blocking publication.', 'p95 ≤350ms; ≥98% availability during the sampled failure test.'], rubric: { ...baseRubric, readHeavy: true, async: true }, bottleneck: bottlenecks[1], followups: followups('feed') },
  { id: 'photos', title: 'Photo upload pipeline', brief: 'Accept uploads and asynchronously generate thumbnails.', registered: 2000000, activeFraction: 0.5, requestsPerUser: 10, peakFactor: 5, writesPerUser: 3, bytesPerWrite: 4000000, retentionDays: 30, requirements: ['Store originals durably and queue image transforms.', 'Retry jobs safely and deliver thumbnails through a CDN.', 'p95 ≤350ms; ≥98% availability during the sampled failure test.'], rubric: { ...baseRubric, media: true, async: true }, bottleneck: bottlenecks[2], followups: followups('photos') },
  { id: 'notifications', title: 'Notification fan-out', brief: 'Deliver push notifications to a large subscriber set.', registered: 10000000, activeFraction: 0.3, requestsPerUser: 15, peakFactor: 5, writesPerUser: 10, bytesPerWrite: 800, retentionDays: 7, requirements: ['Queue fan-out and retry failed deliveries.', 'Avoid duplicate user-visible notifications through idempotency.', 'p95 ≤350ms; ≥98% availability during the sampled failure test.'], rubric: { ...baseRubric, async: true }, bottleneck: bottlenecks[2], followups: followups('notifications') },
  { id: 'leaderboard', title: 'Leaderboard', brief: 'Track player scores and serve a top-100 ranking.', registered: 4000000, activeFraction: 0.25, requestsPerUser: 50, peakFactor: 5, writesPerUser: 15, bytesPerWrite: 100, retentionDays: 30, requirements: ['Update scores and read the top 100.', 'Define tie-breaking and acceptable staleness.', 'p95 ≤350ms; ≥98% availability during the sampled failure test.'], rubric: { ...baseRubric, readHeavy: true }, bottleneck: bottlenecks[1], followups: followups('leaderboard') },
  { id: 'video', title: 'Video streaming metadata', brief: 'Design the metadata service behind a video catalog.', registered: 30000000, activeFraction: 0.2, requestsPerUser: 25, peakFactor: 5, writesPerUser: 1, bytesPerWrite: 5000, retentionDays: 365, requirements: ['Store title/owner/playback metadata and support lookup.', 'Use CDN delivery; video encoding and byte storage are out of scope.', 'p95 ≤350ms; ≥98% availability during the sampled failure test.'], rubric: { ...baseRubric, readHeavy: true, media: true }, bottleneck: bottlenecks[3], followups: followups('video') },
];
export function expectedEstimates(prompt: InterviewPrompt): number[] {
  const dau = prompt.registered * prompt.activeFraction;
  const qps = dau * prompt.requestsPerUser / 86400;
  return [dau, qps, qps * prompt.peakFactor, dau * prompt.writesPerUser * prompt.bytesPerWrite * prompt.retentionDays / 1e9];
}
export function gradeEstimates(prompt: InterviewPrompt, answers: number[]): { score: number; expected: number[]; correct: boolean[] } {
  const expected = expectedEstimates(prompt);
  const correct = expected.map((value, i) => Number.isFinite(answers[i]) && Math.abs(answers[i] - value) <= Math.max(1, value * 0.2));
  return { score: correct.filter(Boolean).length * 25, expected, correct };
}
export function interviewConfig(prompt: InterviewPrompt, graph: ArchGraph): SimConfig {
  return { start: graph, palette: [], locked: graph.nodes.map(n => n.id), budget: 3600,
    events: [{ at: 0, type: 'traffic', rps: 700 }, { at: 12, type: 'traffic', rps: 1200 },
      ...(prompt.rubric.async ? [{ at: 0, type: 'jobs' as const, perSec: 30 }] : []),
      { at: 25, type: 'kill', target: 'web' }, { at: 40, type: 'revive', target: 'web' }],
    goals: { durationSec: 60, minUptime: 0.98, maxP95Ms: 350, maxCost: 3600, ...(prompt.rubric.async ? { maxQueue: 100 } : {}) },
  };
}
export function interviewGrade(scores: number[], sloPassed: boolean, structurePassed = true) {
  const raw = Math.round(scores.reduce((sum, score) => sum + Math.max(0, Math.min(100, score)), 0) / 4);
  const score = !sloPassed ? Math.min(54, raw) : !structurePassed ? Math.min(69, raw) : raw;
  return { score, grade: score >= 85 ? 'Strong Hire' : score >= 70 ? 'Hire' : score >= 55 ? 'Lean Hire' : 'No Hire', xp: score * 5 };
}
