import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { LANGUAGE_COLORS } from '@/lib/lang-colors';
import { ogTokens } from '@/lib/og-tokens';
import { supabaseAnon } from '@/lib/supabase/clients';

export const alt = 'dorkhub — project card';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Tree is dynamic anyway (docs/state.md), but this documents intent for the
 * M5 caching pass — same convention as the project page's own `revalidate`.
 */
export const revalidate = 300;

const MAX_NAME_LENGTH = 60;
const MAX_TAGLINE_LENGTH = 120;

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

/** 1200 → "1.2k", matching RepoStatsRow's "★ 1.2k". */
function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`;
}

/**
 * Drawn star, not a "★" glyph — neither vendored font (JetBrains Mono,
 * Instrument Sans) ships the U+2605 codepoint, so satori renders it as a
 * missing-glyph tofu box. An inline SVG path sidesteps font coverage
 * entirely (satori supports basic SVG passthrough).
 */
function StarIcon({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"
        fill={color}
      />
    </svg>
  );
}

type ProjectOgData = {
  name: string;
  tagline: string | null;
  language: string | null;
  stars: number;
  username: string;
};

/** Cookie-less anon read — OG images are fetched by crawlers with no session, and this keeps them cacheable. */
async function getProjectOgData(username: string, slug: string): Promise<ProjectOgData | null> {
  const supabase = supabaseAnon();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .maybeSingle();
  if (!profile) return null;

  // RLS "published-or-own" already collapses to published-only for anon —
  // the explicit filter matches the profile page's convention for clarity.
  const { data: project } = await supabase
    .from('projects')
    .select('name, tagline, primary_language, stars_count')
    .eq('profile_id', profile.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (!project) return null;

  return {
    name: project.name.slice(0, MAX_NAME_LENGTH),
    tagline: project.tagline ? project.tagline.slice(0, MAX_TAGLINE_LENGTH) : null,
    language: project.primary_language,
    stars: project.stars_count,
    username: profile.username,
  };
}

export default async function Image({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;

  const fontsDir = join(process.cwd(), 'src/assets/fonts');
  const [instrumentRegular, instrumentBold, jetBrainsMono, data] = await Promise.all([
    readFile(join(fontsDir, 'InstrumentSans-Regular.ttf')),
    readFile(join(fontsDir, 'InstrumentSans-Bold.ttf')),
    readFile(join(fontsDir, 'JetBrainsMono-Regular.ttf')),
    getProjectOgData(username, slug),
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
    // Not found / not visible to anon (unpublished, unknown slug, unknown
    // user) — fall back to the exact static brand card layout so crawlers
    // always get a valid image, never a 404/500.
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

  const languageColor = data.language
    ? (LANGUAGE_COLORS[data.language.toLowerCase()] ?? ogTokens.mutedForeground)
    : ogTokens.mutedForeground;

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
            {data.name}
          </span>
        </div>

        {data.tagline ? (
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              maxWidth: 900,
              fontSize: 27,
              fontWeight: 400,
              lineHeight: 1.4,
              color: ogTokens.mutedForeground,
            }}
          >
            {data.tagline}
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontFamily: 'JetBrains Mono',
            fontSize: 21,
            color: ogTokens.mutedForeground,
          }}
        >
          {`@${data.username}`}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          paddingLeft: 96,
          paddingBottom: 56,
          fontFamily: 'JetBrains Mono',
          fontSize: 20,
          color: ogTokens.mutedForeground,
        }}
      >
        {data.language ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                display: 'flex',
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: languageColor,
              }}
            />
            <span style={{ display: 'flex' }}>{data.language}</span>
          </div>
        ) : null}
        {data.stars > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <StarIcon color={ogTokens.mutedForeground} />
            <span style={{ display: 'flex' }}>{formatCount(data.stars)}</span>
          </div>
        ) : null}
      </div>
    </div>,
    { width: size.width, height: size.height, fonts },
  );
}
