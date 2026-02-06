
# Claude Flow CSP (CSP Edition)

This is a fork of Claude Flow with an additional distributable package:
- **claude-flow-csp**: a wrapper CLI + CSP extensions (workflows, agents, verification presets).

Design principles:
1) Keep upstream Claude Flow logic intact.
2) Add CSP features as additive packages (namespaced under @claude-flow-csp/*).
3) Only make small, clearly scoped edits to Claude Flow registries (workflows/agents/verify presets).

This is **not** a separate domain-pack repo — it is a fork with a new product built on top.
