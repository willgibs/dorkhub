import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AiConfigError, chatCompletion } from './gateway';

const MESSAGES = [{ role: 'user' as const, content: 'hello' }];

function okResponse(content: string) {
  return Response.json({ choices: [{ message: { content } }] }, { status: 200 });
}

beforeEach(() => {
  process.env.AI_GATEWAY_API_KEY = 'test-key';
  delete process.env.AI_GATEWAY_MODEL;
});

afterEach(() => {
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.AI_GATEWAY_MODEL;
});

describe('chatCompletion — ok path', () => {
  it('parses choices[0].message.content into { kind: "ok", content }', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => okResponse('a tagline'));

    const result = await chatCompletion({ messages: MESSAGES, fetchImpl });

    expect(result).toEqual({ kind: 'ok', content: 'a tagline' });
  });

  it('posts to the AI Gateway chat completions URL with a JSON body of model/messages/max_tokens', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => okResponse('x'));

    await chatCompletion({ messages: MESSAGES, maxTokens: 256, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://ai-gateway.vercel.sh/v1/chat/completions');
    expect(init?.method).toBe('POST');
    const body = JSON.parse(init?.body as string);
    expect(body).toEqual({
      model: 'google/gemini-2.5-flash-lite',
      messages: MESSAGES,
      max_tokens: 256,
    });
  });

  it('omits max_tokens from the body when not provided', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => okResponse('x'));

    await chatCompletion({ messages: MESSAGES, fetchImpl });

    const [, init] = fetchImpl.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body).not.toHaveProperty('max_tokens');
  });
});

describe('chatCompletion — status classification', () => {
  it('returns { kind: "rate_limited" } on 429', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response('{"error":"too many requests"}', { status: 429 }),
    );

    const result = await chatCompletion({ messages: MESSAGES, fetchImpl });

    expect(result).toEqual({ kind: 'rate_limited' });
  });

  it('returns { kind: "error", status } on a 500', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response('{"error":"internal"}', { status: 500 }),
    );

    const result = await chatCompletion({ messages: MESSAGES, fetchImpl });

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') throw new Error('expected error');
    expect(result.status).toBe(500);
    expect(result.message).toContain('internal');
  });

  it('caps the error message body snippet at ~200 chars', async () => {
    const longBody = 'x'.repeat(500);
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(longBody, { status: 400 }));

    const result = await chatCompletion({ messages: MESSAGES, fetchImpl });

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') throw new Error('expected error');
    expect(result.message.length).toBeLessThanOrEqual(201);
  });

  it('returns { kind: "error" } when the fetch itself throws (network failure)', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error('getaddrinfo ENOTFOUND ai-gateway.vercel.sh');
    });

    const result = await chatCompletion({ messages: MESSAGES, fetchImpl });

    expect(result).toEqual({
      kind: 'error',
      message: 'getaddrinfo ENOTFOUND ai-gateway.vercel.sh',
    });
  });

  it('returns { kind: "error" } when the ok body is not parseable JSON', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('not json', { status: 200 }));

    const result = await chatCompletion({ messages: MESSAGES, fetchImpl });

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') throw new Error('expected error');
    expect(result.status).toBe(200);
  });

  it('returns { kind: "error" } when the ok body is missing choices[0].message.content', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response('{"choices":[]}', { status: 200 }),
    );

    const result = await chatCompletion({ messages: MESSAGES, fetchImpl });

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') throw new Error('expected error');
    expect(result.message).toContain('choices[0].message.content');
  });
});

describe('chatCompletion — config', () => {
  it('throws AiConfigError when AI_GATEWAY_API_KEY is missing, without calling fetch', async () => {
    delete process.env.AI_GATEWAY_API_KEY;
    const fetchImpl = vi.fn<typeof fetch>(async () => okResponse('x'));

    await expect(chatCompletion({ messages: MESSAGES, fetchImpl })).rejects.toThrow(AiConfigError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('throws AiConfigError when AI_GATEWAY_API_KEY is empty/whitespace', async () => {
    process.env.AI_GATEWAY_API_KEY = '   ';
    const fetchImpl = vi.fn<typeof fetch>(async () => okResponse('x'));

    await expect(chatCompletion({ messages: MESSAGES, fetchImpl })).rejects.toThrow(AiConfigError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends the Authorization Bearer header from AI_GATEWAY_API_KEY and a JSON content-type', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => okResponse('x'));

    await chatCompletion({ messages: MESSAGES, fetchImpl });

    const [, init] = fetchImpl.mock.calls[0];
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('authorization')).toBe('Bearer test-key');
    expect(headers.get('content-type')).toBe('application/json');
  });
});

describe('chatCompletion — model resolution', () => {
  it('defaults to google/gemini-2.5-flash-lite when no model or env override is given', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => okResponse('x'));

    await chatCompletion({ messages: MESSAGES, fetchImpl });

    const [, init] = fetchImpl.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.model).toBe('google/gemini-2.5-flash-lite');
  });

  it('uses AI_GATEWAY_MODEL when set and no per-call model is given', async () => {
    process.env.AI_GATEWAY_MODEL = 'openai/gpt-5-mini';
    const fetchImpl = vi.fn<typeof fetch>(async () => okResponse('x'));

    await chatCompletion({ messages: MESSAGES, fetchImpl });

    const [, init] = fetchImpl.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.model).toBe('openai/gpt-5-mini');
  });

  it('prefers a per-call model over AI_GATEWAY_MODEL and the default', async () => {
    process.env.AI_GATEWAY_MODEL = 'openai/gpt-5-mini';
    const fetchImpl = vi.fn<typeof fetch>(async () => okResponse('x'));

    await chatCompletion({ messages: MESSAGES, model: 'anthropic/claude-haiku', fetchImpl });

    const [, init] = fetchImpl.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.model).toBe('anthropic/claude-haiku');
  });
});
