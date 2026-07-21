import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type CalloutTone = 'default' | 'positive' | 'destructive';

export type CalloutProps = {
  children: ReactNode;
  /** Tints the 3px left border. 'default' uses the brand primary. */
  tone?: CalloutTone;
  className?: string;
};

const TONE_BORDER: Record<CalloutTone, string> = {
  default: 'border-l-primary',
  positive: 'border-l-positive',
  destructive: 'border-l-destructive',
};

/** Bordered card for manifesto pull-quotes and inline notes. */
export function Callout({ children, tone = 'default', className }: CalloutProps) {
  return (
    <aside
      className={cn(
        'edge-highlight rounded-lg border border-l-[3px] bg-card px-[18px] py-4 text-[14.5px] leading-relaxed text-card-foreground',
        TONE_BORDER[tone],
        className,
      )}
    >
      {children}
    </aside>
  );
}
