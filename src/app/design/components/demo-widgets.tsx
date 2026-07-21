'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FollowButton } from '@/components/follow-button';
import { StatButton, type StatButtonProps } from '@/components/stat-button';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { copy } from '@/lib/copy';

/**
 * Renders children only once the wrapper scrolls into view. Needed for cmdk's
 * Command: on mount it scrollIntoView()s its selected item, and since the demo
 * sits far down the page, `block: 'nearest'` scrolls the DOCUMENT to it — hijacking
 * the page's initial scroll position. Mounting in-view makes that scroll a no-op.
 */
export function MountWhenVisible({
  children,
  minHeight = 240,
}: {
  children: ReactNode;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px 120px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}

export type StatButtonDemoProps = {
  kind: StatButtonProps['kind'];
  initialActive?: boolean;
  count: number | null;
};

/** StatButton is fully controlled — this holds the toggle state so the styleguide can be clicked. */
export function StatButtonDemo({ kind, initialActive = false, count }: StatButtonDemoProps) {
  const [active, setActive] = useState(initialActive);
  return (
    <StatButton kind={kind} active={active} count={count} onToggle={() => setActive((a) => !a)} />
  );
}

export type FollowButtonDemoProps = {
  initialFollowing?: boolean;
};

/** Same story as StatButtonDemo: FollowButton takes following+onToggle as props, no state of its own. */
export function FollowButtonDemo({ initialFollowing = false }: FollowButtonDemoProps) {
  const [following, setFollowing] = useState(initialFollowing);
  return <FollowButton following={following} onToggle={() => setFollowing((f) => !f)} />;
}

/** Fires a real sonner toast so the primitive's motion/theming can be seen — mounts its own Toaster. */
export function ToastDemo() {
  return (
    <>
      <Toaster />
      <Button type="button" variant="secondary" size="sm" onClick={() => toast(copy.forkNudge)}>
        trigger toast
      </Button>
    </>
  );
}
