'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';

import { type ReportState, reportProject } from '@/app/(app)/u/[username]/[slug]/report-actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { copy } from '@/lib/copy';
import { REPORT_REASONS } from '@/lib/moderation/report-policy';
import { useEngagement } from './engagement-context';

export type ReportButtonIslandProps = {
  projectId: string;
};

/** Quiet text trigger, same treatment as the "manage in settings" / repo-url
 * links on the project page (linkFocusRing there) — not a StatButton, this
 * isn't an engagement stat. */
const TRIGGER_CLASS =
  'rounded-sm font-mono text-[12.5px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * Report dialog for the project page (P2.6 Wave A1, docs/plans/
 * p2.6-immune-system.md). Mirrors `toggleSave`'s signed-out idiom
 * (engagement-context.tsx) exactly: while the overlay is still resolving the
 * click is a no-op (not "signed out" — `ready` can't tell those apart yet),
 * and once resolved a signed-out click redirects to sign-in with `next` set
 * back to this page instead of opening anything.
 *
 * The dialog itself owns a `useActionState(reportProject, null)` form. Once
 * `state.ok`, the form body is replaced by a single thank-you/already-
 * reported line — the dialog is left open and dismissible (close button,
 * outside click, Escape all still work; nothing here traps focus or blocks
 * closing) rather than auto-closing, so the user can read the confirmation.
 */
export function ReportButtonIsland({ projectId }: ReportButtonIslandProps) {
  const { ready, signedIn } = useEngagement();
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ReportState, FormData>(reportProject, null);

  return (
    <>
      <button
        type="button"
        className={TRIGGER_CLASS}
        onClick={() => {
          if (!ready) return;
          if (!signedIn) {
            router.push(`/auth/signin?next=${encodeURIComponent(pathname)}`);
            return;
          }
          setOpen(true);
        }}
      >
        {copy.reportAction}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.reportDialogTitle}</DialogTitle>
          </DialogHeader>

          {state && 'ok' in state ? (
            // aria-live: submitting unmounts the form (and the focused submit
            // button with it), so without this the outcome of the dialog's
            // primary action is never announced.
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {state.alreadyReported ? copy.reportAlready : copy.reportThanks}
            </p>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="project_id" value={projectId} />

              <div className="flex flex-col gap-2">
                <Label htmlFor="report-reason" className="font-mono text-xs text-muted-foreground">
                  {copy.reportReasonLabel}
                </Label>
                <Select name="reason" required>
                  <SelectTrigger id="report-reason" className="w-full">
                    <SelectValue placeholder={copy.reportReasonPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {copy.reportReasons[reason]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="report-note" className="font-mono text-xs text-muted-foreground">
                  {copy.reportNoteLabel}
                </Label>
                <Textarea id="report-note" name="note" maxLength={500} rows={3} />
              </div>

              {state && 'error' in state ? (
                <p aria-live="polite" className="text-sm text-destructive">
                  {state.error}
                </p>
              ) : null}

              <Button type="submit" disabled={pending} className="w-fit">
                {pending ? copy.reportSubmitting : copy.reportSubmit}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
