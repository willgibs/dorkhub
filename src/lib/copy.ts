/**
 * dorkhub voice — "Quiet dev-native" (locked M0).
 * Rules: generosity verbs (share, fork, take, borrow, tinker). Banned: buy, sell, hire,
 * rocket emoji, growth-speak. Errors take the blame. Empty states are invitations.
 * Zero-stat projects show absence, never "0".
 */
export const copy = {
  // 'list a project' (was 'show your thing' → 'list my project') — U2 R2/R3
  // board direction: conceptually cleaner, and "a" (not "my") leaves room for
  // the planned list-any-repo-by-url flow (W-wave, safety pass first).
  ctaPrimary: 'list a project',
  like: '++',
  save: 'save',
  saved: 'saved',
  follow: 'follow',
  following: 'following',
  // U2 R3: "weird" vocabulary retired sitewide (board: random/new is clearer).
  emptyFeed: 'nothing here yet — try a random find',
  emptyFeedLead: 'nothing here yet —',
  emptyFeedLink: 'try a random find',
  relatedTitle: 'more like this',
  relatedKicker: 'related',
  relatedNote: 'same languages, same corners of github',
  recsTitle: 'because you starred',
  recsImportNudge: 'bring your github stars — we’ll find more like them',
  // 'random' (was 'weird') — U2 R2 board direction: conceptually clearer
  // nav name. Voice-flavor strings keep "weird" (that's vocabulary, not nav).
  navWeird: 'random',
  profileEmptyProjects: 'nothing published here yet',
  projectNoReadme: 'no readme yet — the code speaks for itself',
  projectDraftBadge: 'draft — only you can see this',
  // W3: project page rail — the README's own shape, plus its maker.
  projectContents: 'contents',
  projectMadeBy: 'made by',
  followerUnit: 'followers',
  followerUnitOne: 'follower',
  projectRefreshThrottled: 'just synced — give github five minutes to breathe',
  newTitle: 'pick a thing to show',
  newSubtitle: 'public repos only — drafts stay yours until you publish',
  newNoRepos: 'no public repos found — push something new first',
  newRepoListTruncated: 'showing your 500 most recently updated repos',
  newRepoUnavailable: 'github wouldn’t hand that repo over — try again?',
  newRepoNotYours: 'that repo isn’t yours to show',
  newRepoTaken: 'someone already showcases this repo here',
  settingsProjectsTitle: 'your projects',
  settingsEmptyProjects: 'nothing here yet — go show your thing',
  settingsDeleteConfirm: 'remove this project from dorkhub? the repo stays yours on github.',
  actionPublish: 'publish',
  actionUnpublish: 'unpublish',
  actionRefresh: 'refresh from github',
  actionSave: 'save',
  actionSaved: 'saved',
  actionRemove: 'remove',
  sortTrending: 'trending',
  loadMore: 'load more',
  loadingMore: 'loading…',
  savedTitle: 'saved',
  savedEmpty: 'nothing saved yet — go find something worth keeping',
  followingTitle: 'following',
  followingEmpty: 'you’re not following anyone yet — go find your people',
  listsTitle: 'lists',
  listNew: 'new list',
  listNewPlaceholder: 'name your list',
  listDescriptionPlaceholder: 'what ties these together?',
  listEmpty: 'nothing in this list yet',
  listsEmptyOwn: 'no lists yet — start one and put your favorite finds together',
  listsEmptyVisitor: 'no public lists yet',
  listAdd: 'add to list',
  // The lists discovery signal (P3-B). Static strings only — /design/voice
  // flattens copy.ts as string | string[] | one-level map, so a pluralizer
  // function would silently vanish from the styleguide. The component picks
  // the unit and composes; only public lists count (D18).
  listedInUnitOne: 'list',
  listedInUnit: 'lists',
  listedInLabel: 'in',
  // List item counts — one source for the three surfaces that render them
  // (lists index, list detail, profile lists section), which had drifted into
  // two different inline expressions and two different type treatments.
  listItemUnitOne: 'item',
  listItemUnit: 'items',
  listsEmptyMenu: 'no lists yet',
  listNameLabel: 'name',
  listDescriptionLabel: 'description — optional',
  listCapHit: 'you’ve hit 50 lists — the cap for now',
  listNameTaken: 'a few of your lists already use that name — try a different one?',
  listSaveFailedLead: 'couldn’t save',
  listSavePartialTail: '— the rest went through. try again?',
  listSaveAllTail: '— try again?',
  listItemCapHit: 'this list is full — 400 is the cap for now',
  listDeleteConfirm: 'delete this list? the projects in it stay put.',
  listPrivateBadge: 'private',
  // ONE stable label for the visibility switch (D30). It used to swap between
  // 'public' and 'private' with the state, so "off / private" read as
  // "private is off, therefore public" — Will hit exactly that in QA. The
  // label now names what the switch CONTROLS and the switch position carries
  // the state, matching the is_public column so nothing inverts anywhere.
  listVisibilityPublic: 'public',
  // States both halves of the promise: what private means, and the D18
  // guarantee that private membership doesn't feed a project's public signal —
  // said where the choice is made, not only in an ADR.
  listVisibilityHelp:
    'private lists stay yours — hidden from your profile, and they don’t count toward a project’s list total',
  tagsTitle: 'browse by tag',
  tagsStackLabel: 'stacks',
  tagsTopicLabel: 'topics',
  signInPrompt: 'sign in to join in',
  searchPlaceholder: 'search projects…',
  featuredLabel: 'featured',
  searchEmpty: 'nothing yet — try fewer letters',
  searchRateLimited: 'a lot of searching just now — give it a minute?',
  searchGroupProjects: 'projects',
  searchGroupPeople: 'people',
  searchGroupTags: 'tags',
  searchTitle: 'search',
  searchStart: 'type something — a name, an owner, a tag',
  // Static, not interpolated: /design/voice flattens copy as
  // string | string[] | one-level map, so a formatter would vanish from it.
  searchCapped: 'showing the strongest matches — narrow it down to see others',
  searchSeeAll: 'see all results',
  // Deliberately does not promise full-text: readme_html has no anon grant
  // and is unindexed, so "everything" would be a lie.
  searchScopeNote: 'searches names, owners, taglines and tags',
  searchFilterLanguage: 'language',
  searchFilterTag: 'tag',
  searchFilterStars: 'stars',
  searchFilterDemo: 'has a demo',
  searchFilterClear: 'clear filters',
  searchClear: 'clear search',
  importTitle: 'bring your stars',
  importSubtitle:
    'we’ll match your public github stars against the gallery — the rest go live right after',
  importStart: 'import my stars',
  importRunning: 'reading your stars…',
  importDoneHere: 'of your stars are already here',
  importDoneOwn: 'of your own repos aren’t listed yet',
  importEmpty: 'no public stars found — go wander github first',
  importSkip: 'later — take me home',
  importMaterializing: 'putting them on the wall…',
  importDoneLive: 'of your stars just went live',
  importDonePolishing: 'more going live automatically — check back in a bit',
  sortNewest: 'newest',
  // Consent surface (vision principle 4). Wording is UNCHANGED from the two
  // hardcoded copies this replaced — it was duplicated verbatim in the profile
  // page and the claim page, which is exactly how a consent string drifts.
  // Changing the words is a product decision, not a refactor.
  unclaimedBadge: 'curated by dorkhub from public github data · not yet claimed',
  unclaimedIsThisYou: 'is this you?',
  claimTitle: 'we hand-picked your work',
  claimBody: 'this page is yours if you want it — or we’ll remove it. no strings.',
  claimAccept: 'claim my page',
  claimDecline: 'remove my stuff',
  claimDeclined: 'done — your pages are unpublished. change your mind anytime by signing back in.',
  adminQueueTitle: 'review queue',
  adminSourcesTitle: 'sources',
  adminClaimsTitle: 'claims',
  reportAction: 'report',
  reportDialogTitle: 'report this project',
  reportReasonLabel: 'what’s wrong?',
  reportReasonPlaceholder: 'pick one',
  projectVisitDemo: 'visit the demo',
  projectManageInSettings: 'manage in settings',
  reportReasons: {
    spam: 'spam or seo bait',
    malware: 'malware or sketchy code',
    'not-a-project': 'not actually a project',
    abuse: 'hateful or abusive',
    other: 'something else',
  },
  reportNoteLabel: 'more context — optional',
  reportSubmit: 'send report',
  reportSubmitting: 'sending…',
  reportThanks: 'got it — a human will take a look',
  reportAlready: 'you already reported this one — it’s on the list',
  reportRateLimited: 'that’s a lot of reports for one day — try again tomorrow',
  error: 'something broke on our end — not you, us. try again?',
  errorRetry: 'try again',
  notFound: '404: page not found\n// maybe it shipped, maybe it never existed',
  notFoundCta: 'back to the gallery',
  forkNudge: 'fork it — it’s yours',
  footerLine: 'made by dorks, for dorks',
  browseCta: 'browse projects',
  signIn: 'sign in with GitHub',
  isList: ['show-and-tell for things you built', 'forkable by design', 'free, forever'],
  isntList: ['a leaderboard', 'a marketplace', 'a hiring portfolio'],
  // U2 home+feed exemplar (docs/plans/u2-rework.md R1). Preview-scoped today;
  // these graduate with the composition at adoption. Static strings only —
  // /design/voice flattens copy as string | string[] | one-level map.
  statsUnitProjects: 'projects',
  statsUnitMakers: 'makers',
  statsZeroPitch: 'zero sales pitches',
  railTrendingIn: 'trending in',
  railSeeAll: 'see all',
  weirdSpotKicker: 'today’s random pick',
  weirdSpotHint: 'no algorithm, just dice — a new one every day',
  weirdSpotCta: 'roll your own',
  weirdSpotVisit: 'see the thing',
  risingKicker: 'makers getting love right now',
  followingRailKicker: 'from people you follow',
  followingRailNudge: 'follow a few makers and their new stuff lands here',
  sortActive: 'active',
  discoverKicker: 'discover',
  discoverTitle: 'fresh finds, daily',
  discoverNote: 'a random pick, rising makers, and what’s moving right now',
  clusterKicker: 'quick hits',
  quickHitsTitle: 'fresh pushes',
  galleryKicker: 'the gallery',
  galleryTitle: 'browse everything',
  howTitle: 'three steps, no strings',
  howKicker: 'how it works',
  // R3 hero (board-picked H1, 2026-08-01). Tone note: dorkhub is a real
  // resource for ALL projects — playful register stays, "fun/side-project"
  // exclusivity language does not.
  heroHeadlineTools: 'discover the best tools for your next project',
  heroSubDiscover:
    'a curated gallery of developer projects — browse, fork, follow the makers. when you’re ready, list your own.',
  captureTitle: 'built something worth sharing?',
  captureSubline: 'sign in with github — takes a minute',
  footerColBrowse: 'browse',
  footerColYours: 'yours',
  footerColMeta: 'dorkhub',
} as const;
