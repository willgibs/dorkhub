import { ImageResponse } from 'next/og';
import { ogTokens } from '@/lib/og-tokens';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * Apple touch icon (P4 L3): the favicon's "d_" mark at home-screen scale.
 * iOS squares off its own corners, so no border radius here; system-ui for
 * the same reason as icon.tsx (no vendored font in the edge image runtime).
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ogTokens.background,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 104,
          lineHeight: 1,
        }}
      >
        <span style={{ display: 'flex', color: ogTokens.foreground }}>d</span>
        <span style={{ display: 'flex', color: ogTokens.primary }}>_</span>
      </div>
    </div>,
    { width: size.width, height: size.height },
  );
}
