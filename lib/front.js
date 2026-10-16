/* ================= the front page, by hand =================
   Will's call (2026-10-15): while the front page is updated by hand, every card is its own piece.
   The thirty-two topics planned as pages written ahead of time (and Bioluminescence) are here with a
   hook each; a dozen lead in as cards, each drawn its own way; the rest turn up as suggestions; and
   the threads between them make the map. Every claim carries its source, checked before it went in.
   No model writes any of it. `scripts/build.mjs` turns this into public/front.json, which only the
   front page fetches, so reading pages never carry the artwork. Until a topic's page is written, it
   opens a placeholder made from its hook and threads (lib/placeholder.js). */

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

/* Black holes: Earth, squeezed into the marble it would have to become. The grid behind the hole is bent the
   way a black hole bends what lies behind it: each point is seen further out, at (β + √(β² + 4θE²))/2, so the
   lines wrap a ring around it. On first sight Earth's outline collapses into the hole while the grid bends. */
function blackHoles() {
  const W = 365, H = 430, cx = 182.5, cy = 226, rE = 150, tE = 36;
  /** where the hole makes a point behind it appear @param {number} x @param {number} y @returns {[number, number]} */
  const lens = (x, y) => { const dx = x - cx, dy = y - cy, b = Math.hypot(dx, dy) || .01, t = (b + Math.sqrt(b * b + 4 * tE * tE)) / 2; return [cx + dx * t / b, cy + dy * t / b]; };
  /** a grid line, its points closer together where the hole bends it most @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 */
  const line = (x0, y0, x1, y1) => {
    const len = Math.hypot(x1 - x0, y1 - y0); /** @type {[number, number][]} */ const p = [];
    for (let d = 0; ; ) { const x = x0 + (x1 - x0) * d / len, y = y0 + (y1 - y0) * d / len; p.push(lens(x, y)); if (d >= len) break; d = Math.min(len, d + Math.min(20, Math.max(2.5, Math.hypot(x - cx, y - cy) / 5))); }
    const h = (/** @type {number} */ n) => Math.round(n * 2) / 2; return p.map(([x, y], i) => `${i ? 'L' : 'M'}${h(x)} ${h(y)}`).join('');
  };
  let flat = '', bent = '';
  for (let k = -9; k <= 8; k++) { const x = cx + 12 + 24 * k; if (x < -40 || x > W + 40) continue; flat += `M${f(x)} 0V${H}`; bent += line(x, -60, x, H + 60); }
  for (let k = -10; k <= 9; k++) { const y = cy + 12 + 24 * k; if (y < -40 || y > H + 40) continue; flat += `M0 ${f(y)}H${W}`; bent += line(-60, y, W + 60, y); }
  let b = `<defs><linearGradient id="bh-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".16" stop-color="#fff"/><stop offset=".9" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></linearGradient><mask id="bh-m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#bh-g)"/></mask><path id="bh-arc" d="M${f(cx - rE - 7)} ${cy}A${rE + 7} ${rE + 7} 0 0 1 ${f(cx + rE + 7)} ${cy}"/></defs>`;
  b += `<g mask="url(#bh-m)">${P(flat, 'bh-grid bh-flat')}${P(bent, 'bh-grid bh-lens')}</g>`;
  /* Earth: the outline that collapses, then its dashed ghost with its size along the top */
  b += `<circle class="a bh-earth fade" cx="${cx}" cy="${cy}" r="${rE}" stroke-dasharray="2 5"/>` + C(cx, cy, rE, 's bh-sq grow');
  b += `<text class="tn halo bh-earth fade"><textPath href="#bh-arc" startOffset="50%" text-anchor="middle">EARTH · Ø 12,742 KM</textPath></text>`;
  /* the hole: black in either theme, its photon ring in the topic's colour */
  b += G('bh-hole vpop', C(cx, cy, 15.5, 'k') + C(cx, cy, 13.5, 'bk'));
  b += G('bh-fig fade', dim(cx - 13.5, cx + 13.5, cy + 32) + `<text class="tf halo" x="${cx}" y="${cy + 66}" text-anchor="middle">17.7<tspan class="tu" dx="4">MM</tspan></text>` + T(cx, cy + 84, 'ACROSS ITS EVENT HORIZON', 'halo', 'middle'));
  b += T(18, H - 16, 'r = 2GM/c²', 'tc bh-eq');
  return svg(W, H, 'Earth’s outline, 12,742 km across, around the black hole it would become if squeezed to 17.7 mm across, with the grid behind it bent into a ring the way a black hole bends light', b, 'bh', 'xMidYMid slice');
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

/* Rubik's Cube: how many positions need each number of moves, 0 to 20, on a log scale (cube20.org: exact up to
   15 moves, its estimates from 16 up). The count climbs about thirteenfold a move to 18, which two in three
   positions need, then drops: about 490 million need all 20, and none need more. Pointing at a bar reads its count. */
const CUBE20 = /** @type {[number, string][]} */ ([[1, '1'], [18, '18'], [243, '243'], [3240, '3,240'], [43239, '43,239'], [574908, '574,908'], [7618438, '7,618,438'], [100803036, '100,803,036'], [1332343288, '1,332,343,288'], [17596479795, '17,596,479,795'], [232248063316, '232,248,063,316'], [3063288809012, '3,063,288,809,012'], [40374425656248, '40,374,425,656,248'], [531653418284628, '531,653,418,284,628'], [6989320578825358, '6,989,320,578,825,358'], [91365146187124313, '91,365,146,187,124,313'], [1.1e18, 'about 1,100,000,000,000,000,000'], [1.2e19, 'about 12,000,000,000,000,000,000'], [2.9e19, 'about 29,000,000,000,000,000,000'], [1.5e18, 'about 1,500,000,000,000,000,000'], [4.9e8, 'about 490,000,000']]);
/** a cube seen from above one corner, its top layer caught mid-turn @param {number} ox @param {number} oy @param {number} sc */
function cube(ox, oy, sc, turn = 24) {
  const c30 = Math.cos(Math.PI / 6), s30 = .5, th = turn * Math.PI / 180;
  /** @param {number[]} p @returns {[number, number]} */ const pr = ([x, y, z]) => [ox + (x - z) * c30 * sc, oy - y * sc + (x + z) * s30 * sc];
  /** @param {number[]} p */ const rot = ([x, y, z]) => [x * Math.cos(th) - z * Math.sin(th), y, x * Math.sin(th) + z * Math.cos(th)];
  const add = (/** @type {number[]} */ a, /** @type {number[]} */ b, k = 1) => a.map((v, i) => v + b[i] * k);
  /** a face's outline and its stickers' lines @param {number[]} o @param {number[]} u @param {number[]} v @param {number} nu @param {number} nv @param {(p: number[]) => number[]} m */
  /** @param {string} line @param {string} fill */
  const face = (/** @type {number[]} */ o, /** @type {number[]} */ u, /** @type {number[]} */ v, /** @type {number} */ nu, /** @type {number} */ nv, /** @type {(p: number[]) => number[]} */ m, line, fill) => {
    const q = [o, add(o, u, nu), add(add(o, u, nu), v, nv), add(o, v, nv)].map(p => pr(m(p)));
    let g = `<path class="${fill}" d="${pts(/** @type {any} */ (q))}Z"/>`;
    for (let i = 1; i < nu; i++) g += P(pts([pr(m(add(o, u, i))), pr(m(add(add(o, u, i), v, nv)))]), line);
    for (let i = 1; i < nv; i++) g += P(pts([pr(m(add(o, v, i))), pr(m(add(add(o, v, i), u, nu)))]), line);
    return g;
  };
  const id = (/** @type {number[]} */ p) => p;
  let b = '';
  /* the two layers that stay: their top, then the two sides you can see */
  b += face([-1.5, .5, -1.5], [1, 0, 0], [0, 0, 1], 3, 3, id, 'h', 'rb-face');
  b += face([1.5, -1.5, 1.5], [0, 0, -1], [0, 1, 0], 3, 2, id, 'h', 'rb-face');
  b += face([-1.5, -1.5, 1.5], [1, 0, 0], [0, 1, 0], 3, 2, id, 'h', 'rb-face');
  /* the turning layer: its sides nearest last, then its top */
  const d = [1, 1, 1];
  const sides = [[[1.5, .5, 1.5], [0, 0, -1], [0, 1, 0], [1, 0, 0]], [[-1.5, .5, 1.5], [1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1.5, .5, -1.5], [0, 0, 1], [0, 1, 0], [-1, 0, 0]], [[1.5, .5, -1.5], [-1, 0, 0], [0, 1, 0], [0, 0, -1]]]
    .map(([o, u, v, n]) => ({ o, u, v, n: rot(n) })).filter(x => x.n[0] * d[0] + x.n[2] * d[2] > 0)
    .sort((a, b2) => (a.n[0] + a.n[2]) - (b2.n[0] + b2.n[2]));
  for (const x of sides) b += face(x.o, x.u, x.v, 3, 1, rot, 'kt', 'rb-turn');
  b += face([-1.5, 1.5, -1.5], [1, 0, 0], [0, 0, 1], 3, 3, rot, 'kt', 'rb-turn');
  return b;
}
function rubikPlate() {
  const W = 329, H = 168, x0 = 30, x1 = 329, base = 146, top = 6, dec = (base - top) / 24, slot = (x1 - x0) / 21, X = (/** @type {number} */ m) => x0 + (m + .5) * slot;
  let b = '';
  for (const e of [0, 5, 10, 15, 20]) { const y = base - e * dec; b += L(x0, y, x1, y, e ? 'hp' : 'a') + T(x0 - 6, y + 3.5, /** @type {Record<number, string>} */ ({ 0: '1', 5: '10⁵', 10: '10¹⁰', 15: '10¹⁵', 20: '10²⁰' })[e], 'tn', 'end'); }
  CUBE20.forEach(([n, read], m) => {
    const h = Math.max(2, Math.log10(n) * dec), est = m >= 16;
    b += `<rect class="${est ? 'rb-est' : 'kf'} rb-bar w${1 + Math.floor(m * .55)}" x="${f(X(m) - 4.5)}" y="${f(base - h)}" width="9" height="${f(h)}"/>`;
    b += `<rect class="hit" data-read="${m} move${m === 1 ? '' : 's'} · ${read} position${n === 1 ? '' : 's'}${est ? ' (estimate)' : ''}" x="${f(X(m) - slot / 2)}" y="${top}" width="${f(slot)}" height="${base - top + 14}"/>`;
  });
  for (let m = 0; m <= 20; m++) b += L(X(m), base, X(m), base + (m % 5 ? 2.5 : 5), m % 5 ? 'h' : 'a');
  for (const m of [0, 5, 10, 15, 20]) b += T(X(m), base + 16, String(m), 'tn', 'middle');
  /* two in three need 18; about 490 million need all 20, and none need more */
  const h18 = Math.log10(2.9e19) * dec, h20 = Math.log10(4.9e8) * dec;
  b += T(X(18), base - h18 - 6, '2 IN 3', 'tk fade w12', 'middle');
  b += `<line class="kt fade w13" x1="${f(X(20))}" y1="${f(base - h20 - 3)}" x2="${f(X(20))}" y2="${top + 4}" stroke-dasharray="2 3"/>` + T(X(20) - 6, top + 7, 'ABOUT 490 MILLION NEED ALL 20', 'fade w13', 'end');
  /* the cube, in the corner the short bars leave */
  b += G('rb-cube', cube(80, 52, 11.5));
  return svg(W, H, 'Positions of the cube by the fewest moves they need, on a log scale: from 1 position at 0 moves, climbing about thirteenfold a move to some 29 quintillion at 18 moves, two in three of all positions, then about 1.5 quintillion at 19 and about 490 million at 20; none need more. A cube with its top layer mid-turn sits in the corner', b, 'rb');
}

/* Venus flytraps: the trap side on, its jaws open: two lobes hinged at the midrib, their red inner faces showing
   between them, three trigger hairs on each, long teeth along the rims, and the winged stalk running down to the
   plant. Shut, the jaws meet and their teeth cross like bars. The card lets you touch it; the page counts. */
function flytrap() {
  const W = 329, H = 172, hx = 104, hy = 98, tx = 272;
  /** a point on a cubic @param {number[][]} q @param {number} t */
  const cub = (q, t) => { const u = 1 - t; return [0, 1].map(k => u * u * u * q[0][k] + 3 * u * u * t * q[1][k] + 3 * u * t * t * q[2][k] + t * t * t * q[3][k]); };
  const q = (/** @type {number[]} */ [x, y]) => `${f(x)} ${f(y)}`;
  /** one jaw, drawn shut; s is -1 for the upper, 1 for the lower @param {number} s */
  const jaw = s => {
    const outer = [[hx, hy], [hx + 34, hy + s * 46], [tx - 46, hy + s * 44], [tx, hy + s * 3]], face = [[hx, hy], [hx + 38, hy + s * 24], [tx - 44, hy + s * 24], [tx, hy + s * 3]];
    let g = `<path class="ft-skin" d="M${q(outer[0])}C${q(outer[1])} ${q(outer[2])} ${q(outer[3])}L${hx + 6} ${hy}Z"/>`;
    g += `<path class="ft-face" d="M${q(face[0])}C${q(face[1])} ${q(face[2])} ${q(face[3])}L${hx + 6} ${hy}Z"/>`;
    /* teeth along the rim, longer towards the tip, leaning forward and across, so that shut the rows cross */
    for (let k = 0; k <= 17; k++) {
      const t = .3 + .7 * k / 17, [x, y] = cub(outer, t), [x2, y2] = cub(outer, Math.min(1, t + .01)), [x0, y0] = cub(outer, Math.max(0, t - .01));
      const dx = x2 - x0, dy = y2 - y0, len = Math.hypot(dx, dy) || 1, nx = dy / len * -s, ny = -dx / len * -s, l = 5 + 25 * ((t - .3) / .7) ** 1.4;
      const ux = nx * .55 + .75, uy = ny * .9 - s * .55, ul = Math.hypot(ux, uy);
      g += L(x, y, x + ux / ul * l, y + uy / ul * l, 'ft-tooth');
    }
    /* three trigger hairs on the inner face, standing into the gap */
    [.32, .5, .68].forEach((t, k) => { const [x, y] = cub(face, t); g += L(x, y + s * -1, x + 2, y - s * 9, 'kt ft-hair') + C(x + 2, y - s * 9, 1.7, `kf ft-tip${k === 1 && s < 0 ? ' ft-hint' : ''}`); });
    return `<g class="ft-${s < 0 ? 'up' : 'lo'}">${g}</g>`;
  };
  /* the stalk: a winged leaf from the hinge down to the plant */
  let b = `<path class="ft-skin" d="M${hx + 4} ${hy + 2}C${hx - 4} ${hy + 24} ${hx - 52} ${hy + 30} ${hx - 70} ${H + 2}H${hx - 60}C${hx - 40} ${hy + 46} ${hx - 2} ${hy + 40} ${hx + 4} ${hy + 2}Z"/>` + P(`M${hx + 2} ${hy + 4}C${hx - 18} ${hy + 30} ${hx - 50} ${hy + 44} ${hx - 65} ${H + 2}`, 'h');
  b += jaw(-1) + jaw(1) + C(hx + 2, hy, 3, 'if');
  /* the ping that invites a touch sits on the upper jaw's middle hair, where the open jaw holds it (27° up) */
  const [mx, my] = cub([[hx, hy], [hx + 38, hy - 24], [tx - 44, hy - 24], [tx, hy - 3]], .5), a27 = -27 * Math.PI / 180, dx = mx + 2 - hx, dy = my + 9 - hy;
  b += C(hx + dx * Math.cos(a27) - dy * Math.sin(a27), hy + dx * Math.sin(a27) + dy * Math.cos(a27), 8, 'ft-ping');
  return svg(W, H, 'A Venus flytrap side on, its jaws open: red inner faces with three trigger hairs on each lobe, long teeth along the rims, and a winged stalk', b, 'ft');
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

/* Northern lights: a photograph where the red shows above the green, and beside it a scale of the heights each
   colour comes from: red oxygen highest, green oxygen below it, blue nitrogen at the lowest edges. Auroral light
   has no hard edges, so neither do the bands; on first sight they rise up the scale in turn. */
function aurora() {
  const y0 = 304, y1 = 24, Y = (/** @type {number} */ k) => y0 - k / 500 * (y0 - y1), x = 60;
  let b = '<defs>';
  for (const [id, c] of [['nl-r', '#FF5468'], ['nl-g', '#56F08C'], ['nl-b', '#A08CFF']]) b += `<linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset=".14" stop-color="${c}"/><stop offset=".86" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`;
  b += '</defs>' + L(x, Y(0), x, Y(500), 'a');
  for (let k = 0; k <= 500; k += 50) b += L(x - (k % 100 ? 2.5 : 5), Y(k), x, Y(k), 'a') + (k % 100 ? '' : T(x - 9, Y(k) + 3.5, k ? `${k}` : '0', 'tn', 'end'));
  b += T(x - 9, Y(500) - 14, 'KM', '', 'end');
  /** @param {number} a @param {number} z @param {string} id @param {string} t1 @param {string} t2 @param {number} w */
  const band = (a, z, id, t1, t2, w) => { const m = (Y(a) + Y(z)) / 2; return `<rect class="nl-band w${w}" x="${x + 5}" y="${f(Y(z))}" width="5" height="${f(Y(a) - Y(z))}" rx="2.5" fill="url(#${id})"/>` + G(`fade w${w + 3}`, L(x + 14, m, x + 22, m, 'a') + T(x + 27, m - 2, t1, 'tb') + T(x + 27, m + 12, t2, 'tc')); };
  b += band(300, 500, 'nl-r', 'OXYGEN · 630.0 NM', 'red, highest', 5) + band(100, 300, 'nl-g', 'OXYGEN · 557.7 NM', 'green', 3) + band(85, 105, 'nl-b', 'NITROGEN · 428 NM', 'blue edges, lowest', 1);
  const scale = svg(190, 320, 'An altitude scale from 0 to 500 km: red oxygen light highest, above about 300 km; green oxygen light from about 100 to 300 km; blue nitrogen light at the lowest edges, near 100 km', b);
  return `<img class="nl-img" src="/api/picture?f=b%2Fb1%2F2024-10-10_Red_and_Green_Aurora_Borealis_over_Luray_VA_22-08-35_1.jpg&amp;w=1280" alt="The northern lights over Luray, Virginia: red light high above a band of green" width="1280" height="853" fetchpriority="low"><div class="nl-scale">${scale}</div>`;
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

/** @typedef {{ t: string, size: 'hero' | 'tall' | 'sq' | 'wide' | 'small' | 'big', tab?: 'wide' | 'sq' | 'big', art: () => string, more?: string, fx?: string, credit?: string, hook?: string, src: string[] }} Card */
/** The cards, in the order the page lays them out. A card's hook is its topic's unless it says otherwise. @type {Card[]} */
export const CARDS = [
  { t: 'Northern lights', size: 'hero', art: aurora, credit: 'G. Edward Johnson · CC BY 4.0', src: ['https://science.nasa.gov/earth/earth-observatory/auroras-dancing-in-the-night', 'https://en.wikipedia.org/wiki/Aurora', 'https://commons.wikimedia.org/wiki/File:2024-10-10_Red_and_Green_Aurora_Borealis_over_Luray_VA_22-08-35_1.jpg'] },
  { t: 'Black holes', size: 'tall', tab: 'sq', hook: 'Squeeze Earth into a marble 18 mm across and it would collapse into a black hole.', art: blackHoles, src: ['https://en.wikipedia.org/wiki/Schwarzschild_radius'] },
  { t: 'Volcanoes', size: 'wide', hook: 'Krakatoa’s blast went round the world: barographs caught the pressure wave seven times in five days.', art: volcanoes, src: ['https://en.wikipedia.org/wiki/1883_eruption_of_Krakatoa'] },
  { t: 'Pompeii', size: 'sq', hook: 'The textbook says 24 August. A charcoal note found in 2018 points to October.', art: pompeii, src: ['https://en.wikipedia.org/wiki/Eruption_of_Mount_Vesuvius_in_79_AD', 'https://www.thelocal.it/20181016/was-pompeii-destroyed-two-months-later-than-we-thought'] },
  { t: 'Time travel', size: 'wide', fx: 'ticker', hook: 'Satellite clocks run fast. Uncorrected, your map would drift about 11 km a day.', art: timeTravel, src: ['https://en.wikipedia.org/wiki/Error_analysis_for_the_Global_Positioning_System'] },
  { t: 'Rubik’s Cube', size: 'sq', hook: 'Every one of them can be solved in 20 moves or fewer. It took until 2010 to prove.', art: () => `<div class="rb-chart">${rubikPlate()}</div><p class="rb-n" data-fx="odometer">43,252,003,<wbr>274,489,856,000</p><p class="wc-read">positions in all · from 16 moves up, estimates</p>`, src: ['https://www.cube20.org/', 'https://en.wikipedia.org/wiki/Rubik%27s_Cube'] },
  { t: 'Venus flytraps', size: 'sq', fx: 'flytrap', hook: 'It counts: two touches within 20 seconds shut it, five start digestion.', art: flytrap, src: ['https://en.wikipedia.org/wiki/Venus_flytrap'] },
  { t: 'Quicksand', size: 'sq', tab: 'big', hook: 'You can’t sink past your waist, but pulling a foot out takes the force to lift a car.', art: quicksand, src: ['https://en.wikipedia.org/wiki/Quicksand'] },
  { t: 'Fireworks', size: 'wide', hook: 'Every colour is a metal. Blue, from copper, is the hardest to get right: too hot and it fades.', art: fireworks, more: '<p class="wc-read">Point at a burst</p>', src: ['https://en.wikipedia.org/wiki/Fireworks', 'https://www.aps.org/apsnews/2026/06/the-showy-science-of-fireworks'] },
  { t: 'Giant squid', size: 'sq', hook: 'Its eyes reach 27 cm across, as big as any animal’s.', art: squid, src: ['https://en.wikipedia.org/wiki/Giant_squid'] },
  { t: 'Dreams', size: 'wide', hook: 'You dream in stretches about 90 minutes apart, and the longest comes just before you wake.', art: dreams, more: '<p class="wc-read">Point at the night</p>', src: ['https://en.wikipedia.org/wiki/Rapid_eye_movement_sleep', 'https://en.wikipedia.org/wiki/Sleep_cycle'] },
  { t: 'Enigma machine', size: 'big', fx: 'enigma', hook: 'It never turned a letter into itself, and that flaw helped break it. Try it.', art: enigmaBoard, more: ENIGMA_TAPE, src: ['https://en.wikipedia.org/wiki/Cryptanalysis_of_the_Enigma', 'https://en.wikipedia.org/wiki/Enigma_machine', 'https://www.pbs.org/wgbh/nova/article/how-enigma-works'] },
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
