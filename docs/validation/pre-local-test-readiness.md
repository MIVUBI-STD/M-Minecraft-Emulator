---
id: document.validation.pre-local-test-readiness
class: DOCUMENT
domain: validation
role: PROCEDURE
authority: CANONICAL
lifecycle: ACTIVE
---

# G0 — Source & Package Integrity

This document describes the **four mandatory checks within G0**, not four extra product gates. The five and only five product-testing gates are defined in [Acceptance G0–G4](./acceptance.md). Existing `Local` workflows and build scripts remain unchanged.

## Exact-SHA G0 checks

| Check within G0 | Required executed evidence | Current status |
| --- | --- | --- |
| **Source integrity** | `npm run verify:source` on one pinned `Local` SHA: repository invariants, Node/Svelte/Vitest, Tauri Rust checks/tests, runtime Rust checks/tests/fmt, and guest feasibility evaluator | NOT_EXECUTED |
| **Windows package construction** | Successful `npm run package:windows`; actual NSIS output, build result, target identity and installer hash tied to that SHA | NOT_EXECUTED |
| **Installed payload completeness** | Inspect all mandatory items in `engine/distribution/package-contract.json`, including host CLI, guest Agent, Base setup/finalization scripts and single-guest evidence collector | NOT_EXECUTED |
| **Disposable installation safety** | Observe install/repair/uninstall/reinstall preserving `M-Bedrock/VirtualClients` guest/account data; no unexpected downgrade or untrusted updater behavior | NOT_EXECUTED |

**G0 PASS requires all four checks to have real positive evidence for the same revision.** A GitHub commit, authored unit test, static repository check, or absence of reported CI failure does not satisfy any unexecuted check. One failure is diagnosed in the first causal owner and G0 is re-evaluated on the corrected SHA. Do not count checks as G1–G4; those names are reserved for gameplay and lifecycle outcomes.

## Development boundary

ChatGPT + GitHub `Local` is the available source-work mode. Workflow definitions are `workflow_dispatch` only and are not dispatchable with `main` kept README-only. Do **not** edit `main`, change the default branch, activate automatic CI, assume another execution service, or ask the user to perform incremental machine tests.

When executable evidence is unavailable, **G0 stays `NOT_EXECUTED`**. This is neither a build failure nor permission to mark G1–G4 as passed. Source-level engineering can continue only for a grounded defect and must keep its proof ceiling explicit.

## Subsequent gates, when real evidence exists

G1's first real gameplay question is a *disposable account-clean Windows VMware guest*, not three production clones. Observe Windows desktop boot and VMware Tools, install one legitimate Minecraft Education Windows variant, sign in with a properly licensed organization account, and interact with a rendered world for the documented initial observation period. The [Single Guest Feasibility](./client-feasibility.md) procedure and its existing collector separate operator statements from measured graphics/process facts. A G1 failure stops escalation to G2; no premature account-bearing cloning.

G2 tests Base-to-three-guest identity and provenance; G3 tests four simultaneous independently usable accounts; G4 tests recovery and required multiplayer paths. Their detailed assertions remain in [Acceptance](./acceptance.md), with existing scenario coverage in [Failure Matrix](./four-client-failure-matrix.md).

## Evidence handoff

Record the pinned GitHub SHA, command/environment **only if actually executed**, exit result, installer hash and inspected payload when applicable, and unresolved proof in `planning/development.md`. Do not create a new gate database, runner, auto-generated PASS, or duplicate readiness flag.

### One-batch local G0 preparation (Windows, optional)

`DEV.cmd` is an optional developer convenience; it never starts or modifies a VMware guest. Use only a checkout of branch `Local` on a Windows x64 machine with PowerShell 7+, Node/npm and Cargo matching `toolchain.json`:

```powershell
.\DEV.cmd lock    # only while the desktop Cargo.lock is missing; performs real Cargo registry resolution
```

Review the generated `apps/desktop/src-tauri/Cargo.lock`, then commit and push it to `Local`. Do **not** manually construct or copy another application's lockfile. Once that committed lockfile is present in a clean `Local` checkout, the following single batch runs the pinned toolchain check, npm `ci`, exact-revision source checks, and an unsigned Windows NSIS build:

```powershell
.\DEV.cmd g0
```

The pinned-language check is **not** a full Windows packaging prerequisite probe. Before `g0`, Windows must have the Tauri-required MSVC C++ build toolchain, Windows SDK and WebView2 availability as appropriate to the installation mode. Missing system prerequisites should be diagnosed as G0 environment blockers, not patched around by weakening source contracts.

`g0` explicitly rejects untracked Cargo.lock, dirty source, wrong branch, toolchain mismatch and a changed HEAD. Successful commands cover only the source/build/package-construction portion of G0. A real installer/payload inspection and **disposable** install, repair, uninstall and reinstall preserving runtime data remain independent requirements. A successful console message never establishes G0 PASS or Minecraft/GPU/client readiness. Never conduct first acceptance using account-bearing VM disks.

Neither command changes `main`, installs guest agents, starts VMs, resets snapshots, signs into Minecraft, or commits on the user's behalf.

### Known source integrity limitation — desktop Rust lockfile

The backend already tracks `engine/runtime-core/Cargo.lock`. The package binary preparation script now builds the host CLI and Guest Agent with Cargo `--locked` and validates each required packaged source file against a concrete Tauri resource mapping before compilation (except the Guest Agent executable generated by that same script).

**However, `apps/desktop/src-tauri/Cargo.lock` is not tracked in this repository.** Cargo must actually resolve this desktop manifest and generate the complete, valid lockfile; it must then be reviewed and committed to `Local`. No dependency list, checksum or version is to be fabricated. Official Tauri guidance recommends committing an application lockfile, and Cargo's `--locked` correctly rejects a missing or stale one.

To avoid a misleading green G0, the **aggregate** `npm run verify:source` now invokes the existing repository verifier in `--g0` mode and refuses to advance to compilation without the tracked Tauri lockfile. Standalone `npm run verify:repository` still performs ordinary structural review without requiring executable-readiness prerequisites. Existing Tauri Rust check/test commands use `--locked`; the Tauri build forwards `--locked` to its Cargo runner, and package staging also refuses an absent lockfile before costly compilation. This is intentional **fail-closed G0 readiness**, not a completed lockfile or passing test.

The necessary future resolution action is `cargo generate-lockfile --manifest-path apps/desktop/src-tauri/Cargo.toml` **only when genuine Cargo dependency resolution is available**. Do not use a manually assembled or another project's lockfile. This ChatGPT + GitHub source context could not execute Cargo or access a crate registry, so the lockfile remains absent and G0 remains `NOT_EXECUTED`.

**Current G0: NOT_EXECUTED.** The product is not yet accepted for executable-source, package, Windows guest or Minecraft runtime behavior; lack of execution evidence is not a claim of failure.
