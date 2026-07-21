/**
 * Design-system fixtures — ported from explorations/src/skeleton.html (M0).
 * These feed /design styleguide pages and dev seeds. Each fixture stresses a
 * specific layout failure mode; keep them stable.
 */

export type FixtureAuthor = {
  username: string;
  displayName: string;
  bio: string;
  initial: string;
  projects: number;
  followers: number;
};

export type FixtureProject = {
  slug: string;
  name: string;
  tagline: string;
  language: string;
  languageColor: string;
  stars: number | null; // null = brand new; render absence, never "0"
  likes: number | null;
  tags: string[];
  hasScreenshot: boolean;
  author: string; // username
  license?: string;
  forks?: number;
  demoUrl?: string;
  updatedAgo?: string;
};

export const authors: Record<string, FixtureAuthor> = {
  mollybuilds: {
    username: 'mollybuilds',
    displayName: 'molly',
    bio: 'builds small loud things · portland',
    initial: 'm',
    projects: 12,
    followers: 340,
  },
  gremlinworks: {
    username: 'gremlinworks',
    displayName: 'gremlin',
    bio: 'chaotic neutral CLI enjoyer',
    initial: 'g',
    projects: 7,
    followers: 122,
  },
  rosiehux: {
    username: 'rosiehux',
    displayName: 'rosie',
    bio: 'hardware, plants, guilt-driven development',
    initial: 'r',
    projects: 5,
    followers: 897,
  },
  kevbot: {
    username: 'kevbot',
    displayName: 'kev',
    bio: 'i make things sometimes',
    initial: 'k',
    projects: 1,
    followers: 3,
  },
};

export const projects: FixtureProject[] = [
  {
    slug: 'tinysynth',
    name: 'tinysynth',
    tagline: 'a 2KB web synth you can play with your keyboard',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: 214,
    likes: 89,
    tags: ['audio', 'webaudio', 'tiny', 'toy'],
    hasScreenshot: true,
    author: 'mollybuilds',
    license: 'MIT',
    forks: 12,
    demoUrl: '#',
    updatedAgo: '3 days ago',
  },
  {
    slug: 'gitgoblin',
    name: 'gitgoblin',
    tagline: 'a cron job that writes passive-aggressive commit messages when you forget to push',
    language: 'Go',
    languageColor: '#00ADD8',
    stars: 67,
    likes: 31,
    tags: ['cli', 'git', 'humor'],
    hasScreenshot: false,
    author: 'gremlinworks',
    updatedAgo: '2 weeks ago',
  },
  {
    slug: 'plantdad',
    name: 'plantdad',
    tagline: 'an e-ink dashboard that guilt-trips me into watering my monstera',
    language: 'Python',
    languageColor: '#3572A5',
    stars: 1200,
    likes: 412,
    tags: ['hardware', 'raspberry-pi', 'e-ink', 'plants', 'iot', 'sensors', 'dashboard'],
    hasScreenshot: true,
    author: 'rosiehux',
    updatedAgo: '1 month ago',
  },
  {
    slug: 'untitled-maze-thing',
    name: 'untitled-maze-thing',
    tagline: 'i made a maze generator. it makes mazes.',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null,
    likes: null,
    tags: ['generative'],
    hasScreenshot: false,
    author: 'kevbot',
    updatedAgo: 'just shipped',
  },
];

/** The markdown-prose stress test: h1/h2, paragraph, code block, inline code, list, link, table, blockquote. */
export const sampleReadmeHtml = `
<h1>tinysynth</h1>
<p>a 2KB web synth you can play with your keyboard. no deps, no build step, no reason.</p>
<h2>why</h2>
<ul>
<li>I wanted to know how small a playable synth could get</li>
<li>turns out: pretty small</li>
<li><a href="#">try the live demo</a> — mash your keyboard</li>
</ul>
<h2>usage</h2>
<pre><code>import { synth } from 'https://esm.sh/tinysynth'

synth({ wave: 'square', octave: 3 }).attach(document)</code></pre>
<p>pass <code>wave: 'sine' | 'square' | 'saw'</code> and an <code>octave</code>. that's the whole API.</p>
<h2>keys</h2>
<table>
<thead><tr><th>key</th><th>note</th></tr></thead>
<tbody>
<tr><td><code>A</code></td><td>C4</td></tr>
<tr><td><code>W</code></td><td>C#4</td></tr>
<tr><td><code>S</code></td><td>D4</td></tr>
<tr><td><code>D</code></td><td>E4</td></tr>
</tbody>
</table>
<blockquote><p>built in a weekend. sounds like it, in a good way.</p></blockquote>
`;

export const sampleUpdate = {
  title: 'v0.3 — tiny reverb',
  date: '3 days ago',
  body: "added a reverb. it's 300 bytes. i'm unreasonably proud of it. also fixed the bug where holding five keys summoned a demon frequency.",
};
