import { TagPageSkeleton } from '@/components/page-skeletons';

/** Covers /t/[tag]/newest too — Next walks up to the nearest loading.tsx. */
export default function Loading() {
  return <TagPageSkeleton />;
}
