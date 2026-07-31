import { Outfit } from 'next/font/google';
import type { ReactNode } from 'react';

/**
 * U1 refresh round (docs/plans/u1-ui-refresh.md): the electric family
 * carries its identity in the Outfit display face, loaded HERE —
 * route-local, zero cost to the rest of the app. The current family keeps
 * Instrument Sans (its identity), so no other faces load. Fraunces and
 * Space Grotesk left with the hard-no'd R1 skins.
 */
const electricDisplay = Outfit({
  subsets: ['latin'],
  variable: '--font-display-electric',
});

export default function DirectionsLayout({ children }: { children: ReactNode }) {
  return <div className={electricDisplay.variable}>{children}</div>;
}
