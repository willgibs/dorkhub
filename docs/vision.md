# Vision

_Will's product, in his terms. Read this before changing anything a reader sees._

## What Dorkhub is

An encyclopedia that writes itself around your curiosity: a world of interconnected topics
you move through freely. You start anywhere (a topic, a question, a half-remembered fact)
and every link opens a page on that topic, written to be the best page on it anywhere.
Read five things or a hundred and keep going; nothing pressures what you click next.

The feeling we are after: **it should feel like magic, and you should get lost learning.**
Dorkhub is generous by default (free to try, no account) and never watches you. Pages are
written for their topic, never for the reader, so the same topic in the same voice is the
same page for everyone, and a repeat opens instantly and free (Will, 2026-10-15).

Everything you read becomes **Your world**: a map of the topics you've read, lit in the
colours of what they are, joined to each other and to the topics they lead to. It's the
heart of the product (Will's Obsidian note: the graph is what makes people want one more
page), and it stays out of the way while you read: the reading page carries the article, its
cards and its tools; Your world is one step away, in the sidebar or at /world.

## What matters most, in order

1. **Reading.** Pages exist to be read. Readability is critical for learning and research,
   so the interface stays light and minimal, and nothing (grid backgrounds, decoration,
   chrome) competes with the text.
2. **Discovery.** The links are the product. They are specific and surprising: ideas,
   phenomena, mechanisms, mysteries, strange objects, places and events a curious person
   would stop reading to look up. Never umbrella subjects, never a parade of people.
3. **Flow.** Moving on should feel effortless: one topic per screen at its own address, the
   thing you clicked becomes the next title, back returns you to where you were, and
   nothing ever jumps. Free movement, not a tunnel: no levels, no single "next page".
4. **Depth on demand.** Tools around a page (save, peek, expand, around this,
   connect, skeptic mode, quiz, recap, your trail) are there when wanted and quiet when not.
   Will wants this secondary UI to feel as clean and considered as the articles themselves:
   a few polished, purposeful tools rather than a bunch of random tooling, so one that isn't
   reliably beautiful goes (Sketch it, a generated diagram, dropped 2026-10-19).
   World features never add weight to the article: they are hidden magic, there when you
   pause (Will, 2026-10-15).
5. **The front page** gets a visitor into their first page. One composer, front and centre,
   with suggestions for anyone who would rather not type; below it, peeking above the fold,
   ways in: cards made by hand, each its own drawing leading into one topic (a black hole's
   disk as Luminet first drew one, the aurora's colours by height, a sheet in Miura's fold that
   opens in one pull, a flytrap you can touch, an Enigma you can type into), and a map of the
   threads between the topics that says why each leads to the next. While the front page is
   updated by hand, every card is designed on its own, and no two look alike. A reader finds
   their own world in the last card's place. No marketing (Will, 2026-10-15).
   The drawing is the card (Will, 2026-10-16): it fills the card, with only the topic's kind and
   title; the visitor clicks in to find out what it shows. Short labels stay where the drawing
   would lose its meaning without them, and the rest answers the pointer. As you scroll, one
   card tells its story at a time, in reading order, so each is seen; nothing moves for its own
   sake after that. The front page's topics are chosen for what their cards can show.
   The hero (Will, 2026-10-17): the heading, the composer and the suggestions, nothing above them
   and no heading over the cards. The heading says "Learn about anything", but on a visit's first
   arrival its last word first steps through a few of the front page's topics, each in its kind's
   colour, once, so "anything" comes having been shown: black holes, Atlantis, time travel, DNA
   (Will, 2026-10-19: four corners of what there is to know, and widths that alternate, so the line
   shrinks and grows at every step). The page you were last on leads the suggestions, marked with
   a small play mark in its kind's colour, and isn't suggested again beside it. The composer has
   the first screen to itself: the heading is set at most 48 px, and the cards peek in by a card's
   name and the edge of its drawing, no more (Will, 2026-10-19).

## Principles (Will's standing calls; CLAUDE.md has the short form)

- **One point of focus at a time.** Great design moves attention between visuals, copy
  and transitions, with the most depth and polish at the point of focus. Many things
  happening at once is distracting, not impressive.
- **Dense, with breathing room.** High information density in a minimal design, but every
  section gets room to present cleanly instead of being pressed together.
- **Colour carries information.** The multi-colour lineup is loved: a colour says what a
  topic is, on its links, as the page's accent and in Your world. Use colour to add meaning
  and mix hues for density, never as decoration, and never rainbow everywhere.
- **Streaming never surprises.** Nothing may appear above where the reader already is. No
  "where did that come from?" moments; asides and late blocks settle in smoothly.
- **A clicked topic stays the title.** Only questions and connecting pages pick their own.
- **No tracking.** Will rejected learning from which kinds of links people click: it
  makes readers cautious. Nothing about the reader shapes a page: it is written for its
  topic, and an exact repeat is reused. A rewrite is private to the reader who asked.
- **Labels live in tooltips.** Icon-only controls keep the UI clean and invite "what does
  that do?" exploration. Anything visible should earn its place with real value.
- **Brand:** Dorkhub (wordmark "dorkhub"). Keep dig, dirt, tunnel and earth metaphors out.
- **While exploring, massive strides beat cautious steps.**

## Identity

- Logo: the dotted wordmark "dorkhub", alone in the top bar (Will, 2026-10-15). The glasses
  with yellow tape (#FFD43B) on the bridge stay as the favicon.
- Type: Inter for everything, reading included (Will, 2026-10-15), with tabular numerals
  for figures and keys; Doto for the wordmark and dotted display moments.
- Eight kinds of topic, each with a colour: ideas, phenomena, mechanisms, places, people,
  events, things, mysteries. A page tints toward the colour of what it is about, and its
  dot in Your world glows in it. A kind named in words is its word in its colour, with no dot
  beside it (the word already carries the colour), and the page's title in the top bar is set
  in its colour the same way (Will, 2026-10-19).
- Voice: warm, specific, plain words, never condescending. Light and dark themes; dark is near
  black, for contrast (Will, 2026-10-17).
- The look (Will, 2026-10-15): modern, sleek and sophisticated, while light, minimal, seamless
  and fluid. Paper, raised surfaces and one scale of elevation. Motion on transitions.dev's
  scale, effects ported from libraries.dev. The brand spectrum (all eight link colours)
  appears once: the beam riding the composer's edge.
- Dots say the machine is working: the Doto wordmark, thinking orbs during a real wait (a
  different motion for each kind of wait), and pictures that resolve out of a field of dots.
- Your world is lit dots on deep paper: each topic glows in its colour, sized by how
  connected it is, with hairline links and faint invitations at the edges. It moves only
  when something changes (a new topic springs in, a trail replays), then rests. Dark mode
  is the showpiece; light mode gets the same care.

## Anatomy of a page (the generative UI)

Written in one streamed pass, top to bottom, in the format defined in `lib/prompts.js`
(`FORMAT`) and parsed by `src/shared/article.js`: title and the topic's kind (a creature,
a mystery, an event…; it shapes the page) · deck · link plan (a kind for every link, so
links arrive in colour) · body with asides and up to two **panels** · six topics to
keep exploring, each with its hook and kind, some deeper into the subject and at least two
leaping into another field · three open questions that stand on their own · a hook for
every link (for hover cards). Under its deck, every page carries a line of key facts: three
readings shaped by its kind (a creature's size, a place's whereabouts, a mystery's verdict), side
by side when each value fits on a line of its own, and down the column as label and value when one
doesn't.

**Designed for what the writer sends** (Will, 2026-10-19): every page is generative, so its design
must hold the outliers beautifully (a long title, a long fact, a long name) rather than lean on
prompt rules to keep them short, which are far more fickle across models. Compact, clean inputs
are welcome; the design never depends on them. So a title is set by its length (a question takes
two or three lines at a smaller size, never four large), the key facts choose side by side or down
the column by what fits, and the end's point carries no name to collide with. Everywhere words from the writer
appear (the page, its cards and panels, link cards, the sidebar, Around this, Your world), a word too long for its box
breaks inside it rather than pushing the box wider, and a name that leads somewhere is kept whole: shortened only where
the whole of it is a tap away. An outlier page (`tests/outliers.js`) holds the line in the browser walk.

**One bar for every page** (Will, 2026-10-19): the front page's cards and suggestions are an
economical, engaging way in, and the pages behind them are what any page is. A page written ahead
of time comes from the same writer and prompt, in one pass, with no research and no fact-check, so
the next page a reader opens is never a letdown after a showcase. What a page gets wrong is fixed
in the prompt, for every page.

Panels (v2) are information the writer lays out and Dorkhub draws: timeline, facts, steps,
compare, theories, figures, myth, formula, guess. The writer uses one only when it shows
something prose can't, most pages one or none, never two in a row; the body stays the
page. A page's lead picture (Wikipedia, freely licensed, credited) may follow the opening
paragraph, across the column, captioned with what it shows; no model is involved in finding
or captioning it.

**One column** (Will, 2026-10-15: a side column beside the text "creates a visual cluster"): a
page reads down a single centred column, and its asides, a facts panel and its picture sit in
it, below the paragraph they belong to. Nothing sits beside the words but white space, and a
link's card while you point at it, in the margin where there's room, so it never covers them.
Lines run about 70 characters (20 px type on a 680 px column).

**A point on its threads** (Will's pick of PR J, 2026-10-18): a page knows where it sits among
yours. Its head names the page you came from, and a front-page topic's page opens with its
card's drawing, carried from the card. Once the title scrolls away it waits in the top bar. The
end is drawn the way the front page draws its threads and Your world what you've read: this
page an unnamed point (its title is in the top bar by then; Will, 2026-10-19), a hairline out to
each of its six ways on, meeting each at the edge of a ring in its kind's colour, filled once
read; then its open questions. Kinds, panel names and the end's headings are set in the front
page's small capitals. A page written ahead of time says nothing about it: reading it feels the
same as reading one written just now (Will, 2026-10-19: that note took from the feel of a page
made as you ask). That pages already written open instantly and free is said once, as a small
win, beside your free pages.

**The page-500 test** (Will, 2026-10-14): a reader scrolls through hundreds of these pages,
so nothing recurring may charm on page 10 and annoy by page 500. Taste through restraint.
The delight is the snappy, clean stream: the page being written around you.

Around it: hover/tap a link for its hook (and whether you've read it, or which of your
pages also lead there), then peek without leaving; expand any paragraph (plainer, deeper,
an example, the counterpoint); save it with the star; around this (a
radial map of neighbours); connect it to any topic you've read; skeptic mode; listen; a
quiz and a recap of the trail you're on; "how did I get here?" (your trail); the sidebar
(Your world beside the page, your index, your trails, deep time; closed, it takes no room, and
its toggle sits before the wordmark); ask anything (/). The top bar's actions share one shape,
and Your world has one entry point there, its count beside it, set as part of its icon; the theme
switch is there on every page.
Keyboard first: 1–6, S, G, T, F, L, C, P, D, Q, R, I, A, M, N, ?. On a phone the top bar
keeps a plain menu (keys, voice, theme, export, shortcuts, a new topic) and one gooey
button holds the learning tools (search, Your world, save, around this).

**Your world** (/world) is drawn like an instrument, not a light show (Will, 2026-10-15:
"a sleek F1 visualisation, not junior glowy"): hairlines on a faint grid, names in small
capitals, colour only for what a topic is. The whole map, with find, kind filters, focus (everything within
two links), Replay (a trail walked again across the map), and a picture of it to keep;
then what you read by kind, your most connected topic, your saved pages and your trails.
Only where the map is already visible does it grow as you read; while you read, only the
count beside Your world moves.

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
