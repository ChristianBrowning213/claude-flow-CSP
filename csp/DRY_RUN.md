
# DRY_RUN mode

## Purpose
Allow:
- tests to pass in CI without a solver or QLIP installed
- users to sanity-check orchestration wiring

## Behavior
When `--dry-run` is enabled:
- orchestration runs end-to-end without any Anthropic calls
- tool calls are stubbed via an internal StubToolClient
- artifacts are still written deterministically

See DRY_RUN_GENERATION.md for exact deterministic rules.
