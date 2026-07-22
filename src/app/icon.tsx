import { ImageResponse } from 'next/og';
import { ogTokens } from '@/lib/og-tokens';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * Favicon: a mono/bold "d_" mark echoing the `dorkhub_` wordmark (see
 * src/components/site-header.tsx) at glyph scale. 32px is too small for
 * Instrument Sans's letterforms to register meaningfully, so this uses
 * system-ui rather than loading a vendored font file.
 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ogTokens.background,
        borderRadius: 7,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 20,
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
