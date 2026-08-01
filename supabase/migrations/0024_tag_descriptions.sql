-- 0024: editorial descriptions for the curated tag taxonomy (W4)
--
-- `tags.description` was provisioned in 0023 and never populated, so every
-- `/t/[tag]` page — the largest indexable surface dorkhub has — carried a
-- generated meta description and no on-page context at all.
--
-- Scope is the 22 CURATED tags only. The other ~24,650 in-use tags stay
-- description-less on purpose: absence, not filler (docs/design-system.md), and
-- auto-generated blurbs on thin tag pages is exactly the doorway-page pattern
-- the sitemap's ≥3-project threshold already guards against.
--
-- Voice: lowercase-calm, generosity verbs, no growth-speak. These read on a
-- public page under an `#h1`, so they say what you'll FIND, not what the tag is.

update public.tags set description = case slug
  -- stacks ------------------------------------------------------------------
  when 'go'         then 'small binaries, fast servers, and tools that ship as one file'
  when 'javascript' then 'the language everything else ends up talking to — libraries, hacks, and the odd masterpiece'
  when 'python'     then 'scripts that became projects: scrapers, notebooks, models, glue'
  when 'react'      then 'components, hooks and the endless pursuit of the right abstraction'
  when 'rust'       then 'systems work with the sharp edges filed off — cli tools, engines, rewrites of everything'
  when 'svelte'     then 'less framework, more markup — interfaces that compile away'
  when 'typescript' then 'javascript with the guardrails on, and the tooling to match'
  when 'zig'        then 'manual memory, no hidden control flow, and people enjoying themselves anyway'
  -- topics ------------------------------------------------------------------
  when 'ai'         then 'models wired into real things: agents, pipelines, and local inference'
  when 'audio'      then 'synths, trackers, dsp experiments, and things that make noise on purpose'
  when 'cli'        then 'tools that live in the terminal and do one thing properly'
  when 'games'      then 'engines, jam entries, and games built for the joy of building them'
  when 'generative' then 'code as a drawing instrument — plotters, shaders, and happy accidents'
  when 'git'        then 'wrappers, hooks and visualisations for the thing we all use and none of us understand'
  when 'hardware'   then 'firmware, pcbs, keyboards, and software that talks to physical objects'
  when 'humor'      then 'projects built entirely for the bit, and finished anyway'
  when 'iot'        then 'sensors, home automation, and small computers left running for years'
  when 'plants'     then 'moisture sensors, grow lights, and the long tail of keeping things alive'
  when 'tiny'       then 'projects that fit in one file, one screen, or a few kilobytes'
  when 'tools'      then 'the things people built because the existing thing annoyed them'
  when 'toy'        then 'built to learn something, kept because it was fun'
  when 'webaudio'   then 'sound in the browser — sequencers, visualisers, and instruments with a url'
  else description
end
where slug in (
  'go','javascript','python','react','rust','svelte','typescript','zig',
  'ai','audio','cli','games','generative','git','hardware','humor','iot',
  'plants','tiny','tools','toy','webaudio'
);
