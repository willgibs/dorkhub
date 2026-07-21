'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'overview', href: '/design' },
  { label: 'components', href: '/design/components' },
  { label: 'typography', href: '/design/typography' },
  { label: 'voice', href: '/design/voice' },
] as const;

/** Side nav for the /design styleguide — active link tracked from the route. */
export function DesignNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="design system"
      className="flex gap-4 overflow-x-auto pb-1 lg:sticky lg:top-6 lg:h-fit lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0"
    >
      {LINKS.map((link) => {
        const active =
          link.href === '/design' ? pathname === '/design' : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-sm border-l-2 py-1 pl-3 font-mono text-[12.5px] whitespace-nowrap transition-colors',
              'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active
                ? 'border-l-primary text-foreground'
                : 'border-l-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
