import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { RESERVED_PROJECT_SLUGS } from '@/lib/projects/slug';

/**
 * Source-scanning guards (P2.7) for two bug classes that `pnpm verify` and
 * `pnpm test` are both STRUCTURALLY blind to — each has already shipped
 * broken once:
 *
 * 1. A `'use server'` module may export only async functions. Violating it is
 *    invisible to tsc and to the test suite (which never imports these
 *    modules); only a full `next build` catches it — i.e. in CI, after the
 *    work has been declared done. This is exactly how P3-A shipped:
 *    LIST_CAP/ITEM_CAP had to be evacuated to src/lib/lists/policy.ts.
 *
 * 2. `RESERVED_PROJECT_SLUGS` is a hand-maintained mirror of the static route
 *    directories under `/u/[username]/`. Next resolves a static segment
 *    before `[slug]`, so a project slugged like one of them is unreachable at
 *    its own permalink — silently: no test, no type error, no build error.
 *    P3-A added `lists` and remembered the guard; the point of this test is
 *    that the NEXT sibling route cannot forget it.
 *
 * Both scan the filesystem rather than importing, deliberately: importing a
 * `'use server'` module into a node-env test is exactly the thing that
 * doesn't reproduce the constraint.
 */

const SRC = path.join(process.cwd(), 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/**
 * True when the module's FIRST real statement is the `'use server'`
 * directive. Leading comments and blank lines are skipped; a `'use server'`
 * appearing anywhere later is a string, not a directive.
 */
function isUseServerModule(source: string): boolean {
  const lines = source.split('\n');
  let inBlockComment = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }
    if (line.startsWith('//')) continue;
    if (line.startsWith('/*')) {
      if (!line.includes('*/')) inBlockComment = true;
      continue;
    }

    return line === `'use server';` || line === `"use server";`;
  }

  return false;
}

/** Top-level `export` forms Next permits in a `'use server'` module (types are erased at compile time). */
const ALLOWED_EXPORT = /^export\s+(async\s+function|default\s+async\s+function|type\b|interface\b)/;

describe("'use server' modules export only async functions", () => {
  const files = walk(SRC).filter((file) => isUseServerModule(readFileSync(file, 'utf8')));

  it('finds the server-action modules at all (guards against a broken scanner)', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const file of files) {
    it(path.relative(process.cwd(), file), () => {
      const offenders = readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => line.startsWith('export'))
        .filter((line) => !ALLOWED_EXPORT.test(line));

      expect(offenders).toEqual([]);
    });
  }
});

describe('RESERVED_PROJECT_SLUGS covers every static route under /u/[username]/', () => {
  const routeDir = path.join(SRC, 'app', '(app)', 'u', '[username]');

  const staticSegments = readdirSync(routeDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    // `[param]` is dynamic and `_private` isn't routable. `(group)` is a route
    // GROUP — it organises files (W4 put the profile page in one so its
    // `loading.tsx` would stop covering its siblings) and contributes nothing
    // to the URL, so it can never collide with a project slug.
    .filter((name) => !name.startsWith('[') && !name.startsWith('_') && !name.startsWith('('));

  it('finds the route directory (guards against a moved route tree)', () => {
    expect(staticSegments.length).toBeGreaterThan(0);
  });

  for (const segment of staticSegments) {
    it(`/u/[username]/${segment} is a reserved project slug`, () => {
      expect(RESERVED_PROJECT_SLUGS.has(segment)).toBe(true);
    });
  }
});
