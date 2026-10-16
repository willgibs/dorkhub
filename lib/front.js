/* ================= the front page, by hand =================
   Will's call (2026-10-15): while the front page is updated by hand, every card is its own piece.
   The thirty-two topics planned as pages written ahead of time (and Bioluminescence) are here with a
   hook each; a dozen lead in as cards, each drawn its own way; the rest turn up as suggestions; and
   the threads between them make the map. Every claim carries its source, checked before it went in.
   No model writes any of it. `scripts/build.mjs` turns this into public/front.json, which only the
   front page fetches, so reading pages never carry the artwork. Until a topic's page is written, it
   opens a placeholder made from its hook and threads (lib/placeholder.js). */
import { luminet } from './plates/blackhole.js';
import { BAR, FOLD, TRAP, foldView, hull, trapView } from '../src/shared/plates.js';

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
  { t: 'Volcanoes', k: 'phenomenon', h: 'Krakatoa was heard 4,800 km away, and barometers caught its blast seven times.', src: 'https://en.wikipedia.org/wiki/1883_eruption_of_Krakatoa' },
  { t: 'Coral reefs', k: 'place', h: 'Under 1% of the sea floor, home to an estimated quarter of all marine species.', src: 'https://floridakeys.noaa.gov/corals/biodiversity.html' },
  { t: 'Dreams', k: 'phenomenon', h: 'The longest dream of the night comes just before you wake.', src: 'https://en.wikipedia.org/wiki/Rapid_eye_movement_sleep' },
  { t: 'Fingerprints', k: 'thing', h: 'Koalas have them too, so like ours they could confuse a crime scene.', src: 'https://en.wikipedia.org/wiki/Fingerprint' },
  { t: 'Terracotta Army', k: 'work', h: 'Some 8,000 soldiers, found in 1974 by farmers digging a well.', src: 'https://en.wikipedia.org/wiki/Terracotta_Army' },
  { t: 'Atlantis', k: 'mystery', h: 'Every telling of it goes back to two dialogues Plato wrote around 360 BC.', src: 'https://en.wikipedia.org/wiki/Atlantis' },
  { t: 'Magnets', k: 'thing', h: 'A strong enough magnet can float a living frog. It has been done, at 16 tesla.', src: 'https://en.wikipedia.org/wiki/Magnetic_levitation' },
  { t: 'Infinity', k: 'concept', h: 'Some infinities are bigger than others.', src: 'https://en.wikipedia.org/wiki/Cantor%27s_diagonal_argument' },
  { t: 'Time travel', k: 'idea', h: 'GPS satellite clocks gain 38 microseconds a day, just as relativity says.', src: 'https://en.wikipedia.org/wiki/Error_analysis_for_the_Global_Positioning_System' },
  { t: 'Ice ages', k: 'era', h: 'We are living in one: there is still ice at both poles.', src: 'https://en.wikipedia.org/wiki/Ice_age' },
  { t: 'Fireworks', k: 'thing', h: 'Every colour is a metal, and blue is the hardest to make.', src: 'https://www.aps.org/apsnews/2026/06/the-showy-science-of-fireworks' },
  { t: 'Rubik’s Cube', k: 'thing', h: '43 quintillion positions, and every one can be solved in 20 moves.', src: 'https://www.cube20.org/' },
  { t: 'Pompeii', k: 'place', h: 'The textbook date of the eruption, 24 August 79, may be months off.', src: 'https://en.wikipedia.org/wiki/Eruption_of_Mount_Vesuvius_in_79_AD' },
  { t: 'Mona Lisa', k: 'work', h: 'Its fame took off when it was stolen from the Louvre in 1911.', src: 'https://en.wikipedia.org/wiki/Mona_Lisa' },
  { t: 'Lightning', k: 'phenomenon', h: 'A bolt heats the air to 30,000 °C, five times hotter than the Sun’s surface.', src: 'https://www.weather.gov/safety/lightning-science-thunder' },
  { t: 'Octopuses', k: 'creature', h: 'Two-thirds of an octopus’s neurons are in its arms.', src: 'https://www.sciencealert.com/here-s-how-octopus-arms-make-decisions-without-input-from-the-brain' },
  { t: 'Hieroglyphs', k: 'concept', h: 'For some 1,400 years nobody could read them, until Champollion in 1822.', src: 'https://en.wikipedia.org/wiki/Egyptian_hieroglyphs' },
  { t: 'Giant squid', k: 'creature', h: 'Its eyes reach 27 cm across, as big as any animal’s.', src: 'https://en.wikipedia.org/wiki/Giant_squid' },
  { t: 'DNA', k: 'thing', h: 'Unwound, the DNA in one of your cells would stretch about 2 metres.', src: 'https://en.wikipedia.org/wiki/DNA' },
  { t: 'Antarctica', k: 'place', h: 'If all its ice melted, the seas would rise about 58 metres.', src: 'https://en.wikipedia.org/wiki/Antarctic_ice_sheet' },
  { t: 'Origami', k: 'technique', h: 'A fold made for spacecraft opens a whole solar panel in one pull.', src: 'https://en.wikipedia.org/wiki/Miura_fold' },
  { t: 'Boomerangs', k: 'thing', h: 'Most boomerangs were never meant to come back.', src: 'https://en.wikipedia.org/wiki/Boomerang' },
  { t: 'Enigma machine', k: 'thing', h: 'It never turned a letter into itself, and that flaw helped break it.', src: 'https://en.wikipedia.org/wiki/Cryptanalysis_of_the_Enigma' },
  { t: 'Apollo 11', k: 'event', h: 'Its computer had 2,048 words of memory, and flashed alarms minutes before landing.', src: 'https://en.wikipedia.org/wiki/Apollo_Guidance_Computer' },
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
  { t: 'Kessler syndrome', k: 'phenomenon', h: 'How one collision could lock us out of orbit for generations.' },
  { t: 'Fresnel lenses', k: 'mechanism', h: 'How lighthouses folded a giant lens into rings of glass.' },
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

/* Pompeii: Vesuvius's eruption of AD 79 drawn to scale, as Pliny the Younger saw it from across the bay: a column of ash
   and pumice rising up to 33 km over a mountain barely more than one high, spreading at its top into what he likened to
   a pine tree, and drifting with the wind over Pompeii, 8 km off, where the pumice fell (Wikipedia). On its turn the
   column climbs, its crown spreads, and the pumice falls. */
function pompeii() {
  const W = 365, H = 350, g = 298, km = 6.4, vx = 132, r = rng(11);
  const Y = (/** @type {number} */ h) => g - h * km;
  let b = `<defs><linearGradient id="pp-sky" x1="0" y1="0" x2="0" y2="1"><stop class="pp-s0" offset="0"/><stop class="pp-s1" offset="1"/></linearGradient><clipPath id="pp-rise"><rect class="pp-riser" x="0" y="0" width="${W}" height="${g}"/></clipPath><filter id="pp-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>`;
  b += `<rect width="${W}" height="${H}" fill="url(#pp-sky)"/>`;
  /* the height, in kilometres, up the left */
  for (const h of [10, 20, 30]) b += L(10, Y(h), 18, Y(h), 'pp-tick') + T(22, Y(h) + 3.5, `${h} KM`, 'pp-t');
  /* the column: billows along a trunk that leans with the wind, widening as it climbs, then the crown spreading
     downwind at 20 to 33 km; each billow shaded below and lit above */
  /** @type {[number, number, number][]} */ const puffs = [];
  for (let h = .5; h < 22; h += .22) { const w = 3 + h * 1.05, x = vx + h * h * .04 + (r() - .5) * w * 1.1; puffs.push([x, Y(h) + (r() - .5) * 3, w * (.32 + r() * .28)]); }
  for (let i = 0; i < 150; i++) { const t = Math.pow(r(), .8), h = 20.5 + r() * 12.5 - t * 3, x = vx + 10 + t * 150 + (h - 26) * 2.2, w = 7 + r() * 11 - t * 3; puffs.push([x, Y(h) + t * 10, w]); }
  puffs.sort((p, q) => q[1] - p[1]);
  /* each billow a dot of its own size (a round cap as wide as the billow), sized in a few steps so the column is a
     handful of paths: shaded below, lit above */
  const sizes = [4, 6, 8.5, 11.5, 15, 19];
  const layer = (/** @type {string} */ cls, /** @type {number} */ dx, /** @type {number} */ dy, /** @type {number} */ grow) => sizes.map((w, i) => { const mine = puffs.filter(([, , pw]) => pw <= w && (i === 0 || pw > sizes[i - 1])); return mine.length ? `<path class="${cls}" stroke-width="${f(2 * w * grow)}" d="${dotPath(mine.map(([x, y]) => [x + dx * w, y + dy * w]))}"/>` : ''; }).join('');
  const deep = layer('pp-deep', .18, .2, 1), shade = layer('pp-shade', 0, 0, 1), lit = layer('pp-lit', -.25, -.28, .62);
  b += `<g clip-path="url(#pp-rise)"><g class="pp-col">${deep}${shade}<g filter="url(#pp-soft)">${lit}</g></g></g>`;
  /* the pumice, falling downwind from the crown over Pompeii */
  let fall = '';
  for (let i = 0; i < 210; i++) { const y = Y(20) + Math.pow(r(), 1.3) * (g - Y(20) - 4), x = vx + 40 + r() * 175 + (y - Y(20)) * .3; if (x > W - 4) continue; fall += `M${f(x)} ${f(y)}l1.6 4.6`; }
  b += `<g class="pp-fall"><path class="pp-stone" d="${fall}"/></g>`;
  /* the land, the bay, the mountain (1.3 km, to scale) and Pompeii */
  b += `<path class="pp-sea" d="M0 ${g}H${vx - 26}V${H}H0Z"/><path class="pp-land" d="M${vx - 26} ${g}H${W}V${H}H${vx - 26}Z"/>`;
  b += `<path class="pp-mount" d="M${vx - 30} ${g}C${vx - 14} ${g - 4} ${vx - 6} ${Y(1.25)} ${vx - 2} ${Y(1.28)}H${vx + 2}C${vx + 6} ${Y(1.25)} ${vx + 16} ${g - 4} ${vx + 34} ${g}Z"/>`;
  const px = vx + 8 * km;
  b += `<path class="pp-town" d="M${f(px - 7)} ${g}v-4h3v-2h3v3h4v-5h3v4h2v4Z"/>`;
  b += L(px, g + 4, px, g + 10, 'pp-tick') + T(px, g + 21, 'POMPEII · 8 KM', 'pp-t', 'middle');
  b += L(10, Y(33), 18, Y(33), 'pp-tick') + T(22, Y(33) + 6, '33 km', 'pp-big');
  b += T(W - 18, H - 16, 'Like a pine tree, wrote Pliny', 'pp-note', 'end');
  b += `<path class="hit" data-read="The column: ash and pumice up to 33 km high" d="M${vx - 20} ${g}L${vx + 30} ${Y(20)}L${vx + 200} ${Y(20)}L${vx + 200} ${Y(34)}L${vx - 10} ${Y(34)}Z"/>`;
  b += `<circle class="hit" data-read="Pompeii, 8 km away, buried under 4 to 6 m of ash and pumice" cx="${f(px)}" cy="${g - 4}" r="14"/>`;
  return svg(W, H, 'Vesuvius erupting in AD 79, drawn to scale: a column of ash and pumice rising up to 33 km over a mountain barely more than one kilometre high, spreading at its top like a pine tree, as Pliny wrote, and dropping pumice on Pompeii 8 km away', b, 'pp', 'xMidYMid slice');
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

/* Venus flytraps: the trap from above, open, as the plant holds it: two lobes hinged on a midrib, red inside where the
   pigment gathers, rimmed with long teeth that lean inward, three trigger hairs on each lobe and beads of nectar along
   the rims, on a winged stalk. Its shape comes from src/shared/plates.js, so the page can close the same trap: touched
   twice within 20 seconds it snaps shut in about a tenth of a second, its teeth crossing like bars; at five touches it
   seals to digest. On its turn one hair pings, inviting a touch. */
/** the trap at an opening, as the parts the page updates as it closes @param {number} phi */
function trapParts(phi) {
  const v = trapView(phi, TRAP);
  return v.lobes.map((l, i) => ({ i, l, grad: `<linearGradient id="ft-g${i}" gradientUnits="userSpaceOnUse" x1="${l.across[0]}" y1="${l.across[1]}" x2="${l.across[2]}" y2="${l.across[3]}"><stop class="ft-deep" offset="0"/><stop class="ft-red" offset=".55"/><stop class="ft-edge" offset="1"/></linearGradient>` }));
}
function flytrap() {
  const v = trapView(TRAP.open, TRAP), parts = trapParts(TRAP.open);
  let b = `<defs>${parts.map(p => p.grad).join('')}</defs>`;
  b += `<path class="ft-stalk" d="${v.stalk}"/><path class="ft-vein" d="${v.vein}"/>`;
  for (const { i, l } of parts) {
    b += `<g class="ft-l${i}"><path class="ft-shell" d="${l.shell}"/><path class="ft-face${l.inside ? '' : ' ft-hid'}" fill="url(#ft-g${i})" d="${l.face}"/><path class="ft-rim" d="${l.rim}"/><path class="ft-teeth" d="${l.teeth}"/><path class="ft-hair" d="${l.hairs.map(h => h.d).join('')}"/><path class="ft-nectar" d="${l.nectar.map(([x, y]) => `M${x} ${y}h0`).join('')}"/></g>`;
  }
  b += `<path class="ft-hinge" d="${v.hinge}"/>`;
  /* the ping that invites a touch, on the back lobe's middle hair */
  const t = v.lobes[0].hairs[1].tip; b += C(t[0], t[1], 9, 'ft-ping');
  return svg(TRAP.W, TRAP.H, 'A Venus flytrap from above, open: two lobes red inside, rimmed with long teeth, three trigger hairs on each and beads of nectar on the rims, on a winged stalk', b, 'ft');
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

/* Fireworks: a night sky over a spectrum. Each metal's burst goes up from where its light falls on a ruler of
   wavelengths, 400 to 700 nm, and its lines mark the ruler like a fingerprint: copper blue, barium green, sodium
   yellow, calcium orange, strontium red. Copper's is the smallest: blue is the hardest. On first sight they go
   off in turn; pointing at one names it. */
const METALS = /** @type {[string, string, string, string, number[]][]} */ ([
  ['Cu', 'Copper', 'blue', '#5B7CFF', [428, 436, 446, 452]], ['Ba', 'Barium', 'green', '#3DDC84', [507, 513, 524, 532]],
  ['Na', 'Sodium', 'yellow', '#FFD21F', [589]], ['Ca', 'Calcium', 'orange', '#FF9433', [598, 606, 618]], ['Sr', 'Strontium', 'red', '#FF4459', [636, 646, 661, 674, 682]],
]);
/** @param {number} W @param {number} H @param {'w' | 'n'} v */
function fireworksSky(W, H, v) {
  const wide = v === 'w', x0 = 18, x1 = W - 18, ax = H - (wide ? 26 : 30), X = (/** @type {number} */ nm) => x0 + (nm - 400) / 300 * (x1 - x0), r = rng(wide ? 21 : 34);
  /* where each shell bursts and how big, copper's the smallest; each clear of the card's title */
  const sky = /** @type {Record<string, [number, number, number]>} */ (wide
    ? { Cu: [96, 17, 0], Ba: [62, 34, 1], Na: [52, 27, 2], Ca: [88, 24, 3], Sr: [58, 37, 4] }
    : { Cu: [118, 17, 0], Ba: [96, 30, 1], Na: [66, 24, 2], Ca: [150, 22, 3], Sr: [104, 32, 4] });
  let defs = `<linearGradient id="fw-sky-${v}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03040A"/><stop offset="1" stop-color="#0A1022"/></linearGradient><filter id="fw-glow-${v}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter><filter id="fw-haze-${v}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${wide ? 10 : 14}"/></filter>`;
  defs += `<linearGradient id="fw-sp-${v}" x1="0" y1="0" x2="1" y2="0">${[['#7A3CFF', 0], ['#3D5BFF', .12], ['#21B7E8', .28], ['#2FC76A', .42], ['#E8D21C', .6], ['#FF8A1F', .72], ['#F2334A', .86], ['#9C1020', 1]].map(([c, o]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  let b = `<rect width="${W}" height="${H}" fill="url(#fw-sky-${v})"/>`;
  /* the ruler of wavelengths the shells stand on */
  b += `<rect x="${x0}" y="${ax}" width="${x1 - x0}" height="2" fill="url(#fw-sp-${v})" opacity=".7"/>`;
  for (let nm = 400; nm <= 700; nm += 50) b += L(X(nm), ax + 2, X(nm), ax + 6, 'fw-ax') + (!wide && nm % 100 ? '' : T(X(nm), ax + 17, nm === 700 ? '700 NM' : String(nm), 'tn fw-t', nm === 400 ? 'start' : nm === 700 ? 'end' : 'middle'));
  let haze = '';
  for (const [sym, name, hue, col, lines] of METALS) {
    const [cy, R, order] = sky[sym], mid = (Math.min(...lines) + Math.max(...lines)) / 2, cx = X(mid), w = 1 + order * 3;
    defs += `<radialGradient id="fw-g-${sym}-${v}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 1.1)}"><stop offset="0" stop-color="${col}" stop-opacity="0"/><stop offset=".45" stop-color="${col}" stop-opacity=".25"/><stop offset="1" stop-color="${col}"/></radialGradient>`;
    haze += `<ellipse cx="${f(cx)}" cy="${f(cy + R * .3)}" rx="${f(R * 1.3)}" ry="${f(R * .9)}" fill="${col}"/>`;
    let g = '';
    /* its lines on the ruler, like a fingerprint, and the trail it rose by */
    g += `<path class="fw-line fade w${w + 3}" stroke="${col}" d="${lines.map(nm => `M${f(X(nm))} ${ax}v-9`).join('')}"/>`;
    g += `<path class="fw-trail dr w${w}" pathLength="1" stroke="${col}" d="M${f(cx)} ${ax - 12}V${f(cy + 5)}"/>`;
    /* the shell: stars flung out, their trails bending down as they fall, brightest at the ends */
    const n = sym === 'Cu' ? 18 : 30; let streaks = ''; /** @type {[number, number][]} */ const stars = [];
    for (let i = 0; i < n; i++) {
      const t = (i + r() * .6) / n * 2 * Math.PI, out = R * (.78 + r() * .22), sx = cx + Math.cos(t) * R * .12, sy = cy + Math.sin(t) * R * .12;
      const ex = cx + Math.cos(t) * out, ey = cy + Math.sin(t) * out + out * out / R * .22, mx = cx + Math.cos(t) * out * .62, my = cy + Math.sin(t) * out * .62 + out * .02;
      streaks += `M${f(sx)} ${f(sy)}q${f(mx - sx)} ${f(my - sy)} ${f(ex - sx)} ${f(ey - sy)}`; stars.push([ex, ey]);
    }
    g += `<path class="fw-burst dr w${w + 2}" pathLength="1" stroke="url(#fw-g-${sym}-${v})" d="${streaks}"/>`;
    g += `<g class="fade w${w + 4}"><use class="fw-blur" href="#fw-h-${sym}-${v}" filter="url(#fw-glow-${v})"/><path id="fw-h-${sym}-${v}" class="fw-head" stroke="${col}" d="${dotPath(stars)}"/></g>`;
    g += `<circle class="hit" data-read="${name} · ${hue} · ${lines.length > 1 ? `lines at ${lines[0]}–${lines[lines.length - 1]} nm` : `its line at ${lines[0]} nm`}" cx="${f(cx)}" cy="${f(cy)}" r="${f(R + 8)}"/>`;
    const lx = sym === 'Na' ? cx - R - 6 : sym === 'Ca' ? cx + R + 6 : cx, ly = sym === 'Na' || sym === 'Ca' ? cy + 4 : sym === 'Sr' && !wide ? cy - R - 7 : cy + R + 13;
    g += T(lx, ly, sym, `fw-sym fade w${w + 4}`, sym === 'Na' ? 'end' : sym === 'Ca' ? 'start' : 'middle');
    b += `<g class="fw-m">${g}</g>`;
  }
  /* a little smoke hangs where each shell went off, lit in its colour */
  b = b.replace(/^<rect[^>]*>/, m => `${m}<g class="fw-haze" filter="url(#fw-haze-${v})">${haze}</g>`);
  const [cuY, cuR] = sky.Cu; b += wide ? T(X(440) + cuR + 10, cuY - 2, 'Blue: the hardest', 'fw-note fade w7') : T(x0, cuY + cuR + 31, 'Blue: the hardest', 'fw-note fade w7');
  return svg(W, H, 'Fireworks in a night sky over a ruler of visible light from 400 to 700 nanometres: each metal’s shell bursts above its own lines, copper in the blue (the smallest, blue being the hardest), barium in the green, sodium in the yellow, calcium in the orange and strontium in the red', `<defs>${defs}</defs>${b}`, `vz-${v} fw`, 'xMidYMid slice');
}
const fireworks = () => fireworksSky(745, 168, 'w') + fireworksSky(360, 240, 'n');

/* Infinity: Cantor's diagonal, on a list that never ends. Any list of numbers between 0 and 1, numbered 1, 2, 3 and on
   (here a half, √2 − 1, e − 2, a third, a seventh, π − 3 and other old friends), lies like a table running off into the
   distance. Change digit n of row n, each one up by one, and the number you build differs from every row, so it is on no
   list: there are more numbers than there are counting numbers. On its turn the diagonal lights from near to far and
   the new number's digits drop into place. */
const CANTOR = ['500000000000', '414213562373', '718281828459', '333333333333', '142857142857', '141592653589', '618033988749', '732050807568'];
function cantor() {
  const W = 365, H = 350, hy = 40, K = 206, vpx = 352, cw = 17, rows = CANTOR.length;
  /** where a digit of the table lands, in perspective: column c (0 is the "0." before the point), row n, and how big;
      the rows run back toward a vanishing point up to the right */
  const at = (/** @type {number} */ c, /** @type {number} */ n) => { const z = 1 + (n - 1) * .27, X = 60 + c * cw; return { x: vpx + (X - vpx) / z, y: hy + K / z, k: 1 / z }; };
  let b = '';
  for (let n = rows; n >= 1; n--) {
    const row = CANTOR[n - 1], { y, k } = at(0, n), fade = Math.max(.14, 1 - (n - 1) * .13);
    const lx = vpx + (22 - vpx) * k;
    let g = `<text class="in-n" x="${f(lx)}" y="${f(y)}" font-size="${f(11 * k)}" opacity="${f(fade)}">${n}</text><text class="in-0" x="${f(at(0, n).x + 6 * k)}" y="${f(y)}" font-size="${f(12.5 * k)}" opacity="${f(fade)}" text-anchor="end">0.</text>`;
    for (let c = 1; c <= 12; c++) {
      const p = at(c, n); if (p.x > W + 10) break;
      const diag = c === n;
      if (diag) g += `<rect class="in-cell in-d${n}" x="${f(p.x - 6.5 * k)}" y="${f(y - 11 * k)}" width="${f(13 * k)}" height="${f(14.5 * k)}" rx="${f(3 * k)}"/>`;
      g += `<text class="in-g${diag ? ' in-on' : ''}" x="${f(p.x)}" y="${f(y)}" font-size="${f(12.5 * k)}" opacity="${f(fade)}" text-anchor="middle">${row[c - 1]}</text>`;
    }
    b += `<g class="in-row in-r${n}">${g}</g>`;
  }
  /* the rows run on */
  b += `<text class="in-more" x="${f(vpx + (22 - vpx) * at(0, rows).k)}" y="${f(at(0, rows).y - 8)}">⋮</text>`;
  /* the new number, built along the diagonal, each digit one up */
  const ny = H - 34;
  b += L(18, ny - 26, W - 18, ny - 26, 'in-rule');
  b += `<text class="in-new" x="18" y="${ny}">0.</text>`;
  CANTOR.forEach((r, i) => { b += `<text class="in-new in-nd fade w${3 + i}" x="${f(44 + i * 15)}" y="${ny}" text-anchor="middle">${(+r[i] + 1) % 10}</text>`; });
  b += `<text class="in-new" x="${f(44 + CANTOR.length * 15)}" y="${ny}">…</text>` + T(W - 18, ny, 'On no list', 'in-tag fade w13', 'end');
  b += T(18, H - 14, 'Digit n differs from row n’s, for every n', 'in-note fade w14');
  b += `<rect class="hit" data-read="Any list of numbers between 0 and 1, numbered 1, 2, 3 and on for ever" x="0" y="0" width="${W}" height="${ny - 36}"/><rect class="hit" data-read="Built from the diagonal, a digit up each time: it differs from every row" x="0" y="${ny - 26}" width="${W}" height="${H - ny + 26}"/>`;
  return svg(W, H, 'Cantor’s diagonal: a list of numbers between 0 and 1, numbered 1, 2, 3 and running off into the distance, its diagonal digits lit, and below it a new number built from them, each digit one more, which differs from every row and so is on no list', b, 'in', 'xMidYMid slice');
}

/* Origami: a sheet in Miura's fold, the fold that opened the Space Flyer Unit's solar array in one pull, lit from the
   upper left over its shadow on the table. Its faces are computed for the fold's one angle (src/shared/plates.js), so the
   page can move the same sheet: on its turn the folded block pulls open, and pointing across the card folds and unfolds
   it, the only motion it has. Each face is one of four ways round, and the build writes how dark each is at rest
   (PLATE_CSS); the page changes those while it moves. A phone gets its own camera. */
/** @param {'w' | 'n'} v */
function origamiPlate(v) {
  const C = FOLD.cams[v], { faces, shadow } = foldView(FOLD.rest, v);
  let b = `<defs><filter id="mi-blur-${v}" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="9"/></filter></defs>`;
  b += `<path class="mi-shadow" filter="url(#mi-blur-${v})" d="${shadow}"/>`;
  /* the faces themselves the page lays (it moves them anyway): one path for each */
  b += `<g class="mi-sheet" data-faces="${faces.length}"></g>`;
  b += T(v === 'w' ? 18 : 18, C.H - 16, 'MIURA FOLD', 'mi-l');
  return svg(C.W, C.H, 'A sheet of paper in Miura’s fold, a zigzag of parallelograms that opens and closes in a single motion, as it opened a satellite’s solar array', b, `vz-${v} mi`);
}
const origami = () => origamiPlate('w') + origamiPlate('n');

/* Atlantis: the ringed city drawn to Plato's own measurements (Critias, in Jowett's translation), as a model seen from
   the south and above: an island 5 stadia across, then rings of sea and land 1, 2, 2, 3 and 3 stadia wide, the
   outermost sea the harbour; the land standing above the sea, with a racecourse round the largest ring; the temple of
   Poseidon, a stadion by half; and the canal, 300 feet wide, leading in from the sea 50 stadia away. Its three walls
   are in Plato's metals: brass round the outer land, tin round the inner, and round the citadel orichalcum, which
   "flashed with the red light". On its turn the city rises from the island outward and the orichalcum catches the light.
   Pointing names each ring with its width. */
/** dots, terse, in a path of their own class @param {[number, number][]} p @param {string} c */
const dotsPath = (p, c) => `<path class="${c}" d="${dotPath(p)}"/>`;
function atlantis() {
  const W = 365, H = 350, cx = 182, cy = 190, k = 12.6, el = 34 * Math.PI / 180, se = Math.sin(el), ce = Math.cos(el);
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
  let b = `<defs>${clip('at-h0', 13.5, LAND)}${clip('at-h1', 7.5, LAND)}${clip('at-h2', 3.5, LAND)}<linearGradient id="at-fadeg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff"/></linearGradient><mask id="at-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#at-fadeg)"/></mask></defs>`;
  /* the plain round the city, fading toward the card's top */
  b += `<g class="at-lv at-l4" mask="url(#at-fade)">${dotsPath(stipple(13.5, 24, LAND, 1.3, () => false, 15), 'at-stip at-plain')}</g>`;
  /* the canal, leading in from the sea, south, to the harbour */
  const cw = .25 * k;
  b += `<g class="at-lv at-l3"><rect class="at-water" x="${f(cx - cw)}" y="${f(yAt(LAND) + 13.5 * se * k - 2)}" width="${f(2 * cw)}" height="${H}"/><path class="at-canal" d="M${f(cx - cw)} ${f(yAt(LAND) + 13.5 * se * k)}V${H}M${f(cx + cw)} ${f(yAt(LAND) + 13.5 * se * k)}V${H}"/></g>`;
  /* the harbour, and everything inside it */
  let h0 = `<path class="at-cliff" d="${far(13.5, 0, LAND)}"/>` + `<path class="at-water" d="${ell(13.5, 0)}"/>` + sea(13.5);
  /* the largest ring of land: its face toward you, its top with the racecourse, its brass wall */
  let ring2 = `<path class="at-cliff" d="${near(10.5, 0, LAND)}"/><path class="at-top" fill-rule="evenodd" d="${ell(10.5, LAND)}${ell(7.5, LAND)}"/>` + dotsPath(stipple(7.5, 10.5, LAND, 15, r => r > 8.5 && r < 9.5), 'at-stip') + `<path class="at-track" d="${ell(8.5, LAND)}${ell(9.5, LAND)}"/>`;
  ring2 += `<path class="at-wall at-brass" d="${near(10.5, LAND, LAND + WALL)}"/><path class="at-rim at-brass-l" d="${ell(10.5, LAND + WALL)}"/>`;
  /* the sea inside each ring is the harbour's own, drawn once beneath them all: only the far walls are new */
  let h1 = `<path class="at-cliff" d="${far(7.5, 0, LAND)}"/>`;
  let ring1 = `<path class="at-cliff" d="${near(5.5, 0, LAND)}"/><path class="at-top" fill-rule="evenodd" d="${ell(5.5, LAND)}${ell(3.5, LAND)}"/>` + dotsPath(stipple(3.5, 5.5, LAND, 18), 'at-stip');
  ring1 += `<path class="at-wall at-tin" d="${near(5.5, LAND, LAND + WALL)}"/><path class="at-rim at-tin-l" d="${ell(5.5, LAND + WALL)}"/>`;
  let h2 = `<path class="at-cliff" d="${far(3.5, 0, LAND)}"/>`;
  /* the citadel: higher than the rings, walled in orichalcum, with Poseidon's temple, a stadion by half, facing you */
  let isle = `<path class="at-cliff" d="${near(2.5, 0, CIT)}"/><path class="at-top" d="${ell(2.5, CIT)}"/>` + dotsPath(stipple(.9, 2.5, CIT, 22), 'at-stip');
  isle += `<path class="at-wall at-ori" d="${near(2.5, CIT, CIT + WALL)}"/><path class="at-rim at-ori-l" d="${ell(2.5, CIT + WALL)}"/><path class="at-glint" pathLength="1" d="${ell(2.5, CIT + WALL)}"/>`;
  const tw = .25 * k, tz = yAt(CIT), td = .5 * se * k, th = .45 * ce * k;
  isle += `<path class="at-temple-top" d="M${f(cx - tw)} ${f(tz - td - th)}H${f(cx + tw)}V${f(tz + td - th)}H${f(cx - tw)}Z"/><path class="at-temple" d="M${f(cx - tw)} ${f(tz + td - th)}H${f(cx + tw)}V${f(tz + td)}H${f(cx - tw)}Z"/>`;
  /* each hole holds the rest, clipped to its rim; the city rises level by level from the island out, so the levels
     fade in as groups of their own, never inside one another's */
  h2 = `<g class="at-lv at-l1">${h2}</g><g class="at-lv at-l0">${isle}</g>`;
  h1 = `<g class="at-lv at-l2">${h1}</g><g class="at-lv at-l1">${ring1}</g><g clip-path="url(#at-h2)">${h2}</g>`;
  h0 = `<g class="at-lv at-l3">${h0}</g><g class="at-lv at-l2">${ring2}</g><g clip-path="url(#at-h1)">${h1}</g>`;
  b += `<g clip-path="url(#at-h0)">${h0}</g>`;
  /* the plain's own edge round the harbour */
  b += `<path class="at-shore" d="${ell(13.5, LAND)}"/>`;
  /* the scale, in Plato's unit, and whose numbers these are */
  b += G('at-scale', L(18, H - 22, 18 + 5 * k, H - 22, 'a') + L(18, H - 26, 18, H - 18, 'a') + L(18 + 5 * k, H - 26, 18 + 5 * k, H - 18, 'a') + T(18, H - 30, '5 STADIA') + T(W - 18, H - 18, 'AFTER PLATO, CRITIAS', 'at-src', 'end'));
  /* what pointing at each part reads, the most particular on top */
  const band = (/** @type {number} */ a, /** @type {number} */ z, /** @type {number} */ h) => `${ell(z, h)}${ell(a, h)}`;
  const hits = /** @type {[number, number, number, string][]} */ ([[10.5, 13.5, 0, 'The harbour: a ring of sea 3 stadia wide'], [7.5, 10.5, LAND, 'A ring of land 3 stadia wide, with a racecourse, walled in brass'], [5.5, 7.5, 0, 'A ring of sea 2 stadia wide'], [3.5, 5.5, LAND, 'A ring of land 2 stadia wide, walled in tin'], [2.5, 3.5, 0, 'A ring of sea a stadion wide']]);
  b += hits.map(([a, z, h, t]) => `<path class="hit" fill-rule="evenodd" data-read="${t}" d="${band(a, z, h)}"/>`).join('');
  b += `<rect class="hit" data-read="The canal from the sea: 300 feet wide, 100 deep, 50 stadia long" x="${f(cx - cw - 3)}" y="${f(yAt(LAND) + 13.5 * se * k)}" width="${f(2 * cw + 6)}" height="${H}"/>`;
  b += `<path class="hit" data-read="The citadel, 5 stadia across, its wall of orichalcum that “flashed with the red light”" d="${ell(2.5, CIT)}"/>`;
  return svg(W, H, 'The ringed city of Atlantis as a model drawn to Plato’s measurements: an island 5 stadia across with Poseidon’s temple, rings of sea and land 1, 2, 2, 3 and 3 stadia wide, walls of orichalcum, tin and brass, a racecourse, and the canal leading in from the sea', b, 'at');
}

/* Magnets: iron filings round a bar magnet, each lying along the field where it fell (src/shared/plates.js: the bar's
   poles as two charges just inside its ends), gathered where the field is strong and a little scattered where it is
   weak. The page draws the filings on a canvas, since there are some 1,800 and they move: on its turn they swing from
   scattered into line, rippling out from the bar, and with a mouse the pointer is a pole they turn toward. */
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
  return `<img class="nl-img" src="/api/picture?f=b%2Fb1%2F2024-10-10_Red_and_Green_Aurora_Borealis_over_Luray_VA_22-08-35_1.jpg&amp;w=1280" alt="The northern lights over Luray, Virginia: red light high above a band of green" width="1280" height="853" fetchpriority="low"><div class="nl-scale" role="img" aria-label="A scale of height from 0 to 500 km: red light from oxygen, at 630 nm, highest, above about 300 km; green light from oxygen, at 557.7 nm, from about 100 to 300 km"><i class="nl-ax"></i>${ticks}<b class="nl-km">KM</b><i class="nl-band nl-red"></i><i class="nl-band nl-green"></i><p class="nl-lab nl-lr"><b>Oxygen</b>630 nm</p><p class="nl-lab nl-lg"><b>Oxygen</b>557.7 nm</p></div>`;
}

/* Enigma machine: the card is the machine's top, black in either theme: three rotor windows on their ivory rings, the
   lampboard and the keyboard in its own QWERTZ rows. Tap a key or type, and the lamp it becomes lights; it is never the
   key's own. Beside it, a paper tape of your letters over the lamps they lit, and a tally of how many lit themselves
   (none, ever). The page wires it up; the cipher is src/shared/enigma.js. */
const QWERTZ = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'];
function enigmaBoard() {
  const strip = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZA'].map(c => `<i>${c}</i>`).join('');
  const rotors = [0, 1, 2].map(() => `<span class="en-rw" data-at="A"><b class="en-strip">${strip}</b></span>`).join('');
  const lamps = QWERTZ.map(r => `<p>${[...r].map(c => `<i data-l="${c}">${c}</i>`).join('')}</p>`).join('');
  const keys = QWERTZ.map(r => `<p>${[...r].map(c => `<button type="button" data-k="${c}" aria-label="${c}">${c}</button>`).join('')}</p>`).join('');
  return `<div class="en" role="group" aria-label="An Enigma machine: tap its keys or type"><div class="en-r" aria-label="Rotor positions">${rotors}</div><div class="en-lamps" aria-hidden="true">${lamps}</div><div class="en-keys">${keys}</div></div>`;
}
const ENIGMA_TAPE = `<div class="en-tape"><label class="en-in"><span>IN</span><input type="text" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Type a word to encrypt"><b class="en-pl" aria-hidden="true"></b></label><p><span>OUT</span><b class="en-cy" aria-live="polite"></b></p></div><p class="en-tally"><b class="en-n">0</b><span>of <i class="en-of">0</i> letters lit themselves</span></p>`;

/** @typedef {{ t: string, size: 'hero' | 'tall' | 'sq' | 'wide' | 'small' | 'big', tab?: 'wide' | 'sq' | 'big' | 'tall', art: () => string, more?: string, fx?: string, credit?: string, hook?: string, beat?: number, night?: boolean, src: string[] }} Card */
/** The cards, in the order the page lays them out (the map of threads sits before Fireworks). A card's hook is its
    topic's unless it says otherwise; it goes with the card's link (and the placeholder and the writer's brief), not on
    the card, which shows only its drawing, its kind and its title (Will, 2026-10-16). beat: how long its entrance
    runs, in ms, so the next card waits its turn. night: dark in either theme. @type {Card[]} */
export const CARDS = [
  { t: 'Black holes', size: 'hero', night: true, beat: 1700, hook: 'Light bends so far round one that you see the far side of its disk, over the top.', art: blackHoles, src: ['https://en.wikipedia.org/wiki/Black_hole', 'https://blogs.nature.com/aviewfromthebridge/2017/03/'] },
  { t: 'Northern lights', size: 'tall', tab: 'sq', night: true, beat: 900, art: aurora, credit: 'G. Edward Johnson · CC BY 4.0', src: ['https://science.nasa.gov/earth/earth-observatory/auroras-dancing-in-the-night', 'https://en.wikipedia.org/wiki/Aurora', 'https://commons.wikimedia.org/wiki/File:2024-10-10_Red_and_Green_Aurora_Borealis_over_Luray_VA_22-08-35_1.jpg'] },
  { t: 'Origami', size: 'big', fx: 'origami', beat: 1500, art: origami, src: ['https://en.wikipedia.org/wiki/Miura_fold'] },
  { t: 'Atlantis', size: 'sq', beat: 1700, hook: 'Plato gave its rings in stadia: an island 5 across, then rings of sea and land 1, 2 and 3 wide.', art: atlantis, src: ['https://www.gutenberg.org/files/1571/1571-h/1571-h.htm', 'https://en.wikipedia.org/wiki/Atlantis'] },
  { t: 'Venus flytraps', size: 'sq', tab: 'big', fx: 'flytrap', beat: 900, art: flytrap, src: ['https://en.wikipedia.org/wiki/Venus_flytrap'] },
  { t: 'Magnets', size: 'sq', fx: 'magnets', beat: 1400, art: magnets, src: ['https://en.wikipedia.org/wiki/Magnetic_field', 'https://en.wikipedia.org/wiki/Iron_filings'] },
  { t: 'Rubik’s Cube', size: 'sq', beat: 1300, hook: 'Its pieces fit together in 43,252,003,274,489,856,000 ways, each at most 20 moves from solved.', art: rubik, src: ['https://en.wikipedia.org/wiki/Rubik%27s_Cube', 'https://www.cube20.org/'] },
  { t: 'Fireworks', size: 'wide', night: true, beat: 1700, art: fireworks, src: ['https://en.wikipedia.org/wiki/Fireworks', 'https://www.aps.org/apsnews/2026/06/the-showy-science-of-fireworks'] },
  { t: 'Lightning', size: 'tall', tab: 'sq', night: true, beat: 1700, art: () => lightning(), src: ['https://en.wikipedia.org/wiki/Lightning', 'https://www.weather.gov/safety/lightning-science-thunder'] },
  { t: 'Giant squid', size: 'sq', beat: 1400, art: squid, src: ['https://en.wikipedia.org/wiki/Giant_squid'] },
  { t: 'Pompeii', size: 'sq', beat: 1700, hook: 'Pliny watched its cloud rise like a pine tree, up to 33 km high, from 29 km across the bay.', art: pompeii, src: ['https://en.wikipedia.org/wiki/Eruption_of_Mount_Vesuvius_in_79_AD', 'https://en.wikipedia.org/wiki/Pompeii'] },
  { t: 'Enigma machine', size: 'big', fx: 'enigma', night: true, beat: 2100, hook: 'It never turned a letter into itself, and that flaw helped break it. Try it.', art: enigmaBoard, more: ENIGMA_TAPE, src: ['https://en.wikipedia.org/wiki/Cryptanalysis_of_the_Enigma', 'https://en.wikipedia.org/wiki/Enigma_machine', 'https://www.pbs.org/wgbh/nova/article/how-enigma-works'] },
  { t: 'Infinity', size: 'sq', beat: 1400, hook: 'Some infinities are bigger than others, and Cantor’s diagonal shows why.', art: cantor, src: ['https://en.wikipedia.org/wiki/Cantor%27s_diagonal_argument'] },
];

/** Rules the build adds to /front.css, computed from the drawings so they never disagree: how dark each of the
    Origami sheet's four kinds of face is at rest, and how far each of the cube's pieces moves to join the others. */
export function plateCss() {
  const { faces } = foldView(FOLD.rest, 'w'), s = [0, 1, 2, 3].map(o => (faces.find(f => f.o === o)?.s || 0).toFixed(3));
  return `.vz.mi{${s.map((v, o) => `--s${o}:${v}`).join(';')}}${rubikCss()}`;
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
