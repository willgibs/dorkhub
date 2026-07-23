import 'server-only';

/**
 * Thin plain-`fetch` client for the Vercel AI Gateway's OpenAI-compatible
 * chat completions endpoint — no SDK (see docs/plans/p2-discovery.md, locked
 * decision #10: one endpoint doesn't justify a dependency, mirrors the
 * no-octokit rationale in src/lib/github/client.ts). Every exported function
 * accepts an injectable `fetchImpl` so callers (and tests) never touch the
 * real network or mock a module.
 */

const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';

/** Default chat model, overridable per-call (`opts.model`) or globally via `AI_GATEWAY_MODEL`. */
const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite';

/** Error message bodies are truncated to this many characters before being surfaced. */
const ERROR_MESSAGE_CAP = 200;

/**
 * Thrown when `AI_GATEWAY_API_KEY` is missing/empty. Read lazily at call
 * time (not import time) so this module can be imported anywhere without
 * requiring the env var to already be configured — mirrors `GithubConfigError`
 * in src/lib/github/client.ts.
 */
export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiConfigError';
  }
}

export type ChatMessage = { role: 'system' | 'user'; content: string };

/** Options accepted by `chatCompletion`. */
export type ChatCompletionOpts = {
  messages: ChatMessage[];
  /** Forwarded as `max_tokens`; omitted from the request body when not set. */
  maxTokens?: number;
  /** Overrides `AI_GATEWAY_MODEL`/`DEFAULT_MODEL` for this call only. */
  model?: string;
  /** Injectable for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
};

type ChatCompletionOk = { kind: 'ok'; content: string };

type ChatCompletionNotOk =
  | { kind: 'rate_limited' }
  | { kind: 'error'; status?: number; message: string };

export type ChatCompletionResult = ChatCompletionOk | ChatCompletionNotOk;

/**
 * Reads `AI_GATEWAY_API_KEY` lazily so import-time failures never happen —
 * only a call that actually needs the key can fail, and it fails loudly.
 */
function aiGatewayKey(): string {
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!key) {
    throw new AiConfigError(
      'AI_GATEWAY_API_KEY is not set — required for AI enrichment (tagline/tags generation). ' +
        'Create a key in the Vercel dashboard and set it in .env.local / Vercel envs.',
    );
  }
  return key;
}

function networkErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function shortBodySnippet(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.length > ERROR_MESSAGE_CAP ? `${text.slice(0, ERROR_MESSAGE_CAP)}…` : text;
  } catch {
    return `AI Gateway responded ${res.status} with an unreadable body`;
  }
}

/**
 * Calls the AI Gateway's chat completions endpoint and returns a
 * discriminated result. Never throws except `AiConfigError` — every other
 * failure mode (429 rate limit, other non-ok statuses, a network-level fetch
 * throw, or a malformed/unparseable response body) is surfaced as a
 * `kind: 'rate_limited'` or `kind: 'error'` result for the caller to branch
 * on, mirroring `GithubResult` in src/lib/github/client.ts.
 */
export async function chatCompletion(opts: ChatCompletionOpts): Promise<ChatCompletionResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const key = aiGatewayKey();
  const model = opts.model ?? process.env.AI_GATEWAY_MODEL?.trim() ?? DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetchImpl(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: opts.messages,
        max_tokens: opts.maxTokens,
      }),
    });
  } catch (err) {
    return { kind: 'error', message: networkErrorMessage(err) };
  }

  if (res.status === 429) {
    return { kind: 'rate_limited' };
  }

  if (!res.ok) {
    return { kind: 'error', status: res.status, message: await shortBodySnippet(res) };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return {
      kind: 'error',
      status: res.status,
      message: 'AI Gateway returned an unparseable JSON body',
    };
  }

  const content = (body as { choices?: Array<{ message?: { content?: unknown } }> } | null)
    ?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    return {
      kind: 'error',
      status: res.status,
      message: 'AI Gateway response was missing choices[0].message.content',
    };
  }

  return { kind: 'ok', content };
}
