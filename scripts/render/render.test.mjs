import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { parseOptions, selectLevels } from './options.mjs';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../../', import.meta.url));
const twoLessons = [
  { id: 'L01', title: 'Hello, World', duration: 180 },
  { id: 'C2L01', title: 'A second chapter', duration: 150 },
];

test('all uses the complete catalog, with two lessons across chapters', () => {
  assert.deepEqual(selectLevels(twoLessons, 'all'), twoLessons);
  assert.deepEqual(selectLevels(twoLessons, 'C2L01,L01,C2L01'), [twoLessons[1], twoLessons[0]]);
  assert.throws(() => selectLevels(twoLessons, 'L99'), /Unknown level/);
  assert.throws(() => selectLevels([], 'all'), /No lessons/);
  assert.throws(() => selectLevels([{ ...twoLessons[0], duration: NaN }], 'all'), /Invalid lesson/);
  assert.throws(() => selectLevels([twoLessons[0], twoLessons[0]], 'all'), /Duplicate/);
});

test('CLI validates frame rates, short lengths, URLs and missing values', () => {
  assert.equal(parseOptions([], root).out, join(root, 'app/public/videos'));
  assert.deepEqual(parseOptions(['--fps', '12', '--short', '6', '--captions'], root), {
    levels: 'all', fps: 12, short: 6, captions: true, out: join(root, 'app/public/videos'),
  });
  for (const args of [['--fps', '0'], ['--fps', '2.5'], ['--fps', '61'], ['--short', '-1'], ['--short', 'NaN'], ['--levels'], ['--out', '--captions'], ['--wat'], ['--url', 'file:///tmp'], ['--levels', '../bad']]) {
    assert.throws(() => parseOptions(args, root));
  }
});

test('real Chrome + ffmpeg: --levels all exports two lessons, then merges a subset', { timeout: 60_000 }, async () => {
  const out = await mkdtemp(join(tmpdir(), 'quest-video-test-'));
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    if (req.url === '/videos') {
      res.end(twoLessons.map((level) => `<article data-video-level="${level.id}" data-video-title="${level.title}" data-video-duration="${level.duration}"></article>`).join(''));
      return;
    }
    res.end(`<style>body{margin:0;background:#020617}svg{display:block}</style>
      <svg width="1280" height="720"><rect width="1280" height="720" fill="#020617"/><text x="100" y="100" fill="#22d3ee">Frame <tspan id="time">0</tspan></text></svg>
      <script>window.__setLessonTime=t=>document.getElementById('time').textContent=t;</script>`);
  });
  try {
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    const url = `http://127.0.0.1:${server.address().port}`;
    const run = (levels) => exec(process.execPath, ['scripts/render/render.mjs', '--levels', levels, '--fps', '12', '--short', '0.25', '--url', url, '--out', out], { cwd: root, timeout: 40_000 });
    const { stdout } = await run('all');
    assert.match(stdout, /Rendering 2 of 2 lessons, sequentially/);
    let manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'));
    assert.deepEqual(manifest.map((entry) => entry.id), ['L01', 'C2L01']);
    for (const entry of manifest) {
      assert.equal(entry.duration, 0.25);
      assert.ok(entry.sizeBytes > 0);
      assert.ok(Number.isFinite(Date.parse(entry.renderedAt)));
      const { stdout: probe } = await exec('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames,pix_fmt:format=duration', '-of', 'json', join(out, entry.file)]);
      const metadata = JSON.parse(probe);
      assert.equal(metadata.streams[0].width, 1280);
      assert.equal(metadata.streams[0].height, 720);
      assert.equal(metadata.streams[0].nb_frames, '3');
      assert.equal(metadata.streams[0].pix_fmt, 'yuv420p');
      assert.equal(Number(metadata.format.duration), 0.25);
      assert.ok((await readFile(join(out, entry.poster))).length > 0);
    }
    const secondLesson = manifest[1];
    await run('L01');
    manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'));
    assert.equal(manifest.length, 2);
    assert.deepEqual(manifest[1], secondLesson);
    await assert.rejects(run('L99'), /Unknown level L99/);
    const beforeInterrupt = await readFile(join(out, 'manifest.json'), 'utf8');
    const child = spawn(process.execPath, ['scripts/render/render.mjs', '--levels', 'L01', '--fps', '24', '--url', url, '--out', out], { cwd: root });
    let log = '';
    let signaled = false;
    child.stdout.on('data', (data) => {
      log += data;
      if (!signaled && /frame 1\//.test(log)) { signaled = true; child.kill('SIGINT'); }
    });
    child.stderr.on('data', (data) => { log += data; });
    const exitCode = await new Promise((done) => child.once('close', done));
    assert.ok(signaled, log);
    assert.equal(exitCode, 130, log);
    assert.equal(await readFile(join(out, 'manifest.json'), 'utf8'), beforeInterrupt);
    assert.deepEqual((await readdir(out)).filter((name) => name.startsWith('.')), [], log);
  } finally {
    await new Promise((done) => server.close(done));
    await rm(out, { recursive: true, force: true });
  }
});
