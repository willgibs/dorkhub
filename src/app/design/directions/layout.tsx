import { Fraunces, Outfit, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';

/**
 * U1 refresh round (docs/plans/u1-ui-refresh.md): the candidate directions
 * carry their identity in the DISPLAY face, so the alternates load HERE —
 * route-local, zero cost to the rest of the app. Each skin block in
 * src/styles/directions.css remaps --font-display to one of these vars;
 * body (Geist) and mono (JetBrains) stay fixed so the comparison is honest.
 */
const terminalDisplay = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display-terminal',
});

const zineDisplay = Fraunces({
  subsets: ['latin'],
  variable: '--font-display-zine',
});

const electricDisplay = Outfit({
  subsets: ['latin'],
  variable: '--font-display-electric',
});

export default function DirectionsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${terminalDisplay.variable} ${zineDisplay.variable} ${electricDisplay.variable}`}
    >
      {children}
    </div>
  );
}
