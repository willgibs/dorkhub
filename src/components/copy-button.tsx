'use client';

import { Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type CopyButtonProps = {
  /** The command shown in the field, e.g. "git clone github.com/mollybuilds/tinysynth". */
  command: string;
  /** What actually lands on the clipboard; defaults to `command`. */
  copyValue?: string;
  className?: string;
};

const FEEDBACK_MS = 1200;

/** Icon crossfade (docs/motion.md): copy glyph blur-crossfades into a check
 * whose stroke draws on via `pathLength` + dashoffset — both 200ms ease-quiet. */
export function CopyButton({ command, copyValue, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyValue ?? command);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), FEEDBACK_MS);
    } catch {
      // clipboard unavailable — do nothing; the command is still selectable
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded-lg border font-mono text-xs',
        className,
      )}
    >
      <code className="self-center bg-code-bg px-3 py-2 text-code-text">{command}</code>
      <button
        type="button"
        onClick={handleCopy}
        aria-live="polite"
        className="inline-flex items-center gap-1.5 border-l bg-secondary px-3 text-[11.5px] text-secondary-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:translate-y-px"
      >
        <span
          className="relative inline-grid size-3 shrink-0 place-items-center"
          aria-hidden="true"
        >
          <Copy
            className={cn(
              'col-start-1 row-start-1 size-3 transition-[opacity,filter,transform] duration-200 ease-quiet',
              copied ? 'scale-95 opacity-0 blur-[2px]' : 'scale-100 opacity-100 blur-0',
            )}
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={cn(
              'col-start-1 row-start-1 size-3 text-positive transition-[opacity,filter,transform] duration-200 ease-quiet',
              copied ? 'scale-100 opacity-100 blur-0' : 'scale-95 opacity-0 blur-[2px]',
            )}
          >
            <polyline
              points="4 12 9 17 20 6"
              pathLength={100}
              className={cn(
                '[stroke-dasharray:100] transition-[stroke-dashoffset] duration-200 ease-quiet',
                copied ? '[stroke-dashoffset:0]' : '[stroke-dashoffset:100]',
              )}
            />
          </svg>
        </span>
        {copied ? 'copied' : 'copy'}
      </button>
    </span>
  );
}
