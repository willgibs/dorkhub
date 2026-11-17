// Seeds: pages written ahead of time, for the front page's topics (lib/front.js) and the pages from before it.
//   node scripts/seeds.mjs doors                  every topic written ahead of time, its slug, whether it is written
//                                                 yet or still shows its placeholder, and for a written page whether
//                                                 production's writer and prompt wrote it (current) or not (stale)
//   node scripts/seeds.mjs prompt "<title>"       the exact prompt a page on that topic gets (a question is asked as one)
//   node scripts/seeds.mjs brief "<title>"        the writer's brief for one of the front page's topics: that prompt,
//                                                 then what the front page says about it and the threads it draws
//                                                 from it, each with its source
//   node scripts/seeds.mjs placeholder "<title>"  the placeholder a front-page topic shows until its page is written
//   node scripts/seeds.mjs index                  rebuild lib/seeds/index.json from the files present
//   node scripts/seeds.mjs batch plan ["<title>" ...]        the pages a batch would write, the model, the likely cost
//   node scripts/seeds.mjs batch send --yes ["<title>" ...]  send it: one batch through Anthropic's Message Batches API
//   node scripts/seeds.mjs batch take [<batch id>]           wait for it, then keep each page that passes the checks
// With no titles, a batch writes every page written ahead of time (all 44); name titles to write only those (say, to
// send again what the last batch couldn't keep).
//
// How a seed is made: the way any page is (Will, 2026-10-19: one bar for every page, so a page that opens from the
// front page is never better or worse than the next one a reader opens). The production writer gets the brief (for
// any other topic, the prompt) and writes the page in one pass, with no research and no fact-check. A batch sends
// production's own call (its model, prompt, output limit and thinking: scripts/seeds/batch.js) at half a live page's
// price, and keeps each page that stopped on its own and passes the checks tests/seeds.test.js makes, as
// lib/seeds/<slug>/index.txt, stamped in the index with the model and prompt version that wrote it. Then
// npm run verify. A written page takes its placeholder's place. What a page gets wrong is fixed in the prompt
// (lib/prompts.js), for every page, not by hand in one; when the prompt or the writer changes, `doors` shows every
// page stale until a batch rewrites them. Writing seeds spends tokens, on the Console workspace "Dorkhub" through
// DH_ANTHROPIC_KEY in .env.local: it waits for Will's go, with the cost from `batch plan`.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('..', import.meta.url));
const envFile = join(repo, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const { PROMPT_VERSION, TASKS, pageInput, pagePrompt } = await import(join(repo, 'lib/prompts.js'));
const { DOORS, FRONT } = await import(join(repo, 'lib/front.js'));
const { placeholderText } = await import(join(repo, 'lib/placeholder.js'));
const { topicKey } = await import(join(repo, 'src/shared/world.js'));
const { isQuestion } = await import(join(repo, 'src/shared/article.js'));
const { directId } = await import(join(repo, 'src/shared/models.js'));
const { trialModel, writerSettings } = await import(join(repo, 'lib/ai.js'));
const B = await import(join(repo, 'scripts/seeds/batch.js'));
const dir = join(repo, 'lib/seeds');
const runs = join(repo, '.seeds-batch');
const [cmd, a, ...more] = process.argv.slice(2);
const doorFile = (/** @type {string} */ s) => join(dir, s, 'index.txt');
/* production's writer (DH_TRIAL_MODEL, else the default), the one every page written ahead of time comes from */
const model = trialModel(process.env, () => {});
/** @returns {Record<string, any>} */
const readIndex = () => { try { return JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8')).pages || {}; } catch { return {}; } };

/** Rebuild the index from the pages present, each keeping its stamp (the model and prompt version that wrote it), or
    taking a new one from `stamps`. @param {Record<string, { model: string, prompt: string }>} [stamps] by topic key */
function writeIndex(stamps = {}) {
  const old = readIndex(); /** @type {Record<string, any>} */ const pages = {};
  for (const { t } of DOORS) {
    const s = B.slug(t); const k = topicKey(t); if (!existsSync(doorFile(s))) continue;
    const stamp = stamps[k] || (old[k]?.model ? { model: old[k].model, prompt: old[k].prompt } : null);
    pages[k] = { title: t, file: `${s}/index.txt`, ...(isQuestion(t) ? { question: true } : {}), ...(stamp || {}) };
  }
  writeFileSync(join(dir, 'index.json'), JSON.stringify({ pages }, null, 1) + '\n');
  return pages;
}

if (cmd === 'doors') {
  const idx = readIndex();
  for (const d of DOORS) {
    const s = B.slug(d.t); const p = idx[topicKey(d.t)];
    const state = existsSync(doorFile(s)) ? 'written' : placeholderText(d.t) ? 'placeholder' : 'missing';
    const by = state !== 'written' ? '' : !p?.model ? 'unstamped' : p.model === model && p.prompt === PROMPT_VERSION ? 'current' : `stale (${p.model}, ${p.prompt})`;
    console.log(`${s}\t${d.t}\t${state}${by ? `\t${by}` : ''}`);
  }
} else if (cmd === 'prompt') process.stdout.write(pagePrompt(pageInput({ title: a, lens: 'encyclopedic' })));
else if (cmd === 'brief') {
  const t = B.frontTopic(a); if (!t) { console.error(`"${a}" is not one of the front page's topics: use prompt`); process.exit(1); }
  const { fixed, rest } = B.seedParts(t.t);
  process.stdout.write(fixed + rest);
} else if (cmd === 'placeholder') {
  const text = placeholderText(a || ''); if (!text) { console.error(`"${a}" is not one of the front page's topics`); process.exit(1); }
  process.stdout.write(text);
} else if (cmd === 'index') {
  const pages = writeIndex();
  console.log(`${Object.keys(pages).length} pages: ${Object.values(pages).map(p => p.title).join(', ')}`);
  const waiting = FRONT.filter((/** @type {{ t: string }} */ f) => !pages[topicKey(f.t)]); if (waiting.length) console.log(`${waiting.length} still placeholders: ${waiting.map((/** @type {{ t: string }} */ f) => f.t).join(', ')}`);
} else if (cmd === 'batch') await batch(a, more);
else console.error('usage: see the top of this file');

/* Dorkhub's key from .env.local, and only that: never an ANTHROPIC_API_KEY, token or base URL that happens to be in
   the shell, so a batch is always spent on the Dorkhub workspace. */
async function anthropic() {
  const apiKey = (process.env.DH_ANTHROPIC_KEY || '').trim();
  if (!apiKey) { console.error('Put DH_ANTHROPIC_KEY (a key from the Console workspace "Dorkhub") in .env.local first.'); process.exit(1); }
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  return new Anthropic({ apiKey, authToken: null, baseURL: 'https://api.anthropic.com' });
}

/** A page's id in a batch. @param {number} i */
function idOf(i) { return `p${String(i).padStart(2, '0')}`; }

/** @param {string | undefined} sub @param {string[]} args */
async function batch(sub, args) {
  const named = args.filter(x => !x.startsWith('--'));
  if (sub === 'plan' || sub === 'send') {
    const titles = named.length ? named.map(n => {
      const d = DOORS.find((/** @type {{ t: string }} */ x) => topicKey(x.t) === topicKey(n));
      if (!d) { console.error(`"${n}" is not a page written ahead of time (see: node scripts/seeds.mjs doors)`); process.exit(1); }
      return d.t;
    }) : DOORS.map((/** @type {{ t: string }} */ d) => d.t);
    const e = B.estimate(model, titles);
    console.log(`${titles.length} pages by ${model} (${directId(model)}), prompt ${PROMPT_VERSION}: max_tokens ${TASKS.page.maxTokens + writerSettings(model).room}, ${JSON.stringify(B.apiSettings(model))}; what every page shares is cached for an hour.`);
    titles.forEach((t, i) => console.log(`  ${idOf(i)}  ${t}${B.frontTopic(t) ? '  (with its front-page brief)' : ''}`));
    console.log(`About ${Math.round(e.input / 1000)}k tokens in and ${Math.round(e.output / 1000)}k out: about $${e.dollars.toFixed(2)} at batch prices (half a live page's), on the Console workspace "Dorkhub".`);
    if (sub === 'plan') return;
    if (!args.includes('--yes')) { console.error('Add --yes to send it: it spends real tokens.'); process.exit(2); }
    const client = await anthropic();
    const sent = await client.messages.batches.create({ requests: /** @type {any} */ (titles.map((t, i) => B.seedRequest(idOf(i), t, model))) });
    mkdirSync(runs, { recursive: true });
    const pages = Object.fromEntries(titles.map((t, i) => [idOf(i), { title: t, slug: B.slug(t) }]));
    writeFileSync(join(runs, `${sent.id}.json`), JSON.stringify({ id: sent.id, model, prompt: PROMPT_VERSION, at: new Date().toISOString(), pages }, null, 1) + '\n');
    console.log(`Sent ${sent.id} (${sent.processing_status}). Then: node scripts/seeds.mjs batch take ${sent.id}`);
    return;
  }
  if (sub === 'take') {
    const newest = () => (existsSync(runs) ? readdirSync(runs).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(runs, f), 'utf8'))).sort((x, y) => String(y.at).localeCompare(String(x.at)))[0]?.id : null);
    const which = named[0] || newest(); if (!which) { console.error('No batch has been sent from this checkout (.seeds-batch/ is empty).'); process.exit(1); }
    const run = JSON.parse(readFileSync(join(runs, `${which}.json`), 'utf8'));
    const client = await anthropic();
    for (;;) {
      const b = await client.messages.batches.retrieve(run.id);
      if (b.processing_status === 'ended') break;
      const c = b.request_counts; console.log(`${b.processing_status}: ${c.succeeded} written, ${c.processing} writing, ${c.errored} errored`);
      await new Promise(r => setTimeout(r, 30000));
    }
    /** @type {any[]} */ const usages = []; /** @type {string[]} */ const kept = []; /** @type {[string, string][]} */ const failed = [];
    /** @type {Record<string, { model: string, prompt: string }>} */ const stamps = {};
    const answers = join(runs, run.id); mkdirSync(answers, { recursive: true });
    for await (const r of await client.messages.batches.results(run.id)) {
      const page = run.pages[r.custom_id]; if (!page) continue;
      const { text, why, usage } = B.readResult(r); usages.push(usage);
      if (text) writeFileSync(join(answers, `${page.slug}.txt`), text);   /* every answer, kept or not, to read again for free */
      const problems = text ? B.seedProblems(page.title, text) : [why || 'nothing came back'];
      if (problems.length) { failed.push([page.title, problems.join('; ')]); continue; }
      mkdirSync(join(dir, page.slug), { recursive: true });
      writeFileSync(doorFile(page.slug), text.endsWith('\n') ? text : `${text}\n`);
      stamps[topicKey(page.title)] = { model: run.model, prompt: run.prompt };
      kept.push(page.title);
    }
    writeIndex(stamps);
    const tok = (/** @type {string} */ k) => usages.reduce((n, u) => n + (u?.[k] || 0), 0);
    console.log(`Kept ${kept.length} of ${Object.keys(run.pages).length}${kept.length ? `: ${kept.join(', ')}` : ''}.`);
    if (failed.length) {
      console.log(`Not kept (each answer is in .seeds-batch/${run.id}/; the page before it stays):`);
      for (const [t, w] of failed) console.log(`  ${t}: ${w}`);
      console.log(`To send those again: node scripts/seeds.mjs batch send --yes ${failed.map(([t]) => JSON.stringify(t)).join(' ')}`);
    }
    console.log(`Tokens: ${tok('input_tokens')} in, ${tok('cache_creation_input_tokens')} into the cache, ${tok('cache_read_input_tokens')} from it, ${tok('output_tokens')} out: about $${B.batchCost(run.model, usages).toFixed(3)}. Then: npm run verify.`);
    return;
  }
  console.error('usage: node scripts/seeds.mjs batch plan | send --yes | take [batch id]   (see the top of this file)');
  process.exit(2);
}
