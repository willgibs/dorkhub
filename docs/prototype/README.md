# The prototype

`dorkhub-prototype.html` is the last round (12) of the single-file prototype Will iterated
on as a claude.ai artifact before Dorkhub became this app. The app was ported from it:
`src/` is the same page split into modules, and the prompts moved into `lib/prompts.js`
unchanged. The page prompt was checked byte for byte against the prototype across eight
arrival types.

It is kept for reference only. It does not run outside claude.ai: it calls the artifact
runtime (`window.claude.use('sample' | 'downloads' | 'db' | 'user')`) instead of
`/api/write`.

Worth reading it for:
- **The Hub** (`renderCommons`, `sharePayload`, `publishDig`, `importWarren`, `followDig`):
  readers published rabbit holes to a shared feed, and others could follow one into
  their own collection. It was left out of launch. Bringing back sharing in some form
  needs Will's go.
- **Behaviour comparisons.** If something feels off in the app, compare it with how the
  prototype did it.
