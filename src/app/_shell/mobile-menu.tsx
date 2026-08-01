'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';

import { headerAccountLinks, useHeaderAuth } from '@/app/_shell/use-header-auth';
import { SignInWithGitHub } from '@/components/sign-in-github';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { copy } from '@/lib/copy';
import { NAV_LINKS } from '@/lib/nav';
import { cn } from '@/lib/utils';

/** Item entrance stagger — short enough to feel instant as a whole (docs/motion.md). */
const ITEM_STAGGER_MS = 35;

const ROW =
  'flex items-center rounded-md px-3 py-2.5 text-[15px] text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px';

/**
 * The mobile nav (U2, board note: the mobile navbar needed to be
 * significantly better). Under `sm` the header collapses to a single row —
 * wordmark, search, and this trigger — which is what lets the bar be sticky
 * on phones at all; the full menu lives in a top sheet.
 *
 * Built on the Sheet primitive, so focus trapping, Escape, scroll locking and
 * the overlay all come from Radix rather than being re-implemented. Items
 * stagger in on open (transitions.dev's menu/stagger reveal adapted onto our
 * own motion tokens per the adapt-don't-vendor rule) via a keyframe, not a
 * transition: the content mounts already in its open state, so there is no
 * start frame for a transition to interpolate from.
 *
 * The sheet covers the header while open, so the trigger icon's
 * hamburger→X swap is deliberately NOT animated — nobody is looking at it.
 * The close affordance lives inside the sheet instead, beside the wordmark.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const auth = useHeaderAuth();

  // Any navigation closes the menu — including one started from inside it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname isn't read in the effect body, it's intentionally used only to trigger the close
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  let index = 0;
  const nextDelay = () => ({ animationDelay: `${index++ * ITEM_STAGGER_MS}ms` }) as CSSProperties;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="menu"
          className="inline-flex size-9 flex-none items-center justify-center rounded-lg border bg-surface-2 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px sm:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </SheetTrigger>

      <SheetContent side="top" showCloseButton={false} className="border-b p-0">
        <SheetTitle className="sr-only">menu</SheetTitle>

        <div className="flex flex-col gap-1 px-4 pt-4 pb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-[19px] leading-none font-extrabold">
              dorkhub
              <span aria-hidden="true" className="text-primary">
                _
              </span>
            </span>
            <button
              type="button"
              aria-label="close menu"
              onClick={() => setOpen(false)}
              className="inline-flex size-9 items-center justify-center rounded-lg border bg-surface-2 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px"
            >
              <X className="size-4" />
            </button>
          </div>

          {NAV_LINKS.map((link) => (
            <MenuItem key={link.href} style={nextDelay()}>
              <Link
                href={link.href}
                prefetch={link.prefetch}
                className={ROW}
                aria-current={pathname === link.href ? 'page' : undefined}
              >
                {link.label}
              </Link>
            </MenuItem>
          ))}

          <Divider />

          {auth.status === 'signed-in' ? (
            <>
              {headerAccountLinks(auth.profile).map((item) => (
                <MenuItem key={item.href} style={nextDelay()}>
                  <Link href={item.href} className={ROW}>
                    {item.label}
                  </Link>
                </MenuItem>
              ))}
              <MenuItem style={nextDelay()}>
                <form method="post" action="/auth/signout">
                  <button
                    type="submit"
                    className={cn(ROW, 'w-full text-left text-muted-foreground')}
                  >
                    sign out
                  </button>
                </form>
              </MenuItem>
            </>
          ) : auth.status === 'signed-out' ? (
            <MenuItem style={nextDelay()}>
              <SignInWithGitHub href="/auth/signin" className="w-full justify-center" />
            </MenuItem>
          ) : null}

          <MenuItem style={nextDelay()}>
            <Button
              asChild
              className="mt-2 w-full shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_45%,transparent),0_4px_18px_color-mix(in_oklab,var(--primary)_20%,transparent)] active:translate-y-px"
            >
              <Link href="/new">{copy.ctaPrimary}</Link>
            </Button>
          </MenuItem>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MenuItem({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div className="u2-menu-item" style={style}>
      {children}
    </div>
  );
}

function Divider() {
  return <span aria-hidden="true" className="my-2 h-px w-full bg-border" />;
}
