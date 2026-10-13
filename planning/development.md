# Current Development Handoff

**Repository/branch:** `MIVUBI-STD/M-Minecraft-Emulator` / `Local` only.
**Current work:** `emulator/pre-local-cleanup`; active **Minecraft Instance Manager** native + Sandboxie feasibility pilot.
**Execution ceiling:** exact-HEAD Node/Svelte/Rust/PowerShell tests, Windows binary, Sandboxie session and Minecraft gameplay are **NOT_EXECUTED**. A committed regression is not an executed PASS.

## Windows preflight assertion correction (2026-10-13)

The subsequent exact-SHA Windows preflight at
`83e1a978c3d9d920bf4331a5d1a75537f9f77fd6` passed desktop and runtime
checks/tests and frontend build, then failed at runtime `cargo fmt --check`.
Applied Rust 1.98.1 rustfmt to the two reported runtime files (`command.rs`
and `provider/process.rs`); only formatter layout and trailing commas changed.
Next: execute clean-commit `DEV.cmd preflight` on the formatting correction.

Actual Windows preflight at `9da075fd6b89d9c5ca8dac0b6461a366913c0998`
failed in desktop Vitest because the collector stdin guard searched the entire
native engine, including the separate launch script. The guard now checks only
`inspect_sandbox_client_02_mode`, including its stdin runner, payload and bootstrap.
All 85 desktop tests passed on Windows with Node 24.21.0 / npm 11.19.0 after
the correction. npm uses a session-only prefix; global tools were not replaced.
The prior ignored preflight manifest records FAIL, not PASS. Full clean-commit
preflight, Rust/Tauri builds, UI and Minecraft remain unproven for this correction.
Next: run `DEV.cmd preflight` on the committed corrected Local revision.

## Selected product scope

- **Goal:** four independent, licensed, concurrently playable Windows Minecraft Education clients on one PC.
- **Only active experiment:** official native Client 01 + a manually requested Client 02 in one persistent Sandboxie Plus box named `MinecraftClient02`. Client 03–04 and the eventual four-client provider choice are unproven and **not implemented** here.
- **Never automate:** Microsoft account credentials/tokens, sandbox deletion, guest disk reset, launching another client after an ambiguous result, runtime polling, or VMware guest mutation.
- **Legacy preserved:** old VMware/Fusion/App Sandbox/Guest Agent and installed NSIS identifier/data contracts are inactive; packaging the native UI using old VMware resources is deliberately blocked. Inactive Tauri VMware IPC/setup/layout module declarations are excluded from native desktop compilation while source remains in Git.

## Canonical first owners

| Responsibility | Source |
| --- | --- |
| Active UI / manual actions | `apps/desktop/src/NativeFeasibilityApp.svelte` |
| Native commands, launch checks and Windows HWND actions | `apps/desktop/src-tauri/src/engine/native_clients.rs` |
| Typed IPC validation | `apps/desktop/src/app/bridge/nativeFeasibilityApi.ts` |
| Read-only Sandboxie inspection, credential-setting flags and PID evidence | `tooling/acceptance/windows/collect-sandboxie-feasibility.ps1` |
| Shared subprocess runner and I/O worker lifetime | `engine/runtime-core/src/provider/process.rs` |
| Existing product proof boundaries and local operator path | `docs/validation/native-pilot-localtest.md` and `docs/validation/sandboxie-two-client-feasibility.md` |
| Legacy removals and compatibility | `docs/system/legacy-retirement.md` |
| Product/package version and manual source verification | `package.json`, `toolchain.json`, `tooling/windows-toolchain/dev.ps1` |

Use [implementation ownership](../docs/system/implementation-map.md) for older VM-related routes.

## Current source-hardening state

- Launch is explicit, serialized inside the app and re-inspects selected Sandboxie box membership; `UNKNOWN` fails closed. Signed image / PID / FILETIME / HWND values remain **candidate evidence**, never proof of session, account or Minecraft rendering.
- Collector reconciles full boxed PID enumeration (including helper processes), refuses incomplete/foreign-session or unstable snapshots, and bounds stdout. Vendor SbieDll fallback remains short-lived and version/ABI unproven.
- Native backend calls Windows PowerShell from an absolute system directory, rather than searching PATH; native candidate enumeration no longer converts failed discovery to zero candidates.
- Shared helper runner bounds stdin, output (64 KiB per stream), worker reservations (24 maximum), timeouts and direct-child cleanup; oversized output stops further reads, and failed thread creation returns an error rather than panicking.
- **Unresolved:** short-output descendants can retain inherited stdout/stderr handles, leaving a previously blocked reader alive. Cooperative overflow checks do not interrupt a kernel-level blocked read. No claim of complete worker reclamation without an executable inherited-handle reproducer.

The historical source-hardening history, evidence qualifications and per-batch details are retained in [pre-compaction development handoff](https://github.com/MIVUBI-STD/M-Minecraft-Emulator/blob/38aafe6817814b3f25e202d6ff8140d8be5b595f/planning/development.md) and the [REA-aligned baseline](../docs/validation/rea-source-audit-2026-10-13.md). Treat those as pinned history, **not** the present HEAD acceptance verdict.

## Local-test verifier and compiled desktop cleanup (2026-10-13)

Found a real test-contract mismatch: `apps/desktop/test/verification-routing.test.ts`
still expected the old `verify:source` command list after `test:localtest` was
added. Corrected the expected route so a source check no longer fails solely
because the test itself is stale. Hardened the single local-test recorder with
exclusive finalization, source-folder identity checks and adversarial
regressions. The screen-overlay implementation remains preserved as source,
but has been removed from the native pilot's compile graph since no active
command invoked it. No VM, guest or account data was touched.

The six focused recorder tests were executed and passed with Node 22.16.0
in an isolated Linux copy of the affected module. Exact repository HEAD,
Windows PowerShell, Node 24, Tauri/Rust compilation, Minecraft and Sandboxie
remain NOT_EXECUTED. Continue on source evidence only until target verification.

## Local-test recording and application ownership (2026-10-13)

`tooling/local-test/session.mjs` now provides one metadata-only
exact-SHA source-preflight record under ignored `workspace/runs/` after
validating the pinned Windows toolchain. `DEV.cmd preflight` finalizes
the attempted source check as PASS/FAIL without raw terminal logs.
The source verifier requires the recorder regressions and launcher wiring.
The active UI root diagnostic was renamed for clarity; no other native
process or IPC behavior was intentionally changed. Pure Node recorder
tests passed in a separate analysis environment. Pinned Windows PowerShell,
Tauri, Sandboxie and Minecraft execution remain NOT_EXECUTED.

## Local test storage governance (source policy, not runtime proof)

The canonical [Artifact and Local-Test Storage Policy](../docs/system/artifact-storage.md) now classifies downloaded prerequisites, package candidates, compiler output and per-session evidence. `workspace/` is Git-ignored except its README; the existing verifier enforces that boundary. Build output and historical runtime/evidence paths were **not moved or deleted**, and the native pilot's old NSIS release hold remains intact. This is a source-policy update: node/Rust/Windows/installer/Minecraft/REA execution is **NOT_EXECUTED**.

## Pre-local-test cleanup decision

The single current developer entrypoint is **`DEV.cmd preflight`**, which reuses existing clean-`Local` checkout and pinned toolchain checks, runs locked dependency setup and root source verification, then rechecks exact HEAD. The old VMware G0–G4 campaign is historical and must not be confused with this native source preflight. No installer, game, VM or account data is accessed. Fail on the first real error and preserve its command/log; do not weaken checks to report PASS. Manual gameplay starts separately with `DEV.cmd dev` only after preflight passes.

Inactive Tauri VMware command and layout modules were excluded from the active desktop Rust module tree after checking there were no native callers. No speculative deletion of their source, existing account-bearing data, or legacy runtime-core/provider code is authorized: those remain connected to backward compatibility and installed-data safety policy. Removing it requires a proven two-client direction, dependency inventory and a reversible migration decision. Source-only dead-code scans are suggestions, not proof of safe deletion.

## Material unresolved risks (priority order)

1. **P0 — exact HEAD build verification:** `DEV.cmd preflight` is authored but not Windows-executed; Rust/Tauri/Svelte compatibility must be demonstrated. Non-Windows/source-only static findings cannot establish Windows PASS.
2. **P0 — two authenticated clients:** Windows Desktop and Sandboxie must really create two independently signed-in licensed sessions with distinct playable worlds and stable input/rendering. Sandboxie `OpenCredentials=OFF` does not prove Microsoft WAM isolation.
3. **P1 — helper/process behavior:** inherited pipe handles, out-of-band game starts and PID/window churn remain runtime races. Never infer successful gameplay from helper exit status.
4. **P1 — vendor/environment compatibility:** Sandboxie Start.exe/SbieIni.exe/SbieDll versions/metadata, custom Minecraft APPDIR, localized Start Menu names, Windows signed-file inspection and focus restrictions have no runtime proof.
5. **P1 — resource and persistence evidence:** no reproducible 60-minute CPU/RAM/GPU/VRAM profile, restart persistence, cross-account test or multiplayer evidence on target hardware.
6. **P1 — release path:** an isolated native prototype installer, package manifest, coexistence, upgrades and uninstall preservation are not approved; the old VMware NSIS release hold remains.
7. **P2 — legacy reduction:** after feasibility, measure dependency graph and trace reachability; retire legacy files in reviewable, reversible commits without deleting VMs/worlds or installed identity.

## First Windows session (source-prepared, NOT_EXECUTED)

The native `DEV.cmd preflight` now shows four stages, checks Windows 10/11 x64 explicitly before running external source tasks, and prints one next developer-mode command. The localtest guide provides official prerequisite links, a clean-`Local` clone path, a short staged smoke test, and a minimal redacted first-error report. These changes are source-authored and are **not** proof of successful Windows compilation or two licensed Minecraft sessions.

## Stop rule and next action

**Source cleanup complete does not mean product acceptance.** The next necessary evidence is exact-SHA `DEV.cmd preflight` execution on the supported Windows toolchain, with first failing command and tool versions recorded, followed by the ordered [two-client manual procedure](../docs/validation/native-pilot-localtest.md) only after source checks pass. Do not run `DEV.cmd g0` or `npm run package:windows` for this pilot.

The present branch remains `Local`; never change `main`, workflow activation, installed app identifiers, guest data, or public IPC/schema as an incidental cleanup.
