# GitHub Rules — M-Minecraft-Emulator

Canonical GitHub delivery and proof policy. **Development authority: `Local`; release authority: `main`.**

## Operating sequence

```text
PIN → EXECUTION CONTEXT → READ MINIMUM → DIAGNOSE OWNER
→ BOUNDED CHANGE → VERIFY → COMMIT/HANDOFF → STOP
```

## 1. PIN

Before mutation, establish repository, branch `Local`, HEAD SHA, first semantic owner, current file/blob authority and the write permission. Recheck HEAD before moving a ref. Never silently target `main`, overwrite a concurrent change or trust search/history over current source.

## 2. Execution context and proof ceiling

- `REMOTE_GITHUB` — code review, ownership analysis, Git trees, static policy/consumer checks and source commits. Default ChatGPT context.
- `SOURCE_EXECUTION` — actually executed typecheck, tests, Rust build/format and desktop bundle checks.
- `PACKAGE_EXECUTION` — actual NSIS build, installed payload integrity, install/repair/uninstall test.
- `TARGET_WINDOWS` — actual host and VMware/Windows guest session observations.
- `MINECRAFT_RUNTIME` — actual Education login, graphics and multiplayer.
- `FOUR_CLIENT_ACCEPTANCE` — one Native and three Virtual clients meet the acceptance matrix simultaneously.

A static test **authored** is not a test **executed**. A VM process is not game-ready, signed-in, or network-ready proof. Multiple SHAs cannot be combined as exact-head acceptance.

## 3. Read minimum

Default work starts with `AGENTS.md` → [Implementation Map](docs/system/implementation-map.md) → one source owner and consumers. Read more only to answer a concrete unresolved question. Relevant source authority outranks stale planning/prose.

## 4. Diagnose the first wrong owner

```text
VM lifecycle / version / identity wrong    → engine/runtime-core
Guest agent/Windows setup wrong            → engine/guest or engine/runtime-core guest protocol
Desktop flow/window wrong                  → apps/desktop
Installer/update trust wrong               → engine/distribution + Tauri package consumer
Source verifier or optional CLI wrong      → tooling
Docs navigation/wording wrong              → docs or root router
Missing provider/Windows/Minecraft proof   → actual acceptance evidence, not imaginary source code
```

Avoid second managers, inconsistent API aliases, undocumented state caches, or redundant root files.

## 5. GitHub-first and no-user-PC boundary

Complete all source/static work directly in GitHub when possible. `Local` names a **GitHub branch**, not a physical PC. `npm`, `DEV.cmd`, source tests and local VMware are optional stronger-proof contexts, not gates placed on user workstations to complete ChatGPT repository edits. Keep truly unresolved runtime requirements `NOT_EXECUTED`.

## 6. Mutations, compatibility and commit discipline

Update canonical owner plus necessary callers/tests/docs in a coherent logical commit. Prefer correcting an existing owner over creating another abstraction. Preserve each Virtual's account-bearing disks and snapshots; reprovision is explicitly destructive and must not be a side effect of routine setup. Release/update identity, Guest Agent wire contract, installed product identifier and disk paths require an explicit migration review, not a source-folder tidy-up.

Use categorized commits (`refactor(repo): ...`, `fix(runtime): ...`, `test(desktop): ...`, `docs(system): ...`). Record continuity at significant milestones in `planning/development.md`. Git history preserves old source naming; do not leave obsolete code mirrors just for traceability.

## 7. Verification and CI

Use the cheapest decisive evidence: exact-ref static path/contract review → targeted source test → full source check only when needed → manual package smoke → Windows/VMware acceptance → real Minecraft Education acceptance.

GitHub Actions must remain `workflow_dispatch` only, with read-only default permissions and explicit user authorization to run. No push, pull_request, cron, auto-release or remote secret usage for routine source work. Changes to workflow YAML are not claims that jobs passed.

## 8. Security

No VM images, Microsoft credentials, OAuth tokens, machine-identity raw values, Guest Agent secrets, account-bearing snapshots, private worlds or signing material in Git history. Privileged Guest Agent operations stay fixed and authenticated; ambiguous provider mutations fail closed. The installer must not silently delete runtime data.

## 9. Failure policy

On an unresolved change or failing proof: preserve last good source, identify first wrong owner, report exact failing claim and environment. Do not bypass checks, weaken security gates, fabricate successful runs or modify tests solely to make an incorrect implementation appear valid.

## 10. STOP

After the requested bounded repository outcome: confirm the exact `Local` commit, source change scope, applicable static checks, genuinely executed checks (if any), and remaining higher-context evidence. Stop rather than expanding into speculative feature work.
