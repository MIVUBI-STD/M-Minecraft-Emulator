# Current Development Handoff

**Repository/branch:** `MIVUBI-STD/M-Minecraft-Emulator` / `Local` only.
**Current work:** `emulator/pre-local-cleanup`; **PAUSED at user request on 2026-10-13**. User will continue repository discussion in ChatGPT; do not resume local runtime tests without explicit instruction.
**Execution ceiling:** Windows source preflight **PASS** at `e6e9ad22625cf0c5928ee6cf5ee6efb2e503e598`; developer binary/window observed; Refresh confirmation observed in user-supplied screenshot. Sandboxie membership, account isolation, Minecraft gameplay, package and four-client acceptance remain **NOT_EXECUTED / UNKNOWN**. Later documentation commits do not inherit exact-HEAD execution PASS.

## Compact Manager clean UI revision v2 — 2026-10-13

- **User requirement:** concise, clear, familiar wording and clean everyday application; no tester/developer dashboard on the user-facing home.
- **Latest design source:** `docs/product/compact-manager-screen-design.md`, section `Design revision v2 — concise Indonesian-first UI` (supersedes conflicting earlier visual/copy recommendations).
- **Standalone design artifact:** `compact-manager-clean-v2.html` with browser screenshots, delivered in the ChatGPT conversation; NOT a production Tauri build or GitHub app.
- **Design labels:** Minecraft / Tata Jendela / Pengaturan / Bantuan. Primary actions Buka / Periksa / Siapkan / Tampilkan. No duplicate headings, counters, technical instructions or future-instance roadmap cards on home.
- **Actual browser checks:** prototype JavaScript interactions and screenshots at 1180×760 and current 920×620 Tauri minimum, no horizontal overflow or page JS errors. This does NOT prove native IPC, Windows behavior or Minecraft sessions.
- **Next:** review visual/copy, then implement one Svelte shell and safe capability projection; local Windows/runtime test stays PAUSED until separately approved.

## Compact Manager UI design continuation — 2026-10-13

- **Work type:** design-only; no Tauri/Svelte/Rust UI implementation, no local Windows testing resumed.
- **Product decision:** everyday **Compact Manager**, **not** a testing dashboard. Three main destinations: Instances, Window Layout, Settings; contextual Help & Diagnostics; no Local Test navigation.
- **Design contracts:** [Compact Manager UX Specification](../docs/product/compact-manager-ux-spec.md) and [Clean Compact Screen Design](../docs/product/compact-manager-screen-design.md). Both are `DRAFT`, not running code or validation evidence.
- **Visual proof:** an offline standalone HTML/CSS/JS clickable prototype and browser-rendered screen captures were produced in the design conversation; no Tauri IPC, game process or sandbox interaction. The repository holds canonical UX decisions; the standalone prototype was delivered as a conversation artifact, not installed into the product.
- **Reviewed screens:** Instances rows and UNKNOWN-safe primary actions, contextual per-instance details, 3-step isolated setup, Client 02 Left/Right placement preview, grouped Settings, Help/Error states. Existing Tauri minimum window is 920×620, default 1180×760; design review must respect those dimensions.
- **Executed checks:** offline browser prototype smoke interactions only; do **not** interpret as actual app/build source verification or Minecraft success.
- **Next approved discussion:** visual review and refine wording, density, accessibility, future language choices; after design approval implement frontend in batches with one active app shell while preserving native security/IPC boundaries. Localtest remains **PAUSED** unless the user explicitly resumes it.

## Paused localtest report — 2026-10-13

- **Tested source:** GitHub `Local` / `e6e9ad22625cf0c5928ee6cf5ee6efb2e503e598`.
- **Environment observed:** Windows x64 (build 26100), PowerShell 7.6.5,
  Node 24.21.0, npm 11.19.0, Rust 1.98.1 MSVC with rustfmt; MSVC Build Tools
  and WebView2 found. Node and npm prefix were isolated to the test session;
  existing global installations were preserved.
- **Executed source result:** `DEV.cmd preflight` PASS, 2026-10-13
  07:19:35–07:19:51 UTC. Repository checks, evaluator tests, all 85 desktop
  Vitest tests, Svelte/TypeScript, frontend build, Tauri and runtime checks/tests,
  runtime rustfmt check completed. One local-test symlink test skipped because
  Windows symlink privilege was unavailable; existing compiler/CSS warnings remain.
- **Executed startup result:** `DEV.cmd dev` compiled and launched
  `Minecraft Instance Manager`; Windows reported a responsive window.
  Prior Vite EBUSY on a locked Rust PDB did not reproduce after excluding
  `src-tauri/target` from its watcher.
- **Operator evidence:** user clicked Refresh and supplied a cropped screenshot
  showing “Process observations refreshed. No accounts or worlds were inspected.”
  This confirms the visible Refresh completion message only. The screenshot
  did not include Client 02/Sandboxie readiness, membership or process results.
- **Remaining unknowns:** no Minecraft Education Desktop or Sandboxie installation
  was found in the limited installed-program/service inspection. This is not an
  exhaustive absence verdict. Two distinct licensed sessions, playable worlds,
  multiplayer, restart persistence and four-client usability are untested.
- **Local evidence:** metadata-only PASS manifest is retained in ignored
  `workspace/runs/20261013T071935Z-e6e9ad22-preflight-99ec7528/manifest.json`;
  startup observations are adjacent. Raw logs, screenshot and machine/account
  data are not uploaded to Git. Earlier FAIL manifests remain local.
- **Pause action:** the development process started by this session was stopped;
  no game, sandbox, account data or VM was changed by the pause.
- **ChatGPT continuation:** read this handoff and exact current `Local` source.
  Repository discussion may continue, but localtest remains PAUSED. After an
  explicit resume, inspect the full Client 02/Sandboxie readiness panel before
  proceeding with the existing two-client manual procedure. Do not repeat source
  checks merely to manufacture progress, or promote source/window proof into gameplay.

## Historical preflight corrections (2026-10-13; superseded by report above)

Exact Windows source preflight passed at
`070323474d0b7a4b9dd0a4966cd6750707f09601` (one symlink test skipped for
missing Windows privilege). Developer startup then failed when Vite watched
a locked Rust build PDB under `src-tauri/target`. The Vite watcher now ignores
that generated output tree; frontend source watching remains active.
Next: clean-commit preflight and developer startup on this correction.
Minecraft, Sandboxie and interactive UI acceptance remain NOT_EXECUTED.

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

1. **Source verification:** Windows `DEV.cmd preflight` passed at `e6e9ad22625cf0c5928ee6cf5ee6efb2e503e598`; later source revisions require their own evidence when execution is resumed. This does not establish gameplay or installer compatibility.
2. **P0 — two authenticated clients:** Windows Desktop and Sandboxie must really create two independently signed-in licensed sessions with distinct playable worlds and stable input/rendering. Sandboxie `OpenCredentials=OFF` does not prove Microsoft WAM isolation.
3. **P1 — helper/process behavior:** inherited pipe handles, out-of-band game starts and PID/window churn remain runtime races. Never infer successful gameplay from helper exit status.
4. **P1 — vendor/environment compatibility:** Sandboxie Start.exe/SbieIni.exe/SbieDll versions/metadata, custom Minecraft APPDIR, localized Start Menu names, Windows signed-file inspection and focus restrictions have no runtime proof.
5. **P1 — resource and persistence evidence:** no reproducible 60-minute CPU/RAM/GPU/VRAM profile, restart persistence, cross-account test or multiplayer evidence on target hardware.
6. **P1 — release path:** an isolated native prototype installer, package manifest, coexistence, upgrades and uninstall preservation are not approved; the old VMware NSIS release hold remains.
7. **P2 — legacy reduction:** after feasibility, measure dependency graph and trace reachability; retire legacy files in reviewable, reversible commits without deleting VMs/worlds or installed identity.

## Historical first-session preparation (superseded by report above)

The native `DEV.cmd preflight` now shows four stages, checks Windows 10/11 x64 explicitly before running external source tasks, and prints one next developer-mode command. The localtest guide provides official prerequisite links, a clean-`Local` clone path, a short staged smoke test, and a minimal redacted first-error report. These changes are source-authored and are **not** proof of successful Windows compilation or two licensed Minecraft sessions.

## Stop rule and next action

**PAUSED by user.** Source preflight and developer startup are recorded above for
their exact tested SHA. Do not resume runtime testing automatically from any
historical Next entry. Once explicitly resumed, obtain the complete Client 02
readiness observation and follow the [two-client manual procedure](../docs/validation/native-pilot-localtest.md).
Do not run `DEV.cmd g0` or `npm run package:windows` for this pilot.

The present branch remains `Local`; never change `main`, workflow activation, installed app identifiers, guest data, or public IPC/schema as an incidental cleanup.
