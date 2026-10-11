## Codex next session — complete disposable G0 installation proof (2026-10-12)

**Work:** `emulator/codex-localtest-handoff`; **State: BLOCKED_ON_DISPOSABLE_ENVIRONMENT / G0_OBSERVED_INCOMPLETE**. This top section is the only current continuation; everything below the divider is history. Preserve all existing VM/account data and work on `Local` only.

### Observed local batch

- Initial GitHub/checkout SHA: `5cd4b31e58e2635e9a1377cdb2b0416972a45a40`. Windows x64, PowerShell 7.6.5, MSVC Build Tools and Windows SDK present. Session-only toolchain: Node 24.21.0, npm 11.19.0, Rust/Cargo 1.98.1 MSVC; global tools were not replaced.
- `DEV.cmd lock` executed once at `80af90e038bcde86d02b4b267833b16d81108e0b`, exit 0; crates.io resolved 493 packages. Reviewed authentic desktop lockfile (127265 bytes), locked/offline/no-deps metadata exit 0; committed only that lockfile in `5add416b32ac8d255b08ed72d65ed3b02f0ed190`.
- Actual failures repaired at their owners: launcher Git newline normalization; stale npm-routing/Finish setup tests; shell splitting of spaced icon paths; missing generated-output ignores; registry path borrow/move error; test imports and obsolete BaseProfile field; Guest Agent mode typo; self-scanning test; stale rollback/installer-containment fixtures; mandatory pinned rustfmt; G0 inspector's wrong target directory. No provider migration, new lifecycle authority or weakened safety gate.
- Initial G0 at `5add416b32ac8d255b08ed72d65ed3b02f0ed190` failed 2/75 Vitest tests; subsequent runs stopped at newly observed errors. Supporting targeted regressions passed before their commits. These earlier runs do not count as final-SHA acceptance.
- **Verified source/package SHA:** `509ce10f0fd5129e4da2990614651fb57241b256`. Final `DEV.cmd g0` exit **0**, clean committed Local at entry, no tracked content change and unchanged HEAD at completion.
- At that SHA: repository contracts PASS; feasibility **15/15**; Svelte typecheck **0 errors, 1 existing accessibility warning**; Vitest **75/75**; frontend build PASS; desktop Rust check PASS and tests **10/10**; runtime all-targets check PASS, library **150/150**, Guest Agent **4/4**, CLI contract **2/2**, runtime integration **5/5**; pinned runtime format check PASS. Compiler warnings remain; no warning cleanup was attempted.
- Unsigned Windows x64 NSIS construction **PASS**; fresh nonempty installer and staged host CLI/Guest Agent verified. Installed payload and installation lifecycle were not exercised.
- Installer: `apps/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/M-Bedrock Virtual Clients_0.1.0_x64-setup.exe` (local ignored artifact, not committed).
- Installer SHA-256: `27417a28e66f4c82762bbbc89214144aa3443dc49c62567caea759db04b87482`.
- Local source/build log: `D:/Work/AI Stuff/Minecraft-Emulator-Tools/g0-verified.log` (outside checkout, not committed). Isolated Node/npm tools are in the same external directory. No raw logs, secrets, guest data or installers were committed.
- The documentation commit recording this batch advances HEAD after the tested SHA. Do not claim executable tests ran on that later documentation SHA or combine results from different revisions.
- Follow-up at `8f32915c51e428d7996ade46772b6e1966ca4244`: actual host inspection confirmed Windows 11 Pro x64; current process Administrator membership **false**; WindowsSandbox executable/current-user package, VMware executable/standard registry entries and Hyper-V Get-VM command not found; Secondary Logon service stopped. A fresh disposable Windows profile cannot be provisioned with this token. Installer hash rechecked and matches the verified hash above. No installer, uninstaller, VM operation, system-feature installation, account creation or new source test was executed.

### Remaining proof and one next action

| G0 subcheck / later gate | Actual status |
| --- | --- |
| Source integrity at verified SHA | PASS |
| NSIS construction at verified SHA | PASS |
| Installed payload completeness | NOT_EXECUTED |
| Disposable install/repair/uninstall/reinstall preservation | NOT_EXECUTED |
| Overall G0 | OBSERVED (incomplete), not PASS |
| G1 / G2 / G3 / G4 | NOT_EXECUTED |

**Next:** establish an explicitly disposable Windows environment/profile through an operator-controlled Administrator session; this execution token cannot provision it and no suitable environment was found. Once available, inspect and exercise the verified installer: install -> required payload contract -> same-version repair -> uninstall -> reinstall, checking runtime-data sentinel preservation. Use `engine/distribution/package-contract.json` and the existing package-smoke workflow as reference. Keep all evidence bound to the verified source/package SHA; rerun G0 if product source changes. STOP before any installation/uninstallation or VM operation on the existing profile.

Only after reviewed complete G0 may one explicitly disposable VMware guest enter G1. The operator controls licensed account sign-in; never clone/reset/reprovision existing Base or Virtual-01/02/03. Keep `main` untouched and CI manual-only. No application/VM/game launch or sign-in was executed in this batch.

---
## Codex next session — one-pass G0 and localtest handoff (2026-10-12)

**Work:** `emulator/codex-localtest-handoff`; **State: READY_TO_EXECUTE / TESTS_NOT_EXECUTED**. This is the **only current next-session task**. Historical sections below are source change history, not requests to reopen old work. Source baseline before this handoff: `Local` @ `dcf81792ee8f8f40f94d4d2028b0fd771a4d41a6`; always re-read the **live** HEAD because this documentation commit and future work advance it.

**Goal:** make the exact `Local` revision demonstrably buildable into an unsigned Windows x64 NSIS package, check its installed contents/data-preservation on **disposable** Windows, and hand over the first single-guest Minecraft Education test. Do **not** assert product readiness or four-client performance before observed evidence.

### Minimal reading and Codex token budget

1. Read `AGENTS.md`, `GITHUB_RULES.md`, and **this section only** at the top of `planning/development.md` (at this revision: `Get-Content planning/development.md -TotalCount 47`; for later revisions stop at the first standalone `---` divider). Do not ingest the historical ~100 KB development log.
2. For G0 use `docs/validation/pre-local-test-readiness.md`, `toolchain.json`, `tooling/windows-toolchain/dev.ps1`, and the relevant error's *single* source owner from `docs/system/implementation-map.md`. For later G1–G4 use `docs/validation/acceptance.md` and `docs/validation/client-feasibility.md` only at their actual stage.
3. Do not repeat broad repository audits, compare unrelated repositories, redesign UI, benchmark speculative providers, duplicate instructions/tests, or perform full-suite re-runs after tiny edits. Execute **one coherent batch**, diagnose the **first real failing command**, repair the smallest owner and dependent regression, then re-run the affected check and **one** pinned G0 batch.

### Phase A — pin revision and resolve the real Cargo graph

- On a clean checkout of `Local`, record `git branch --show-current`, `git rev-parse HEAD`, and `git status --porcelain`. Refuse another branch, a dirty checkout, or a changed HEAD. If `origin/Local` advanced, reconcile using a fast-forward; no force push and no edits to `main`.
- **Confirmed source blocker as of the baseline:** `apps/desktop/src-tauri/Cargo.lock` is absent; `engine/runtime-core/Cargo.lock` and `apps/desktop/package-lock.json` are present. Never fabricate a Tauri lockfile, dependency graph, checksums, or a test success. Do not copy a lockfile from another project.
- On Windows x64 with PowerShell 7+, pinned Rust/Cargo **1.98.1** (`x86_64-pc-windows-msvc`) and working authentic registry resolution, run `.\DEV.cmd lock` **once** in the clean checkout. This command does not install guests, launch VMs or commit. Verify the generated desktop lockfile is nonempty and authentic, review its diff, then commit/push **only that generated file** to `Local` when permitted. Re-pin the new HEAD and require a clean checkout. If Cargo/network/toolchain cannot resolve it, report `BLOCKED` with the exact error, and stop; do not weaken `--locked`.
- The package toolchain additionally requires Node **24.21.0**, npm **11.19.0**, Rust **1.98.1**, PowerShell 7+, MSVC C++ Build Tools, Windows SDK, and appropriate WebView2/NSIS prerequisites. `DEV.cmd` checks pinned language tools but does not prove every OS/SDK prerequisite. Do not silently install system dependencies or change the pins.

### Phase B — run G0 once on the pinned, clean Windows x64 checkout

```powershell
# From repository root; only after a real committed desktop Cargo.lock exists:
.\DEV.cmd g0
```

- `g0` performs toolchain checks, `npm ci`, complete source/typecheck/Vitest/Rust verification, unsigned Windows NSIS build, fresh nonempty installer check, staged CLI + Guest Agent checks and installer SHA-256 output. Record **actual** process exit/result, pinned SHA, installer path/hash and only the necessary failing excerpt; do not label a command as PASS if it did not execute.
- This batch does **not** inspect an *installed* payload or test uninstall safety. On a truly **disposable** Windows installation/test profile with **no existing account-bearing Virtual Clients data**, separately exercise install → required installed files (`engine/distribution/package-contract.json`) → same-version repair → uninstall → reinstall, verifying the runtime-data sentinel is preserved. Follow the existing `.github/workflows/package-smoke.yml` script's checks as a **reference** if manually reproducing them; the GitHub workflow is dispatch-unavailable while `main` is README-only. Never run an installation/uninstall/cleanup experiment against the user's existing profile, VMware Base, Virtual-01/02/03 or private account storage.
- **G0 PASS** needs all four real checks at the same exact revision: source, NSIS construction, installed payload, disposable installer preservation. If only `g0` builds successfully, report `G0 OBSERVED (incomplete)`, **not PASS**. Do not sign, release, publish, auto-update, or alter `main`.

### Phase C — first interactive Windows pilot; do not skip to 3 VMs

- Once G0 is genuinely accepted and an explicitly disposable test VM is available, G1 tests **one** Windows 10/11 x64 VMware Workstation scratch guest, *not* an account-bearing Base or Virtual-01/02/03. Boot an interactive desktop, check VMware Tools, install **one** official Windows Minecraft Education variant, and manually sign in with one appropriately licensed organization account. Keep account credentials and device identifiers out of Git.
- In that **guest's interactive session**, collect read-only `tooling/acceptance/windows/collect-client-feasibility.ps1 -Stage ENVIRONMENT`. Then manually confirm menu, real world rendering and keyboard/mouse interaction for at least **10 minutes** without blocking errors. After real observation collect `-Stage INTERACTIVE` with truthful operator inputs; follow `docs/validation/client-feasibility.md`. VMware guest OpenGL 4.3 vs the Minecraft Education published 4.4 requirement remains an **unproven rendering risk**, not automatically PASS or FAIL. A running process or VM power state is not proof of playable Minecraft.
- **STOP if G1 fails or is inconclusive.** Only after reviewed G1 proof may G2 (clean Base + 3 unique isolated guests), G3 (Native + 3 licensed usable accounts simultaneously) and G4 (recovery, network and sustained-use observations) be attempted, in the order documented by `docs/validation/acceptance.md`. User/operator must explicitly control account sign-in and any VM operation; never automatically clone, reset, reprovision, delete or modify existing account-bearing disks.

### Strict stop/efficiency rules

- Keep **Local only**, **manual-only** GitHub Actions, current Windows+VMware implementation, and current app/Guest Agent/protocol/installer identities. No automatic CI, App Sandbox provider migration, Android route, new lifecycle authority, release publication, speculative performance threshold changes, mass refactor, or `git clean -fdx`.
- Distinguish `NOT_EXECUTED` (never run) from `BLOCKED` (known prerequisite failure), `FAIL` (observed required outcome failure) and reviewed `PASS`. Tests at a different SHA do not transfer. Repair concrete regressions at the canonical owner only; do not modify tests merely to force green output.
- **End-of-run response, short and factual:** (1) branch + before/after SHA and commit paths; (2) commands actually executed with PASS/FAIL/BLOCKED and exact first error; (3) G0's four subchecks and G1–G4 statuses; (4) sanitized evidence paths / installer hash if real; (5) **one** next action or a STOP condition. Record a meaningful new outcome at the top of this file **once per completed batch**, not after every probe. Do not commit raw logs, tokens, VM images, screenshots containing account information or test guest data.

### Single prompt to paste into Codex

> Work only on `MIVUBI-STD/M-Minecraft-Emulator` branch `Local`. Follow `AGENTS.md` and `GITHUB_RULES.md`, then read **only the top "Codex next session" section** of `planning/development.md`. Execute the Phase A → B handoff as far as your *actual* environment allows, and prepare Phase C without starting or altering account-bearing VMs. Use the existing commands/contracts; no broad audit, CI changes, new features, duplicate files or invented success. Commit only grounded minimal fixes to `Local` with real evidence; stop at the first external/runtime blocker and report exact SHA, what ran, G0–G4 status and one next action.

---

## Pre-local idle resource efficiency — 2026-10-12

**Work:** `emulator/pre-local-runtime-idle-efficiency`; **State: SOURCE_PATCHED / EXECUTION_UNPROVEN**. Canonical CPU/RAM pressure and CPU/memory capacity probes use a minimally initialized `sysinfo::System` and explicitly refresh only the metrics required, avoiding full host process enumeration in snapshot/start admission. The existing Windows Screen Overlay worker now blocks on its existing command channel while no overlay windows exist; active overlay paint polling remains unchanged. The G0 host-target detection from the prior batch was also clarified to capture the Rust host triple explicitly. Public schemas, admission thresholds, installed identity and VM disks are untouched.

**Proof:** REMOTE_GITHUB exact call-site and source control-flow review, **not** a measured CPU/RAM improvement or Windows runtime proof. Rust/Cargo, Tauri, PowerShell and G0–G4 remain **NOT_EXECUTED**.

**Next:** Genuine desktop Cargo.lock resolution and exact-SHA Windows G0.

## Windows G0 operator preflight and package evidence — 2026-10-12

**Work:** `emulator/pre-local-g0-operator-hardening`; **State: SOURCE_PATCHED / EXECUTION_UNPROVEN**. The canonical optional Windows `DEV.cmd` launcher now rejects a non-`x86_64-pc-windows-msvc` Rust host before generating the desktop lock or starting G0, and the existing G0 batch checks its just-built versioned NSIS installer for nonempty/fresh output plus the staged host CLI and Guest Agent binaries. It prints the exact source SHA, installer path, and SHA-256; it does not install/uninstall anything, touch guest disks, create a second proof gate, or change the workflows. This prevents a wrong-ABI toolchain or stale/absent local NSIS artifact from masquerading as successful package construction.

**Proof:** REMOTE_GITHUB source/control-flow review only. PowerShell 7, Rust/Cargo, NSIS, VMware and Minecraft execution **NOT_EXECUTED**. Desktop `apps/desktop/src-tauri/Cargo.lock` still needs genuine Cargo resolution and a committed clean `Local` revision. G0-G4 remain NOT_EXECUTED.

**Next:** Resolve the desktop Cargo.lock via real Cargo on pinned Windows/MSVC and execute exact-SHA G0.

## Subprocess safety closeout — 2026-10-11

**Work:** `emulator/pre-local-static-contract-audit`; **State: SOURCE_PATCHED / EXECUTION_UNPROVEN**. The signed-update Authenticode probe was still using an unbounded PowerShell `Command::output`. It now invokes the existing canonical subprocess runner with a 15-second deadline, preserves the required successful signature and exact 40-hex-thumbprint validation, retains `PERMISSION_DENIED` for rejected signatures, and propagates `TIMEOUT` distinctly. The macOS Minecraft Education `plutil` version check also uses the same bounded runner (10 seconds), without changing version authority or platform selection.

**Proof:** REMOTE_GITHUB full call-site inspection and provider command-runner contract review. Rust/Cargo, Windows/Mac execution, signed installer proof and G0-G4 remain **NOT_EXECUTED**. The existing generic runner's inherited-descendant pipe lifetime remains an explicitly separate unproven risk; do not silently kill VMware descendants to hide it.

**Next:** Real Cargo/Windows G0, then disposable single-guest feasibility before multi-client acceptance.

## Pre-local command contract correction — 2026-10-11

**Work:** `emulator/pre-local-static-contract-audit`; **State: SOURCE_PATCHED / EXECUTION_UNPROVEN**. The desktop Base registration response validator required a `guestAgentVersion` property absent from the actual serialized Rust `BaseProfile`. A successful `register-base` mutation could therefore be reported to users as a frontend command-contract failure after committing Base metadata. The validator now requires only the real `schema`, `minecraftVersion`, `guestStatusSchema`, `guestAgentProtocol` and `baseGenerationId` fields. The TypeScript regression fixture is the real Rust output shape and links to the owning Rust structure. No public wire schema, Base metadata, VM state or credential storage was changed.

**Proof:** REMOTE_GITHUB current Rust definition + Tauri dispatch + typed frontend validation examined. Test source authored, **NOT_EXECUTED**; desktop Cargo.lock and G0-G4 remain blocked on actual Cargo/Windows execution.

**Next:** Resolve genuine Cargo.lock and run one exact-SHA G0; do not infer success from the authored regression.

## Cargo bootstrap and post-hardening source correction — 2026-10-11

**Work:** `emulator/pre-local-cargo-bootstrap`; **State:** SOURCE_PATCHED / EXECUTION_UNPROVEN. The optional `DEV.cmd lock` route now checks only pinned Rust/Cargo, exact clean `Local` SHA and real registry-backed resolution. G0 still requires the complete pinned Node/npm/Rust/rustfmt toolchain, a committed desktop lockfile and exact clean SHA; its checks are not weakened.

**Source issue corrected:** The guest interactive TCP launcher previously consumed its `TcpStream` through `Read::take` and then attempted to write to that moved socket. It now borrows `&mut stream` for bounded reading before the response. Desktop native launch now preserves timeout/permission diagnostics rather than falsely reporting all failures as a missing installation. Existing public wire shape and VM/account storage remain unchanged.

**Proof:** REMOTE_GITHUB source and call-site review; Node/Vitest, Rust/Cargo, Windows NSIS and G0-G4 remain **NOT_EXECUTED**. No genuine desktop Cargo.lock could be generated in the available execution context because `cargo` and crate registry DNS are unavailable. A lockfile must be generated by Cargo; no fabricated dependency metadata was committed.

**Next:** Obtain one real registry-resolved and committed desktop Cargo.lock, then execute exact-SHA G0 and inspect installer/payload preservation evidence.

## Pre-local integrated source hardening — 2026-10-11

**Work:** `emulator/pre-local-readiness-batch` — **State: SOURCE_PATCHED / EXECUTION_UNPROVEN**. First coherent source commit: `1f46a70008b2f3dcffda5d002847425accfb353b`; current `Local` HEAD owns the remainder of the batch.

**First-owner corrections:** Rust admission and both VMware providers refuse unsupported `QA_READY` reset while suspended; start/first-setup resource waits run before each actual power-on rather than only between multi-target backend calls; Doctor treats provider `ERROR` or absent observation as uncertain, blocks clean provisioning and offers non-destructive support review. The frontend snapshot validator and regression fixture now use the actual Rust pressure and virtual-hardware fields without manufacturing network/gameplay verification flags.

**Host/guest safety:** Windows host, VMware and SSH diagnostics use the existing bounded subprocess owner; Tauri native launch and window arrangement use the same exported bounded capture function. Windows desktop single-instance coordination now holds an exclusive file handle rather than trusting a half-written PID marker. Guest Agent uninstall removes only its executable plus explicitly owned task/firewall/launcher registrations; Base and unrelated guest files remain. No VM Base, VMX/VMDK/VHDX, stored account data, snapshots, wire schema, installed product identity, provider switch or `main` branch changed.

**Proof ceiling:** `REMOTE_GITHUB` exact-source contract and consumer review. Rust/Node tests were edited but not executed; Cargo/rustc/Windows/MSVC/NSIS and Minecraft interactive proof remain `NOT_EXECUTED`. The desktop Tauri `Cargo.lock` remains absent and must be generated from the real registry and committed to `Local` before exact-SHA G0.

**Concurrent metadata recovery correction:** The existing transactional persistence reader now tolerates a narrowly proven losing-reader `NotFound` only when a regular primary file exists and the backup has actually disappeared. Unresolved backups and unsafe files still fail closed; no VM images, metadata schema or lock design changed. One deterministic regression was authored but not executed.

**Remaining risk:** The generic bounded command runner can return on a deadline while inherited descendant pipe handles keep detached reader threads alive; Windows job/process-tree ownership needs observed evidence before a destructive change. Partial VMware clone folders are preserved and still require operator inspection, not a new automatic cleanup function. App Sandbox remains a disposable GPU-PV pilot, not a production multi-client provider. The package/install preservation contract and actual Microsoft/gameplay sign-in are unverified.

**Next:** Complete one exact-revision Windows G0 (real Cargo lock, source checks, NSIS package, disposable install/repair/uninstall payload inspection) before G1 single disposable guest feasibility; do not start three account-bearing guests or infer success from authored tests.

## G0 lockfile HEAD provenance — 2026-10-11

`tooling/repository/verify.mjs --g0` now checks that desktop Cargo.lock belongs to the actual committed HEAD using git ls-tree, not just that a generated file exists on disk or in the index. This closes a reproducibility gap where an uncommitted dependency graph could incorrectly pass source checks. Ordinary `verify:repository` remains independent of Git/G0 prerequisite; the only affected route is explicit G0. Source review only; no Node/Cargo/Windows G0 execution evidence.


## Toolchain pin on initial desktop lock generation — 2026-10-11

Before generating the missing desktop Cargo.lock with `DEV.cmd lock`, the same existing toolchain verifier now checks pinned Node, npm and Rust inputs while allowing only the expected absence of the desktop lockfile. This prevents a different compiler version from silently resolving the first application dependency graph. The lockfile is still not generated or committed by ChatGPT, and Windows/G0-G4 execution is NOT_EXECUTED.


## Pre-local G0 operator path — 2026-10-11

**Source work:** Extended the existing optional Windows `DEV.cmd` -> `tooling/windows-toolchain/dev.ps1` route with `lock` (Cargo's real dependency resolution, no auto-commit) and `g0` (one pinned, clean Local source-build-package pass). The pinned Rust compiler version is checked alongside Node/npm. No VM/guest/account operation occurs. Exact clean Git HEAD and committed Cargo.lock are mandatory for g0. Existing source/package commands remain canonical; this is an orchestrating entrypoint, not a second test framework or another acceptance gate.

**Environment/proof:** This ChatGPT execution container has Node 22.16.0, no cargo/rustc/pwsh, and no network DNS to github.com/index.crates.io. Desktop Cargo.lock cannot be generated here; it remains absent. The PowerShell script is source-authored only, not executed on Windows. G0-G4 remain NOT_EXECUTED. No installation or release to main.

**Next:** In an environment with genuine Cargo registry access, generate/commit the real desktop Cargo.lock on Local; then execute one `DEV.cmd g0` batch and inspect the unsigned installer and disposable installation behavior before any Minecraft gameplay acceptance.


## Source hardening: interrupted metadata and direct-child cleanup — 2026-10-11

**Scope:** Canonical Rust runtime recovery and subprocess code only. A backup-only runtime schema is now read before classifying it as missing, so a newer schema cannot be overwritten during initialization. A backup-only operation journal is restored rather than silently returned empty. Writes detect unfinished PID-scoped temporary metadata from any process (not just the current PID), and a new temporary candidate is preserved if promotion fails. These are data-preserving, fail-closed behaviors, not automatic VM disk recovery.

**Process boundary:** Bounded command execution now avoids an unconditional wait if killing the direct child fails, and it tolerates child exit between status check and kill. It never kills VMware descendants. A descendant holding stdout/stderr can still retain a detached reader thread: the lifecycle owner must not claim this is solved without target-Windows evidence.

**Proof:** REMOTE_GITHUB source and consumers reviewed, targeted Rust regressions authored for backup-only newer/current schema, backup-only history, prior-PID temp, and direct-child exit races. Rust/Cargo, Node/Tauri, NSIS, Windows GPU/VMware/Minecraft and G0-G4 tests NOT_EXECUTED. Cargo is not installed in this ChatGPT runtime, and network DNS prevented obtaining a Rust toolchain/registry; no lockfile has been fabricated.

**Compatibility:** No VMX, VMDK, VHDX, snapshots, account/guest identity, wire schema, provider selection, installed app identity, or main branch changed.

**Next:** Generate and commit the real desktop Cargo.lock only in an environment where Cargo registry resolution works, then perform one exact-SHA G0 source check.


## Interrupted metadata temporary-file preservation — 2026-10-11

Source fix: write_text_transactional now fails closed when its PID-derived temporary metadata file already exists, before any backup recovery/discard. The old primary and the unfinished temporary contents remain untouched for manual reconciliation. This prevents PID reuse or crash leftovers from silently erasing a possibly newer metadata candidate. No automatic restoration, provider switch, VM disk deletion or account mutation. A targeted Rust regression test is authored.

Proof: REMOTE_GITHUB source review; Rust test and Windows VM execution NOT_EXECUTED. Next: obtain source execution/build evidence; do not extrapolate metadata crash protection into VMware linked-disk chain recovery.


## Long-session metadata and operation-history integrity — 2026-10-11

Source fix: The canonical journal now serializes readers and writers under its existing lock, since reads can rename transactional backups. Contended lock admission is bounded to five attempts with a 20 ms interval. Write failures report only a non-sensitive error kind and do not alter the observed VM result. Invalid history is not overwritten with empty records. Existing history schema and 200-record retention are unchanged.

Metadata protection: If primary JSON and a transactional .bak coexist, the primary must be readable and valid JSON before the backup is discarded. Invalid primary and backup are both preserved, with no automatic account-data replacement. This is a syntax guard, not a validation of VMware disk chains or domain schemas.

Safety: No VM disks, snapshots, account-bearing files, Guest Agent wire schema, installed product identity, provider switch or release branch changed.

Proof: REMOTE_GITHUB exact-source/consumer review. Targeted Rust regression sources added; Cargo, Windows/VMware, packaging and G0-G4 remain NOT_EXECUTED. Inherited subprocess handles remain an unresolved platform boundary.

Next: Obtain genuine Cargo source execution for build and package gate, or diagnose process-tree ownership on Windows before applying cancellation to descendants.


## VMware power-state batch observation — 2026-10-11

Status: SOURCE PATCH. Provider now offers one request-scoped read-only multi-client state observation. VMware Workstation implements it using a single vmrun list for provisioned guests and preserves incomplete-clone ERROR vs NOT_PROVISIONED discrimination and suspended-file precedence. Runtime snapshot uses this observation for status; Doctor uses it with old per-client fallback on error. Existing per-action lifecycle admission and mutation reconciliation still call live state; no stale cache is persisted or shared across requests. Fusion/test providers retain default sequential observation behavior. Node/Rust/Windows and G0–G4 NOT_EXECUTED; actual latency savings remain unmeasured. Next: examine provider subprocess pipe ownership and journal failure visibility before package acceptance.

## Minecraft version probe timeout — 2026-10-11

Status: SOURCE PATCH. Shared Windows Minecraft Education installation/version detection now routes 32-bit Desktop registry query and Store PowerShell fallback through the existing bounded subprocess runner. This prevents a single stalled probe from indefinitely blocking host snapshots or guest status. Detection preference (Desktop before Store), normalized version and install-type schema remain unchanged. This does not assert rendering, sign-in or four-client performance. Rust/Windows/G0–G4 NOT_EXECUTED. Next: reconcile provider-level VM observations efficiently while preserving live mutation admission and observed state.

## Guest process timeout hardening — 2026-10-11

Status: SOURCE PATCH. Windows Guest Agent uses the existing canonical provider subprocess runner (bounded execution/output) for PowerShell session probe, hashed MachineGuid probe, interactive launcher command and VMware Tools token retrieval. Process-running detection uses native sysinfo enumeration without spawning PowerShell for each status. The Guest Agent wire schema, authentication, launcher session, Minecraft account state and VM disks are unchanged. This is not proof that game renders, or that inherited stdout-pipe reader threads are fully reclaimed. Rust, Windows, packaging and G0–G4 tests NOT_EXECUTED in this remote source context. Next: examine inherited-pipe lifetime and reduce redundant VMware status probes without persistent cache.

## Long-session reliability — stale-state fail-closed UI (2026-10-11)

Status: SOURCE PATCH. When an asynchronous backend refresh fails, preserve the previous diagnostic snapshot only as visibly outdated read-only information; clear all action availability and pending recovery/reprovision dialogs. Refresh attempt itself must not reenable controls before a successful backend response. No VM disks, account sessions, provider state, or public wire schemas are modified. Desktop source regression authored; executable Vitest/Rust/Windows/G0-G4 acceptance NOT_EXECUTED. Next: bound Guest Agent Windows child-process probes in the existing subprocess runner.

# Emulator Development Handoff

Updated: 2026-10-11
Authority: `MIVUBI-STD/M-Minecraft-Emulator`, branch `Local`. Current GitHub source HEAD always outranks this file.

## Current migration direction — App Sandbox GPU-PV (2026-10-11)

**Work:** `emulator/gpu-pv-migration`  
**State:** ACTIVE / GUARDED_DISPOSABLE_HCS_PILOT_SOURCE / LEGACY_VMWARE_LIFECYCLE_ACTIVE  
**Source baseline:** `d568e48dbc9cc518eb29b5a536e12e431aaa0a7b` (before design commit).  
**Working design:** [GPU-PV Migration Study](../experiments/gpu-pv-migration-design.md), non-authoritative research rather than a new implementation map.

- User-approved product direction: free App Sandbox GPU-PV as virtualization engine, with Native + three Windows 11 x64 guests on **i7-14700F (20C/28T; no iGPU), RTX 3070 8 GB, 32 GB RAM, NVMe**. Require **both** hardware D3D11 FL11_0 and GPU OpenGL >=4.4 in each guest; gaming/login responsiveness remains separate proof. No cloud or GPU vendor subscription.
- Retire VMware as the *future development direction*, not as installed software or destructive migration. Existing source and Git history remain current as actually implemented until a safe coherent switch; do not touch `main`, installed VMX/VMDK, account disks, credentials or update identity. No permanent dual-provider UI or VM lifecycle database.
- Upstream App Sandbox v0.1.9 offers single-process admin-elevated host HCS daemon, loopback token API, NVIDIA native OpenGL route, Mesa D3D12 fallback and asynchronous `202` VM operations. API `shutdown` is graceful; `stop` is **hard power-off**; app exit can terminate its VMs. Current Rust VMware-specific provider, Base and QA_READY assumptions are **not directly portable**.
- Resource plan is an unproven hypothesis: three guest instances initially 4096 MB and 2 virtual CPUs, staggered, conservative display resolution. RTX 3070 GPU/VRAM and 32 GB system memory are likely limits; do not invent VRAM quotas or performance claims.
- Software App Sandbox is MIT/free but **three Windows guest licenses and four Minecraft Education entitlements are separate rights**; verify existing eligibility before declaring the complete system free of additional costs.
- **Proof:** GitHub source changes include read-only App Sandbox/SSH/VM registry observation and refactoring of provider-owned facts; these are NOT a complete App Sandbox VM backend. Cargo/Node/installer builds, live App Sandbox/GPU-PV/D3D/OpenGL, Windows sign-in, gameplay, and all G0–G4 are still `NOT_EXECUTED`. No actual Windows guest or account disk was accessed.

**M0 source audit completed:** `experiments/gpu-pv-migration-design.md` now contains method-by-method mapping of the existing Rust `Provider` trait and primary runtime consumers to App Sandbox v0.1.9 API, including no suspend, asynchronous `202`, graceful vs forced stop, non-equivalent guest IP/agent transport, identity, VHDX snapshots, VMware Base/VMX assumptions, and admin daemon lifetime. Mapping is design/source proof only; no GPU or game execution. Windows 11 Enterprise edition is user-confirmed, but its **specific license entitlement for three guest installations is NOT VERIFIED**; product activation alone does not establish virtualization rights.

**M1 read-only contract designed:** [GPU-PV Migration Study](../experiments/gpu-pv-migration-design.md) now specifies discovery/token security, fixed loopback routes, v0.1.9/v1 response schemas, six upstream states, explicit failure vocabulary, bounded transport, absence of writable operations and the single diagnostics-consumer constraint. Notable source finding: App Sandbox Windows backend validates gpuMode 0/1 even though SDK docs list 0/1/2. No VM/APIs invoked; all build/GPU/Minecraft proof still NOT_EXECUTED. Windows Enterprise edition is known, local virtualization entitlements still unverified.

**Read-only Rust source slice implemented (2026-10-11):** new `engine/runtime-core/src/provider/app_sandbox.rs` in the existing provider owner reads Windows App Sandbox discovery, validates literal localhost and the upstream 40-hex session token, pins API v1/product v0.1.9, performs bounded GET-only reads for version/host/list/named statuses, and projects a non-sensitive summary with game/GPU proof explicitly false. Existing CLI `diagnostics` appends `appSandboxInspection` **once per explicit request**; repeated `snapshot`, Tauri frontend and support bundle remain unchanged. No App Sandbox provider switch, guest creation, lifecycle mutation, new dependency or GPU probe. Targeted pure parsing regression tests authored, **NOT_EXECUTED**, including tolerance for unrelated Linux VM inventory records while strictly validating the three named Windows targets. Evidence: GitHub source review only; Rust/Node/G0-G4, Windows guest, GPU and Education evidence remain `NOT_EXECUTED`. Current VMware operation code remains active until future migration and guest data are preserved.

**Provider observation seam updated (2026-10-11):** removed hidden VMware-derived default implementations from the existing Rust `Provider` trait: per-provider host process-memory evidence, network mode and 3D configuration are now explicit requirements. Moved the *first-time setup base finalized/stopped* fact out of `runtime.rs::collect_lifecycle_facts` into the same provider contract, with VMware VMX access remaining in one shared VMware-only helper. Both Workstation/Fusion and the existing FakeProvider follow the new contract. Missing/unreadable base facts fail closed. This is a bounded refactor of existing active VMware behavior, **not** a runnable HCS lifecycle/provider switch; creation, snapshot, identity, credentials, app packaging, and game readiness remain untouched. GitHub static review only; Rust executable checks and G0–G4 remain NOT_EXECUTED.

**Provider-owned guest communication completed (2026-10-11):** replaced `Provider::guest_ip_address` with explicit `guest_status(client, timeout)` and `launch_minecraft(client, timeout)` methods. Centralized the existing VMware VMX/IP/64-hex-token connection in `provider/mod.rs`, with Workstation and Fusion delegating to it; `runtime.rs` and `minecraft_runtime.rs` now consume provider-supplied Minecraft-specific observations rather than constructing VMware credentials. The legacy Base registration still uses the VMware validation-VM path intentionally; identity comparison remains fail-closed and requires independently confirmed VM UUID/MAC and Windows machine identity. App Sandbox read-only `online` signals are **NOT** substituted for the missing Education GuestStatus; no HCS lifecycle changes, no new agent, no VM write, no new dependency. Source was reviewed in GitHub, but executable Rust builds and G0–G4 are **NOT_EXECUTED**.

**HCS read-only lifecycle projection (2026-10-11):** The existing `provider/app_sandbox.rs` diagnostic observation now exposes a strictly VM-only `powerState` projection (OFF/ON/TRANSITION) while retaining exact upstream phases (`building/installing/booting/online/stopping/stopped`). It reads upstream `GET /v1/vms/{name}/display` for `displayOpen/displayReady` without starting any display or VM. Named guest lifecycle controls remain explicitly `false`, as VM ownership, Windows identity, safe shutdown, snapshot recovery and Minecraft-specific GuestStatus are NOT verified. Handles case-insensitive collisions of `Virtual-01/02/03` as a failure instead of treating mismatched-case VM names as unallocated guest slots. Targeted mapping/display/ownership tests written but NOT_EXECUTED. Regular `snapshot`, UI, VMware lifecycle and guest disks remain unchanged. GitHub-only source review; G0–G4 and actual Windows GPU/Minecraft tests remain NOT_EXECUTED.

**App Sandbox SSH / Minecraft one-shot path prepared (2026-10-11):** The existing `virtual-guest-agent.exe` now supports exact `--ssh-status` and `--ssh-launch-minecraft` command modes that output one structured JSON response and do NOT initialize the VMware SYSTEM service or require its VMX guestinfo token. `--ssh-launch-minecraft` reuses the existing localhost **signed-in-user interactive launcher**; it does not launch Minecraft directly in an SSH service session. The VMware HTTP `/status` and SSH status now share one `GuestStatus` source. App Sandbox explicit read-only diagnostics now queries `GET /v1/vms/{name}/sshInfo` to expose only SSH forwarding/key-deploy capability, never user/key/path; `hostKeyVerified=false` and `minecraftCommandsEnabled=false` even if forwarding is ready. Source-mode/SSH response regressions authored only. VMware source operations, Windows guest disks, UI snapshot and HCS mutations unchanged. Rust compilation, SSH host-key trust, actual user session and game remain NOT_EXECUTED.

**Pinned App Sandbox SSH status slice (2026-10-11):** the existing provider now owns `app_sandbox_ssh.rs`, a fixed `--ssh-status` OpenSSH request on the localhost-forwarded port only after a user-verified unique ED25519 host public key is placed out-of-band in `%LOCALAPPDATA%\\M-Bedrock\\VirtualClients\\trust\\app-sandbox-known-hosts`. Host aliases `mivubi-virtual-01/02/03` stay stable across forwarded-port changes. Pin validation rejects duplicate keys/aliases, mismatched names, untrusted key types and symlinks; SSH enforces strict host-key matching, public-key-only noninteractive login, no proxy/forwarding and bounded execution/output. Diagnostics separately reports `hostKeyPinPresent`, `hostKeyVerified` and `guestStatusObserved`. A successful status observation **does not** prove account-bearing VM identity, Minecraft login or working GPU, and `minecraftCommandsEnabled=false` remains hard-blocked. No key is automatically enrolled, no SSH launch is attempted, no HCS mutations or VM data writes. Rust regression tests authored but NOT_EXECUTED. All G0–G4/graphics/game proof NOT_EXECUTED.

**HCS storage/Windows identity preflight (2026-10-11):** App Sandbox explicit diagnostics now compares the reported `diskDirectory` from both inventory and named VM status, rejects identical or lexically unsafe storage roots across tracked Windows guests, reads the upstream snapshot/branch pointer without modifying it, and flags that active VHDX lineage remains **unverified** because v0.1.9's HTTP API does not expose immutable VM MAC or active VHDX path. The pinned SSH status result now passes its non-public hashed Windows MachineGuid into the observation layer; duplicate hashes among observed guests cause diagnostic failure, and `windowsIdentityUniqueAcrossThree` is only true if all three named guests present distinct, verified SSH status identities. Public reports never expose the Windows identity hash or raw disk path; account ownership and lifecycle/launch permission remain **false**. The three-VM identity condition does not establish licensed Windows use. No new persisted identity database, VM modifications, service or runtime polling. Source regressions written, executable checks and G0–G4 still NOT_EXECUTED.

**HCS registry provenance correction (2026-10-11):** upstream v0.1.9 confirms `diskDirectory` is a **shared parent** of separately named VM directories, so the previous duplicate-parent rejection was incorrect and has been removed. The existing provider now reads upstream `%ProgramData%\\AppSandbox\\vms.cfg` **read-only**, parses BOM-aware UTF-8/UTF-16 data, validates unique VM names/MAC/VhdxPath records and derives the specific VM directory and active VHDX path even for snapshot branch disks. Named status and inventory are checked against the corresponding parent; a second registry read detects changes during inspection. Diagnostics report `registryRecordObserved`, `uniqueVmDirectory`, `persistedMacObserved`, and `activeVhdxPathObserved` without returning MAC/paths. `activeVhdxVerified=false`, `ownershipVerified=false`, and all VM/game commands stay blocked: editable registry information is NOT proof of attached HCS disks or durable account ownership. Upstream snapshot cursor `-2/-1` is accepted as possible bare-base state. Focused source regressions authored, executable build, VM GPU/Minecraft and G0–G4 NOT_EXECUTED.

**M2 one-disposable-guest action path authored (2026-10-11):** The existing Rust provider now contains `app_sandbox_pilot.rs`, accessible **only** via explicit CLI `app-sandbox-pilot inspect|start|shutdown|display`, not the Tauri UI or production VMware `Provider`. It is a bounded, manually created **disposable** VM path only, not Windows installation/provisioning automation. The allowed target is exactly `MVB-PILOT-01`, with expected ProgramData pilot directory and a direct `disk.vhdx`, Windows OS, GPU Default (gpuMode=1), NAT, 4096 MB RAM, 2 CPU, and zero snapshot/branches. Before any POST, it checks upstream authenticated version/host, current inventory and status, registry MAC/VHDX identity, non-reparse pilot directories, and an explicit local `pilot-consent.json` marker containing the correct name, fingerprint tied to active disk path/MAC, disposable acknowledgement and operator's Windows-license assertion. The caller must also pass `--confirm-disposable-pilot`. It never touches `Virtual-01/02/03` and has **no create, delete, snapshot/reset, hard-stop or Minecraft launch path**. `start` and **graceful `shutdown`** accept upstream 202 only as admission, poll observed state to bounded completion and never auto-retry/force-off/rollback on unknown outcome. `display` requires actual upstream IDD readiness/interactive daemon and validates its returned open state. This is an implementation of a narrow **pilot action path in source**, not proof of a working Windows VM. The pre-existing VMware runtime, installer, identities and disk data are unchanged. Operator instructions: [GPU-PV Disposable Pilot](../docs/validation/gpu-pv-disposable-pilot.md). No VM calls or account changes occurred in this ChatGPT/GitHub source work. Rust/Cargo source execution, guest GPU/D3D11/OpenGL, Minecraft Education and G0–G4 remain **NOT_EXECUTED**. A pilot consent is not immutable HCS disk-attachment attestation.

**Disposable pilot safety review (2026-10-11):** Corrected the pilot's success and storage checks in the **existing** canonical Rust provider owner. A `202` accepted `start` now remains pending through `installing/booting` and only completes at a consistent upstream `online` (agent connected, **not Minecraft-ready**); start/shutdown/display validate the same consent, MAC, active direct VHDX, source VM state, snapshot pointer, registry and storage configuration **again after the accepted operation**. The pilot now rejects empty/truncated direct VHDX files; only unbranched-base cursors `-1/-1` and `-2/-1` are allowed. Registry parsing also checks VM-root collisions independent of active VHDX leaf names. No changes to production VMware selection, account VMDKs, snapshot/reset/force-stop/delete policy, or Tauri UI. Pure Rust regression source and operator guide were revised; `cargo` and `rustc` are unavailable inside the current ChatGPT source environment, and the GitHub connection cannot dispatch source checks without touching forbidden `main`, so SOURCE_EXECUTION, package execution, actual App Sandbox/HCS, GPU, Minecraft and G0–G4 remain **NOT_EXECUTED**. No VM was accessed or mutated.

**Disposable pilot pre-start resource and VHDX format guard (2026-10-11):** bounded `app_sandbox_pilot.rs` now validates the documented VHDX `vhdxfile` identifier and 1 MiB header-section minimum using a read-only handle **only before starting a stopped pilot**, not for shutdown/display (a running VM can hold exclusive access to its disk). It also requires 4 GiB pilot allocation + 6 GiB available host RAM reserve, measured via already-present sysinfo, and at least 12 GiB free on the ProgramData volume as reported by authenticated App Sandbox host status. These are conservative *admission floors*, not benchmarks or disk growth forecasts. Existing explicit manual consent, pre/post identity checks and no force-stop/delete/reset/production guest controls are unchanged. The stable CONTEXT.md now distinguishes the approved future App Sandbox direction from currently active legacy VMware, avoiding a stale "VMware is final" declaration. Source checks are **static only**: neither rustc/cargo nor external toolchain download was available in this session, so Rust compilation/tests and Windows D3D/OpenGL/Minecraft G0–G4 remain NOT_EXECUTED. No VM or account disks were touched.

**G1 provider-aware guest hardware evidence (2026-10-11):** Reused the **existing** schema-1 `CLIENT_FEASIBILITY` collector and evaluator to support `-Provider APP_SANDBOX_GPU_PV` (default `VMWARE` preserved, and missing `provider` in historical reports still means VMware). Inside an interactive x64 Windows guest the collector now attempts a temporary `D3D11CreateDevice` with **D3D_DRIVER_TYPE_HARDWARE** requesting **FL11_0 only**, without WARP/reference/software fallback; `UNKNOWN` is recorded on failure, alongside the existing real WGL OpenGL version, vendor and renderer. GPU-PV evaluation cannot report `OPERATOR_REPORTED_PLAYABLE` unless D3D11 hardware FL11_0, NVIDIA OpenGL >=4.4/non-software renderer and independently declared sign-in/10-minute world/input criteria all hold. A successful report remains explicitly **operator-reported and guest-diagnostic evidence**, not automatic G1 PASS or proof of actual game rendering on a specific GPU. VMware-only risks and existing report schema are backward-compatible. Extended focused JS tests, existing validation docs, owner navigation and disposable pilot guide instead of introducing an acceptance harness or new gate. The pure evaluator was executed against six synthetic V8 scenarios during preparation; Node's own test runner, the PowerShell guest collector, actual Direct3D/OpenGL, Cargo/NSIS and G0–G4 require separate execution and are NOT_EXECUTED. No VM or user data touched.

**G1 graphics-evidence integrity hardening (2026-10-11):** The same schema-1 `evaluate-client-feasibility.mjs` now rejects logically contradictory `APP_SANDBOX_GPU_PV` diagnostic records: `UNKNOWN` OpenGL with populated version/vendor/renderer, `MEASURED` OpenGL with a failure reason, `UNKNOWN` D3D11 with a claimed hardware feature level/driver, and `MEASURED` D3D11 without a consistent hardware FL11_0 result. GPU-PV NVIDIA OpenGL evidence now requires both NVIDIA vendor and recognizably NVIDIA-family renderer (NVIDIA/GeForce/RTX/GTX/Quadro/Tesla), refusing generic/known software renderers. The accepted renderer names include real-world GeForce-only strings, not just literal NVIDIA. Legacy schema-1 VMware reports continue to work without new fields. Extended focused synthetic test suite to 15 cases; the full candidate suite was executed in the available V8 runtime during review; no Node test runner, PowerShell guest, Windows hardware probe, Rust build, NSIS, or G0–G4 has been executed. No product VM paths, guest disks, accounts or provider selection changed.

**Next:** validate the exact source campaign with available Rust/Node toolchains and a legitimately licensed disposable Windows guest on App Sandbox GPU-PV; only advance beyond G1 after observed graphics, Minecraft and input evidence meet the canonical acceptance rules.

## P0 source correction — Windows x64 and guest GPU feasibility (2026-10-11)

**Work:** `emulator/x64-and-opengl-feasibility-boundary`  
**State:** SOURCE_PATCHED / REAL_GAME_UNPROVEN  
**Baseline:** `ebdcfbe10365fdbb46de028e8f983693a6d2d868` before this commit; current `Local` HEAD remains authoritative.

- Minecraft Education has required Windows 10/11 **64-bit** since February 2026, and publishes OpenGL 4.4 as a minimum GPU specification. VMware Workstation 26H1 itself is 64-bit but its publicly advertised guest graphics remains DX11 / OpenGL 4.3 with partial higher-version extensions. OpenGL 4.3 is a compatibility risk, not proven game failure, and no GPU spoofing is permitted.
- Existing owner-only changes: Windows Base preparation rejects 32-bit OS prior to installation; existing G1 evidence evaluator no longer reports 32-bit/unknown guest OS as playable; NSIS command explicitly targets `x86_64-pc-windows-msvc`, and sidecar preparation rejects mismatched Rust host triples. Reuse old G1 collector, status and report schema, no new GPU engine or lifecycle policy.
- Targeted evidence regression added for Windows guest architecture without new runner or testing gate. x64 sidecar packaging and actual Windows OS/runtime behavior are unexecuted.
- **Proof:** REMOTE_GITHUB source and official VMware/Minecraft documentation; Node/Rust executable tests, NSIS installer PE inspections, observed guest OpenGL, licensed Minecraft rendering and G0–G4 remain **NOT_EXECUTED**. Tauri desktop Cargo.lock still missing.
- **Stop:** Do not treat x64 source guards or a VMX 3D flag as proof of OpenGL 4.4 or playable Minecraft. No alternate virtualization provider or GPU software stack is authorized by this correction.

**Next:** Keep game compatibility gated on the existing one-disposable-guest G1 outcome after actually executable G0 is available; no other feature work should be justified as a GPU compatibility fix without real evidence.

## Active bounded research — subsystem architecture and upstream references (2026-10-11)

**Work:** `emulator/subsystem-reference-study`  
**State:** RESEARCH_DESIGNED / NO_RUNTIME_MUTATION  
**Source baseline:** `7dc6bd65af82cbe804c9931e9a95a46db16fc4e6` (before this documentation-only commit).  
**Canonical research artifact:** [Subsystem Reference Study](../experiments/emulator-subsystem-reference-study.md). This lives in non-authoritative `experiments/` to avoid duplicating `docs/system/implementation-map.md` or runtime contracts.

- Classified 23 analytical concerns across the current Desktop, Runtime, VMware, Guest, Reliability and Distribution owners; these are not new implementation modules or status gates.
- Compared high-value source patterns from VMware Packer, Broadcom VDDK documentation, controller-runtime, QEMU Guest Agent, Microsoft Session 0 guidance, PowerToys and TUF. Reuse an algorithm only for a proven current owner; do not import their infrastructure.
- Source-confirmed safety boundary: reprovision is disabled, unwired filesystem cutover does not establish VMDK backing-chain safety, and Workstation linked clones deliberately avoid relocations. **No reprovision enablement, platform replacement or new state owner is authorized.**
- Minecraft Education's OpenGL 4.4 GPU minimum versus publicly documented VMware guest OpenGL 4.3 is a feasibility risk, **not** observed game failure. G1 and G3 remain `NOT_EXECUTED`; no GPU spoofing or runtime readiness claim.
- G0 desktop Tauri Cargo.lock remains missing and must be generated from genuine dependency resolution. G0–G4 remain `NOT_EXECUTED`. This research is GitHub source plus external documentation only.
- Repository policy remains unchanged: work via ChatGPT + GitHub on `Local`, leave `main` untouched; no CI, new dependencies, tests or execution environments introduced.

**Next single task:** read-only, line-level audit of the current Workstation linked-clone and `provider/storage.rs` cutover assumptions against Packer and Broadcom disk-chain semantics; decide KEEP / source-grounded ADAPT / DEFER before modifying VM source. Preserve all previous unrelated blockers and source/evidence constraints.

## Current G0 correction — fail closed on uncommitted Tauri dependencies (2026-10-11)

**Work:** `emulator/g0-tauri-dependency-reproducibility`  
**State:** SOURCE_PATCHED / EXECUTION_UNPROVEN  
**Parent `Local`:** `2b12825eacc78039bd49a303dcb5d78bfec4c5a8` (new exact commit is authoritative).

- Confirmed at the pinned GitHub tree: the runtime has `engine/runtime-core/Cargo.lock`, but there is no `apps/desktop/src-tauri/Cargo.lock`. Tauri's own v2 documentation recommends committing it; Cargo `--locked` must reject absence and stale resolutions.
- Actual Cargo/Rust toolchain and dependency registry resolution are unavailable in this ChatGPT context. **No lockfile was fabricated**, no versions/checksums were guessed and there is no claim of successful compilation.
- G0's existing `verify:source` route now requests a **G0-only** prerequisite from the existing repository verifier, so the aggregate source checkpoint fails early without Tauri Cargo.lock; standalone structural `verify:repository` remains usable. Existing desktop Rust check/test and Tauri build invoke Cargo with `--locked`; direct package preparation refuses missing Tauri lockfile before constructing binaries. Only the existing verification-routing assertion was adapted; no new test module/runner/state manager/CI.
- **Proof ceiling:** exact GitHub source/config consumer review only. All product gates G0–G4 remain `NOT_EXECUTED`; Tauri dependency resolution is explicitly unresolved.
- **Safety:** `main` untouched, no new workflows, no PC tasks, no changes to VM accounts/disks, providers or install identity.

**Next:** Generate and commit a real Cargo-resolved desktop lockfile only when Cargo/registry access is genuinely available in the authorized ChatGPT + GitHub workflow; then execute G0 to see actual compiler/package results.


## Current source batch — G0 package inputs and Rust lock boundary (2026-10-11)

**Work:** `emulator/g0-package-source-integrity`  
**State:** SOURCE_PATCHED / EXECUTION_UNPROVEN  
**Parent `Local`:** `572ab4f11454ab76e9074c42c3c6872d545ad0b0`. Current GitHub commit owns the completed revision.

- During the G0 route audit, package preparation was observed to accept a Tauri resource *destination* prefix even when the required *source file* was absent. `apps/desktop/scripts/prepare-package-binaries.mjs` now verifies every required mapped resource against its actual on-disk origin **before compiling**, except the Guest Agent binary explicitly produced by the same script. The existing generated host/CLI executable paths retain their packaging checks.
- The backend CLI + guest Agent `cargo build` call now uses `--locked` with the already committed `engine/runtime-core/Cargo.lock`; dependency resolution may no longer silently update that backend lockfile.
- **Known unclosed boundary:** Tauri has no `apps/desktop/src-tauri/Cargo.lock` in `Local`. Its full dependency graph cannot yet be honestly described as pinned to the same SHA. Do not invent a lockfile or add Tauri `--locked` until actual Cargo resolution produces a valid lockfile. No new runner, macro/micro test, CI, staging scheme or separate G0 database was added.
- **Evidence:** exact-source package-route/static review (`REMOTE_GITHUB` only). Node/Rust executed checks, executable installer content, Windows/VMware and Minecraft remain `NOT_EXECUTED`. All product G0–G4 statuses stay `NOT_EXECUTED`.

**Next:** Only after an actually generated Tauri Cargo.lock is available can exact-SHA desktop Rust dependency locking be closed; until then focus on grounded source defects, not repetitive test writing.


## Current decision — five-gate integrated test campaign (2026-10-11)

**Work:** `emulator/test-campaign-consolidation` — **State: DOCUMENTED / EXECUTION_UNPROVEN**.  
**Exact source parent:** `86e7c536d6c1fac33e191fd8abfacbcf73622528`; GitHub commit owns final SHA.

**Decision:** The **only product-test progress gates** are **G0 Source & Package Integrity → G1 One Guest Feasibility → G2 Provisioning & Identity → G3 Four-Client End-to-End → G4 Recovery & Multiplayer**. Canonical criteria and fail/stop/evidence rules: `docs/validation/acceptance.md`. Existing 12 Windows stage IDs and their schema-1 JSON recorder remain unchanged; the mapping to G1–G4 is in `tooling/acceptance/windows/README.md`, while the old four pre-machine G1–G4 checks are explicitly renamed as *four checks within G0*. G4 `SOAK` is supporting evidence, not a replacement for recovery/multiplayer.

**Anti-micro-test rule:** Rust/Vitest/unit regressions and static checks support a gate but do not count as product PASS; test engineering in coherent batches, diagnose the first responsible owner and revisit relevant/dependent gates only when genuine execution is possible. No new test runner, project/plugin, dependency, database, score, stage API, or automated CI. `main` remains untouched; source development is ChatGPT + GitHub `Local` only.

**Current exact evidence:** G0 = `NOT_EXECUTED`; G1 = `NOT_EXECUTED`; G2 = `NOT_EXECUTED`; G3 = `NOT_EXECUTED`; G4 = `NOT_EXECUTED`. Source/static review exists but no same-SHA compiled app, Windows installer, VMware client, Education sign-in, rendering or four-account interactive evidence. None is PASS, and no observed failure is being invented.

**Next:** Continue only source-grounded development. When executable proof is genuinely available within allowed capability, evaluate G0 as one integrated gate rather than asking for piecemeal machine tests.


## Current implementation — recoverable VMX configuration writes (2026-10-11)

**Work:** `emulator/vmx-transactional-persistence`  
**State:** SOURCE_PATCHED / EXECUTION_UNPROVEN  
**Base Local HEAD:** `d5151c2b0b908ce7f9f536f96f58ba52d7e0c6fd`. The resulting GitHub commit is the authority for the final SHA.

- Replaced truncate-in-place `fs::write` in the **existing** `provider/vmx.rs` owner with the already established transactional metadata writer `persistence::write_text_transactional` for hardware policy, Base state and Guest Agent token. VMX reads now use its matching `read_text_recovering` path. No second recovery engine or new dependency.
- A process interruption between renaming VMX to `.vmx.bak` and promoting the replacement could otherwise make a valid VM appear missing. Provider `require_client`, status, provision and Base checks, as well as Doctor/Base preparation and registration, now recover through a single VMX-presence helper before making that classification. Unsafe/invalid files fail closed on operational provider paths.
- One existing-suite regression exercises interrupted-backup recovery, retained VMX settings, and a subsequent transactional Base-state write. No new test framework, lifecycle state, VM disk mutation, public schema, or snapshot change.
- **Evidence:** exact-ref `REMOTE_GITHUB` static and consumer review. Cargo tests/build, NSIS packaging, Windows/VMware lock behavior, Minecraft graphics and four-client acceptance remain `NOT_EXECUTED`. No user PC, automatic CI, default-branch edits or alternative execution environments.

**Next:** Stop unless another current-source defect is directly demonstrated; do not add speculative disk-chain parsing or separate recovery mechanisms.


## Current batch — safe provisioning preflight and VMX key integrity (2026-10-11)

**Work:** `emulator/provision-vmx-integrity`  
**State:** SOURCE_PATCHED / EXECUTION_UNPROVEN  
**Parent Local:** `d9c5cdf27bd52613dd1e0b79492b3241ce681d00` (exact new commit is the authoritative source).

- Before cloning any missing guest, the runtime checks provider state and existing Base/client lineage for **all three** virtual clients. A later invalid or missing profile no longer causes earlier Virtuals to be cloned before the failure is discovered; no original client/account data is deleted.
- `provider/vmx.rs` now matches exact VMX key names case-insensitively with flexible spacing. Reads reject duplicate assignments instead of guessing which sensitive Base/identity/token value VMware would use. Intentional writes deduplicate the targeted key variants and keep unrelated values/comments intact.
- Cloned VM hardware policy rotates the Guest Agent secret and writes the policy **once**, eliminating its former separate write with an inherited Base token in between. This reduces inconsistent intermediate states but is not a filesystem-atomic VMX transaction or proof of complete VMware disk chains.
- Existing test modules received a bounded VMX key/token regression and provisioning preflight matrix; no new module, dependency, lifecycle manager or speculative recovery route was introduced.
- **Proof:** exact GitHub source and consumer inspection only. Rust compiler/tests, Windows installer, real VMware clone, Education graphics and four-account playability are **NOT_EXECUTED**. Development remains ChatGPT + GitHub `Local`, with no CI or user-PC tasks.

**Next:** Inspect a concrete source defect in VMX persistence/provisioning if found; otherwise stop instead of adding unconsumed recovery scaffolding.


## Current implementation — stable Windows window identification (2026-10-11)

**Work:** `emulator/window-discovery-correctness`  
**State:** SOURCE_PATCHED / EXECUTION_UNPROVEN  
**Starting GitHub `Local`:** `2fc9008774096fd61c974136645daedcadc27c25` (new GitHub commit is the source of final SHA).

- Replaced title-substring `Get-Process.MainWindowHandle` sampling with Win32 `EnumWindows`/visible ownerless top-level HWND enumeration in the **existing** `window_arrangement.rs` owner. Candidate recognition now cross-checks PID/process name and bounded client-name title patterns; the native app also allows an identified Store ApplicationFrameHost window.
- Each client must resolve to at most one HWND, and each HWND must belong to only one client. Incomplete discovery reports missing clients as before. An ambiguous/inconsistent mapping fails closed; one VMware application window or tab is **not** treated as three distinct VM windows.
- Before applying any move, the desktop verifies every HWND still exists with the discovered PID and client title. Every `MoveWindow` result is checked; an actual API failure is surfaced instead of claiming the layout worked. No new window manager, public contract, guest protocol, provider, or dependency.
- A single existing-suite regression covers duplicate handles/labels, invalid PID, and mismatched missing-client inventory. Geometry and public layout schema are unchanged.
- **Proof:** `REMOTE_GITHUB` structural and consumer review only. Native Win32 execution, Rust/Tauri compilation, Windows window behavior, Minecraft gameplay and four-client acceptance are **NOT_EXECUTED**. Do not involve a user machine in source work.

**Next:** Inspect exact-source compilation-sensitive boundaries and leave unverified Windows-specific behavior explicitly marked; address only grounded defects.


## Current source batch — bounded Guest Agent requests (2026-10-11)

**Work:** `emulator/guest-agent-transport`  
**State:** SOURCE_PATCHED / EXECUTION_UNPROVEN  
**Parent Local:** `90193360265806d904bfd95e9a37db980bbe8111`. Final SHA is the current GitHub commit.

- The Windows Guest Agent no longer assumes an HTTP request arrives in one TCP read. It accumulates segmented headers under a strict total deadline and length bound. Incomplete and oversized frames fail explicitly without waiting for the peer to close its send side.
- The network accept loop uses a bounded eight-request concurrency limit and a completion guard rather than an unbounded worker pool. A launch gate prevents concurrent expensive Minecraft start requests without making status wait behind the active launch.
- Existing token, request-ID header, HTTP endpoints, port and wire schema remain intact. Internal Minecraft launch errors produce HTTP 500 instead of an unexplained EOF. Authenticated fixed commands remain the only actions.
- Added one focused segmented/oversized/EOF transport regression case in the existing binary test module. No new module, dependency, executor, feature, protocol alias or persisted state.
- **Proof:** exact GitHub static/consumer inspection only; Rust compilation/tests, Windows VM and Minecraft acceptance **NOT_EXECUTED**. No automated CI and no user-machine work.

**Next:** Inspect exact-head Guest Agent host/server behavior for a concrete compatibility defect, not speculative refactoring. Stop if no source-grounded defect remains.


## Current operating decision — ChatGPT + GitHub only (2026-10-11)

**Authority:** Current user direction supersedes historical notes below that mention alternate execution pathways. Work against GitHub `Local` from ChatGPT; `main` stays untouched and there are no automatic workflows. No user-computer tasks and no assumed third-party execution services. Do not repeatedly propose an execution environment that is not available.

**Work completed in this sequence:** desktop compatibility diagnostics and accurate status presentation (commit `9be8be487f3021da068b19098d293e534d51521d`) plus consolidation of existing source-work instructions (this commit). No new lifecycle state, provider, test harness, dependency, platform, or release channel was introduced.

**Proof ceiling:** GitHub exact-source inspections and content/consumer checks only. Node, Rust, Tauri, Windows package, Windows guest, real Education sign-in/rendering and four-client usability are `NOT_EXECUTED`; do not describe authored tests or static scans as executable PASS.

**Prioritization:** First repair an *identified current-source defect* within its existing owner; avoid new modules, speculative features, duplicated plans, cosmetic changes, or unconsumed tests. If no further actionable source defect can be grounded, stop rather than manufacturing work. Existing historical `Next` sections remain records of their commit date and do not override this decision.

**Next:** Inspect actual current source consumers only when a specific defect is identified; otherwise hand off the remaining real execution evidence as `NOT_EXECUTED`.


## Current batch — truthful desktop bulk actions (2026-10-11)

**Work:** `emulator/desktop-bulk-lifecycle`  
**State:** SOURCE_PATCHED / EXECUTION_UNPROVEN  
**Parent:** `69c88f6b597d39df1665766e88dfd8f9d071f2eb` (check the current GitHub commit for exact final source SHA).

- Fixed an actual UI/backend mismatch: the Start available clients button previously issued `start(maxVirtualClients)` regardless of which guests were running. It now selects only STOPPED/SUSPENDED clients admitted by backend action projections (without pending first boot) and uses the existing `startClient` IPC command sequentially, with per-client runtime admission.
- The batch operation is deliberately non-atomic. If a later start fails, already started guests are not stopped; the UI reports partial completion and the existing mutation wrapper refreshes actual backend state.
- Stop-all is offered only when every provisioned guest has backend Stop admission and at least one is RUNNING. A suspended/error guest prevents offering a batch that would be rejected before mutation by the Rust runtime.
- Updated misleading recreate guidance to reflect the existing disabled destructive lifecycle path; no change to guest disks, provider code, API schemas or permissions.
- Regression cases updated in the existing view-model test suite rather than creating new files/frameworks. **Evidence: REMOTE_GITHUB static source inspection only; tests not executed.** No developer machine required, no automatic CI, and `main` untouched.

**Next:** inspect a concrete source-level mismatch in desktop/engine setup, keeping higher-context execution evidence `NOT_EXECUTED` until actually available.


## Current implementation batch — safe VM lifecycle, no PC handoff (2026-10-11)

**Work:** `emulator/safe-power-lifecycle` — **State: SOURCE_PATCHED / EXECUTION_UNPROVEN**.
**Parent source:** `4db466ae31c48a3bd1622db589c163d86dd9be84`; use the GitHub commit for the final exact SHA.

- Both VMware provider implementations now make `stop` and `stop_validation_vm` graceful-only, refuse implicit suspended-client resume, and surface timeout/error instead of hard-powering-off account-bearing VMs.
- Both providers refuse destructive `reprovision`, preserving the original client; Fusion's legitimate cleanup of disposable staging VM files remains intact. The public runtime reprovision guard remains enabled.
- Stop-all and Suspend-all preflight the entire target set; runtime still re-checks each client immediately before attempting a VM operation.
- Failed Restart/Reset verification no longer triggers a hidden `provider.stop`, and reported errors include current provider state.
- Existing Rust regression cases were updated for preflight semantics, with targeted cases for suspended Stop and post-Reset/Restart state. They are **authored, NOT_EXECUTED**. Exact-source checks, NSIS, Windows VM graphics, Education sign-in and four-client gameplay remain unproven.

**No PC requirement during source development:** All work is committed to `Local` through ChatGPT + GitHub; `main` and CI workflows untouched. Product architecture stays Native Windows Education plus three VMware Workstation guests. Do not add an alternative provider until user authorizes an architecture switch following real evidence. Do not send incremental PC test requests.

**Next:** execute same-SHA Node/Rust/Tauri build and Windows package checks using an authorized independent cloud execution context, then repair only evidenced failures. Only after source/package integrity is ready does one final targeted on-machine feasibility/acceptance exercise make sense; no present proof of Windows VM gameplay exists.


## Current implementation batch — safe suspend-all partial failure (2026-10-10)

**Work:** `emulator/non-atomic-power-batch`  
**State:** SOURCE_PATCHED / EXECUTION_UNPROVEN  
**Starting Local HEAD:** `dd70d9c654788f5ea90a0ed27783662ee7790c1a`

The current Rust owner already contains start-batch compensation and stop-batch partial-state reporting; do **not** duplicate those historical B1a/B1b repairs. This batch reuses a single in-module non-atomic power-batch reporter for **Stop** and **Suspend**. A failed Suspend now reports each targeted provider state and leaves already-suspended VMs untouched, rather than automatically restarting a VM or claiming the batch rolled back. It also accounts for a provider returning an error *after* a state mutation. No public API, guest disk, installer, credential, provider, branch, or release contract changed.

**Proof:** Source-only at pinned GitHub parent HEAD. Existing FakeProvider tests for Stop remain, and two bounded Suspend tests cover provider failure (before/after mutation) and admission failure. Test sources were authored, **not executed**: this ChatGPT execution environment has no Rust toolchain and does not have the pinned Node 24/npm 11 toolchain. There is no actual Windows/VMware/Minecraft proof or source verification PASS. No CI trigger, workflow, or `main` change.

**Remaining:** Same-SHA `npm run verify:source`, Windows NSIS package verification, safe reprovision audit and the actual one-guest Minecraft Education feasibility gate remain unproven. Do not adopt App Sandbox or create a parallel VM provider without an explicit evidence-based architecture decision.

**Next:** Execute locked source checks on the exact new `Local` commit in an independently available authorized environment; repair only observed failures.


## Prior verified Windows build failures repaired in source — 2026-10-10

**Scope:** Exact `Local` source fix for failures observed in the previously completed GitHub Actions runs [Source Verification #38067894851](https://github.com/MIVUBI-STD/M-Minecraft-Emulator/actions/runs/38067894851) and [Package Smoke #38067894820](https://github.com/MIVUBI-STD/M-Minecraft-Emulator/actions/runs/38067894820), both at historical SHA `515e076`. These logged three Svelte typecheck errors (`positiveInteger` unknown narrowing and two undefined `arrayOf` calls) and five Rust compiler errors (`guest_token` imported from the wrong module, and generic `fs::rename` passed without a lifetime-compatible closure). This change corrects those exact source causes in existing owners. **No GitHub Actions or automatic CI was triggered by the fix.** Rust/TypeScript executable confirmation at the new SHA remains **NOT_EXECUTED**. These build errors are not evidence of VMware/Minecraft feasibility failure.

**Primary product outcome remains:** demonstrate one actual Minecraft Education Windows client inside one VMware Workstation guest: Windows desktop boots, licensed sign-in works, world renders, and input remains responsive. Existing guest feasibility collector/evaluator are available; this cannot be truthfully passed via source or hosted Windows runner without an interactive VMware guest. Do not extend micro-tests or restore automatic CI. `main` remains untouched; `Local` manual-only Actions configuration stays unchanged.

**Next action:** obtain a genuinely executed same-SHA source/installer build only through an explicitly authorized on-demand execution route; then perform one disposable guest feasibility observation. Record exact evidence, not a synthetic PASS.

## E1 incomplete clone UI/status reconciliation — 2026-10-10

**SOURCE_PATCHED / NOT_EXECUTED.** Commit `c8bcbd8` changes Workstation provider status for an existing VM directory with no VMX from an error result (which Doctor previously discarded) to the existing `ClientState::Error`. Doctor can now surface the occupied, unhealthy client as an issue instead of recommending clean provisioning. Runtime provisioning refuses to overwrite it; user VM files are preserved. No new state, schema, validator, or micro-test. This does **not** reconstruct missing VMX/profile or prove Windows behavior. Node/Rust/Tauri/Windows execution still NOT_EXECUTED.

**Next:** Verify the exact SHA with executable source checks when available; then address any real output failures. Keep Reprovision blocked pending recoverable implementation, and do not modify `main`.

## E1 incomplete clone state and verification ceiling — 2026-10-10

**Status: SOURCE_PATCHED / BUILD_NOT_EXECUTED.** Commit `63393d1` changes Workstation provider status to return an explicit error when the client VM directory exists but its VMX is missing, rather than reporting NOT_PROVISIONED. This protects residue from being misclassified as a clean new client. Existing provider provisioning already refuses to overwrite the directory. Rust compiler/Cargo and pinned source execution were not available in the current execution context, and direct network clone access is unavailable; no Rust tests, NSIS build or VMware execution were performed. Doctor still degrades provider-status errors into missing/unknown observations; product readiness must not infer a successful VM from such a result.

**Next:** Run same-SHA Rust source checks and one high-value provision/status matrix when a suitable independent execution environment is available, then repair actual failures. Avoid more one-off micro-tests or speculative disk parsing. Public destructive reprovision remains disabled.

## E1 provision provenance boundary — 2026-10-10

**State: SOURCE_PATCHED / EXECUTION_UNPROVEN.** Commit `b8e4d39` repairs `runtime.rs::provision_inner`: an existing Virtual VM cannot silently pass as provisioned without a readable, compatible client lineage profile. Preexisting clients now require `require_client_matches_native` before the loop continues, preserving all VM/account files if provenance is missing or stale. Newly created VM instances still commit the client profile and fail explicitly if that write fails; no automatic destructive cleanup or fabricated recovery. Pinned source check was performed; cargo build/test and VMware acceptance remain NOT_EXECUTED. The previous interrupted clone or interrupted provenance write still needs an explicit non-destructive recovery path.

**Next:** Examine whether the current source compiles and the provision-to-status behavior is consistent on a pinned SHA, using the strongest available executable context; avoid adding isolated micro-tests just to raise test count. Keep reprovision disabled.

## Current direction — outcome-driven validation, not micro-test accumulation

**Current decision (2026-10-10):** Stop expanding speculative disk parsers and single-case regressions. Commit `986a44f` removed unconsumed text-VMDK preflight/inventory helpers and their four tests from `provider/storage.rs`; the underlying VMware disk-chain question remains UNKNOWN. Historical B1c entries below describe the sequence at their commit dates, **not** active validation capabilities. Public Reprovision is still disabled pending an actually safe implementation.

**Use four product gates, ordered by dependency:**

| Gate | Outcome | Minimum decisive evidence |
| --- | --- | --- |
| E1 — Engine correctness | VM provision/start/stop, failed operations and account data survive without false success | One focused lifecycle matrix covering failure recovery and on-disk provenance; actual Rust check/tests |
| E2 — Distribution | A real installable Windows product contains its executable and Guest Agent, repairs safely | Same-SHA desktop/Rust build, NSIS package smoke, disposable Windows install/repair/uninstall |
| E3 — Guest feasibility | One Windows VMware guest launches a real Minecraft Education world responsively | Interactive guest boot, license sign-in, rendering, input, bounded observation; real runtime evidence |
| E4 — Product acceptance | Host Native + 3 Virtuals run independently together | Four accounts, performance, account persistence, networking and window usability observed |

**Change discipline:** Start from the first product gate still failing. For each observed defect, identify one owner, patch its complete caller-to-outcome path, add the smallest representative regression (prefer table-driven/fault matrix over separate near-duplicates), then STOP. No validator without a production consumer and no test that exists solely to confirm an uncalled helper. Keep necessary security/failure cases, not arbitrary numeric targets for test counts. Do not equate static review with execution.

**Immediate follow-up:** Review current source for genuine compile/build regressions on the pinned Local SHA and execute E1/E2 when an authorized environment exists. Do not extend B1c disk parsing or enable destructive Reprovision from static assumptions. Any further reprovision design must minimize disk relocation and preserve old state on failure.

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

## Workstation initial provisioning — no linked-clone relocation — 2026-10-10

**State: SOURCE_PATCHED / EXECUTION_UNPROVEN.** Commits `a6338e6` and `a6f26d0` change **initial** VMware Workstation `provider.provision`: a linked clone is created directly in the final VMX directory rather than cloned under staging and then moved. This removes an unverified relative-parent path relocation from the initial provisioning sequence. An existing final directory without a VMX now fails closed as partial residue; vmrun errors and missing VMX leave files intact for diagnosis rather than deleting possible in-flight disk output. Once vmrun and VMX creation succeed, hardware policy is applied at final path. No actual VMware execution or Rust tests were run. This is not evidence that VMware linked clone itself is compatible or bootable.

**Not covered:** public Reprovision remains disabled and the legacy low-level provider.reprovision is destructive if called outside the guarded runtime. Filesystem `cutover_staged_vm` and text VMDK preflight utilities are deliberately **not** active provider behavior; do not present them as proof or expand further speculative parsers. The provider's `status` may report NOT_PROVISIONED for partial existing directories; a subsequent `provision` will now refuse to overwrite them, requiring safe reconciliation. Existing profiles/VMs remain untouched by this initial-clone change.

**Next:** run pinned Rust check/tests and inspect deterministic provisioning failure tests; add read-only diagnostics for incomplete final VM directories if needed. Validate actual Workstation linked clone from native Windows guest before making additional disk-chain architecture claims. No main modifications, cloud dependency or user-PC source testing requirement.

## B1c inventory-wide candidate disk rejection — 2026-10-10

**State:** SOURCE_GUARD_AUTHORED / NOT_EXECUTED / REPROVISION_DISABLED. Commit `43c206d` introduces read-only `validate_staged_disk_inventory` in the canonical provider storage owner. It traverses the staged directory and refuses symlinks, no VMDKs, binary/unknown descriptors, absent parent hints, absent referenced parents and paths that change their meaning on final movement. Two Rust regression cases were authored but **NOT_EXECUTED**. This does not prove VMware extent formats, snapshot chains, complete descriptor grammar, child-parent IDs, or actual guest boot. The helper is not wired into production cutover, and must not be described as full VMDK-chain validation.

**Next action:** validate assumptions against VMware descriptor/extent semantics and obtain executable Rust verification; only then determine whether staging should avoid relocation entirely. Do not bypass the public reprovision safety guard.

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
