/* ================= the front page, by hand =================
   Will's call (2026-10-15): while the front page is updated by hand, every card is its own piece.
   The thirty-two topics planned as pages written ahead of time (and Bioluminescence) are here with a
   hook each; a dozen lead in as cards, each drawn its own way; the rest turn up as suggestions; and
   the threads between them make the map. Every claim carries its source, checked before it went in.
   No model writes any of it. `scripts/build.mjs` turns this into public/front.json, which only the
   front page fetches, so reading pages never carry the artwork. */

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

/* ---------- drawing: hairline SVG, coloured only through the theme (see .vz in src/styles.css) ---------- */
const esc = (/** @type {unknown} */ s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = (/** @type {number} */ n) => Math.round(n * 10) / 10;
/** @param {number} w @param {number} h @param {string} label @param {string} body */
const svg = (w, h, label, body) => `<svg class="vz" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
/** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 */
const L = (x1, y1, x2, y2, c = 'h') => `<line class="${c}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`;
/** @param {number} x @param {number} y @param {string} s */
const T = (x, y, s, c = '', a = 'start') => `<text${c ? ` class="${c}"` : ''} x="${f(x)}" y="${f(y)}"${a === 'start' ? '' : ` text-anchor="${a}"`}>${esc(s)}</text>`;
/** @param {number} x @param {number} y @param {number} r */
const C = (x, y, r, c = 'h') => `<circle class="${c}" cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`;
const P = (/** @type {string} */ d, c = 'h') => `<path class="${c}" d="${d}"/>`;
/** a dimension line with end ticks @param {number} x1 @param {number} x2 @param {number} y */
const dim = (x1, x2, y, c = 'a') => L(x1, y, x2, y, c) + L(x1, y - 4, x1, y + 4, c) + L(x2, y - 4, x2, y + 4, c);
/** a vertical dimension line @param {number} x @param {number} y1 @param {number} y2 */
const vdim = (x, y1, y2, c = 'a') => L(x, y1, x, y2, c) + L(x - 4, y1, x + 4, y1, c) + L(x - 4, y2, x + 4, y2, c);
const pts = (/** @type {[number, number][]} */ p) => p.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('');

/* Black holes: Earth, and the marble it would have to become */
function blackHoles() {
  const cx = 88, cy = 84, r = 70; let b = '';
  b += C(cx, cy, r, 's');
  for (const t of [.36, .72]) b += `<ellipse class="h" cx="${cx}" cy="${cy}" rx="${f(r * t)}" ry="${r}"/>`;
  for (const p of [-.66, -.33, 0, .33, .66]) { const rx = r * Math.sqrt(1 - p * p); b += `<ellipse class="h" cx="${cx}" cy="${f(cy + r * p)}" rx="${f(rx)}" ry="${f(rx * .14)}"/>`; }
  b += dim(cx - r, cx + r, cy + r + 14) + T(cx, cy + r + 30, 'EARTH · Ø 12,742 KM', 'tn', 'middle');
  b += L(176, cy, 226, cy, 'a') + P(`M221 ${cy - 4}L227 ${cy}L221 ${cy + 4}`, 'a') + T(201, cy - 10, 'SQUEEZE', '', 'middle');
  const mx = 274;
  b += C(mx, cy, 13, 'k') + C(mx, cy, 8, 'if');
  b += dim(mx - 8, mx + 8, cy + 30) + T(mx, cy + 46, 'Ø 17.7 MM', 'tn tb', 'middle');
  b += T(mx, cy - 26, 'BLACK HOLE', 'tk', 'middle');
  b += T(330, cy + r + 30, 'r = 2GM/c²', 'tn', 'end');
  return svg(330, 190, 'Earth, 12,742 km across, beside the 17.7 mm marble it would have to be squeezed into to become a black hole', b);
}

/* Volcanoes: Krakatoa's pressure wave, passing a barometer seven times in five days */
function krakatoa() {
  const W = 440, x0 = 6, x1 = 434, base = 66, ax = 104, hours = 120, px = (x1 - x0) / hours;
  const spikes = [[11, 30], [28, 21], [47, 17], [63, 12], [83, 10], [99, 7], [117, 5.5]];
  let b = '';
  for (let d = 0; d <= 5; d++) { const x = x0 + d * 24 * px; b += L(x, 12, x, ax, 'h') + L(x, ax, x, ax + 5, 'a'); b += T(x, ax + 17, ['27 AUG', '28', '29', '30', '31', '1 SEP'][d], 'tn', d === 0 ? 'start' : d === 5 ? 'end' : 'middle'); }
  b += L(x0, ax, x1, ax, 'a');
  /** @type {[number, number][]} */ const p = [];
  for (let t = 0; t <= hours; t += .25) {
    let y = Math.sin(t * .9) * .6 + Math.sin(t * 2.3 + 1) * .4;
    for (const [s, a] of spikes) { const u = t - s; if (u > -.5 && u < 4) y += u < .5 ? -a * Math.sin((u + .5) * Math.PI / 2) : u < 1.6 ? -a * Math.cos((u - .5) / 1.1 * Math.PI) * (u < 1.05 ? 1 : .6) : a * .6 * Math.exp(-(u - 1.6) * 1.4) * Math.cos((u - 1.6) * 1.3); }
    p.push([x0 + t * px, base + y]);
  }
  b += P(pts(p), 'k');
  spikes.forEach(([s, a], i) => { const x = x0 + (s + .5) * px; b += T(x, base - a - 7, String(i + 1), 'tn tb', 'middle'); });
  b += T(x0, 9, 'KRAKATOA · 27 AUG 1883 · AIR PRESSURE', '') + T(x1, 9, '7 PASSES IN 5 DAYS', 'tk', 'end');
  return svg(W, 128, 'A barograph trace of air pressure over five days from 27 August 1883, with Krakatoa’s pressure wave passing seven times, each pass smaller', b);
}

/* Pompeii: the textbook date, and the later ones a charcoal note and a 2022 study point to */
function pompeii() {
  const x0 = 6, x1 = 324, days = 106, px = (x1 - x0) / days, y = 40; const X = (/** @type {number} */ d) => x0 + d * px;
  let b = L(x0, y, x1, y, 'a');
  for (let d = 0; d <= days; d += 7) b += L(X(d), y - 2.5, X(d), y + 2.5, 'h');
  [[0, 'AUG'], [31, 'SEP'], [61, 'OCT'], [92, 'NOV']].forEach(([d, m]) => { b += L(X(+d), y, X(+d), y + 8, 'a') + T(X(+d) + 3, y + 18, String(m)); });
  /* the textbook's 24 August; the note's 17 October, in ink; the study's window, 24 October to 1 November */
  const aug = X(23); b += C(aug, y, 3.5, 'sf') + T(aug, y - 10, 'TEXTBOOK · 24 AUG', 'tn', 'middle');
  const oct = X(77); b += P(`M${f(oct)} ${y - 4.5}L${f(oct + 4.5)} ${y}L${f(oct)} ${y + 4.5}L${f(oct - 4.5)} ${y}Z`, 'if') + T(oct + 1, y - 10, 'NOTE · 17 OCT', 'tn tb', 'end');
  b += L(X(84), y, X(92), y, 'kk') + L(X(88), y - 4, X(88), y - 24, 'kt') + T(X(88) + 4, y - 26, '2022 STUDY · 24 OCT–1 NOV', 'tn tk', 'end');
  return svg(330, 62, 'A calendar from August to November 79: the textbook date, 24 August; a charcoal note dated 17 October; and a 2022 study’s window, 24 October to 1 November', b);
}

/* Rubik's Cube: a wireframe cube, its top layer picked out */
function rubik() {
  const cx = 64, cy = 64, R = 56; const H = (/** @type {number} */ a) => [cx + R * Math.cos(a * Math.PI / 180), cy + R * Math.sin(a * Math.PI / 180)];
  const [p0, p1, p2, p3, p4, p5] = [-90, -30, 30, 90, 150, 210].map(H), c = [cx, cy];
  const mix = (/** @type {number[]} */ a, /** @type {number[]} */ b2, /** @type {number} */ t) => [a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t];
  let b = '';
  /** a face's 3×3 grid @param {number[][]} q four corners in order @param {string} cls */
  const face = (q, cls) => { let s = P(pts(/** @type {any} */ ([...q, q[0]])), cls); for (const t of [1 / 3, 2 / 3]) { const [a1, b1] = [mix(q[0], q[1], t), mix(q[3], q[2], t)]; const [a2, b2] = [mix(q[0], q[3], t), mix(q[1], q[2], t)]; s += L(a1[0], a1[1], b1[0], b1[1], 'h') + L(a2[0], a2[1], b2[0], b2[1], 'h'); } return s; };
  b += face([p0, p1, c, p5], 'a') + face([c, p1, p2, p3], 'a') + face([c, p3, p4, p5], 'a');
  /* the top layer, turning */
  const t3 = 1 / 3; b += P(pts(/** @type {any} */ ([p5, c, p1, mix(p1, p2, t3), mix(c, p3, t3), mix(p5, p4, t3), p5])), 'k');
  return svg(128, 128, 'A wireframe Rubik’s Cube with its top layer outlined', b);
}

/* Rubik's Cube: how many moves its positions need, to scale. Nearly all need 17 or 18; the ones needing 20
   are too few to draw (cube20.org's counts, its estimates from 16 moves up; below 16 too few to show) */
function rubikMoves() {
  const at = [[16, 1.1e18], [17, 1.2e19], [18, 2.9e19], [19, 1.5e18]];
  const x0 = 6, x1 = 324, base = 90, H = 54, slot = (x1 - x0) / 21, X = (/** @type {number} */ d) => x0 + (d + .5) * slot;
  let b = L(x0, base, x1, base, 'a');
  for (let d = 0; d <= 20; d++) b += L(X(d), base, X(d), base + (d % 5 ? 2.5 : 5), d % 5 ? 'h' : 'a');
  for (const d of [0, 5, 10, 15, 20]) b += T(X(d), base + 16, String(d), 'tn', 'middle');
  for (const [d, n] of at) { const h = n / 2.9e19 * H; b += `<rect class="kf" x="${f(X(d) - slot * .32)}" y="${f(base - h)}" width="${f(slot * .64)}" height="${f(h)}"/>`; }
  b += T(X(18), base - H - 6, '2 IN 3', 'tn tk', 'middle') + T(x0, base - 7, 'MOVES TO SOLVE');
  b += `<line class="kt" x1="${f(X(20))}" y1="${base - 2}" x2="${f(X(20))}" y2="14" stroke-dasharray="2 3"/>` + T(x1, 9, '20 MOVES: ABOUT 490 MILLION, TOO FEW TO DRAW', 'tn', 'end');
  return svg(330, 110, 'Positions by the moves they need: about two in three need 18, most of the rest 17, slivers need 16 or 19, and the 490 million or so that need 20 are too few to draw', b);
}

/* Venus flytraps: an open trap with its trigger hairs, which the card lets you touch */
function flytrap() {
  const hx = 110, hy = 138; let b = '';
  /** a point on a cubic @param {number[][]} q @param {number} t */
  const cub = (q, t) => { const u = 1 - t; return [0, 1].map(k => u * u * u * q[0][k] + 3 * u * u * t * q[1][k] + 3 * u * t * t * q[2][k] + t * t * t * q[3][k]); };
  /* one lobe, drawn from the hinge out and up to the left (s = 1), mirrored for the right (s = -1): a broad
     leaf with bristles on its rim */
  const rim = [[[0, 0], [-42, -4], [-66, -40], [-62, -78]], [[-62, -78], [-58, -106], [-30, -118], [-9, -104]]];
  /** @param {number} s */
  const lobe = s => {
    const q = (/** @type {number[]} */ [x, y]) => `${f(hx + s * x)} ${f(hy + y)}`;
    const [a, c] = rim;
    let g = `<path class="kfa" d="M${q(a[0])}C${q(a[1])} ${q(a[2])} ${q(a[3])}C${q(c[1])} ${q(c[2])} ${q(c[3])}C${q([-3, -80])} ${q([0, -40])} ${q([0, 0])}Z"/>`;
    g += `<path class="s" d="M${q(a[0])}C${q(a[1])} ${q(a[2])} ${q(a[3])}C${q(c[1])} ${q(c[2])} ${q(c[3])}C${q([-3, -80])} ${q([0, -40])} ${q([0, 0])}Z"/>`;
    /* the bristles: out from the rim, longer towards the top; the last few lean over the midline, so that
       shut, the two lobes' bristles cross like bars */
    for (const [seg, t0, t1, n] of /** @type {[number[][], number, number, number][]} */ ([[a, .3, .92, 6], [c, .12, .96, 7]])) for (let i = 0; i < n; i++) {
      const t = t0 + (t1 - t0) * i / (n - 1); const [x, y] = cub(seg, t); const [x0, y0] = cub(seg, Math.max(0, t - .02)); const [x2, y2] = cub(seg, Math.min(1, t + .02));
      const dx = x2 - x0, dy = y2 - y0, len = Math.hypot(dx, dy) || 1, lean = seg === c ? Math.max(0, (t - .55) / .41) : 0;
      const ux = dy / len + 1.3 * lean, uy = -dx / len, ul = Math.hypot(ux, uy), l = 8 + 4 * (1 - (y + 118) / 118) + 12 * lean;
      g += L(hx + s * x, hy + y, hx + s * (x + ux / ul * l), hy + y + uy / ul * l, 'a');
    }
    /* three trigger hairs inside */
    for (const [x, y] of [[-20, -40], [-30, -66], [-18, -86]]) g += L(hx + s * x, hy + y, hx + s * (x + 4), hy + y - 10, 'kt ft-hair') + C(hx + s * (x + 4), hy + y - 10, 1.8, 'kf ft-tip');
    return `<g class="ft-${s > 0 ? 'l' : 'r'}">${g}</g>`;
  };
  b += lobe(-1) + lobe(1) + L(hx, hy, hx, hy + 12, 'a') + C(hx, hy, 2.5, 'if');
  return svg(220, 150, 'An open Venus flytrap: two lobes fringed with bristles, three trigger hairs on each', b);
}

/* Quicksand: you float, waist-deep; and the densities that say why */
function quicksand() {
  const sy = 70, sw = 196; let b = '';
  for (let y = sy + 8; y < 150; y += 8) for (let x = 6 + ((y / 8) % 2) * 4; x < sw; x += 8) b += C(x, y, 1, 'dt');
  b += L(0, sy, sw, sy, 'a') + T(4, sy - 6, 'SURFACE');
  /* a person, waist-deep, arms spread on the surface; what is under it drawn as a ghost */
  const px = 112;
  b += C(px, 20, 7.5, 'if') + P(`M${px - 11} ${sy}V38Q${px - 11} 31 ${px - 4} 31H${px + 4}Q${px + 11} 31 ${px + 11} 38V${sy}Z`, 'if');
  for (const s of [-1, 1]) b += P(`M${px + s * 9} 37L${px + s * 31} 53`, 'ik') + `<path class="h" d="M${px + s * 2} ${sy}V${sy + 46}h${s * 8}V${sy}" stroke-dasharray="3 3"/>`;
  /* the gauge: density, in g/cm³ */
  const gx = 236, gy0 = 142, gy1 = 18, v0 = .5, v1 = 2.5; const Y = (/** @type {number} */ v) => gy0 - (v - v0) / (v1 - v0) * (gy0 - gy1);
  b += L(gx, gy0, gx, gy1, 'a');
  for (let v = .5; v <= 2.51; v += .5) b += L(gx - 3, Y(v), gx + 3, Y(v), 'a') + T(gx - 8, Y(v) + 3.5, v.toFixed(1), 'tn', 'end');
  b += L(gx, Y(2.0), gx + 12, Y(2.0), 'k') + T(gx + 16, Y(2.0) + 3.5, 'QUICKSAND', 'tk');
  b += L(gx, Y(1.0), gx + 12, Y(1.0), 's') + T(gx + 16, Y(1.0) + 3.5, 'YOU', 'tb');
  b += T(gx + 16, gy1 + 3.5, 'G/CM³');
  return svg(330, 150, 'A person floating waist-deep in quicksand, beside a density gauge: quicksand about 2.0 grams per cubic centimetre, a person about 1.0', b);
}

/* Giant squid: its eye and yours, to scale */
function squid() {
  const cx = 96, cy = 86, r = 80, mm = r / 135; let b = '';
  b += C(cx, cy, r, 's') + C(cx, cy, r * .62, 'kfa') + C(cx, cy, r * .62, 'k') + C(cx, cy, r * .34, 'pf') + C(cx - r * .11, cy - r * .11, r * .055, 'hl');
  b += dim(cx - r, cx + r, cy + r + 12) + T(cx, cy + r + 27, 'GIANT SQUID · 270 MM', 'tn tk', 'middle');
  const ex = 262, ey = 150, er = 12 * mm; b += C(ex, ey, er, 's') + C(ex, ey, er * .45, 'if');
  b += L(ex + 6, ey - 6, ex + 18, ey - 18, 'a') + L(ex + 18, ey - 18, ex + 26, ey - 18, 'a') + T(ex + 26, ey - 26, 'YOURS · 24 MM', 'tn tb', 'end');
  return svg(330, 196, 'A giant squid’s eye, 270 millimetres across, drawn to scale beside a human eye, 24 millimetres across', b);
}

/* Fireworks: each metal's light, as the lines it shines at on the spectrum */
function fireworks() {
  const x0 = 10, x1 = 430, ax = 100, X = (/** @type {number} */ nm) => x0 + (nm - 400) / 300 * (x1 - x0);
  /* symbol, colour, the lines (nm) its glowing compound gives off */
  const metals = [['Cu', '#4D6BFF', [428, 436, 446, 452]], ['Ba', '#34C779', [507, 513, 524, 532]], ['Na', '#F2C200', [589]], ['Ca', '#FF8A1F', [598, 606, 618]], ['Sr', '#F2334A', [636, 646, 661, 674, 682]]];
  let b = `<defs><linearGradient id="fw-sp" x1="0" y1="0" x2="1" y2="0">${[['#7A3CFF', 0], ['#3D5BFF', .12], ['#21B7E8', .28], ['#2FC76A', .42], ['#E8D21C', .6], ['#FF8A1F', .72], ['#F2334A', .86], ['#9C1020', 1]].map(([c, o]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient></defs>`;
  b += `<rect x="${x0}" y="${ax - 5}" width="${x1 - x0}" height="3" fill="url(#fw-sp)" opacity=".45"/>`;
  b += L(x0, ax, x1, ax, 'a');
  for (let nm = 400; nm <= 700; nm += 50) b += L(X(nm), ax, X(nm), ax + 5, 'a') + T(X(nm), ax + 17, nm === 700 ? '700 NM' : String(nm), 'tn', nm === 400 ? 'start' : nm === 700 ? 'end' : 'middle');
  for (const [sym, col, lines] of metals) {
    const xs = /** @type {number[]} */ (lines).map(X); xs.forEach((x, i) => { b += `<rect x="${f(x - 1)}" y="${f(34 + (i % 2) * 8)}" width="2" height="${f(ax - 8 - 34 - (i % 2) * 8)}" fill="${col}"/>`; });
    b += T((Math.min(...xs) + Math.max(...xs)) / 2, 24, String(sym), 'tb tl', 'middle');
  }
  b += L(X(440), 12, X(440), 4, 'h') + T(X(440) + 4, 9, 'BLUE: THE HARDEST', 'tk');
  return svg(440, 124, 'Emission lines on the visible spectrum from 400 to 700 nanometres: copper in the blue, barium in the green, sodium in the yellow, calcium in the orange and strontium in the red', b);
}

/* Dreams: a typical night, its dreaming stretches longer towards morning */
function dreams() {
  const x0 = 34, x1 = 434, mins = 480, X = (/** @type {number} */ m) => x0 + m / mins * (x1 - x0);
  /** @type {Record<string, number>} */ const lv = { W: 12, R: 34, N1: 56, N2: 78, N3: 100 };
  const night = [[0, 'W'], [8, 'N1'], [16, 'N2'], [38, 'N3'], [72, 'N2'], [86, 'R'], [96, 'N2'], [112, 'N3'], [146, 'N2'], [172, 'R'], [192, 'N2'], [228, 'N3'], [244, 'N2'], [262, 'R'], [292, 'N1'], [298, 'N2'], [338, 'R'], [378, 'N2'], [414, 'R'], [462, 'W'], [480, 'W']];
  let b = '';
  for (const [k, y] of Object.entries(lv)) b += L(x0, y, x1, y, 'h') + T(x0 - 6, y + 3.5, k === 'W' ? 'WAKE' : k === 'R' ? 'REM' : k, k === 'R' ? 'tk' : '', 'end');
  for (let h = 0; h <= 8; h += 2) b += L(X(h * 60), 112, X(h * 60), 117, 'a') + T(X(h * 60), 128, `${String((23 + h) % 24).padStart(2, '0')}:00`, 'tn', h === 0 ? 'start' : h === 8 ? 'end' : 'middle');
  /** @type {[number, number][]} */ const p = [];
  for (let i = 0; i < night.length - 1; i++) { const [m, s] = night[i], [m2] = night[i + 1]; const y = lv[s]; p.push([X(+m), y], [X(+m2), y]); }
  b += P(pts(p), 'a');
  night.forEach(([m, s], i) => { if (s !== 'R') return; const m2 = +night[i + 1][0]; b += L(X(+m), lv.R, X(m2), lv.R, 'kk'); });
  b += T(X(438), lv.R - 9, 'LONGEST', 'tk', 'middle');
  return svg(440, 132, 'A typical night’s sleep stages from 23:00 to 07:00, with five dreaming stretches of REM sleep that grow longer towards morning', b);
}

/* Infinity: Cantor's diagonal, the number that differs from every number on any list */
function cantor() {
  const rows = ['5105110', '4142135', '7182818', '3333333', '1428571', '0000001', '6180339'];
  const cw = 15, x0 = 34, y0 = 14, lh = 16; let b = '';
  rows.forEach((r, i) => { b += T(x0 - 12, y0 + i * lh, '0.', 'tn tl', 'end'); [...r].forEach((d, j) => { b += T(x0 + j * cw, y0 + i * lh, d, i === j ? 'tn tk tl' : 'tn tl', 'middle'); }); });
  const diag = rows.map((r, i) => String((+r[i] + 1) % 10)).join('');
  const ny = y0 + rows.length * lh + 9; b += L(x0 - 26, ny - 11, x0 + rows.length * cw - 6, ny - 11, 'a');
  b += T(x0 - 12, ny + 3, '0.', 'tn tb tl', 'end'); [...diag].forEach((d, j) => { b += T(x0 + j * cw, ny + 3, d, 'tn tb tl', 'middle'); });
  b += T(x0 + rows.length * cw + 2, ny + 3, '∉', 'tk tl') + T(x0 - 26, ny + 22, 'DIFFERS FROM EVERY ROW');
  return svg(156, 160, 'Cantor’s diagonal: a list of decimal numbers, its diagonal digits picked out, and below them a new number that differs from every one on the list', b);
}

/* Northern lights: the photograph, and beside it an altitude scale for the light's colours */
function aurora() {
  const y0 = 300, y1 = 20, km0 = 0, km1 = 500, Y = (/** @type {number} */ k) => y0 - (k - km0) / (km1 - km0) * (y0 - y1), x = 60;
  let b = L(x, Y(0), x, Y(500), 'a');
  for (let k = 0; k <= 500; k += 100) b += L(x - 4, Y(k), x, Y(k), 'a') + T(x - 8, Y(k) + 3.5, k ? `${k}` : '0 KM', 'tn', 'end');
  /** @param {number} a @param {number} z @param {string} c @param {string} t1 @param {string} t2 */
  const band = (a, z, c, t1, t2) => `<rect x="${x + 6}" y="${f(Y(z))}" width="4" height="${f(Y(a) - Y(z))}" fill="${c}"/>` + L(x + 12, (Y(a) + Y(z)) / 2, x + 22, (Y(a) + Y(z)) / 2, 'a') + T(x + 26, (Y(a) + Y(z)) / 2 - 1, t1, 'tb') + T(x + 26, (Y(a) + Y(z)) / 2 + 11, t2, 'tn');
  b += band(300, 500, '#FF5468', 'OXYGEN · 630.0 NM', 'RED, HIGHEST');
  b += band(100, 300, '#56F08C', 'OXYGEN · 557.7 NM', 'GREEN');
  b += band(85, 105, '#9C8CFF', 'NITROGEN · 428 NM', 'BLUE EDGES, LOWEST');
  const scale = svg(190, 320, 'An altitude scale from 0 to 500 km: red oxygen light above about 300 km, green oxygen light from about 100 to 300 km, blue nitrogen light at the lowest edges', b);
  return `<img class="nl-img" src="/api/picture?f=d%2Fd3%2FAurora_borealis_over_Eielson_Air_Force_Base%2C_Alaska.jpg&amp;w=1280" alt="The northern lights over Bear Lake, Alaska" width="1280" height="834" fetchpriority="low"><div class="nl-scale">${scale}</div>`;
}

/* Enigma machine: its rotor windows, the key you type, and the lampboard in the machine's own QWERTZ rows,
   where the letter it turns yours into lights (the page wires it up; the cipher is src/shared/enigma.js) */
function enigmaBoard() {
  const lamps = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'].map(r => `<p>${[...r].map(c => `<i data-l="${c}">${c}</i>`).join('')}</p>`).join('');
  return `<div class="en"><div class="en-top"><p class="en-r" aria-label="Rotor positions"><span>A</span><span>A</span><span>A</span></p><label class="en-in"><span>TYPE</span><input type="text" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="WETTER" aria-label="Type a word to encrypt"></label></div><div class="en-lamps" aria-hidden="true">${lamps}</div><div class="en-tape" aria-live="polite"><p><span>YOURS</span><b class="en-pl"></b></p><p><span>LAMPS</span><b class="en-cy"></b></p></div><p class="en-k">ONE OF 158,962,555,217,826,360,000 POSSIBLE SETTINGS</p></div>`;
}

/** @typedef {{ t: string, size: 'hero' | 'sq' | 'wide' | 'small' | 'big', tab?: 'wide' | 'sq', art: () => string, more?: string, fx?: string, credit?: string, hook?: string, src: string[] }} Card */
/** The cards, in the order the page lays them out. A card's hook is its topic's unless it says otherwise. @type {Card[]} */
export const CARDS = [
  { t: 'Northern lights', size: 'hero', art: aurora, credit: 'Joshua Strang, US Air Force · Public domain', src: ['https://science.nasa.gov/earth/earth-observatory/auroras-dancing-in-the-night', 'https://en.wikipedia.org/wiki/Aurora', 'https://commons.wikimedia.org/wiki/File:Aurora_borealis_over_Eielson_Air_Force_Base,_Alaska.jpg'] },
  { t: 'Time travel', size: 'small', hook: 'Satellite clocks run fast. Uncorrected, your map would drift 11 km a day.', art: () => '<div class="tt"><p class="tt-big"><b>+38<i>.</i>6</b><span>µs A DAY</span></p><p class="tt-parts"><span>SPECIAL <b>−7<i>.</i>2</b></span><span>GENERAL <b>+45<i>.</i>8</b></span></p></div>', src: ['https://en.wikipedia.org/wiki/Error_analysis_for_the_Global_Positioning_System'] },
  { t: 'Black holes', size: 'sq', hook: 'Squeeze Earth into a marble 18 mm across and it would collapse into a black hole.', art: blackHoles, src: ['https://en.wikipedia.org/wiki/Schwarzschild_radius'] },
  { t: 'Volcanoes', size: 'wide', hook: 'Krakatoa’s blast went round the world: barographs caught the pressure wave seven times in five days.', art: krakatoa, src: ['https://en.wikipedia.org/wiki/1883_eruption_of_Krakatoa'] },
  { t: 'Pompeii', size: 'small', hook: 'The textbook says 24 August. A charcoal note found in 2018 points to October.', art: pompeii, src: ['https://en.wikipedia.org/wiki/Eruption_of_Mount_Vesuvius_in_79_AD'] },
  { t: 'Rubik’s Cube', size: 'sq', hook: 'Every one of them can be solved in 20 moves or fewer. It took until 2010 to prove.', art: rubik, more: `<div class="rb-chart">${rubikMoves()}</div><p class="rb-n" data-fx="odometer">43,252,003,<wbr>274,489,856,000</p><p class="rb-u">POSITIONS</p>`, src: ['https://www.cube20.org/', 'https://en.wikipedia.org/wiki/Rubik%27s_Cube'] },
  { t: 'Venus flytraps', size: 'sq', fx: 'flytrap', hook: 'It counts: two touches within 20 seconds shut it, five start digestion.', art: flytrap, src: ['https://en.wikipedia.org/wiki/Venus_flytrap'] },
  { t: 'Quicksand', size: 'sq', tab: 'wide', hook: 'You can’t sink past your waist, but pulling a foot out takes the force to lift a car.', art: quicksand, src: ['https://en.wikipedia.org/wiki/Quicksand'] },
  { t: 'Fireworks', size: 'wide', hook: 'Every colour is a metal. Blue, from copper, is the hardest to get right: too hot and it fades.', art: fireworks, src: ['https://en.wikipedia.org/wiki/Fireworks', 'https://www.aps.org/apsnews/2026/06/the-showy-science-of-fireworks'] },
  { t: 'Giant squid', size: 'sq', hook: 'Its eyes reach 27 cm across, as big as any animal’s.', art: squid, src: ['https://en.wikipedia.org/wiki/Giant_squid'] },
  { t: 'Dreams', size: 'wide', hook: 'You dream in stretches about 90 minutes apart, and the longest comes just before you wake.', art: dreams, src: ['https://en.wikipedia.org/wiki/Rapid_eye_movement_sleep', 'https://en.wikipedia.org/wiki/Sleep_cycle'] },
  { t: 'Enigma machine', size: 'big', fx: 'enigma', hook: 'It never turned a letter into itself, and that flaw helped break it. Try it.', art: enigmaBoard, src: ['https://en.wikipedia.org/wiki/Cryptanalysis_of_the_Enigma', 'https://en.wikipedia.org/wiki/Enigma_machine', 'https://www.pbs.org/wgbh/nova/article/how-enigma-works'] },
  { t: 'Infinity', size: 'sq', hook: 'Some infinities are bigger than others, and Cantor’s diagonal shows why.', art: cantor, src: ['https://en.wikipedia.org/wiki/Cantor%27s_diagonal_argument'] },
];

/** What the front page fetches. */
export function frontData() {
  const byTitle = new Map(FRONT.map(t => [t.t, t]));
  return {
    v: 1,
    topics: FRONT.map(({ t, k, h }) => ({ t, k, h })),
    threads: THREADS.map(({ a, b, l }) => ({ a, b, l })),
    cards: CARDS.map(c => { const t = /** @type {FrontTopic} */ (byTitle.get(c.t)); return { t: c.t, k: t.k, size: c.size, ...(c.tab ? { tab: c.tab } : {}), hook: c.hook || t.h, art: c.art(), ...(c.more ? { more: c.more } : {}), ...(c.fx ? { fx: c.fx } : {}), ...(c.credit ? { credit: c.credit } : {}) }; }),
  };
}
