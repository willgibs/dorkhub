'use client';

import { useRef } from 'react';
import { StatButton } from '@/components/stat-button';
import { useEngagement } from './engagement-context';

export type LikeButtonIslandProps = {
  projectId: string;
  /** Public like count baked in at render time (null = zero, absence-never-"0"). */
  initialCount: number | null;
};

/**
 * Thin client wrapper over StatButton for the "like" action (M5 decisions
 * 5/7/9). Never disables the button while the engagement overlay is still
 * resolving (`!ready`) — that would flash a disabled state on every card.
 * Instead `onToggle` is a no-op until `ready`, since `toggleLike` itself
 * can't tell "genuinely signed out" from "signed in, overlay not fetched
 * yet" and would otherwise redirect an already-signed-in visitor to sign-in.
 *
 * Count derivation: `initialCount` is the public count baked in at render
 * time — it already includes this viewer's own like if they'd toggled it
 * before this page load, since `likes_count` is a DB-trigger-maintained
 * total. We snapshot whether the viewer had THIS project liked at the exact
 * moment the overlay settles (`ready` flips true) via a ref written during
 * render, guarded so it only ever fires once — before `ready`, `isLiked`
 * reads `false` for everything (the overlay hasn't loaded), so snapshotting
 * any earlier would wrongly record "not liked" for an already-liked project.
 * The displayed count is then `initialCount` adjusted by the delta between
 * "liked now" and "liked at snapshot time": +1 for a fresh like, -1 for
 * unliking something already counted, 0 otherwise — collapsed to `null` at
 * zero, never "0".
 */
export function LikeButtonIsland({ projectId, initialCount }: LikeButtonIslandProps) {
  const { ready, isLiked, toggleLike } = useEngagement();
  const liked = isLiked(projectId);

  const initiallyLikedRef = useRef<boolean | null>(null);
  if (ready && initiallyLikedRef.current === null) {
    initiallyLikedRef.current = liked;
  }
  const initiallyLiked = initiallyLikedRef.current ?? false;

  const delta = (liked && !initiallyLiked ? 1 : 0) - (initiallyLiked && !liked ? 1 : 0);
  const rawCount = (initialCount ?? 0) + delta;

  return (
    <StatButton
      kind="like"
      active={liked}
      count={rawCount > 0 ? rawCount : null}
      onToggle={() => {
        if (!ready) return;
        toggleLike(projectId);
      }}
    />
  );
}
