// A Claude model reached through the local `claude` CLI, on the subscription it is signed in to, shaped as an AI
// SDK model: so the eval's writers and judges can run without gateway credits (Will, 2026-11-13: "feel free to run
// any testing on the included credits we have here in our subscription"). One headless call per answer: no tools,
// no project files, no settings.
//
// What differs from the gateway, the same for every arm, so arms still compare fairly:
//   - THINKING IS ALWAYS ON. Claude Haiku 5.5 thinks before it writes unless a request turns that off, and the CLI
//     (2.1.304 to 2.1.321) offers no way to: `--thinking disabled`, MAX_THINKING_TOKENS and
//     CLAUDE_CODE_DISABLE_THINKING all leave a thinking block in the stream. A model id may end in an effort
//     (`anthropic/claude-haiku-5.5:low`), which sets how much it thinks; with none, the CLI's own default applies.
//     So this route can test a writer that thinks, and any judge, but not production's writer if that is to
//     answer at once (thinking off), which needs the gateway;
//   - the CLI adds a short block of its own to the system prompt (about 600 tokens: a line saying what it is, the
//     working directory, the platform, the model's name, today's date);
//   - its output limit cannot be set per call, so a page over the task's limit is whole here and marked `length`,
//     where production would have cut it;
//   - timings include the CLI starting up (a second or more), so read them between arms, not as production's.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
/** A model id may carry an effort after a colon: anthropic/claude-haiku-5.5:low. @param {string} id */
export function splitModel(id) {
  const [model, effort = ''] = String(id).split(':');
  if (effort && !EFFORTS.includes(effort)) throw new Error(`unknown effort "${effort}" in "${id}" (known: ${EFFORTS.join(', ')})`);
  return { model, effort };
}
/** The CLI's name for a gateway model id: anthropic/claude-haiku-5.5 is claude-haiku-5-5. @param {string} id */
export const cliModelId = id => splitModel(id).model.replace(/^anthropic\//, '').replace(/\./g, '-');

/** A call's system and user text, from the prompt the AI SDK hands a model.
 *  @param {import('@ai-sdk/provider').LanguageModelV4Prompt} prompt */
export function promptParts(prompt) {
  let system = '', user = '';
  for (const m of prompt) {
    if (m.role === 'system') system += (system ? '\n\n' : '') + m.content;
    else if (m.role === 'user') for (const p of m.content) { if (p.type === 'text') user += p.text; else throw new Error('the CLI route sends text only'); }
    else throw new Error(`the CLI route answers one user message, not a ${m.role} turn`);
  }
  return { system, user };
}

/** @param {{ model: string, system: string, stream: boolean }} o */
export function cliArgs({ model, system, stream }) {
  const { effort } = splitModel(model);
  return ['-p', '--model', cliModelId(model), ...(effort ? ['--effort', effort] : []), '--system-prompt', system, '--tools', '', '--strict-mcp-config', '--disable-slash-commands',
    '--setting-sources', '', '--no-session-persistence',
    ...(stream ? ['--output-format', 'stream-json', '--include-partial-messages', '--verbose'] : ['--output-format', 'json'])];
}

/* The subscription and nothing else: an API key in the environment would bill that key instead, so it never reaches
   the CLI. */
/** @param {NodeJS.ProcessEnv} [env] */
export function cliEnv(env = process.env) {
  const e = { ...env, CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' };
  for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX']) delete e[k];
  return e;
}

/** @param {any} u the CLI's usage */
const usageOf = u => {
  const i = u?.input_tokens ?? 0, cw = u?.cache_creation_input_tokens ?? 0, cr = u?.cache_read_input_tokens ?? 0, o = u?.output_tokens ?? 0, th = u?.output_tokens_details?.thinking_tokens ?? 0;
  return { inputTokens: { total: i + cw + cr, noCache: i + cw, cacheRead: cr, cacheWrite: cw }, outputTokens: { total: o, text: Math.max(0, o - th), reasoning: th } };
};
/** @param {string} raw @param {boolean} over @returns {import('@ai-sdk/provider').LanguageModelV4FinishReason} */
const finishOf = (raw, over) => ({ unified: over || raw === 'max_tokens' ? 'length' : raw === 'end_turn' || raw === 'stop_sequence' ? 'stop' : raw === 'refusal' ? 'content-filter' : 'other', raw: raw || undefined });

/* A failure that every later call would repeat (signed out, the plan's limit reached): the run should end there,
   not spend an hour failing. */
const FATAL = /usage limit|limit reached|hit your limit|not logged in|\/login|credit balance/i;

/** The last line of a run: `{ type: 'result', result, usage, stop_reason, is_error }`.
 *  @param {any} r @param {number | undefined} maxOutputTokens */
export function readResult(r, maxOutputTokens) {
  if (!r || typeof r !== 'object') throw new Error('the CLI ended without a result');
  if (r.is_error) throw new Error(`the CLI answered with an error: ${String(r.result || r.api_error_status || 'unknown').slice(0, 300)}`);
  const usage = usageOf(r.usage);
  return { text: String(r.result ?? ''), usage, finishReason: finishOf(String(r.stop_reason || ''), maxOutputTokens != null && usage.outputTokens.text > maxOutputTokens) };
}

/**
 * One headless call. `onLine` gets each line of standard output as it arrives.
 * @typedef {{ bin: string, args: string[], env: NodeJS.ProcessEnv, cwd: string, input: string, timeoutMs: number, signal?: AbortSignal, onLine?: (line: string) => void }} CliCall
 * @param {CliCall} o @returns {Promise<{ code: number | null, stdout: string, stderr: string }>}
 */
export function runCli({ bin, args, env, cwd, input, timeoutMs, signal, onLine }) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '', rest = '';
    const stop = () => { p.kill('SIGKILL'); };
    const t = setTimeout(() => { err += `\ntimed out after ${timeoutMs} ms`; stop(); }, timeoutMs);
    if (signal) { if (signal.aborted) stop(); else signal.addEventListener('abort', stop, { once: true }); }
    p.stdout.setEncoding('utf8'); p.stderr.setEncoding('utf8');
    p.stdout.on('data', d => { out += d; if (!onLine) return; rest += d; const lines = rest.split('\n'); rest = lines.pop() ?? ''; for (const l of lines) if (l.trim()) onLine(l); });
    p.stderr.on('data', d => { err += d; });
    p.on('error', e => { clearTimeout(t); reject(e); });
    p.on('close', code => { clearTimeout(t); if (signal) signal.removeEventListener('abort', stop); if (onLine && rest.trim()) onLine(rest); resolve({ code, stdout: out, stderr: err }); });
    p.stdin.on('error', () => { /* the CLI went away first; `close` reports it */ });
    p.stdin.end(input);
  });
}

/**
 * @param {string} id a gateway model id (anthropic/claude-haiku-5.5) or the CLI's own
 * @param {{ bin?: string, run?: typeof runCli, env?: NodeJS.ProcessEnv, cwd?: string, timeoutMs?: number }} [o]
 * @returns {import('@ai-sdk/provider').LanguageModelV4}
 */
export function claudeCli(id, { bin = process.env.DH_CLAUDE_BIN || 'claude', run = runCli, env = process.env, cwd = '', timeoutMs = 300000 } = {}) {
  /* a directory of its own, outside any project, so the CLI finds no CLAUDE.md and no repository */
  const home = () => { const d = cwd || join(tmpdir(), 'dorkhub-eval-cli'); mkdirSync(d, { recursive: true }); return d; };
  /** @param {import('@ai-sdk/provider').LanguageModelV4CallOptions} options @param {boolean} stream @param {(line: string) => void} [onLine] */
  const call = (options, stream, onLine) => {
    if (FATAL_SEEN) throw new Error(FATAL_SEEN);
    const { system, user } = promptParts(options.prompt);
    return run({ bin, args: cliArgs({ model: id, system, stream }), env: cliEnv(env), cwd: home(), input: user, timeoutMs, signal: options.abortSignal, onLine });
  };
  /** @param {unknown} e */
  const note = e => { const m = String(/** @type {any} */ (e)?.message || e); if (FATAL.test(m)) FATAL_SEEN = `stopped: ${m}`; return e; };
  return {
    specificationVersion: 'v4', provider: 'claude-cli', modelId: cliModelId(id), supportedUrls: {},
    async doGenerate(options) {
      try {
        const r = await call(options, false);
        let j; try { j = JSON.parse(r.stdout); } catch { throw new Error(`the CLI did not answer in JSON (exit ${r.code}): ${(r.stderr || r.stdout).trim().slice(0, 300)}`); }
        const a = readResult(j, options.maxOutputTokens);
        return { content: [{ type: 'text', text: a.text }], finishReason: a.finishReason, usage: a.usage, warnings: [] };
      } catch (e) { throw note(e); }
    },
    async doStream(options) {
      /** @type {ReadableStream<import('@ai-sdk/provider').LanguageModelV4StreamPart>} */
      const stream = new ReadableStream({
        async start(c) {
          c.enqueue({ type: 'stream-start', warnings: [] });
          let open = false; /** @type {any} */ let result = null;
          try {
            const r = await call(options, true, line => {
              let j; try { j = JSON.parse(line); } catch { return; }
              if (j.type === 'stream_event' && j.event?.type === 'content_block_delta' && j.event.delta?.type === 'text_delta' && j.event.delta.text) {
                if (!open) { open = true; c.enqueue({ type: 'text-start', id: 't' }); }
                c.enqueue({ type: 'text-delta', id: 't', delta: j.event.delta.text });
              } else if (j.type === 'result') result = j;
              else if (j.type === 'rate_limit_event' && j.rate_limit_info?.status === 'rejected') FATAL_SEEN = `stopped: the subscription's ${j.rate_limit_info.rateLimitType || ''} limit is reached`;
            });
            if (!result) throw new Error(`the CLI ended without a result (exit ${r.code}): ${r.stderr.trim().slice(0, 300)}`);
            const a = readResult(result, options.maxOutputTokens);
            /* a CLI that sent no partial text still has the whole answer in its result */
            if (!open && a.text) { open = true; c.enqueue({ type: 'text-start', id: 't' }); c.enqueue({ type: 'text-delta', id: 't', delta: a.text }); }
            if (open) c.enqueue({ type: 'text-end', id: 't' });
            c.enqueue({ type: 'finish', usage: a.usage, finishReason: a.finishReason });
          } catch (e) { c.enqueue({ type: 'error', error: note(e) }); }
          c.close();
        },
      });
      return { stream };
    },
  };
}

let FATAL_SEEN = '';
/** For tests: forget a failure that stopped the route. */
export const resetCli = () => { FATAL_SEEN = ''; };
