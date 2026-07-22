import type { Metadata } from 'next';
import { Geist, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
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
  metadataBase: new URL('https://dorkhub.com'),
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
  // noindex until M9 launch: placeholder copy + non-canonical *.vercel.app domain must not index. Flip at launch.
  robots: {
    index: false,
    follow: false,
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
