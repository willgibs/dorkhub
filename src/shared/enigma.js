/* ================= Enigma I, as the front page's card runs it =================
   Rotors I, II and III left to right (III turns fastest), reflector B, rings at A, no plugboard.
   It steps before each letter, with the middle rotor's double step. Pure, so a test can hold it to the
   machine's known answer (AAAAA from AAA is BDZGO) and to its flaw: no letter ever becomes itself. */
/** @type {[string, number][]} the wiring, and the position at which each turns the next */
const ENIGMA_ROTORS = [['EKMFLGDQVZNTOWYHXUSPAIBRCJ', 16], ['AJDKSIRUXBLHWTMCQGZNPYFVOE', 4], ['BDFHJLCPRTXVZNYEIWGAKMUSQO', 21]];
const ENIGMA_REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';

/** @param {string} text @param {string} [start] the rotor letters, left to right @returns {{ out: string, pos: string }} */
export function enigma(text, start = 'AAA') {
  const pos = [...start.toUpperCase().slice(0, 3).padEnd(3, 'A')].map(c => (c.charCodeAt(0) - 65 + 26) % 26);
  /** @param {number} c @param {number} r @param {boolean} back */
  const pass = (c, r, back) => {
    const w = ENIGMA_ROTORS[r][0], p = pos[r];
    if (!back) return (w.charCodeAt((c + p) % 26) - 65 - p + 26) % 26;
    return (w.indexOf(String.fromCharCode(65 + (c + p) % 26)) - p + 26) % 26;
  };
  let out = '';
  for (const ch of text.toUpperCase()) {
    if (ch < 'A' || ch > 'Z') continue;
    /* the right rotor always turns; the middle turns when the right passes its notch, and again on
       its own notch, taking the left with it (the double step) */
    if (pos[1] === ENIGMA_ROTORS[1][1]) { pos[0] = (pos[0] + 1) % 26; pos[1] = (pos[1] + 1) % 26; }
    else if (pos[2] === ENIGMA_ROTORS[2][1]) pos[1] = (pos[1] + 1) % 26;
    pos[2] = (pos[2] + 1) % 26;
    let c = ch.charCodeAt(0) - 65;
    c = pass(pass(pass(c, 2, false), 1, false), 0, false);
    c = ENIGMA_REFLECTOR.charCodeAt(c) - 65;
    c = pass(pass(pass(c, 0, true), 1, true), 2, true);
    out += String.fromCharCode(65 + c);
  }
  return { out, pos: pos.map(p => String.fromCharCode(65 + p)).join('') };
}
