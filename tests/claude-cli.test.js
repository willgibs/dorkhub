/* The eval's route through the local `claude` CLI (scripts/eval/claude-cli.js), proven on a fake CLI: nothing here
   starts a process, calls a model or touches the network. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { claudeCli, cliArgs, cliEnv, cliModelId, promptParts, readResult, resetCli, splitModel } from '../scripts/eval/claude-cli.js';
import { askJudge, streamPage } from '../scripts/eval/writer.js';
import { main } from '../scripts/eval.mjs';

const usage = { input_tokens: 2, cache_creation_input_tokens: 598, cache_read_input_tokens: 100, output_tokens: 40, output_tokens_details: { thinking_tokens: 0 } };
const delta = (/** @type {string} */ text) => JSON.stringify({ type: 'stream_event', event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } } });
const result = (/** @type {Record<string, any>} */ over = {}) => ({ type: 'result', subtype: 'success', is_error: false, result: '# Brinicles :: phenomenon\n---\nA body.', stop_reason: 'end_turn', usage, ...over });

/* a CLI that streams the given lines, or answers one JSON document, and remembers how it was called */
const fakeCli = (/** @type {{ lines?: string[], json?: any, stdout?: string, code?: number }} */ { lines = [], json = null, stdout = '', code = 0 } = {}) => {
  /** @type {any[]} */ const calls = [];
  const run = /** @type {any} */ (async (/** @type {any} */ c) => { calls.push(c); for (const l of lines) c.onLine?.(l); return { code, stdout: json ? JSON.stringify(json) : stdout, stderr: '' }; });
  return { run, calls };
};

test('a gateway model id becomes the CLI\'s', () => {
  assert.equal(cliModelId('anthropic/claude-haiku-5.5'), 'claude-haiku-5-5');
  assert.equal(cliModelId('anthropic/claude-opus-5.5'), 'claude-opus-5-5');
  assert.equal(cliModelId('claude-sonnet-5-5'), 'claude-sonnet-5-5');
  /* how much it thinks rides on the id, so one run can compare a writer at two efforts */
  assert.deepEqual(splitModel('anthropic/claude-haiku-5.5:low'), { model: 'anthropic/claude-haiku-5.5', effort: 'low' });
  assert.equal(cliModelId('anthropic/claude-haiku-5.5:low'), 'claude-haiku-5-5');
  assert.throws(() => splitModel('anthropic/claude-haiku-5.5:off'), /unknown effort "off"/, 'the CLI cannot turn thinking off, so the route does not pretend to');
  const low = cliArgs({ model: 'anthropic/claude-haiku-5.5:low', system: '', stream: true });
  assert.equal(low[low.indexOf('--effort') + 1], 'low');
  assert.ok(!cliArgs({ model: 'anthropic/claude-haiku-5.5', system: '', stream: true }).includes('--effort'), 'no effort named, none sent');
});

test('a call carries no tools, no settings and no project, and never an API key', () => {
  const a = cliArgs({ model: 'anthropic/claude-haiku-5.5', system: '', stream: true });
  const after = (/** @type {string} */ flag) => a[a.indexOf(flag) + 1];
  assert.equal(after('--model'), 'claude-haiku-5-5');
  assert.equal(after('--tools'), '', 'no tools');
  assert.equal(after('--setting-sources'), '', 'no settings, so no CLAUDE.md');
  assert.equal(after('--system-prompt'), '', 'a writer with no system message gets none of ours');
  assert.ok(a.includes('-p') && a.includes('--strict-mcp-config') && a.includes('--no-session-persistence') && a.includes('--disable-slash-commands'));
  assert.equal(after('--output-format'), 'stream-json');
  assert.equal(cliArgs({ model: 'x', system: 'Be brief.', stream: false }).at(-1), 'json');
  const e = cliEnv({ PATH: '/bin', ANTHROPIC_API_KEY: 'sk-live', ANTHROPIC_AUTH_TOKEN: 't', ANTHROPIC_BASE_URL: 'https://elsewhere.example' });
  assert.deepEqual([e.ANTHROPIC_API_KEY, e.ANTHROPIC_AUTH_TOKEN, e.ANTHROPIC_BASE_URL], [undefined, undefined, undefined], 'the subscription, never a key');
  assert.equal(e.PATH, '/bin');
});

test('the prompt the SDK hands over is read as one system text and one user text', () => {
  assert.deepEqual(promptParts([{ role: 'system', content: 'Rules.' }, { role: 'user', content: [{ type: 'text', text: 'Write ' }, { type: 'text', text: 'a page.' }] }]), { system: 'Rules.', user: 'Write a page.' });
  assert.deepEqual(promptParts([{ role: 'user', content: [{ type: 'text', text: 'Only this.' }] }]), { system: '', user: 'Only this.' });
  assert.throws(() => promptParts(/** @type {any} */ ([{ role: 'assistant', content: [] }])), /one user message/);
});

test('a writer streams through the CLI: the words as they come, then the usage', async () => {
  resetCli();
  const cli = fakeCli({ lines: [JSON.stringify({ type: 'system', subtype: 'init' }), 'not json at all', delta('# Brinicles :: phenomenon\n'), delta('---\n'), delta('A body.'), JSON.stringify(result())] });
  const r = await streamPage({ model: claudeCli('anthropic/claude-haiku-5.5', { run: cli.run, cwd: '/tmp', env: { ANTHROPIC_API_KEY: 'sk-live' } }), system: 'The format.', prompt: 'Brinicles', maxTokens: 3000 });
  assert.equal(r.error, null);
  assert.equal(r.text, '# Brinicles :: phenomenon\n---\nA body.');
  assert.equal(r.finish, 'stop');
  assert.deepEqual({ input: r.usage.input, output: r.usage.output, cacheRead: r.usage.cacheRead }, { input: 700, output: 40, cacheRead: 100 });
  assert.ok(r.ms.first != null && r.ms.firstBody != null, 'the first word and the first word of the body are timed');
  const [c] = cli.calls;
  assert.equal(c.input, 'Brinicles', 'the prompt goes in on standard input');
  assert.equal(c.args[c.args.indexOf('--system-prompt') + 1], 'The format.');
  assert.equal(c.env.ANTHROPIC_API_KEY, undefined);
});

test('a page over the task\'s limit is marked as production would have cut it', async () => {
  resetCli();
  const cli = fakeCli({ lines: [delta('long'), JSON.stringify(result({ result: 'long', usage: { ...usage, output_tokens: 5000 } }))] });
  const r = await streamPage({ model: claudeCli('anthropic/claude-haiku-5.5', { run: cli.run, cwd: '/tmp' }), system: null, prompt: 'x', maxTokens: 3000 });
  assert.equal(r.finish, 'length');
  assert.equal(readResult(result({ stop_reason: 'max_tokens' }), undefined).finishReason.unified, 'length');
});

test('a judge gets one whole answer', async () => {
  resetCli();
  const cli = fakeCli({ json: result({ result: '{"winner":"A"}' }) });
  const a = await askJudge({ model: claudeCli('anthropic/claude-opus-5.5', { run: cli.run, cwd: '/tmp' }), prompt: 'Which is better?', maxTokens: 800 });
  assert.equal(a.text, '{"winner":"A"}');
  assert.equal(a.usage.output, 40);
  assert.equal(cli.calls[0].args.at(-1), 'json');
  assert.equal(cli.calls[0].args[cli.calls[0].args.indexOf('--model') + 1], 'claude-opus-5-5');
});

test('an error from the CLI is the call\'s error, and one every call would repeat ends the route', async () => {
  resetCli();
  const broken = fakeCli({ lines: [JSON.stringify(result({ is_error: true, result: 'API Error: overloaded' }))] });
  const r = await streamPage({ model: claudeCli('anthropic/claude-haiku-5.5', { run: broken.run, cwd: '/tmp' }), system: null, prompt: 'x', maxTokens: 100 });
  assert.match(String(r.error), /overloaded/);
  assert.equal(r.text, '');
  /* an overload passes; the next call still goes out */
  const fine = fakeCli({ lines: [delta('ok'), JSON.stringify(result({ result: 'ok' }))] });
  assert.equal((await streamPage({ model: claudeCli('anthropic/claude-haiku-5.5', { run: fine.run, cwd: '/tmp' }), system: null, prompt: 'x', maxTokens: 100 })).text, 'ok');
  /* signed out, or the plan's limit: nothing more is sent */
  const out = fakeCli({ lines: [JSON.stringify(result({ is_error: true, result: 'Not logged in · Please run /login' }))] });
  assert.match(String((await streamPage({ model: claudeCli('anthropic/claude-haiku-5.5', { run: out.run, cwd: '/tmp' }), system: null, prompt: 'x', maxTokens: 100 })).error), /Not logged in/);
  const later = fakeCli({ lines: [delta('ok'), JSON.stringify(result({ result: 'ok' }))] });
  const after = await streamPage({ model: claudeCli('anthropic/claude-haiku-5.5', { run: later.run, cwd: '/tmp' }), system: null, prompt: 'x', maxTokens: 100 });
  assert.match(String(after.error), /stopped: .*Not logged in/);
  assert.equal(later.calls.length, 0, 'no call was made');
  await assert.rejects(askJudge({ model: claudeCli('anthropic/claude-opus-5.5', { run: later.run, cwd: '/tmp' }), prompt: 'x', maxTokens: 100 }), /stopped/);
  resetCli();
  const silent = fakeCli({ stdout: 'garbage', code: 1 });
  await assert.rejects(askJudge({ model: claudeCli('anthropic/claude-opus-5.5', { run: silent.run, cwd: '/tmp' }), prompt: 'x', maxTokens: 100 }), /did not answer in JSON \(exit 1\)/);
  resetCli();
});

test('the subscription route is a live run only, and still wants the spend gate', async () => {
  /** @type {string[]} */ const said = [];
  await assert.rejects(main(['run', '--dry', '--via', 'claude'], { log: s => said.push(s) }), /goes with --live/);
  await assert.rejects(main(['run', '--live', '--via', 'carrier-pigeon'], { log: s => said.push(s) }), /gateway or claude/);
  await assert.rejects(main(['run', '--dry', '--judge-via', 'claude'], { log: s => said.push(s) }), /goes with --live/);
  await assert.rejects(main(['run', '--live', '--judge-via', 'owl'], { log: s => said.push(s) }), /--judge-via wants gateway or claude/);
  assert.equal(await main(['run', '--live', '--via', 'claude'], { log: s => said.push(s) }), 2);
  assert.match(said.join('\n'), /Refusing to start/);
});
