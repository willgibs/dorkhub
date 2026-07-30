import { SITE_URL } from '@/lib/site';

/**
 * schema.org JSON-LD builders (P4 L3). Plain-object builders + one
 * serializer rather than a component: the scripts render nothing visible,
 * so a design-system component (with its /design styleguide obligation)
 * would be ceremony. Pages inline:
 *
 *   <script type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: serializeJsonLd(...) }} />
 *
 * JSON-LD is exempt from CSP's script-src by spec (non-executable type) —
 * no coordination with next.config.ts needed.
 */

/** `<` escaped so user-shaped strings can never close the script element. */
export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'dorkhub',
    url: SITE_URL,
  };
}

export function softwareSourceCodeJsonLd(input: {
  name: string;
  tagline: string | null;
  username: string;
  slug: string;
  repoUrl: string;
  primaryLanguage: string | null;
  license: string | null;
  githubPushedAt: string | null;
  authorDisplayName: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: input.name,
    ...(input.tagline ? { description: input.tagline } : {}),
    url: `${SITE_URL}/u/${input.username}/${input.slug}`,
    codeRepository: input.repoUrl,
    ...(input.primaryLanguage ? { programmingLanguage: input.primaryLanguage } : {}),
    ...(input.license ? { license: input.license } : {}),
    ...(input.githubPushedAt ? { dateModified: input.githubPushedAt } : {}),
    author: {
      '@type': 'Person',
      name: input.authorDisplayName ?? input.username,
      url: `${SITE_URL}/u/${input.username}`,
    },
  };
}

export function profilePageJsonLd(input: {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: input.displayName ?? input.username,
      alternateName: input.username,
      url: `${SITE_URL}/u/${input.username}`,
      ...(input.avatarUrl ? { image: input.avatarUrl } : {}),
    },
  };
}
