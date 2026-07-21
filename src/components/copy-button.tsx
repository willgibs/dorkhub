'use client';

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
        className="border-l bg-secondary px-3 text-[11.5px] text-secondary-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:translate-y-px"
      >
        {copied ? 'copied' : 'copy'}
      </button>
    </span>
  );
}
