import Link from 'next/link';
import { type CSSProperties, Fragment } from 'react';

import { PageShell } from '@/components/page-shell';
import { SignInWithGitHub } from '@/components/sign-in-github';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

const WORD_STAGGER_MS = 40;
/** Mirrors --motion-slow — the word-rise animation's own duration. */
const RISE_DURATION_MS = 300;
const SHIMMER_WORD = 'fun';

/**
 * Signed-out marketing home hero. Pure server component: the staggered word
 * reveal and one-shot shimmer are both plain CSS (see --animate-word-rise /
 * --animate-shimmer-sweep-once in globals.css), so nothing here needs 'use client'.
 */
export function Hero() {
  const words = copy.heroHeadline.split(' ');
  // The shimmer accent plays once the last staggered word has finished rising.
  const shimmerDelayMs = words.length * WORD_STAGGER_MS + RISE_DURATION_MS;

  return (
    <PageShell as="section" className="relative pt-10 pb-16 text-center sm:pt-16 sm:pb-24">
      {/* cosmos-style halftone dot field behind the hero (docs/design-system.md micro-detail) */}
      <div
        aria-hidden="true"
        className="bg-halftone pointer-events-none absolute inset-x-0 -top-2.5 -z-10 h-[320px] [mask-image:radial-gradient(460px_230px_at_50%_30%,black,transparent_72%)] [-webkit-mask-image:radial-gradient(460px_230px_at_50%_30%,black,transparent_72%)]"
      />

      <h1 className="mx-auto max-w-[760px] font-display text-4xl font-extrabold tracking-[-0.02em] sm:text-[54px]">
        {words.map((word, i) => {
          const isShimmer = word === SHIMMER_WORD;
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed, never-reordered word list; some words repeat (e.g. "for")
            <Fragment key={`${word}-${i}`}>
              <span
                className={cn(
                  'inline-block animate-word-rise [animation-fill-mode:backwards]',
                  isShimmer &&
                    'relative isolate overflow-hidden after:absolute after:inset-0 after:animate-shimmer-sweep-once after:bg-gradient-to-r after:from-transparent after:via-primary/60 after:to-transparent after:[animation-delay:var(--shimmer-delay)]',
                )}
                style={
                  {
                    animationDelay: `${i * WORD_STAGGER_MS}ms`,
                    ...(isShimmer ? { '--shimmer-delay': `${shimmerDelayMs}ms` } : {}),
                  } as CSSProperties
                }
              >
                {word}
              </span>
              {i < words.length - 1 ? ' ' : null}
            </Fragment>
          );
        })}
      </h1>

      <p className="mx-auto mt-[18px] max-w-[560px] text-[17.5px] text-muted-foreground">
        {copy.heroSub}
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button
          asChild
          size="lg"
          className="shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_45%,transparent),0_4px_18px_color-mix(in_oklab,var(--primary)_20%,transparent)] active:translate-y-px"
        >
          <Link href="#feed">{copy.browseCta}</Link>
        </Button>
        <SignInWithGitHub href="/auth/signin" />
      </div>
    </PageShell>
  );
}
