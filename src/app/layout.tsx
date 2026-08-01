import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Geist, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { CommandPalette } from '@/app/_shell/command-palette';
import { ThemeProvider } from '@/components/theme-provider';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const display = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-display',
});

const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Positioning follows the board-picked H1 (U2): discovery first — the
  // majority of visitors come to FIND projects, not to list their own.
  title: {
    default: 'dorkhub — discover the best tools for your next project',
    template: '%s · dorkhub',
  },
  description:
    'A curated gallery of developer projects. Browse, fork, and follow the makers — and when you’re ready, list your own. Free to browse, free to fork.',
  openGraph: {
    siteName: 'dorkhub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  // Every page claims its canonical dorkhub.com URL ('./' resolves against
  // metadataBase + the current route): the *.vercel.app aliases keep serving
  // after the domain attach, and without a canonical they'd compete with the
  // real domain in the index. /search layers its own noindex on top.
  alternates: {
    canonical: './',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <ThemeProvider>
          {children}
          <CommandPalette />
        </ThemeProvider>
        {/* Cookieless aggregate pageviews (what /privacy already promises).
            Beacon + script are same-origin /_vercel/insights/* — inside CSP
            'self', no policy change. Free Hobby tier; dashboard-enabled. */}
        <Analytics />
      </body>
    </html>
  );
}
