import { test as base, expect, type Page } from '@playwright/test';
import type { QuizQuestion } from '../src/types/content.js';
import { quiz as estimationQuiz } from '../src/content/ch2/C2L04/quiz.js';
import { quiz as clarifyQuiz } from '../src/content/ch3/C3L01/quiz.js';

const test = base.extend<{ checkedPage: Page }>({
  checkedPage: async ({ page }, runFixture) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await runFixture(page);
    expect(errors, 'Browser console/runtime errors').toEqual([]);
  },
});

const c1 = Array.from({ length: 13 }, (_, i) => `L${String(i + 1).padStart(2, '0')}`);
const c2 = ['C2L01', 'C2L02', 'C2L03', 'C2L04'];
const c3 = ['C3L01', 'C3L02', 'C3L03', 'C3L04'];
const games = ['unit-ladder', 'latency-race', 'downtime-budget', 'estimation-workbench', 'clarify', 'blueprint', 'time-boss', 'do-or-dont'];

async function persisted(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('sdq:game')!).state as {
    xp: number;
    progress: Record<string, { stars: number; completedSteps: string[] }>;
    missionResults: Record<string, { goalsMet: boolean; stars: number }>;
    miniGameResults: Record<string, Record<string, number>>;
    badges: Record<string, number>;
  });
}

// Seed only prerequisites, never the level being played. Use a one-time write so
// subsequent navigations/reloads exercise the actual persisted reward state.
async function seed(page: Page, completed: string[], rewardReady?: string) {
  await page.goto('/');
  await page.evaluate(({ completed, rewardReady }) => {
    const state = JSON.parse(localStorage.getItem('sdq:game') ?? '{"state":{}}').state;
    state.progress = Object.fromEntries(completed.map(id => [id, { stars: 1, bestQuiz: 1, completedSteps: ['debrief'] }]));
    if (rewardReady) {
      state.progress[rewardReady] = { stars: 0, bestQuiz: 1, completedSteps: ['mission', 'quiz'] };
      state.missionResults = { [rewardReady]: { goalsMet: true, withinBudget: true, stars: 3 } };
      state.quizResults = { [rewardReady]: { score: 1, heartsLeft: 3 } };
    }
    localStorage.setItem('sdq:game', JSON.stringify({ version: 1, state }));
  }, { completed, rewardReady });
  await page.reload();
}

async function claimDebrief(page: Page, id: string) {
  await page.goto(`/level/${id}/debrief`);
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Badge unlocked');
  await page.getByRole('button', { name: 'Nice', exact: true }).click();
  expect((await persisted(page)).progress[id].stars).toBeGreaterThanOrEqual(1);
}

test('fresh profile gates chapters; claiming each boss opens the next chapter and persists', async ({ checkedPage: page }) => {
  await page.goto('/');
  for (const id of ['C2L01', 'C2L04', 'C3L01', 'C3L04']) {
    await page.goto(`/level/${id}`);
    await expect(page.getByText('Level locked', { exact: true })).toBeVisible();
  }
  await seed(page, c1.slice(0, -1), 'L13');
  await claimDebrief(page, 'L13');
  await page.getByRole('button', { name: 'Next level: Powers of Two' }).click();
  await expect(page).toHaveURL(/\/level\/C2L01$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Powers of Two');
  await seed(page, [...c1, ...c2.slice(0, -1)], 'C2L04');
  await claimDebrief(page, 'C2L04');
  await page.getByRole('button', { name: 'Next level: Ask Before You Build' }).click();
  await expect(page).toHaveURL(/\/level\/C3L01$/);
  await page.reload();
  await expect(page.getByText('Level locked', { exact: true })).toHaveCount(0);
});

test('claiming C3L04 independently opens Interview Mode and keeps it open after reload', async ({ checkedPage: page }) => {
  await seed(page, c3.slice(0, -1), 'C3L04');
  await page.goto('/interview');
  await expect(page.getByRole('heading', { name: 'Interview Mode locked' })).toBeVisible();
  await claimDebrief(page, 'C3L04');
  await page.goto('/interview');
  await expect(page.getByRole('button', { name: 'Start 45-minute interview' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start 45-minute interview' })).toBeVisible();
});

for (const [i, id] of [...c2, ...c3].entries()) {
  test(`${id}: every level route and standalone render loads without browser errors`, async ({ checkedPage: page }) => {
    await seed(page, [...c1, ...c2, ...c3]);
    for (const route of ['', '/incident', '/lesson', '/lab', `/minigame/${games[i]}`, '/mission', '/quiz', '/debrief']) {
      await page.goto(`/level/${id}${route}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText('Level locked', { exact: true })).toHaveCount(0);
      if (route === '/lab') await expect(page.getByTestId('sim-runner')).toBeVisible();
      if (route === '/mission') {
        await page.getByRole('button', { name: 'Skip', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Go live', exact: true })).toBeVisible();
      }
      if (route === '/lesson') await expect(page.getByRole('slider', { name: 'Seek' })).toBeVisible();
      if (route === '/quiz') await expect(page.getByTestId('question-prompt')).toBeVisible();
    }
    await page.goto(`/render/${id}?t=80&capture=1`);
    await expect(page.locator('svg').first()).toBeVisible();
    await expect(page.locator('[data-hotspot]')).toHaveCount(0);
  });
}

async function briefingAndLab(page: Page, id: string, duration: number) {
  await page.goto(`/level/${id}/incident`);
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.evaluate(time => window.__setLessonTime!(time), duration - 0.1);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(async () => (await persisted(page)).progress[id].completedSteps).toContain('lesson');
  await page.getByRole('button', { name: 'Continue to the lab' }).click();
  await expect(page.getByTestId('sim-runner')).toBeVisible();
  await page.getByRole('button', { name: 'Mark explored & back' }).click();
  await page.getByRole('button', { name: /^Mini-game/ }).click();
}

async function wire(page: Page, edges: string[][]) {
  const architecture = page.getByRole('group', { name: 'System architecture', exact: true });
  for (const [from, to] of edges) {
    for (const label of [from, to]) {
      const escaped = label.replace(/[.*+?^$()|[\]{}\\]/g, '\\$&');
      await architecture.getByRole('button', { name: new RegExp(`^${escaped}(?:,|$)`) }).press('Enter');
    }
  }
}

async function runMission(page: Page, id: string) {
  await page.getByRole('button', { name: 'Go live', exact: true }).click();
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'PixelPost survived the launch!' })).toBeVisible({ timeout: 40_000 });
  await page.getByRole('button', { name: 'Claim reward & continue' }).click();
  expect((await persisted(page)).missionResults[id].goalsMet).toBe(true);
  await page.getByRole('button', { name: 'Interview round', exact: true }).click();
}

async function answerQuiz(page: Page, questions: QuizQuestion[]) {
  for (const q of questions) {
    await expect(page.getByTestId('question-prompt')).toHaveText(q.prompt);
    if (q.kind === 'numeric') await page.getByTestId('numeric-input').fill(String(q.answer));
    else if (q.kind === 'mcq') await page.getByTestId(`option-${q.answer}`).click();
    else if (q.kind === 'truefalse') await page.getByTestId(`option-${q.answer}`).click();
    else if (q.kind === 'multi') for (const index of q.answers) await page.getByTestId(`option-${index}`).click();
    else if (q.kind === 'bins') {
      for (const [index, item] of q.items.entries()) {
        await page.getByTestId(`chip-${index}`).click();
        await page.getByTestId(`bin-${item.bin}`).click({ position: { x: 8, y: 8 } });
        await expect(page.getByTestId(`bin-${item.bin}`).getByTestId(`chip-${index}`)).toBeVisible();
      }
    } else if (q.kind === 'order') {
      const announcement = page.locator('[id^="DndLiveRegion-"]');
      for (let desired = 0; desired < q.items.length; desired++) {
        const row = page.getByRole('button', { name: q.items[desired], exact: true });
        let current = Number((await row.getAttribute('data-testid'))!.replace('order-row-', ''));
        while (current > desired) {
          await row.focus();
          await page.keyboard.press('Space');
          await expect(announcement).toContainText(/Picked up draggable item|was moved over droppable area/);
          await page.evaluate(() => new Promise<number>(resolve => requestAnimationFrame(resolve)));
          const above = await page.getByTestId(`order-row-${current - 1}`).textContent();
          const aboveId = q.items.findIndex(text => above?.includes(text));
          await page.keyboard.press('ArrowUp');
          await expect(announcement).toContainText(`was moved over droppable area item-${aboveId}.`);
          await page.keyboard.press('Space');
          await expect(announcement).toContainText('was dropped over droppable area');
          await expect(page.getByTestId(`order-row-${--current}`)).toContainText(q.items[desired]);
        }
      }
    } else throw new Error(`Unhandled walkthrough question ${q.kind}`);
    await page.getByTestId('submit').click();
    await expect(page.getByText('Correct!', { exact: true })).toBeVisible();
    await page.getByTestId('continue').click();
  }
  await expect(page.getByTestId('end-score')).toHaveText('8/8');
  await page.getByTestId('finish').click();
  await page.getByRole('button', { name: 'Continue to debrief' }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Nice', exact: true }).click();
}

test('C2L04: complete briefing, lab, Estimation Workbench, real mission, quiz and reward', async ({ checkedPage: page }) => {
  test.setTimeout(180_000);
  await seed(page, [...c1, ...c2.slice(0, -1)]);
  await briefingAndLab(page, 'C2L04', 176);
  for (const value of ['5000000', '120', '2900', '5800', '6', '8', '15']) {
    await page.getByRole('textbox', { name: /Daily active users|Post QPS|Read QPS|Peak read QPS|Web servers at peak|Photo storage per day|5-year photo storage/ }).fill(value);
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await page.getByRole('button', { name: /^(Next step|Finish napkin)$/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'Estimate report' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  expect((await persisted(page)).miniGameResults.C2L04['estimation-workbench']).toBe(1);
  await page.getByRole('button', { name: 'Back to mission', exact: true }).click();
  await page.getByRole('button', { name: /^Mission/ }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Add Web server', exact: true }).click();
  await page.getByRole('button', { name: 'Add Cache', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  const added = Array.from({ length: 5 }, (_, i) => `Web server ${i + 2}`);
  await wire(page, [...added.flatMap(server => [['Load balancer', server], [server, 'Database (disk)']]),
    ...['Server 1', ...added].map(server => [server, 'Cache 7'])]);
  await runMission(page, 'C2L04');
  await answerQuiz(page, estimationQuiz);
  const state = await persisted(page);
  expect(state.progress.C2L04.stars).toBe(3);
  expect(state.progress.C2L04.completedSteps).toEqual(expect.arrayContaining(['incident', 'lesson', 'lab', 'minigame', 'mission', 'quiz', 'debrief']));
  expect(state.badges['napkin-master']).toBeGreaterThan(0);
  await page.reload();
  expect((await persisted(page)).xp).toBe(state.xp);
  await expect(page.getByRole('button', { name: 'Next level: Ask Before You Build' })).toBeVisible();
});

test('C3L01: complete Clarify!, written assumptions, mission, full quiz and reward', async ({ checkedPage: page }) => {
  test.setTimeout(180_000);
  await seed(page, [...c1, ...c2]);
  await briefingAndLab(page, 'C3L01', 168);
  await page.getByRole('button', { name: 'Enter the interview room' }).click();
  const goodQuestions = [
    'Is this a mobile app, a web app, or both?', 'What are the most important features?',
    'Is the feed reverse chronological, or ranked by weight?', 'How many friends can a user have?',
    'What is the traffic volume?', 'Can the feed contain images and videos, or just text?',
    'What specific features are we going to build?', 'How many users does the product have?',
    'How fast do we expect to scale in 3 months, 6 months and a year?',
    'What is the tech stack? Are there existing services we can reuse?',
  ];
  for (const turns of [6, 4]) {
    for (let i = 0; i < turns; i++) {
      const useful = page.getByRole('button').filter({ hasText: /\?$/ });
      await expect.poll(async () => (await useful.allTextContents()).filter(text => goodQuestions.includes(text.trim())).length).toBe(1);
      const text = (await useful.allTextContents()).find(text => goodQuestions.includes(text.trim()))!.trim();
      await page.getByRole('button', { name: text, exact: true }).click();
      if (text.startsWith('What is the tech stack?')) await page.getByRole('button', { name: 'Write the assumption on the whiteboard' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Scope locked in!' })).toBeVisible();
    await page.getByRole('button', { name: turns === 6 ? 'Next prompt' : 'See results', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Interview scope: 100%' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  expect((await persisted(page)).miniGameResults.C3L01.clarify).toBe(1);
  await page.getByRole('button', { name: 'Back to mission', exact: true }).click();
  await page.getByRole('button', { name: /^Mission/ }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Add Web server', exact: true }).click();
  await page.getByRole('button', { name: 'Add Database (primary)', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await wire(page, [['Web app', 'Web server 1'], ['Mobile app', 'Web server 1'], ['Web server 1', 'Database (primary) 2']]);
  await runMission(page, 'C3L01');
  await answerQuiz(page, clarifyQuiz);
  const state = await persisted(page);
  expect(state.progress.C3L01.stars).toBe(3);
  expect(state.badges.clarifier).toBeGreaterThan(0);
  await page.reload();
  expect((await persisted(page)).xp).toBe(state.xp);
  await expect(page.getByRole('button', { name: 'Next level: Blueprint' })).toBeVisible();
});
