'use server';

import { copy } from '@/lib/copy';
import {
  isReportReason,
  normalizeReportNote,
  REPORT_NOTE_MAX_CHARS,
  REPORT_RATE_LIMIT_WINDOW_MS,
  reachedReportRateLimit,
} from '@/lib/moderation/report-policy';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

/**
 * User report flow (P2.6 Wave A1, docs/plans/p2.6-immune-system.md). Unlike
 * settings/projects/actions.ts, where RLS is the real enforcement and the
 * app-level checks here just produce nicer error copy, `project_reports` is
 * deny-all (migration 0009, locked decision #1) — RLS has zero policies for
 * it, so this action IS the access boundary. Every step below runs on
 * `supabaseService()`, never the cookie-bound client.
 *
 * Errors are deliberately generic (`copy.error`) for every failure except
 * the rate limit, which gets its own copy: telling a reporter "you already
 * reported this", "that project doesn't exist", or "you can't report your
 * own project" would each leak information a hostile caller could probe
 * for — all three collapse to the same "no" here.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReportState = { ok: true; alreadyReported?: boolean } | { error: string } | null;

/**
 * Dialog-context server action (report-button-island.tsx) — no `redirect()`
 * on failure, unlike the settings actions, since the caller never leaves the
 * project page; the dialog stays open and renders `state.error` inline.
 */
export async function reportProject(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: copy.error };

  const service = supabaseService();
  const { data: reporter } = await service
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!reporter) return { error: copy.error };

  const projectId = String(formData.get('project_id') ?? '');
  const reasonRaw = String(formData.get('reason') ?? '');
  const noteRaw = String(formData.get('note') ?? '');

  if (!UUID_PATTERN.test(projectId)) return { error: copy.error };
  if (!isReportReason(reasonRaw)) return { error: copy.error };

  const note = normalizeReportNote(noteRaw);
  if (note && note.length > REPORT_NOTE_MAX_CHARS) return { error: copy.error };

  // Deny-all table, so this read (like every other step) has to go through
  // the service client too — there's no RLS policy that would let the
  // cookie-bound client see this regardless of ownership.
  const { data: project } = await service
    .from('projects')
    .select('id, profile_id, status')
    .eq('id', projectId)
    .maybeSingle();

  if (!project || project.status !== 'published' || project.profile_id === reporter.id) {
    // Missing project, unpublished project, and a self-report all fall
    // through to the same generic error — see file header.
    return { error: copy.error };
  }

  const windowStart = new Date(Date.now() - REPORT_RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error: countError } = await service
    .from('project_reports')
    .select('*', { count: 'exact', head: true })
    .eq('reporter_profile_id', reporter.id)
    .gt('created_at', windowStart);

  // FAIL CLOSED (P2.7). This count is the only control bounding how many
  // DISTINCT projects one account can report — the unique (project, reporter)
  // constraint caps repeats per project, not breadth. A failed count returns
  // `count: null`, and the old `count ?? 0` read that as "zero reports so
  // far", skipping the limit exactly when DB pressure (a burst of reports)
  // makes the failure most likely.
  if (countError) {
    console.error('[report] rate-limit count failed:', countError.message);
    return { error: copy.reportRateLimited };
  }

  if (reachedReportRateLimit(count ?? 0)) {
    return { error: copy.reportRateLimited };
  }

  const { error: insertError } = await service.from('project_reports').insert({
    project_id: projectId,
    reporter_profile_id: reporter.id,
    reason: reasonRaw,
    note,
  });

  if (insertError) {
    // 23505 = unique_violation on (project_id, reporter_profile_id) — this
    // reporter already reported this project (locked decision #6, no
    // re-report path). Not a failure; tell them it's already on the list.
    if (insertError.code === '23505') {
      return { ok: true, alreadyReported: true };
    }
    console.error('[report] reportProject failed:', insertError.message);
    return { error: copy.error };
  }

  return { ok: true };
}
