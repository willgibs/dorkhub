import { ListsPageSkeleton } from '@/components/page-skeletons';

/**
 * Overrides the profile skeleton one segment up — without this, both lists
 * routes would promise a masthead and a card grid and then render rows.
 * Both are `force-dynamic`, so they're the routes that actually wait.
 */
export default function Loading() {
  return <ListsPageSkeleton />;
}
