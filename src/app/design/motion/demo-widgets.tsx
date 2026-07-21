'use client';

import { useState } from 'react';
import { StatButtonDemo } from '@/app/design/components/demo-widgets';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { copy } from '@/lib/copy';
import { projects } from '@/lib/fixtures';

/**
 * §02 — this can't actually flip the OS media feature; it scopes a matching
 * "kill switch" to the box below so the difference is visible on this page
 * without leaving devtools. The real switch lives in globals.css and reads
 * `prefers-reduced-motion` directly (spinner carve-out included).
 */
export function ReducedMotionSimulator() {
  const [reduced, setReduced] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Switch id="reduced-motion-sim" checked={reduced} onCheckedChange={setReduced} />
        <Label htmlFor="reduced-motion-sim" className="font-mono text-[12.5px]">
          simulate prefers-reduced-motion
        </Label>
      </div>
      <div
        data-simulate-reduced={reduced ? '' : undefined}
        className="edge-highlight flex flex-wrap items-center gap-4 rounded-lg border bg-card p-5 [&[data-simulate-reduced]_*]:![animation-duration:0.01ms] [&[data-simulate-reduced]_*]:![transition-duration:0.01ms]"
      >
        <StatButtonDemo kind="like" count={89} />
        <p className="max-w-[34ch] font-mono text-[11px] text-muted-foreground">
          click ++ with the switch off, then on — the pop and micro-burst should disappear entirely,
          not just play shorter.
        </p>
      </div>
    </div>
  );
}

/**
 * §03 contrast case — the command palette never animates (⌘K is a
 * 100+/day action per docs/motion.md), so this demo is deliberately the odd
 * one out next to every other entry on this page.
 */
export function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        open command palette
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="search projects…" />
        <CommandList>
          <CommandEmpty>{copy.emptyFeed}</CommandEmpty>
          <CommandGroup heading="projects">
            {projects.map((p) => (
              <CommandItem key={p.slug} onSelect={() => setOpen(false)}>
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
