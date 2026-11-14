// The ignored build step: a push that changes nothing a deployment serves is skipped; in any doubt it builds.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { decide, deployed } from '../scripts/skip-build.mjs';

const git = (/** @type {string[]} */ files) => () => files.join('\n');

test('the records, the tests, CI and the checking tools are not deployed', () => {
  for (const p of ['docs/state.md', 'docs/decisions.md', 'README.md', 'CLAUDE.md', 'tests/write.test.js', 'tests/seeds-fixture/a.json', '.github/workflows/ci.yml', 'scripts/e2e.mjs', 'scripts/eval.mjs', 'scripts/eval/claude-cli.js', 'scripts/prove.mjs', 'scripts/contact.mjs']) assert.equal(deployed(p), false, p);
});

test('everything else is, including the build, its configuration and this step', () => {
  for (const p of ['src/app/main.js', 'src/styles.css', 'src/static/share/index.json', 'src/notes.md', 'lib/front.js', 'lib/seeds/index.json', 'api/write.js', 'vercel.json', 'package.json', 'package-lock.json', 'scripts/build.mjs', 'scripts/dev.mjs', 'scripts/skip-build.mjs', 'scripts/share.mjs', 'scripts/seeds.mjs']) assert.equal(deployed(p), true, p);
});

test('a push of records alone is skipped', () => {
  assert.equal(decide('abc1234', git(['docs/state.md', 'docs/backlog.md'])).act, 'skip');
});

test('one deployed file among them builds', () => {
  const d = decide('abc1234', git(['docs/state.md', 'src/styles.css', 'tests/a.test.js']));
  assert.equal(d.act, 'build'); assert.match(d.why, /src\/styles\.css/);
});

test('in any doubt it builds: no earlier deployment, git failing, nothing to compare', () => {
  assert.equal(decide(undefined, git(['docs/state.md'])).act, 'build');
  assert.equal(decide('', git(['docs/state.md'])).act, 'build');
  assert.equal(decide('abc1234', () => { throw new Error('bad object'); }).act, 'build');
  assert.equal(decide('abc1234', git([])).act, 'build');
});

test('vercel.json runs it', () => {
  const conf = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.equal(conf.ignoreCommand, 'node scripts/skip-build.mjs');
});
