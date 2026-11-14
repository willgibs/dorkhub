/* ================= Enigma I, as the front page's card runs it =================
   Rotors I, II and III left to right (III turns fastest), reflector B, rings at A, no plugboard.
   It steps before each letter, with the middle rotor's double step. Pure, so a test can hold it to the
   machine's known answer (AAAAA from AAA is BDZGO) and to its flaw: no letter ever becomes itself. */
/** @type {[string, number][]} the wiring, and the position at which each turns the next */
const ENIGMA_ROTORS = [['EKMFLGDQVZNTOWYHXUSPAIBRCJ', 16], ['AJDKSIRUXBLHWTMCQGZNPYFVOE', 4], ['BDFHJLCPRTXVZNYEIWGAKMUSQO', 21]];
const ENIGMA_REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';

/** The card's drawing of the wiring, 312 by 112: the top contact's height and the step to the next, the reflector's
    face, each rotor's right and left faces (the left rotor first), and the contacts the keys and lamps are wired to. */
export const EN_WIRE = { W: 312, H: 112, top: 9, step: 4, ukw: 30, faces: [[112, 40], [198, 126], [284, 212]], entry: 296 };

/** Rotor r (0 the left, 2 the right) turned to p: the contact a contact is wired to, a letter's place counted from A
    at the top of the machine; `back` is the way home, from the reflector's side.
    @param {number} r @param {number} p @param {number} c @param {boolean} [back] */
export function wired(r, p, c, back) {
  const w = ENIGMA_ROTORS[r][0];
  return ((back ? w.indexOf(String.fromCharCode(65 + (c + p) % 26)) : w.charCodeAt((c + p) % 26) - 65) - p + 26) % 26;
}
/** the reflector's pairs: the contact each contact is joined to @param {number} c */
export const reflected = c => ENIGMA_REFLECTOR.charCodeAt(c) - 65;
/** One letter's way through the machine with its rotors at pos (left to right): the contact it is on as it goes in,
    after the right, middle and left rotors, after the reflector, and after the left, middle and right rotors again.
    The last is the lamp. @param {number} c @param {number[]} pos @returns {number[]} */
export function enigmaWay(c, pos) {
  const way = [c];
  for (const r of [2, 1, 0]) way.push(c = wired(r, pos[r], c));
  way.push(c = reflected(c));
  for (const r of [0, 1, 2]) way.push(c = wired(r, pos[r], c, true));
  return way;
}

/** @param {string} text @param {string} [start] the rotor letters, left to right @returns {{ out: string, pos: string }} */
export function enigma(text, start = 'AAA') {
  const pos = [...start.toUpperCase().slice(0, 3).padEnd(3, 'A')].map(c => (c.charCodeAt(0) - 65 + 26) % 26);
  let out = '';
  for (const ch of text.toUpperCase()) {
    if (ch < 'A' || ch > 'Z') continue;
    /* the right rotor always turns; the middle turns when the right passes its notch, and again on
       its own notch, taking the left with it (the double step) */
    if (pos[1] === ENIGMA_ROTORS[1][1]) { pos[0] = (pos[0] + 1) % 26; pos[1] = (pos[1] + 1) % 26; }
    else if (pos[2] === ENIGMA_ROTORS[2][1]) pos[1] = (pos[1] + 1) % 26;
    pos[2] = (pos[2] + 1) % 26;
    out += String.fromCharCode(65 + enigmaWay(ch.charCodeAt(0) - 65, pos)[7]);
  }
  return { out, pos: pos.map(p => String.fromCharCode(65 + p)).join('') };
}
