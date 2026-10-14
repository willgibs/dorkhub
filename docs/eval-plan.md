# Model eval plan (deferred)

_Will deferred this until the generative UI and the overall experience settle, so the eval
isn't rerun after every format change. Don't start it without his go, and confirm the
cost with him first (estimate below)._

## Why

It decides three things: which model writes the free pages (today Claude Haiku 5.5, the
tier the prototype's default "Fast" writer used), which models readers may pick with their
own keys (today Claude only), and which prompt works best for each model. Will's framing:
"This is as much a challenge of prompt engineering as it is code architecture," so
compare prompt variants per model, not one prompt across models.

## Candidates (AI Gateway ids; USD per million tokens, in / out, as of 2026-10)

| Model | In | Out |
| --- | --- | --- |
| anthropic/claude-haiku-5.5 | 0.10 | 0.50 |
| anthropic/claude-sonnet-5.5 | 2 | 10 |
| openai/gpt-6-luna | 0.10 | 0.50 |
| openai/gpt-6.1-sol | 2 | 10 |
| google/gemini-3.8-flash | 0.75 | 3.75 |
| google/gemini-3.5-flash-lite | 0.30 | 2.50 |
| google/gemini-4-argon | 2 | 10 |
| deepseek/deepseek-v4.1-flash | 0.30 | 1.20 |
| moonshotai/kimi-k2.6 (optional) | 0.95 | 4 |

Re-check prices and each model's reasoning options in the live catalog
(`https://ai-gateway.vercel.sh/v1/models`). Set the lowest reasoning effort that keeps
quality, because time to first word matters as much as quality.

## Prompt variants

- **Page v1:** today's single user message (`pagePrompt` in `lib/prompts.js`).
- **Page v2:** split into instructions (role, `FORMAT`, linking and accuracy rules) and a
  prompt holding only the path context and the task. This also enables prompt caching.
- **Page v3:** v2 plus a short skeleton example of the format.
- **Small tasks:** today's plain "reply with only JSON" text versus structured output
  (AI SDK `Output` with `jsonSchema`) for doubt, around, sketch and quiz.

## Scenarios

1. First topic: "Tardigrades".
2. First question: "Why is ice slippery?"
3. Clicked link at level 1: The Great Emu War → "Lewis gun". This tests the title lock;
   the prototype once titled a "First World War" click as "The Lewis Gun".
4. Continue reading at level 2: Voynich manuscript → Radiocarbon dating → Bomb pulse.
5. Deep page at level 5: … → Grid cells.
6. Connecting page: Tulip mania ↔ Endosymbiosis.
7. Contested topic: the Baghdad Battery (accuracy and hedging).
8. Kid lens: black holes.

Plus each small task (peek, unfold, doubt, around, sketch, quiz, thread, recap) on a
couple of the pages above. Run every cell at least twice.

## Scoring

**Automatic** checks, using `parseArticle` from `src/shared/article.js`:
- **Order and title:** blocks arrive in the right order, and the title lock holds.
- **Opening:** deck, bridge and drift are present, with 3–5 facts.
- **Link plan:** 10–16 entries, and every planned topic is linked in the body.
- **Body:** 450–600 words in 3–4 sections, with 2–3 margin notes.
- **Ending:** 5 branches covering deeper, sideways and wild, a next page, and 3 questions.
- **Link quality:**
  - people make up at most 25% of links
  - no umbrella topics (a whole war, country, century or science)
  - no markdown leaking into the text
- **Speed and cost:** time to first word, total time, tokens and cost.

**Judges**, two from different families: anthropic/claude-opus-5.5 and openai/gpt-6.1-sol.
Each scores 1–10 on pull, specificity, links, connection to the path, accuracy, prose and
overall. Judges see the scenario's path, not the model's name.

## Harness

The simplest route is a local script (`scripts/eval.mjs`) that calls AI Gateway with
Will's `AI_GATEWAY_API_KEY` from `.env.local`, builds prompts from `lib/prompts.js`, and
writes JSONL plus a summary table to `.eval/` (git-ignored). Then publish the results to
Will in a readable form. Nothing eval-related ships to production.

**Estimated cost:** about $9–10 for the full matrix with judges. Confirm with Will.

## After the eval

- Make prompt variants selectable per model in `lib/prompts.js`, keyed by writer id.
- Mark the winners `vetted` in `src/shared/models.js` and enable their providers.
- Change `DH_TRIAL_MODEL` if a different trial model wins.
- Bump `PROMPT_VERSION`.
- Record the decisions in `docs/decisions.md`.
