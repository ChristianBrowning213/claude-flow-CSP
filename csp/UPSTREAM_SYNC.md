
# Upstream sync policy

We maintain a fork of Claude Flow. To keep maintenance sane:

## Baseline tracking
- Record the upstream commit hash in:
  - this file
  - optionally a top-level UPSTREAM_COMMIT.txt

## No-touch rule
Upstream files are "no-touch" except for the explicit integration points:
- workflow registry (register CSP workflows)
- agent registry (register CSP agents)
- verify preset registry (register verify:csp)

All CSP logic must live in @claude-flow-csp/*.

## Merge cadence
- Rebase/merge upstream on a scheduled cadence.
- Resolve conflicts by restoring upstream behavior and re-applying CSP registrations only.

## Versioning
- claude-flow-csp has its own version number.
- Include upstream Claude Flow commit hash in CSP release notes.
