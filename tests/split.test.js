/* The split writer (lib/split.js): a page in three calls, streamed as one page's text in reading order. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cardsOf, parseArticle } from '../src/shared/article.js';
import { FRAME_STOP, WAYS_SCHEMA, bodyOf, frameOfLines, headSoFar, pageFromParts, pageInput } from '../lib/prompts.js';
import { splitPage } from '../lib/split.js';

const input = pageInput({ title: 'Magnets', lens: 'encyclopedic' });
/* the frame as its call writes it: the page's own head lines */
const frameText = '# Magnets :: thing\n> Invisible hands that move iron.\n!!!\nOldest :: lodestone, 600 BC\nStrongest :: 45 tesla\nPoles :: never one alone\n+++\n[[Lodestone]] :: thing\n[[Curie temperature]] :: phenomenon\n[[Magnets]] :: thing';
const frame = { title: 'Magnets', kind: 'thing', deck: 'Invisible hands that move iron.', facts: [{ label: 'Oldest', value: 'lodestone, 600 BC' }, { label: 'Strongest', value: '45 tesla' }, { label: 'Poles', value: 'never one alone' }], links: [{ topic: 'Lodestone', kind: 'thing' }, { topic: 'Curie temperature', kind: 'phenomenon' }, { topic: 'Magnets', kind: 'thing' }] };
const body = 'A magnet pulls iron across a gap with nothing between. The [[Lodestone]] showed it first, three thousand years ago, and sailors steered by it.\n\n## Heat undoes it\nAbove the [[Curie temperature]] the order inside melts, and the pull is gone. Iron loses it at 770 degrees.';
const ways = { next: [{ topic: 'Compass', hook: 'the needle that made the sea legible', kind: 'thing' }, { topic: 'Aurora', hook: 'what a magnetic planet does with sunlight', kind: 'phenomenon' }], questions: ['Why does heat destroy a magnet?', 'Can a magnet have only one pole?', 'How strong is the strongest magnet?'], hooks: [{ topic: 'Lodestone', hook: 'a rock that finds north' }, { topic: 'Curie temperature', hook: 'the heat at which order melts' }] };

/** A model that answers the frame, the body and the ways on in small pieces, as a writer streams, and notes each call.
    @param {Record<string, any>} answers @param {any[]} seen */
const writer = (answers, seen) => ({
  specificationVersion: 'v4', provider: 'test', modelId: 'test', supportedUrls: {},
  async doGenerate() { throw new Error('streams only'); },
  /** @param {any} o */
  async doStream(o) {
    const all = JSON.stringify(o.prompt);
    const which = all.includes('write its head') ? 'frame' : all.includes('write the body of one page') ? 'body' : 'ways';
    seen.push({ which, format: o.responseFormat?.type || 'text', max: o.maxOutputTokens, stop: o.stopSequences });
    const a = answers[which]; if (a instanceof Error) throw a;
    const text = typeof a === 'string' ? a : typeof a.text === 'string' ? a.text : JSON.stringify(a);
    const finish = a.finish || 'stop'; let i = 0;
    return { stream: new ReadableStream({ pull(c) {
      if (!i) { c.enqueue({ type: 'stream-start', warnings: [] }); c.enqueue({ type: 'text-start', id: 't' }); }
      if (i >= text.length) {
        c.enqueue({ type: 'text-end', id: 't' });
        c.enqueue({ type: 'finish', usage: { inputTokens: { total: 100, noCache: 60, cacheRead: 40, cacheWrite: 0 }, outputTokens: { total: 10, text: 10, reasoning: 0 } }, finishReason: { unified: finish, raw: finish } });
        c.close(); return;
      }
      c.enqueue({ type: 'text-delta', id: 't', delta: text.slice(i, i + 7) }); i += 7;
    } }) };
  },
});
/** @param {Record<string, any>} answers */
async function write(answers) {
  /** @type {any[]} */ const seen = []; /** @type {unknown[]} */ const errors = []; /** @type {string[]} */ const chunks = [];
  const r = splitPage({ model: /** @type {any} */ (writer(answers, seen)), input, maxTokens: 3000, onError: ({ error }) => { errors.push(error); } });
  for await (const c of r.textStream) chunks.push(c);
  return { text: chunks.join(''), chunks, seen, errors, reason: await r.finishReason, usage: await r.totalUsage };
}

test('a page in three calls reads as the page one pass would have written', async () => {
  const w = await write({ frame: frameText, body: `# Magnets\n> Invisible hands that move iron.\n\n${body}`, ways });
  assert.deepEqual(frameOfLines(frameText), frame, 'the head lines read back as the frame');
  assert.equal(w.text, pageFromParts(input, frame, body, ways), 'the joined page, the title and deck the body repeated left out');
  assert.deepEqual(w.seen.map(s => [s.which, s.format]), [['frame', 'text'], ['body', 'text'], ['ways', 'json']], 'the frame as the head lines, then the body, then the ways on as structured output');
  assert.deepEqual(w.seen[0].stop, FRAME_STOP, 'the frame stops where a body would begin');
  assert.equal(w.seen[1].max, 3000, "the body may use the page's whole limit");
  assert.equal(w.reason, 'stop');
  assert.deepEqual([w.usage.inputTokens, w.usage.outputTokens, w.usage.inputTokenDetails.cacheReadTokens], [300, 30, 120], 'what all three used');
  const A = parseArticle(w.text, false);
  assert.deepEqual([A.title, A.kind, A.keyFacts.length, A.bodyDone, cardsOf(A).map(c => c.target), A.questions.length], ['Magnets', 'thing', 3, true, ['Compass', 'Aurora'], 3]);
  assert.ok(!Object.keys(A.gloss).includes('magnets') || A.gloss.magnets.gloss === '', 'the page never plans itself');
  /* the head goes out a whole line at a time: nothing shown is ever rewritten */
  let sofar = '';
  for (const c of w.chunks) { sofar += c; if (!sofar.includes('\n---\n')) assert.ok(sofar.endsWith('\n'), `a head line went out unfinished: ${JSON.stringify(sofar.slice(-40))}`); }
});

test("the ways on's schema, and a body cut off at the limit ends there", async () => {
  assert.deepEqual(WAYS_SCHEMA.required, ['next', 'questions', 'hooks']);
  const cut = await write({ frame: frameText, body: { text: body.slice(0, 120), finish: 'length' }, ways });
  assert.equal(cut.reason, 'length');
  assert.deepEqual(cut.seen.map(s => s.which), ['frame', 'body'], 'no ways on for a body that did not finish');
  assert.ok(cut.text.endsWith(body.slice(0, 120)));
  assert.equal(bodyOf('```\n# T\n> d\n\nText.\n```'), 'Text.');
});

test('a failing call is handed on as a failing stream is, and nothing half-built follows it', async () => {
  const early = await write({ frame: new Error('credit balance is too low'), body, ways });
  assert.deepEqual([early.text, early.reason, String(early.errors[0])], ['', 'error', 'Error: credit balance is too low']);
  const late = await write({ frame: frameText, body, ways: new Error('overloaded') });
  assert.equal(late.reason, 'error');
  assert.ok(late.text.endsWith(body.split('\n').at(-1) || ''), 'the body stays as it was written');
  assert.equal(late.errors.length, 1);
});

/* to Anthropic, as production sends it (no network: a fetch that answers in server-sent events) */
const sse = (/** @type {string} */ text) => {
  const ev = (/** @type {string} */ t, /** @type {object} */ d) => `event: ${t}\ndata: ${JSON.stringify({ type: t, ...d })}\n\n`;
  return ev('message_start', { message: { id: 'm', type: 'message', role: 'assistant', model: 'claude-haiku-5-5', content: [], stop_reason: null, usage: { input_tokens: 100, output_tokens: 1, cache_read_input_tokens: 40, cache_creation_input_tokens: 0 } } })
    + ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } })
    + [...text.matchAll(/[\s\S]{1,9}/g)].map(m => ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: m[0] } })).join('')
    + ev('content_block_stop', { index: 0 }) + ev('message_delta', { delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 20 } }) + ev('message_stop', {});
};
test("to Anthropic: the frame asks for its lines and stops before a body, the ways ask for JSON by their schema, and every call has thinking off and its shared part cached", async () => {
  const { createAnthropic } = await import('@ai-sdk/anthropic');
  const { writerSettings } = await import('../lib/ai.js');
  /** @type {any[]} */ const sent = [];
  const fetch = /** @type {any} */ (async (/** @type {any} */ _url, /** @type {any} */ init) => {
    const b = JSON.parse(init.body); sent.push(b); const all = JSON.stringify(b.messages);
    const text = all.includes('write its head') ? frameText : all.includes('write the body of one page') ? body : JSON.stringify(ways);
    return new Response(sse(text), { headers: { 'content-type': 'text/event-stream' } });
  });
  const r = splitPage({ model: createAnthropic({ apiKey: 'sk-ant-test', fetch })('claude-haiku-5-5'), input, maxTokens: 3000, providerOptions: writerSettings('anthropic/claude-haiku-5.5').options });
  let text = ''; for await (const c of r.textStream) text += c;
  assert.equal(text, pageFromParts(input, frame, body, ways));
  assert.deepEqual(sent.map(b => [b.output_config?.format?.type ?? 'text', b.thinking?.type, b.messages[0].content[0].cache_control?.type]), [['text', 'disabled', 'ephemeral'], ['text', 'disabled', 'ephemeral'], ['json_schema', 'disabled', 'ephemeral']]);
  assert.deepEqual(sent[0].stop_sequences, FRAME_STOP);
  assert.deepEqual(sent[2].output_config.format.schema.required, WAYS_SCHEMA.required);
  assert.deepEqual([(await r.totalUsage).inputTokenDetails.cacheReadTokens, await r.finishReason], [120, 'stop']);
});

test('a planned topic the writer left plain is linked at its first mention, as it streams, never in a heading or a longer name', async () => {
  const { linkMentions, mentionLinker } = await import('../lib/prompts.js');
  const topics = ['Low Earth orbit', 'Lodestone', 'Iridium 33 and Cosmos 2251 collision', 'Orbit'];
  const text = '## Low Earth orbit crowds\nA lodestone hangs in low Earth orbit. The Iridium 33 and Cosmos 2251 collision left low Earth orbit worse. An orbit decays.\n\nThe [[Orbit|orbit]] again, and a lodestone again.';
  const once = linkMentions(topics, text);
  assert.equal(once, '## Low Earth orbit crowds\nA [[lodestone|Lodestone]] hangs in [[low Earth orbit|Low Earth orbit]]. The [[Iridium 33 and Cosmos 2251 collision]] left low Earth orbit worse. An [[orbit|Orbit]] decays.\n\nThe [[Orbit|orbit]] again, and a lodestone again.');
  assert.equal(linkMentions(['Lodestone'], 'The [[Lodestone|stone]] and a lodestone.'), 'The [[Lodestone|stone]] and a lodestone.', 'linked by the writer first, left as it linked it');
  /* streamed in pieces of any size, it reads exactly as at once, and nothing passed on is ever taken back */
  for (let n = 1; n <= 13; n++) {
    const L = mentionLinker(topics); let out = '';
    for (let i = 0; i < text.length; i += n) out += L.push(text.slice(i, i + n));
    assert.equal(out + L.end(), once, `in pieces of ${n}`);
  }
  const half = mentionLinker(['Lodestone']); assert.equal(half.push('A lode'), '', 'a word that may become a name waits'); assert.equal(half.push('stone pulls.') + half.end(), 'A [[lodestone|Lodestone]] pulls.');
});

test("the frame's lines are read however Haiku slips, and each goes out as soon as it is whole", () => {
  /* a preamble above the title, the format's names as labels, topics numbered, bulleted or without brackets, a deck
     after the facts: the same frame */
  const slipped = 'Here is the head.\n\n# Magnets :: thing\n> Invisible hands that move iron.\nKey facts:\nOldest :: lodestone, 600 BC\nStrongest :: 45 tesla\nPoles :: never one alone\nLink plan:\n1. Lodestone :: thing\n- [[Curie temperature]] :: phenomenon\n> a second deck\nMagnets :: thing\n';
  assert.deepEqual(frameOfLines(slipped), frame);
  /* the kinds in parentheses, as 4 of 24 live frames wrote them, with a second "+++" over the page's own topic */
  const head = frameText.slice(0, frameText.indexOf('+++\n') + 4);
  const parens = `${head}Lodestone (thing)\nCurie temperature (phenomenon)\n+++\n[[Magnets]] :: thing\n`;
  assert.deepEqual(frameOfLines(parens), frame);
  /* a name alone, and parentheses that are the name's own, are topics without a kind; a sentence is no topic */
  assert.deepEqual(frameOfLines(`${head}Lodestone\nMercury (planet)\nThat is the head.\n`).links, [{ topic: 'Lodestone', kind: '' }, { topic: 'Mercury (planet)', kind: '' }]);
  /* the facts with one colon, a bar or a colon too many, numbered or bold, as 3 of 88 live frames wrote them */
  const facts = frameText.replace('Oldest :: ', 'Oldest: ').replace('Strongest :: ', '1. **Strongest** | ').replace('Poles :: ', 'Poles: :: ');
  assert.deepEqual(frameOfLines(facts), frame);
  const at = (/** @type {string} */ t) => headSoFar(input, frameOfLines(t, false), false);
  assert.equal(at('# Magnets :: th'), '', 'nothing before the title line is whole');
  assert.equal(at('# Magnets :: thing\n'), '# Magnets :: thing\n', 'the title line as soon as it is whole');
  assert.equal(at('# Magnets :: thing\n> Invisible hands that move iron.\n'), '# Magnets :: thing\n> Invisible hands that move iron.\n', 'then the deck');
  assert.ok(at(frameText.slice(0, frameText.indexOf('Strongest'))).endsWith('!!!\nOldest :: lodestone, 600 BC\n'), 'then each fact');
  assert.ok(at(`${frameText.slice(0, frameText.indexOf('[[Curie'))}`).endsWith('+++\n[[Lodestone]] :: thing\n'), 'then each topic');
  /* written a character at a time, slipped or not, the head only grows, and ends as the whole frame's head */
  for (const t of [frameText, slipped, parens, facts]) {
    let shown = '';
    for (let i = 1; i <= t.length; i++) { const head = at(t.slice(0, i)); assert.ok(head.startsWith(shown), `rewritten at ${i}: ${JSON.stringify(head.slice(-60))}`); shown = head; }
    assert.ok(headSoFar(input, frameOfLines(t), true).startsWith(shown));
  }
  assert.deepEqual(frameOfLines('Sure! Writing it now.'), { title: '', kind: '', deck: '', facts: [], links: [] }, 'no title line, no frame');
});
