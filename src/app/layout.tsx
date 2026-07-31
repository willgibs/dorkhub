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
  title: {
    default: 'dorkhub — a home for the things you build for fun',
    template: '%s · dorkhub',
  },
  description:
    'A social discovery platform for hobbyist developers. Connect GitHub, pick the repos you love, give each one a page. Free to browse, free to fork.',
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
      </body>
    </html>
  );
}
