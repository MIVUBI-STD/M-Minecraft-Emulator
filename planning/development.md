# Emulator Development Handoff

Updated: 2026-10-10
Authority: `MIVUBI-STD/M-Minecraft-Emulator`, branch `Local`. Current GitHub source HEAD always outranks this file.

## Approved reliability and modularity program — 2026-10-10

**Work:** emulator/runtime-reliability-modularity
**State:** ACTIVE / DESIGN_REVIEWED; all listed source repairs PENDING.
**Proof ceiling:** REMOTE_GITHUB inspection at Local `fe5392d944eeb9309af3d1f1c5cf32fa755e6087`; no executed Node/Rust/Windows/Minecraft tests. This section is an implementation plan, not a claim that bugs have been patched.

### Product acceptance and architecture invariants

Deliver one Native Minecraft Education Windows desktop client plus three isolated VMware Workstation Windows guests that remain responsive with independent licensed identities. Do not confuse a running VM/process, live Agent, matching versions or setup READY with rendered, signed-in, multiplayer-playable Minecraft. Preserve Local-only development, README-only main, existing installed identity, account-bearing disks, update trust and wire/public schema. No alternate hypervisor, CI/cloud service, localhost gateway, second scheduler or parallel state manager.

**Modularity goal:** make existing Rust runtime roles narrow without proliferating files, abstractions or double authorities. Extract only when a concrete failure/test boundary benefits. No wholesale rewrite and no speculative module scaffolding.

### Source-backed defect register

| Priority | First owner | Confirmed source behavior / risk | Required acceptance |
| --- | --- | --- | --- |
| P0 | `runtime.rs::start_targets` | Batch startup rollback ends before per-client game launch and provider UI open; later failures can leave newly started VMs running without clear partial-result reconciliation | Inject launch/open failures for first and later clients; assert exact observed states and explicit recovery per client, not false atomic success |
| P0 | `runtime.rs::stop_inner`, `restore_batch_state` | Stop-all invokes rollback helper that cannot restore a previously RUNNING client; calling it rollback overstates recovery | Fault-inject stop of second/third VM; return honest partial result or restore the previous RUNNING state by explicit policy; never silently claim rollback |
| P0 | `runtime.rs::reprovision_inner`, `provider/workstation.rs::reprovision` | Profile and old VM are deleted before replacement clone success; confirmed-destructive operation still lacks failure-safe replacement | Stage and validate candidate before cutover; failure preserves inspectable old VM/profile; recovery remains explicit |
| P1 | `provider/workstation.rs::stop` | Hard-stop follows a roughly 12s soft-stop wait; potential guest data interruption | Separate graceful timeout/force policy; hard-stop must be explicit or justified and reported |
| P1 | `bin/virtual-guest-agent.rs` | Agent handles host connections serially and parses each TCP request with one read; launch can block status, segmented headers may fail | Deterministic segmented/slow client + concurrent launch/status tests; strict bounded IO, authenticated fixed commands |
| P1 | `provider/workstation.rs::restart` | Provider-running state after soft reset does not prove guest restarted and is usable | Check guest transition/fresh agent evidence; no ready claim from power state alone |
| P1 | `apps/desktop/src/App.svelte::startAll` | UI calculates eligible clients but invokes prefix-count Start for all 3 | Consistent selected-target handling and truthful per-client result; no new frontend state authority |
| P1 | `lifecycle_admission.rs` | Incompatible data schema denies even Stop/Suspend; operator recovery can become blocked | Defined read-only/controlled safety-stop route that cannot bypass disk or identity guard |
| P1 | `profile.rs` / Base update policy | Native version change currently routes to rebuild and account-destructive reprovision | Design safe migration/preservation policy before implementing; do not silently alter existing account VM |
| P2 | `doctor.rs`, `virtual-guest-agent.rs` | Setup READY and wildcard game-process match are narrower evidence than playable game | Rename/present readiness precisely; distinguish process, window, login, graphics and multiplayer |
| P2 | `provider/storage.rs`, desktop window arrangement | Staged linked clone path relocation and title-based VMware window discovery are unproven on Windows | Verify clone disk references and actual window identities with measured target evidence |

### Target ownership map (logical boundaries, not an order to create every file)

```text
apps/desktop/              Svelte view, typed bridge, UI orchestration only
   -> thin Tauri commands  (no lifecycle policy)
engine/runtime-core/
   runtime.rs              public façade, admission and operation dispatch
   lifecycle_admission.rs  pure state/action eligibility
   lifecycle/              OPTIONAL on-demand extraction of start, stop, rollback
   provision/              OPTIONAL on-demand extraction of staging/cutover
   provider/               VMware command/state, VMX and disk ownership
   guest.rs                bounded host <-> guest protocol
   bin/virtual-guest-agent.rs
                           fixed authenticated service and per-user launcher
   profile.rs / doctor.rs  provenance and setup projections, not gameplay truth
engine/guest/windows/      guest installation and finalization scripts
engine/distribution/       installer/update contracts
tooling/acceptance/        independently observed machine/game evidence
```

Do not create `lifecycle/` or `provision/` until the first repair and focused tests demonstrate a real need. Keep one canonical public `VirtualClients` API, one lock, one persisted client profile, one provider and one owner of each admission decision. Optimize for less reading/context/AI usage through targeted owners and deterministic tests, not maximum file count.

### Executable batches and STOP gates

1. **B1a / first bounded source change:** fix stop-all's misleading rollback/partial-result behavior in `runtime.rs` with deterministic FakeProvider fault injection. Inspect before modifying: `restore_batch_state`, `stop_inner`, existing stop and batch tests, `client.rs` command-result semantics. No new module until tests need it. Review static diff and mark source execution honestly.
2. **B1b:** cover post-start Minecraft launch/open failures and status reconciliation; test newly started vs preexisting Running clients. Never force-stop a preexisting user session just to make a batch appear atomic.
3. **B1c:** redesign reprovision as staged and recoverable cutover with failpoint tests before touching destructive provider code. Keep confirmation and disk ownership safeguards; require stronger proof before any account-bearing runtime migration.
4. **B2:** isolate Guest Agent request framing, concurrency and status vs launch timing; correct provider restart/stop safety; then frontend selected-target semantics. Each step one owner and relevant consumers/tests, not a horizontal rewrite.
5. **B3:** execute pinned full source checks and Windows NSIS/package smoke when an authorized execution context exists; then one disposable VMware Windows Education client boot/install/login/world/graphics/input observation. Scale to three guests plus Native only if one guest truly works.

**Performance acceptance** requires measured host memory/CPU/GPU, per-client frame responsiveness and recovery over repeated sessions, not static 4096MB/2vCPU settings or process counters. If VMware guest rendering fails, record the exact first failing boundary; architecture reconsideration requires new user approval, not an unrequested parallel engine.

### Handoff policy

For each bounded change: pin current Local HEAD; read first owner and consumers; write focused regression before claiming a fix; commit with truthful `Work`, `State`, `Proof`, `Unresolved`, `Next`; capture exact new SHA and remaining unexecuted proof; STOP. Preserve older entries as historical evidence rather than rewriting them as completed.

## B1c linked-VMDK movement preflight — 2026-10-10

**State: PARTIAL_SOURCE_IMPLEMENTATION / REPROVISION_DISABLED.** Commit `ef656e8` adds read-only `provider/storage.rs::validate_linked_disk_move` to inspect a single text-format VMDK descriptor parent hint and reject a move when the parent path would no longer resolve to the same existing file. Two targeted Rust regression tests were authored for changed relative paths and missing parents, **NOT_EXECUTED**. This does **not** validate all descriptors, extents, snapshots, VMware metadata, or the actual VM clone, and is not yet called by cutover. It is a prerequisite utility, not proof of disk safety. The public reprovision admission guard remains active.

**Next:** discover all VMDK files and resolve the entire descriptor/extent/snapshot chain before any directory movement. Validate a candidate against its final sibling directory with pinned source and deterministic fault tests; do not enable provider reprovision until disk and profile cutover can be recovered.

## B1c rename-failure regression — 2026-10-10

**State: SOURCE_TEST_AUTHORED / EXECUTION_UNPROVEN / REPROVISION_DISABLED.** Commit `898ef1d` adds an injected rename boundary inside the existing `provider/storage.rs` filesystem cutover and a deterministic test that fails the second rename after original VM backup, then verifies restoration of the original VMX plus client-profile.json, staging retention and absent leftover backup. No public API changes. Rust tests NOT_EXECUTED; no Windows/VMware acceptance. This does not establish safe VMware linked clone references or safe provider reprovision. **Next:** examine and validate linked-disk references for the staged-to-final move, then integrate provider candidate preparation only after verified evidence.

## B1c recoverable filesystem cutover primitive — 2026-10-10

**State: PARTIAL_SOURCE_IMPLEMENTATION / REPROVISION_DISABLED.** Commit `f15b4b0` adds `provider/storage.rs::cutover_staged_vm`, an intentionally non-wired filesystem cutover that checks for VMX + co-located client profile, moves the original directory to a sibling backup, promotes the staged directory, and attempts to restore the original if promotion fails. Two isolated directory regression tests were authored but NOT_EXECUTED. The original backup is deliberately retained after success; no automatic cleanup or destructive retry.

**Proof/constraints:** REMOTE_GITHUB source only. The helper requires staged/final/backup sibling directories; current provider staging lives elsewhere and is not compatible without deliberate staging adjustment. No verification of VMware linked-disk references, clone integrity, power state, snapshot chains, symlink safety, or actual Windows filesystem rename behavior has occurred. Public and shared-admission reprovision guards remain in place. **Do not wire or enable until candidate preparation, on-disk profile generation, VMware disk integrity and recovery tests are complete.**

**Next:** In provider/storage ownership, implement candidate preparation and validation compatible with sibling cutover and add deterministic rename-failure injection before integrating; only afterward reassess public reprovision guard.

## B1c safety gate — 2026-10-10

**State: SAFETY_GUARD_APPLIED / RECOVERABLE_REPROVISION_NOT_IMPLEMENTED.** Commits `a934270`, `d247b0c` and `b169c47` intentionally disable account-destructive Reprovision in both `VirtualClients::reprovision_inner` and `lifecycle_admission.rs` until the provider owns a recoverable cutover. The guard now runs before any provider, staging cleanup, profile or VM mutation. Existing clients, snapshots and account data remain unchanged by rejected reprovision calls. All source-execution and Windows/VMware tests are still NOT_EXECUTED; this is source logic, not machine proof.

**Important limitation:** This is a protective stopgap, **not completed B1c** and not a working client-recreation feature. `provider/workstation.rs::reprovision` retains the old destructive code path, but public runtime and shared UI admission reject calling it. Do not claim the provider operation itself is safe, and do not bypass the guard through a new caller.

**Next implementation contract:** Develop one recoverable account-bearing VM and `client-profile.json` cutover as a single owned transaction (stage candidate, verify cloned disk/VMX, preserve stopped original in recovery location, promote replacement, persist new profile, and reconcile/restore safely on failed steps). Test clone failure, partial staging, VM-directory move failure, profile-write failure, and ambiguous provider outcome with deterministic failure injection. Do not silently delete old VM/snapshot/account data, auto-retry destructive operations, or leave an orphaned backup without an explicit recovery path. Only lift both guards after exact-source execution and required safety evidence. Do not add a second state store or VM manager.

## B1b startup recovery source patch — 2026-10-10

**State:** SOURCE_PATCHED / EXECUTION_UNPROVEN. `Local` commit `34b69742e31868aaec5cc1b7dd791b1dddb2cccf` moves Minecraft Education launch and VMware window opening inside the existing `execute_start_batch` verification/rollback boundary. The rollback retains its original policy: newly started clients are stopped after failed current-client verification, earlier new clients are restored to their original power states, and preexisting RUNNING clients are not stopped. Two targeted FakeProvider regression tests were authored for post-boot failure; actual Rust compilation/tests and VMware/game execution remain NOT_EXECUTED. A VM power-state rollback cannot undo a game process launched in a preexisting RUNNING VM; game readiness still requires separate observed proof.

**Next single source task:** B1c safe reprovision: avoid deleting old profile/VM before a candidate clone and recovery cutover are validated. Preserve explicit destructive consent; design fail-closed behavior around ambiguous disk mutation and snapshots.

## Pre-local-test source readiness audit — 2026-10-10

**Status: SOURCE_REVIEWED / BUILD_UNPROVEN; PRE_LOCAL_READY = NO.** Only the `Local` branch is authorized; `main` stays README-only. User requires completing all source and package preparation gates before first target-PC test, not repeated ad hoc local tests.

**Second concrete cross-contract defect:** `register_base_inner` and `wait_for_guest_compatibility` previously accepted Guest Agent status protocol v1, while `profile.rs` and `minecraft_runtime.rs` already required launch protocol v2 for usable Minecraft Education startup. This could register a Base that cannot pass daily launcher checks, or allow a guest startup to pass readiness but fail late when launching the game. Source patch requires launch-compatible protocol before registration/commit and before daily guest acceptance, with a Rust regression test. Test execution still pending.

**Observed correctness issue:** Official Minecraft Education Windows installer documents its Desktop detection registry key as **32-bit application on 64-bit Windows**. Rust native detection already uses `reg query ... /reg:32`, but `engine/guest/windows/prepare-base.ps1` used the implicit PowerShell registry view. Fix it via `RegistryView.Registry32`, constrain the managed Base installer to the official Windows Desktop .exe, and add source contract regression. Reference: https://edusupport.minecraft.net/hc/en-us/articles/13106858087956-Windows-Installation-Guide .

**Package readiness:** Register `acceptance/windows/collect-client-feasibility.ps1` among machine-readable mandatory installed files (Tauri already maps the full acceptance folder), so an installer missing the one-guest proof collector cannot be called complete.

**Canonical readiness gate:** [Pre-Local-Test Readiness](../docs/validation/pre-local-test-readiness.md); see mandatory G1–G4 and explicit STOP rules.

**Static preflight observations on candidate source tree:** package contract has 16 mandatory files, 16/16 covered by source or generated binary mapping, including the new one-guest collector; 31 direct TypeScript test file references and Rust embedded-file references examined without missing tracked paths. The isolated V8 execution of the exact evaluator function exercised 10 result cases and rejected 5 malformed inputs, but this is **NOT** pinned Node 24, Vitest or Windows executable proof.

**Stop before first PC acceptance until:** locked desktop typecheck/Vitest/frontend build; Rust runtime + Tauri checks/tests/fmt; real Windows NSIS package-build/package smoke (including guest-agent and all mandatory payloads); installer identity/safety and target acceptance scripts are **actually executed successfully on exact same Local SHA** in a suitable independent execution environment. Any unexecuted job remains `NOT_EXECUTED`, not PASS. The real Windows/VMware/Minecraft login and rendering evidence then becomes the *target* test, not a source-preparation test.

## CLI envelope and identity verification guards — 2026-10-10

The host collector now validates the actual CLI `{schema:1,data:...}` envelope before projecting any diagnostic field. `-VerifyIdentities` can no longer run during HOST baseline or with stopped/unprovisioned guests: all three must be explicitly RUNNING. Default diagnostic collection remains read-only; no identity mutation or provisioning is triggered. Source-only change; Windows PowerShell and CLI executable run not yet available.

## Host preflight collector correction — 2026-10-10

A concrete acceptance blocker existed in `tooling/acceptance/windows/collect-acceptance.ps1`: it unconditionally queried `resources 3`, even at HOST baseline with no provisioned virtual clients; the Rust `VirtualClients::resources(3)` explicitly rejects unprovisioned clients. Collector now outputs the actual three virtual status slots and may omit resources with null measurements/`resourcesCollected=false` until all three guests exist. Removed unsupported manufactured `readyForProvisioning`, `multiplayerVerified`, `graphicsPolicyReady` and `networkConfigurationObserved` fields. Added static regression contract. No actual Windows VM or CLI run is claimed.

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
