/**
 * dorkhub voice — "Quiet dev-native" (locked M0).
 * Rules: generosity verbs (share, fork, take, borrow, tinker). Banned: buy, sell, hire,
 * rocket emoji, growth-speak. Errors take the blame. Empty states are invitations.
 * Zero-stat projects show absence, never "0".
 */
export const copy = {
  ctaPrimary: 'show your thing',
  like: '++',
  save: 'save',
  saved: 'saved',
  follow: 'follow',
  following: 'following',
  emptyFeed: 'nothing here yet — go find something weird',
  error: 'something broke on our end — not you, us. try again?',
  notFound: '404: page not found\n// maybe it shipped, maybe it never existed',
  forkNudge: 'fork it — it’s yours',
  heroHeadline: 'a home for the things you build for fun',
  heroSub:
    'connect github, pick the repos you love, give each one a page. free to browse, free to fork.',
  footerLine: 'made by dorks, for dorks',
  browseCta: 'browse projects',
  signIn: 'sign in with GitHub',
  isList: ['show-and-tell for things you built', 'forkable by design', 'free, forever'],
  isntList: ['a leaderboard', 'a marketplace', 'a hiring portfolio'],
} as const;
