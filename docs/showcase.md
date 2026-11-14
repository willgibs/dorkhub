# Showcase: capturing Dorkhub

_For whoever captures Dorkhub for Will's portfolio (2026-11-14). What to show, where it works, and how to get it
on camera without fighting the app._

## Where it works

- **dorkhub.com** is the real thing. Without AI Gateway credit the writer can't run, so stay on the pages written
  ahead of time: the 33 front-page topics (every card, suggestion and thread on the front page) and the 11 earlier
  pages they lead to. They open free and instant. **Don't type a new topic into the composer on production**: it
  opens a "paused" page until credits exist.
- **A page being written, word by word**, can only be filmed locally for now: `npm run dev` (port 3000, or `PORT=…`)
  runs a mock writer that replays real recorded pages at a writer's pace. Type *Lanchester's laws*, *Bog bodies*,
  *Mantis shrimp vision* or *Lewis gun* into the composer.
- Production rate-limits `/api/write` (40 a minute per address) and every reading page calls it once: pace a
  capture script under ~20 page loads a minute. Use a generic User-Agent.

## What to show (in the order a visitor meets it)

1. **The hero**: "Learn about anything", whose last word steps through a few topics in their kinds' colours on a
   visit's first arrival only (a fresh browser context), then the composer with its glow.
2. **The cards**, which peek in below the fold and each tell their story once, one at a time, as they come into
   view (a card plays when 60% of it has been on screen for 150 ms; wait for it to finish, 1–2.5 s). The strongest:
   Black holes (the hero: the disk as Luminet drew it), Northern lights, Origami (pulls open; the pointer or a
   thumb takes its corner), Venus flytraps (touch it: two touches within 20 s shut it, five digest), Enigma (type
   into it), Magnets (filings follow the pointer), Pompeii (Pliny's view: the cloud like the pine beside him),
   Fireworks (a night show, each colour a metal), Rubik's Cube, Lightning, Giant squid, Infinity, Atlantis.
   Pointing at a drawing reads out what it shows.
3. **The map of threads** between topics, below the cards, and the footer: the wordmark set in round lamps, ink at
   rest, one lamp coloured for each page read.
4. **A reading page**, e.g. `/black-holes`: the card's drawing as the plate, the title, the page in its kind's colour,
   links that read as the line around them. The top bar's row of lamps shows how far down you are.
5. **The moves**: click a card and its drawing and title travel into the page; press Back and they travel home into
   the card. The same runs for a link, the composer, the map of threads and Your world.
6. **Your world** (`/world`, or the bar's button): the map of everything you have read, which grows as you read.
   Read six or more pages first so it has shape.
7. **Sharing**: every page's link unfolds as a picture (`/fireworks` pasted into a message, for instance).
8. **Both themes and a phone**: the site follows the system theme; at 390 px wide every card has its own phone
   composition.

## How

- Playwright is a dev dependency (`npx playwright install chromium` once). `npm run e2e` walks the whole reader flow
  on desktop and phone and leaves screenshots in `.e2e/` (each card on its own, the threads, the footer, a page).
- Motion is easiest to film with animations driven by hand: pause them with the Web Animations API and step
  `currentTime`, or slow the page with CDP `Animation.setPlaybackRate`.
- Leave reduced motion off; with it on, cards show their finished drawing and moves are plain cuts.
