'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type ThemeToggleProps = {
  className?: string;
};

/** Both words share a grid cell (self-sizing crossfade, no width guessing);
 * the inactive one blurs+scales out while the active one settles in, 150ms
 * ease-quiet per docs/motion.md. The button's aria-label already carries the
 * accessible name, so the stack itself is decorative. */
const wordClass =
  'col-start-1 row-start-1 transition-[opacity,filter,transform] duration-150 ease-quiet';

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label="Toggle color theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'rounded-lg border bg-secondary px-3 py-[5px] font-mono text-[12.5px] text-secondary-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px',
        className,
      )}
    >
      theme:{' '}
      {mounted ? (
        <span aria-hidden="true" className="inline-grid align-middle">
          <span
            className={cn(
              wordClass,
              isDark ? 'scale-100 opacity-100 blur-0' : 'scale-95 opacity-0 blur-[2px]',
            )}
          >
            dark
          </span>
          <span
            className={cn(
              wordClass,
              isDark ? 'scale-95 opacity-0 blur-[2px]' : 'scale-100 opacity-100 blur-0',
            )}
          >
            light
          </span>
        </span>
      ) : (
        '…'
      )}
    </button>
  );
}
