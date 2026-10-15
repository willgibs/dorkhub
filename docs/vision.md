# Vision

_Will's product, in his terms. Read this before changing anything a reader sees._

## What Dorkhub is

An encyclopedia that writes itself around your curiosity. You start anywhere (a topic, a
question, a half-remembered fact) and every link opens a page written on the spot for the
exact path you took to reach it. Pages connect back to where you came from, so a rabbit
hole reads like one story.

The feeling we are after is the perfect rabbit hole: **it should feel like magic, and you
should get lost learning.** Dorkhub is generous by default (free to try, no account) and
never watches you: only the path you are on shapes the next page.

## What matters most, in order

1. **Reading.** Pages exist to be read. Readability is critical for learning and research,
   so the interface stays light and minimal, and nothing (grid backgrounds, decoration,
   chrome) competes with the text.
2. **Discovery.** The links are the product. They are specific and surprising: ideas,
   phenomena, mechanisms, mysteries, strange objects, places and events a curious person
   would stop reading to look up. Never umbrella subjects, never a parade of people.
3. **Flow.** Moving on should feel continuous and effortless: the next page flows in below
   (J), the thing you clicked becomes the next title, and nothing ever jumps.
4. **Depth on demand.** Tools around a page (peek, expand, sketch, around this, connect,
   skeptic mode, quiz, recap, the thread) are there when wanted and quiet when not. Will
   wants this secondary UI to feel as clean and considered as the articles themselves.
5. **The landing page** has one job: get a visitor into their first page. It stays light:
   one composer, front and centre, with presets for anyone who would rather not type.

## Principles (Will's standing calls; CLAUDE.md has the short form)

- **One point of focus at a time.** Great design moves attention between visuals, copy
  and transitions, with the most depth and polish at the point of focus. Many things
  happening at once is distracting, not impressive.
- **Dense, with breathing room.** High information density in a minimal design, but every
  section gets room to present cleanly instead of being pressed together.
- **Colour carries information.** The multi-colour lineup is loved: link colours say what
  a link leads to, level colours say how deep you are. Use colour to add meaning and mix
  hues for density, never as decoration, and never rainbow everywhere.
- **Streaming never surprises.** Nothing may appear above where the reader already is. No
  "where did that come from?" moments; asides and late blocks settle in smoothly.
- **A clicked topic stays the title.** Only questions and connecting pages pick their own.
- **No tracking.** Will rejected learning from which kinds of links people click: it
  makes readers cautious. Every page offers broadly interesting links to anyone; only the
  current path (and ratings on that path) may shape a page.
- **Labels live in tooltips.** Icon-only controls keep the UI clean and invite "what does
  that do?" exploration. Anything visible should earn its place with real value.
- **Brand:** Dorkhub (wordmark "dorkhub"). Keep dig, dirt, tunnel and earth metaphors out.
- **While exploring, massive strides beat cautious steps.**

## Identity

- Logo: the dotted wordmark "dorkhub", alone in the top bar (Will, 2026-10-15). The glasses
  with yellow tape (#FFD43B) on the bridge stay as the favicon.
- Type: Inter for everything, reading included (Will, 2026-10-15), with tabular numerals
  for figures and keys; Doto for the wordmark and dotted display moments.
- Eight nerd levels, each with its own accent: Curious, Hooked, Invested, Obsessed, Deep
  nerd, Specialist, Galaxy brain, Beyond. The page tints toward the current level.
- Eight link kinds, each with a colour: ideas, phenomena, mechanisms, places, people,
  events, things, mysteries.
- Voice: warm, specific, plain words, never condescending. Light and dark themes.
- The look (Will, 2026-10-15): modern, sleek and sophisticated, while light, minimal, seamless
  and fluid. Paper, raised surfaces and one scale of elevation. Motion on transitions.dev's
  scale, effects ported from libraries.dev. The brand spectrum (all eight link colours)
  appears once: the beam riding the composer's edge.
- Dots say the machine is working: the Doto wordmark, thinking orbs during a real wait (a
  different motion for each kind of wait), and pictures that resolve out of a field of dots.

## Anatomy of a page (the generative UI)

Written in one streamed pass, top to bottom, in the format defined in `lib/prompts.js`
(`FORMAT`) and parsed by `src/shared/article.js`: title · deck · bridge (how this page
connects to where you came from) · link plan (a kind for every link, so links arrive in
colour) · body with margin notes (some are callbacks to pages on your path) and up to two
**panels** · the natural next page · five branches (deeper, sideways, wild) · three open
questions · a hook for every link (for hover cards).

Panels (v2) are information the writer lays out and Dorkhub draws: timeline, facts, steps,
compare, theories, figures, myth, formula, guess. The writer uses one only when it shows
something prose can't, most pages one or none, never two in a row; the body stays the
page. A page's lead picture (Wikipedia, freely licensed, credited) may sit beside the
opening; no model is involved in finding it.

**The page-500 test** (Will, 2026-10-14): a reader scrolls through hundreds of these pages,
so nothing recurring may charm on page 10 and annoy by page 500. Taste through restraint.
The delight is the snappy, clean stream: the page being written around you.

Around it: hover/tap a link for its hook, then peek without leaving; expand any paragraph
(plainer, deeper, an example, the counterpoint); sketch a diagram; around this (a radial
map of neighbours); connect two pages you've read; skeptic mode; listen; a quiz on what
stuck; a recap; "how did I get here?"; the map, index and timeline sidebar; ask anything
(/). Keyboard first: J, 1–5, U, S, K, L, C, P, T, D, Q, R, I, A, M, N, ?.

## How it is paid for

Free pages need no account (10 a month per device, 100 per network), written on
Dorkhub's AI Gateway under a hard monthly budget. Readers who want more bring their own
key (kept in their browser). **Pro** comes later: accounts created at checkout, a monthly
page allowance, no keys. Pricing is Will's call.

## Not built yet (each needs Will's go)

- **Pro**: auth, Stripe, a credits ledger.
- **Sharing**: the prototype had a Hub, a shared feed of published rabbit holes that
  others could follow. It was left out of launch. See `docs/prototype/`.
- **More writers**: OpenAI and Gemini keys are wired in but switched off until the model
  eval (`docs/eval-plan.md`) clears them.
