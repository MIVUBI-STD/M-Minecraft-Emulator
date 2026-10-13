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

`DEV.cmd` delegates to `tooling/windows-toolchain/dev.ps1` for optional Windows developer tasks. The selected native pilot uses one fail-fast preflight before manual gameplay; the old `g0` packaging route remains separate:

```text
DEV.cmd setup
DEV.cmd doctor
DEV.cmd preflight
DEV.cmd check
DEV.cmd test
DEV.cmd dev
DEV.cmd package
```

`doctor` checks developer toolchain only. `preflight` checks a clean committed `Local` SHA, installed tool versions and committed lockfiles, performs `npm run setup` and `npm run verify:source`, then confirms the checkout remains unchanged. It does **not** test Microsoft licensing, Sandboxie, Windows gameplay, VM state or installer preservation.

## Package and release boundary

`npm run package:windows` is **intentionally blocked** in the active native feasibility pilot: the old NSIS configuration still carries VMware resources and installed identity. Its retained source describes historical packaging only, not an installable native prototype. Do not bypass this release hold to obtain a local-test installer. A future approved native package needs separate identity, contents and preservation review. Packaging resources come from `engine/guest/windows/`, `tooling/acceptance/windows/` and `engine/distribution/`. Resource destination paths inside the installed application remain stable.

GitHub workflow files in `.github/workflows/` are `workflow_dispatch` only and may be invoked solely when appropriate. They are evidence tools, not a parallel source of readiness state. No push-based CI, unattended release or automatic promotion to `main`.

### Manual workflow activation on this repository

GitHub requires a `workflow_dispatch` workflow file to exist on the repository's **default branch** before it can be manually triggered. Currently `main` is the default and contains no workflow files; only `Local` has `verify.yml` and `package-smoke.yml`. Their YAML being syntactically present in `Local` therefore **does not mean the Actions UI or API can run them yet**. See [GitHub's manual-run requirement](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

**Current decision (2026-10-11): source development is ChatGPT + GitHub only, on `Local`; leave `main` unchanged.** Do not bootstrap workflows on `main`, switch the default branch, promote source to activate Actions, create a new CI trigger, or require another execution environment. Existing `Local` workflow YAML is a source definition, **not runnable CI evidence** under the current branch policy. Carry out source-verifiable edits and exact-head static review with the available GitHub tooling. Mark all unexecuted compilation, packaging, VMware, and Minecraft acceptance as `NOT_EXECUTED`; do not transfer incremental validation work to a user's computer.

## Single guest renderer compatibility pilot

Before registering/finalizing a production Base, read [Client Feasibility](../validation/client-feasibility.md). The Windows guest collector is in `../../tooling/acceptance/windows/collect-client-feasibility.ps1`; it inspects a real interactive guest's video adapter/OpenGL context and captures separately attributed manual Minecraft menu, scene and input observations. The pure reviewer (`npm run feasibility:review -- <path-to-report.json>`) and its `npm run test:feasibility` regression tests do **not** launch Minecraft or assert official VM-client support.

Source-only changes may be completed on GitHub `Local`, but guest graphics and gameplay remain `NOT_EXECUTED` without real machine evidence. Avoid asking for local PC access to close GitHub-only work. No changes to `main`.

## Real-machine evidence

Read [Acceptance](../validation/acceptance.md) and [Failure Matrix](../validation/four-client-failure-matrix.md). The privacy-bounded Windows evidence collector lives in `../../tooling/acceptance/windows/collect-acceptance.ps1`. Running the collector does not prove Microsoft sign-in, 3D graphics or multiplayer unless separately observed.

No source edit should be left unfinished merely because real-machine verification is unavailable; mark the exact corresponding claim `NOT_EXECUTED`.
