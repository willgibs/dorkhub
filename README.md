# dorkhub

A social discovery platform for hobbyist developers — show the things you build for fun.
Not a launch platform, not a marketplace, not a hiring portfolio.

> "I built a thing, here it is, take it, use it, fork it, enjoy it."

## Stack

Next.js (App Router) · Tailwind CSS v4 · Supabase (Postgres + Auth + Storage) · Vercel · Biome

## Development

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase + GitHub values
pnpm dev
```

- `explorations/` — the M0 design-language explorations that produced the locked design system
  ("Quiet dev-native"); `explorations/compare.html` shows all candidates, `tuner.html` the mixer.
- `src/app/design` — the living styleguide; every component lands there in the PR that creates it.
- `supabase/migrations` — schema, RLS, triggers.

Made by dorks, for dorks.
