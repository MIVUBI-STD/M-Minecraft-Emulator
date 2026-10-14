# Current Development Handoff

## KmdUtil native Windows transport contract — 2026-10-14

**Work:** author concrete v1.18.5 driver/service command transport source while preserving the active Minecraft pilot. **State:** DONE for typed argv source and read-only Windows probe; privileged Windows transport activation is still BLOCKED.

**Decision:** `tooling/isolation-source/windows/transport-commands.mjs` compiles fixed, independently checked KmdUtil argv for seven installer stages and receipt-restricted stop/delete stages, matching `SandboxieVS.nsi` and minifilter altitude `86900`. Explicit Windows root restrictions, pinned image digests and immutable `executionAllowed=false` prevent command specs from granting authority. `windows/kmdutil-transport.ps1` independently compares arg lists and reads SHA-256, Authenticode and current SCM namespace. Its Apply gate rejects all calls until a fixed lab signing anchor, verified disposable-machine attestation, and owned-service transaction receipt checks have been implemented and reviewed. No shell process, driver or service mutation is exposed to Tauri or the active `MinecraftClient02`.

**Proof:** seven pure command-contract tests executed on exact GitHub blobs in the available V8 runtime and PASS, including mismatched source, tampered checksum/step order, unsafe payload paths and rollback without verified receipt claim. PowerShell code static-inspected; Windows/PowerShell execution, driver signing/load, rollback, and Minecraft gameplay NOT_EXECUTED. A self-reported receipt claim is not external ownership proof.

**Unresolved:** no active privileged Windows transport, no pinned MIVUBI lab certificate, no independently attested disposable VM, and no running MIVUBI Sandboxie fork. The existing client idle crash cause remains UNKNOWN.

**Next ONE task:** implement an independently verifiable disposable-host attestation and service-image ownership receipt gate for the sealed Windows transport; after source review, wire it into the journaled execution owner without affecting official Sandboxie.

## Owned isolation durable transaction sequencer and Windows preflight — 2026-10-14

**Work:** implement the source-first transaction execution core, not just a list of provisioning operations. **State:** DONE for journal-backed simulation and read-only Windows preflight source; privileged Windows mutation transport remains NOT_IMPLEMENTED.

**Decision:** `tooling/isolation-source/execute-disposable.mjs` owns an exclusive write-ahead transaction journal bound to the exact v1.18.5 provisioning plan fingerprint. Record `UNKNOWN` with fsync/atomic replace *before* attempting a simulated effect; require seven verified ordered steps; propagate failed, unknown, interrupted or untrusted step results without retries; forbid replay and delete/rollback without proven owned-service receipts. Only `IN_MEMORY_SIMULATION` adapters are accepted and the source has no Tauri hook. Add `simulate-disposable.mjs` for explicit local simulation (no install). Separate read-only Windows `probe-disposable-readiness.ps1` checks signer status and service namespace, with VM detection only heuristic and `installationPermitted=false`.

**Proof:** source review against exact GitHub blobs and five in-memory V8 transaction scenarios PASS (all seven steps, UNKNOWN, exception, privilege-adapter rejection, changed plan binding). Nine Node-test scenarios AUTHORED for filesystem durability/identity but exact Node test command NOT_EXECUTED for this revision. Windows/PowerShell, Microsoft signing, kernel load, Minecraft gameplay, four-client acceptance and real rollback NOT_EXECUTED.

**Unresolved:** no authentic compiled/signed/installed owned driver; no privileged Windows transport or cryptographically attested disposable host; no proof of SCM path ownership or successful undo. Existing Client 02 idle crash UNKNOWN; official runtime/box untouched.

**Next ONE task:** source-first implement a Windows-specific, host-attested KmdUtil/SCM transport under a privileged-operation gate, with independently verified binary signatures, per-service image-path ownership and durable recovery receipts; do not connect it to the active Tauri Client 02 route until runtime acceptance.

## Disposable owned-engine provisioning transaction source — 2026-10-14

**Work:** begin the Windows Driver & Service Controller without waiting for a Windows SDK/WDK runtime. **State:** DONE for deterministic transaction planning/receipt model; actual privileged executor NOT_IMPLEMENTED and Windows validation NOT_EXECUTED.

**Decision:** `tooling/isolation-source/provision-disposable.mjs` is the canonical *offline deployment planner*, not a second application lifecycle manager. It references upstream v1.18.5 service names (`SbieDrv`, `SbieSvc`), minifilter altitude `86900` and KmdUtil semantics directly from upstream `SandboxieVS.nsi`/`my_version.h`/`kmdutil.c`. Planner requires pinned candidate payload, both SCM names ABSENT under interactive read-only host evidence, and a declared dedicated disposable Windows VM without account-bearing boxes or official Sandboxie. Output models seven installation stages, five receipt/path-guarded rollback stages and default `installationPermitted=false`. Ambiguous/failed receipts stop for manual reconciliation, no retries or service deletion from name-only evidence. CLI read-only and no Tauri/Client02 invocation.

**Proof:** nine pure Node-style JavaScript tests executed directly against GitHub source in the available V8 runtime and PASSED (9/9); fixture tests cover kernel/service order, blocked hosts, source integrity, target scope, partial failure, and prevention of false runtime acceptance. Full repository Node24 test runner, Windows PowerShell, signing, driver/service installation, rollback and Minecraft gameplay NOT_EXECUTED.

**Unresolved:** no Microsoft-signed custom driver, independently proved disposable VM, executable Windows provisioning adapter, service ownership ledger, active fork or crash attribution. Source-first continues; no blocking request for operator PC.

**Next ONE task:** implement the Windows-only, explicit-operator provisioning executor with signature/provenance preflight, durable per-step ownership receipts, and fail-closed rollback on a verified disposable test environment, keeping current Sandboxie and Minecraft 02 completely untouched.

## Owned engine Windows service namespace preflight — 2026-10-14

**Work:** prepare host-side activation admission source for the future app-owned Sandboxie-derived runtime. **State:** DONE for read-only source and authored tests; Windows observation NOT_EXECUTED.

**Decision:** add an embedded, read-only Windows SCM/CIM probe for the original upstream `SbieSvc` and `SbieDrv` names, plus strict Rust + TypeScript assessment states. Any registered name blocks owned activation because a name does not prove owner and can collide with official Sandboxie. Unknown/probe failure, noninteractive session, and even two absent service names remain blocked until independently proven signed and owned driver, dedicated host, IPC, compatibility and rollback. The active `OfficialSandboxieBackend`, box `MinecraftClient02`, launch behavior and persisted world/accounts remain untouched. No new provisioning service, privileged operations or configurable backend switch is introduced.

**Proof:** exact GitHub source review and strict backend/frontend contracts; four Rust host probe tests and three Vitest host parser tests added alongside previous candidate tests. No Rust compiler, Windows SCM, Node24 full suite or Minecraft execution for this revision: NOT_EXECUTED.

**Unresolved:** no signed/loaded owned driver, confirmed Windows service ownership, disposable host guarantee, fork packaging integration or migration. Generic service names are source-level known to conflict, not proof that an installed service is official.

**Next ONE task:** source-first implement an isolated Windows service/driver provisioning and rollback controller for an explicitly disposable environment, with version/source/signing validation and no activation route exposed to Client 02 until actual acceptance.

## Source-first development policy — active implementation, 2026-10-14

**Work:** implement the native app's owned engine source ahead of future Windows-only validation. **State:** ACTIVE for complete owned-engine source program; this batch's read-only candidate API is DONE as source, not yet compiled/accepted.

**Decision:** missing WDK/Windows/Git clone will no longer pause independently useful source engineering. The next source batches are in functional order: (1) read-only candidate manifest/SDK integration and Settings UI (this batch), (2) owned-provider activation admission and capabilities without using schema-6 Sandboxie evidence as universal truth, (3) disposable-machine-only driver/service provisioning and data-preserving rollback source, (4) host process membership and launch using the owned engine's own installation root rather than official Sandboxie paths, (5) independent installer/uninstaller/updater contract and four-client resource admission. Implement these in their existing owners and leave the working official pilot untouched. External compilation and test evidence remain an independent acceptance campaign, **not a prerequisite for source authoring**.

**This batch:** adds Rust `owned_isolation.rs` to parse `engine-provenance.json`, verify staged executable bytes against SHA-256, require 23 driver/service/DLL/helper/license/config paths, and fail closed for symlinks, duplicates, wrong upstream, absent files or fabricated runtime readiness. Adds read-only Tauri folder picker/inspection, typed frontend parser and Settings source-preview button. The active `OfficialSandboxieBackend` and existing launch/focus/public process schema remain unchanged; no new driver install or account/world state.

**Proof:** exact GitHub Local source/consumer static review; Rust tests (four cases) and frontend Vitest tests (three cases) AUTHORED but Rust/TypeScript/native Windows execution NOT_EXECUTED on this revision. The `sha2 = =0.10.8` dependency is already present in the project runtime-core family; Cargo lock and compilation must be generated/verified in a capable environment, not fabricated. This source-only outcome is not signed driver/engine acceptance.

**Unresolved:** genuine fork remote and Windows-native toolchain, driver loading/signature, own service IPC/box functionality, two-account stability, privacy/rollback and four-instance operation remain UNKNOWN/NOT_EXECUTED.

**Next ONE task:** implement the owned-provider activation and capability-selection source with a disjoint, disposable-only engine profile and no public Tauri state regression.

## Source-first native owned-engine candidate API — 2026-10-14

**Work:** build native desktop support for the eventual owned isolation engine, without blocking on Windows toolchain. **State:** DONE for bounded source additions; integration/runtime tests deferred.

**Decision:** add `owned_isolation.rs` as the source owner for strict read-only staged payload attestation in Rust, requiring pinned upstream v1.18.5 identity, 23 core/license/config artifacts, bounded SHA-256 checks, no symlinks/duplicates and credible build-stage provenance. Add exactly one read-only Tauri command and typed frontend bridge. Preserve `native_clients.rs` as active operation authority with `OfficialSandboxieBackend` unchanged; no alternate provider enabled, driver/service installs, credentials, box migration, or renamed runtime identity. Reuse pinned sha2 0.10.8 matching existing runtime-core family.

**Proof:** upstream pinned source and current desktop commands/consumer contracts inspected at exact Local parent. Four Rust fixture tests authored (integrity, tamper, missing license, false driver-load claim) but Rust compiler/SDK NOT_EXECUTED here; Tauri/frontend source assertions updated and structural guards reviewed. Do not promote a written Rust test to PASS.

**Unresolved:** artifact signature verification, actual Windows driver/service/IPC runtime and fork build, dual-account stability, license-aware distribution and four-instance proof NOT_EXECUTED; upstream source history pinned but no remote MIVUBI fork exists.

**Next ONE task:** source-first implement owned-provider activation boundary and disposable Windows driver/service deployment/rollback contracts with explicit operator-only gates, without switching active official Client 02 until validated.

## Private isolation engine artifact assembly — 2026-10-14

**Work:** construct a candidate standalone upstream-runtime payload from an actual successful pinned build, not scattered binaries. **State:** DONE for source implementation and executable fixture tests; not a working engine.

**Decision:** `tooling/isolation-source/assemble-engine.mjs` is the single payload-layout owner. It requires pinned Git checkout and real artifact-byte verification, checks each copied SHA-256, preserves x64/Win32 companions, helpers/config and upstream license files, and writes a `NOT-INSTALLABLE` provenance manifest in a new output directory. Optional `build-baseline.ps1 -Build -StageOutput` stages the payload only after successful compile and all validators; default behavior unchanged. No driver/service installation, user account/world access, custom kernel load or UI change.

**Proof:** exact tested JS source/test Git blobs `204b7d56cee4bb62ad92e77e718effa8f1060b9c` and `65b845ec30594a63d715dbaa7881cf2970e9459d`; seven actual Node22 fixture tests PASS (source/file verifiers injected, real file copying and checks tested). Native Windows MSBuild, PowerShell, real upstream package, driver signature/load and Minecraft gameplay NOT_EXECUTED.

**Unresolved:** source submodule not materialized here due Git DNS, separate fork remote not created, driver signing and idle crash diagnosis remain unproven.

**Next ONE task:** obtain real upstream source and execute unchanged Win32/x64 build, then stage its actual binaries for a disposable Windows-driver acceptance phase; do not install on account-bearing host.

## Pinned upstream Git submodule and offline-seed bootstrap — 2026-10-14

**Work:** materialize the genuine Sandboxie upstream revision as a Git tree dependency, ready for later independent engine source work. **State:** DONE for Gitlink/source acquisition route; actual submodule checkout, remote MIVUBI fork and native engine build NOT_EXECUTED.

**Decision:** record `.gitmodules` and a Gitlink `engine/isolation-upstream/Sandboxie` pointing to Sandboxie v1.18.5 commit `abd4c240031cfb46666daa74ca47ed4e48b561e4`, without copying GPL driver files into Tauri or changing current official launch. Extend `bootstrap-fork.mjs` with CLI `--local-seed` and explicit seed remote/tag/SHA/full-history/clean-checkout checks. An initialized submodule can seed a standalone full-history checkout, which keeps the same pinned branch and canonical upstream remote required by the existing Windows build preflight. No automatic GitHub push, service/driver installation, account or world change.

**Proof:** connected GitHub API accepted a real `160000` Gitlink and `.gitmodules` to the pinned upstream tag commit. Eight tests on actual Git fixture repositories in Linux Node22 PASS (including three new local-seed cases). Test/source file Git hashes from execution exactly match Git objects `daf8fa5561260f2cf27309320f584a1463e49cf6` and `014aa8c49bd33a9bd6ff0edd51ca122992b196e9`. No real source clone was executed here due to Git DNS failure; build/runtime NOT_EXECUTED.

**Unresolved:** real submodule materialization still needs GitHub network access, and publishing a new fork requires a GitHub fork/repository-creation capability not exposed by the connector. VS2022/WDK, driver signing/loading, two-client crash attribution, reboot/stability, and four-account gameplay remain unproven.

**Next ONE task:** populate the pinned upstream submodule and create the standalone checkout from it when Git is available, then compile unchanged Win32/x64 components with build/byte-hash attestation in a Windows-capable environment. Preserve official Sandboxie box.

## Pre-build checkout provenance verification — 2026-10-14

**Work:** read-only verification of the actual pinned isolation source checkout before any native build. **State:** DONE for source and Git-fixture checks; authentic Sandboxie clone and Windows compilation still NOT_EXECUTED.

**Decision:** add `tooling/isolation-source/verify-checkout.mjs` and tests, then require it from `build-baseline.ps1` after manifest validation and before MSBuild. The preflight rejects missing/symlinked or redirected paths, non-root worktrees, shallow history, HEAD/tag/branch changes, modified upstream remote and tracked/untracked changes. Bootstrap and preflight both retain the exact Sandboxie v1.18.5 commit `abd4c240031cfb46666daa74ca47ed4e48b561e4`. The documented manual checkout was updated to preserve the same baseline branch/upstream remote expected by the guard; no driver installation, box mutation, Microsoft login or schema change occurs.

**Proof:** six real disposable Git-history tests executed on Linux Git 2.47 / Node 22 and PASSED (6/6). Exact tested source and test SHA match newly authored Git blobs `0ef6781c4d28653a06a2def6c24aa6ea4b9ea44f` and `ccb86a8ff518f4fd7dfee59881aa15d75827ff2c`. Full Windows PowerShell, Node24, Rust, native SDK/WDK and Minecraft tests NOT_EXECUTED; GitHub direct clone remains blocked by DNS.

**Unresolved:** no published fork remote or actual upstream source checkout, no compiler-ready signed driver, no observed custom isolation runtime or resolved Client 02 idle crash.

**Next ONE task:** once genuine upstream Git access and a trusted Windows toolchain are available, perform pinned baseline checkout/build with preflight and artifact SHA-256 attestation. Keep installed official Sandboxie and account-bearing Client 02 untouched.

## Pinned full-history fork bootstrap — 2026-10-14

**Work:** replace the manual-only source-fork step with a tested, safe checkout bootstrap. **State:** DONE for local Git source bootstrap and tests; upstream clone/GitHub fork/native build NOT_EXECUTED.

**Decision:** `tooling/isolation-source/bootstrap-fork.mjs` pins public Sandboxie v1.18.5 SHA `abd4c240031cfb46666daa74ca47ed4e48b561e4`, clones full Git history to an isolated temporary sibling, refuses shallow history/wrong tag, creates branch `isolation/baseline-v1.18.5`, renames clone origin to upstream, and atomically promotes only into a missing destination. No existing folder overwrite, no automatic GitHub push, no driver install, no game or account mutation. CLI source/SHA are pinned; test-only injectable source/pin allows disposable local Git fixture execution.

**Proof:** actual Git 2.47 and Node 22 on Linux: five executable local-Git tests PASS, including history preservation and wrong pin/destination/symlink refusals. Exact tested script and test file were written to Git objects whose SHAs match `git hash-object`. Real `github.com` git clone from this execution environment fails DNS resolution, so an upstream checkout and remote fork have **NOT_EXECUTED** status. Rust/MSBuild/WDK absent; no Windows build, signed driver, Minecraft gameplay or stable soak proof.

**Unresolved:** creating a GitHub fork remote requires an available fork/create-repository operation (none connected currently). Fresh pinned upstream build, signing and crash attribution still outstanding. A reproducible private checkout is not a deployed independent engine and a Sandboxie-derived fork is not clean-room source independence.

**Next ONE task:** obtain an actual complete pinned upstream source checkout/fork using the new verified bootstrap route when repository access is available, then build the unchanged source in a trusted Windows development environment; do not mutate the official Client 02 box.

## Build artifact dangling-symlink regression — 2026-10-14

**Work:** correct a real filesystem-evidence bug in the owned isolation artifact verifier. **State:** DONE for the bounded fix.

**Decision:** `verify-artifact-files.mjs` must use `lstatSync` instead of `existsSync` to detect each path component. `existsSync` follows a symlink; for a dangling symlink it returns false, allowing a symlinked optional artifact to be mislabeled MISSING. Missing ordinary path components still remain legitimate; other filesystem access errors fail closed. No new provider, driver, service or game mutation.

**Proof:** actual regression first FAILED (5 pass, 1 fail: expected rejection missing) on the exact original verifier and tests by Git blob hash using Linux Node 22 and a metadata-validator-compatible shim. After the fix the same six filesystem tests PASSED (6/6). New revision must still be checked on Node 24/PowerShell and Windows; real upstream driver build, Minecraft acceptance and stable two-client soak NOT_EXECUTED.

**Unresolved:** source fork not available in connected GitHub operations, Windows/WDK build and signing not executed, Client 02 idle crash cause UNKNOWN.

**Next ONE task:** produce and evaluate actual pinned Sandboxie v1.18.5 unmodified build artifacts when Windows compilation is available; do not install a new driver on the existing account-bearing host.

## IsolationBackend launch dispatch v0.2 — 2026-10-14

**Work:** one internal provider route for isolated Client 02 inspection and explicit launch. **State:** DONE as bounded source refactor; execution/gameplay verification remains NOT_EXECUTED.

**Decision:** extend private `IsolationBackend` with `request_launch(executable,licensed)`, implemented only by `OfficialSandboxieBackend`. Public `request_sandbox_client_02` stays as the unchanged Tauri ABI compatibility entrypoint. The original official Windows launcher function body, lock, signed Education admission, fresh box inspection, persistent-box settings, `Start.exe` helper and ambiguous-timeout retry gap are preserved exactly; no automatic retry, new runtime selection, driver installation or profile migration.

**Proof:** GitHub tree source comparison confirms 5,030-character Windows launch body unchanged, exactly one public launcher, 78 TypeScript source-string consumer checks statically satisfied, and fake Rust timeout/argument-forwarding regression authored. Actual Rust Cargo, Node/Vitest, Windows and Minecraft runtime tests NOT_EXECUTED for this revision.

**Unresolved:** standalone Sandboxie-derived fork and Win32/x64 binary build/signing NOT_EXECUTED; Windows restart/sustained client stability and the Client 02 idle-crash owner remain UNKNOWN/NOT_EXECUTED.

**Next ONE task:** run targeted source/compiler verification when supported and reproduce the untouched upstream build, then design an owned provider implementation against this internal dispatch contract without touching existing accounts/worlds.

## Independent artifact-byte verification — 2026-10-14

**Work:** close the gap between a syntactically valid SHA-256 string and evidence from the actual artifact bytes. **State:** DONE for source and Node filesystem tests, Windows build still NOT_EXECUTED.

**Decision:** keep the current metadata validator and add `tooling/isolation-source/verify-artifact-files.mjs` as a second read-only gate. It rejects missing files falsely marked present, existing optional symbols falsely marked missing, mismatched size/hash, symlinked paths and files changing during verification. PowerShell runs this after `validate-baseline.mjs`, before reporting a successful artifact inventory; no compiled driver, signing, service, installation, account or world changes.

**Proof:** checked-in source/test content matched exact Git blob SHA. Five filesystem regression scenarios PASS on available Linux Node 22 using a baseline-compatible contract validator; metadata source contract and new PowerShell call were inspected. Node 24/Windows/PowerShell and actual upstream compilation NOT_EXECUTED. File consistency is not code provenance/driver trust or gameplay acceptance.

**Unresolved:** Windows unmodified Win32/x64 compilation, artifact collection, driver signing/load, fork creation and Client 02 idle crash attribution. Report-level metadata is not security or end-to-end gameplay proof.

**Next ONE task:** complete original unmodified upstream build in an appropriate Windows environment and capture validated SHA-256 artifacts. Keep the existing official Sandboxie client and account-bearing box unchanged.

## Isolation source report validation — 2026-10-14

**Work:** strict validation for pinned Sandboxie source/build evidence. **State:** DONE for source tooling and pure logic checks; native Windows build remains NOT_EXECUTED.

**Decision:** add an independent, side-effect-free `validate-baseline.mjs` manifest/report validator and six Node regression cases. Pin upstream commit, exact stage identities/order, critical Win32/x64 driver/service/DLL outputs, file hashes and per-stage outcomes. Missing required artifacts cannot be reported as a complete build; all outcomes keep driver loading, Minecraft gameplay and installer cutover explicitly unverified. The existing build script invokes the validator before opt-in compilation and after report output; missing Node fails before build. No driver/service/account changes.

**Proof:** source fetched from GitHub blobs and executed in the available V8 logic runtime: six pure validator regression scenarios PASS; actual `Local` upstream-baseline.json validates. An equivalent earlier prototype test suite also ran under available Node 22, but **new committed Node test file itself has not been run under Node 24**. Windows PowerShell, upstream MSBuild, artifact generation, driver signature/load and Minecraft gameplay remain NOT_EXECUTED.

**Unresolved:** complete Windows build proof, fork creation, driver signing, and Client 02 idle crash attribution. The fork source has not been produced or installed.

**Next ONE task:** execute the pinned, unchanged Win32/x64 Sandboxie source build when compatible build execution is available, preserving hashes, stage logs, and failed evidence; do not install a custom driver until an isolated acceptance plan is approved.

## Upstream baseline build preparation — 2026-10-14

**Work:** independently reproducible unmodified source baseline for planned `M-Isolation-Engine`. **State:** DONE for pinned build-only source tooling; GitHub fork creation and actual Windows compilation NOT_EXECUTED.

**Decision:** pin Sandboxie v1.18.5 at `abd4c240031cfb46666daa74ca47ed4e48b561e4`. Preserve full source history in a **separate** checkout/future GitHub fork rather than importing vendor kernel code into Tauri. Start from CI-confirmed Win32 support → x64 core → x64 driver, hash required binaries and source templates from `Installer/copy_build.cmd`. Keep all core dependencies until proven removable; defer SandMan/Qt UI and packaging. Noncommercial personal educational use does not remove GPL attribution or driver-signing obligations.

**Source changes:** `tooling/isolation-source/upstream-baseline.json`, `build-baseline.ps1`, `README.md` and tooling index. The build script is opt-in with `-Build`; default is manifest collection, no driver/service/box changes. Refuses a dirty/unpinned source checkout or writing the report into the vendor tree. No signing, runtime install, migration or official launch change.

**Proof:** upstream `v1.18.5` exact GitHub tag, `Sandboxie/ReadMe.md`, `.github/workflows/main.yml` and `Installer/copy_build.cmd` source crosschecked; static manifest path uniqueness and stage order reviewed. No connected GitHub fork/create-repository action was available. **Windows MSBuild, x86/x64 compilation, artifact SHA-256 collection, driver signing/loading, live Minecraft and resource tests NOT_EXECUTED**; source changes are not a built engine.

**Unresolved:** published source fork requires supported repository-creation/fork action; build environment/WDK/signing not verified; Client 02 idle crash owner UNKNOWN; existing credentials/worlds must stay unchanged.

**Next ONE task:** validate and execute pinned unmodified upstream baseline build in a permitted Windows build environment, recording hashes/compilation logs without installing any custom driver or touching the live client box. If the environment remains unavailable, continue source-level reproducibility and contract testing without reporting a build pass.

## Inspection-only IsolationBackend v0.1 — 2026-10-14

**Work:** internal isolation inspection provider. **State:** DONE for bounded source change; owned-engine fork and Windows proof remain ACTIVE.

**Decision:** private `IsolationBackend::inspect` and sole `OfficialSandboxieBackend` at the current `apps/desktop/src-tauri/src/engine/native_clients.rs` authority. Status, fast launch preflight and targeted signed-PID window checks all use the same provider. **Launch remains unchanged** through the official signed Sandboxie tools; no runtime engine switch, driver install, settings migration, destructive box operation, public Tauri schema or UI change.

**Proof:** pinned current GitHub source, TypeScript source consumer assertions adjusted, Rust fake-backend tests authored for timeout, incomplete evidence and zero-PID targeted proof. Relevant prior launch-admission and boxed identity regressions preserved. **Node/Vitest, Rust cargo/rustfmt, Windows Sandboxie and Minecraft tests NOT_EXECUTED** for this revision; compilation or gameplay success is NOT claimed.

**Unresolved:** Client 02 idle-crash cause UNKNOWN, reboot and sustained resource profiling NOT_EXECUTED; no owned engine build, signing, cutover, Client 03/04 implementation or data migration.

**Next ONE task:** plan and establish upstream-history-preserving Sandboxie v1.18.5 fork baseline and reproducible unchanged x86/x64 build evidence before further engine/runtime changes.

## Initial owned-isolation source batch — 2026-10-14

**Work:** app-owned isolation independent of an external Sandboxie-Plus installation, intended only for personal noncommercial educational use. **State:** ACTIVE. **Latest bounded result:** source-level inventory and design documents authored at current baseline; NO native engine code, signed driver, fork repository, host installation or Windows/Minecraft test executed in this batch.

**Decision:** Start by preserving official two-client pilot and extracting a Rust internal `IsolationBackend` boundary from the active `native_clients.rs` owner; initially only the official adapter is live. Fork remains Sandboxie-derived/GPL and is not independent source code. Goal is app-controlled deployment independent of official SandMan/installed Sandboxie only AFTER reproducible fork build, compatible signed driver, independent test, legal review and data-preserving cutover.

**Source anchors:** [Upstream component/license/build inventory](../docs/validation/owned-isolation-upstream-inventory.md) (Sandboxie v1.18.5 `abd4c240031cfb46666daa74ca47ed4e48b561e4`); [app-owned engine design](../docs/system/owned-isolation-design.md). Source baseline before this batch: `8f58f26b800fcd89188224efb862930b6f2e0ec9`.

**Proof:** reviewed pinned upstream tag, `Sandbox.sln`, `SandboxDll.sln`, `SandboxDrv.sln`, project dependencies, `LICENSE.Plus` / GPL / LGPL, and existing app owners via remote GitHub. No actual core build, REA binary execution, driver signing/loading, stable Minecraft reproduction or four-client result.

**Unresolved:** Current Client 02 idle-crash owner UNKNOWN; Windows reboot and continuous resource profile NOT_EXECUTED; private compiled source distribution and future commercial use require their own review; owned engine deployment, isolation semantics and coexistence/migration unproven. Upstream source-for-source capability is NOT runtime equivalence.

**Next ONE task:** Add a strictly internal read-only isolation adapter boundary in the current Rust desktop owner with official adapter parity and behavior-level source tests, without touching the live box or changing Tauri public schemas. Then stop and review the exact diff.

## ChatGPT continuation: selected fork direction — 2026-10-14

**Work:** two-client isolation fork investigation. **Source work ACTIVE;
local runtime campaign deferred.** The user chose "Fork atau engine isolasi
sendiri", requested REA (`morluto/rea`) to help, then requested a complete
repository handoff to continue in ChatGPT. This section is the current intent;
older Next entries below are historical and do not authorize automatic tests.

### User decision and current implementation

- Desired result: an isolation system integrated with the app, more stable,
  efficient and economical in resource/AI usage. Start with two clients;
  eventual four-client product ambition is unchanged, not implemented.
- The previous recommendation to integrate only the external official tools
  was not the user's chosen development direction. A narrowly scoped fork
  of Sandboxie core was subsequently proposed as the starting basis; exact
  component selection, repository layout and distribution design remain to
  be decided from source/license evidence. A complete rewrite from zero is
  not an established implementation requirement.
- The implemented app still uses official signed Sandboxie tools. No GitHub
  fork, imported upstream source, replacement driver/service/DLL, bundled
  dependency, REA installation or new engine was created in this session.
- Continue design and bounded source work in **ChatGPT + GitHub Local**.
  Do not require the operator's PC, new environment, installs or incremental
  machine tests to finish independently useful source analysis. Unavailable
  execution stays NOT_EXECUTED. The earlier Windows session does not imply
  the next ChatGPT session has Windows, local logs or REA tools.
- `main`, legacy VMware/App Sandbox/Guest Agent operations, existing
  account-bearing data, installer identity and public schemas remain protected.
  Fork research does not authorize a driver replacement, security-policy
  bypass, release publication, account automation or scaling to Client 03–04.

### Read order and exact references

1. Pin latest GitHub `Local`; read `AGENTS.md`, `GITHUB_RULES.md`, the
   [implementation map](../docs/system/implementation-map.md), then this section.
2. Read the [first-success and idle-crash report](../docs/validation/two-client-first-success-2026-10-14.md).
3. Inspect only the current backend/collector consumers identified below.
4. Inspect upstream licensing, component/build source and REA instructions
   at pinned references; recheck upstream HEAD before choosing a new baseline.

Handoff parent: `0152a5fa68543d28e8a01f82af481758afe65214`.
Upstream references observed on 14 October 2026:

| Reference | Pinned identity | Qualification |
| --- | --- | --- |
| Sandboxie source master | `43b629be6c17628e6298befccfec279774895ba5` | Source-analysis reference, not the installed binary identity |
| Sandboxie installed release tag v1.18.5 | `abd4c240031cfb46666daa74ca47ed4e48b561e4` | Remote tag ref; do not claim local build equivalence |
| REA main | `9630c8ff46533fe63ec0e06212d01545070d17f0` | Documentation/source reference, not an installed CLI version |

### Session reconstruction and proof boundaries

| Event / change | Exact source revision or evidence | Outcome |
| --- | --- | --- |
| Clean baseline fast-forward on Local | `2a5552518179e9c8fe6a4b27fb09a19457ad0f9d` | First preflight failed at two stale Compact Manager test assertions; startup stopped until corrected |
| Correct stale source assertions | `a8f4aa1bd6c4a3f3bdcaf37e3b68cc839b58270b` | Full pinned Windows preflight PASS, 115 desktop tests; one symlink test skipped |
| Fix Desktop x64 installation admission | `588046b3e989e6c1aa4a0737a085600b25b2a098` | Shared Registry32/64 preflight, constrained official Start AppID, quoted native launch; full preflight PASS, 116 desktop tests; one symlink test skipped |
| Official prerequisites | Operator actions + signed-file observations | Store Education removed manually after world-export decision; official Desktop 1.26.3200.0 and Sandboxie Plus 1.18.5 installed; entitlements operator-confirmed |
| Persistent Client 02 setup | Explicit official Sandboxie tools and Manager UI | MinecraftClient02 created; existing boxes/data preserved; initial dual responsive windows observed |
| Initial Microsoft login failure | User screenshot and manual differential | Boxed 7q6ch / 0x80070424 after email before password; same second account succeeds outside box, Client 01 playable |
| Broker diagnosis | Ignored native C++/WinRT probes | Host provider discovery/TokenBrokerInternal activation succeed; standard box returns 0x80070424 despite host service present/running |
| Approved compatibility configuration | Applied at `ef214ff60239ce88c02a479cc62afd43b8d015b8` | App Compartment + OpenCOM + DropAdminRights; actual game-box native provider probe exit 0; one manager launch, password stage observed |
| First basic gameplay success | Operator reports; recorded through `54654eca6d9c74d2c21ac3098e3cae89b71cb85e` | Distinct accounts, simultaneous playable worlds, permitted multiplayer and distinct accounts after Client 02 reopen: PASS by operator report |
| Sustained observation | Operator started manual observation | Client 02 later crashed while idle; only previous native process remained at inspection; no matching Minecraft Application event in queried window |
| First-success/crash report | `0152a5fa68543d28e8a01f82af481758afe65214` | Redacted report published; crash owner UNKNOWN, stability FAIL by operator report |

Working workaround remains `NoSecurityIsolation=y`, appended `Template=OpenCOM`
and `DropAdminRights=y`. AutoDelete, AutoRemove, OpenCredentials and
OpenProtectedStorage were verified OFF. Existing templates were retained.
The operator explicitly accepted the reduced isolation/host COM access for
this two-account test. That consent is not a blanket future security exception.
An account-free MinecraftBrokerDiagnostic box was preserved; no game or
account was launched there. Host credentials/tokens were never copied.

The report owns detailed software/hardware observations and screenshot
numbers. The screenshot lacks PIDs/headers; CPU-bound rendering, inefficient
GPU use and Sandboxie overhead are hypotheses, not diagnosed causes. The
two-hour Application query found no matching Minecraft record, not proof
that the crash did not happen. Windows restart was explicitly deferred.
A complete 30–60-minute resource profile is NOT_EXECUTED: the proposed
background recorder had not started when the turn was interrupted. Basic
success is not full two-client acceptance, and never four-client acceptance.
Full source preflight is scoped to the two tested commits above, not this
documentation revision, an upstream fork or any later source change.

### REA use and economical investigation

- REA CLI was not found on PATH and no REA MCP analysis result was produced.
  The [older REA-aligned audit](../docs/validation/rea-source-audit-2026-10-13.md)
  was source comparison, not executed REA decompilation/runtime evidence.
- Read the [pinned REA skill](https://github.com/morluto/rea/blob/9630c8ff46533fe63ec0e06212d01545070d17f0/.agents/skills/reverse-engineer-anything/SKILL.md).
  Its route is ordinary source tools for a complete source repository; REA
  for shipped-artifact, binary or supported runtime claims. Use the actual
  connected tool schemas, not names assumed from newer documentation.
- REA is a development tool, not a game dependency or resident authority.
  Native analysis requires an actually available provider such as Ghidra,
  Hopper or IDA; provider/tool availability in the next environment is UNKNOWN.
  Installing a skill alone does not connect MCP or supply those engines.
- For an artifact task: bind one explicit binary and its SHA-256, ask one
  question, request summaries first, follow one function/call path, retain
  Evidence IDs/digests and reuse results. Do not repeat broad decompilation
  or read entire repos to manufacture certainty. Record coverage and UNKNOWNs.
- Prefer source plus symbols/build artifacts we own when sufficient. No
  arbitrary instrumentation/injection into Minecraft, authentication capture,
  game patching or token-store analysis is part of this handoff.

### First source batch and subsequent requirements

**Next concrete source task:** produce a pinned Sandboxie component/license/
build/dependency inventory and select the smallest coherent fork boundary.
Complete this remotely; do not wait for Windows or REA installation.

| Batch | Required result | Evidence / dependency |
| --- | --- | --- |
| 1 — source inventory | Trace SbieDrv, SbieSvc, SbieDll/LowLevel, Start/SbieIni, COM helpers and consumers; identify the necessary core and preserve upstream provenance | Inspect `Sandboxie/core/{drv,svc,dll,low}`, `Sandboxie/apps/`, `Sandboxie/common`, project files and per-component licenses at one SHA |
| 2 — bounded design | Define app-to-engine control boundary, persistence/rollback, failure semantics and chosen fork repository/layout; trace existing owners before proposing a new module | Core GPLv3, QSbieAPI LGPL, SandMan custom terms require actual selected-file review; host-project/distribution compatibility remains UNKNOWN; no wholesale rebrand/relicense assumption |
| 3 — reproducible build | Document and later build an unchanged upstream baseline, with version/hash/symbol provenance before behavioral patches | Upstream MSBuild projects/CI are authority; VS2022, v143/MFC, matching SDK/WDK and Win32-before-x64 build dependencies need verification for the selected SHA; WDK/MFC availability was not established by app preflight |
| 4 — crash attribution | Define manual idle/native/boxed and foreground/background/minimized comparisons; when execution is available, identify first exception/module and affected owner | No attributed crash or replayable automatic reproducer exists yet; private dump/ETW data stays local and requires redaction before any shared metadata |
| 5 — one correction | Change one justified owner, retain account/world data, test affected consumers and compare against unchanged baseline | Measure matched scene/settings/resolution/frame pacing; CPU/thread work, frame time, RAM/commit, GPU engine/VRAM and crashes; no invented FPS/RAM target |
| 6 — integration/release review | Integrate proven engine behavior with existing app owner; later review installer coexistence, signed driver/service deployment, update and uninstall preservation | Compile success is not driver-load, login or performance proof; production signing, packaging and publication are separate decisions and remain NOT_EXECUTED |

Upstream build references:
[component guide](https://github.com/sandboxie-plus/Sandboxie/blob/43b629be6c17628e6298befccfec279774895ba5/AGENTS.md),
[core build guide](https://github.com/sandboxie-plus/Sandboxie/blob/43b629be6c17628e6298befccfec279774895ba5/Sandboxie/ReadMe.md).
Cross-check exact project/CI source because prose can lag. Do not import
upstream workflows into this repo or enable the protected main branch.

Existing integration owner is `apps/desktop/src-tauri/src/engine/native_clients.rs`,
with `tooling/acceptance/windows/collect-sandboxie-feasibility.ps1` and the
typed frontend bridge as consumers. Runtime/VM resource policy remains a
different inactive route; do not apply its VM CPU/RAM limits to this pilot.
Keep source investigation outputs under docs/validation and current intent
here; do not create another lifecycle authority or duplicate task ledger.

### Evidence portability and restart prompt

Ignored local metadata/probes remain under `workspace/runs/` and
`workspace/scratch/` on the earlier Windows checkout. They are not uploaded
or guaranteed accessible to ChatGPT. The report and this handoff are the
portable redacted record. No names, emails, account/world identifiers,
tokens, license codes, raw configuration or crash dumps belong in Git.

Use this prompt in the next ChatGPT conversation:

> Lanjutkan MIVUBI-STD/M-Minecraft-Emulator branch Local. Pin HEAD terbaru,
> baca AGENTS.md, GITHUB_RULES.md, implementation-map dan bagian paling atas
> planning/development.md. Saya memilih arah fork/engine isolasi sendiri,
> dengan REA sebagai alat investigasi bila relevan. Mulai dari inventaris
> komponen, lisensi dan build Sandboxie pada SHA yang dipin, lalu usulkan
> batas fork terkecil. Kerjakan source lewat ChatGPT + GitHub; jangan meminta
> localtest sebagai prasyarat analisis. Pertahankan pilot dua client dan semua
> data akun/world; basic gameplay sudah berhasil menurut operator tetapi
> Client 02 crash saat idle. Penyebab crash UNKNOWN, restart dan profil
> 30–60 menit NOT_EXECUTED. Jangan ubah main atau mengklaim fork/REA sudah
> dijalankan. Catat hasil pada pemilik dokumentasi yang ada.

## First success reported; idle crash and integration discussion — 2026-10-14

- **Current request:** publish the redacted first-success report to Local, then discuss simpler Sandboxie integration and performance/crash causes before implementing further changes. See [full runtime report](../docs/validation/two-client-first-success-2026-10-14.md).
- **Confirmed basic success:** operator-reported distinct-account login, simultaneous playable worlds, permitted multiplayer and account separation after Client 02 reopen. Source preflight remains pinned to `588046b3e989e6c1aa4a0737a085600b25b2a098`; machine compatibility was applied at `ef214ff60239ce88c02a479cc62afd43b8d015b8`.
- **Subsequent failure:** operator confirms Client 02 crashed while idle. Only the prior native game process remained at subsequent inspection; no matching Minecraft Application event was found in the queried window. First causal owner remains UNKNOWN. Sustained stability is FAIL by operator report; a completed 30–60-minute resource profile and deferred Windows restart persistence remain NOT_EXECUTED. The prior turn was interrupted before a continuous resource collector was launched.
- **Performance evidence:** cropped screenshot has unequal instantaneous CPU/memory/rightmost percentage readings but no PIDs/headers; it cannot establish which row is boxed, CPU-bound rendering or a GPU fault. Hardware observed: i7-14700F / RTX 3070 / Windows 11 build 26100. No new FPS/RAM threshold.
- **Discussion boundary:** prefer evaluating integration through existing official signed Sandboxie tools and the current backend owner before a custom engine/driver fork. Bundling, licensing, onboarding box mutations and performance changes are proposals only. Account-bearing data, public schemas, installer and Client 03–04 remain outside this report.
- **Next:** discuss matched native/boxed workload and idle-crash attribution before selecting one bounded implementation change; no automatic relaunch or restart.

## Two-client login repair and operator gameplay evidence — 2026-10-14

- **Active user request:** repair Client 02 login through usable two-account gameplay. The operator explicitly approved Application Compartment/OpenCOM/DropAdminRights for the two-account test and closed Client 02 normally; fresh inspection confirmed only the native game remained before configuration and restart.
- **Executed candidate evidence:** an ignored C++/WinRT probe built with installed Windows SDK headers performs Microsoft provider discovery only. It passes on the host, returns `0x80070424` in MinecraftClient02, and passes in the separate account-free `MinecraftBrokerDiagnostic` box with `NoSecurityIsolation=y`, `Template=OpenCOM` and `DropAdminRights=y`. TokenBrokerInternal activation also passes in that diagnostic compartment. These are compatibility probes, not signed-in game evidence.
- **Adapter qualification:** the .NET probe terminated during provider discovery in the diagnostic mode, so that result is not treated as a Minecraft failure or acceptance verdict; the SDK C++ probe distinguishes the candidate's successful native WinRT path. SbieApi_GetMessage was refused with ACCESS_DENIED; no elevated retry or broad/raw authentication log capture was performed.
- **Applied configuration:** on source HEAD `ef214ff60239ce88c02a479cc62afd43b8d015b8`, appended only the installed official OpenCOM template and set NoSecurityIsolation/DropAdminRights on MinecraftClient02. Existing templates were preserved and AutoDelete/AutoRemove/OpenCredentials/OpenProtectedStorage were verified OFF. Native C++ Microsoft provider discovery now returns exit 0 in the actual game box, replacing the prior `0x80070424` failure. One launch was requested through Compact Manager after Check status reported Ready to open; two responsive game windows were observed. No host token copy or account automation. A metadata-only backup of affected keys and results remains in ignored local evidence. The account-free diagnostic box was preserved.
- **Material tradeoff:** Application Compartment bypasses several standard security-isolation mechanisms; OpenCOM opens host COM/RPC infrastructure. File/registry virtualization is not a security boundary or independent Windows account. See [vendor mode documentation](https://sandboxie-plus.github.io/sandboxie-docs/Content/NoSecurityIsolation/). User consent for this changed isolation mode was explicit; legal supporter/usage eligibility remains operator-provided, not verified by a short probe.
- **Observed login progress:** the restarted boxed game's Microsoft dialog reached Enter password, passing the email-stage location of the previous failure. Post-launch Check status displayed Window detected. No authentication input was automated and no account identifier was recorded in the handoff.
- **Operator-confirmed acceptance:** after the approved configuration change, the user confirms successful Client 02 login, two distinct accounts with simultaneously playable worlds, permitted multiplayer with both clients playing together, and preserved distinct accounts after saving/closing/reopening Client 02. These results are PASS based on explicit operator reports, not automated account inspection or direct agent gameplay observation. No account/world identifiers were collected. Two responsive game process/window candidates were separately observed by the agent.
- **Next:** operator chooses when to restart Windows, then checks both clients retain their respective accounts and remain playable; also complete 30–60 minutes of concurrent use with response/crash/resource observations. Windows-restart persistence and sustained-use acceptance remain NOT_EXECUTED. The login repair and basic two-client gameplay are successful by operator report, but the full localtest is not complete. Full source preflight remains tied to `588046b3e989e6c1aa4a0737a085600b25b2a098`; this configuration/handoff change does not create new exact-HEAD preflight evidence.

## TokenBroker activation differential — 2026-10-14

- **User-approved continuation:** narrow diagnosis of the existing Client 02 sign-in failure; no account/configuration mutation or new provider implementation.
- **Executed decisive probe:** a machine-local Windows SDK/native WinRT probe requests only factory activation and Microsoft provider discovery, never account enumeration, login or tokens. `FindAccountProviderAsync` succeeds on the host but its asynchronous operation fails in `MinecraftClient02` with `0x80070424`. Factory acquisition itself succeeds. A separate `RoActivateInstance` probe for `Windows.Internal.Security.Authentication.Web.TokenBrokerInternal` succeeds on the host and fails in the box with the identical HRESULT.
- **Service attribution:** installed Windows runtime registration maps TokenBrokerInternal to runtime server `TokenBroker`, whose ServiceName is `TokenBroker`; that host service is running. This identifies failed broker activation across this Sandboxie boundary, rather than an absent host service. It does not identify the exact internal Sandboxie call or establish a compatible independent-account workaround.
- **Probe validity:** initial PowerShell projection crashed inside the box; an initial native harness used an incorrect IAsyncInfo slot. Those results are excluded. Corrected native ABI matched the installed Windows SDK IInspectable/IAsyncInfo layout and reproduced the actual HRESULT without credentials. Probe source/binaries and metadata remain ignored machine-local artifacts, not product code or uploaded account data.
- **Outcome:** the login-stage pilot remains unsuccessful on Sandboxie Plus 1.18.5 / Education Desktop 1.26.3200.0. No safe verified fix is claimed; OpenCredentials/OpenProtectedStorage, host broker registration, sandbox data and games were not changed. Higher gameplay/network/persistence/four-client acceptance remains unproven.
- **Next:** assess a documented vendor compatibility fix against this credential-free activation reproducer before another manual sign-in; opening host account resources or selecting a different isolation architecture needs a separate explicit decision.

## Client 02 Microsoft sign-in failure — 2026-10-14

- **Current acceptance outcome:** two process/window candidates were observed, but the user reports Client 02 sign-in fails after email submission and before password with tag `7q6ch`, HRESULT `0x80070424` (`ERROR_SERVICE_DOES_NOT_EXIST`). The same second account signs in successfully outside Sandboxie; Client 01 login and a playable world are operator-reported successful. Independent concurrent licensed gameplay is NOT ACCEPTED; multiplayer, persistence and sustained-use acceptance remain NOT_EXECUTED.
- **Read-only diagnosis:** host TokenBroker and Microsoft Account Sign-in Assistant are present/running; AAD BrokerPlugin is installed. Explicit boxed `sc.exe query` probes for TokenBroker and wlidsvc both returned exit 0 through signed Sandboxie Start.exe /wait. Therefore the HRESULT does not identify either service as absent; exact failing service/activation remains UNKNOWN. No raw authentication events, identifiers, screenshot, tokens or world contents were saved to Git.
- **Inference:** failure is localized to this account's authentication flow under Sandboxie 1.18.5, not a proven general account/license failure. Microsoft documents WAM as an OS-integrated broker; upstream Sandboxie issue [4681](https://github.com/sandboxie-plus/Sandboxie/issues/4681) describes another Microsoft login failure in a standard box and remains open, but is not proof of the identical Minecraft defect or a fix. Release [1.18.6](https://github.com/sandboxie-plus/Sandboxie/releases/tag/v1.18.6) does not document an Education/WAM authentication fix in its published notes.
- **Preserved boundary:** configuration, games, worlds and accounts were not reset; OpenCredentials/OpenProtectedStorage remain OFF. No broker re-registration, host token sharing, game patch, speculative template change or automatic upgrade was performed. Standard Sandboxie isolation is not a separate Windows account/session. No verified safe workaround has been established for this test.
- **Next:** identify the exact failed service/broker activation using a narrowly redacted diagnostic before proposing a compatibility change; do not scale to Client 03–04 or treat two windows as successful sign-in. Any approach that exposes host account state requires a separate isolation review.

## Desktop x64 installation admission — 2026-10-14

- **Latest executed milestone:** full Windows `DEV.cmd preflight` PASS at `588046b3e989e6c1aa4a0737a085600b25b2a098` (116 desktop tests, frontend build, Tauri/runtime checks, runtime tests and rustfmt; one symlink test skipped). Developer UI subsequently completed Check status, selected the installed signed EXE, applied the user's licence confirmation and requested Client 02 exactly once. Two responsive Education HWND/PID candidates were observed concurrently, one outside the selected box and one inside `MinecraftClient02`; the second Education loading screen rendered. No account or world acceptance is claimed.
- **Session recovery:** removing PSModulePath alone did not persist through developer startup; a temporary metadata-only diagnostic confirmed the app still inherited Codex runtime module paths. Explicitly setting the developer session's PSModulePath to the installed Windows PowerShell system/module directories resolved actual UI Check status. Temporary debug instrumentation was removed. Global module paths and credentials were unchanged.
- **Observed runtime:** user installed Sandboxie Plus 1.18.5 and official Microsoft-signed Education Desktop 1.26.3200.0 after manually removing Store Education. One responsive Education window is a candidate only; no sign-in/world proof. The explicitly requested new persistent `MinecraftClient02` box has verified enabled/empty membership and AutoDelete/AutoRemove/credential-bypass OFF. Existing DefaultBox and game data were preserved.
- **First wrong source owner:** native launch and Client 02 preflight read Registry32 only and rejected the official x64 install's known-folder-path Start AppID. One shared preflight now accepts exactly one valid registration across Registry32/Registry64 and either the existing simple ID or a constrained GUID-relative Win32 path. Native Explorer receives one quoted argument. Store conflicts, ambiguous registration, interactive session and Client 02 signed-image checks remain fail-closed.
- **Executed correction evidence:** actual shared PowerShell preflight passed against the x64 installation; 116 desktop Vitest tests and Tauri all-target Cargo check passed in the corrected working tree. Full correction-commit preflight remains pending until recorded separately. Regression covers GUID path, quotes/command text/traversal rejection, both registry views and shared launch consumers.
- **Check status diagnosis:** inherited Codex PowerShell 7 PSModulePath caused Windows PowerShell Security module type-data collision. Reproduced with the exact embedded stdin transport; the same transport succeeded with PSModulePath removed from that child environment. Correct only the developer session environment; no global settings or product module-loading bypass.
- **Prior exact-SHA evidence:** full Windows `DEV.cmd preflight` PASS and responsive Compact Manager startup at `a8f4aa1bd6c4a3f3bdcaf37e3b68cc839b58270b`; one symlink test skipped for absent privilege. Metadata remains in ignored workspace/runs. This evidence does not certify this later source correction.
- **Next:** operator manually signs into two distinct entitled accounts and opens a playable world in each existing game window. Independent accounts, playable worlds, multiplayer, restart persistence and sustained use remain NOT_EXECUTED. Keep both games and the developer UI open for this handoff; do not request another launch while boxed membership is occupied.

## Windows localtest resumed — 2026-10-14

- **Authorization:** user resumed localtest through two licensed playable sessions, native Client 01 plus persistent Sandboxie Client 02; sign-in and Windows restart remain manual. User reports both Education accounts and applicable Sandboxie licensing available.
- **Baseline:** clean Windows `Local` at `2a5552518179e9c8fe6a4b27fb09a19457ad0f9d`. `DEV.cmd preflight` executed and recorded FAIL at desktop Vitest before Rust/build completion. The metadata-only manifest remains in ignored workspace storage.
- **First wrong owner:** two stale assertions in `apps/desktop/test/compact-manager.test.ts`: optional-call text no longer matched guarded focus restoration, and an issue-object assertion required obsolete single-line formatting. Correct the assertions to require the current guarded fallback and tolerate object whitespace; product behavior is unchanged.
- **Executed evidence:** all 115 desktop Vitest tests passed on Windows with Node 24.21.0/npm 11.19.0 after this test correction in the working tree. This is not a committed-SHA full preflight or gameplay verdict.
- **Next:** run `DEV.cmd preflight` on the clean correction commit, then developer startup only after PASS. Minecraft/Sandboxie installation, two windows, account isolation, worlds, multiplayer and reboot persistence remain NOT_EXECUTED for the resumed test.
- This active resumption supersedes historical PAUSED localtest entries below; their prior evidence remains revision-scoped history.

## Pre-localtest operator-guide and ownership reconciliation — 2026-10-14

- **Scope:** source/docs-only correction for the approved native + Sandboxie two-client pilot. The mounted entry point is `apps/desktop/src/main.ts` → `CompactManagerApp.svelte`; sandbox inspection cannot authenticate Client 01.
- **Confirmed defects:** `docs/validation/native-pilot-localtest.md` still instructed obsolete UI actions and used `REFRESH STATUS`. `docs/system/implementation-map.md` named unmounted legacy VMware UI/overlay modules as though they owned active navigation.
- **Change:** align the existing Windows acceptance procedure to Check status → Set up/Browse/licence → Minecraft 01 Open → Minecraft 02 Open → Check status → actual account/world observations; correct active/legacy ownership labels. Extend the existing Compact Manager regression to cover the second operator document and active source map; no new verifier, provider, IPC or installer route.
- **Proof:** REMOTE_GITHUB exact-ref code/guide review and authored static/Vitest assertions; Vitest/Svelte/Rust/Windows/Sandboxie/Minecraft **NOT_EXECUTED** in this batch. No REA binary-analysis output claimed.
- **Next:** upon approved Windows resumption, run `DEV.cmd preflight` on the exact clean `Local` SHA, then `DEV.cmd dev` only if it passes.

## Native Sandboxie pre-localtest operator route alignment — 2026-10-14

- **Pre-localtest audit:** `Local` includes pinned `apps/desktop/src-tauri/Cargo.lock` and active Svelte `CompactManagerApp.svelte`. `tooling/windows-toolchain/dev.ps1` provides native `DEV.cmd preflight` (exact clean Local SHA, pinned toolchain, npm ci/source tests) and `DEV.cmd dev` (Tauri developer UI); native NSIS packaging is intentionally blocked by `PACKAGE_BLOCKED_NATIVE_FEASIBILITY`.
- **Confirmed documentation defect:** the active Sandboxie procedure still told operators to click obsolete `Launch isolated Client 02`, `Refresh both clients`, `Focus Client 02` and `Place Left/Right` controls. Current UI uses Check status, Set up, Open, Switch to and contextual Move window. The test sequence also missed the required initial Check status before a prepared Client 02 can be opened.
- **Fix:** align the single existing active Sandboxie pilot document with mounted control labels, exact-SHA native preflight, correct Check status → Set up/EXE/licence → Open → Check status flow and manual licensed gameplay evidence; do not alter frontend/backend or unblock legacy installer. Add one desktop source/guide regression.
- **Proof:** REMOTE_GITHUB exact-source/static route inspection only on the current new SHA; Node24/Vitest/Svelte/Cargo/Rust, Windows actual UI, Sandboxie Plus licensing/compatibility and Minecraft gameplay remain NOT_EXECUTED. No claim that UI/system is fully correct before preflight.
- **Next:** execute `DEV.cmd preflight` at the same committed Local SHA when native Windows testing is resumed, then only if it passes launch `DEV.cmd dev`.


## Focus/Move refusal guidance and stale-status regressions — 2026-10-14

- **Verified existing safety:** the active UI's Focus and Move error branches already invalidate the last Client 02 PID/HWND observation, mark any previous inspection as historical, preserve the affected instance's error for View issue, and release the busy guard. Explicit Check status remains the recovery route; no poller or automatic retry is needed.
- **Concrete UX mismatch:** all Move failures were described as requiring a window restore, while Rust may instead refuse stale process identity, changed Sandboxie membership or untrusted signed-image evidence. Error guidance now says to Check status first, and conditionally restore Minecraft if maximized/minimized.
- **Verification:** six source-extracted Focus/Move IPC-mock scenarios executed in V8 at parent HEAD `495f25b783d9` and passed; targeted Vitest source-contract regression authored. Run the same mock check on the committed SHA before asserting its outcome. Node24/Vitest/Svelte/Cargo/Windows/Minecraft remain NOT_EXECUTED; Windows localtest PAUSED.
- **Next:** stop this bounded failure-path change after exact-head source review; actual full toolchain and Windows gameplay remain a separate proof boundary.


## Fresh Focus/Place uniqueness after a process changes — 2026-10-14

- **Confirmed mismatch:** the active frontend `focusCandidate` requires exactly one isolated game candidate, but Rust `verify_fresh_focus_target` previously accepted any matching target among a *newly larger* boxed-candidate set. A second boxed game process appearing between Check status and Focus/Place was not rejected, even though the original PID/FILETIME/HWND was still live.
- **Fix:** require the newly collected Rust snapshot to have exactly one isolated candidate and one visible isolated candidate, on top of its existing interactive session, verified membership, signed image and process/window ownership checks. Both Focus and Place use the same Rust owner. A native outside-box candidate remains allowed.
- **Regression coverage:** extend the existing Rust fixture with a late second boxed candidate without a window, then with a visible window, and a separate outside-box native candidate; parse every constructed snapshot to keep test evidence internally consistent. Add an accompanying source-contract assertion to the native bridge tests.
- **Proof ceiling:** REMOTE_GITHUB exact-source inspection and test source authored. Cargo/Rust, Vitest/Svelte, real Windows/Sandboxie, licensed Minecraft sign-in and multiplayer remain NOT_EXECUTED. Windows localtest remains PAUSED.
- **Next:** review committed source and verify structural contracts; do not claim hardware or four-client acceptance.


## Pending executable selection projection — 2026-10-14

- **Verified UI inconsistency:** while `busy === "select"`, Client 02 `rowPresentation` could still project `Ready to open` and an `open` action based on the previous executable/licence state. The mounted button was globally disabled by `Boolean(busy)`, so the issue was misleading presentation rather than bypass of the launch admission guard.
- **Change:** one narrowly scoped branch in existing `compactManager.ts`: for Client 02 only, show `Selecting…` with null action and null move eligibility during the file dialog. Existing source tests now cover old-path READY → picker pending → different-file unlicensed Setup required → licensed READY, no observation, and an ambiguous launch issue.
- **Backend audit:** `native_clients.rs` validates the selected executable basename/path, file existence, official Windows Desktop registry/registered Start app, signed product identity and current Sandboxie box state on launch. No new manager, filesystem mutation, Tauri command or account automation required.
- **Proof:** exact source inspection and targeted regression authored, with optional V8 direct projection tests if actually executed; Node24/Vitest/Svelte/Rust/Windows/Minecraft test execution remains NOT_EXECUTED and localtest PAUSED.
- **Next:** stop here for this source owner unless another concrete source-contract defect is found; do not claim G0 or game-session success.


## Executable-picker error provenance — 2026-10-14

- **Source finding:** successful `selectMinecraft()` kept its earlier file-picker error visible. Cancel already preserved it appropriately; launch/inspection failure must also be preserved when a file is selected.
- **Correction:** optional `UiIssue.origin = "executable-picker"` set solely by file-picker catch; pure `shouldClearPickerIssue` predicate clears only that error after a non-empty picker selection. No free-form Rust error classification or backend changes. Selecting a different path still resets the existing licence confirmation.
- **Proof:** exact GitHub source review, authored Vitest/static regressions, bounded V8 predicate checks. Full Node24/Vitest/Svelte/Rust/Windows/Minecraft execution remains NOT_EXECUTED and localtest PAUSED.
- **Next:** inspect committed source and optional V8 mocked-picker behavior, then stop; no imaginary G0 PASS.


## Inline Move navigation revision hardening — 2026-10-14

- **Confirmed first wrong owner:** `apps/desktop/src/CompactManagerApp.svelte`. The inline Client 02 `Move window` control wrote `detailMode = "move"` directly, without increasing the UI navigation revision that protects against late IPC responses. A pending Focus request could later reject and hijack the newly selected panel, because it still matched the old revision.
- **Patch:** route that one Move detail action through a guarded component function that checks Client 02 panel eligibility, increments `navigationRevision`, and changes the mode. No new state machine, dependency, IPC, runtime process, or provider is introduced. Add a focused source regression.
- **Proof:** REMOTE_GITHUB exact-source review and regression assertion authored; separately identify any V8 mock execution if performed. Node24/Vitest/Svelte/Rust/Windows/Minecraft acceptance is still NOT_EXECUTED, and localtest remains PAUSED.
- **Next:** only further source-proven state/action defects, or exact-SHA compiled checks when supported execution becomes available.


## Cross-client expanded detail isolation — 2026-10-14

- **Source finding:** isolated Check status could close a native Client 01 issue panel because it checked only shared `detailMode`. An incoming issue could also auto-replace the other client's currently open panel.
- **Fix:** Client 02 inspector only closes an expanded Client 02 issue; error auto-open requires an empty panel or the same instance. Both client errors remain accessible via their own View issue controls.
- **Proof:** GitHub exact-source/consumer checks and regression assertions authored; no Node24/Vitest/Svelte/Windows/Minecraft execution. Windows localtest remains PAUSED.
- **Next:** verify source-level cross-client scenarios; avoid unsupported source execution claims.


## Independent Client 01/02 UI feedback — 2026-10-14

- **Source defect:** a single `issue`/`notice` value was shared between both rows. Client 02-only Check status erased Client 01's unresolved native launch feedback, while native Open erased Client 02's error/notice. The Client 02 inspection also projected a misleading Checking status onto native Client 01.
- **Fix:** retain one global in-flight operation guard, with independent temporary feedback keyed by Client 01/02 in the mounted Svelte shell. All relevant actions clear/update only their own instance. The Client 02 Check status displays Checking only on Client 02.
- **Proof:** REMOTE_GITHUB exact-source review and targeted regression assertions authored. Full Node24/Vitest/Svelte/Tauri/Rust/Windows/Minecraft remains NOT_EXECUTED; Windows localtest is paused.
- **Next:** verify available feedback scenarios without a real Minecraft host; no new provider or Client 03–04 features.


## Asynchronous UI outcome versus newer navigation — 2026-10-13

- **Confirmed source race:** UI navigation/detail controls remain usable while IPC operations are pending. Client 02 Open/Move success unconditionally called `closeDetails()`, which could collapse a different panel opened after the request. Error callbacks unconditionally chose the issue panel, replacing newer Settings/contextual navigation. A cancelled executable picker cleared the previous issue even without a successful selection or renewed inspection.
- **Fix:** one ephemeral `navigationRevision` inside the existing Compact Manager shell; capture it when each IPC request begins. Preserve real operation notice/issue while guarding late panel close/auto-expand and post-picker detail changes against subsequent user navigation. Do not clear unresolved issues when file selection is canceled.
- **Proof:** REMOTE_GITHUB exact source/consumer contract review and regression assertions authored. No Node24/Vitest/Svelte/Tauri/Windows/Minecraft execution; Windows localtest remains PAUSED. No engine, Sandboxie, account or installer modification.
- **Next:** continue only narrowly reproducible source-level issues; use a genuine runtime environment for full source/game acceptance when it becomes available.


## Compact Manager issue/detail panel precedence — 2026-10-13

- **Confirmed source issue:** Client 02 template selected its issue branch whenever `issue?.instance === "02"`, overriding explicit `detailMode = "setup"` or `"info"` from the supported UI navigation while a previous error persisted.
- **Fix:** render the issue branch only when `detailMode === "issue"`. Keep issue state intact for the existing `View issue` action; preserve existing backend admission and ambiguity/UNKNOWN semantics. Regression assertions cover setup/move branches and the action returning to issue details.
- **Proof:** REMOTE_GITHUB source branch review and authored regressions. Node24/Vitest/Svelte/Tauri/Windows/Minecraft execution on the new exact HEAD remains **NOT_EXECUTED**, with Windows localtest paused.
- **Next:** only additional concrete source defects may be fixed without local runtime; do not promote source-only proof into gameplay acceptance.


## Compact Manager Settings navigation focus correction — 2026-10-13

- **Source finding:** the active Svelte Settings navigation used direct `page = ...` mutations without transferring keyboard focus after the clicked button unmounted. The existing `closeDetails` could attempt focus on an unmounted Check status button after an in-flight operation finished while Settings was open.
- **Fix:** keep navigation in the one active UI component. After Svelte's `tick()`, focus the mounted Settings Back button, Instances Check status button, or contextual Client 02 region. Asynchronous detail close checks that the Instances page still exists and no other panel has opened. Deferred navigation focus also checks the destination page and connected target before focusing; no auto-polling or backend behavior changed.
- **Proof:** GitHub exact-head source/contract inspection and regression assertions authored. Svelte/Vitest/Windows keyboard and screen-reader execution remains **NOT_EXECUTED**; Minecraft localtest still paused.
- **Next:** resume only available source-level changes supported by concrete findings; exact-head Svelte/Windows validation awaits a genuinely available execution context.


## Compact Manager advanced-error privacy hardening — 2026-10-13

- **Reproduced source defect:** `safeErrorDetails` redacted backslash-form Windows home paths but exposed names in forward-slash `C:/Users/...` or `/Users/...` paths and did not redact `Authorization: Bearer <value>`.
- **Repair:** keep the single existing presentation helper; redact Windows/Mac home directory prefixes, bearer credentials, quoted/unquoted credential assignments and email values; preserve the 450-character display limit. No backend IPC, account or filesystem operations changed.
- **Proof:** exact-HEAD GitHub source inspection plus eight executable V8 redaction probes (not Vitest or Node24).
- **Unresolved:** full source verification on compatible toolchain, Windows UI/accessibility and real Minecraft accounts/gameplay NOT_EXECUTED. Windows localtest remains paused.
- **Next:** run `npm run verify:source` on exact HEAD only when supported execution is available.


## Exact-source verification route correction — 2026-10-13

- **First wrong owner:** `apps/desktop/test/verification-routing.test.ts` expected the previous aggregate `verify:source` sequence and omitted the newly installed `test:native-performance` step. This was a deterministic source/test contradiction, not a Windows/Minecraft issue.
- **Repair:** align the exact expected route with `package.json`, require the performance reviewer/sampler at the existing repository verifier, and reject internally contradictory identity loss/reappearance in the performance evaluator plus a targeted regression test.
- **Proof:** source contracts inspected on GitHub and the evaluator's authored JS tests executed in a V8 adapter (Node test imports shimmed). Node 24, Vitest/Svelte and Cargo/Rust source suites on the new exact HEAD remain **NOT_EXECUTED**, since no matching toolchain is available; no Windows localtest was resumed.
- **Next:** once a supported source-execution environment exists, run the unchanged `npm run verify:source` route at a pinned HEAD, then perform the withheld Windows/gameplay campaign separately.


## Mac/Android architecture hypothesis and REA evidence plan — 2026-10-13

- **Research owner:** `experiments/minecraft-education-platform-research.md`; not a provider, engine, additional product gate or acceptance database.
- **Established externally:** Minecraft Education macOS uses an official Apple application installation route; Android is separately supported. Package type does not prove shared/different game engine, nor that macOS is a modified APK.
- **Unavailable proof:** no authorized official Mac/Android artifacts, REA native analysis provider, or runtime captures in this session. REA binary/package investigation remains NOT_EXECUTED, with no invented Evidence IDs.
- **Decision:** retain selected Windows native + Sandboxie two-client experiment; use PresentMon/ETW and independent licensed gameplay acceptance before considering any platform/architecture migration.
- **Next:** source changes are complete for this bounded research topic; defer platform internals until real artifacts and authorized host evidence exist.

## Offline native process-performance report interpretation — 2026-10-13

- **Scope:** reuse the existing Node evidence-evaluator pattern; read the JSON produced by the native process sampler.
- **Behavior:** reject foreign schemas, extra fields (including PID/account data), false PASS, invalid/missing measurements and contradictory sample counts; aggregate observed CPU/working set with nullable unknowns, never assert gameplay or performance success.
- **Verification:** Node tests authored and wired into the existing source verification command; executable Node and PowerShell checks on the new exact HEAD are **NOT_EXECUTED** in this GitHub-only session.
- **Next:** only actual Windows/PresentMon and interactive Minecraft observations can close the two-client performance and account-separation unknowns.

## Remote-only native performance evidence preparation — 2026-10-13

- **Scope:** add one opt-in read-only PowerShell sampler under the existing Windows acceptance owner, document its limits and its connection to the current two-client pilot.
- **Mechanism:** caller supplies two existing distinct PIDs; capture bounded elapsed time, CPU share and process working set; pin process creation identities, mark missing/reused PIDs UNKNOWN; write local-only JSON without PID/account/world data; provide no automatic performance/gameplay verdict.
- **Proof:** REMOTE_GITHUB source and static contract inspection only. No Windows process, PowerShell runner, PresentMon, game rendering, account isolation, stress benchmark, or installer was executed.
- **Next:** run one real two-client acceptance and 60-minute process/frame-time capture only after runtime access is available and explicitly resumed; do not reinterpret process telemetry as gameplay readiness.

## Remote-only UI hardening — 2026-10-13

- **Scope:** one active Compact Manager Svelte owner, its source-contract tests, and existing product specification.
- **Change:** correct View issue so a repeat click does not close the error; add Escape dismissal, keyboard focus restoration to a surviving disclosure origin (fallback to Check status), and semantic region/expanded relations. A successful Open/Move request can remove its inline panel without stranding keyboard focus.
- **Proof:** REMOTE_GITHUB exact-source review and authored source-contract assertions; Node/Svelte/Rust, actual Windows keyboard/screen-reader behavior, game account isolation and gameplay remain **NOT_EXECUTED** on this new HEAD.
- **Next while localtest is unavailable:** preserve manual validation requirements; investigate only source-provable performance/evidence tooling, without running Windows or changing sandbox/VM/account state.


**Repository/branch:** `MIVUBI-STD/M-Minecraft-Emulator` / `Local` only.
**Current work:** `emulator/pre-local-cleanup`; **PAUSED at user request on 2026-10-13**. User will continue repository discussion in ChatGPT; do not resume local runtime tests without explicit instruction.
**Execution ceiling:** Windows source preflight **PASS** at `e6e9ad22625cf0c5928ee6cf5ee6efb2e503e598`; developer binary/window observed; Refresh confirmation observed in user-supplied screenshot. Sandboxie membership, account isolation, Minecraft gameplay, package and four-client acceptance remain **NOT_EXECUTED / UNKNOWN**. Later documentation commits do not inherit exact-HEAD execution PASS.

## Compact Manager frontend implementation — 2026-10-13

- **Scope:** frontend source only. New mounted `CompactManagerApp.svelte`, `app/presentation/compactManager.ts`, compact `app.css`, direct source-mount and state-projection regression tests.
- **Active UI:** English-only Instances and Settings, no sidebar; single on-demand Check status; conditional Open, Set up, Switch to and Client 02 Left/Right; inline issue details. The old feasibility Svelte remains unmounted, and the legacy VMware app remains unmounted.
- **Safety:** existing native typed IPC and Rust backend untouched. Client 01 native window identity is NOT proven; Client 02 eligibility still requires fresh Rust preflight; operation success is only request acceptance. No auto-polling, auto-retry, automated sign-in, Stop, restart, tray, Start All or virtual client 03/04.
- **Verification status:** pending execution on this exact commit; source edits, tests written and commit are NOT proof of compiled or Windows gameplay behavior. Windows localtest remains PAUSED at user request.
- **Next:** run desktop source checks and actual Windows visual/keyboard/manual acceptance when explicitly approved; preserve package guard and legacy assets.

## Compact Manager consolidated design baseline — 2026-10-13

- **Decision:** UX design frozen for the current two-client UI; no runtime implementation or local Windows tests resumed.
- **SOLE ACTIVE UI DESIGN AUTHORITY:** [Compact Manager Implementation Specification](../docs/product/compact-manager-implementation.md). It supersedes the earlier UX and screen drafts (historical only), including Indonesian labels, sidebar, a separate Window Layout screen, side drawers, unsupported buttons and stale mock states.
- **English-only, no sidebar:** native title bar; Instances (home) + Settings; one Check status; compact flat list; instance-specific inline setup/issue/window-placement; advanced diagnostics collapsed.
- **Truthfulness:** request ≠ observed window ≠ independent licensed playable session. Client 01 supports official app Open only; Client 02 supports conditional isolated Open, validated Switch to and Left/Right placement. No 03/04, Stop, Start All, native Focus or global Arrange until backend exists and is proven.
- **Design versus implementation:** source currently still mounts `NativeFeasibilityApp.svelte`; the canonical specification is a future implementation contract, not proof of new Svelte components, package success or gameplay. Preserve exact current Rust/IPC security logic and legacy compatibility.
- **Next design-approved task:** implement the complete UI refactor in reviewed phases from the sole specification, then source/UI verification. Real Windows localtest stays **PAUSED** pending explicit user instruction.

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
