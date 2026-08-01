import { copy } from '@/lib/copy';

export type NavLink = {
  label: string;
  href: string;
  /**
   * prefetch={false} for `/random`: a prefetched random redirect would
   * resolve (and burn) its pick on every header render instead of on click
   * (docs/plans/p2-discovery.md locked decision 7).
   */
  prefetch?: false;
};

/**
 * Primary nav, in one place so the desktop bar and the mobile menu can never
 * drift (U2). Board-flagged for a broader IA pass once the pages that
 * deserve nav weight exist — see docs/plans/u2-rework.md.
 */
export const NAV_LINKS: readonly NavLink[] = [
  { label: 'browse', href: '/' },
  { label: copy.sortActive, href: '/active' },
  { label: 'tags', href: '/tags' },
  { label: copy.navWeird, href: '/random', prefetch: false },
];
