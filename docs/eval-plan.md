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

A fifth variant is a few lines in `PAGE_VARIANTS`. Models: `--models`; only `vetted` models ship.

## The topic set

`scripts/eval/topics.json`, **a proposal for Will to edit**: 29 topics unlike the front page (none from
`FRONT` or `EARLIER`), two per kind, three questions, a connecting pair (Guano and Gunpowder), an
ambiguous name read in context (Java, from Coffee), with eleven marked where numbers are easy to get wrong.
Each names the Wikipedia article its fact check reads. Default: every arm, every topic, two runs.

## What is measured

**Accuracy, first and as a gate.** A judge model extracts every checkable claim (numbers, dates, names,
attributions) from the body, the key facts and the hooks separately, and marks each supported,
contradicted or absent against the topic's Wikipedia article. Reported: contradicted claims a page (and
in key facts, in hooks), and the share the source supports. "Absent" is not an error: the source is
short and the page is meant to go past it.

**Engagement.** A blind pairwise judge: the same topic from two arms, sides random, arm names hidden;
which page a curious reader would rather keep reading, on specificity, surprise, clarity and whether
the links make them want to click. Then Will's own blind picks on `review.html`, read back with
`node scripts/eval.mjs picks <run dir> <picks.json>`. Will's picks outrank the judge's.

**Format** (`scripts/eval/score.js`, automatic): usable page; body length; one-sentence paragraphs;
three key facts, labels 1 to 3 words, values under 7, no superlatives; deck under 25 words; 10 to 14
planned links, all used; people at most a quarter of links; umbrella links (a heuristic: lexicon plus
patterns); stock curiosities; exactly six cards and three questions; hook and card-hook lengths; hooks
with numbers; panels; margin notes; a locked title kept.

**Speed and cost**: time to the first character, to the first body character, and to the end; input,
cached and output tokens.

**Statistics**: per-arm means with 95% bootstrap intervals; pairwise win rates with an exact sign test,
labelled "not significant" when p ≥ 0.05. Two runs a topic show how much one writer varies with itself.

## How a run is approved

1. `node scripts/eval.mjs plan [--arms …] [--models …] [--topics …] [--runs n] --prices prices.json`
   prints every call (writer, pairwise judge, fact-check judge), estimated input and output tokens per
   call and in total, and dollars for models with a supplied price ("price unknown" otherwise; prices
   are never hard-coded: check the AI Gateway catalog on the day).
2. Will reads the plan and its cost, and says go.
3. `node scripts/eval.mjs run --live --yes-spend --budget <dollars> --prices prices.json [same options]`.
   It refuses without both flags, without a price for every model, or when the plan's estimate is over
   the budget; while running it checks each call's worst case against the budget and stops cleanly,
   keeping and summarizing what it has.
4. Output in `.eval/<run id>/` (git-ignored): each page's text, `pages.jsonl` (timings, tokens, scores,
   fact tallies), `judgements.jsonl`, `summary.json`, `report.html`, `review.html`, `review-key.json`.

## How results decide the writer

1. **Accuracy gate.** An arm whose contradicted claims a page are worse than base's (intervals not
   overlapping in base's favour), in total or in key facts, is out, however engaging.
2. Among arms that pass, the one Will picks more often in his blind review wins, then the judge's win
   rate. A win marked "not significant" is not a win: run more topics or keep base.
3. Format compliance and speed break ties; a slower time to the first body character needs a clear
   win to justify it.
4. The winner becomes `PAGE_VARIANT` (with a `PROMPT_VERSION` bump), the decision goes in
   `docs/decisions.md`, and a winning model is marked `vetted` in `src/shared/models.js`.
