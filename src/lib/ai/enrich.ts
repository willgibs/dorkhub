/**
 * Pure prompt-building and response-parsing helpers for AI enrichment — no
 * IO here; `chatCompletion` (./gateway) does the actual network call. Split
 * out so this logic is trivially unit-testable without a fetch mock.
 *
 * Used by the queue admin's enrich action (P2 Wave 2D, docs/plans/
 * p2-discovery.md, locked decisions #8–#9): generates an `ai_tagline` +
 * `ai_tags` best-effort guess for candidates missing a description or
 * topics, reviewed by a human before/at approve time.
 */

import { parseTagsInput } from '@/lib/projects/fields';
import type { ChatMessage } from './gateway';

/** README text is clipped to this many characters before being sent to the model. */
const README_CLIP_CHARS = 4000;

/** Same tagline length cap as `descriptionToTagline` in admin/queue/actions.ts. */
const TAGLINE_MAX_CHARS = 120;

/** Enrichment tags are capped tighter than the general `parseTagsInput` cap (8) — 6 is plenty for a card. */
const MAX_ENRICHMENT_TAGS = 6;

/**
 * A candidate "needs enrichment" when EITHER its description OR its topics
 * are missing — OR, not AND (docs/plans/p2-discovery.md, locked decision
 * #8). A described-but-untagged repo is still invisible to every tag-driven
 * discovery surface (more-like-this, recs, /tags connectivity), so having a
 * description alone isn't enough to skip it.
 */
export function needsEnrichment(c: { description: string | null; topics: string[] }): boolean {
  return !c.description?.trim() || c.topics.length === 0;
}

/** The subset of an ingest candidate's fields the prompt reads from. */
export type EnrichmentCandidate = {
  name: string;
  owner_login: string;
  description: string | null;
  primary_language: string | null;
  topics: string[];
};

const SYSTEM_PROMPT = `You write short metadata for dorkhub, a quiet gallery of hobbyist dev projects. Voice: lowercase, plain, no marketing-speak, no exclamation marks, no emoji.

Respond with STRICT JSON only — no markdown, no code fences, no commentary before or after. The JSON object must have exactly this shape:
{"tagline": string, "tags": string[]}

- "tagline": what the thing does, plainly, in 100 characters or fewer.
- "tags": up to 6 short lowercase tags in kebab-case (e.g. "cli-tool", "audio-synth").`;

/**
 * Builds the `{role, content}` messages array passed to `chatCompletion`.
 * The user message carries the repo's identity/language/existing
 * topics/description, plus the README (if fetched) clipped to
 * `README_CLIP_CHARS` — enough for a model to ground a tagline without
 * spending the whole context budget on it.
 */
export function buildEnrichmentPrompt(
  candidate: EnrichmentCandidate,
  readmeText: string | null,
): ChatMessage[] {
  const lines = [
    `repo: ${candidate.owner_login}/${candidate.name}`,
    `language: ${candidate.primary_language ?? 'unknown'}`,
    `existing topics: ${candidate.topics.length > 0 ? candidate.topics.join(', ') : 'none'}`,
    `existing description: ${candidate.description?.trim() || 'none'}`,
  ];

  if (readmeText) {
    lines.push('', 'readme:', readmeText.slice(0, README_CLIP_CHARS));
  }

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: lines.join('\n') },
  ];
}

export type ParsedEnrichment = { tagline: string | null; tags: string[] };

/** Strips a leading/trailing ``` or ```json code fence, if the model wrapped its JSON in one. */
function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

/** Trim, empty→null, clip >120 chars to 119 + '…' — same idiom as `descriptionToTagline`. */
function normalizeTagline(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > TAGLINE_MAX_CHARS
    ? `${trimmed.slice(0, TAGLINE_MAX_CHARS - 1).trimEnd()}…`
    : trimmed;
}

/** Must be an array of strings; normalized/deduped via `parseTagsInput`, capped at 6. */
function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const strings = value.filter((v): v is string => typeof v === 'string');
  if (strings.length === 0) return [];
  return parseTagsInput(strings.join(', ')).slice(0, MAX_ENRICHMENT_TAGS);
}

/**
 * Parses the model's raw response text into `{tagline, tags}`. Tolerant of
 * a markdown code fence around the JSON (models do this often despite being
 * told not to in the system prompt).
 *
 * Returns null only when the whole payload is unusable: unparseable JSON,
 * or a JSON value that isn't an object, or an object whose tagline AND tags
 * are both invalid/empty. A payload that's usable in only one field (e.g. a
 * non-string tagline alongside a valid tags array) degrades field-by-field
 * instead of failing the whole result — callers still get the good half.
 */
export function parseEnrichmentResult(raw: string): ParsedEnrichment | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;

  const obj = parsed as Record<string, unknown>;
  const tagline = normalizeTagline(obj.tagline);
  const tags = normalizeTags(obj.tags);

  if (tagline === null && tags.length === 0) return null;

  return { tagline, tags };
}
