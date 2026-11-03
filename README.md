# Coast Strong — 228coaststrong.com

Community cleanup site for the Mississippi Gulf Coast. Slogan: COAST STRONG.

## Model

Git structure, all the way around, same as Moore Electric (Dev's ruling,
Nov 3, 2026): source lives here → branch → pull request → Dev merges →
Cloudflare Pages deploys Git-connected from `main`. No direct-upload or
zip deploys. This model stands until a reason to change it is found.

Sol owns the Coast Strong lane; Pip does mechanical execution on direction.
Design standard: dark hero, light-lock (meta color-scheme light only, no
dark-mode variant), `#fa6b12` brand, full family dedication, no Saturday
call on any page. First screenshot Dev names is the one he means.

## Provenance of this snapshot

First commit (Nov 3, 2026) is a point-in-time capture of the live site,
fetched served-byte verbatim by `snapshot.py` (kept outside this repo).
`snapshot-manifest.json` lists every file with its live URL, byte size,
and SHA-256. Sol's true build source was not in any Git repo Pip could
reach, so the live site itself is the source of record until Sol hands
over source — if she does, it replaces this snapshot by PR, verified
against production before merge.

Known capture artifacts (live behavior, not edits):

- Cloudflare injects per-response email-obfuscation tokens
  (`/cdn-cgi/l/email-protection`, `data-cfemail`) and sometimes a Web
  Analytics beacon script. Those tokens differ on every fetch, so a
  re-fetch of the live site will differ from this snapshot ONLY in those
  injected bits. Content is otherwise identical.
- `/coastal.css` and `/flags.css` return the homepage HTML (`text/html`)
  on the live site — the stylesheets are dead references; real styling is
  the inline `<style>` blocks. They are captured verbatim as served.
- Translated journal-post URLs (`/es/journal/clear-notes/` etc.) and
  per-language `feed.xml` files return the homepage HTML on the live site
  (fallback serving). They are captured verbatim; the sitemap lists them
  as real URLs. Fixing that listing is a Sol-lane decision, not done here.
- Images (`.jpg` / `.webp` / `.png`) could not be pushed through the
  GitHub connector, which accepts text only. They were uploaded to this
  repo through the GitHub web UI in the follow-up step; verify they are
  present before connecting Pages to this repo.

## Changing the site

Branch → PR → Dev merges. Every change gets preview-verified against
production (all languages, all widths) before it is called done. Drift
from the approved baseline is regression.

## Open items (Nov 3, 2026)

- Connect the Cloudflare Pages project `228coaststrong` to this repo
  (dashboard sign-in required — Dev's tap).
- Intake translations (VI/PL) flagged for native-speaker polish.
- Network board, domain-email (Workspace unfinished, NO MX), Wave B,
  Stefan, "Joni" held out.
