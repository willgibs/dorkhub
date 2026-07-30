import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/auth/admin';
import { slotStatus } from '@/lib/featured/admin';
import { supabaseService } from '@/lib/supabase/clients';
import { createFeaturedSlot, deleteFeaturedSlot, endFeaturedSlot } from './actions';

/**
 * /admin/featured (P4 L1) — hand-placed featured slots, mechanism only.
 * Service-role reads so scheduled/ended slots are visible here (the public
 * RLS policy only exposes the active window). Follows the admin minimal-cut
 * idiom: plain forms, per-row actions, no client islands.
 */
export const dynamic = 'force-dynamic';

type SlotRow = {
  id: string;
  sponsor_label: string | null;
  starts_at: string;
  ends_at: string;
  projects: { name: string; slug: string; status: string; profiles: { username: string } };
};

const inputClass =
  'rounded-md border bg-transparent px-3 py-2 text-[13.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function formatWindow(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16).replace('T', ' ');
}

/** datetime-local default values: now and +14 days, minute precision. */
function datetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function AdminFeaturedPage() {
  await requireAdmin();
  const service = supabaseService();
  const now = new Date();

  const { data } = await service
    .from('featured_slots')
    .select(
      'id, sponsor_label, starts_at, ends_at, projects!featured_slots_project_id_fkey!inner(name, slug, status, profiles!projects_profile_id_fkey!inner(username))',
    )
    .order('starts_at', { ascending: false });

  const slots = (data ?? []) as unknown as SlotRow[];
  const defaultStarts = datetimeLocalValue(now);
  const defaultEnds = datetimeLocalValue(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-semibold">featured slots</h1>
        <p className="text-[13.5px] text-muted-foreground">
          hand-placed cards that lead the home feed, clearly labeled. nothing is sold here — pricing
          is a separate board decision.
        </p>
      </div>

      <form
        action={createFeaturedSlot}
        className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-card"
      >
        <label className="flex flex-col gap-1 text-[13.5px]">
          project (url, /u/name/slug, or name/slug)
          <input
            name="project"
            required
            placeholder="jason-ro/webflow-git"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-[13.5px]">
          label (optional — defaults to “featured”)
          <input
            name="sponsor_label"
            maxLength={80}
            placeholder="pick of the week"
            className={inputClass}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-[13.5px]">
            starts
            <input
              type="datetime-local"
              name="starts_at"
              required
              defaultValue={defaultStarts}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-[13.5px]">
            ends
            <input
              type="datetime-local"
              name="ends_at"
              required
              defaultValue={defaultEnds}
              className={inputClass}
            />
          </label>
        </div>
        <Button type="submit" className="w-fit" size="sm">
          create slot
        </Button>
      </form>

      <div className="flex flex-col divide-y divide-border rounded-lg border bg-card shadow-card">
        {slots.length === 0 ? (
          <p className="p-4 text-[13.5px] text-muted-foreground">
            no slots yet — the strip renders nothing until one is active.
          </p>
        ) : (
          slots.map((slot) => {
            const status = slotStatus(slot.starts_at, slot.ends_at, now);
            return (
              <div key={slot.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[14.5px]">
                    {slot.projects.profiles.username}/{slot.projects.slug}
                    {slot.projects.status !== 'published' ? ' · unpublished' : ''}
                  </span>
                  <span className="font-mono text-[11.5px] text-muted-foreground">
                    {formatWindow(slot.starts_at)} → {formatWindow(slot.ends_at)} utc
                    {slot.sponsor_label ? ` · “${slot.sponsor_label}”` : ''}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[11px] font-normal text-muted-foreground"
                >
                  {status}
                </Badge>
                {status !== 'ended' ? (
                  <form action={endFeaturedSlot}>
                    <input type="hidden" name="slot_id" value={slot.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      end now
                    </Button>
                  </form>
                ) : null}
                <form action={deleteFeaturedSlot}>
                  <input type="hidden" name="slot_id" value={slot.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    delete
                  </Button>
                </form>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
