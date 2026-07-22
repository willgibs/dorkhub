-- ============================================================================
-- dorkhub.com — dev/demo seed fixtures
-- ============================================================================
-- Runs on a fresh dev database with NO auth users: every profile is seeded
-- unclaimed (user_id null, claimed_at null) and becomes claimable later via
-- its github_id. Runs as a privileged role (supabase db reset / SQL editor),
-- so grants and RLS do not apply here.
--
-- All UUIDs are fixed so seeds are deterministic and referencable from
-- supabase/tests/rls_checks.sql:
--   profiles:       a1000000-0000-4000-8000-0000000000NN
--   projects:       b2000000-0000-4000-8000-0000000000NN
--   claim invites:  c3000000-0000-4000-8000-0000000000NN
--   featured slots: d4000000-0000-4000-8000-0000000000NN
--
-- likes_count / saves_count / followers_count are NOT set here — the
-- engagement triggers recount them when the likes/saves/follows rows land,
-- which also exercises the trigger path on every fresh seed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tag taxonomy (~20 starter rows)
-- ----------------------------------------------------------------------------

insert into public.tags (slug, label, kind) values
  -- stacks
  ('typescript', 'TypeScript', 'stack'),
  ('javascript', 'JavaScript', 'stack'),
  ('python',     'Python',     'stack'),
  ('go',         'Go',         'stack'),
  ('rust',       'Rust',       'stack'),
  ('react',      'React',      'stack'),
  ('svelte',     'Svelte',     'stack'),
  ('zig',        'Zig',        'stack'),
  -- topics
  ('audio',      'Audio',      'topic'),
  ('webaudio',   'Web Audio',  'topic'),
  ('cli',        'CLI',        'topic'),
  ('hardware',   'Hardware',   'topic'),
  ('iot',        'IoT',        'topic'),
  ('games',      'Games',      'topic'),
  ('ai',         'AI',         'topic'),
  ('tools',      'Tools',      'topic'),
  ('generative', 'Generative', 'topic'),
  ('humor',      'Humor',      'topic'),
  ('tiny',       'Tiny',       'topic'),
  ('toy',        'Toys',       'topic'),
  ('git',        'Git',        'topic'),
  ('plants',     'Plants',     'topic');

-- ----------------------------------------------------------------------------
-- Profiles (all unclaimed)
-- ----------------------------------------------------------------------------

insert into public.profiles
  (id, user_id, username, display_name, bio, links, github_id, github_username, claimed_at)
values
  ('a1000000-0000-4000-8000-000000000001', null, 'mollybuilds', 'molly',
   'molly · builds small loud things · portland',
   '[{"label": "website", "url": "https://mollybuilds.dev"}]',
   8412963, 'mollybuilds', null),

  ('a1000000-0000-4000-8000-000000000002', null, 'gremlinworks', 'gremlin',
   'i write cron jobs with attitude problems',
   '[]',
   15733204, 'gremlinworks', null),

  ('a1000000-0000-4000-8000-000000000003', null, 'rosiehux', 'Rosie Huxley',
   'hardware tinkerer. my house has more sensors than furniture.',
   '[{"label": "blog", "url": "https://rosiehux.net"}]',
   4821907, 'rosiehux', null),

  ('a1000000-0000-4000-8000-000000000004', null, 'kevbot', 'kev',
   'i ship things before naming them',
   '[]',
   30125577, 'kevbot', null),

  ('a1000000-0000-4000-8000-000000000005', null, 'spudnik', 'spud',
   'kernel of a person. rust, potatoes, and terminal dashboards.',
   '[{"label": "mastodon", "url": "https://hachyderm.io/@spudnik"}]',
   61042318, 'spudnik', null);

-- ----------------------------------------------------------------------------
-- Projects
-- ----------------------------------------------------------------------------
-- Seed rows are inserted directly as 'published' (no draft→published UPDATE),
-- so published_at and trending_score are set explicitly here. readme_html is
-- simple, known-safe sample HTML — fine for seeds; production writes go
-- through the service-role sanitizer.

insert into public.projects
  (id, profile_id, slug, github_repo_id, repo_full_name, repo_url, name,
   tagline, description_md, readme_html, primary_language, topics, tags,
   demo_url, stars_count, forks_count, license, screenshots, sort_order,
   status, trending_score, published_at, last_synced_at, repo_etag)
values

-- 1 · tinysynth — @mollybuilds -----------------------------------------------
  ('b2000000-0000-4000-8000-000000000001',
   'a1000000-0000-4000-8000-000000000001',
   'tinysynth', 900712834501, 'mollybuilds/tinysynth',
   'https://github.com/mollybuilds/tinysynth', 'tinysynth',
   'a 2KB web synth you can play with your keyboard',
   'no dependencies, no build step, no reason. press keys, get bleeps.',
   '<h1>tinysynth</h1><p>a 2KB web synth you can play with your keyboard. no dependencies, no build step, no reason.</p><pre><code>&lt;script src="tinysynth.min.js"&gt;&lt;/script&gt;</code></pre>',
   'TypeScript',
   '{synth,webaudio,music}',
   '{audio,webaudio,tiny,toy}',
   'https://tinysynth.mollybuilds.dev',
   214, 12, 'MIT',
   '[
      {"path": "a1000000-0000-4000-8000-000000000001/tinysynth/01-keyboard.webp",     "alt": "tinysynth — keyboard view",     "width": 1280, "height": 800},
      {"path": "a1000000-0000-4000-8000-000000000001/tinysynth/02-oscilloscope.webp", "alt": "tinysynth — oscilloscope view", "width": 1280, "height": 800},
      {"path": "a1000000-0000-4000-8000-000000000001/tinysynth/03-mobile.webp",       "alt": "tinysynth on a phone",          "width": 750,  "height": 1334}
    ]',
   0, 'published',
   public.compute_trending(0, 0, now() - interval '21 days'),
   now() - interval '21 days', now() - interval '3 hours', 'W/"7f3a9c1e"'),

-- 2 · gitgoblin — @gremlinworks (no screenshots) ------------------------------
  ('b2000000-0000-4000-8000-000000000002',
   'a1000000-0000-4000-8000-000000000002',
   'gitgoblin', 900498112307, 'gremlinworks/gitgoblin',
   'https://github.com/gremlinworks/gitgoblin', 'gitgoblin',
   'a cron job that writes passive-aggressive commit messages when you forget to push',
   'install it, forget about it, and let the goblin shame you at 6pm daily.',
   '<h1>gitgoblin</h1><p>a cron job that writes passive-aggressive commit messages when you forget to push.</p>',
   'Go',
   '{git,cli,automation}',
   '{cli,git,humor}',
   null,
   67, 5, 'MIT',
   '[]',
   0, 'published',
   public.compute_trending(0, 0, now() - interval '45 days'),
   now() - interval '45 days', now() - interval '1 day', 'W/"b81d22e0"'),

-- 3 · plantdad — @rosiehux (tag-heavy hardware) -------------------------------
  ('b2000000-0000-4000-8000-000000000003',
   'a1000000-0000-4000-8000-000000000003',
   'plantdad', 900355602188, 'rosiehux/plantdad',
   'https://github.com/rosiehux/plantdad', 'plantdad',
   'an e-ink dashboard that guilt-trips me into watering my monstera',
   'a raspberry pi, a soil sensor, and an e-ink panel that displays my monstera''s disappointment in real time.',
   '<h1>plantdad</h1><p>an e-ink dashboard that guilt-trips me into watering my monstera.</p><ul><li>raspberry pi zero 2 w</li><li>capacitive soil sensor</li><li>7.5&quot; e-ink panel</li></ul>',
   'Python',
   '{raspberry-pi,e-ink,iot}',
   '{hardware,raspberry-pi,e-ink,plants,iot,sensors,dashboard}',
   null,
   1200, 84, 'Apache-2.0',
   '[
      {"path": "a1000000-0000-4000-8000-000000000003/plantdad/01-dashboard.webp", "alt": "plantdad e-ink dashboard",   "width": 1200, "height": 900},
      {"path": "a1000000-0000-4000-8000-000000000003/plantdad/02-wiring.webp",    "alt": "plantdad wiring on the pi", "width": 1200, "height": 900}
    ]',
   0, 'published',
   public.compute_trending(0, 0, now() - interval '120 days'),
   now() - interval '120 days', now() - interval '6 hours', 'W/"09c4f7aa"'),

-- 4 · untitled-maze-thing — @kevbot (zero social proof, just shipped) ---------
  ('b2000000-0000-4000-8000-000000000004',
   'a1000000-0000-4000-8000-000000000004',
   'untitled-maze-thing', 900901477263, 'kevbot/untitled-maze-thing',
   'https://github.com/kevbot/untitled-maze-thing', 'untitled-maze-thing',
   'i made a maze generator. it makes mazes.',
   null,
   '<h1>untitled-maze-thing</h1><p>i made a maze generator. it makes mazes.</p><pre><code>npx untitled-maze-thing 40x40</code></pre><p>that''s it. that''s the readme.</p>',
   'JavaScript',
   '{maze,generative}',
   '{generative}',
   null,
   0, 0, null,
   '[]',
   0, 'published',
   public.compute_trending(0, 0, now() - interval '2 hours'),
   now() - interval '2 hours', now() - interval '2 hours', null),

-- 5 · loudbutton — @mollybuilds -----------------------------------------------
  ('b2000000-0000-4000-8000-000000000005',
   'a1000000-0000-4000-8000-000000000001',
   'loudbutton', 900645220981, 'mollybuilds/loudbutton',
   'https://github.com/mollybuilds/loudbutton', 'loudbutton',
   'a giant USB button that plays an airhorn in your CI channel when the build goes green',
   'firmware + a tiny webhook relay. the button is load-bearing for team morale.',
   '<h1>loudbutton</h1><p>a giant USB button that plays an airhorn in your CI channel when the build goes green.</p>',
   'TypeScript',
   '{hardware,ci,webhooks}',
   '{hardware,tiny,humor}',
   null,
   45, 3, 'MIT',
   '[
      {"path": "a1000000-0000-4000-8000-000000000001/loudbutton/01-button.webp", "alt": "the loudbutton on a desk", "width": 1200, "height": 800}
    ]',
   1, 'published',
   public.compute_trending(0, 0, now() - interval '8 days'),
   now() - interval '8 days', now() - interval '12 hours', 'W/"d3e10b52"'),

-- 6 · tuberterm — @spudnik ----------------------------------------------------
  ('b2000000-0000-4000-8000-000000000006',
   'a1000000-0000-4000-8000-000000000005',
   'tuberterm', 900533019874, 'spudnik/tuberterm',
   'https://github.com/spudnik/tuberterm', 'tuberterm',
   'a terminal dashboard for tracking my potato harvest',
   'ratatui frontend, sqlite backend, unreasonable devotion to root vegetables.',
   '<h1>tuberterm</h1><p>a terminal dashboard for tracking my potato harvest.</p>',
   'Rust',
   '{tui,ratatui,agriculture}',
   '{rust,cli,tools,humor}',
   null,
   89, 6, 'MIT',
   '[]',
   0, 'published',
   public.compute_trending(0, 0, now() - interval '30 days'),
   now() - interval '30 days', now() - interval '2 days', 'W/"41ac88f9"'),

-- 7 · crateweight — @spudnik --------------------------------------------------
  ('b2000000-0000-4000-8000-000000000007',
   'a1000000-0000-4000-8000-000000000005',
   'crateweight', 900287465110, 'spudnik/crateweight',
   'https://github.com/spudnik/crateweight', 'crateweight',
   'tells you how much your cargo dependencies weigh, emotionally',
   'binary size analysis with editorial commentary. `crateweight check` refuses to run if you depend on more than one async runtime.',
   '<h1>crateweight</h1><p>tells you how much your cargo dependencies weigh, emotionally.</p><pre><code>cargo install crateweight</code></pre>',
   'Rust',
   '{cargo,binary-size,cli}',
   '{rust,cli,tools}',
   null,
   340, 19, 'MIT',
   '[]',
   1, 'published',
   public.compute_trending(0, 0, now() - interval '75 days'),
   now() - interval '75 days', now() - interval '18 hours', 'W/"66e0b2c7"'),

-- 8 · screamsaver — @kevbot ---------------------------------------------------
  ('b2000000-0000-4000-8000-000000000008',
   'a1000000-0000-4000-8000-000000000004',
   'screamsaver', 900774391052, 'kevbot/screamsaver',
   'https://github.com/kevbot/screamsaver', 'screamsaver',
   'a screensaver that screams',
   'it''s a screensaver. it screams. volume configurable, mercifully.',
   '<h1>screamsaver</h1><p>a screensaver that screams.</p>',
   'JavaScript',
   '{screensaver,canvas}',
   '{humor,generative}',
   null,
   12, 1, null,
   '[]',
   1, 'published',
   public.compute_trending(0, 0, now() - interval '14 days'),
   now() - interval '14 days', now() - interval '4 days', null),

-- 9 · prcrastinator — @gremlinworks (the one draft) ---------------------------
  ('b2000000-0000-4000-8000-000000000009',
   'a1000000-0000-4000-8000-000000000002',
   'prcrastinator', 900812336479, 'gremlinworks/prcrastinator',
   'https://github.com/gremlinworks/prcrastinator', 'prcrastinator',
   'a bot that opens the PR you keep talking about',
   'still deciding whether this is a joke.',
   null,
   'Go',
   '{git,bots}',
   '{cli,git}',
   null,
   3, 0, null,
   '[]',
   1, 'draft',
   0, null, null, null);

-- ----------------------------------------------------------------------------
-- Project updates
-- ----------------------------------------------------------------------------

insert into public.project_updates (id, project_id, title, body_md, created_at) values
  ('e5000000-0000-4000-8000-000000000001',
   'b2000000-0000-4000-8000-000000000001',
   'v0.3 — tiny reverb',
   'added a reverb. it''s 300 bytes. i''m unreasonably proud of it. also fixed the bug where holding five keys summoned a demon frequency.',
   now() - interval '3 days'),

  ('e5000000-0000-4000-8000-000000000002',
   'b2000000-0000-4000-8000-000000000003',
   'winter dormancy mode',
   'plantdad now knows monsteras drink less in winter and has stopped accusing me of neglect between november and february.',
   now() - interval '12 days');

-- ----------------------------------------------------------------------------
-- Likes / saves / follows (fire the counter + trending triggers)
-- ----------------------------------------------------------------------------

insert into public.likes (profile_id, project_id, created_at) values
  -- tinysynth: 4 likes
  ('a1000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001', now() - interval '20 days'),
  ('a1000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000001', now() - interval '18 days'),
  ('a1000000-0000-4000-8000-000000000004', 'b2000000-0000-4000-8000-000000000001', now() - interval '9 days'),
  ('a1000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000001', now() - interval '2 days'),
  -- plantdad: 3 likes
  ('a1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000003', now() - interval '90 days'),
  ('a1000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000003', now() - interval '60 days'),
  ('a1000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000003', now() - interval '30 days'),
  -- singles
  ('a1000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000002', now() - interval '40 days'),
  ('a1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000006', now() - interval '25 days');

insert into public.saves (profile_id, project_id, created_at) values
  ('a1000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000001', now() - interval '17 days'),
  ('a1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000003', now() - interval '85 days'),
  ('a1000000-0000-4000-8000-000000000004', 'b2000000-0000-4000-8000-000000000007', now() - interval '10 days');

insert into public.follows (follower_id, followee_id, created_at) values
  ('a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', now() - interval '19 days'),
  ('a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', now() - interval '15 days'),
  ('a1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000001', now() - interval '8 days'),
  ('a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000002', now() - interval '5 days'),
  ('a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003', now() - interval '80 days');

-- ----------------------------------------------------------------------------
-- Featured slots (one live now, one scheduled next)
-- ----------------------------------------------------------------------------

insert into public.featured_slots (id, project_id, sponsor_label, starts_at, ends_at) values
  ('d4000000-0000-4000-8000-000000000001',
   'b2000000-0000-4000-8000-000000000001',   -- tinysynth, live now
   null,
   now() - interval '2 days', now() + interval '12 days'),

  ('d4000000-0000-4000-8000-000000000002',
   'b2000000-0000-4000-8000-000000000003',   -- plantdad, queued next
   'sponsored by tiny computers inc.',
   now() + interval '12 days', now() + interval '26 days');

-- ----------------------------------------------------------------------------
-- Claim invites (demo token for the claim flow)
-- ----------------------------------------------------------------------------

insert into public.claim_invites (token, profile_id) values
  ('c3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001');
