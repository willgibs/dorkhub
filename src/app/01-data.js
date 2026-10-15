/* ================= data ================= */
/* What a topic is, in eight colours: a page's accent, its links and its place in Your world all
   take the colour of their kind. The writer names a topic's kind from a longer list (KINDS in
   article.js); these are the groups that list folds into. */
const KIND_GROUP = { concept: 'concept', idea: 'concept', phenomenon: 'phenomenon', mechanism: 'mechanism', technique: 'mechanism', place: 'place', person: 'person', event: 'event', era: 'event', thing: 'thing', creature: 'thing', work: 'thing', mystery: 'mystery' };
const KIND_LABEL = { concept: 'Ideas', phenomenon: 'Phenomena', mechanism: 'Mechanisms', place: 'Places', person: 'People', event: 'Events', thing: 'Things', mystery: 'Mysteries' };
/* the same colours the stylesheet gives [data-kind], for drawing on a canvas */
const KIND_HEX = {
  light: { concept: '#2563EB', phenomenon: '#0E7C86', mechanism: '#2F7D32', place: '#A16207', person: '#C2410C', event: '#BE123C', thing: '#A21CAF', mystery: '#6D28D9' },
  dark: { concept: '#93B4FF', phenomenon: '#5CD0D8', mechanism: '#7FD483', place: '#F5B94A', person: '#FF9F6E', event: '#FF8A9E', thing: '#F08CF5', mystery: '#B89CFF' },
};
const kindOf = k => KIND_GROUP[k] || '';
const kattr = k => { const g = kindOf(k); return g ? ` data-kind="${g}"` : ''; };
/* Voices: the name and description shown in the voice menu. The wording the writer actually
   gets lives on the server, in lib/prompts.js. */
const LENSES = {
  encyclopedic: ['Encyclopedic', 'Precise and dense, like the best reference writing, but warm.'],
  story: ['Storyteller', 'Built around people, moments and scenes.'],
  nerd: ['Deep nerd', 'Mechanisms, numbers and jargon, briefly glossed.'],
  kid: ['Curious kid', 'For a sharp 12-year-old. Never condescending.'],
  skeptic: ['Skeptic', 'Separates what is known from what is claimed.'],
};
const LENS_SHORT = { story: 'a story', nerd: 'deep nerd', kid: 'for a kid', skeptic: 'a skeptic' };
const LENS_PHRASE = { encyclopedic: 'encyclopedic', story: 'told as a story', nerd: 'for deep nerds', kid: 'for a curious kid', skeptic: 'through a skeptic’s eyes' };
