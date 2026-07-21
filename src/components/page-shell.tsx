import type { ElementType, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type PageShellProps = {
  /** Wrapper element; defaults to a plain div. Pass 'main', 'section', etc. as needed. */
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

/** The standard page container: 1120px max width, centered, 24px side gutters. */
export function PageShell({ as: Comp = 'div', className, children }: PageShellProps) {
  return <Comp className={cn('mx-auto w-full max-w-[1120px] px-6', className)}>{children}</Comp>;
}
