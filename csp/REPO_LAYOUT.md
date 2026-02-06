
# Repo layout (CSP Edition)

## Location (confirmed)
All CSP Edition packages are implemented inside this fork under:

v3/@claude-flow-csp/*

The wrapper CLI is:
v3/@claude-flow-csp/cli

The CLI binary name is:
claude-flow-csp

## New packages
Add these packages to the monorepo:
- v3/@claude-flow-csp/core
- v3/@claude-flow-csp/workflows
- v3/@claude-flow-csp/agents
- v3/@claude-flow-csp/verify
- v3/@claude-flow-csp/cli

## Wrapper CLI
The wrapper CLI should:
- expose `claude-flow-csp` command
- import/require Claude Flow runtime from the fork (local monorepo packages)
- register CSP additions before execution (workflows/agents/verify preset)
- forward unknown commands to base Claude Flow CLI (pass-through)

## Upstream code modifications (keep minimal)
Only add CSP registrations in:
- workflow registry
- agent registry
- verify preset registry

No other core changes unless unavoidable.
