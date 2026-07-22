'use client';

import { useRef } from 'react';
import { StatButton } from '@/components/stat-button';
import { useEngagement } from './engagement-context';

export type SaveButtonIslandProps = {
  projectId: string;
  /** Public save count baked in at render time (null = zero, absence-never-"0"). */
  initialCount: number | null;
};

/**
 * Thin client wrapper over StatButton for the "save" action (M5 decisions
 * 5/7/9). Mirrors `LikeButtonIsland`'s ready-guard + count-derivation
 * approach exactly — see that file for the detailed rationale. Save UI is
 * scope-cut to the project detail page only (docs/plans/m5-discovery.md);
 * this island itself is generic and doesn't assume where it's mounted.
 */
export function SaveButtonIsland({ projectId, initialCount }: SaveButtonIslandProps) {
  const { ready, isSaved, toggleSave } = useEngagement();
  const saved = isSaved(projectId);

  const initiallySavedRef = useRef<boolean | null>(null);
  if (ready && initiallySavedRef.current === null) {
    initiallySavedRef.current = saved;
  }
  const initiallySaved = initiallySavedRef.current ?? false;

  const delta = (saved && !initiallySaved ? 1 : 0) - (initiallySaved && !saved ? 1 : 0);
  const rawCount = (initialCount ?? 0) + delta;

  return (
    <StatButton
      kind="save"
      active={saved}
      count={rawCount > 0 ? rawCount : null}
      onToggle={() => {
        if (!ready) return;
        toggleSave(projectId);
      }}
    />
  );
}
