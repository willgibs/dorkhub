import { permanentRedirect } from 'next/navigation';

/**
 * Retired route — trending is now the default sort at `/`
 * (docs/plans/p2.5-self-running.md locked decision 9). 308 (not the 307
 * `redirect()` gives) so search engines and bookmarks repoint permanently.
 */
export default function TrendingPage() {
  permanentRedirect('/');
}
