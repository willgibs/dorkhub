/* ================= models: who can write a page =================
   One catalog for the browser (the Keys sheet) and the server (which model to call).
   Only models that have passed our quality bar are offered ("vetted"). The others are
   wired up but stay hidden until a model eval clears them. Prices are USD per million
   tokens, input then output. Like article.js, this is inlined into the page script by
   the build, so keep it dependency-free. */

export const TRIAL_MODEL = 'anthropic/claude-haiku-5.5';

export const PROVIDERS = {
  anthropic: { name: 'Anthropic', enabled: true, keyPrefix: 'sk-ant-', keyHint: 'sk-ant-…', keyWhere: 'console.anthropic.com, under API keys', quick: 'anthropic/claude-haiku-5.5' },
  gateway: { name: 'Vercel AI Gateway', enabled: true, keyPrefix: 'vck_', keyHint: 'vck_…', keyWhere: 'vercel.com, under AI Gateway, then API keys', quick: 'anthropic/claude-haiku-5.5' },
  openai: { name: 'OpenAI', enabled: false, keyPrefix: 'sk-', keyHint: 'sk-…', keyWhere: 'platform.openai.com, under API keys', quick: 'openai/gpt-6-luna' },
  google: { name: 'Google Gemini', enabled: false, keyPrefix: 'AIza', keyHint: 'AIza…', keyWhere: 'aistudio.google.com, under Get API key', quick: 'google/gemini-3.8-flash' },
};

export const MODELS = [
  { id: 'anthropic/claude-haiku-5.5', name: 'Claude Haiku 5.5', blurb: 'Fast and light. The free pages use it.', price: [0.1, 0.5], vetted: true },
  { id: 'anthropic/claude-sonnet-5.5', name: 'Claude Sonnet 5.5', blurb: 'Richer, more specific pages, a few seconds slower.', price: [2, 10], vetted: true },
  { id: 'anthropic/claude-opus-5.5', name: 'Claude Opus 5.5', blurb: 'The deepest writer. Slower and pricier.', price: [4, 20], vetted: true },
  { id: 'openai/gpt-6.1-sol', name: 'GPT-6.1 Sol', blurb: '', price: [2, 10], vetted: false },
  { id: 'openai/gpt-6-luna', name: 'GPT-6 Luna', blurb: '', price: [0.1, 0.5], vetted: false },
  { id: 'google/gemini-4-argon', name: 'Gemini 4 Argon', blurb: '', price: [2, 10], vetted: false },
  { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash', blurb: '', price: [0.75, 3.75], vetted: false },
];

/** @param {string} id */
export const makerOf = id => String(id).split('/')[0];
/** @param {string} id */
export const findModel = id => MODELS.find(m => m.id === id) || null;

/* The provider's own name for a model. Anthropic writes versions with dashes (claude-haiku-5-5). */
/** @param {string} id */
export function directId(id) {
  const [maker, name = ''] = String(id).split('/');
  return maker === 'anthropic' ? name.replace(/(\d)\.(\d)/g, '$1-$2') : name;
}

/* What a key can write with: its own maker's vetted models, or any vetted model through the gateway. */
/** @param {string} provider */
export function modelsFor(provider) {
  const p = PROVIDERS[/** @type {keyof typeof PROVIDERS} */ (provider)];
  if (!p || !p.enabled) return [];
  return MODELS.filter(m => m.vetted && (provider === 'gateway' || makerOf(m.id) === provider));
}

/* A typical page is about 2,500 tokens in and 1,700 out. Used only for the rough cost shown to key holders. */
export const PAGE_TOKENS = [2500, 1700];
/** @param {{ price: number[] }} m */
export const pageCost = m => (m.price[0] * PAGE_TOKENS[0] + m.price[1] * PAGE_TOKENS[1]) / 1e6;
