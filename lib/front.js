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

/* ---------- drawing: hairline SVG, coloured only through the theme (see .vz in src/front.css) ----------
   Each card's drawing is composed for its own plate. A card tells its story once, when first seen: a path made
   with D draws itself in, and parts classed vpop or fade come in after it (the card's own rules in front.css set
   when). The finished drawing is what shows without motion. A wide card also draws a phone version (vz-n). */
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
const P = (/** @type {string} */ d, c = 'h') => `<path class="${c}" d="${d}"/>`;
/** a path that draws itself in when its card is first seen */
const D = (/** @type {string} */ d, c = 'k') => `<path class="${c} dr" pathLength="1" d="${d}"/>`;
/** @param {number} x @param {number} y @param {number} w @param {number} h */
const R = (x, y, w, h, c = 'h', rx = 0) => `<rect class="${c}" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"${rx ? ` rx="${rx}"` : ''}/>`;
const G = (/** @type {string} */ c, /** @type {string} */ body) => `<g class="${c}">${body}</g>`;
/** a dimension line with end ticks @param {number} x1 @param {number} x2 @param {number} y */
const dim = (x1, x2, y, c = 'a') => L(x1, y, x2, y, c) + L(x1, y - 4, x1, y + 4, c) + L(x2, y - 4, x2, y + 4, c);
/** a vertical dimension line @param {number} x @param {number} y1 @param {number} y2 */
const vdim = (x, y1, y2, c = 'a') => L(x, y1, x, y2, c) + L(x - 4, y1, x + 4, y1, c) + L(x - 4, y2, x + 4, y2, c);
const pts = (/** @type {[number, number][]} */ p) => p.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('');
/** dots, as zero-length strokes with round ends (the class sets their size) */
const dots = (/** @type {[number, number][]} */ p, /** @type {string} */ c) => `<path class="${c}" d="${p.map(([x, y]) => `M${f(x)} ${f(y)}h0`).join('')}"/>`;
/** a polyline with the points it doesn't need dropped (Ramer–Douglas–Peucker, to within tol)
    @param {[number, number][]} p @returns {[number, number][]} */
function simplify(p, tol = .25) {
  if (p.length < 3) return p;
  const [a, b] = [p[0], p[p.length - 1]], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  let far = 0, at = 0;
  for (let i = 1; i < p.length - 1; i++) { const d = Math.abs(dy * p[i][0] - dx * p[i][1] + b[0] * a[1] - b[1] * a[0]) / len; if (d > far) { far = d; at = i; } }
  return far <= tol ? [a, b] : [...simplify(p.slice(0, at + 1), tol).slice(0, -1), ...simplify(p.slice(at), tol)];
}
/** the same random-looking numbers every build, so a drawing never changes unless its code does */
const rng = (/** @type {number} */ seed) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

/* Black holes: the hole and its disk of gas as Luminet first drew one, in 1979, computed the same way (lib/plates/
   blackhole.js): every dot placed by tracing light back to the disk round the hole. Seen from 10° above the disk, its
   far side shows bent up over the top, the side coming toward you shines brighter, and a thin ring of light that went
   round the hole hugs the shadow. Night in either theme. On its turn the curves of equal radius trace in, the dots fill
   from the hole outward, and the curves fade to a whisper. Pointing names each part. */
/** dots as zero-length strokes, each a short move from the last (a drawing's biggest part, so kept terse)
    @param {[number, number, ...number[]][]} p */
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

/* Volcanoes: Krakatoa's pressure wave on a barograph's chart, passing seven times in five days. The chart's
   time lines are arcs, because the pen swings on an arm; its days are printed along the foot (27 August 1883
   was a Monday). On first sight the pen draws the five days, numbering each pass as it reaches it. */
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
/** @param {number} W @param {number} H @param {'w' | 'n'} v */
function krakatoa(W, H, v) {
  const top = 20, bot = H - 22, x0 = 0, x1 = W, hours = 120, px = (x1 - x0) / hours, base = top + (bot - top) * .62, armR = (bot - top) * 1.7;
  const passes = [[11, 30], [28, 21], [47, 17], [63, 12], [83, 10], [99, 7], [117, 5.5]].map(([h, a]) => [h, a * (bot - top) / 98]);
  let b = '';
  b += R(x0, top, x1 - x0, bot - top, 'vk-sheet');
  for (let y = top; y <= bot + .1; y += (bot - top) / 14) b += L(x0, y, x1, y, 'hp');
  /* an arc every six hours, heavier at midnight */
  for (let h = 6; h < hours; h += 6) { const x = x0 + h * px; b += P(`M${f(x)} ${top}A${f(armR)} ${f(armR)} 0 0 0 ${f(x)} ${bot}`, h % 24 ? 'hp' : 'h'); }
  b += L(x0, top, x1, top, 'h') + L(x0, bot, x1, bot, 'a');
  for (let d = 0; d < 5; d++) { const wd = new Date(Date.UTC(1883, 7, 27 + d)); b += T(x0 + (d + .5) * 24 * px, H - 6, `${DAYS[wd.getUTCDay()]} ${wd.getUTCDate()}`, 'tn', 'middle'); }
  /* the trace: a gentle twice-daily tide in the air, and the wave's seven passes, each smaller */
  /** @type {[number, number][]} */ const p = [];
  /** @type {number[]} */ const at = [];
  let len = 0;
  for (let t = 0; t <= hours; t += .25) {
    let y = Math.sin((t - 4) / 12 * 2 * Math.PI) * 1.4 + Math.sin(t * .9) * .35;
    for (const [s, a] of passes) { const u = t - s; if (u > -.5 && u < 4) y += u < .5 ? -a * Math.sin((u + .5) * Math.PI / 2) : u < 1.6 ? -a * Math.cos((u - .5) / 1.1 * Math.PI) * (u < 1.05 ? 1 : .6) : a * .6 * Math.exp(-(u - 1.6) * 1.4) * Math.cos((u - 1.6) * 1.3); }
    const q = /** @type {[number, number]} */ ([x0 + t * px, base + y]); if (p.length) len += Math.hypot(q[0] - p[p.length - 1][0], q[1] - p[p.length - 1][1]); p.push(q);
    for (const [s] of passes) if (Math.abs(t - (s + .5)) < .01) at.push(len);
  }
  b += `<path class="k vk-trace dr" pathLength="1" d="${pts(simplify(p, .2))}"/>`;
  /* each pass numbered over its peak, appearing as the pen reaches it (the trace takes 1.6 s) */
  passes.forEach(([s, a], i) => { const x = x0 + (s + .5) * px, y = base - a - 11; b += G(`vpop w${Math.max(1, Math.round(at[i] / len * 16))}`, C(x, y, 6.5, 'vk-pin') + T(x, y + 3.2, String(i + 1), 'tn vk-n', 'middle')); });
  b += T(0, 9, v === 'n' ? 'KRAKATOA · AUG 1883' : 'KRAKATOA · AUGUST 1883 · AIR PRESSURE', '') + T(W, 9, '7 PASSES IN 5 DAYS', 'tk', 'end');
  return svg(W, H, 'A barograph chart of air pressure over five days from Monday 27 August 1883, with Krakatoa’s pressure wave passing seven times, each pass smaller', b, `vz-${v}`);
}
const volcanoes = () => krakatoa(451, 136, 'w') + krakatoa(330, 150, 'n');

/* Pompeii: the 2018 note's date as it was written, in charcoal on the wall's plaster, XVI K NOV, and what it
   reads as; then the calendar with all three dates, since the sources disagree (none is struck through) */
function pompeii() {
  const W = 365, H = 236, r = rng(11);
  const j = (/** @type {number} */ n) => f(n + (r() - .5) * 2.4);
  /* the plaster, its edge a little broken */
  const wx = 18, wy = 6, ww = 212, wh = 90; let edge = `M${wx} ${wy}`;
  for (let x = wx + 12; x <= wx + ww; x += 12) edge += `L${Math.min(x, wx + ww)} ${j(wy)}`;
  for (let y = wy + 12; y <= wy + wh; y += 12) edge += `L${j(wx + ww)} ${Math.min(y, wy + wh)}`;
  for (let x = wx + ww - 12; x >= wx; x -= 12) edge += `L${Math.max(x, wx)} ${j(wy + wh)}`;
  for (let y = wy + wh - 12; y > wy; y -= 12) edge += `L${j(wx)} ${y}`;
  edge += 'Z';
  let b = `<defs><filter id="pp-tx" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .32 0 0 0 0 .27 0 0 0 0 .2 0 0 0 .55 -.1"/><feComposite in2="SourceGraphic" operator="in"/></filter><filter id="pp-ch" x="-4%" y="-8%" width="108%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/></filter></defs>`;
  b += P(edge, 'pp-wall') + `<path class="pp-wall" filter="url(#pp-tx)" d="${edge}"/>`;
  /* XVI K NOV, stroke by stroke as a hand would write it */
  const letters = /** @type {[string[], number][]} */ ([
    [['M0 0L19 40', 'M19 1L1 40'], 26], [['M0 1L9.5 40L19 0'], 50], [['M2 0L2 40'], 74],
    [['M1 0L1 40', 'M18 1L2 23', 'M7 16L19 40'], 103],
    [['M0 40L0 1L18 40L18 0'], 147], [['M9.5 0C21 0 21 40 9.5 40C-2 40 -2 0 9.5 0'], 173], [['M0 0L9.5 40L19 1'], 199],
  ]);
  let ch = '', k = 0;
  for (const [strokes, x] of letters) for (const d of strokes) { const moved = d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, a, c) => `${j(+a + x)} ${j(+c + 31)}`); ch += `<path class="pp-ch dr w${1 + Math.floor(k++ * .75)}" pathLength="1" d="${moved}"/>`; }
  b += `<g filter="url(#pp-ch)">${ch}</g>`;
  /* what it says */
  b += G('fade w9', T(248, 30, 'The 16th day', 'tc') + T(248, 45, 'before the calends', 'tc') + T(248, 60, 'of November:', 'tc') + `<text class="tf pp-date" x="248" y="86">17 Oct</text>`);
  /* the calendar, August to mid-November */
  const x0 = 18, x1 = 347, days = 106, X = (/** @type {number} */ d) => x0 + d * (x1 - x0) / days, y = 182;
  b += L(x0, y, x1, y, 'a');
  for (let d = 0; d <= days; d += 7) b += L(X(d), y - 2.5, X(d), y + 2.5, 'h');
  [[0, 'AUG'], [31, 'SEP'], [61, 'OCT'], [92, 'NOV']].forEach(([d, m]) => { b += L(X(+d), y, X(+d), y + 8, 'a') + T(X(+d) + 4, y + 17, String(m)); });
  const aug = X(23), oct = X(77);
  b += L(aug, y - 5, aug, y - 12, 'a') + C(aug, y, 4, 'sf') + T(aug, y - 17, 'TEXTBOOK · 24 AUG', '', 'middle');
  b += L(X(84), y, X(92), y, 'kk') + L(X(88), y + 5, X(88), y + 27, 'kt') + T(x1, y + 35, '2022 STUDY · 24 OCT–1 NOV', 'tk', 'end');
  b += `<line class="a pp-lead fade w10" x1="${f(oct)}" y1="96" x2="${f(oct)}" y2="${y - 7}" stroke-dasharray="2 3"/>`;
  b += G('vpop w11', P(`M${f(oct)} ${y - 5}L${f(oct + 5)} ${y}L${f(oct)} ${y + 5}L${f(oct - 5)} ${y}Z`, 'if')) + T(oct - 7, y - 17, 'NOTE · 17 OCT', 'tb fade w11', 'end');
  return svg(W, H, 'A note in charcoal on plaster dated XVI K NOV, the 16th day before the calends of November, that is 17 October; below it a calendar from August to November with the textbook date, 24 August, the note’s 17 October, and a 2022 study’s window, 24 October to 1 November', b, 'pp');
}

/* Time travel: a timing board of what relativity does to a GPS satellite's clock each day (speed slows it
   7.2 µs, weaker gravity speeds it up 45.8, so it gains 38.6), and below it, ticking while it's on screen, how
   far an uncorrected clock and map would have drifted since this page opened (38.6 µs and about 11.4 km a day) */
function timeTravel() {
  /* Doto's own point reads as a comma, so the point is set in the interface face */
  const row = (/** @type {string} */ c, /** @type {string} */ l, /** @type {string} */ v) => `<p class="tt-row ${c}"><span class="tt-l">${l}</span><span class="tt-bar"><i></i></span><b>${v.replace('.', '<i>.</i>')}</b></p>`;
  const ticks = [0, 10, 20, 30, 40, 50].map(n => `<span>${n}</span>`).join('');
  return `<div class="tt" role="img" aria-label="Each day a GPS satellite’s speed slows its clock by 7.2 microseconds and the weaker gravity up there speeds it by 45.8, so it gains 38.6 microseconds a day">${row('tt-sp', 'SPEED', '−7.2')}${row('tt-gr', 'GRAVITY', '+45.8')}${row('tt-net', 'NET', '+38.6')}<p class="tt-ax"><span class="tt-l"></span><span class="tt-ticks">${ticks}</span><b>µs/day</b></p></div><p class="tt-live"><span>Uncorrected since you opened this page</span><b class="tt-ns">+0<i>.</i>0</b><em>ns</em><b class="tt-m">0<i>.</i>0</b><em>m off</em></p>`;
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

/* Quicksand: a section through wet sand, a person floating in it waist-deep (above the surface in ink, below it
   dashed), why (it is twice as dense as you), and what it costs to pull a foot out. On first sight the person
   sinks from standing until the sand holds them at the waist. */
function quicksand() {
  const W = 365, H = 232, sy = 104, px = 246, r = rng(5);
  let b = `<defs><clipPath id="qs-air"><rect width="${W}" height="${sy}"/></clipPath><clipPath id="qs-sand"><rect y="${sy}" width="${W}" height="${H - sy}"/></clipPath></defs>`;
  /* the wet sand: grains, closer together with depth */
  b += R(0, sy, W, H - sy, 'qs-wet');
  /** @type {[number, number][][]} */ const grains = [[], [], []];
  for (let i = 0; i < 560; i++) { const y = sy + 3 + (H - sy) * Math.sqrt(r()), x = r() * W, g = r(); if (x > px - 205 && x < px - 28 && y > 182 && y < 220) continue; grains[g < .5 ? 0 : g < .85 ? 1 : 2].push([x, y]); }
  b += grains.map((g, i) => dots(g, `qs-grain qs-g${i}`)).join('') + L(0, sy, W, sy, 'a');
  /* the person: a body that sinks to the waist */
  const body = `M${px - 7} 22a7.5 7.5 0 1 1 15 0a7.5 7.5 0 1 1 -15 0M${px - 6} 32h12l3 3 33 10-1 5-30-6v42l2 30-1 54h-9l-4-50-4 50h-9l-1-54 2-30v-42l-30 6-1-5 33-10z`;
  b += `<g clip-path="url(#qs-air)"><path class="qs-body qs-solid" d="${body}"/></g><g clip-path="url(#qs-sand)"><path class="qs-body qs-ghost" d="${body}" stroke-dasharray="3 3"/></g>`;
  /* why: it is twice as dense as you */
  b += G('fade w12', T(18, 24, 'You · 1.0 g/cm³', 'tc') + R(18, 30, 52, 5, 'qs-you', 2.5) + T(18, 56, 'Quicksand · 2.0 g/cm³', 'tc qs-k') + R(18, 62, 104, 5, 'kf', 2.5));
  /* and what it costs to pull a foot out: the force to lift a car */
  const fx = px - 9.5, tx = px - 34;
  b += G('fade w14', P(`M${fx} 210V184M${fx - 4} 190L${fx} 183L${fx + 4} 190`, 'k') + T(tx, 196, 'Pull a foot out at 1 cm/s:', 'tc halo', 'end') + T(tx, 212, 'the force to lift a car', 'tc halo', 'end'));
  const cx0 = tx - 158, cy0 = 212;
  b += G('fade w14', P(`M${cx0} ${cy0}h28l-3-5h-7l-3-4h-9l-4 4h-2zM${cx0 + 4} ${cy0}a2.6 2.6 0 1 0 5.2 0M${cx0 + 20} ${cy0}a2.6 2.6 0 1 0 5.2 0`, 'qs-car'));
  return svg(W, H, 'A section through quicksand: a person floating in it waist-deep, since quicksand at about 2.0 grams per cubic centimetre is twice as dense as a person at about 1.0; pulling a foot out at 1 cm/s takes the force needed to lift a car', b, 'qs');
}

/* Giant squid: its eye and yours drawn to one scale, so its eye doesn't fit on the card: its pupil and iris swell
   in from the corner and run off the edges, while yours sits whole beside a 5 cm scale. On first sight its eye
   grows from the size of yours. */
function squid() {
  const W = 365, H = 236, k = 1.75, R = 135 * k, cx = 332, cy = 72, ex = 40, ey = 146, er = 12 * k;
  let b = `<defs><clipPath id="sq-c"><circle cx="${cx}" cy="${cy}" r="${f(R * .62)}"/></clipPath><linearGradient id="sq-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".16" stop-color="#fff"/></linearGradient><mask id="sq-m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#sq-g)"/></mask></defs>`;
  /* its eye: the white, the iris with its fibres, the pupil and its catchlight */
  let eye = C(cx, cy, R, 'sq-white') + C(cx, cy, R * .62, 'sq-iris');
  let fib = ''; for (let a = 0; a < 360; a += 5) { const t = a * Math.PI / 180, r1 = R * (.36 + (a % 15 ? .04 : 0)), r2 = R * (.6 - (a % 10 ? .05 : 0)); fib += `M${f(cx + Math.cos(t) * r1)} ${f(cy + Math.sin(t) * r1)}L${f(cx + Math.cos(t) * r2)} ${f(cy + Math.sin(t) * r2)}`; }
  eye += `<path class="sq-fib" clip-path="url(#sq-c)" d="${fib}"/>` + C(cx, cy, R * .34, 'pf') + C(cx - R * .13, cy - R * .11, R * .045, 'hl');
  b += `<g mask="url(#sq-m)"><g class="sq-eye">${eye}</g></g>`;
  const lx = cx - R; b += G('fade w14', T(18, cy - 4, 'ITS EYE', 'tb') + T(18, cy + 9, '27 CM', 'tn') + L(68, cy + 2, lx - 4, cy + 2, 'a'));
  /* yours, to the same scale */
  b += G('fade w12', C(ex, ey, er, 'sq-you') + C(ex, ey, er * .48, 'sq-yi') + C(ex, ey, er * .22, 'pf') + C(ex - er * .12, ey - er * .1, er * .07, 'hl') + T(18, ey + er + 16, 'YOURS', 'tb') + T(18, ey + er + 29, '2.4 CM', 'tn'));
  /* a 5 cm scale */
  const sx = 18, sy2 = H - 12;
  b += G('fade w12', dim(sx, sx + 50 * k, sy2) + T(sx + 50 * k + 7, sy2 + 3.5, '5 CM', 'tn'));
  return svg(W, H, 'A giant squid’s eye, 27 cm across, drawn to the same scale as a human eye, 2.4 cm across: the squid’s eye is too big to fit on the card', b, 'sq');
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
  const x0 = 8, x1 = W - 8, ax = H - 20, X = (/** @type {number} */ nm) => x0 + (nm - 400) / 300 * (x1 - x0), r = rng(v === 'w' ? 21 : 34), k = v === 'w' ? 1 : .86;
  /* where each bursts, and how big: copper's the smallest */
  const sky = /** @type {Record<string, [number, number, number, number]>} */ (v === 'w'
    ? { Cu: [0, 50, 17, 2], Ba: [0, 42, 27, 1], Na: [0, 30, 21, 3], Ca: [0, 68, 20, 4], Sr: [0, 44, 30, 0] }
    : { Cu: [0, 56, 16, 2], Ba: [0, 46, 24, 1], Na: [0, 32, 19, 3], Ca: [0, 76, 18, 4], Sr: [0, 48, 26, 0] });
  let b = `<defs><linearGradient id="fw-sp-${v}" x1="0" y1="0" x2="1" y2="0">${[['#7A3CFF', 0], ['#3D5BFF', .12], ['#21B7E8', .28], ['#2FC76A', .42], ['#E8D21C', .6], ['#FF8A1F', .72], ['#F2334A', .86], ['#9C1020', 1]].map(([c, o]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient></defs>`;
  b += `<rect x="${x0}" y="${ax - 3}" width="${x1 - x0}" height="3" fill="url(#fw-sp-${v})" opacity=".55"/>` + L(x0, ax, x1, ax, 'fw-ax');
  for (let nm = 400; nm <= 700; nm += 50) b += L(X(nm), ax, X(nm), ax + 4, 'fw-ax') + (v === 'n' && nm % 100 ? '' : T(X(nm), ax + 15, nm === 700 ? '700 NM' : String(nm), 'tn fw-t', nm === 400 ? 'start' : nm === 700 ? 'end' : 'middle'));
  for (const [sym, name, hue, col, lines] of METALS) {
    const [, cy, R0, order] = sky[sym], R = R0 * (v === 'w' ? 1 : .95), mid = (Math.min(...lines) + Math.max(...lines)) / 2, cx = X(mid), w = 2 + order * 2;
    let g = '';
    /* its lines on the ruler, and the trail it went up by */
    g += `<path class="fw-line" stroke="${col}" d="${lines.map(nm => `M${f(X(nm))} ${ax}v-11`).join('')}"/>`;
    g += `<path class="fw-trail dr w${w}" pathLength="1" d="M${f(cx)} ${ax - 12}V${f(cy + 4)}" stroke="${col}"/>`;
    /* the burst: streaks bending down a little as they fall, a spark at each end */
    const n = sym === 'Cu' ? 13 : 17;
    let streaks = '';
    /** @type {[number, number][]} */ const sparks = [];
    for (let i = 0; i < n; i++) {
      const a = (i + r() * .5) / n * 2 * Math.PI, r1 = R * (.72 + r() * .28), ex = cx + Math.cos(a) * r1, ey = cy + Math.sin(a) * r1 + r1 * r1 / R * .18;
      const sx = cx + Math.cos(a) * 3, sy2 = cy + Math.sin(a) * 3;
      streaks += `M${f(sx)} ${f(sy2)}q${f(cx + Math.cos(a) * r1 * .6 - sx)} ${f(cy + Math.sin(a) * r1 * .6 - sy2)} ${f(ex - sx)} ${f(ey - sy2)}`;
      sparks.push([ex, ey]);
    }
    g += `<path class="fw-burst dr w${w + 2}" pathLength="1" d="${streaks}" stroke="${col}"/>` + dots(sparks, `fw-spark fade w${w + 4}`).replace('<path ', `<path stroke="${col}" `);
    g += `<circle class="hit" data-read="${name} · ${hue} · ${lines.length > 1 ? `lines at ${lines[0]}–${lines[lines.length - 1]} nm` : `its line at ${lines[0]} nm`}" cx="${f(cx)}" cy="${f(cy)}" r="${f(R + 8)}"/>`;
    const lx = sym === 'Na' ? cx - R - 6 : sym === 'Ca' ? cx + R + 6 : cx, ly = sym === 'Na' ? cy + 4 : sym === 'Ca' ? cy + 4 : cy + R + 13 * k;
    g += T(lx, ly, sym, 'fw-sym fade w12', sym === 'Na' ? 'end' : sym === 'Ca' ? 'start' : 'middle');
    b += `<g class="fw-m">${g}</g>`;
  }
  const cu = X(440); b += T(cu, v === 'w' ? 20 : 26, 'BLUE: THE HARDEST', 'fw-t fade w12', 'middle');
  return svg(W, H, 'Fireworks over a spectrum of visible light from 400 to 700 nanometres: each metal’s burst rises from where its emission lines fall, copper in the blue (the smallest, blue being the hardest), barium in the green, sodium in the yellow, calcium in the orange and strontium in the red', b, `vz-${v}`);
}
const fireworks = () => fireworksSky(451, 136, 'w') + fireworksSky(330, 170, 'n');

/* Dreams: a typical night's sleep stages, 23:00 to 07:00, its dreaming (REM) stretches about 90 minutes apart and
   longer towards morning, the longest just before waking. On first sight the night draws itself in; pointing at
   it reads the stage at that time. */
const NIGHT = /** @type {[number, string][]} */ ([[0, 'W'], [8, 'N1'], [16, 'N2'], [38, 'N3'], [72, 'N2'], [86, 'R'], [96, 'N2'], [112, 'N3'], [146, 'N2'], [172, 'R'], [192, 'N2'], [228, 'N3'], [244, 'N2'], [262, 'R'], [292, 'N1'], [298, 'N2'], [338, 'R'], [378, 'N2'], [414, 'R'], [462, 'W'], [480, 'W']]);
const STAGE = /** @type {Record<string, string>} */ ({ W: 'awake', R: 'REM sleep, vivid dreams', N1: 'N1, light sleep', N2: 'N2, light sleep', N3: 'N3, deep sleep' });
/** @param {number} W @param {number} H @param {'w' | 'n'} v */
function dreamNight(W, H, v) {
  const x0 = v === 'w' ? 44 : 38, x1 = W, mins = 480, X = (/** @type {number} */ m) => x0 + m / mins * (x1 - x0), gap = v === 'w' ? 18 : 20;
  /** @type {Record<string, number>} */ const lv = { W: 30, R: 30 + gap, N1: 30 + 2 * gap, N2: 30 + 3 * gap, N3: 30 + 4 * gap };
  const ax = lv.N3 + 12;
  let b = R(x0, lv.R - 7, x1 - x0, 14, 'dr-band');
  for (const [k, y] of Object.entries(lv)) b += L(x0, y, x1, y, 'hp') + T(x0 - 7, y + 3.5, k === 'W' ? 'AWAKE' : k === 'R' ? 'REM' : k, k === 'R' ? 'tk' : '', 'end');
  for (let h = 0; h <= 8; h += 2) b += L(X(h * 60), ax, X(h * 60), ax + 4, 'a') + T(X(h * 60), ax + 15, `${String((23 + h) % 24).padStart(2, '0')}:00`, 'tn', h === 0 ? 'start' : h === 8 ? 'end' : 'middle');
  b += L(x0, ax, x1, ax, 'a');
  /** @type {[number, number][]} */ const p = [];
  /** @type {[number, number][]} */ const rem = [];
  let len = 0;
  for (let i = 0; i < NIGHT.length - 1; i++) {
    const [m, s2] = NIGHT[i], [m2] = NIGHT[i + 1], y = lv[s2];
    for (const q of /** @type {[number, number][]} */ ([[X(m), y], [X(m2), y]])) { if (p.length) len += Math.hypot(q[0] - p[p.length - 1][0], q[1] - p[p.length - 1][1]); p.push(q); }
    if (s2 === 'R') rem.push([m, m2]);
    const t = `${String((23 + Math.floor(m / 60)) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    b += `<rect class="hit" data-read="${t} · ${STAGE[s2]}" x="${f(X(m))}" y="20" width="${f(X(m2) - X(m))}" height="${ax - 20}"/>`;
  }
  b += `<path class="dr-trace dr" pathLength="1" d="${pts(p)}"/>`;
  /* the dreaming stretches, appearing as the night reaches them (it draws in 1.6 s) */
  rem.forEach(([m, m2]) => { b += `<rect class="kf vpop w${Math.max(1, Math.round(X(m) / x1 * 16))}" x="${f(X(m))}" y="${lv.R - 3.5}" width="${f(X(m2) - X(m))}" height="7" rx="3.5"/>`; });
  /* about 90 minutes apart */
  rem.slice(0, v === 'w' ? 4 : 3).forEach(([m], i) => { const a = X(m), c = X(rem[i + 1][0]); b += P(`M${f(a)} 20V16H${f(c)}V20`, 'kt fade w14'); });
  b += T((X(rem[0][0]) + X(rem[1][0])) / 2, 10, '≈ 90 MIN', 'tk fade w14', 'middle');
  const last = rem[rem.length - 1], lx = X(last[0]) + 14;
  b += G('fade w15', T(v === 'w' ? lx - 6 : lx - 4, 10, v === 'w' ? 'LONGEST, JUST BEFORE YOU WAKE' : 'LONGEST', 'tb', 'end') + L(lx, 4, lx, lv.R - 5, 'a'));
  return svg(W, H, 'A typical night’s sleep stages from 23:00 to 07:00: five stretches of REM sleep, when vivid dreams come, about 90 minutes apart and growing longer towards morning, the longest just before waking', b, `vz-${v}`);
}
const dreams = () => dreamNight(451, 136, 'w') + dreamNight(330, 150, 'n');

/* Infinity: Cantor's diagonal. Any list of numbers between 0 and 1, numbered 1, 2, 3 and on; change digit n of
   row n, and the number you build differs from every row, so it is on no list. On first sight the change walks
   down the diagonal and the new number builds up digit by digit. */
function cantor() {
  const rows = ['5105110', '4142135', '7182818', '3333333', '1428571', '0000001', '6180339'];
  const W = 329, H = 214, x0 = 72, cw = 17, y0 = 16, lh = 19; let b = '';
  rows.forEach((r, i) => {
    const y = y0 + i * lh;
    b += T(20, y, String(i + 1), 'tn', 'end') + T(33, y, '↦', 'tc', 'middle') + T(x0 - 9, y, '0.', 'tn tl', 'end');
    [...r].forEach((d, j) => { if (i === j) b += R(x0 + j * cw - 7.5, y - 12, 15, 16, `kfa in-cell vpop w${2 + i * 2}`, 3); b += T(x0 + j * cw, y, d, i === j ? 'tn tk tl' : 'tn tl', 'middle'); });
    b += T(x0 + 7 * cw - 2, y, '…', 'tl');
  });
  const ly = y0 + rows.length * lh; b += T(22, ly - 2, '⋮', 'tl', 'end') + T(x0 + 3 * cw, ly - 2, '⋮', 'tl', 'middle');
  b += L(4, ly + 6, x0 + 7 * cw + 8, ly + 6, 'a');
  const ny = ly + 26, diag = rows.map((r, i) => String((+r[i] + 1) % 10));
  b += T(x0 - 9, ny, '0.', 'tn tb tl', 'end') + diag.map((d, j) => T(x0 + j * cw, ny, d, `tn tb tl fade w${3 + j * 2}`, 'middle')).join('') + T(x0 + 7 * cw - 2, ny, '…', 'tb tl');
  /* what the list is, and where the new number isn't */
  const rx = x0 + 7 * cw + 20; b += P(`M${rx - 6} ${y0 - 12}h4V${ly - 10}h-4`, 'a') + T(rx + 4, y0 + 44, 'Any list,', 'tc') + T(rx + 4, y0 + 59, 'numbered', 'tc') + T(rx + 4, y0 + 74, '1, 2, 3, …', 'tc');
  b += T(rx + 4, ny, 'on no list', 'tc tk fade w16') + T(4, ny + 26, 'It differs from row n at digit n.', 'tc fade w16');
  return svg(W, H, 'Cantor’s diagonal: a list of decimal numbers numbered 1, 2, 3 and on, its diagonal digits picked out, and below them a new number, each digit one more than the diagonal’s, that differs from row n at digit n and so is on no list', b, 'cn');
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
  b += `<g class="mi-sheet">${faces.map(f => `<path class="mi-f mi-o${f.o}" d="${f.d}"/>`).join('')}</g>`;
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
  let h1 = `<path class="at-cliff" d="${far(7.5, 0, LAND)}"/>` + `<path class="at-water" d="${ell(7.5, 0)}"/>` + sea(7.5);
  let ring1 = `<path class="at-cliff" d="${near(5.5, 0, LAND)}"/><path class="at-top" fill-rule="evenodd" d="${ell(5.5, LAND)}${ell(3.5, LAND)}"/>` + dotsPath(stipple(3.5, 5.5, LAND, 18), 'at-stip');
  ring1 += `<path class="at-wall at-tin" d="${near(5.5, LAND, LAND + WALL)}"/><path class="at-rim at-tin-l" d="${ell(5.5, LAND + WALL)}"/>`;
  let h2 = `<path class="at-cliff" d="${far(3.5, 0, LAND)}"/>` + `<path class="at-water" d="${ell(3.5, 0)}"/>` + sea(3.5);
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

/* Northern lights: a photograph where the red shows above the green, cropped tall, and down its right edge a scale of
   the heights each colour comes from: the red and the green are the same oxygen, the red higher up. Auroral light has
   no hard edges, so neither do the bands; on its turn they rise up the scale in turn. Laid out by the stylesheet, so
   the scale fits whatever height the card has. */
function aurora() {
  const ticks = [0, 100, 200, 300, 400, 500].map(k => `<b class="nl-tk nl-k${k / 100}">${k}</b>`).join('');
  return `<img class="nl-img" src="/api/picture?f=b%2Fb1%2F2024-10-10_Red_and_Green_Aurora_Borealis_over_Luray_VA_22-08-35_1.jpg&amp;w=1280" alt="The northern lights over Luray, Virginia: red light high above a band of green" width="1280" height="853" fetchpriority="low"><div class="nl-scale" role="img" aria-label="A scale of height from 0 to 500 km: red light from oxygen, at 630 nm, highest, above about 300 km; green light from oxygen, at 557.7 nm, from about 100 to 300 km"><i class="nl-ax"></i>${ticks}<b class="nl-km">KM</b><i class="nl-band nl-red"></i><i class="nl-band nl-green"></i><p class="nl-lab nl-lr"><b>Oxygen</b>630 nm</p><p class="nl-lab nl-lg"><b>Oxygen</b>557.7 nm</p></div>`;
}

/* Enigma machine: the machine's top, black in either theme: three rotor windows on their ivory rings, the lampboard
   and the keyboard in its own QWERTZ rows. Tap a key or type, and the lamp it becomes lights; it is never the key's
   own. Beside it, the tape of your letters over the lamps they lit, and a tally of how many lit themselves
   (none, ever). The page wires it up; the cipher is src/shared/enigma.js. */
const QWERTZ = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'];
function enigmaBoard() {
  const strip = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZA'].map(c => `<i>${c}</i>`).join('');
  const rotors = [0, 1, 2].map(() => `<span class="en-rw" data-at="A"><b class="en-strip">${strip}</b></span>`).join('');
  const lamps = QWERTZ.map(r => `<p>${[...r].map(c => `<i data-l="${c}">${c}</i>`).join('')}</p>`).join('');
  const keys = QWERTZ.map(r => `<p>${[...r].map(c => `<button type="button" data-k="${c}" aria-label="${c}">${c}</button>`).join('')}</p>`).join('');
  return `<div class="en" role="group" aria-label="An Enigma machine: tap its keys or type"><div class="en-r" aria-label="Rotor positions">${rotors}</div><div class="en-lamps" aria-hidden="true">${lamps}</div><div class="en-keys">${keys}</div></div>`;
}
const ENIGMA_TAPE = `<div class="en-tape"><label class="en-in"><span>IN</span><input type="text" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Type a word to encrypt"><b class="en-pl" aria-hidden="true"></b></label><p><span>OUT</span><b class="en-cy" aria-live="polite"></b></p></div><p class="en-tally"><b class="en-n">0</b><span>of <i class="en-of">0</i> letters lit themselves</span></p><p class="en-why">A guessed word can’t sit where any of its letters meets itself, which let codebreakers rule places out.</p><p class="en-k">ROTORS I · II · III · REFLECTOR B<br>1 OF 158,962,555,217,826,360,000 SETTINGS</p>`;

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
  { t: 'Lightning', size: 'tall', tab: 'sq', night: true, beat: 1500, art: () => svg(365, 532, 'A bolt of lightning', ''), src: ['https://en.wikipedia.org/wiki/Lightning', 'https://www.weather.gov/safety/lightning-science-thunder'] },
  { t: 'Giant squid', size: 'sq', beat: 1400, art: squid, src: ['https://en.wikipedia.org/wiki/Giant_squid'] },
  { t: 'Pompeii', size: 'sq', beat: 1500, hook: 'The textbook says 24 August. A charcoal note found in 2018 points to October.', art: pompeii, src: ['https://en.wikipedia.org/wiki/Eruption_of_Mount_Vesuvius_in_79_AD', 'https://www.thelocal.it/20181016/was-pompeii-destroyed-two-months-later-than-we-thought'] },
  { t: 'Enigma machine', size: 'big', fx: 'enigma', beat: 2100, hook: 'It never turned a letter into itself, and that flaw helped break it. Try it.', art: enigmaBoard, more: ENIGMA_TAPE, src: ['https://en.wikipedia.org/wiki/Cryptanalysis_of_the_Enigma', 'https://en.wikipedia.org/wiki/Enigma_machine', 'https://www.pbs.org/wgbh/nova/article/how-enigma-works'] },
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
