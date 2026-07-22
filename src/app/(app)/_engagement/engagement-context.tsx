'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { supabaseBrowser } from '@/lib/supabase/browser';

type EngagementOverlay = {
  liked: string[];
  saved: string[];
  following: boolean | null;
  isOwnProfile: boolean;
};

/** Fetches the overlay for a set of project ids (+ optional followee). Never
 * throws — a failed/aborted fetch just means "nothing new to merge in". */
async function fetchEngagementOverlay(
  ids: string[],
  followeeId: string | undefined,
): Promise<EngagementOverlay | null> {
  const params = new URLSearchParams();
  if (ids.length > 0) params.set('ids', ids.join(','));
  if (followeeId) params.set('followee', followeeId);
  const qs = params.toString();

  try {
    const res = await fetch(`/api/me/engagement${qs ? `?${qs}` : ''}`);
    if (!res.ok) return null;
    return (await res.json()) as EngagementOverlay;
  } catch (err) {
    console.error('[engagement] overlay fetch failed', err);
    return null;
  }
}

export type EngagementContextValue = {
  /** True once the initial resolution has settled — signed-out settles immediately (no fetch). */
  ready: boolean;
  signedIn: boolean;
  isLiked: (id: string) => boolean;
  isSaved: (id: string) => boolean;
  isFollowing: boolean;
  isOwnProfile: boolean;
  pendingLike: (id: string) => boolean;
  pendingSave: (id: string) => boolean;
  pendingFollow: boolean;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
  toggleFollow: () => void;
  /** Extends the tracked id set (e.g. a "load more" append) and fetches the
   * overlay for whichever of `ids` weren't already fetched. */
  registerIds: (ids: string[]) => void;
};

const EngagementContext = createContext<EngagementContextValue | null>(null);

export function useEngagement(): EngagementContextValue {
  const ctx = useContext(EngagementContext);
  if (!ctx) throw new Error('useEngagement must be used within an EngagementProvider');
  return ctx;
}

export type EngagementProviderProps = {
  projectIds: string[];
  followeeId?: string;
  children: ReactNode;
};

/**
 * Client-side personalization overlay (decisions 6/7/8, docs/plans/m5-discovery.md).
 * Public feed/project/profile RSCs render under the cookie-less anon client
 * and stay cacheable; this island is the one piece that knows what the
 * signed-in caller has liked/saved/followed, and it writes DIRECTLY to
 * likes/saves/follows from the browser under RLS — no server action, no
 * revalidatePath. Counts self-heal via DB triggers and surface again through
 * the feed's 60s / page's 300s ISR window.
 *
 * Signed-out resolves `ready` immediately with all-empty state and never
 * fetches. Signed in: one `/api/me/engagement` call for the initial id set
 * (+ followeeId) on mount, then `registerIds` tops up newly-appended ids
 * (e.g. from "load more") without re-fetching ones already known.
 */
export function EngagementProvider({ projectIds, followeeId, children }: EngagementProviderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [following, setFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [pendingLikes, setPendingLikes] = useState<Set<string>>(() => new Set());
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(() => new Set());
  const [pendingFollow, setPendingFollow] = useState(false);

  // Cached for writes (insert/delete need profile_id) — resolved once on mount.
  const myProfileIdRef = useRef<string | null>(null);
  // Ids the overlay has already been fetched for — registerIds only tops up the delta.
  const fetchedIdsRef = useRef<Set<string>>(new Set(projectIds));
  // "Latest value" ref so the mount effect can run once ([]) without pulling
  // the followeeId prop into its dependency array.
  const followeeIdRef = useRef(followeeId);
  followeeIdRef.current = followeeId;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getClaims();
      const claims = data?.claims;

      if (!claims) {
        // Signed out: the overlay degrades to empty — never a fetch, never a 401.
        if (!cancelled) setReady(true);
        return;
      }

      if (!cancelled) setSignedIn(true);

      const [{ data: profile }, overlay] = await Promise.all([
        supabase.from('profiles').select('id').eq('user_id', claims.sub).maybeSingle(),
        fetchEngagementOverlay(Array.from(fetchedIdsRef.current), followeeIdRef.current),
      ]);

      if (cancelled) return;

      if (profile) myProfileIdRef.current = profile.id;

      if (overlay) {
        setLiked(new Set(overlay.liked));
        setSaved(new Set(overlay.saved));
        setFollowing(overlay.following ?? false);
        setIsOwnProfile(overlay.isOwnProfile);
      }

      setReady(true);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const isLiked = useCallback((id: string) => liked.has(id), [liked]);
  const isSaved = useCallback((id: string) => saved.has(id), [saved]);
  const pendingLike = useCallback((id: string) => pendingLikes.has(id), [pendingLikes]);
  const pendingSave = useCallback((id: string) => pendingSaves.has(id), [pendingSaves]);

  const registerIds = useCallback(
    (newIds: string[]) => {
      const toFetch = newIds.filter((id) => !fetchedIdsRef.current.has(id));
      if (toFetch.length === 0) return;
      for (const id of toFetch) fetchedIdsRef.current.add(id);
      if (!signedIn) return;

      fetchEngagementOverlay(toFetch, undefined).then((overlay) => {
        if (!overlay) return;
        if (overlay.liked.length > 0) {
          setLiked((prev) => {
            const next = new Set(prev);
            for (const id of overlay.liked) next.add(id);
            return next;
          });
        }
        if (overlay.saved.length > 0) {
          setSaved((prev) => {
            const next = new Set(prev);
            for (const id of overlay.saved) next.add(id);
            return next;
          });
        }
      });
    },
    [signedIn],
  );

  const toggleLike = useCallback(
    (id: string) => {
      if (!signedIn) {
        router.push(`/auth/signin?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (pendingLikes.has(id)) return;

      const wasActive = liked.has(id);
      const nextActive = !wasActive;

      setPendingLikes((prev) => new Set(prev).add(id));
      setLiked((prev) => {
        const next = new Set(prev);
        if (nextActive) next.add(id);
        else next.delete(id);
        return next;
      });

      const myProfileId = myProfileIdRef.current;
      if (!myProfileId) {
        setPendingLikes((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return;
      }

      const supabase = supabaseBrowser();

      (async () => {
        try {
          const { error } = nextActive
            ? await supabase.from('likes').insert({ profile_id: myProfileId, project_id: id })
            : await supabase
                .from('likes')
                .delete()
                .eq('profile_id', myProfileId)
                .eq('project_id', id);

          // 23505 = unique_violation — an already-liked race, not a real
          // failure; the optimistic "liked" state was correct all along.
          if (error && error.code !== '23505') {
            setLiked((prev) => {
              const next = new Set(prev);
              if (wasActive) next.add(id);
              else next.delete(id);
              return next;
            });
            console.error('[engagement] toggleLike failed', error);
          }
        } finally {
          setPendingLikes((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      })();
    },
    [signedIn, pendingLikes, liked, pathname, router],
  );

  const toggleSave = useCallback(
    (id: string) => {
      if (!signedIn) {
        router.push(`/auth/signin?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (pendingSaves.has(id)) return;

      const wasActive = saved.has(id);
      const nextActive = !wasActive;

      setPendingSaves((prev) => new Set(prev).add(id));
      setSaved((prev) => {
        const next = new Set(prev);
        if (nextActive) next.add(id);
        else next.delete(id);
        return next;
      });

      const myProfileId = myProfileIdRef.current;
      if (!myProfileId) {
        setPendingSaves((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return;
      }

      const supabase = supabaseBrowser();

      (async () => {
        try {
          const { error } = nextActive
            ? await supabase.from('saves').insert({ profile_id: myProfileId, project_id: id })
            : await supabase
                .from('saves')
                .delete()
                .eq('profile_id', myProfileId)
                .eq('project_id', id);

          if (error && error.code !== '23505') {
            setSaved((prev) => {
              const next = new Set(prev);
              if (wasActive) next.add(id);
              else next.delete(id);
              return next;
            });
            console.error('[engagement] toggleSave failed', error);
          }
        } finally {
          setPendingSaves((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      })();
    },
    [signedIn, pendingSaves, saved, pathname, router],
  );

  const toggleFollow = useCallback(() => {
    // No target, or targeting yourself — always a no-op regardless of auth state.
    if (!followeeId || isOwnProfile) return;

    if (!signedIn) {
      router.push(`/auth/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (pendingFollow) return;

    const wasActive = following;
    const nextActive = !wasActive;

    setPendingFollow(true);
    setFollowing(nextActive);

    const myProfileId = myProfileIdRef.current;
    if (!myProfileId) {
      setPendingFollow(false);
      return;
    }

    const supabase = supabaseBrowser();

    (async () => {
      try {
        const { error } = nextActive
          ? await supabase
              .from('follows')
              .insert({ follower_id: myProfileId, followee_id: followeeId })
          : await supabase
              .from('follows')
              .delete()
              .eq('follower_id', myProfileId)
              .eq('followee_id', followeeId);

        if (error && error.code !== '23505') {
          setFollowing(wasActive);
          console.error('[engagement] toggleFollow failed', error);
        }
      } finally {
        setPendingFollow(false);
      }
    })();
  }, [followeeId, isOwnProfile, signedIn, pendingFollow, following, pathname, router]);

  const value = useMemo<EngagementContextValue>(
    () => ({
      ready,
      signedIn,
      isLiked,
      isSaved,
      isFollowing: following,
      isOwnProfile,
      pendingLike,
      pendingSave,
      pendingFollow,
      toggleLike,
      toggleSave,
      toggleFollow,
      registerIds,
    }),
    [
      ready,
      signedIn,
      following,
      isOwnProfile,
      pendingFollow,
      isLiked,
      isSaved,
      pendingLike,
      pendingSave,
      toggleLike,
      toggleSave,
      toggleFollow,
      registerIds,
    ],
  );

  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>;
}
