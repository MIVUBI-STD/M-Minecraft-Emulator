# Emulator Development Handoff

Updated: 2026-10-10
Authority: `MIVUBI-STD/M-Minecraft-Emulator`, branch `Local`. Current GitHub source HEAD always outranks this file.

## Development checkpoint — fastest route to four usable Education accounts (2026-10-10)

**What the user authorized:** reach four visible Minecraft Education windows, each independently and concurrently signed into a different licensed account on one Windows PC, with no crashes or unacceptable lag. Technical means may change, but **do not** inflate PROCESS_RUNNING, window candidate counts, signed-out menus, or app activation into success.

**External comparison / routes:** Minecraft Education provides official Windows desktop/Store installers and per-account sign-in, but its Manage Accounts is account **switching**, not four concurrent windows. BlueStacks 5 officially supports multiple Android instances with separate profiles and its 2023/2024 catalog advertises Minecraft Education Android. However, the game's **current official requirements say Android emulators are not supported**; an Android-instance manager is only a candidate. VMware Workstation/Fusion backend is already authored but guest-client graphics and Microsoft login remain unproven. Route order remains **native Windows → one BlueStacks Android instance + different account → one VMware Windows guest**, based on cost of proof and actual success; do not construct multiple backends in advance.

**Implementation in this work lane:** Desktop adds fixed-scope Tauri actions `desktop_open_native_minecraft` (request registered Windows Education app) and `desktop_open_android_instances` (open an already installed BlueStacks 5 Multi-instance Manager from its standard Windows program location). Both return *launch requested* only, never signed-in/running proof. The setup screen now surfaces both choices before optional VMware provisioning, and the Native row has a real Open Minecraft action. No credential or VM state management is duplicated. Read-only Windows host probe `tooling/acceptance/windows/probe-android-instances.ps1` reports player/window candidates and host working set without account, game, config or instance disk reads.

**Concrete correctness defect fixed:** `apps/desktop/test/payload-validation.test.ts` still opened `../../../virtual-clients/runtime-core/src/command.rs`, deleted during source-path extraction. It now uses `../../../engine/runtime-core/src/command.rs`; `tooling/repository/verify.mjs` rejects future retired references in desktop tests. This was a deterministic source regression independent of Windows.

**Proof ceiling:** Static GitHub source/consumer/required-resource/doc checks are possible. Desktop/Rust compilation, Windows native second-window, BlueStacks Android Education install/login/play and VMware Education guest remain `NOT_EXECUTED` without appropriate real Windows app/game execution. No valid four-account acceptance exists; do not claim product success. All GitHub work stays on `Local`; `main` remains README-only.

**Next decisive action:** Obtain exact environment evidence that at least **one BlueStacks Android guest** can install *current* Minecraft Education, sign in with its own licensed account and render/interact with a world. Then test a second **fresh** instance and account simultaneously before scaling to four; stop if app compatibility or authentication fails. In parallel, native second-window observation is the cheaper candidate. Preserve VMware as the existing fallback pending one-guest acceptance.

## Current approved MVP goal — four simultaneous accounts on one PC (2026-10-10)

The user clarified the whole product requirement: **one Windows computer, four independent Minecraft Education windows, four legitimately licensed accounts signed in at the same time, all responsive**. Nothing beyond this is a first milestone. The implementation mechanism should be the simplest that truly meets the outcome; VM tooling must not become a user-facing prerequisite if native multi-instance works.

**Evidence-first route:**
1. Direct Windows second-native launch feasibility **first**. Source probe `tooling/acceptance/windows/probe-native-multi-instance.ps1` observes visible window candidates by default; the explicitly requested `TRY_SECOND` mode asks the installed Start-menu application to open a second window and compares observations. It never labels account separation, playability or success as verified. Education's old multiple-instance restriction is historical, not confirmed for the currently installed 2026 version; the modern Manage Accounts feature switches users rather than providing concurrent logins.
2. If a second native window can stay open, verify **two different licensed accounts** simultaneously, then extend to four without shared session collisions. Do not introduce credential automation or bypass client single-instance internals.
3. If native isolation fails, first check the **one Native + three BlueStacks Android instances** route with two-account proof. Use existing **one native + three VMware guests** only after the [single scratch Windows VM game feasibility gate](../docs/validation/client-feasibility.md) actually proves the client renders, accepts input, and can sign in. VMware's 3D-capability specification and the lack of official VM-client support remain major uncertainties.
4. The actual acceptance goal remains four simultaneous visible, playable and separately authenticated sessions on the same host desktop. Four VMs/processes/installed apps or four sequential account switches do not count.

**Concrete source repair:** `App.svelte` client-owned setup phases previously stayed on `SetupSurface` because `page === "clients" && !setupComplete` ignored the backend's `CLIENTS` owner. The fix uses `shouldShowClientControls(nextSetupAction)` in existing `setupFlow.ts`, exposing `ClientsSurface` for identity verification, recovery snapshots and reprovision without a parallel setup manager. The client screen now shows an explicitly **manual/unverified Native** plus the three current VMware virtual slots. This reflects the existing fallback source, not an assertion that four accounts work.

**Proof boundary:** Windows native retry, VMware graphics/login, and four simultaneously interactive logged-in accounts remain `NOT_EXECUTED / UNKNOWN`. No Windows host, Node 24/Svelte/Vitest/Tauri compilation, installer or Minecraft session was executed as part of these source changes. The changes are GitHub source work only and `main` must stay README-only.

**Next necessary task:** prove or disprove the **second native window + independent account** on an actual supported Windows environment when an independently authorized runner is available; if not available, keep the honest `UNKNOWN` and continue only bounded source repairs justified by code.

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
