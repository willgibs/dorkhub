// Vercel's "ignored build step" (vercel.json: ignoreCommand). A push that changes nothing a deployment serves
// (the records, the tests, CI, the tools that only check or measure) need not build or deploy: the deployment
// before it is still exactly right. Exit 0 skips the build; exit 1 builds. In any doubt it builds.
//
//   node scripts/skip-build.mjs      decides from VERCEL_GIT_PREVIOUS_SHA..HEAD, which Vercel sets to the last
//                                    commit it deployed successfully for this branch
//
// Why it exists: on 2026-11-13 half of the day's 28 production deployments were pushes of docs/ alone, each one
// a build and 20 MB of stored output that served nobody anything new.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/* what is never deployed: the records, Markdown at the root, the tests, CI, and the scripts that only check or
   measure. Everything else builds, including this file, vercel.json and the build itself. */
const NOT_DEPLOYED = [/^docs\//, /^[^/]+\.md$/, /^tests\//, /^\.github\//, /^scripts\/(e2e|eval|prove|contact)\.mjs$/, /^scripts\/eval\//];

/** @param {string} path */
export const deployed = path => !NOT_DEPLOYED.some(re => re.test(path));

/** build or skip, and why
    @param {string | undefined} base the last commit deployed for this branch
    @param {(args: string[]) => string} git runs git and returns what it printed; throws if git fails
    @returns {{ act: 'build' | 'skip', why: string }} */
export function decide(base, git) {
  if (!base) return { act: 'build', why: 'this branch has no earlier deployment to compare with' };
  let files;
  try { files = git(['diff', '--name-only', base, 'HEAD']).split('\n').filter(Boolean); } catch { return { act: 'build', why: `could not compare with ${base.slice(0, 7)}` }; }
  if (!files.length) return { act: 'build', why: 'no file differs, so there is nothing to judge by' };
  const hit = files.find(deployed);
  if (hit) return { act: 'build', why: `${hit} is part of what is deployed` };
  return { act: 'skip', why: `${files.length} file${files.length === 1 ? '' : 's'} changed and none is deployed` };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const d = decide(process.env.VERCEL_GIT_PREVIOUS_SHA, args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  console.log(`${d.act}: ${d.why}`);
  process.exit(d.act === 'skip' ? 0 : 1);
}
