import Link from 'next/link';
import type { ReactNode } from 'react';

import { PageShell } from '@/components/page-shell';
import { requireAdmin } from '@/lib/auth/admin';
import { copy } from '@/lib/copy';

const ADMIN_NAV = [
  { label: copy.adminQueueTitle, href: '/admin/queue' },
  { label: copy.adminSourcesTitle, href: '/admin/sources' },
  { label: copy.adminClaimsTitle, href: '/admin/claims' },
] as const;

/**
 * Shell for every /admin/* page. This lives inside the (app) route group, so
 * SiteHeader + SiteFooter already come from src/app/(app)/layout.tsx — this
 * only adds the quiet admin sub-nav above {children}, plus its own gate.
 *
 * requireAdmin() runs here for defense-in-depth (a signed-out or non-admin
 * visitor never even sees the sub-nav), but this is NOT the only gate: server
 * actions under /admin bypass the layout tree entirely, so every action
 * calls requireAdmin() again itself.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <PageShell className="flex flex-col gap-6 py-10">
      <nav
        aria-label="admin"
        className="flex items-center gap-5 font-mono text-xs tracking-widest text-muted-foreground uppercase"
      >
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </PageShell>
  );
}
