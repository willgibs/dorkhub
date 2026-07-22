import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { ogTokens } from '@/lib/og-tokens';
import { supabaseAnon } from '@/lib/supabase/clients';

export const alt = 'dorkhub — profile card';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Tree is dynamic anyway (docs/state.md), but this documents intent for the
 * M5 caching pass — same convention as the profile page's own `revalidate`.
 */
export const revalidate = 300;

const MAX_NAME_LENGTH = 60;
const MAX_BIO_LENGTH = 100;

const DOT_COLS = 12;
const DOT_ROWS = 6;
const DOT_ORIGIN_X = 760;
const DOT_ORIGIN_Y = 400;
const DOT_GAP = 24;

/**
 * Halftone-ish dot field, fading toward the bottom-right corner. Duplicated
 * from src/app/opengraph-image.tsx (satori-safe individually-positioned
 * circles instead of a `repeating-radial-gradient` background) — kept
 * self-contained per route rather than shared, per Wave 4 scope.
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

/** Shared chrome: bg, corner glow, halftone field, border frame — matches the static brand card. */
function CardChrome() {
  return (
    <>
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
    </>
  );
}

/** Small `dorkhub_` corner wordmark — same color split as the hero treatment, glyph scale. */
function WordmarkCorner() {
  return (
    <div
      style={{ position: 'absolute', top: 44, right: 64, display: 'flex', alignItems: 'baseline' }}
    >
      <span style={{ fontSize: 24, fontWeight: 700, color: ogTokens.foreground }}>dorkhub</span>
      <span style={{ fontSize: 24, fontWeight: 700, color: ogTokens.primary }}>_</span>
    </div>
  );
}

type ProfileOgData = {
  displayName: string;
  username: string;
  bio: string | null;
  projectCount: number;
};

/** Cookie-less anon read — OG images are fetched by crawlers with no session, and this keeps them cacheable. */
async function getProfileOgData(username: string): Promise<ProfileOgData | null> {
  const supabase = supabaseAnon();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio')
    .eq('username', username) // citext column — case-insensitive match
    .maybeSingle();
  if (!profile) return null;

  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id)
    .eq('status', 'published');

  const displayName = profile.display_name ?? profile.username;

  return {
    displayName: displayName.slice(0, MAX_NAME_LENGTH),
    username: profile.username,
    bio: profile.bio ? profile.bio.slice(0, MAX_BIO_LENGTH) : null,
    projectCount: count ?? 0,
  };
}

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const fontsDir = join(process.cwd(), 'src/assets/fonts');
  const [instrumentRegular, instrumentBold, jetBrainsMono, data] = await Promise.all([
    readFile(join(fontsDir, 'InstrumentSans-Regular.ttf')),
    readFile(join(fontsDir, 'InstrumentSans-Bold.ttf')),
    readFile(join(fontsDir, 'JetBrainsMono-Regular.ttf')),
    getProfileOgData(username),
  ]);

  const fonts = [
    {
      name: 'Instrument Sans',
      data: instrumentRegular,
      weight: 400 as const,
      style: 'normal' as const,
    },
    {
      name: 'Instrument Sans',
      data: instrumentBold,
      weight: 700 as const,
      style: 'normal' as const,
    },
    { name: 'JetBrains Mono', data: jetBrainsMono, weight: 400 as const, style: 'normal' as const },
  ];

  if (!data) {
    // Unknown username — fall back to the exact static brand card layout so
    // crawlers always get a valid image, never a 404/500.
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
        <CardChrome />
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
      { width: size.width, height: size.height, fonts },
    );
  }

  return new ImageResponse(
    <div
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: ogTokens.background,
        fontFamily: 'Instrument Sans',
      }}
    >
      <CardChrome />
      <WordmarkCorner />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'center',
          paddingLeft: 96,
          paddingRight: 140,
        }}
      >
        <div style={{ display: 'flex', maxWidth: 960 }}>
          <span
            style={{ fontSize: 64, fontWeight: 700, color: ogTokens.foreground, lineHeight: 1.15 }}
          >
            {data.displayName}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 20,
            fontFamily: 'JetBrains Mono',
            fontSize: 24,
            color: ogTokens.primary,
          }}
        >
          {`@${data.username}`}
        </div>

        {data.bio ? (
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              maxWidth: 900,
              fontSize: 26,
              fontWeight: 400,
              lineHeight: 1.4,
              color: ogTokens.mutedForeground,
            }}
          >
            {data.bio}
          </div>
        ) : null}
      </div>

      {data.projectCount > 0 ? (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            paddingLeft: 96,
            paddingBottom: 56,
            fontFamily: 'JetBrains Mono',
            fontSize: 20,
            color: ogTokens.mutedForeground,
          }}
        >
          {`${data.projectCount} project${data.projectCount === 1 ? '' : 's'}`}
        </div>
      ) : null}
    </div>,
    { width: size.width, height: size.height, fonts },
  );
}
