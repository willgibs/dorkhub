/**
 * Pure helpers for /admin/featured (P4 L1) — parsing and validation only, so
 * the rules are unit-testable without a Supabase client (house idiom:
 * extract the decision, inject the IO).
 */

export type ProjectRef = { username: string; slug: string };

/**
 * Accepts what an admin will realistically paste: a full project URL
 * (any host — prod, preview, localhost), an absolute path, or a bare
 * `username/slug`. Returns null rather than guessing on anything else.
 */
export function parseProjectRef(raw: string): ProjectRef | null {
  const input = raw.trim();
  if (!input) return null;

  let path = input;
  if (/^https?:\/\//i.test(input)) {
    try {
      path = new URL(input).pathname;
    } catch {
      return null;
    }
  }

  const segments = path.replace(/^\/+|\/+$/g, '').split('/');
  // "/u/username/slug" or "username/slug"
  const [a, b, c, ...rest] = segments;
  if (rest.length > 0) return null;
  const pair = a === 'u' ? [b, c] : c === undefined ? [a, b] : null;
  if (!pair) return null;

  const [username, slug] = pair;
  if (!username || !slug) return null;
  return { username, slug };
}

export type SlotWindow = { startsAt: string; endsAt: string };

/**
 * datetime-local inputs arrive as 'YYYY-MM-DDTHH:mm' in the ADMIN's local
 * clock; new Date() parses that as server-local time — for a solo-operator
 * tool the imprecision is acceptable and beats a timezone picker. Rules:
 * both parseable, ends after starts, and the slot may not already be over.
 */
export function resolveSlotWindow(
  startsRaw: string,
  endsRaw: string,
  now: Date,
): SlotWindow | { error: string } {
  const starts = new Date(startsRaw);
  const ends = new Date(endsRaw);
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
    return { error: 'unparseable start or end' };
  }
  if (ends.getTime() <= starts.getTime()) {
    return { error: 'the window ends before it starts' };
  }
  if (ends.getTime() <= now.getTime()) {
    return { error: 'that window is already over' };
  }
  return { startsAt: starts.toISOString(), endsAt: ends.toISOString() };
}

export type SlotStatus = 'active' | 'scheduled' | 'ended';

export function slotStatus(startsAt: string, endsAt: string, now: Date): SlotStatus {
  if (now.getTime() < new Date(startsAt).getTime()) return 'scheduled';
  if (now.getTime() > new Date(endsAt).getTime()) return 'ended';
  return 'active';
}
