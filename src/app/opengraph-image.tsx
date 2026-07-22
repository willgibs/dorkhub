import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { ogTokens } from '@/lib/og-tokens';

export const alt = 'dorkhub — a home for the things you build for fun';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const DOT_COLS = 12;
const DOT_ROWS = 6;
const DOT_ORIGIN_X = 760;
const DOT_ORIGIN_Y = 400;
const DOT_GAP = 24;

/**
 * Halftone-ish dot field, fading toward the bottom-right corner. Built from
 * individually-positioned circles rather than a `repeating-radial-gradient`
 * background (satori's CSS support doesn't reliably cover the `repeating-*`
 * gradient variants — see docs/design-system.md's `.bg-halftone` for the real
 * app's repeat-based version, which isn't satori-safe).
 */
function HalftoneDots() {
  const dots = [];
  for (let row = 0; row < DOT_ROWS; row++) {
    for (let col = 0; col < DOT_COLS; col++) {
      const fade = 1 - Math.hypot(col - (DOT_COLS - 1), row - (DOT_ROWS - 1) / 2) / (DOT_COLS + 1);
      const opacity = Math.max(0.04, fade * 0.16);
      dots.push(
        <div
          key={`dot-${row}-${col}`}
          style={{
            position: 'absolute',
            top: DOT_ORIGIN_Y + row * DOT_GAP,
            left: DOT_ORIGIN_X + col * DOT_GAP,
            width: 3,
            height: 3,
            display: 'flex',
            borderRadius: 999,
            backgroundColor: ogTokens.foreground,
            opacity,
          }}
        />,
      );
    }
  }
  return <>{dots}</>;
}

export default async function Image() {
  const fontsDir = join(process.cwd(), 'src/assets/fonts');
  const [instrumentRegular, instrumentBold, jetBrainsMono] = await Promise.all([
    readFile(join(fontsDir, 'InstrumentSans-Regular.ttf')),
    readFile(join(fontsDir, 'InstrumentSans-Bold.ttf')),
    readFile(join(fontsDir, 'JetBrainsMono-Regular.ttf')),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: ogTokens.background,
        fontFamily: 'Instrument Sans',
      }}
    >
      {/*
          Soft cyan glow accent, top-right. `position: absolute` layers need
          explicit top/left/right/bottom (0) here — satori's Yoga layout
          collapses an `inset: 0` shorthand to a zero-size box, silently
          hiding the layer (confirmed by rendering both ways).
        */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundImage: `radial-gradient(1000px 780px at 102% -12%, ${ogTokens.primarySoft}99, transparent 70%)`,
        }}
      />

      <HalftoneDots />

      {/* subtle border frame */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          right: 24,
          bottom: 24,
          display: 'flex',
          border: `1px solid ${ogTokens.border}`,
          borderRadius: 18,
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'center',
          paddingLeft: 96,
          paddingRight: 96,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: 108, fontWeight: 700, color: ogTokens.foreground }}>
            dorkhub
          </span>
          <span style={{ fontSize: 108, fontWeight: 700, color: ogTokens.primary }}>_</span>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 34,
            fontWeight: 400,
            color: ogTokens.mutedForeground,
          }}
        >
          a home for the things you build for fun
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          paddingLeft: 96,
          paddingBottom: 56,
          fontFamily: 'JetBrains Mono',
          fontSize: 22,
          color: ogTokens.mutedForeground,
        }}
      >
        {'// free to browse, free to fork'}
      </div>
    </div>,
    {
      width: size.width,
      height: size.height,
      fonts: [
        { name: 'Instrument Sans', data: instrumentRegular, weight: 400, style: 'normal' },
        { name: 'Instrument Sans', data: instrumentBold, weight: 700, style: 'normal' },
        { name: 'JetBrains Mono', data: jetBrainsMono, weight: 400, style: 'normal' },
      ],
    },
  );
}
