import type { MetadataRoute } from 'next';

import { ogTokens } from '@/lib/og-tokens';

/**
 * Web manifest (P4 L3) — PWA-lite: names the app for add-to-home-screen and
 * pins browser-chrome colors to the dark-first tokens. `display: 'browser'`
 * on purpose: dorkhub is a website that reads well installed, not an app
 * pretending; nothing here depends on standalone chrome.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'dorkhub',
    short_name: 'dorkhub',
    description: 'discover the best tools for your next project',
    start_url: '/',
    display: 'browser',
    background_color: ogTokens.background,
    theme_color: ogTokens.background,
  };
}
