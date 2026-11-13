# Writer eval plan

_Nothing here runs against a model without Will's go on a printed plan and its cost. Everything below is
built and proven on the mock writer and a fake judge (`npm run verify`, `node scripts/eval.mjs run --dry`)._

## Why

To find the most engaging page writer that stays factual. A writer is an **arm**: a prompt variant
(`PAGE_VARIANTS` in `lib/prompts.js`) on a model. Every arm writes format v3.1 exactly, so the parser and
the page never change with the writer. Production writes with `PAGE_VARIANT` (`base`, today's prompt,
pinned byte for byte by `tests/prompts.test.js`); switching it is a `PROMPT_VERSION` bump.

## The arms

- **base**: today's prompt as one message. The control.
- **split**: the same words; `PAGE_INTRO` and `FORMAT` as instructions, the request as the prompt, so a
  provider can cache the instructions.
- **grounded**: split, plus the lead of the topic's Wikipedia article as reference notes
  (`lib/grounding.js`, about 500 tokens, 800 ms timeout, none for questions or ambiguous titles): facts
  from the notes, never their wording; the notes are a floor, not the page; a doubtful point is left out.
- **hooks-tight**: split, with hover hooks that carry no number, date or superlative unless textbook.
  Hover hooks were the most error-prone part of a page.
- **lean**: the same page asked for in half the words (about 690 against 1,450) and a sixth of the
  rule words (8 against 48). Will, 2026-11-13: an elegant prompt with the right context lets a capable
  writer use its discretion, where one that rules on every edge case gets its rules lost and leaves no
  creativity for the article. It says who the page is for and what a great one does, shows the shape
  once, and leaves the rest to judgement. The page's design and the parser already hold the outliers.
  This arm is the test of that idea: does it win the blind pairs without losing format or facts?

A fifth variant is a few lines in `PAGE_VARIANTS`. Models: `--models`; only `vetted` models ship.
## The topic set

`scripts/eval/topics.json`, **a proposal for Will to edit**: 29 topics unlike the front page (none from
`FRONT` or `EARLIER`), two per kind, three questions, a connecting pair (Guano and Gunpowder), an
ambiguous name read in context (Java, from Coffee), with eleven marked where numbers are easy to get wrong.
Each names the Wikipedia article its fact check reads.

**Presets.** `first` (the default, ~144 calls) is a first look to approve first: the five arms on
today's writer, 12 topics (one per kind, the one with the riskier numbers), one run; base vs split by
automatic checks only (same words, no judge call), blind pairs split vs lean, split vs grounded and
split vs hooks-tight, fact checks on all but base. It is a first look, not a verdict, and the report
says so. `full` (~1,160 calls) is every pair and every fact check over all 29 topics, twice.
`--judge` takes any model, so a cheaper judge can be priced against the default.

**What it costs** (the AI Gateway's public model list, 2026-11-13: Haiku 5.5 $0.10 in / $0.50 out per
million tokens, Sonnet 5.5 $2 / $10, Opus 5.5 $4 / $20; check again on the day):

| Preset | Writers (Haiku 5.5) | Judged by Opus 5.5 | Judged by Sonnet 5.5 |
|---|---|---|---|
| `first` | ~115k in, ~92k out: $0.06 | ~481k in, ~83k out: $3.60 | $1.80 |
| `full` | ~557k in, ~445k out: $0.28 | ~3.9M in, ~609k out: $28 | $14 |

A page on today's writer costs about a tenth of a cent ($0.0011: 2,500 tokens in, 1,700 out), so the
judging is nearly all of an eval's cost.

## What is measured

**Accuracy, first and as a gate.** A judge model extracts every checkable claim (numbers, dates, names,
attributions) from the body, the key facts and the hooks separately, and marks each supported,
contradicted or absent against the topic's Wikipedia article, given in two labelled parts: LEAD (exactly
the notes the grounded writer gets) and REST (the article after it; about 6,000 tokens in all,
`--source-tokens`). Each verdict says where its evidence was: lead, rest, or none. Per arm and per part:
- **contradicted, beyond the notes** (the headline): contradicted claims among those settled by REST
  only. The grounded arm restates its notes and earns "supported, lead" for it, which would flatter any
  rate counting the lead; claims settled beyond it are ones every arm wrote from its own knowledge.
- contradicted, of all checked claims; and the share absent (unverifiable, not wrong).

**Engagement.** A blind pairwise judge: the same topic from two arms, sides random, arm names hidden;
which page a curious reader would rather keep reading, on specificity, surprise, clarity and whether
the links make them want to click. Then Will's own blind picks on `review.html`, read back with
`node scripts/eval.mjs picks <run dir> <picks.json>`. Will's picks outrank the judge's.

**Format** (`scripts/eval/score.js`, automatic): usable page; body length; one-sentence paragraphs;
three key facts, labels 1 to 3 words, values under 7, no superlatives; deck under 25 words; 10 to 14
planned links, all used; people at most a quarter of links; umbrella links (a heuristic: lexicon plus
patterns); stock curiosities; exactly six cards and three questions; hook and card-hook lengths; hooks
with numbers; panels; margin notes; a locked title kept.

**Speed and cost**: time to the first character, to the first body character, and to the end; tokens.
**Statistics**: per-arm means with 95% bootstrap intervals; pairwise win rates with an exact sign test,
labelled "not significant" when p ≥ 0.05. Two runs a topic show how much one writer varies with itself.

## How a run is approved

1. `node scripts/eval.mjs plan [--preset first|full] [--judge …] --prices prices.json` prints every
   call, estimated tokens per call, writer and judge totals apart, and dollars only for supplied prices
   ("price unknown" otherwise; never hard-coded: check the AI Gateway catalog on the day).
2. Will reads the plan and its cost, and says go.
3. `node scripts/eval.mjs run --live --yes-spend --budget <dollars> --prices prices.json [same options]`.
   It refuses without both flags, without a price for every model, or when the plan's estimate is over
   the budget; while running it checks each call's worst case against the budget and stops cleanly,
   keeping and summarizing what it has.
4. Output in `.eval/<run id>/` (git-ignored): each page's text, `pages.jsonl` (timings, tokens, scores,
   fact tallies), `judgements.jsonl`, `summary.json`, `report.html`, `review.html`, `review-key.json`.

## Running it without gateway credits (2026-11-13)

Will: test on the Claude subscription rather than paid credits. `scripts/eval/claude-cli.js` is a model for the AI
SDK that makes one headless `claude -p` call per answer (no tools, no project, no settings, never an API key), so
the harness runs unchanged:

- `--via claude`: writers and judges on the subscription.
- `--judge-via claude`: only the judges, the writers on the gateway. The judges are nearly all of a run's cost
  (about $3.60 of the first look's $3.70), so this needs only cents of credit.
- A model id may end in an effort, `anthropic/claude-haiku-5.5:low`, and needs its own `--price`.

**What it cannot do:** turn a writer's thinking off. Claude Haiku 5.5 thinks unless a request says not to, and the
CLI (2.1.304 to 2.1.321) has no working switch. Production's writer is now told not to think (`writerSettings` in
`lib/ai.js`), so writers under test belong on the gateway; use `--via claude` only for a writer that is meant to
think.

**What the first runs showed** (17 pages and a dozen probes on the subscription, none judged, so read them as
signals):
- On the page prompt Haiku 5.5 thought 11,000 to 17,000 tokens at the API's default effort (52 to 76 s before the
  first word) and 0 to 9,000 at low. A page's limit is 3,000 tokens, thinking included.
- At low effort it sometimes skips thinking, and how often depends on the prompt: `lean` and `grounded` skipped it
  on 2 of 3 topics, `base` and `hooks-tight` on at most 1 of 3.
- `base` (everything in one user message) wrote its title line without the `#` on 10 pages of 10, so none parsed;
  `split` (the same instructions as the system message) kept it on 3 of 3. One route, one model: check it on the
  gateway before believing it, but it argues for `split` as the form production sends.
- Every variant missed some finer rules (a deck under 25 words, every planned link used, no one-sentence
  paragraphs), and pages ran to about 2,000 tokens, above the 1,536 the plan assumes.

## How results decide the writer

1. **Accuracy gate.** An arm whose beyond-the-notes contradicted rate is worse than the control's
   (base, or split where base isn't fact-checked; intervals not overlapping in its favour), in all
   claims or in key facts, is out, however engaging.
2. Among arms that pass, the one Will picks more often in his blind review wins, then the judge's win
   rate. A win marked "not significant" is not a win: run more topics or keep base.
3. Format compliance and speed break ties; a slower time to the first body character needs a clear
   win to justify it.
4. The winner becomes `PAGE_VARIANT` (with a `PROMPT_VERSION` bump), the decision goes in
   `docs/decisions.md`, and a winning model is marked `vetted` in `src/shared/models.js`.
