/* ================= the front page, by hand =================
   Will's call (2026-10-15): while the front page is updated by hand, every card is its own piece.
   The thirty-two topics planned as pages written ahead of time (and Bioluminescence) are here with a
   hook each; a dozen lead in as cards, each drawn its own way; the rest turn up as suggestions; and
   the threads between them make the map. Every claim carries its source, checked before it went in.
   No model writes any of it. `scripts/build.mjs` turns this into public/front.json, which only the
   front page fetches, so reading pages never carry the artwork. Until a topic's page is written, it
   opens a placeholder made from its hook and threads (lib/placeholder.js). */
import { luminet } from './plates/blackhole.js';
import { PLAN } from './plates/pompeii.js';
import { BAR, FOLD, TRAP, foldView, hull, trapView } from '../src/shared/plates.js';
import { EN_WIRE, reflected } from '../src/shared/enigma.js';

/** @typedef {{ t: string, k: string, h: string, src: string }} FrontTopic */
/** @type {FrontTopic[]} */
export const FRONT = [
  { t: 'Black holes', k: 'phenomenon', h: 'Squeeze Earth into an 18 mm marble and it would become one.', src: 'https://en.wikipedia.org/wiki/Schwarzschild_radius' },
  { t: 'Northern lights', k: 'phenomenon', h: 'The green and the red are the same oxygen, glowing at different heights.', src: 'https://science.nasa.gov/earth/earth-observatory/auroras-dancing-in-the-night' },
  { t: 'Venus flytraps', k: 'creature', h: 'It counts: two touches within 20 seconds shut it, five start digestion.', src: 'https://en.wikipedia.org/wiki/Venus_flytrap' },
  { t: 'Quicksand', k: 'phenomenon', h: 'You can’t sink past your waist, but pulling a foot out takes the force to lift a car.', src: 'https://en.wikipedia.org/wiki/Quicksand' },
  { t: 'Stonehenge', k: 'place', h: 'Its Altar Stone came from the north of Scotland, about 750 km away.', src: 'https://www.ucl.ac.uk/news/2024/aug/stonehenge-altar-stone-came-scotland-not-wales' },
  { t: 'Supernovas', k: 'phenomenon', h: 'In 1054 one shone in daylight for 23 days. Its wreck is the Crab Nebula.', src: 'https://en.wikipedia.org/wiki/SN_1054' },
  { t: 'Diamonds', k: 'thing', h: 'Most natural diamonds are between 1 and 3.5 billion years old.', src: 'https://en.wikipedia.org/wiki/Diamond' },
  { t: 'Volcanoes', k: 'phenomenon', h: 'Three-quarters of Earth’s magma comes out unseen, along ridges on the ocean floor.', src: 'https://en.wikipedia.org/wiki/Submarine_volcano' },
  { t: 'Coral reefs', k: 'place', h: 'Under 1% of the sea floor, home to an estimated quarter of all marine species.', src: 'https://floridakeys.noaa.gov/corals/biodiversity.html' },
  { t: 'Dreams', k: 'phenomenon', h: 'The longest dream of the night comes just before you wake.', src: 'https://en.wikipedia.org/wiki/Rapid_eye_movement_sleep' },
  { t: 'Fingerprints', k: 'thing', h: 'Their ridges may be for touch more than grip: they amplify what a fingertip feels.', src: 'https://en.wikipedia.org/wiki/Fingerprint' },
  { t: 'Terracotta Army', k: 'work', h: 'Some 8,000 soldiers, found in 1974 by farmers digging a well.', src: 'https://en.wikipedia.org/wiki/Terracotta_Army' },
  { t: 'Atlantis', k: 'mystery', h: 'Every telling of it goes back to two dialogues Plato wrote around 360 BC.', src: 'https://en.wikipedia.org/wiki/Atlantis' },
  { t: 'Magnets', k: 'thing', h: 'Cut a magnet in half and you get two magnets, never a lone pole.', src: 'https://en.wikipedia.org/wiki/Magnetic_monopole' },
  { t: 'Infinity', k: 'concept', h: 'Some infinities are bigger than others.', src: 'https://en.wikipedia.org/wiki/Cantor%27s_diagonal_argument' },
  { t: 'Time travel', k: 'idea', h: 'Travel into the future is real: a year in orbit leaves you a few milliseconds younger.', src: 'https://en.wikipedia.org/wiki/Time_travel' },
  { t: 'Ice ages', k: 'era', h: 'We are living in one: there is still ice at both poles.', src: 'https://en.wikipedia.org/wiki/Ice_age' },
  { t: 'Fireworks', k: 'thing', h: 'Every colour is a metal, and blue is the hardest to make.', src: 'https://www.aps.org/apsnews/2026/06/the-showy-science-of-fireworks' },
  { t: 'Rubik’s Cube', k: 'thing', h: '43 quintillion positions, and every one can be solved in 20 moves.', src: 'https://www.cube20.org/' },
  { t: 'Pompeii', k: 'place', h: 'Two-thirds of the town has been dug out of the ash. The rest is still buried.', src: 'https://en.wikipedia.org/wiki/Pompeii' },
  { t: 'Mona Lisa', k: 'work', h: 'Its fame took off when it was stolen from the Louvre in 1911.', src: 'https://en.wikipedia.org/wiki/Mona_Lisa' },
  { t: 'Lightning', k: 'phenomenon', h: 'A bolt heats the air to 30,000 °C, five times hotter than the Sun’s surface.', src: 'https://www.weather.gov/safety/lightning-science-thunder' },
  { t: 'Octopuses', k: 'creature', h: 'Two-thirds of an octopus’s neurons are in its arms.', src: 'https://www.sciencealert.com/here-s-how-octopus-arms-make-decisions-without-input-from-the-brain' },
  { t: 'Hieroglyphs', k: 'concept', h: 'For some 1,400 years nobody could read them, until Champollion in 1822.', src: 'https://en.wikipedia.org/wiki/Egyptian_hieroglyphs' },
  { t: 'Giant squid', k: 'creature', h: 'Its eyes reach 27 cm across, as big as any animal’s.', src: 'https://en.wikipedia.org/wiki/Giant_squid' },
  { t: 'DNA', k: 'thing', h: 'Unwound, the DNA in one of your cells would stretch about 2 metres.', src: 'https://en.wikipedia.org/wiki/DNA' },
  { t: 'Antarctica', k: 'place', h: 'If all its ice melted, the seas would rise about 58 metres.', src: 'https://en.wikipedia.org/wiki/Antarctic_ice_sheet' },
  { t: 'Origami', k: 'technique', h: 'A big enough sheet can be folded into any flat-sided shape, without a single cut.', src: 'https://en.wikipedia.org/wiki/Mathematics_of_paper_folding' },
  { t: 'Boomerangs', k: 'thing', h: 'Most boomerangs were never meant to come back.', src: 'https://en.wikipedia.org/wiki/Boomerang' },
  { t: 'Enigma machine', k: 'thing', h: 'It never turned a letter into itself, and that flaw helped break it.', src: 'https://en.wikipedia.org/wiki/Cryptanalysis_of_the_Enigma' },
  { t: 'Apollo 11', k: 'event', h: 'Armstrong steered past a boulder field and landed with under a minute of fuel to spare.', src: 'https://en.wikipedia.org/wiki/Apollo_11' },
  { t: 'Holograms', k: 'thing', h: 'Cut one in half and each piece still shows the whole scene.', src: 'https://en.wikipedia.org/wiki/Holography' },
  { t: 'Bioluminescence', k: 'phenomenon', h: 'Most animals in the deep ocean make their own light.', src: 'https://en.wikipedia.org/wiki/Bioluminescence' },
];

/** The threads between them: why two topics belong together, short enough to write along a line.
    @typedef {{ a: string, b: string, l: string, src: string }} Thread */
/** @type {Thread[]} */
export const THREADS = [
  { a: 'Black holes', b: 'Supernovas', l: 'a heavy star’s collapse', src: 'https://en.wikipedia.org/wiki/Stellar_black_hole' },
  { a: 'Black holes', b: 'Time travel', l: 'time slows near them', src: 'https://en.wikipedia.org/wiki/Gravitational_time_dilation' },
  { a: 'Black holes', b: 'Holograms', l: 'the holographic principle', src: 'https://en.wikipedia.org/wiki/Holographic_principle' },
  { a: 'Black holes', b: 'Infinity', l: 'a singularity', src: 'https://en.wikipedia.org/wiki/Gravitational_singularity' },
  { a: 'Northern lights', b: 'Magnets', l: 'Earth’s magnetic field', src: 'https://en.wikipedia.org/wiki/Aurora' },
  { a: 'Northern lights', b: 'Antarctica', l: 'the southern lights', src: 'https://en.wikipedia.org/wiki/Aurora' },
  { a: 'Northern lights', b: 'Fireworks', l: 'light from excited atoms', src: 'https://en.wikipedia.org/wiki/Emission_spectrum' },
  { a: 'Lightning', b: 'Volcanoes', l: 'volcanic lightning', src: 'https://en.wikipedia.org/wiki/Volcanic_lightning' },
  { a: 'Lightning', b: 'Venus flytraps', l: 'electrical signals', src: 'https://en.wikipedia.org/wiki/Venus_flytrap' },
  { a: 'Lightning', b: 'Quicksand', l: 'it fuses sand into glass', src: 'https://en.wikipedia.org/wiki/Fulgurite' },
  { a: 'Volcanoes', b: 'Pompeii', l: 'Vesuvius, AD 79', src: 'https://en.wikipedia.org/wiki/Eruption_of_Mount_Vesuvius_in_79_AD' },
  { a: 'Volcanoes', b: 'Atlantis', l: 'Thera’s eruption, maybe', src: 'https://en.wikipedia.org/wiki/Minoan_eruption' },
  { a: 'Volcanoes', b: 'Diamonds', l: 'eruptions carry them up', src: 'https://en.wikipedia.org/wiki/Kimberlite' },
  { a: 'Ice ages', b: 'Antarctica', l: 'ice cores 800,000 years deep', src: 'https://en.wikipedia.org/wiki/European_Project_for_Ice_Coring_in_Antarctica' },
  { a: 'Ice ages', b: 'Coral reefs', l: 'seas 120 m lower', src: 'https://en.wikipedia.org/wiki/Last_Glacial_Maximum' },
  { a: 'Octopuses', b: 'Giant squid', l: 'both cephalopods', src: 'https://en.wikipedia.org/wiki/Cephalopod' },
  { a: 'Octopuses', b: 'Dreams', l: 'two kinds of sleep, like ours', src: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10322707/' },
  { a: 'Octopuses', b: 'Coral reefs', l: 'they hunt with reef fish', src: 'https://www.nature.com/articles/s41559-024-02525-y' },
  { a: 'DNA', b: 'Fingerprints', l: 'twins share one, not the other', src: 'https://en.wikipedia.org/wiki/Fingerprint' },
  { a: 'DNA', b: 'Origami', l: 'DNA origami', src: 'https://en.wikipedia.org/wiki/DNA_origami' },
  { a: 'DNA', b: 'Stonehenge', l: 'ancient DNA of its builders', src: 'https://www.nature.com/articles/s41559-019-0871-9' },
  { a: 'Enigma machine', b: 'Hieroglyphs', l: 'cracked with known words', src: 'https://en.wikipedia.org/wiki/Known-plaintext_attack' },
  { a: 'Enigma machine', b: 'Rubik’s Cube', l: 'permutations', src: 'https://en.wikipedia.org/wiki/Rubik%27s_Cube_group' },
  { a: 'Rubik’s Cube', b: 'Infinity', l: 'huge, but finite', src: 'https://www.cube20.org/' },
  { a: 'Terracotta Army', b: 'Pompeii', l: 'found digging for water', src: 'https://en.wikipedia.org/wiki/Terracotta_Army' },
  { a: 'Terracotta Army', b: 'Mona Lisa', l: 'once far more colourful', src: 'https://en.wikipedia.org/wiki/Mona_Lisa' },
  { a: 'Atlantis', b: 'Hieroglyphs', l: 'Plato credited Egyptian priests', src: 'https://en.wikipedia.org/wiki/Atlantis' },
  { a: 'Apollo 11', b: 'Antarctica', l: 'Moon rocks in the ice', src: 'https://en.wikipedia.org/wiki/Allan_Hills_A81005' },
  { a: 'Boomerangs', b: 'Hieroglyphs', l: 'Tutankhamun’s boomerangs', src: 'https://australian.museum/learn/news/blog/aboriginal-boomerangs-tutankhamun/' },
  { a: 'Fireworks', b: 'Supernovas', l: 'metals forged in stars', src: 'https://en.wikipedia.org/wiki/Nucleosynthesis' },
  { a: 'Magnets', b: 'Venus flytraps', l: 'the trap’s own magnetic field', src: 'https://www.sci.news/biology/venus-flytraps-measurable-magnetic-fields-09313.html' },
  { a: 'Bioluminescence', b: 'Fireworks', l: 'cold light and hot light', src: 'https://en.wikipedia.org/wiki/Bioluminescence' },
];

/** The pages written before the front page was made by hand. They stay, free, for Surprise me and the
    pages a paused page offers. @type {{ t: string, k: string, h: string }[]} */
export const EARLIER = [
  { t: 'The Carrington Event', k: 'event', h: 'The 1859 solar storm that set telegraph offices sparking.' },
  { t: 'Tardigrades', k: 'creature', h: 'Animals that survive freezing, boiling and the vacuum of space.' },
  { t: 'Whale falls', k: 'phenomenon', h: 'One dead whale can feed a deep-sea ecosystem for decades.' },
  { t: 'The Antikythera mechanism', k: 'thing', h: 'A 2,000-year-old Greek computer, found in a shipwreck.' },
  { t: 'The Voynich manuscript', k: 'mystery', h: 'A 600-year-old book that nobody can read.' },
  { t: 'Umami', k: 'concept', h: 'The fifth taste, first identified in a bowl of seaweed broth.' },
  { t: 'Why is ice slippery?', k: 'mystery', h: 'Physicists have argued about it since Michael Faraday.' },
  { t: 'The Great Emu War', k: 'event', h: 'In 1932 Australia sent machine guns after emus. The emus won.' },
  { t: 'Kessler syndrome', k: 'concept', h: 'How one collision could lock us out of orbit for generations.' },
  { t: 'Fresnel lenses', k: 'thing', h: 'How lighthouses folded a giant lens into rings of glass.' },
  { t: 'Tulip mania', k: 'event', h: 'The 1630s bubble where a single bulb reportedly cost a house.' },
];
/** Every page written ahead of time, the front page's first: each opens free and instant (one of the
    front page's that isn't written yet opens its placeholder, lib/placeholder.js). */
export const DOORS = [...FRONT.map(({ t, k, h }) => ({ t, k, h })), ...EARLIER];

/* ---------- drawing: SVG plates, coloured through the theme or by the subject itself (see src/front.css) ----------
   Each card is its drawing, edge to edge, composed for its own plate and computed from its subject where it can be.
   A card tells its story once, on its turn (the page plays one at a time): a path classed dr draws itself in, and
   parts classed fade or vpop come in after it (the card's own rules in front.css set when). The finished drawing is
   what shows without motion. A wide card also draws a phone version (vz-n). */
const esc = (/** @type {unknown} */ s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = (/** @type {number} */ n) => Math.round(n * 10) / 10;
/** @param {number} w @param {number} h @param {string} label @param {string} body */
const svg = (w, h, label, body, cls = '', fit = '') => `<svg class="vz${cls ? ` ${cls}` : ''}" viewBox="0 0 ${w} ${h}"${fit ? ` preserveAspectRatio="${fit}"` : ''} role="img" aria-label="${esc(label)}">${body}</svg>`;
/** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 */
const L = (x1, y1, x2, y2, c = 'h') => `<line class="${c}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`;
/** @param {number} x @param {number} y @param {string} s */
const T = (x, y, s, c = '', a = 'start') => `<text${c ? ` class="${c}"` : ''} x="${f(x)}" y="${f(y)}"${a === 'start' ? '' : ` text-anchor="${a}"`}>${esc(s)}</text>`;
/** @param {number} x @param {number} y @param {number} r */
const C = (x, y, r, c = 'h') => `<circle class="${c}" cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`;
const G = (/** @type {string} */ c, /** @type {string} */ body) => `<g class="${c}">${body}</g>`;
/** the same random-looking numbers every build, so a drawing never changes unless its code does */
const rng = (/** @type {number} */ seed) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

/* Black holes: the hole and its disk of gas as Luminet first drew one, in 1979, computed the same way (lib/plates/
   blackhole.js): every dot placed by tracing light back to the disk round the hole. Seen from 10° above the disk, its
   far side shows bent up over the top, the side coming toward you shines brighter, and a thin ring of light that went
   round the hole hugs the shadow. Night in either theme. On its turn the curves of equal radius trace in, the dots fill
   from the hole outward, and the curves fade to a whisper. Pointing names each part. */
/** dots as zero-length strokes, each a short move from the last (a drawing's biggest part, so kept terse)
    @param {number[][]} p */
const dotPath = p => { let d = '', x0 = 0, y0 = 0; for (const [x, y] of p) { const X = Math.round(x), Y = Math.round(y); d += d ? `m${X - x0}${Y - y0 < 0 ? '' : ' '}${Y - y0}h0` : `M${X} ${Y}h0`; x0 = X; y0 = Y; } return d; };
function blackHoles() {
  /* half-pixel units: the hero is 745 × 532 on a desktop, the hole at (cx, cy), 15 px to M */
  const W = 1490, H = 1064, cx = 745, cy = 640, px = 31;
  const { dots, iso, ring, stars } = luminet({ W, H, cx, cy, px });
  const line = (/** @type {number[][]} */ p) => p.map(([x, y], i) => `${i ? 'L' : 'M'}${Math.round(x)} ${Math.round(y)}`).join('');
  let b = `<defs><filter id="bh-glow" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="7"/></filter></defs>`;
  /* the stars behind, as the hole's lensing shows them */
  b += [[0, .5], [.5, .85], [.85, 2]].map(([lo, hi], i) => `<path class="bh-star bh-st${i}" d="${dotPath(stars.filter(s => s[2] >= lo && s[2] < hi))}"/>`).join('');
  /* Luminet's curves of equal radius on the disk, 6, 10, 16 and 26 M, the plan the dots follow */
  b += iso.map((p, i) => `<path class="bh-iso dr w${i}" pathLength="1" d="${line(p)}"/>`).join('');
  /* the dots, by how far out on the disk their light left (so they fill from the hole outward), each size by how
     bright the disk is there */
  const far = [8, 11, 16, 24, Infinity]; let g = '';
  far.forEach((R, i) => {
    const mine = dots.filter(q => q[2] < R && (i === 0 || q[2] >= far[i - 1]));
    g += `<g class="bh-g bh-g${i}">${[[0, .35], [.35, .75], [.75, 2]].map(([lo, hi], s) => `<path class="bh-d bh-s${s}" d="${dotPath(mine.filter(q => q[3] >= lo && q[3] < hi))}"/>`).join('')}</g>`;
  });
  g += ring.map(p => `<path class="bh-ring dr" pathLength="1" d="${line(p)}"/>`).join('');
  b += `<g id="bh-dots">${g}</g><use class="bh-glow" href="#bh-dots" filter="url(#bh-glow)"/>`;
  /* what pointing at each part reads: wedges from the hole out to the disk's 26 M curve, the most particular on top */
  const outer = iso[iso.length - 1];
  const wedge = (/** @type {number} */ a1, /** @type {number} */ a2) => `M${cx} ${cy}${outer.filter(([, , a]) => (a1 <= a2 ? a >= a1 && a <= a2 : a >= a1 || a <= a2)).sort((p, q) => ((p[2] - a1 + 360) % 360) - ((q[2] - a1 + 360) % 360)).map(([x, y]) => `L${Math.round(x)} ${Math.round(y)}`).join('')}Z`;
  b += `<path class="hit" data-read="The side coming toward you, so it shines brighter" d="${wedge(96, 264)}"/>`;
  b += `<path class="hit" data-read="The side going away from you, so it shines dimmer" d="${wedge(276, 84)}"/>`;
  b += `<path class="hit" data-read="The far side of the disk, its light bent up over the top" d="${wedge(62, 118)}"/>`;
  b += `<path class="hit" data-read="The near side of the disk, passing in front of the hole" d="${wedge(244, 296)}"/>`;
  /* the shadow, down to where the near side crosses in front of it */
  const sr = Math.round(5.2 * px), chord = Math.round(Math.sqrt(sr * sr - 40 * 40));
  b += `<path class="hit" data-read="The shadow: about 2.6 times as wide as the horizon itself" d="M${cx - chord} ${cy + 40}A${sr} ${sr} 0 1 1 ${cx + chord} ${cy + 40}Z"/>`;
  b += ring.map(p => `<path class="hit bh-hit-ring" data-read="Light from under the disk, bent round below the hole" d="${line(p)}"/>`).join('');
  return svg(W, H, 'A black hole with a disk of gas round it, seen from just above the disk and drawn in dots as Luminet first drew one in 1979: the far side of the disk bent up over the top, the near side passing in front, brighter on the left where the gas comes toward you, and a thin ring of light hugging the shadow', b, 'bh', 'xMidYMid slice');
}

/* Pompeii: the town itself, inside its walls, as an archaeologist's plan, drawn from OpenStreetMap's survey of its ruins
   (lib/plates/pompeii.js, written by scripts/plates/pompeii.mjs): every wall the survey maps in ink, the outline of
   what it maps as built, and the ground never dug left as ash, about a third of the town (Wikipedia: two-thirds of
   the city has been excavated). On its turn the whole town is ash, and its quarters come out of it in the order they
   were dug: the amphitheatre and the theatres in the 1700s, the north-west and the forum under the French and after,
   Fiorelli's regiones from 1863, the south-east under Maiuri, and since 2018 the rest of regio V; the ground never dug
   stays ash, and its name comes last. Ink and grey in either theme. Pointing names the forum, the amphitheatre and the
   buried third. */
function pompeii() {
  const { W, H, ring, walled, ash, buried, grain, tile, label, metres, forum, amph } = PLAN;
  /* the ash, a grain of dots on a jittered lattice, as a fill: the ground never dug keeps it */
  let b = `<defs><pattern id="pm-ash" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse"><path class="pm-grain" d="${grain}"/></pattern></defs>`;
  b += `<path fill="url(#pm-ash)" fill-rule="evenodd" data-read="Still buried: about a third of the town, never dug" d="${buried}"/>`;
  /* each quarter's ground is ash until its turn, and then its walls come out of it */
  const when = [2, 5, 8, 11, 14];
  b += ash.map((d, e) => (d ? `<path class="pm-a w${when[e]}" fill="url(#pm-ash)" fill-rule="evenodd" d="${d}"/>` : '')).join('');
  b += walled.map((d, e) => (d ? `<path class="pm-l fade w${when[e]}" d="${d}"/>` : '')).join('');
  b += `<path class="pm-ring" d="${ring}"/>`;
  b += T(label[0], label[1] + 6, 'STILL BURIED', 'pm-t fade w16', 'middle');
  /* 200 m on the ground, under the town */
  b += `<path class="pm-bar" d="M40 ${H - 37}h${metres}v5h-${metres}z"/>` + T(52 + metres, H - 30, '200 M', 'pm-s');
  /* what pointing reads, besides the buried ground itself, the most particular on top */
  b += `<path class="hit" data-read="The forum, the town’s main square" d="${forum}"/>`;
  b += `<path class="hit" data-read="The amphitheatre, built around 70 BC for some 20,000 people: the first part dug, in 1748" d="${amph}"/>`;
  return svg(W, H, 'Pompeii from above, inside its walls: every wall dug out of the ash drawn in ink, about two-thirds of the town, and the rest, never dug, left as ash', b, 'pm');
}

/* Rubik's Cube: the cube taken apart, as an exploded drawing: its 8 corners, 12 edges and 6 centres, each piece where it
   sits, in the stickers you see from above one corner (white on top, green and red at the sides). Its pieces fit back
   together 43,252,003,274,489,856,000 ways (8! × 3⁷ for the corners, 12!/2 × 2¹¹ for the edges), the count under it. On
   its turn the solid cube comes apart into its pieces, centres first, and the count rolls in. Pointing at a piece reads
   its share of the count. */
/** where the cube's pieces sit, apart or together, and how far apart they float (half-pixel steps are plenty) */
const CUBE = { cx: 182.5, cy: 160, s: 28.5, gap: .58 };
/** a point of the cube (x right-front, y up, z left-front) seen from above one corner, isometric
    @param {number[]} q @returns {[number, number]} */
const iso = ([x, y, z]) => [CUBE.cx + (x - z) * Math.cos(Math.PI / 6) * CUBE.s, CUBE.cy - y * CUBE.s + (x + z) * .5 * CUBE.s];
function rubik() {
  const pieces = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
    const n = Math.abs(i) + Math.abs(j) + Math.abs(k); if (!n) continue;
    pieces.push({ i, j, k, kind: n === 3 ? 'corner' : n === 2 ? 'edge' : 'centre' });
  }
  /* back to front: the nearer a piece to the corner you look from, the later it's drawn */
  pieces.sort((p, q) => (p.i + p.j + p.k) - (q.i + q.j + q.k) || (p.j - q.j));
  const r = (/** @type {number} */ v) => Math.round(v * 10) / 10, pt = (/** @type {number[]} */ q) => iso(q).map(r).join(' ');
  /** a face of a piece: its four corners, and its sticker shrunk inside it */
  const face = (/** @type {number[][]} */ q, /** @type {string} */ plastic, /** @type {string} */ sticker) => {
    const c = [0, 1, 2].map(a => q.reduce((t, p) => t + p[a], 0) / 4), inner = q.map(p => p.map((v, a) => c[a] + (v - c[a]) * .8));
    return `<path class="${plastic}" d="M${q.map(pt).join('L')}Z"/>` + (sticker ? `<path class="${sticker}" d="M${inner.map(pt).join('L')}Z"/>` : '');
  };
  let b = '', hits = '';
  pieces.forEach((p, n) => {
    const g = 1 + CUBE.gap, c = [p.i * g, p.j * g, p.k * g], h = .5, at = (/** @type {number[]} */ d) => [c[0] + d[0] * h, c[1] + d[1] * h, c[2] + d[2] * h];
    let body = '';
    body += face([at([-1, 1, -1]), at([1, 1, -1]), at([1, 1, 1]), at([-1, 1, 1])], 'rb-top', p.j === 1 ? 'rb-w' : '');
    body += face([at([1, 1, 1]), at([1, 1, -1]), at([1, -1, -1]), at([1, -1, 1])], 'rb-rt', p.i === 1 ? 'rb-r' : '');
    body += face([at([-1, 1, 1]), at([1, 1, 1]), at([1, -1, 1]), at([-1, -1, 1])], 'rb-lt', p.k === 1 ? 'rb-g' : '');
    /* together, a piece sits a gap's width nearer the middle: the build writes how far, so the page can join them */
    b += `<g class="rb-q rb-${p.kind} rb-q${n}">${body}</g>`;
    const read = p.kind === 'corner' ? 'A corner: 8 of them, 8! × 3⁷ = 88,179,840 ways to place them' : p.kind === 'edge' ? 'An edge: 12 of them, 12!/2 × 2¹¹ = 490,497,638,400 ways' : 'A centre: 6 of them, fixed, so each colour keeps its face';
    const shape = hull([[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]].map(d => iso(at(d))));
    hits += `<path class="hit" data-read="${read}" d="M${shape.map(q => q.map(r).join(' ')).join('L')}Z"/>`;
  });
  return svg(365, 350, 'A Rubik’s Cube taken apart: its 8 corners, 12 edges and 6 centres floating apart in their places, white on top, green and red at the sides', b + hits, 'rb', 'xMidYMid slice') + `<p class="rb-n" data-fx="odometer">43,252,003,<wbr>274,489,856,000</p><p class="rb-cap">ways its pieces fit together</p>`;
}
/** how far each of the cube's pieces moves to join the others, for the page's stylesheet */
function rubikCss() {
  const pieces = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) if (Math.abs(i) + Math.abs(j) + Math.abs(k)) pieces.push({ i, j, k });
  pieces.sort((p, q) => (p.i + p.j + p.k) - (q.i + q.j + q.k) || (p.j - q.j));
  return pieces.map((p, n) => { const [x0, y0] = iso([0, 0, 0]), [x1, y1] = iso([p.i * CUBE.gap, p.j * CUBE.gap, p.k * CUBE.gap]); return `.wc.armed:not(.seen) .rb-q${n}{transform:translate(${(x0 - x1).toFixed(1)}px,${(y0 - y1).toFixed(1)}px)}`; }).join('');
}

/* Venus flytraps: the trap, and under it the count it keeps. The trap is drawn from above and in front, open, as the
   plant holds it (src/shared/plates.js): two lobes hinged on a midrib, red inside with anthocyanin and dotted with digestive
   glands, a plain band along each rim, long cilia fringing the rims, and three trigger hairs standing on each lobe.
   Under it, its electrical record: every touch of a hair fires one signal, and the record has a place for five, the
   first two bracketed "within 20 s", the second marked where it shuts and the fifth where it digests. So the rule
   reads before anything is touched. Touched (src/app/13-landing.js), a hair flicks, its signal fires on the record,
   and the page closes the same trap: twice within 20 seconds it snaps shut in about a tenth of a second, its cilia
   crossing like bars; at five it seals to digest. On its turn the record traces in, its five places rise one by
   one, and a hair pings, inviting a touch. */
/** the record's five places, and its baseline */
const FT_X = [92, 148, 204, 260, 316], FT_Y = 302;
/** one signal, as a recording shows it: a sharp rise, a fall past the line, and back @param {number} x */
const ftSpike = x => `M${x - 7} ${FT_Y}C${x - 3} ${FT_Y} ${x - 2} ${FT_Y - 33} ${x} ${FT_Y - 33}S${x + 3} ${FT_Y + 6} ${x + 6} ${FT_Y + 5}S${x + 9} ${FT_Y} ${x + 13} ${FT_Y}`;
function flytrap() {
  const v = trapView(TRAP.open, TRAP);
  let b = `<defs>${v.lobes.map((l, i) => `<linearGradient id="ft-g${i}" gradientUnits="userSpaceOnUse" x1="${l.across[0]}" y1="${l.across[1]}" x2="${l.across[2]}" y2="${l.across[3]}"><stop class="ft-deep" offset="0"/><stop class="ft-red" offset=".6"/><stop class="ft-edge" offset="1"/></linearGradient>`).join('')}</defs>`;
  b += `<path class="ft-stalk" data-read="The leaf stalk, flat and winged; the trap is the end of the leaf" d="${v.stalk}"/><path class="ft-vein" d="${v.vein}"/>`;
  v.lobes.forEach((l, i) => {
    b += `<g class="ft-l${i}"><path class="ft-shell" d="${l.shell}"/><path class="ft-face" fill="url(#ft-g${i})" d="${l.face}"/><path class="ft-band" d="${l.band}"/><path class="ft-gl" d="${l.glands}"/>`;
    b += `<path class="ft-hsh" d="${l.hairs.map(h => h.d).join('')}"/>${l.hairs.map(h => `<path class="ft-h" d="${h.d}"/>`).join('')}<path class="ft-teeth" data-read="Cilia: as it shuts they cross like the bars of a cage" d="${l.teeth}"/></g>`;
  });
  b += `<path class="ft-hinge" d="${v.hinge}"/>`;
  /* the hairs answer the pointer, and one pings on its turn, inviting a touch */
  b += `<path class="ft-hit" data-read="A trigger hair: bend it and the trap fires a signal" d="${v.lobes.flatMap(l => l.hairs.map(h => `M${h.tip[0]} ${h.tip[1]}h0`)).join('')}"/>`;
  const t = v.lobes[1].hairs[1].tip; b += C(t[0], t[1], 10, 'ft-ping');
  /* the record: a baseline, a place for each of five signals, numbered, and what the trap does at two and at five */
  const [x1, x2] = FT_X, by = FT_Y - 39;
  let r = `<path class="ft-base dr" pathLength="1" d="M18 ${FT_Y}H347"/>`;
  FT_X.forEach((x, i) => { r += `<g class="ft-k fade w${3 + i * 2}"><path class="ft-gh" d="${ftSpike(x)}"/><path class="ft-on" pathLength="1" d="${ftSpike(x)}"/>${T(x, FT_Y + 19, String(i + 1), 'ft-n tn', 'middle')}</g>`; });
  r += `<g class="fade w5"><path class="ft-win" d="M${x1} ${by + 4}V${by}H${x2}V${by + 4}"/></g>${T((x1 + x2) / 2, by - 5, 'within 20 s', 'ft-note fade w5', 'middle')}`;
  r += T(18, FT_Y + 19, 'touches', 'ft-note fade w3') + `<text class="ft-at fade w6" data-at="2" x="${x2}" y="${FT_Y + 36}" text-anchor="middle">SHUTS</text><text class="ft-at fade w12" data-at="5" x="${FT_X[4]}" y="${FT_Y + 36}" text-anchor="middle">DIGESTS</text>`;
  const reads = ['One touch: nothing moves, but the trap remembers it for about 20 s', 'A second within 20 s: it shuts, in about a tenth of a second', 'Prey caught inside keep touching the hairs, and the trap counts on', 'Each signal tells the trap the prey is alive and struggling', 'Five: it seals itself shut, floods with enzymes and digests for about ten days'];
  r += `<rect class="hit" data-read="Each touch of a trigger hair fires one signal, and the trap counts them" x="0" y="${FT_Y + 4}" width="64" height="${346 - FT_Y}"/>`;
  FT_X.forEach((x, i) => { r += `<rect class="hit" data-read="${reads[i]}" x="${x - 28}" y="${by - 16}" width="56" height="${350 - by + 16}"/>`; });
  b += `<g class="ft-rec">${r}</g>`;
  return svg(TRAP.W, TRAP.H, 'A Venus flytrap, open: two lobes red inside with anthocyanin and dotted with glands, fringed with cilia, three trigger hairs on each. Under it a record with a place for each of five signals, one per touch of a hair: a second within 20 seconds of the first shuts it, and the fifth starts digestion', b, 'ft');
}

/* Giant squid: a close look at its head, the skin flecked with chromatophores, and its eye, 27 cm across, drawn to scale
   so it won't fit the card: a pupil like a dark well in a silvery iris. Yours, 2.4 cm, sits beside it to the same
   scale. Its skin and eye are in the squid's own colours, paler on paper and deeper at night. On its turn its eye
   grows from the size of yours until it runs off the card. */
function squid() {
  const W = 365, H = 350, k = 17, ex = 312, ey = 205, R = 13.5 * k, r = rng(5);
  let b = `<defs><radialGradient id="sq-iris" cx="${ex}" cy="${ey}" r="${f(R * .62)}" gradientUnits="userSpaceOnUse"><stop class="sq-i0" offset=".5"/><stop class="sq-i1" offset=".8"/><stop class="sq-i2" offset="1"/></radialGradient><radialGradient id="sq-skin" cx="${ex / W}" cy="${ey / H}" r=".9"><stop class="sq-k0" offset=".55"/><stop class="sq-k1" offset="1"/></radialGradient><clipPath id="sq-c"><circle cx="${ex}" cy="${ey}" r="${f(R * .62)}"/></clipPath></defs>`;
  b += `<rect width="${W}" height="${H}" fill="url(#sq-skin)"/>`;
  /* the skin: chromatophores, the squid's colour cells, in three sizes, thinning toward the card's title */
  /** @type {[number, number][][]} */ const cells = [[], [], []];
  for (let i = 0; i < 1500; i++) { const x = r() * W, y = r() * H, d = Math.hypot(x - ex, y - ey); if (d < R + 6 || (x < 190 && y < 74 && r() < .85) || r() > .35 + .65 * Math.max(0, 1 - (d - R) / 160)) continue; cells[r() < .55 ? 0 : r() < .8 ? 1 : 2].push([x, y]); }
  b += cells.map((c, i) => dotsPath(c, `sq-cell sq-c${i}`)).join('');
  /* its eye: the socket's rim, the iris with its fibres, the pupil and a glint */
  let eye = `<circle class="sq-rim" cx="${ex}" cy="${ey}" r="${f(R)}"/><circle class="sq-white" cx="${ex}" cy="${ey}" r="${f(R * .9)}"/><circle fill="url(#sq-iris)" cx="${ex}" cy="${ey}" r="${f(R * .62)}"/>`;
  let fib = ''; for (let a = 0; a < 360; a += 2.5) { const t = a * Math.PI / 180, r1 = R * (.35 + r() * .04), r2 = R * (.56 + r() * .05); fib += `M${f(ex + Math.cos(t) * r1)} ${f(ey + Math.sin(t) * r1)}L${f(ex + Math.cos(t) * r2)} ${f(ey + Math.sin(t) * r2)}`; }
  eye += `<path class="sq-fib" clip-path="url(#sq-c)" d="${fib}"/><circle class="sq-pupil" cx="${ex}" cy="${ey}" r="${f(R * .34)}"/><ellipse class="sq-glint" cx="${f(ex - R * .13)}" cy="${f(ey - R * .14)}" rx="${f(R * .042)}" ry="${f(R * .028)}" transform="rotate(-30 ${f(ex - R * .13)} ${f(ey - R * .14)})"/><circle class="sq-glint sq-g2" cx="${f(ex - R * .2)}" cy="${f(ey - R * .05)}" r="${f(R * .012)}"/>`;
  b += `<g class="sq-eye">${eye}</g>`;
  /* its width, read off where it starts */
  const lx = ex - R;
  b += G('fade w12', L(lx + 2, ey, lx + 34, ey, 'sq-dim') + T(lx - 8, ey - 6, 'Its eye', 'sq-lt', 'end') + T(lx - 8, ey + 10, '27 cm', 'sq-lb', 'end'));
  /* yours, to the same scale, in a chip of its own */
  const yx = 46, yy = H - 62, yr = 1.2 * k;
  b += G('fade w12', `<circle class="sq-chip" cx="${yx}" cy="${yy}" r="${f(yr + 9)}"/><ellipse class="sq-you" cx="${yx}" cy="${yy}" rx="${f(yr)}" ry="${f(yr * .62)}"/><circle class="sq-youi" cx="${yx}" cy="${yy}" r="${f(yr * .5)}"/><circle class="sq-pupil" cx="${yx}" cy="${yy}" r="${f(yr * .22)}"/><circle class="sq-glint" cx="${f(yx - yr * .14)}" cy="${f(yy - yr * .14)}" r="${f(yr * .08)}"/>` + T(yx + yr + 18, yy - 2, 'Yours', 'sq-lt') + T(yx + yr + 18, yy + 13, '2.4 cm', 'sq-lb'));
  b += `<circle class="hit" data-read="Its eye: 27 cm across, as big as any animal’s" cx="${ex}" cy="${ey}" r="${f(R)}"/><circle class="hit" data-read="Yours: 2.4 cm, to the same scale" cx="${yx}" cy="${yy}" r="${f(yr + 9)}"/>`;
  return svg(W, H, 'A giant squid’s eye, 27 cm across, in its chromatophore-flecked skin, too big to fit on the card, beside a human eye, 2.4 cm across, at the same scale', b, 'sq', 'xMidYMid slice');
}

/* Fireworks: a night show, and every colour in it is a metal, named beside its shell: strontium red, barium green,
   sodium yellow, aluminium white, and purple strontium and copper at once (Wikipedia's Pyrotechnic colorant). Copper's
   blue needs its star to burn in a narrow band of heat: too cool and it is dim, too hot and its chloride comes apart and
   the blue washes out (APS; Wikipedia). So blue is the hardest, and of all the show's shells only one is blue, small
   and faint, named like the rest: it shows, it isn't captioned (Will, 2026-11-14). One great strontium shell near at hand leads the eye; the rest
   stand off at their own heights and depths, the farthest only dots. Each shell is computed: its stars thrown evenly
   over a sphere (a Fibonacci lattice) turned at random and seen from the side, each slowed by the air and pulled down as
   it flies, its trail brightening toward a head that burns white at its core, in the glow of the smoke it lights. A
   chrysanthemum's trails run from the break, a peony's are short, aluminium's glitter, and the purple's heads are red
   and blue by turns. Nothing is stamped with a <use>: every part carries its own colour, so every browser draws it
   alike. A card wider than the drawing shows more of the show at its sides. On its turn the shells climb and break one
   after another, each opening as the air slows its stars, and the blue goes up last. Pointing at one names its metal. */
const FW = /** @type {Record<string, [string, string, string]>} */ ({
  /* its colour, the colour of its symbol, its reading */
  Sr: ['#FF3F55', '#FF9AA6', 'Strontium: red, from its chloride’s bands at 617–646 nm'],
  Ba: ['#45E08A', '#8DF0B6', 'Barium: green, from its chloride’s bands at 511–533 nm'],
  Na: ['#FFC43A', '#FFDB85', 'Sodium: yellow, from one bright line at 589 nm'],
  Al: ['#E6ECFF', '#F2F5FF', 'Aluminium: white, from specks of the metal burning white-hot'],
  Pu: ['#B06BFF', '#D3AAFF', 'Purple: strontium’s red and copper’s blue at once'],
  Cu: ['#4A78FF', '#9DB6FF', 'Copper: blue only in a narrow band of heat. Too cool, it’s dim; too hot, it washes out'],
});
/** a shell's trails and heads, in U units to its radius: n stars over a Fibonacci sphere turned at random, each thrown at
    the same speed, its reach growing as 1 − e^(−kt) as the air slows it, and pulled down `sag` radii by gravity by the
    time it burns out; seen from the side, those thrown at you or away hide in the break
    @param {'ch' | 'pe'} kind @param {number} n @param {number} seed @param {number} U */
function fwShell(kind, n, seed, U) {
  const r = rng(seed), ga = Math.PI * (3 - Math.sqrt(5)), k = 2.6, sag = kind === 'pe' ? .18 : .28, t0 = kind === 'pe' ? .86 : .04;
  const E = 1 - Math.exp(-k), reach = (/** @type {number} */ t) => (1 - Math.exp(-k * t)) / E, fall = (/** @type {number} */ t) => (t - (1 - Math.exp(-k * t)) / k) / (1 - E / k);
  const A = r() * 6.28, B = Math.acos(2 * r() - 1), C = r() * 6.28;
  /** @param {number[]} p */
  const turn = ([x, y, z]) => { let c = Math.cos(A), s = Math.sin(A); [x, y] = [c * x - s * y, s * x + c * y]; c = Math.cos(B); s = Math.sin(B); [y, z] = [c * y - s * z, s * y + c * z]; c = Math.cos(C); s = Math.sin(C); return [c * x - s * y, s * x + c * y, z]; };
  const o = Math.round, pair = (/** @type {number} */ a, /** @type {number} */ b) => `${o(a)}${o(b) < 0 ? '' : ' '}${o(b)}`;
  let d = '';
  /** @type {number[][]} */ const heads = [];
  /** @type {number[][]} */ const deep = [];
  /** @type {number[][]} */ const sparks = [];
  for (let i = 0; i < n; i++) {
    const z0 = 1 - 2 * (i + .5) / n, p = Math.sqrt(1 - z0 * z0), [x, y, z] = turn([p * Math.cos(i * ga), p * Math.sin(i * ga), z0]);
    if (kind === 'ch' && Math.abs(z) > .9) continue;
    const s = U * (1 + (r() - .5) * .1), at = (/** @type {number} */ t) => [x * s * reach(t), y * s * reach(t) + sag * U * fall(t)];
    const [x0, y0] = at(t0), [x1, y1] = at((t0 + 1) / 2), [x2, y2] = at(1);
    /* the trail: a curve through three moments of its flight */
    d += `M${pair(x0, y0)}q${pair(2 * x1 - (x0 + x2) / 2 - x0, 2 * y1 - (y0 + y2) / 2 - y0)} ${pair(x2 - x0, y2 - y0)}`;
    (Math.abs(z) < .55 ? heads : deep).push([x2, y2]);
    /* now and then a spark shed on the way, falling */
    if (r() < .25) { const [u, v] = at(.55 + r() * .4); sparks.push([u + (r() - .5) * U * .06, v + U * (.04 + r() * .1)]); }
  }
  return { d, heads, deep, sparks };
}
/** a night show: each shell [metal, x, y, radius (px), kind, stars, when it breaks (tenths of a second), how far off its
    climb starts (px, none if 0), how bright]; where each metal's name goes [x, y, anchor], by the first bright shell of it;
    and the one line beside the blue
    @param {number} W @param {number} H @param {'w' | 'n'} v @param {[string, number, number, number, 'ch' | 'pe' | 'gl', number, number, number, number?][]} shells @param {Record<string, [number, number, string?]>} labels */
function fireworksShow(W, H, v, shells, labels) {
  let defs = `<linearGradient id="fw-sky-${v}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H}"><stop offset="0" stop-color="#020309"/><stop offset=".75" stop-color="#070B1A"/><stop offset="1" stop-color="#11162D"/></linearGradient>`;
  /* trails brighten toward their heads; the break flashes; everything lit glows */
  defs += `<radialGradient id="fw-rg-${v}"><stop offset="0" stop-color="#222"/><stop offset=".35" stop-color="#555"/><stop offset=".8" stop-color="#fff"/></radialGradient><mask id="fw-mk-${v}" maskContentUnits="objectBoundingBox"><circle cx=".5" cy=".43" r=".6" fill="url(#fw-rg-${v})"/></mask>`;
  defs += `<radialGradient id="fw-fl-${v}"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
  defs += `<filter id="fw-bl-${v}" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="7" result="w"/><feGaussianBlur in="SourceGraphic" stdDeviation="2"/><feMerge><feMergeNode in="w"/><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  /* the smoke where each shell broke, lit in its colour */
  defs += `<filter id="fw-hz-${v}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${v === 'w' ? 12 : 14}"/></filter>`;
  let b = '', haze = ''; const named = new Set();
  shells.forEach(([m, x, y, R, kind, n, t, up, dim = 1], i) => {
    haze += `<ellipse class="fade w${t + 1}" cx="${f(x)}" cy="${f(y + R * .15)}" rx="${f(R * 1.1)}" ry="${f(R * .9)}" fill="${FW[m][0]}"${dim < 1 ? ` opacity="${dim}"` : ''}/>`;
    const [col, , read] = FW[m], U = Math.min(80, Math.max(20, Math.round(R * 1.2))), s = R / U, px = (/** @type {number} */ q) => f(q / s);
    const { d, heads, deep, sparks } = fwShell(kind === 'gl' ? 'ch' : kind, n, i * 7 + 3 + (v === 'n' ? 50 : 0), U), far = dim < .6;
    let g = up ? `<path class="fw-up w${t - 4}" pathLength="1" d="M${f(x + up)} ${H + 4}Q${f(x + up * .2)} ${f((H + y) / 2)} ${f(x)} ${f(y)}"/>` : '';
    g += `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * 1e3) / 1e3})"${dim < 1 ? ` opacity="${dim}"` : ''}><g class="fw-b w${t}" filter="url(#fw-bl-${v})">`;
    g += `<circle class="fw-fl" r="${Math.round(U * .5)}" fill="url(#fw-fl-${v})"/>`;
    /* a far shell is only its heads: its trails are too fine to see */
    if (!far) g += `<path stroke="${col}" stroke-width="${px(kind === 'gl' ? 1.3 : R > 60 ? 1.2 : 1.1)}"${kind === 'gl' ? ` stroke-dasharray="0 ${px(2.6)}"` : ''} mask="url(#fw-mk-${v})" d="${d}"/>`;
    const hw = px(kind === 'gl' ? 1.8 : R > 60 ? 2.8 : R < 20 ? 2 : 2.6);
    if (m === 'Pu') g += `<path stroke="${FW.Sr[0]}" stroke-width="${hw}" d="${dotPath(heads.filter((_, j) => j % 2))}"/><path stroke="${FW.Cu[0]}" stroke-width="${hw}" d="${dotPath([...heads.filter((_, j) => !(j % 2)), ...deep])}"/>`;
    else g += `<path stroke="${col}" stroke-width="${hw}" d="${dotPath([...heads, ...deep])}"/>`;
    /* the nearest heads burn white at their cores, and the big shells shed sparks */
    if (R >= 24) g += `<path stroke="#fff" stroke-opacity=".7" stroke-width="${f(hw * .4)}" d="${dotPath(heads)}"/>`;
    if (R >= 40) g += `<path stroke="${FW[m][1]}" stroke-opacity=".6" stroke-width="${px(1)}" d="${dotPath(sparks)}"/>`;
    g += `</g></g>${far ? '' : `<circle class="hit" data-read="${esc(read)}" cx="${f(x)}" cy="${f(y)}" r="${f(R + 4)}"/>`}`;
    /* each colour's metal, in its colour, once, after its shell breaks; and one quiet line by the blue */
    if (!far && !named.has(m)) {
      named.add(m); const [lx, ly, a = 'middle'] = labels[m], w = `fade w${Math.min(16, t + 3)}`;
      g += T(lx, ly, m === 'Pu' ? 'Sr\u2009+\u2009Cu' : m, `fw-s fw-${m} ${w}`, a);
    }
    b += `<g class="fw-m">${g}</g>`;
  });
  return svg(W, H, 'A night sky full of fireworks, each colour named by the metal that makes it: a great red burst of strontium, green barium, yellow sodium, white glittering aluminium, purple from strontium and copper together, and, small and faint, the only blue, copper, the hardest colour to make', `<defs>${defs}</defs><rect x="${-W}" y="${-H}" width="${3 * W}" height="${3 * H}" fill="url(#fw-sky-${v})"/><g class="fw-hz" filter="url(#fw-hz-${v})">${haze}</g><g fill="none" stroke-linecap="round">${b}</g>`, `vz-${v} fw`, 'xMidYMid meet');
}
/* the wide card, and outside its frame a little more sky for a card wider than its drawing; the phone's, a show of its own */
const fireworks = () => fireworksShow(745, 168, 'w', [
  ['Al', 448, 44, 52, 'gl', 56, 8, -8, .75],
  ['Ba', 334, 88, 42, 'ch', 58, 4, 6],
  ['Sr', 562, 86, 92, 'ch', 86, 6, 0],
  ['Na', 708, 112, 28, 'pe', 50, 11, 4],
  ['Pu', 116, 108, 30, 'ch', 50, 10, 5],
  ['Na', 412, 140, 15, 'pe', 30, 9, 0, .55],
  ['Sr', 222, 132, 12, 'pe', 26, 12, 0, .45],
  ['Ba', 676, 46, 10, 'pe', 22, 7, 0, .4],
  ['Ba', -84, 122, 36, 'ch', 48, 5, 0],
  ['Na', 842, 104, 40, 'pe', 52, 9, 0],
  ['Cu', 234, 34, 17, 'ch', 28, 14, 3, .8],
], { Sr: [660, 98, 'start'], Ba: [334, 150], Al: [394, 22, 'end'], Na: [708, 156], Pu: [116, 156], Cu: [256, 31, 'start'] })
  + fireworksShow(360, 240, 'n', [
    ['Sr', 252, 112, 74, 'ch', 80, 5, 0],
    ['Ba', 78, 167, 40, 'ch', 54, 3, 4],
    ['Na', 322, 204, 24, 'pe', 46, 9, 0],
    ['Pu', 174, 191, 24, 'ch', 44, 8, 0],
    ['Sr', 138, 144, 10, 'pe', 22, 10, 0, .45],
    ['Cu', 40, 100, 15, 'ch', 26, 12, 2, .8],
  ], { Sr: [180, 124, 'end'], Ba: [78, 230], Na: [292, 234, 'end'], Pu: [174, 234], Cu: [60, 97, 'start'] });

/* Infinity: Cantor's diagonal, on a list that never ends. Any list of numbers between 0 and 1, numbered 1, 2, 3 and on
   (here a half, √2 − 1, e − 2, a third, a seventh, π − 3 and other old friends), set as a table whose rows run on down
   and whose digits run on to the right. Change digit n of row n, each one up by one, and the number you build differs
   from every row, so it is on no list: there are more numbers than there are counting numbers. The new number stands
   under the table with each digit under its own column, at the foot of the band that falls to it from its place on the
   diagonal. On its turn the diagonal lights row by row, and each digit drops to its place below. Pointing at a row
   says how the new number differs from it. */
const CANTOR = ['5000000000', '4142135623', '7182818284', '3333333333', '1428571428', '1415926535', '6180339887', '7320508075'];
function cantor() {
  const W = 365, H = 350, x0 = 71, dx = 24.5, y0 = 96, dy = 22, ny = H - 53, rows = CANTOR.length;
  const X = (/** @type {number} */ c) => x0 + (c - 1) * dx, Y = (/** @type {number} */ n) => f(y0 + (n - 1) * dy), xs = Array.from({ length: 11 }, (_, c) => X(c + 1)).join(' ');
  let b = '';
  CANTOR.forEach((row, i) => {
    /* the rows run on down: the last few a little fainter, each still plain to read */
    const n = i + 1, y = Y(n), d = +row[i], up = (d + 1) % 10, x = X(n), dim = n > 5 ? ` opacity="${f(1 - (n - 5) * .12)}"` : '', read = `Row ${n} has ${d} in place ${n}; the new number has ${up} there`;
    /* the band a diagonal digit falls down, behind the rows below it, to its place in the new number */
    let g = `<rect class="in-band w${n + 1}" x="${x - 9}" y="${f(y + 5)}" width="18" height="${f(ny - y + .5)}" rx="4"/>`;
    g += `<text class="in-n" x="24" y="${y}">${n}</text><text class="in-0" x="${x0 - 13}" y="${y}"${dim} text-anchor="end">0.</text><text class="in-g" x="${xs}" y="${y}"${dim} text-anchor="middle">${row}…</text>`;
    g += `<g class="in-c w${n}"><rect class="in-cell" x="${x - 9}" y="${f(y - 15)}" width="18" height="20" rx="4"/><text class="in-on" x="${x}" y="${y}" text-anchor="middle">${d}</text></g>`;
    g += `<text class="in-nd fade w${n + 3}" x="${x}" y="${ny}" text-anchor="middle">${up}</text>`;
    g += `<rect class="hit" data-read="${read}" y="${f(y - 15.5)}" width="${W}" height="${dy}"/><rect class="hit" data-read="${read}" x="${f(x - dx / 2)}" y="${ny - 22}" width="${dx}" height="30"/>`;
    b += `<g class="in-row">${g}</g>`;
  });
  b += `<text class="in-more" x="24" y="${f(Y(rows) + 17)}">⋮</text>`;
  /* the new number, built down the diagonal, each digit one up */
  b += L(18, ny - 27, W - 18, ny - 27, 'in-rule');
  b += `<text class="in-new" x="${x0 - 13}" y="${ny}" text-anchor="end">0.</text><text class="in-new" x="${X(rows + 1)}" y="${ny}" text-anchor="middle">…</text>` + T(W - 18, ny, 'On no list', 'in-tag fade w13', 'end');
  b += T(18, H - 16, 'Digit n differs from row n’s, for every n', 'in-note fade w14');
  return svg(W, H, 'Cantor’s diagonal: a list of numbers between 0 and 1, numbered 1, 2, 3 and running on, its diagonal digits lit, and below it a new number built from them, each digit one more and set under its own column, which differs from every row and so is on no list', b, 'in', 'xMidYMid slice');
}

/* Origami: a sheet of paper in Miura's fold, the fold that opened the Space Flyer Unit's solar array in one pull. It is
   held by its left edge on a table, lit from the upper left, with the outline of the whole sheet it opens to drawn
   round it, and a ring on its free corner: the one corner to pull. Its faces are computed for the fold's one angle
   (src/shared/plates.js), so the page can move the same sheet: on its turn the folded packet pulls open, and the
   pointer, or a thumb dragged across the card, takes the corner along its way, the only motion it has. Each face lies
   one of four ways, and the build writes how dark each is at rest (plateCss); the page changes those, and the line each
   one's shading runs along, while it moves. A phone gets a shorter sheet and its own camera. */
/** @param {'w' | 'n'} v */
function origamiPlate(v) {
  const C = FOLD.cams[v], { faces, hand } = foldView(FOLD.rest, v);
  let b = `<defs><filter id="mi-blur-${v}" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="6"/></filter><filter id="mi-near-${v}" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.6"/></filter>`;
  /* how each of the four ways a face lies is shaded: darkest in its valley, lightest at its ridge */
  b += `${[0, 1, 2, 3].map(o => `<linearGradient id="mi-g${v}${o}" class="mi-g mi-g${o}"><stop offset="0"/><stop offset=".6"/><stop offset="1"/></linearGradient>`).join('')}</defs>`;
  /* the whole sheet's outline, flat on the table: how far it opens */
  b += `<path class="mi-ghost" d="${foldView(0, v).rim}"/>`;
  /* the sheet itself the page lays (it moves it anyway): its shadow, soft and near, a path for each face, its ridges */
  b += `<path class="mi-shadow" filter="url(#mi-blur-${v})"/><path class="mi-shadow mi-near" filter="url(#mi-near-${v})"/><g class="mi-sheet" data-faces="${faces.length}"></g><path class="mi-ridge"/>`;
  b += `<circle class="mi-hand" cx="${hand[0]}" cy="${hand[1]}" r="6"/>`;
  b += T(18, C.H - 16, 'MIURA FOLD', 'mi-l');
  return svg(C.W, C.H, 'A sheet of paper in Miura’s fold, a zigzag of parallelograms that opens and closes in a single motion: half open, inside the outline of the whole sheet', b, `vz-${v} mi`);
}
const origami = () => origamiPlate('w') + origamiPlate('n');

/* Atlantis: the ringed city drawn to Plato's own measurements (Critias, in Jowett's translation), as a model seen from
   the south and above: an island 5 stadia across, then rings of sea and land 1, 2, 2, 3 and 3 stadia wide, the
   outermost sea the harbour; the land standing above the sea, with a racecourse round the largest ring; the temple of
   Poseidon, a stadion by half; the bridges over the rings of sea, a sixth of a stadion wide, that made one road to the
   palace; and the canal, 300 feet wide, leading in from the sea 50 stadia away. Its three walls are in Plato's metals:
   brass round the outer land, tin round the inner, and round the citadel orichalcum, which "flashed with the red
   light"; each takes the light as a round wall does. Under the model the same city is cut through its middle, to the
   same scale, with Plato's width for each ring written under it, so the numbers are there without a pointer. On its
   turn the city rises from the island outward and the orichalcum catches the light. Pointing names each ring. */
/** dots, terse, in a path of their own class @param {[number, number][]} p @param {string} c */
const dotsPath = (p, c) => `<path class="${c}" d="${dotPath(p)}"/>`;
function atlantis() {
  const W = 365, H = 350, cx = 182.5, cy = 170, k = 12.6, el = 34 * Math.PI / 180, se = Math.sin(el), ce = Math.cos(el);
  const LAND = .55, WALL = .32, CIT = .9;   // heights in stadia: the rings of land, their walls, the citadel
  const yAt = (/** @type {number} */ z) => cy - z * ce * k;
  /** the ellipse a circle of radius r at height z makes */
  const ell = (/** @type {number} */ r, /** @type {number} */ z) => { const y = yAt(z), rx = r * k, ry = r * se * k; return `M${f(cx - rx)} ${f(y)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(y)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(y)}Z`; };
  /** the near half of a cylinder of radius r from height z0 up to z1 (its outside, facing you) */
  const near = (/** @type {number} */ r, /** @type {number} */ z0, /** @type {number} */ z1) => { const rx = r * k, ry = r * se * k; return `M${f(cx - rx)} ${f(yAt(z0))}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(yAt(z0))}L${f(cx + rx)} ${f(yAt(z1))}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx)} ${f(yAt(z1))}Z`; };
  /** the far half of a hole's wall of radius r from z0 up to z1 (its inside, facing you) */
  const far = (/** @type {number} */ r, /** @type {number} */ z0, /** @type {number} */ z1) => { const rx = r * k, ry = r * se * k; return `M${f(cx - rx)} ${f(yAt(z1))}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx + rx)} ${f(yAt(z1))}L${f(cx + rx)} ${f(yAt(z0))}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx - rx)} ${f(yAt(z0))}Z`; };
  const rnd = rng(17);
  /** land, stippled as engravers did: dots over a ring from a to z stadia at height h, thinning out past `fade` */
  const stipple = (/** @type {number} */ a, /** @type {number} */ z, /** @type {number} */ h, n = 26, skip = (/** @type {number} */ _r) => false, fade = 99) => {
    /** @type {[number, number][]} */ const d = [];
    for (let i = 0; i < (z - a) * (z + a) * n; i++) { const r = Math.sqrt(a * a + rnd() * (z * z - a * a)), t = rnd() * 2 * Math.PI; if (skip(r) || (r > fade && rnd() < (r - fade) / (z - fade))) continue; d.push([cx + Math.cos(t) * r * k, yAt(h) - Math.sin(t) * r * se * k]); }
    return d;
  };
  /** the sea in a hole: level lines across it, as old maps engraved water */
  const sea = (/** @type {number} */ r) => { let d = ''; const ry = r * se * k; for (let y = yAt(0) - ry + 1.2; y < yAt(0) + ry; y += 2.2) d += `M${f(cx - r * k)} ${f(y)}H${f(cx + r * k)}`; return `<path class="at-wave" d="${d}"/>`; };
  const clip = (/** @type {string} */ id, /** @type {number} */ r, /** @type {number} */ z) => `<clipPath id="${id}"><path d="${ell(r, z)}"/></clipPath>`;
  /** how a round wall takes the light from the upper left: one sweep of shade across the whole city for its banks, and
      a sheen across each wall of metal */
  const round = (/** @type {string} */ id, /** @type {number} */ r, /** @type {string} */ c) => `<linearGradient id="${id}" class="${c}" gradientUnits="userSpaceOnUse" x1="${f(cx - r * k)}" y1="0" x2="${f(cx + r * k)}" y2="0"><stop offset="0"/><stop offset=".28"/><stop offset="1"/></linearGradient>`;
  /** the bank a ring of land or the island shows you, or (inside) the far bank of a ring of sea, lit the other way round */
  const bank = (/** @type {string} */ d, inside = false) => `<path class="at-cliff" fill="url(#at-${inside ? 'hole' : 'bank'})" d="${d}"/>`;
  const sy = 302, top = sy - 17;
  let b = `<defs>${clip('at-h0', 13.5, LAND)}${clip('at-h1', 7.5, LAND)}${clip('at-h2', 3.5, LAND)}<clipPath id="at-plan"><rect width="${W}" height="${top}"/></clipPath>${round('at-bank', 13.5, 'at-gb')}${round('at-hole', -13.5, 'at-gb')}${round('at-m0', 10.5, 'at-gm at-brass')}${round('at-m1', 5.5, 'at-gm at-tin')}${round('at-m2', 2.5, 'at-gm at-ori')}<linearGradient id="at-fadeg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff"/></linearGradient><mask id="at-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#at-fadeg)"/></mask></defs>`;
  /* the plain round the city, fading toward the card's top */
  let plan = `<g class="at-lv at-l4" mask="url(#at-fade)">${dotsPath(stipple(13.5, 24, LAND, 1.3, () => false, 15), 'at-stip at-plain')}</g>`;
  /* the canal, leading in from the sea, south, to the harbour */
  const cw = .25 * k;
  plan += `<g class="at-lv at-l3"><rect class="at-water" x="${f(cx - cw)}" y="${f(yAt(LAND) + 13.5 * se * k - 2)}" width="${f(2 * cw)}" height="${H}"/><path class="at-canal" d="M${f(cx - cw)} ${f(yAt(LAND) + 13.5 * se * k)}V${H}M${f(cx + cw)} ${f(yAt(LAND) + 13.5 * se * k)}V${H}"/></g>`;
  /* the bridges over the three rings of sea, a sixth of a stadion wide: one road from the plain to the palace */
  const road = -38 * Math.PI / 180, bw = 1 / 12;
  const bridge = (/** @type {number} */ r0, /** @type {number} */ z0, /** @type {number} */ r1, /** @type {number} */ z1) => { const at = (/** @type {number} */ r, /** @type {number} */ z, /** @type {number} */ s) => `${f(cx + (r * Math.sin(road) + s * bw * Math.cos(road)) * k)} ${f(yAt(z) + (r * Math.cos(road) - s * bw * Math.sin(road)) * se * k)}`; return `<path class="at-bridge" d="M${at(r0, z0, -1)}L${at(r1, z1, -1)}L${at(r1, z1, 1)}L${at(r0, z0, 1)}Z"/>`; };
  /* the harbour, and everything inside it */
  let h0 = bank(far(13.5, 0, LAND), true) + `<path class="at-water" d="${ell(13.5, 0)}"/>` + sea(13.5);
  /* the largest ring of land: its face toward you, its top with the racecourse, its brass wall */
  let ring2 = bank(near(10.5, 0, LAND)) + `<path class="at-top" fill-rule="evenodd" d="${ell(10.5, LAND)}${ell(7.5, LAND)}"/>` + dotsPath(stipple(7.5, 10.5, LAND, 15, r => r > 8.5 && r < 9.5), 'at-stip') + `<path class="at-track" d="${ell(8.5, LAND)}${ell(9.5, LAND)}"/>`;
  ring2 += `<path class="at-wall" fill="url(#at-m0)" d="${near(10.5, LAND, LAND + WALL)}"/><path class="at-rim at-brass" d="${ell(10.5, LAND + WALL)}"/>`;
  /* the sea inside each ring is the harbour's own, drawn once beneath them all: only the far walls are new */
  let h1 = bank(far(7.5, 0, LAND), true);
  let ring1 = bank(near(5.5, 0, LAND)) + `<path class="at-top" fill-rule="evenodd" d="${ell(5.5, LAND)}${ell(3.5, LAND)}"/>` + dotsPath(stipple(3.5, 5.5, LAND, 18), 'at-stip');
  ring1 += `<path class="at-wall" fill="url(#at-m1)" d="${near(5.5, LAND, LAND + WALL)}"/><path class="at-rim at-tin" d="${ell(5.5, LAND + WALL)}"/>`;
  let h2 = bank(far(3.5, 0, LAND), true);
  /* the citadel: higher than the rings, walled in orichalcum, with Poseidon's temple, a stadion by half, facing you */
  let isle = bank(near(2.5, 0, CIT)) + `<path class="at-top" d="${ell(2.5, CIT)}"/>` + dotsPath(stipple(.9, 2.5, CIT, 22), 'at-stip');
  isle += `<path class="at-wall" fill="url(#at-m2)" d="${near(2.5, CIT, CIT + WALL)}"/><path class="at-rim at-ori" d="${ell(2.5, CIT + WALL)}"/><path class="at-glint" pathLength="1" d="${ell(2.5, CIT + WALL)}"/>`;
  const tw = .25 * k, tz = yAt(CIT), td = .5 * se * k, th = .45 * ce * k;
  isle += `<path class="at-temple-top" d="M${f(cx - tw)} ${f(tz - td - th)}H${f(cx + tw)}V${f(tz + td - th)}H${f(cx - tw)}Z"/><path class="at-temple" d="M${f(cx - tw)} ${f(tz + td - th)}H${f(cx + tw)}V${f(tz + td)}H${f(cx - tw)}Z"/>`;
  /* each hole holds the rest, clipped to its rim; the city rises level by level from the island out, so the levels
     fade in as groups of their own, never inside one another's; each bridge comes with the ring it reaches */
  h2 = `<g class="at-lv at-l1">${h2}</g><g class="at-lv at-l0">${isle}</g><g class="at-lv at-l1">${bridge(2.5, CIT, 3.5, LAND)}</g>`;
  h1 = `<g class="at-lv at-l2">${h1}</g><g class="at-lv at-l1">${ring1}</g><g clip-path="url(#at-h2)">${h2}</g><g class="at-lv at-l2">${bridge(5.5, LAND, 7.5, LAND)}</g>`;
  h0 = `<g class="at-lv at-l3">${h0}</g><g class="at-lv at-l2">${ring2}</g><g clip-path="url(#at-h1)">${h1}</g><g class="at-lv at-l3">${bridge(10.5, LAND, 13.5, LAND)}</g>`;
  plan += `<g clip-path="url(#at-h0)">${h0}</g>`;
  /* the plain's own edge round the harbour */
  plan += `<path class="at-shore" d="${ell(13.5, LAND)}"/>`;
  b += `<g clip-path="url(#at-plan)">${plan}</g>`;
  /* under the plan, the same city cut through its middle, to the same scale: sea and land by turns, and Plato's
     width for each in stadia, 27 across in all */
  const edges = [-13.5, -10.5, -7.5, -5.5, -3.5, -2.5, 2.5, 3.5, 5.5, 7.5, 10.5, 13.5], sx = (/** @type {number} */ r) => f(cx + r * k), ground = (/** @type {number} */ z) => f(sy - z * k);
  const bed = sy + 5; let cut = `M18 ${ground(LAND)}`, water = '', top2 = '', walls = '';
  edges.forEach((r, i) => {
    const land = i % 2 === 1, up = ground(i === 5 || i === 6 ? CIT : LAND);
    cut += land ? `H${sx(r)}V${up}` : `H${sx(r)}V${bed}`;
    if (!land && i < 11) { water += `M${sx(r)} ${sy}H${sx(edges[i + 1])}V${bed}H${sx(r)}Z`; top2 += `M${sx(r)} ${sy}H${sx(edges[i + 1])}`; }
    const metal = [10.5, 5.5, 2.5].indexOf(Math.abs(r)); if (metal >= 0) walls += `<path class="at-sw ${['at-brass', 'at-tin', 'at-ori'][metal]}" d="M${sx(r)} ${up}v${f(-WALL * k)}"/>`;
  });
  b += `<g class="fade w9">${L(18, top, W - 18, top, 'at-rule')}<path class="at-water" d="${water}"/><path class="at-cut" d="${cut}H${W - 18}V${bed}H18Z"/><path class="at-level" d="${top2}"/>${walls}`;
  b += `<text class="at-num tn" x="${edges.slice(1).map((r, i) => sx((r + edges[i]) / 2)).join(' ')}" y="${sy + 19}" text-anchor="middle">33221512233</text>${T(18, H - 14, 'STADIA')}${T(W - 18, H - 14, 'AFTER PLATO, CRITIAS', 'at-src', 'end')}</g>`;
  /* what pointing at each part reads, the most particular on top */
  const band = (/** @type {number} */ a, /** @type {number} */ z, /** @type {number} */ h) => `${ell(z, h)}${ell(a, h)}`;
  const hits = /** @type {[number, number, number, string][]} */ ([[10.5, 13.5, 0, 'The harbour: a ring of sea 3 stadia wide'], [7.5, 10.5, LAND, 'A ring of land 3 stadia wide, with a racecourse, walled in brass'], [5.5, 7.5, 0, 'A ring of sea 2 stadia wide'], [3.5, 5.5, LAND, 'A ring of land 2 stadia wide, walled in tin'], [2.5, 3.5, 0, 'A ring of sea a stadion wide']]);
  let h = hits.map(([a, z, hh, t]) => `<path class="hit" fill-rule="evenodd" data-read="${t}" d="${band(a, z, hh)}"/>`).join('');
  h += `<rect class="hit" data-read="The canal from the sea: 300 feet wide, 100 deep, 50 stadia long" x="${f(cx - cw - 3)}" y="${f(yAt(LAND) + 13.5 * se * k)}" width="${f(2 * cw + 6)}" height="${H}"/>`;
  h += `<path class="hit" data-read="The citadel, 5 stadia across, its wall of orichalcum that “flashed with the red light”" d="${ell(2.5, CIT)}"/>`;
  b += `<g clip-path="url(#at-plan)">${h}</g><rect class="hit" data-read="The city cut through its middle: 27 stadia from shore to shore" y="${top}" width="${W}" height="${H - top}"/>`;
  return svg(W, H, 'The ringed city of Atlantis as a model drawn to Plato’s measurements: an island 5 stadia across with Poseidon’s temple, rings of sea and land 1, 2, 2, 3 and 3 stadia wide, walls of orichalcum, tin and brass, a racecourse, bridges across the rings of sea, and the canal leading in from the sea; under it the city in section, with each width in stadia', b, 'at');
}

/* Magnets: iron filings round a bar magnet, each lying along the field where it fell (src/shared/plates.js: the bar's
   poles as two charges just inside its ends), gathered where the field is strong and a little scattered where it is
   weak. The page draws the filings on a canvas, since there are some 1,800 and they move: on its turn they swing from
   scattered into line, rippling out from the bar, and the pointer, or a thumb dragged across the card, is a pole they
   turn toward. */
function magnets() {
  const { W, H, cx, cy, len, h } = BAR, x0 = cx - len / 2;
  let b = `<rect class="mg-s" x="${f(x0)}" y="${f(cy - h / 2)}" width="${f(len / 2)}" height="${h}" rx="4"/><rect class="mg-n" x="${f(cx)}" y="${f(cy - h / 2)}" width="${f(len / 2)}" height="${h}" rx="4"/>`;
  b += `<rect class="mg-edge" x="${f(x0)}" y="${f(cy - h / 2)}" width="${len}" height="${h}" rx="4"/>`;
  b += T(x0 + len / 4, cy + 5, 'S', 'mg-l', 'middle') + T(cx + len / 4, cy + 5, 'N', 'mg-l', 'middle');
  return `<canvas class="mg-cv" aria-hidden="true"></canvas>` + svg(W, H, 'Iron filings round a bar magnet, lying along its field: looping from its north pole round to its south, crowded at the poles', b, 'mg', 'xMidYMid slice');
}

/* Lightning: a bolt at night from the cloud's base to a hill, as a stepped leader grows one: the channel feels its way
   down in short jagged steps (tens of metres each, Wikipedia), throwing off branches that stop in the air, and when it
   meets the ground the return stroke lights the whole channel, heating the air to about 30,000 °C (Wikipedia), five
   times hotter than the Sun's surface (the US National Weather Service). Grown the same way every build from a seed. On
   its turn the leader creeps down in steps, the channel flashes once, softly, and the bolt stays, as in a long exposure. */
/** @param {number} seed */
export function lightning(seed = 58) {
  const W = 365, H = 532, r = rng(seed), top = 96, ground = 452, steps = 12;
  /** @typedef {{ a: number[], b: number[], t: number, d: number }} Seg */
  /** @type {Seg[]} */ const segs = [];
  /** walk from p in direction a (radians, 0 = straight down) for a budget of length, stepping and wandering, and branch */
  const walk = (/** @type {number[]} */ p, /** @type {number} */ a, /** @type {number} */ budget, /** @type {number} */ d, /** @type {number} */ t0, /** @type {number[] | null} */ aim) => {
    let x = p[0], y = p[1], t = t0, used = 0;
    while (used < budget && y < ground) {
      const len = (d ? 4.5 : 6.5) + r() * (d ? 6 : 9), want = aim ? Math.atan2(aim[0] - x, aim[1] - y) : a;
      a = want + (r() - .5) * (d ? 1.3 : 1.05); a = Math.max(-1.25, Math.min(1.25, a));
      const nx = x + Math.sin(a) * len, ny = Math.min(ground, y + Math.cos(a) * len);
      segs.push({ a: [x, y], b: [nx, ny], t, d });
      if (d < 3 && r() < (d ? .1 : .17) && ny < ground - 40) walk([nx, ny], a + (r() < .5 ? -1 : 1) * (.55 + r() * .5), (d ? 34 : 64) + r() * (d ? 50 : 105), d + 1, t + 1, null);
      x = nx; y = ny; used += len; t += 1;
    }
    return [x, y];
  };
  const strike = [150, ground];
  walk([196, top], 0, 1e4, 0, 0, strike);
  const last = Math.max(...segs.filter(q => !q.d).map(q => q.t)) || 1;
  /* paths by when the leader reached them (twelve steps) and how far from the channel they branched */
  /** @type {Record<string, string>} */ const groups = {};
  for (const q of segs) { const k = `${Math.min(steps - 1, Math.floor(q.t / last * steps))}-${Math.min(q.d, 3)}`; groups[k] = (groups[k] || '') + `M${f(q.a[0])} ${f(q.a[1])}L${f(q.b[0])} ${f(q.b[1])}`; }
  const channel = segs.filter(q => !q.d), core = `M${f(channel[0].a[0])} ${f(channel[0].a[1])}${channel.map(q => `L${f(q.b[0])} ${f(q.b[1])}`).join('')}`;
  let b = `<defs><linearGradient id="lt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030409"/><stop offset=".55" stop-color="#090C17"/><stop offset="1" stop-color="#0E1220"/></linearGradient><filter id="lt-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter><filter id="lt-wide" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter><filter id="lt-cloud" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="9"/></filter><radialGradient id="lt-lit" cx="${196 / W}" cy="${top / H}" r=".6"><stop offset="0" stop-color="#8E7FE0" stop-opacity=".55"/><stop offset="1" stop-color="#8E7FE0" stop-opacity="0"/></radialGradient></defs>`;
  b += `<rect width="${W}" height="${H}" fill="url(#lt-sky)"/>`;
  /* the cloud's base, lit from below where the bolt leaves it */
  let cloud = '', under = '';
  for (let i = 0; i < 34; i++) { const x = -40 + r() * (W + 80), y = 18 + r() * 70 + Math.abs(x - 196) * .06, rx = 22 + r() * 46; cloud += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(rx * (.38 + r() * .25))}"/>`; if (r() < .45) under += `<ellipse cx="${f(x + (r() - .5) * 20)}" cy="${f(y + rx * .3)}" rx="${f(rx * .7)}" ry="${f(rx * .18)}"/>`; }
  b += `<g class="lt-cloud" filter="url(#lt-cloud)">${cloud}</g><g class="lt-under" filter="url(#lt-cloud)">${under}</g><rect class="lt-lit" width="${W}" height="${H}" fill="url(#lt-lit)"/>`;
  /* the bolt: a wide glow, a near glow, then the strokes themselves, finest for the furthest branches */
  b += `<path class="lt-wide" filter="url(#lt-wide)" d="${core}"/>`;
  b += `<g class="lt-bolt"><g class="lt-near" filter="url(#lt-soft)">${Object.entries(groups).filter(([k]) => +k.split('-')[1] < 2).map(([k, d]) => `<path class="lt-b lt-s${k.split('-')[0]}" d="${d}"/>`).join('')}</g>`;
  b += Object.entries(groups).map(([k, d]) => `<path class="lt-b lt-s${k.split('-')[0]} lt-d${k.split('-')[1]}" d="${d}"/>`).join('') + '</g>';
  b += `<path class="lt-core" d="${core}"/>`;
  /* the hill it strikes, and the ground's faint answer */
  b += `<path class="lt-hill" d="M0 ${ground + 22}C70 ${ground + 4} 112 ${ground - 4} 150 ${ground}C196 ${ground + 4} 250 ${ground + 26} ${W} ${ground + 18}V${H}H0Z"/>`;
  b += `<ellipse class="lt-glow" cx="150" cy="${ground}" rx="60" ry="10" filter="url(#lt-wide)"/>`;
  b += `<g class="lt-label fade"><text class="lt-fig" x="18" y="${H - 56}">30,000 °C</text>${T(18, H - 37, 'Five times hotter than the Sun’s surface', 'lt-note')}</g>`;
  b += `<path class="hit" data-read="The channel: air heated to about 30,000 °C, five times the Sun’s surface" d="${core}" stroke-width="16" fill="none"/>`;
  return svg(W, H, 'A bolt of lightning at night from the base of a cloud to a hill, its channel branching as the stepped leader felt its way down: the air in it is heated to about 30,000 °C, five times hotter than the Sun’s surface', b, 'lt', 'xMidYMid slice');
}

/* Northern lights: a photograph where the red shows above the green, cropped tall, and down its right edge a scale of
   the heights each colour comes from: the red and the green are the same oxygen, the red higher up. Auroral light has
   no hard edges, so neither do the bands; on its turn they rise up the scale in turn. Laid out by the stylesheet, so
   the scale fits whatever height the card has. */
function aurora() {
  const ticks = [0, 100, 200, 300, 400, 500].map(k => `<b class="nl-tk nl-k${k / 100}">${k}</b>`).join('');
  return `<img class="nl-img" src="/api/picture?f=b%2Fb1%2F2024-10-10_Red_and_Green_Aurora_Borealis_over_Luray_VA_22-08-35_1.jpg&amp;w=1280" alt="The northern lights over Luray, Virginia: red light high above a band of green" width="1280" height="853" loading="lazy" decoding="async" fetchpriority="low"><div class="nl-scale" role="img" aria-label="A scale of height from 0 to 500 km: red light from oxygen, at 630 nm, highest, above about 300 km; green light from oxygen, at 557.7 nm, from about 100 to 300 km"><i class="nl-ax"></i>${ticks}<b class="nl-km">KM</b><i class="nl-band nl-red"></i><i class="nl-band nl-green"></i><p class="nl-lab nl-lr"><b>Oxygen</b>630 nm</p><p class="nl-lab nl-lg"><b>Oxygen</b>557.7 nm</p></div>`;
}

/* Enigma machine: the card is the machine with its lid off, black in either theme. On the right, its top: the lampboard
   over the keyboard, each in its own QWERTZ rows. On the left, what the lid hides: three rotors under their windows, the
   reflector beyond them, and the one wire a letter takes, in through all three rotors, turned back by the reflector and
   out again by another way, which is why the lamp it lights is never the key's own. Under that, your letters over the
   lamps they lit, and a tally of how many lit themselves (none, ever). The page wires it up, and draws each rotor's 26
   wires, since they turn (src/app/13-landing.js); the cipher and the diagram's measures are src/shared/enigma.js. */
const QWERTZ = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'];
function enigmaBoard() {
  const { W, H, ukw, faces, entry } = EN_WIRE, y = (/** @type {number} */ c) => EN_WIRE.top + c * EN_WIRE.step;
  const strip = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZA'].map(c => `<i>${c}</i>`).join('');
  /* a rotor's window, and beside it the wheel's edge that turns it by hand, as an operator set the day's start */
  const rotors = ['left', 'middle', 'right'].map(n => `<button class="en-rw" type="button" data-at="A" data-tip="Turn this rotor" aria-label="Turn the ${n} rotor"><span class="en-win"><b class="en-strip">${strip}</b></span></button>`).join('');
  /* the reflector's thirteen wires, each joining two contacts on its one face: the wider apart, the deeper it loops */
  let turn = '';
  for (let a = 0; a < 26; a++) { const b = reflected(a); if (b > a) { const k = 5 + (b - a) * .85; turn += `M${ukw} ${y(a)}C${f(ukw - k)} ${y(a)} ${f(ukw - k)} ${y(b)} ${ukw} ${y(b)}`; } }
  let b = `<defs><linearGradient id="en-drum" x1="0" y1="0" x2="0" y2="1"><stop class="en-d0" offset="0"/><stop class="en-d1" offset=".24"/><stop class="en-d1" offset=".76"/><stop class="en-d0" offset="1"/></linearGradient><linearGradient id="en-turn" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H}"><stop class="en-t0" offset="0"/><stop class="en-t1" offset="1"/></linearGradient></defs>`;
  b += `<path class="en-ukw" d="${turn}"/><rect class="en-box" x=".5" y=".5" width="${ukw - .5}" height="${H - 1}" rx="5"/>`;
  /* each rotor a drum seen side on: its wires (the page lays them, as it stands), shaded where it curves away */
  for (const [right, left] of faces) b += `<svg class="en-rot" x="${left}" y="0" width="${right - left}" height="${H}"><path class="en-mesh"/><rect width="${right - left}" height="${H}" fill="url(#en-drum)"/></svg><rect class="en-box" x="${left}" y=".5" width="${right - left}" height="${H - 1}" rx="5"/>`;
  /* the 26 contacts the keys and the lamps are wired to, A at the top */
  b += `<path class="en-dots" d="${Array.from({ length: 26 }, (_, c) => `M${entry} ${y(c)}h0`).join('')}"/>`;
  /* the letter's way: in, round the reflector, and out; the page draws it, and marks where it goes in and comes out */
  b += `<path class="en-way en-go" pathLength="1"/><path class="en-way en-turn" pathLength="1" stroke="url(#en-turn)"/><path class="en-way en-back" pathLength="1"/>`;
  b += `<g class="en-pin en-pin-i"><circle cx="${entry}" r="2.3"/><text x="${entry + 9.5}" text-anchor="middle"></text></g><g class="en-pin en-pin-o"><circle cx="${entry}" r="2.3"/><text x="${entry + 9.5}" text-anchor="middle"></text></g>`;
  b += `<rect class="hit" data-read="The reflector turns the current back along another wire, so no letter lights itself" width="${ukw + 5}" height="${H}"/>`;
  b += [['left', 'when the middle one passes its notch'], ['middle', 'when the right one passes its notch'], ['right', 'with every key, so the wiring keeps changing']].map(([name, when], r) => `<rect class="hit" data-read="The ${name} rotor steps ${when}" x="${faces[r][1] - 5}" width="${faces[r][0] - faces[r][1] + 10}" height="${H}"/>`).join('');
  const wires = `<svg class="en-wire" viewBox="0 0 ${W} ${H}" aria-hidden="true">${b}</svg>`;
  const lamps = QWERTZ.map(r => `<p>${[...r].map(c => `<i data-l="${c}">${c}</i>`).join('')}</p>`).join('');
  const keys = QWERTZ.map(r => `<p>${[...r].map(c => `<button type="button" data-k="${c}" aria-label="${c}" tabindex="-1">${c}</button>`).join('')}</p>`).join('');
  const tape = `<div class="en-tape"><label class="en-in"><span>IN</span><input type="text" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Type a word to encrypt"><b class="en-pl" aria-hidden="true"></b></label><p class="en-out"><span>OUT</span><b class="en-cy" aria-live="polite"></b></p><p class="en-tally"><b class="en-n">0</b><span>of <i class="en-of">0</i> <i class="en-w">letters lit themselves</i></span></p></div>`;
  return `<div class="en" role="group" aria-label="An Enigma machine: tap its keys or type"><div class="en-sc"><div class="en-r" role="group" aria-label="Rotors">${rotors}</div>${wires}</div>${tape}<div class="en-m"><div class="en-lamps" aria-hidden="true">${lamps}</div><div class="en-keys">${keys}</div></div></div>`;
}

/** @typedef {{ t: string, size: 'hero' | 'tall' | 'sq' | 'wide' | 'small' | 'big', tab?: 'wide' | 'sq' | 'big' | 'tall', art: () => string, more?: string, fx?: string, credit?: string, hook?: string, beat?: number, night?: boolean, src: string[] }} Card */
/** The cards, in the order the page lays them out (the map of threads sits before Fireworks). A card's hook is its
    topic's unless it says otherwise; it goes with the card's link (and the placeholder and the writer's brief), not on
    the card, which shows only its drawing, its kind and its title (Will, 2026-10-16). beat: how long its entrance
    runs, in ms, so the next card waits its turn. night: dark in either theme. @type {Card[]} */
export const CARDS = [
  { t: 'Black holes', size: 'hero', night: true, beat: 1700, hook: 'Light bends so far round one that you see the far side of its disk, over the top.', art: blackHoles, src: ['https://en.wikipedia.org/wiki/Black_hole', 'https://blogs.nature.com/aviewfromthebridge/2017/03/'] },
  { t: 'Northern lights', size: 'tall', tab: 'sq', night: true, beat: 900, art: aurora, credit: 'G. Edward Johnson · CC BY 4.0', src: ['https://science.nasa.gov/earth/earth-observatory/auroras-dancing-in-the-night', 'https://en.wikipedia.org/wiki/Aurora', 'https://commons.wikimedia.org/wiki/File:2024-10-10_Red_and_Green_Aurora_Borealis_over_Luray_VA_22-08-35_1.jpg'] },
  { t: 'Origami', size: 'big', fx: 'origami', beat: 1500, hook: 'Miura’s fold opens a whole sheet with one pull on its ends, and shuts with one push.', art: origami, src: ['https://en.wikipedia.org/wiki/Miura_fold'] },
  { t: 'Atlantis', size: 'sq', beat: 1700, hook: 'Plato gave its rings in stadia: an island 5 across, then rings of sea and land 1, 2 and 3 wide.', art: atlantis, src: ['https://www.gutenberg.org/files/1571/1571-h/1571-h.htm', 'https://en.wikipedia.org/wiki/Atlantis'] },
  { t: 'Venus flytraps', size: 'sq', tab: 'big', fx: 'flytrap', beat: 1600, art: flytrap, src: ['https://en.wikipedia.org/wiki/Venus_flytrap', 'https://doi.org/10.1016/j.cub.2015.11.057'] },
  { t: 'Magnets', size: 'sq', fx: 'magnets', beat: 1400, art: magnets, src: ['https://en.wikipedia.org/wiki/Magnetic_field', 'https://en.wikipedia.org/wiki/Iron_filings'] },
  { t: 'Rubik’s Cube', size: 'sq', beat: 1300, hook: 'Its pieces fit together in 43,252,003,274,489,856,000 ways, each at most 20 moves from solved.', art: rubik, src: ['https://en.wikipedia.org/wiki/Rubik%27s_Cube', 'https://www.cube20.org/'] },
  { t: 'Fireworks', size: 'wide', night: true, beat: 2200, art: fireworks, src: ['https://en.wikipedia.org/wiki/Pyrotechnic_colorant', 'https://www.aps.org/apsnews/2026/06/the-showy-science-of-fireworks', 'https://en.wikipedia.org/wiki/Fireworks'] },
  { t: 'Lightning', size: 'tall', tab: 'sq', night: true, beat: 1700, art: () => lightning(), src: ['https://en.wikipedia.org/wiki/Lightning', 'https://www.weather.gov/safety/lightning-science-thunder'] },
  { t: 'Giant squid', size: 'sq', beat: 1400, art: squid, src: ['https://en.wikipedia.org/wiki/Giant_squid'] },
  { t: 'Pompeii', size: 'sq', beat: 2000, art: pompeii, credit: '© OpenStreetMap contributors', src: ['https://en.wikipedia.org/wiki/Pompeii', 'https://en.wikipedia.org/wiki/Amphitheatre_of_Pompeii', 'https://it.wikipedia.org/wiki/Scavi_archeologici_di_Pompei'] },
  { t: 'Enigma machine', size: 'big', fx: 'enigma', night: true, beat: 2100, hook: 'It never turned a letter into itself, and that flaw helped break it. Try it.', art: enigmaBoard, src: ['https://en.wikipedia.org/wiki/Cryptanalysis_of_the_Enigma', 'https://en.wikipedia.org/wiki/Enigma_machine', 'https://www.pbs.org/wgbh/nova/article/how-enigma-works'] },
  { t: 'Infinity', size: 'sq', beat: 1800, hook: 'Some infinities are bigger than others, and Cantor’s diagonal shows why.', art: cantor, src: ['https://en.wikipedia.org/wiki/Cantor%27s_diagonal_argument'] },
];

/** Rules the build adds to /front.css, computed from the drawings so they never disagree: how dark each of the
    Origami sheet's four kinds of face is at rest, and how far each of the cube's pieces moves to join the others. */
export function plateCss() {
  return `.vz.mi{${foldView(FOLD.rest, 'w').tones.map((t, o) => `--s${o}:${t.toFixed(3)}`).join(';')}}${rubikCss()}`;
}

/** What the front page fetches. */
export function frontData() {
  const byTitle = new Map(FRONT.map(t => [t.t, t]));
  return {
    v: 1,
    topics: FRONT.map(({ t, k, h }) => ({ t, k, h })),
    threads: THREADS.map(({ a, b, l }) => ({ a, b, l })),
    cards: CARDS.map(c => { const t = /** @type {FrontTopic} */ (byTitle.get(c.t)); return { t: c.t, k: t.k, size: c.size, ...(c.tab ? { tab: c.tab } : {}), hook: c.hook || t.h, art: c.art(), ...(c.more ? { more: c.more } : {}), ...(c.fx ? { fx: c.fx } : {}), ...(c.credit ? { credit: c.credit } : {}), ...(c.beat ? { beat: c.beat } : {}), ...(c.night ? { night: true } : {}) }; }),
  };
}
