# Emulator Agent Routing

This file defines repository-wide routing and non-negotiable boundaries only. The detailed development procedure belongs to `.agents/skills/emulator-development/SKILL.md`, and implementation semantics belong to their actual source owner.

## Priority and branch

Current user intent guides bounded work, subject to source authority, safety and available proof. **`Local` is the only active working branch for development and repository verification.** Keep `main` untouched in its initial README-only state. Do not write workflow definitions, product source, generated artifacts, or release changes to `main`, and do not change the default branch or promote `Local` without a new explicit user instruction. Never silently fall back to `main`.

For material writes read `GITHUB_RULES.md`, pin exact `Local` HEAD, and consult `docs/system/implementation-map.md` before broad searching. `CONTEXT.md` holds stable facts; `planning/development.md` holds current continuation. Current source wins if either document is stale.

## Execution and evidence

Use the strongest **actually available** evidence context:

```text
REMOTE_GITHUB → exact-source / static contract review
SOURCE_EXECUTION → actually run Node, Svelte, Rust and Tauri checks
PACKAGE_EXECUTION → actual Windows installer construction/inspection
TARGET_WINDOWS → VMware, guest identity, interactive Windows session
MINECRAFT_RUNTIME → live Education sign-in, gameplay, peer-to-peer network
FOUR_CLIENT_ACCEPTANCE → Native plus three Virtuals concurrently accepted
```

Never promote one rung into another. Absence of runtime or source execution evidence is `NOT_EXECUTED`, not PASS.

GitHub/ChatGPT source work is remote-first. Do not demand the user's PC, a checkout, installs, or running Minecraft just to complete source-verifiable repository work. If an observed machine capability is genuinely needed, record the unresolved evidence instead of guessing.

## ChatGPT-GitHub Work Continuity

**Short-prompt repository startup.** A repository/`Local` URL with "amati", "cek repo", or "ikuti aturan" is a read-only inspection, not permission to change code or start VMware. Fetch the latest `Local` HEAD, read `AGENTS.md` and `GITHUB_RULES.md` fully, and route through `docs/system/implementation-map.md` to the minimum current owner. "Lanjutkan" retains only the identifiable user-approved topic.

**Cross-chat recovery.** Recover by topic and source changes: compare `planning/development.md` with the current exact GitHub HEAD and relevant commit `Work` / `State` / `Proof` / `Unresolved` / `Next`. Historical `Next`, unrelated latest commits, chat titles, memory, and Project settings are not implementation truth or new authorization. Respect `PAUSED`/`BLOCKED` until explicitly resumed; if GitHub cannot be inspected, say the state is unverified. Project Instructions, if used, merely point to current repository rules, not duplicate them.

Development uses ChatGPT + GitHub only. Do not assume or propose another execution environment, ask for a user computer, or make incremental machine tests a prerequisite for source work. Unavailable Windows, VMware, Minecraft sign-in/network and four-client proof stays `NOT_EXECUTED`; continue bounded source work when it has independently justified value.

## Operator routes

| Request | Procedure | Owner / artifact |
| --- | --- | --- |
| Improve or repair product, UI, source, packaging code, repo organization | `SYSTEM DEVELOPMENT` → `.agents/skills/emulator-development/SKILL.md` | `docs/system/implementation-map.md`, existing code |
| Review environment, VM provisioning or guest issues | `DIAGNOSE` | Rust runtime/VMware source + observed evidence |
| Measure or validate Windows/Minecraft runtime | `RUNTIME ACCEPTANCE` | `docs/validation/acceptance.md`, `tooling/acceptance/windows/` |
| Windows package / signing / release | `PACKAGE VERIFICATION` | `engine/distribution/`, Tauri package config; manual gate |

A diagnosis does not automatically authorize code changes or a destructive VM action. No operator mode automatically publishes to `main`.

## Canonical owners

- Backend lifecycle, doctor, version parity, providers, resource policy, Guest Agent protocol: `engine/runtime-core/`.
- Guest Windows preparation/agent install: `engine/guest/windows/`.
- Machine-readable release and installer policy: `engine/distribution/`.
- User-facing UI/typed Tauri bridge/window arrangement: `apps/desktop/`.
- Source verification, optional developer commands and acceptance collectors: `tooling/`.
- Stable architecture and how-to: `docs/`.
- Current work and actual evidence handoff: `planning/`.

No duplicate lifecycle authority, agent/network gateway, credentials store, or parallel setup-complete flag. Do not alter installed app identity, Windows data paths, snapshots, signed-release format, or public wire schemas as an incidental folder rename.

## Completion rule

Identify one owner, trace consumers, make the smallest complete change, evaluate relevant static/regression evidence, record exact SHA and remaining `UNKNOWN`, then STOP. Avoid cosmetic renames and speculative restructuring.
