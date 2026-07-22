'use client';

import { FollowButton } from '@/components/follow-button';
import { useEngagement } from './engagement-context';

export type FollowButtonIslandProps = Record<string, never>;

/**
 * Thin client wrapper over FollowButton (M5 decisions 5/7). The followee id
 * lives on the enclosing `EngagementProvider`, not here — this island only
 * reads/toggles. Renders nothing on the viewer's own profile (no self-follow
 * control).
 */
export function FollowButtonIsland() {
  const { isFollowing, isOwnProfile, toggleFollow } = useEngagement();

  if (isOwnProfile) return null;

  return <FollowButton following={isFollowing} onToggle={toggleFollow} />;
}
