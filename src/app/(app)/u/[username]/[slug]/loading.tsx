import { ProjectPageSkeleton } from '@/components/page-skeletons';

/** Also the slowest page we have: it selects readme_html. */
export default function Loading() {
  return <ProjectPageSkeleton />;
}
