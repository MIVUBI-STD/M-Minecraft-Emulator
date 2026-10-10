---
id: document.system.development-operations
class: DOCUMENT
domain: system
role: GUIDE
authority: CANONICAL
lifecycle: ACTIVE
---

# Development Operations

## GitHub-first work

The regular ChatGPT developer path is **REMOTE_GITHUB**:

```text
pin Local HEAD
→ AGENTS.md / GITHUB_RULES.md
→ docs/system/implementation-map.md
→ canonical owner / consumers
→ smallest coherent repository change
→ exact-head static verification / evidence classification
→ commit to Local / STOP
```

A user-PC checkout, npm installation, `DEV.cmd`, VMware or Minecraft execution is not required for source-verifiable tasks. Actual compilations, package builds, Windows guest behavior and gameplay must not be claimed without executed evidence.

## Toolchain authority

Read `../../toolchain.json`. Developer/build versions are Node `24.21.0`, npm `11.19.0`, Rust `1.98.1` and PowerShell 7 for the optional Windows command wrapper. Desktop uses its only npm lockfile, `apps/desktop/package-lock.json`; Rust backend uses `engine/runtime-core/Cargo.lock`. The repository root intentionally has **no separate Node dependency graph**.

## Optional source execution

```bash
npm run setup
npm run verify:repository
npm run test
npm run check:desktop
npm run check:runtime
npm run test:runtime
npm run format:runtime
npm run verify:source
npm run dev
```

`verify:repository` is a structural policy/consumer check. Desktop `verify:source` runs Svelte typecheck, Vitest source tests, frontend build, Tauri Rust check and Rust desktop tests; `verify:source` at **root** also checks canonical runtime Rust and formatting. Neither automatically starts VMware or Minecraft.

`DEV.cmd` delegates to `tooling/windows-toolchain/dev.ps1` for optional Windows developer tasks:

```text
DEV.cmd setup
DEV.cmd doctor
DEV.cmd check
DEV.cmd test
DEV.cmd dev
DEV.cmd package
```

`doctor` checks developer toolchain only, not Microsoft licensing, VMware GPU or gameplay readiness.

## Package and release boundary

`npm run package:windows` builds an explicit Windows NSIS package in a suitable build environment; it is not a trusted signed release. Packaging resources come from `engine/guest/windows/`, `tooling/acceptance/windows/` and `engine/distribution/`. Resource destination paths inside the installed application remain stable.

GitHub workflow files in `.github/workflows/` are `workflow_dispatch` only and may be invoked solely when appropriate. They are evidence tools, not a parallel source of readiness state. No push-based CI, unattended release or automatic promotion to `main`.

## Real-machine evidence

Read [Acceptance](../validation/acceptance.md) and [Failure Matrix](../validation/four-client-failure-matrix.md). The privacy-bounded Windows evidence collector lives in `../../tooling/acceptance/windows/collect-acceptance.ps1`. Running the collector does not prove Microsoft sign-in, 3D graphics or multiplayer unless separately observed.

No source edit should be left unfinished merely because real-machine verification is unavailable; mark the exact corresponding claim `NOT_EXECUTED`.
