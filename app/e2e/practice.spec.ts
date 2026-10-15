import { test as base, expect, type Page } from '@playwright/test';

const test = base.extend<{ checkedPage: Page }>({
  checkedPage: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await use(page);
    expect(errors, 'Browser console/runtime errors').toEqual([]);
  },
});

for (const [route, title] of [['/interview', 'Interview Mode'], ['/sandbox', 'Sandbox'], ['/puzzle', 'Daily Puzzle'], ['/survival', 'Survival']]) {
  test(`${route} loads without browser errors`, async ({ checkedPage: page }) => {
    if (route === '/interview') await page.addInitScript(() => localStorage.setItem('sdq:game', JSON.stringify({ version: 1, state: { progress: { L13: { stars: 1, bestQuiz: 1, completedSteps: [] } } } })));
    await page.goto(route);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    if (route === '/interview') await expect(page.getByRole('button', { name: 'Start 45-minute interview' })).toBeVisible();
    else await expect(page.getByRole('group', { name: 'System architecture', exact: true })).toBeVisible();
    if (route === '/survival') {
      await page.getByRole('button', { name: 'Start survival', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Pause survival' })).toBeVisible();
      await expect(page.getByRole('status').filter({ hasText: '100 req/s' })).toBeVisible();
      await page.getByRole('button', { name: 'End run & save' }).click();
      await expect(page.getByRole('heading', { name: /Run saved/ })).toBeVisible();
    }
  });
}

test('interview gate and chapter selector remain usable', async ({ checkedPage: page }) => {
  await page.goto('/interview');
  await expect(page.getByRole('heading', { name: 'Interview Mode locked' })).toBeVisible();
  await page.goto('/');
  await page.getByRole('button', { name: /Chapter 2 Back-of-the-Envelope/ }).click();
  await expect(page.getByRole('heading', { name: 'Architecture map' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Back-of-the-Envelope Estimation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Chapter 4 Design a Rate Limiter/ }).click();
  await expect(page.getByText('This chapter is coming soon.')).toBeVisible();
});

test('sandbox exports PNG/JSON/Mermaid and imports a validated workspace', async ({ checkedPage: page }) => {
  await page.goto('/sandbox');
  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PNG' }).click();
  expect((await pngDownload).suggestedFilename()).toBe('sd-quest-architecture.png');
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON' }).click();
  expect((await jsonDownload).suggestedFilename()).toBe('sd-quest-architecture.json');
  await page.getByRole('button', { name: 'Copy Mermaid' }).click();
  await expect(page.getByRole('textbox', { name: 'Mermaid export' })).toHaveValue(/^flowchart LR/);
  await page.getByLabel('Import JSON').setInputFiles({ name: 'graph.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ nodes: [{ id: 'client', kind: 'client', label: 'Imported users', x: 100, y: 200 }], edges: [] })) });
  await expect(page.getByRole('button', { name: 'Imported users', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Run a copy' }).click();
  await expect(page.getByTestId('sim-runner')).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Traffic (requests/sec)' })).toBeVisible();
  await page.getByRole('button', { name: 'Inject a failure' }).click();
  await expect(page.getByRole('button', { name: 'Traffic spike ×2' })).toBeVisible();
});

test('lab chaos unlocks a persisted hidden achievement', async ({ checkedPage: page }) => {
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00Z'));
  await page.goto('/sandbox');
  await page.getByRole('button', { name: 'Run a copy' }).click();
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await page.getByRole('button', { name: 'Inject a failure' }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: /× Kill/ }).first().click();
  await expect(page.getByText('Achievement unlocked: Chaos Monkey')).toBeVisible();
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Chaos Monkey', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '???', exact: true })).toHaveCount(7);
});

test('a complete four-phase interview earns a persisted rubric grade', async ({ checkedPage: page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => localStorage.setItem('sdq:game', JSON.stringify({ version: 1, state: { progress: { C3L04: { stars: 1, bestQuiz: 1, completedSteps: [] } } } })));
  await page.goto('/interview');
  await page.getByRole('button', { name: /URL shortener-lite Support short-link/ }).click();
  await page.getByRole('button', { name: 'Start 45-minute interview' }).click();
  for (const text of ['Which user actions and features are in scope?', 'How many daily active users and requests per user should we expect?', 'What latency, availability and consistency guarantees matter?', 'How long is data retained, and what is the typical record size?']) await page.getByRole('checkbox', { name: text, exact: true }).check();
  await page.getByRole('button', { name: 'Reveal requirements & estimate' }).click();
  for (const [label, value] of [['Daily active users', '1000000'], ['Average requests / second', '231.48'], ['Peak requests / second', '1157.4'], ['Retained storage (GB, decimal)', '182.5']]) await page.getByRole('spinbutton', { name: label, exact: true }).fill(value);
  await page.getByRole('button', { name: 'Continue to design' }).click();
  const architecture = page.getByRole('group', { name: 'System architecture', exact: true });
  for (const kind of ['Load balancer', 'Load balancer', 'Web server', 'Web server', 'Web server', 'Database (primary)', 'DB replica', 'Cache', 'Cache']) await page.getByRole('button', { name: `Add ${kind}`, exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  const balancers = ['Load balancer 1', 'Load balancer 2'];
  const servers = ['Web server 3', 'Web server 4', 'Web server 5'];
  const edges = [
    ...balancers.map(to => ['Users', to]),
    ...balancers.flatMap(from => servers.map(to => [from, to])),
    ...servers.flatMap(from => ['Cache 8', 'Cache 9', 'Database (primary) 6'].map(to => [from, to])),
    ['Cache 8', 'Database (primary) 6'], ['Cache 9', 'Database (primary) 6'], ['Database (primary) 6', 'DB replica 7'],
  ];
  for (const [from, to] of edges) {
    await architecture.getByRole('button', { name: from, exact: true }).press('Enter');
    await architecture.getByRole('button', { name: to, exact: true }).press('Enter');
  }
  await expect(page.getByText(/Structural score: 100%/)).toBeVisible();
  await page.getByRole('button', { name: 'Submit design to simulation' }).click();
  await page.getByRole('button', { name: 'Go live', exact: true }).click();
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'PixelPost survived the launch!' })).toBeVisible({ timeout: 35_000 });
  await page.getByRole('button', { name: 'Claim reward & continue' }).click();
  await page.getByRole('button', { name: 'Continue to deep dive' }).click();
  await page.getByRole('combobox').selectOption('Read amplification and hot keys');
  for (const answer of ['Whether replication was synchronous and what durability was promised', 'Freshness, invalidation and stampede control still need a policy', 'End-to-end p95/p99 latency and error rate']) {
    await page.getByRole('button', { name: new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
    await page.getByTestId('submit').click();
    await page.getByTestId('continue').click();
  }
  await page.getByTestId('finish').click();
  for (const text of ['Restate the requirements and how the design meets them', 'Explain failure modes, monitoring and recovery', 'Describe trade-offs and the next scaling bottleneck']) await page.getByRole('checkbox', { name: text }).check();
  await page.getByRole('button', { name: 'Finish interview & see rubric' }).click();
  await expect(page.getByRole('heading', { name: 'Strong Hire', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:game')!).state.practice.interviews)).toBe(1);
});

test('the 45-minute deadline produces a result for unfinished work', async ({ checkedPage: page }) => {
  await page.clock.install();
  await page.addInitScript(() => localStorage.setItem('sdq:game', JSON.stringify({ version: 1, state: { progress: { L13: { stars: 1, bestQuiz: 1, completedSteps: [] } } } })));
  await page.goto('/interview');
  await page.getByRole('button', { name: 'Start 45-minute interview' }).click();
  await page.clock.fastForward(45 * 60 * 1000 + 1000);
  await expect(page.getByRole('heading', { name: 'No Hire', exact: true })).toBeVisible();
  await expect(page.getByText(/Time expired/)).toBeVisible();
});

test('practice screens fit a phone viewport', async ({ checkedPage: page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('sdq:game', JSON.stringify({ version: 1, state: { progress: { L13: { stars: 1, bestQuiz: 1, completedSteps: [] } } } })));
  for (const route of ['/interview', '/sandbox', '/puzzle', '/survival', '/profile']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
});

test('a daily repair survives chaos and saves one reward and its share result', async ({ checkedPage: page }) => {
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00Z'));
  await page.goto('/puzzle');
  await expect(page.getByText(/One front door/)).toBeVisible();
  await page.getByRole('button', { name: 'Add Load balancer', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  const architecture = page.getByRole('group', { name: 'System architecture', exact: true });
  for (const [from, to] of [['Users', 'Load balancer 1'], ['Load balancer 1', 'Web server A'], ['Load balancer 1', 'Web server B']]) {
    await architecture.getByRole('button', { name: from, exact: true }).press('Enter');
    await architecture.getByRole('button', { name: to, exact: true }).press('Enter');
  }
  await expect(page.getByText(/4 \/ 8 moves/)).toBeVisible();
  await page.getByRole('button', { name: 'Test chaos timeline' }).click();
  await page.getByRole('button', { name: 'Go live', exact: true }).click();
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'PixelPost survived the launch!' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Claim reward & continue' }).click();
  await expect(page.getByText(/Solved today in 4 moves/)).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:game')!).state.xp)).toBe(100);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Share result' })).toBeVisible();
  await page.getByRole('button', { name: 'Share result' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Share text copied.' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:game')!).state.practice.puzzles['2026-10-05'])).toBe(4);
});
