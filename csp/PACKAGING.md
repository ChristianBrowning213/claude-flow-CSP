
# Packaging & Publishing

## NPM packages
Primary distributable:
- name: claude-flow-csp
- package path: v3/@claude-flow-csp/cli

Internal workspace packages:
- @claude-flow-csp/core
- @claude-flow-csp/workflows
- @claude-flow-csp/agents
- @claude-flow-csp/verify

## Binary
- bin name: claude-flow-csp
- points to the wrapper CLI entrypoint (node)

## Versioning
- claude-flow-csp version is independent of upstream
- release notes MUST include the upstream Claude Flow commit hash

## Install UX
- npm i -g claude-flow-csp
- claude-flow-csp csp:discover ...
