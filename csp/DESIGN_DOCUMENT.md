# Design Document — Claude Flow CSP (QLIP-Centric CSP Orchestrator)

## 1. Overview

Claude Flow CSP is a **CSP-focused distribution** built on a **fork of Claude Flow**, shipped as a **separate installable CLI**:

- Binary: `claude-flow-csp`
- Purpose: orchestrate **crystal structure prediction workflows** with a strong emphasis on:
  - chemistry-driven plausibility
  - constraint construction
  - QLIP (MILP-based CSP) execution
  - structure/property validation
  - deterministic closed-loop iteration

This project is designed to be **internal-testable** from day one:
- no Anthropic calls required for tests
- no external MCP servers required for tests
- deterministic DRY_RUN produces artifacts and validates wiring

At runtime (non-test), the system integrates with real tools (QLIP, materials data sources, validators) via MCP.

---

## 2. Primary Goal

Transform Claude Flow into a **CSP-specialised orchestrator** for QLIP-style CSP by adding:

1) **CSP workflows** (discovery, iterate, validate, export)
2) **CSP agent presets** (chemistry scout → verifier → iteration controller)
3) **CSP verification preset** (`verify:csp`) with truth scoring
4) A wrapper CLI that exposes a CSP-first UX while still forwarding to base Claude Flow

---

## 3. Product Shape

### 3.1 Fork + Wrapper CLI (Option A)

We base on a **fork** of Claude Flow, but distribute a **new package name** so users install CSP edition cleanly:

- `claude-flow-csp` (wrapper CLI package)
- internal workspace packages under: `v3/@claude-flow-csp/*`

This avoids collisions with upstream while allowing upstream syncing.

### 3.2 Additive Packages

All CSP logic must live in additive packages:

- `@claude-flow-csp/core`
  - config parsing, schemas, iteration policy, artifact writer, tool abstraction
- `@claude-flow-csp/workflows`
  - CSP workflow definitions + orchestration wiring
- `@claude-flow-csp/agents`
  - agent presets (role prompts + expected tool usage)
- `@claude-flow-csp/verify`
  - CSP verification checks + truth scoring + preset registration bundle
- `@claude-flow-csp/cli`
  - wrapper CLI entrypoint that registers CSP bundles and dispatches commands

---

## 4. Minimal Upstream Touch Policy

To keep fork maintenance sane, we only modify upstream Claude Flow in **exactly three places**:

1) Workflow registry (register CSP workflows)
2) Agent registry (register CSP agents)
3) Verification preset registry (register `verify:csp`)

Everything else is additive and should not change upstream behaviour.

---

## 5. Runtime Integration Model (Tooling)

Claude Flow CSP is an **orchestrator**, not the solver.

At runtime it calls tools via MCP (or equivalent abstraction). Expected tool categories:

- `materials-data-mcp`
  - suggest chemistries
  - fetch priors (density, lattice ranges, oxidation states)
  - fetch prototypes / structure archetypes
- `qlip-mcp`
  - build constraints
  - run QLIP (MILP)
  - export and rank candidates
- `csp-validators-mcp`
  - structure sanity checks
  - feasibility checks (distance/density/charge neutrality, etc.)
- `surrogate-eval-mcp` (optional)
  - quick energy ranking or relaxation proxies

The orchestrator expects deterministic, typed JSON IO from tools.

---

## 6. CSP Workflow (Abstract)

The canonical pipeline is:

1) **Chemistry Scout**
   - propose one or more plausible chemistry systems for the objective
2) **Data Hydrator**
   - gather priors: oxidation states, likely prototypes, density/lattice ranges
3) **Constraint Engineer**
   - compile priors + user overrides into a canonical QLIP constraint spec
4) **QLIP Runner**
   - execute QLIP with caching + artifact logging
5) **Verifier**
   - validate candidate structures, compute truth score and failure histogram
6) **Iteration Controller**
   - decide relax/tighten steps deterministically
7) Loop until:
   - acceptable candidate found or max iterations reached

---

## 7. Verification Model (Truth Scoring)

A CSP-specific verification preset (`verify:csp`) produces:

- per-candidate validation report (pass/fail checks + values)
- aggregate truth score in [0, 1]
- recommendation: accept / reject / review
- failure histogram driving deterministic iteration

Required checks (conceptual):
- parseable structure
- minimum interatomic distance compliance
- density within prior bounds
- charge neutrality feasible (oxidation state assignment)
- coordination sanity (soft heuristic)
- symmetry class match (optional)

---

## 8. Deterministic Iteration Policy

Iteration is a first-class feature:
- the system must “learn” by systematically adjusting constraints rather than random guessing

Deterministic rule:
- given the same (seed, config, prior run state, validation summary) the next action is identical

Two primary action families:
- Relax (if infeasible / timeout): widen lattice, relax symmetry, expand oxidation states, increase max atoms, expand prototypes
- Tighten (if invalid): increase min distance scale, narrow density, restrict oxidation states, restrict prototypes

---

## 9. Artifacts Contract

Every run must write auditable artifacts:

`workspace_dir/runs/{run_id}/`
- `run_manifest.json` (inputs, config snapshot, timestamps, status)
- `constraints.json`
- `events.jsonl` (structured logs)
- `candidates/` (structure files)
- `validation/` (reports + summary)
- `exports/` (user-facing exports)

This ensures reproducibility and makes debugging easy.

---

## 10. Internal-Only Testing Strategy (No Anthropic)

All tests must run offline and validate the system wiring:

- `--dry-run` forces an internal StubToolClient
- stubbed tools produce deterministic fake candidates + validation reports
- commands still execute full orchestration logic and write artifacts

Acceptance tests validate:
- CLI runs end-to-end in dry-run
- CSP registries are correctly wired (workflows, agents, verify preset)
- determinism (same seed => identical outputs)

This provides confidence before real tool integration.

---

## 11. User-Facing CLI UX

Core CSP commands:

- `claude-flow-csp csp:discover`
- `claude-flow-csp csp:iterate`
- `claude-flow-csp csp:validate`
- `claude-flow-csp csp:export`

Non-CSP commands are forwarded to base Claude Flow CLI.

All CSP commands output **strict JSON** (machine-readable, pipeline-friendly).

---

## 12. Future Extensions (Non-Blocking)

Once the base system is stable:
- integrate real MCP servers
- integrate surrogate ranking (CHGNet/MACE/EDDP/OMLT)
- add “property-driven discovery” routines (screening objectives)
- add persistence integrations (DB for runs, experiment tracking)
- allow optional LLM calls for chemistry ideation (kept outside test mode)

---

## 13. Success Criteria

The system is “working” when:
1) `claude-flow-csp csp:discover --dry-run` completes and writes valid artifacts
2) workflow/agent/verify registrations appear in lists
3) determinism tests pass
4) swapping StubToolClient for real MCP calls is a config change, not a rewrite
