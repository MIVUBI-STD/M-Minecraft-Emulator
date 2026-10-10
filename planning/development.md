# Emulator Development Handoff

Updated: 2026-10-10
Authority: `MIVUBI-STD/M-Minecraft-Emulator`, branch `Local`. Current GitHub source HEAD always outranks this file.

## Pre-local-test source readiness audit — 2026-10-10

**Status: SOURCE_REVIEWED / BUILD_UNPROVEN; PRE_LOCAL_READY = NO.** Only the `Local` branch is authorized; `main` stays README-only. User requires completing all source and package preparation gates before first target-PC test, not repeated ad hoc local tests.

**Second concrete cross-contract defect:** `register_base_inner` and `wait_for_guest_compatibility` previously accepted Guest Agent status protocol v1, while `profile.rs` and `minecraft_runtime.rs` already required launch protocol v2 for usable Minecraft Education startup. This could register a Base that cannot pass daily launcher checks, or allow a guest startup to pass readiness but fail late when launching the game. Source patch requires launch-compatible protocol before registration/commit and before daily guest acceptance, with a Rust regression test. Test execution still pending.

**Observed correctness issue:** Official Minecraft Education Windows installer documents its Desktop detection registry key as **32-bit application on 64-bit Windows**. Rust native detection already uses `reg query ... /reg:32`, but `engine/guest/windows/prepare-base.ps1` used the implicit PowerShell registry view. Fix it via `RegistryView.Registry32`, constrain the managed Base installer to the official Windows Desktop .exe, and add source contract regression. Reference: https://edusupport.minecraft.net/hc/en-us/articles/13106858087956-Windows-Installation-Guide .

**Package readiness:** Register `acceptance/windows/collect-client-feasibility.ps1` among machine-readable mandatory installed files (Tauri already maps the full acceptance folder), so an installer missing the one-guest proof collector cannot be called complete.

**Canonical readiness gate:** [Pre-Local-Test Readiness](../docs/validation/pre-local-test-readiness.md); see mandatory G1–G4 and explicit STOP rules.

**Static preflight observations on candidate source tree:** package contract has 16 mandatory files, 16/16 covered by source or generated binary mapping, including the new one-guest collector; 31 direct TypeScript test file references and Rust embedded-file references examined without missing tracked paths. The isolated V8 execution of the exact evaluator function exercised 10 result cases and rejected 5 malformed inputs, but this is **NOT** pinned Node 24, Vitest or Windows executable proof.

**Stop before first PC acceptance until:** locked desktop typecheck/Vitest/frontend build; Rust runtime + Tauri checks/tests/fmt; real Windows NSIS package-build/package smoke (including guest-agent and all mandatory payloads); installer identity/safety and target acceptance scripts are **actually executed successfully on exact same Local SHA** in a suitable independent execution environment. Any unexecuted job remains `NOT_EXECUTED`, not PASS. The real Windows/VMware/Minecraft login and rendering evidence then becomes the *target* test, not a source-preparation test.

## Current work — single Windows desktop solution (2026-10-10)

**Explicit user decision:** No competing Android/native-multi alternatives. Build one Windows desktop setup: host Minecraft Education + 3 isolated VMware Workstation Windows guests. Account sessions must be distinct. `Local` development only; `main` stays README-only.

**Source work:** Remove Android Tauri/backend/frontend hooks and both obsolete probes; retain host-native launch and the canonical VMware provider. Add exact source contract checks against reintroducing Android modes. Preserve account-bearing disks and avoid changing VM identity, credentials, Guest Agent wire protocol or installed product identity.

**P0 proof gates:** (1) boot a real interactive Windows guest; (2) install Minecraft Education *Windows desktop* or Microsoft Store edition (not both), manually log into a distinct licensed account; (3) load an actual Minecraft world and exercise graphics and input without crashes and unacceptable responsiveness. Only after one guest works, finalize an account-clean Base, provision three isolated Windows clones, sign in separately, then prove four concurrent clients.

**Evidence:** Source-only repository inspection and authoring can be complete, but Tauri/Rust/Node executable checks and Windows/VMware/Minecraft game acceptance are **NOT_EXECUTED** without an actual independent execution environment. A configured GPU flag or running Minecraft process never proves gameplay.

**Next:** Execute locked source checks on the same `Local` commit when independently available; then acquire **one real Windows guest** boot/install/login/play evidence before three-VM scale testing.

## Current product status

The emulator/VM manager is now an independent repository with a canonical root and source ownership scheme aligned to the working discipline of `M-Lazy-Developer/Local`.

Scope is **repository setup/navigation and source-path separation**, not proof that Windows, VMware and Minecraft Education work together. Do not claim that any tests were executed merely because test source exists or the repository was refactored.

## Completed source work

- Original dedicated extraction: `M-Lazy-Developer` `Experimental` @ `89cb8691f6757d287707bb8cae2d0d810b751404`, initially migrated into this repository on `Local`.
- Canonical root entry: `README.md`, `AGENTS.md`, `GITHUB_RULES.md`, `CONTEXT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `VERSION`, `package.json`, `toolchain.json`, and optional `DEV.cmd`.
- `apps/desktop/`: one user interface and typed desktop/Tauri adapter.
- `engine/runtime-core/`: one Rust runtime and VMware provider authority.
- `engine/guest/windows/`, `engine/distribution/`: guest setup and machine-readable installer/update contracts.
- `docs/`: one documentation router with `product/`, `system/`, and `validation/` domains; old product-local docs path retired.
- `tooling/repository/`, `tooling/windows-toolchain/`, `tooling/acceptance/windows/`: verifier, optional developer commands, real-machine evidence collection.
- `.agents/skills/emulator-development/`: one bounded development procedure; no duplicate VM state owner.
- ChatGPT–GitHub continuity now uses topic-based cold-start recovery and `Work`/`State`/`Proof` commit trailers, retaining `planning/development.md` as current work owner. This is governance-only source work, not executed Windows/VMware/Minecraft acceptance.
- Old monorepo-style `virtual-clients/` and `apps/virtual-clients/` source paths retired. Cargo/Tauri/NSIS sources and consumer tests updated to the new paths.
- `verification-routing.test.ts` originally asserted a deleted `virtual-clients:verify` script. It now asserts the actual source verification command chain.

## Compatibility and non-goals

This source reorganization **does not** rename or delete the existing installed `M-Bedrock Virtual Clients` application identity, package binary names, snapshot `QA_READY`, `M-Bedrock/VirtualClients` persistent data path, provider state, registered Base images or per-VM Microsoft account sessions.

No VM data migration, credential automation, newly implemented hypervisor, automatic update/apply, CI on push or release to `main` is authorized by the repository setup.

## Evidence ledger

| Claim | Evidence / state |
| --- | --- |
| Canonical folder rename and cross-file references | `REMOTE_GITHUB`: Git tree, reference and ownership inspection; staged source verifier/test assertions, with final exact HEAD confirmation required |
| Release-channel repository identity | Source pinned to `MIVUBI-STD/M-Minecraft-Emulator`; runtime self-apply disabled |
| Desktop npm lock and Rust/Tauri versions | `REMOTE_GITHUB STATIC`: 185 locked packages, 253 dependency edges resolved and no definite package semver mismatch; no observed incompatibility with Node 24.21.0. Dependency installation and executable build remain `NOT_EXECUTED`. |
| Repository static verifier and desktop regression tests | Source authored; execution `NOT_EXECUTED` unless evidence is later obtained |
| Installer required resources | `REMOTE_GITHUB STATIC`: pre-fix 12/15 package-contract files covered, fixed to 15/15 in commit `71507dfa`; Tauri resources and package-preparation static checks reconciled. Installer not built. |
| GitHub manual workflow activation | `UNAVAILABLE BY POLICY`: `main` is intentionally README-only and must not be modified; `workflow_dispatch` files remain on `Local`. No Actions run is claimed. This does not block GitHub source-level work. |
| Source/backend compile and Rust tests | `NOT_EXECUTED` |
| NSIS installer package smoke, Windows install/repair/uninstall | `NOT_EXECUTED` |
| VMware Base/clone/lifecycle/identity and interactive Guest Agent | `NOT_EXECUTED` |
| Minecraft Education sign-in, graphics, network and multi-client usability | `NOT_EXECUTED` |
| Native + Virtual-01/02/03 concurrent acceptance | `NOT_EXECUTED` |

## Next substantive development route

1. Verify the current `Local` exact HEAD's repository structure, consumed Cargo/Tauri resource paths, docs links and source test assumptions. Fix only concrete migration defects.
2. When source execution can be completed independently, run the locked desktop TypeScript/Vitest/Tauri checks and Rust runtime `cargo check/test/fmt` on the **same SHA**. GitHub Actions dispatch is intentionally unavailable while `main` remains untouched; use only an actually available independent authorized execution context, and never demand a user PC as a ChatGPT source-work prerequisite.
3. If packaging is needed, run a separately authorized Windows NSIS package smoke, checking installed CLI/Guest Agent/scripts, data preservation and signature gates. Do not conflate an unsigned smoke with a release.
4. For actual VM acceptance, follow [Acceptance](../docs/validation/acceptance.md), [Static Readiness](../docs/validation/static-readiness.md), and [Failure Matrix](../docs/validation/four-client-failure-matrix.md). Measure account isolation, guest launcher Windows session, CPU/RAM/GPU and Minecraft Education connectivity.
5. Reopen architecture only for a diagnosed defect that the existing owner cannot correctly express. No speculative provider, VM manager or optimization system.

## Source and Build Verification — 2026-10-10

**Source under review:** `Local` at `59477cbbb270512eb1bc10a37f848bdff196f9d0`; packaging source repair `71507dfa0222d681a1a8684215a1b2db16fc95e1`. A newer HEAD must be re-pinned for actual execution.

**Observed static results:**
- All 116 mapped production source assets from the original Experimental snapshot remain present. 104 have byte-identical Git blob SHA; 12 were intentionally modified for extraction, paths or release routing.
- 185 npm lock nodes and 253 declared dependency edges resolve within the desktop lock; no definite range mismatch was detected by static comparison. This is **not** `npm ci` execution.
- Desktop/Tauri/backend/product versions match `0.1.0`. Cargo path dependency points to `engine/runtime-core/`.
- Required Tauri package resources, machine-readable package contract, update repository pin and manual-only workflow triggers were reviewed. Three missing distribution payload mappings were corrected, bringing static coverage to **15/15**.
- No `SOURCE_EXECUTION`, Windows package smoke, VMware run or Minecraft execution occurred; no run on GitHub Actions was available.

**Execution blocker:** GitHub `workflow_dispatch` requires a workflow definition on the repository's default branch. The default `main` branch contains only `README.md`; workflows `.github/workflows/verify.yml` and `package-smoke.yml` exist only on `Local`. No connected GitHub workflow-dispatch action is exposed in this session. Do not report CI, build or tests as PASS.

**Confirmed user decision (2026-10-10):** Development and source verification remain entirely on `Local`. **Do not touch `main`**, which currently contains only the initial README. No workflow bootstrap on `main`, default-branch switch, source promotion or release is authorized. Keep GitHub Actions dispatch marked unavailable under the present configuration; it is not a product development blocker.

**Next action:** Continue bounded source and repository validation on the exact `Local` HEAD. Perform actual Node/Rust/Tauri build/test checks only when an independent, authorized cloud execution context is available without modifying `main`; otherwise leave the exact executable tests `NOT_EXECUTED`. After verified source execution, Windows NSIS smoke and VMware/Minecraft acceptance remain separate proof gates.

Reference: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow

## STOP

Once exact-head source navigation and reference integrity are proven, stop repository tidying. Subsequent work is evidence-driven product development, not repeated cosmetic cleanup.
