import type { ArchGraph, ComponentKind, LevelDef, QuizQuestion, SimConfig } from '@/types/content';

/**
 * Shared structural validator for every LevelDef. Returns a list of human-readable
 * problems (empty = valid). Used by validate.test.ts for all levels in src/content/ch1.
 */

export const COMPONENT_KINDS: ComponentKind[] = [
  'client', 'mobile', 'dns', 'lb', 'web', 'db', 'db-replica', 'cache', 'cdn', 'session-store',
  'nosql', 'queue', 'worker', 'datacenter', 'shard', 'logging', 'metrics', 'ci', 'storage',
];
const BOOK_PAGES: [number, number] = [5, 33];

const nonEmpty = (s: unknown) => typeof s === 'string' && s.trim().length > 0;
const dupes = <T,>(xs: T[]) => xs.filter((x, i) => xs.indexOf(x) !== i);

export function validateGraph(g: ArchGraph, where: string): string[] {
  const errs: string[] = [];
  const ids = g.nodes.map((n) => n.id);
  for (const d of dupes(ids)) errs.push(`${where}: duplicate node id "${d}"`);
  for (const n of g.nodes) {
    if (!COMPONENT_KINDS.includes(n.kind)) errs.push(`${where}: node ${n.id} has unknown kind ${n.kind}`);
    if (!(n.x >= 0 && n.x <= 1280 && n.y >= 0 && n.y <= 720)) errs.push(`${where}: node ${n.id} outside 1280x720`);
  }
  for (const e of g.edges) {
    if (!ids.includes(e.from) || !ids.includes(e.to)) errs.push(`${where}: edge ${e.from}->${e.to} references a missing node`);
    if (e.from === e.to) errs.push(`${where}: self edge on ${e.from}`);
  }
  return errs;
}

export function validateQuestion(q: QuizQuestion, where: string, pages: [number, number] = BOOK_PAGES): string[] {
  const errs: string[] = [];
  const w = `${where} ${q.id}`;
  if (!nonEmpty(q.id)) errs.push(`${where}: question without id`);
  if (!nonEmpty(q.prompt)) errs.push(`${w}: empty prompt`);
  if (!nonEmpty(q.explanation)) errs.push(`${w}: missing explanation`);
  if (q.page === undefined) errs.push(`${w}: missing page`);
  else if (q.page < pages[0] || q.page > pages[1]) errs.push(`${w}: page ${q.page} outside ${pages[0]}-${pages[1]}`);
  switch (q.kind) {
    case 'mcq':
      if (q.options.length < 2) errs.push(`${w}: mcq needs >= 2 options`);
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) errs.push(`${w}: mcq answer out of range`);
      if (dupes(q.options).length) errs.push(`${w}: duplicate options`);
      break;
    case 'multi':
      if (q.options.length < 3) errs.push(`${w}: multi needs >= 3 options`);
      if (!q.answers.length) errs.push(`${w}: multi needs at least one answer`);
      if (q.answers.some((a) => !Number.isInteger(a) || a < 0 || a >= q.options.length)) errs.push(`${w}: multi answer out of range`);
      if (dupes(q.answers).length) errs.push(`${w}: duplicate answers`);
      if (dupes(q.options).length) errs.push(`${w}: duplicate options`);
      break;
    case 'order':
      if (q.items.length < 3) errs.push(`${w}: order needs >= 3 items`);
      if (dupes(q.items).length) errs.push(`${w}: duplicate order items`);
      break;
    case 'truefalse':
      if (typeof q.answer !== 'boolean') errs.push(`${w}: truefalse answer must be boolean`);
      break;
    case 'bins':
      if (q.bins.length < 2) errs.push(`${w}: bins needs >= 2 bins`);
      if (q.items.length < 3) errs.push(`${w}: bins needs >= 3 items`);
      if (q.items.some((i) => !Number.isInteger(i.bin) || i.bin < 0 || i.bin >= q.bins.length)) errs.push(`${w}: bin index out of range`);
      q.bins.forEach((b, i) => {
        if (!q.items.some((it) => it.bin === i)) errs.push(`${w}: bin "${b}" has no items`);
      });
      if (dupes(q.items.map((i) => i.text)).length) errs.push(`${w}: duplicate bin items`);
      break;
    case 'numeric':
      if (!Number.isFinite(q.answer)) errs.push(`${w}: numeric answer not finite`);
      if (q.tolerance !== undefined && q.tolerance < 0) errs.push(`${w}: negative tolerance`);
      break;
    case 'spot': {
      errs.push(...validateGraph(q.diagram, w));
      const ids = q.diagram.nodes.map((n) => n.id);
      if (!q.answers.length) errs.push(`${w}: spot needs answers`);
      for (const a of q.answers) if (!ids.includes(a)) errs.push(`${w}: spot answer "${a}" not in diagram`);
      break;
    }
    case 'label': {
      errs.push(...validateGraph(q.diagram, w));
      const ids = q.diagram.nodes.map((n) => n.id);
      if (q.labels.length < 2) errs.push(`${w}: label needs >= 2 labels`);
      for (const l of q.labels) if (!ids.includes(l.nodeId)) errs.push(`${w}: label target "${l.nodeId}" not in diagram`);
      if (dupes(q.labels.map((l) => l.nodeId)).length) errs.push(`${w}: two labels on one node`);
      break;
    }
  }
  return errs;
}

export function validateSim(cfg: SimConfig, where: string): string[] {
  const errs = validateGraph(cfg.start, where);
  const ids = cfg.start.nodes.map((n) => n.id);
  for (const k of cfg.palette) if (!COMPONENT_KINDS.includes(k)) errs.push(`${where}: palette has unknown kind ${k}`);
  for (const l of cfg.locked ?? []) if (!ids.includes(l)) errs.push(`${where}: locked id "${l}" not in start graph`);
  if (!(cfg.budget >= 0)) errs.push(`${where}: budget must be >= 0`);
  const g = cfg.goals;
  if (!(g.durationSec > 0)) errs.push(`${where}: goals.durationSec must be > 0`);
  if (g.minUptime !== undefined && (g.minUptime < 0 || g.minUptime > 1)) errs.push(`${where}: minUptime must be 0..1`);
  if (g.minCacheHit !== undefined && (g.minCacheHit < 0 || g.minCacheHit > 1)) errs.push(`${where}: minCacheHit must be 0..1`);
  for (let i = 1; i < cfg.events.length; i++)
    if (cfg.events[i].at < cfg.events[i - 1].at) errs.push(`${where}: events not sorted by time (index ${i})`);
  for (const e of cfg.events) {
    if (e.at < 0 || e.at > g.durationSec) errs.push(`${where}: event at ${e.at}s outside 0..${g.durationSec}`);
    if (e.type === 'message' && !nonEmpty(e.text)) errs.push(`${where}: empty message event`);
    if (e.type === 'traffic' && !(e.rps >= 0)) errs.push(`${where}: traffic rps must be >= 0`);
  }
  for (const d of dupes((cfg.knobs ?? []).map((k) => k.id))) errs.push(`${where}: duplicate knob ${d}`);
  for (const k of cfg.knobs ?? []) {
    if (k.type === 'slider') {
      if (k.min === undefined || k.max === undefined || k.min >= k.max) errs.push(`${where}: knob ${k.id} needs min < max`);
      else if (typeof k.initial !== 'number' || k.initial < k.min || k.initial > k.max) errs.push(`${where}: knob ${k.id} initial out of range`);
    }
    if (k.type === 'toggle' && typeof k.initial !== 'boolean') errs.push(`${where}: toggle ${k.id} initial must be boolean`);
    if (k.type === 'select' && (!k.options?.length || !k.options.includes(String(k.initial)))) errs.push(`${where}: select ${k.id} initial not in options`);
  }
  return errs;
}

export function validateLevel(level: LevelDef): string[] {
  const errs: string[] = [];
  const L = level.id;
  if (!/^L\d\d$/.test(level.id)) errs.push(`${L}: id must look like L01`);
  if (Number(level.id.slice(1)) !== level.number) errs.push(`${L}: number ${level.number} does not match id`);
  if (!nonEmpty(level.title) || !nonEmpty(level.subtitle)) errs.push(`${L}: title/subtitle required`);
  if (!(level.users >= 1)) errs.push(`${L}: users must be >= 1`);
  const [p0, p1] = level.pages;
  if (p0 > p1 || p0 < BOOK_PAGES[0] || p1 > BOOK_PAGES[1]) errs.push(`${L}: pages ${p0}-${p1} invalid`);
  if (!nonEmpty(level.badge.id) || !nonEmpty(level.badge.name) || !nonEmpty(level.badge.description) || !nonEmpty(level.badge.icon))
    errs.push(`${L}: badge fields required`);

  for (const [name, lines] of [['incident', level.incident], ['debrief', level.debrief], ['mission.brief', level.mission.brief]] as const) {
    if (lines.length < 2) errs.push(`${L}: ${name} needs dialogue`);
    lines.forEach((d, i) => !nonEmpty(d.text) && errs.push(`${L}: ${name}[${i}] empty text`));
  }

  /* lesson */
  const ls = level.lesson;
  if (!(ls.duration > 0)) errs.push(`${L}: lesson duration must be > 0`);
  if (typeof ls.Scene !== 'function') errs.push(`${L}: lesson.Scene must be a component`);
  if (!ls.chapters.length || ls.chapters[0].at !== 0) errs.push(`${L}: first chapter must start at 0`);
  ls.chapters.forEach((c, i) => {
    if (i && c.at <= ls.chapters[i - 1].at) errs.push(`${L}: chapters not strictly sorted at ${i}`);
    if (c.at >= ls.duration) errs.push(`${L}: chapter "${c.title}" starts after the end`);
  });
  ls.captions.forEach((c, i) => {
    if (!(c.start < c.end)) errs.push(`${L}: caption ${i} has start >= end`);
    if (c.start < 0 || c.end > ls.duration) errs.push(`${L}: caption ${i} outside 0..duration`);
    if (!nonEmpty(c.text)) errs.push(`${L}: caption ${i} empty`);
    if (i && c.start < ls.captions[i - 1].end) errs.push(`${L}: caption ${i} overlaps/unsorted`);
  });
  for (const d of dupes(ls.hotspots.map((h) => h.id))) errs.push(`${L}: duplicate hotspot ${d}`);
  ls.hotspots.forEach((h) => (!nonEmpty(h.title) || !nonEmpty(h.body)) && errs.push(`${L}: hotspot ${h.id} needs title/body`));
  ls.checkpoints.forEach((cp, i) => {
    if (!(cp.at > 0 && cp.at < ls.duration)) errs.push(`${L}: checkpoint ${i} at ${cp.at} outside (0, duration)`);
    if (i && cp.at <= ls.checkpoints[i - 1].at) errs.push(`${L}: checkpoints not sorted`);
    errs.push(...validateQuestion(cp.question, `${L} checkpoint`, level.pages));
  });

  /* lab / mission */
  if (!nonEmpty(level.lab.intro)) errs.push(`${L}: lab intro required`);
  if (!level.lab.tasks.length) errs.push(`${L}: lab needs tasks`);
  errs.push(...validateSim(level.lab.config, `${L} lab`));
  errs.push(...validateSim(level.mission.config, `${L} mission`));
  if (level.mission.hints.length < 1) errs.push(`${L}: mission needs hints`);

  /* mini-games */
  for (const d of dupes(level.miniGames.map((m) => m.id))) errs.push(`${L}: duplicate mini-game ${d}`);
  level.miniGames.forEach((m) => {
    if (!nonEmpty(m.title) || !nonEmpty(m.intro)) errs.push(`${L}: mini-game ${m.id} needs title/intro`);
    if (typeof m.Component !== 'function' && typeof m.Component !== 'object') errs.push(`${L}: mini-game ${m.id} needs a Component`);
  });

  /* quiz + cards */
  if (level.quiz.length < 6 || level.quiz.length > 10) errs.push(`${L}: quiz should have 6-10 questions (has ${level.quiz.length})`);
  const allIds = [...level.quiz.map((q) => q.id), ...ls.checkpoints.map((c) => c.question.id)];
  for (const d of dupes(allIds)) errs.push(`${L}: duplicate question id ${d}`);
  level.quiz.forEach((q) => errs.push(...validateQuestion(q, `${L} quiz`, level.pages)));
  if (level.cards.length < 3 || level.cards.length > 5) errs.push(`${L}: cards should be 3-5 (has ${level.cards.length})`);
  level.cards.forEach((c, i) => (!nonEmpty(c.front) || !nonEmpty(c.back)) && errs.push(`${L}: card ${i} empty`));
  return errs;
}
