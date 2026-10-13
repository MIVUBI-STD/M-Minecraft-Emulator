# Current Development Handoff

**Branch:** `Local` only. **Product:** Minecraft Instance Manager.
**Current work:** `emulator/source-hardening` (additional source-only audit and corrections; local testing explicitly deferred).
**Engineering state:** source prototype / **exact-HEAD Node/Svelte/Rust/PowerShell execution, Windows build and two-account gameplay NOT_EXECUTED**.

## Latest source-hardening batch — fallible I/O worker startup

- **First wrong owner:** `engine/runtime-core/src/provider/process.rs` started stdin/stdout/stderr workers using `std::thread::spawn`, which panics when thread creation fails under resource pressure. Because the direct helper already exists, this could abandon cleanup instead of returning an ordinary I/O error.
- **Source correction:** All three paths now use fallible `std::thread::Builder::spawn` under one `spawn_worker_or_reap` owner. An allocation failure terminates and reaps **only the directly owned helper**. If direct cleanup fails, both the allocation and cleanup errors are reported. Existing output bounds, shared overflow signal, 24-worker limit and legacy VM protections are unchanged.
- **Behavioral regression authored:** `worker_allocation_failure_reaps_only_direct_helper` simulates thread creation failure without exhausting machine resources and checks the direct child was reaped. This is not a Windows low-memory or descendant-inherited pipe result.
- **Proof ceiling:** Exact-source and caller review only. Rust, Windows, Svelte, Sandboxie and Minecraft execution remain **NOT_EXECUTED**. Previously started worker threads can still remain blocked on inherited pipes; their existing capacity limit remains the only bound.
- **Next bounded action:** Execute exact-HEAD Rust/Windows source verification when an actual compiler/runtime is available, then repair any demonstrated failure before adding another lifecycle manager.

## Previous source-hardening batch — cooperative peer-reader stop

- **First wrong owner:** `engine/runtime-core/src/provider/process.rs`. When stdout exceeded its cap, the peer stderr reader was informed indirectly via an atomic flag, but `drain_output` did not inspect that flag and could continue consuming unneeded output until its own EOF or size cap. The same applied with stdout/stderr reversed.
- **Source correction:** Check the existing shared overflow flag **before each subsequent read** in both output workers. A peer already invalidated by overflow now stops consuming additional bytes as soon as its current `read` returns. This reuses the existing signal and 24-worker ceiling; it adds no threads, polling processes, public IPC, new dependencies or VM/guest mutations.
- **Regression authored:** A deterministic fake reader signals peer overflow mid-read and proves there is no second read. A second fake panics if an already-cancelled reader is called, verifying pre-read refusal. Existing overflow and timeout tests are retained.
- **Proof ceiling:** Exact source and regression definitions inspected; Rust/Windows execution and Minecraft gameplay remain **NOT_EXECUTED**. A reader **already blocked inside an OS pipe read** can still remain there if a descendant retains the handle. This patch does **not** claim kernel-level I/O cancellation or complete thread reclamation.
- **Next bounded action:** Verify the latest Rust tests on an executable toolchain and use an actual inherited-handle reproducer before choosing Windows-specific cancellation; avoid speculative process-tree termination.

## Previous source-hardening batch — bounded overflow reader retirement

- **First wrong owner:** `engine/runtime-core/src/provider/process.rs`. After passing the 64 KiB output cap, readers continued consuming a potentially unbounded stream until EOF. This could keep a worker occupied unnecessarily and leave it tied to descendant-inherited pipe handles even though the result was already invalid.
- **Source correction:** Each reader retains only the existing 64 KiB + sentinel and closes its pipe immediately on overflow. A shared atomic overflow signal allows the supervising thread to refuse the result and terminate **only its directly owned helper**; after direct-child exit, the other stream also stops waiting when its peer has overflowed. Existing normal-output, process-reaping, worker-slot ceiling and legacy provider boundaries remain unchanged.
- **Regression coverage authored:** A bounded cursor proves that the reader returns without consuming all available bytes. Another test proves that a waiting reader refuses promptly when its peer stream overflows. Existing verbose-output integration regression remains. No persistent files, scheduler, new dependency or account data were added.
- **Proof ceiling:** Source consistency reviewed at this commit, but Rust/Windows/Node execution, inherited-pipe reproduction on a real host, and Minecraft gameplay are **NOT_EXECUTED**. This reduces unbounded output-driven worker retention; it does **not** solve a valid short-output helper whose descendant inherits a still-open pipe.
- **Next bounded action:** Execute the exact-HEAD Rust/Windows source tests where available and investigate only observed failures; do not infer complete inherited-pipe cancellation or two-account support from static inspection.

## Previous source-hardening batch — bind Windows helpers to system paths

- **First wrong owner:** `apps/desktop/src-tauri/src/engine/native_clients.rs` ran four PowerShell commands as a relative `powershell.exe`, allowing command resolution to depend on the host process search path/current directory. Its native-only process inspector also used `Get-Process -ErrorAction SilentlyContinue`, which could yield a misleading empty observation when enumeration failed.
- **Source correction:** Resolve Windows PowerShell through `GetSystemDirectoryW` and refuse operation if that exact system file is absent. Launch the official Start-app shell via Explorer from Windows' SpecialFolder rather than an unqualified executable name. Native candidate enumeration now requires `Get-Process -ErrorAction Stop`; a failed query is an error, not evidence of zero processes. The existing Sandboxie collector, admission contract, candidate schema, credential boundaries and launch semantics are otherwise unchanged.
- **Regression:** Added one Windows-only Rust test that exercises the system PowerShell resolver, plus source contract assertions for absolute helper resolution and fail-closed native inventory. These are **AUTHORED, NOT_EXECUTED** in the GitHub-only environment.
- **Proof ceiling:** No Windows/Rust/Svelte/PowerShell source execution, artifact or REA runtime observation, Sandboxie login or Minecraft gameplay was performed. The Windows API binding and official shell path must be exercised on the target OS; there is no claim that two independently signed-in sessions work.
- **Next bounded action:** Run exact-SHA Windows source verification before further changes; inspect any genuine compiler/test failure as the first wrong owner. Do not unblock legacy VM packaging or change `main`.

## Previous source-only batch — cross-session PID and validated boxed identity

- **First wrong owner:** The collector filtered game candidates by the current
  `$session`, even though the selected Sandboxie box inventory could contain a
  process in another Windows session. The originally observed PID was readable,
  but its game name could be excluded from the final candidate list; an empty
  in-session list is not proof that the box has no game.
- **Source correction:** A boxed PID whose validated `SessionId` differs from
  the current interactive collector session forces `membershipStatus=UNKNOWN`,
  which the existing Rust admission rejects. For same-session boxed PIDs, a
  read-only in-invocation PID-to-name/session snapshot is used to classify
  Minecraft candidate names, preventing a second property read from silently
  dropping a formerly identified boxed game. No new IPC field, daemon, store,
  token inspection, launch retry or persisted user data.
- **Operator UX:** Launch error and Svelte guidance now mention foreign Windows
  sessions as a possible cause of UNKNOWN. It is not a confirmed diagnosis:
  no new reason-specific evidence is exposed to the UI.
- **Source tests:** Updated source-only collector, native UI, and repository
  verifier assertions for foreign-session refusal and checked metadata
  reuse. Removed stale source assertions that still expected the earlier
  exact single-line process-name guard and duplicate assertion copy.
- **Proof ceiling:** inspection of the pinned GitHub code and contract
  consistency only; PowerShell, Rust, Svelte/Vitest, Windows, Sandboxie and
  Minecraft execution remain NOT_EXECUTED. A PID inventory is non-atomic,
  and a process may change or exit after the read.
- **Next bounded source investigation:** examine the selected Sandboxie box
  process identity stability and command-line transport failure boundaries;
  do not add a second process manager or automatically trigger localtest.

## Previous source-only batch — fail-closed boxed PID identity and UNKNOWN guidance

- **First wrong owner:** `tooling/acceptance/windows/collect-sandboxie-feasibility.ps1`. A Sandboxie-reported boxed PID was previously required only to occur in the global `Get-Process` snapshot. Presence alone did not prove that its `ProcessName` and `SessionId` could be read. If a boxed Minecraft process failed to classify, the launch preflight might report zero named candidates despite its PID existing. This is a source-level false-empty risk, not an observed duplicate launch.
- **Correction:** A failed global enumeration discards any partial list; duplicate/missing boxed PIDs, an empty process name, an unavailable/non-integer/invalid boxed `SessionId`, or a denied getter all downgrade `membershipStatus` to `UNKNOWN` with no inferred box attribution. The existing Rust admission rule refuses `UNKNOWN`. An inaccessible optional `MainWindowHandle` remains a null HWND on a name-matched process rather than deleting that candidate, so a windowless Client 02 still blocks another launch.
- **User guidance:** Rust launch refusal and the active Svelte UI now acknowledge both unknown Sandboxie membership **and** unknown Windows process identity instead of naming only `Start.exe /listpids`. No new public fields, provider manager, background poller or credentials handling were introduced.
- **Source regression:** Strengthened `apps/desktop/test/native-feasibility.test.ts` and `tooling/acceptance/evaluate-sandboxie-feasibility.test.mjs`. Performed a bounded GitHub-source consistency scan: **12/12 hand-authored invariants matched**, along with literal source-assertion matches for **30 desktop**, **72 evaluator**, and **21 repository-verifier** occurrences (negative assertions excluded from positive checks). These are inspection results, **not** executed Node/Vitest/PowerShell tests. `npm run verify:source` still NOT_EXECUTED.
- **Residuals:** A Windows/Sandboxie process inventory is never atomic; the game can launch/exit between snapshots and admission. `Get-Process` access/edition differences, signed PID attribution, WAM login separation, client rendering, start-app localization, resource behavior and the inherited pipe lifetime require higher proof. All local machine and game tests remain deferred by the user.
- **Next bounded source-only task:** inspect whether the process enumeration's per-property failures and out-of-box candidates can be diagnosed without overloading IPC/schema, and whether the first meaningful operator action is communicated without replacing UNKNOWN with invented PASS. Do not proceed to localtest or release packaging without a new request.

## Previous source-only batch — REA-aligned producer/consumer reconciliation and worker bounds

- **Discovered a concrete source-contract defect (P0):** the collector's
  `$signedOutside` filter previously counted every signed Education image,
  including the boxed PID proven by `-BoxedImageProofPid`. Rust independently
  counts signed images only outside the selected Sandboxie box. A successfully
  signed boxed PID could therefore make the Focus/Place inspection report
  self-contradictory and be rejected. The collector now explicitly filters
  `inSelectedBox -eq $false`. Frontend fixtures exercise both the accepted
  signed-only-boxed case and a deliberately plausible but contradictory
  outside counter. This is an observed *source defect corrected in source*,
  not a measured before/after Windows fix.
- **CLI process inventory:** the short-lived collector now reads two separate
  bounded `Start.exe /listpids` snapshots with one canonical strict parser.
  Only matching sorted PID sets (including valid zero-count sets) yield
  OBSERVED; otherwise the existing signed `SbieDll` read-only fallback
  runs. Windows process reconciliation from the prior batch remains active.
  A changing process between preflight and launch is still a race; no
  unauthorized second launch is considered proven.
- **Helper stdout:** replaces the previous read-task-then-wait-for-exit
  sequence with concurrent draining until EOF, limiting buffered output to
  4096 characters under a single five-second deadline. This addresses the
  source-level pipe-fill deadlock and avoids unbounded retained output.
  PowerShell actual execution remains NOT_EXECUTED.
- **Rust subprocess workers:** reserves a bounded maximum of 24 concurrent
  shared I/O worker slots **before** spawning any provider helper. Slots are
  released by each reader/writer thread on exit, while inherited stdout
  pipes can still keep a thread alive. The cap prevents repeated ambiguous
  inspections from silently creating unbounded new detached workers. A
  source regression for capacity is authored, not executed.
- **UI:** a new Refresh clears stale success copy before reporting a fresh
  observation or failure; the Rust/TypeScript contract remains unchanged.
- **Evidence checks:** inspected current source, verified the relevant
  collector assertions and source-invariant markers against current files.
  No Node/Vitest, Cargo, PowerShell or Minecraft tests were executed,
  and no REA binary/provider session exists. This is not G0 acceptance.
- **Preserved:** branch `main`, original VMware VM/account data, installed
  product identifier, old blocked installer, process identity admission,
  protocol/schema versions, and account/token privacy boundaries.
- **Still unresolved:** actual Rust/Svelte/PowerShell compilation, Sandboxie
  ABI compatibility, Windows signed-file attribution, Microsoft WAM account
  separation, resource usage, socket/session stability, long-running
  descendant pipe lifetime, localized StartApps, and all gameplay gates.
- **Next source-only task:** audit fail-closed reporting of process
  enumeration errors and distinguish genuinely empty boxes from race-related
  UNKNOWN without a new scheduler, agent, installer, provider or credential
  state. The user has deferred all local gameplay/Windows tests.

## Previous source-only batch — PID completeness, bounded helper output, launch UX and localtest

- Reconciles a successfully observed Sandboxie box PID set against one bounded
  Windows `Get-Process -ErrorAction Stop` snapshot, including helper and
  windowless PIDs. If Windows enumeration fails or a Sandboxie-reported PID
  cannot be found, process membership is downgraded to UNKNOWN. Backend launch
  admission already blocks UNKNOWN. This avoids interpreting an incomplete
  candidate list as an empty box, without storing a second process inventory.
- In the existing disposable PowerShell collector, `Start.exe`/SbieIni
  redirected stdout is now read in a bounded 1 KiB buffer and 4 KiB total
  retained capacity with an overall 1-second EOF drain bound. No unbounded
  `ReadToEndAsync` string. The helper process—not Minecraft—may be killed
  when its deadline is exceeded; account storage is untouched.
- The active two-client Svelte UI requires a successful observed empty-box
  preflight before allowing Launch Client 02. A pure snapshot projection
  (`isSandboxieBoxPrepared`, `canRequestClient02`) is consumed by the UI,
  with behavior-level Vitest cases for UNKNOWN/occupied/misconfigured boxes.
  Backend always performs its own fresh preflight and remains authoritative.
  Clear operation-stage messages and license re-confirmation on executable
  changes reduce avoidable launch errors.
- Existing source and collector regression assertions were reconciled with
  current code. Removed stale assertions that used an obsolete visible-only
  candidate gate or old 1-second output reader. The repository verification
  now checks the actual boxed PID completeness and launch-admission safeguards.
- Added [Windows localtest procedure](../docs/validation/native-pilot-localtest.md),
  indexed through `docs/validation/README.md`. The previous REA audit was
  registered with mandatory documentation identity metadata to avoid a
  `verify:repository` documentation failure.
- **Proof:** exact GitHub source inspection and cross-file structural checks
  only. Toolchain does not provide Windows, PowerShell 7, Rust, packaged PE,
  an active REA server, or authenticated Minecraft Education; full
  `npm run verify:source` / Vitest / Svelte / Cargo / Windows acceptance
  are **NOT_EXECUTED** on this changed HEAD. A committed test is not a pass.
- **Still open:** actual Sandboxie CLI/DLL compatibility; simultaneous
  independently licensed account sessions, world/game rendering, multiplayer,
  restart persistence, Windows version/localized Start app custom APPDIR,
  publisher metadata, helper inherited-pipe worker lifetime, CPU/RAM/GPU
  benchmarks, the intentionally blocked legacy installer, and full REA
  binary/runtime analysis. Never auto-retry an ambiguous launch.
- **Next single validation task:** on the pinned `Local` checkout run
  `npm run setup` and `npm run verify:source`; stop at the first actual
  compiler/test failure and correct its canonical source owner. If source
  checks succeed, run `npm run dev` and follow the safe two-client localtest
  procedure. No promotion to release or four-client claim.

## Latest source-only batch — signing and installation prerequisites

- Compared the two active Windows launch paths with the official Minecraft
  Education Windows Installation Guide and Microsoft's Get-StartApps and
  Get-AuthenticodeSignature documentation.
- Fixed a concrete prerequisite drift: Client 01 required a unique valid
  Minecraft Education Start app, while Client 02 required registry/Store
  installation and signed EXE but did not require matching Start
  registration. Both launch paths now check current-user Start app
  uniqueness and valid AppID syntax.
- Both paths now fail closed if Get-AppxPackage enumeration errors,
  rather than suppressing errors and inferring the Store edition absent.
  The existing signed-file ProductName/Microsoft-publisher checks for
  the selected Client 02 EXE are retained unchanged.
- Kept custom APPDIR support: Microsoft explicitly allows Desktop
  installation outside Program Files. A Start AppID does not prove that
  the selected EXE path is its installed binary; this unresolved
  association is **not** promoted to source-only proof.
- No changes to Sandboxie account/credentials, launch scheduler, process
  inventory, persisted schemas, VM state, or packaging.
- **Proof:** pinned Local source review and current official Microsoft /
  Minecraft docs. Frontend/Rust source assertions are authored only;
  Windows, Minecraft, build, native signing, and two-account acceptance
  tests remain NOT_EXECUTED by user request.
- **Unresolved:** Windows Get-StartApps and Get-AppxPackage cross-user
  differences, custom APPDIR provenance, executable/installation linkage,
  local issuer metadata and real launcher compatibility.
- **Next:** narrow source-only audit of error classification and
  user-facing recovery without adding a second readiness state machine.

## Previous source-only batch — executable file provenance and replacement guard

- Found the gap: unchanged path strings before/after Authenticode do not
  prove that the path still names the same filesystem object.
- In the existing read-only, short-lived PowerShell collector, the
  targeted boxed-PID proof now uses a bounded `MivubiReadOnlyImageLease`
  C# helper: OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION),
  QueryFullProcessImageNameW, creation FILETIME, local/reparse path checks,
  and a read-only FileStream held with FileShare.Read during verification.
- The helper obtains the 128-bit FileIdInfo and volume identity using
  GetFileInformationByHandleEx. After signature validation, it checks
  process time/path again and reopens the path to compare file identity
  while the original handle remains open; uncertain results stay UNKNOWN
  and the existing Rust Focus/Place admission refuses the action.
- Existing Education ProductName, Microsoft Authenticode trust, manual
  outside-box ImageProof, launch, schemas, reports and all account/VM
  boundaries remain unchanged. No new service or persisted identity cache.
- Found and addressed a more fundamental transport limit in the same
  batch: the embedded collector had grown beyond the Windows
  CreateProcess command-line boundary. Extended the one canonical
  bounded subprocess runner with an optional <=128 KiB stdin input and
  switched the active collector to a short PowerShell UTF-8 bootstrap
  that reads the embedded source from stdin. No .ps1 file is written.
  The existing no-input callers continue through the same runner.
- **Proof:** reviewed exact GitHub source against Microsoft Win32/.NET
  APIs and authored source assertions. Node/Rust/PowerShell/Add-Type,
  Windows, Minecraft and performance tests remain **NOT_EXECUTED**.
- **Unresolved:** the PowerShell stdin bootstrap, its encoding and the
  updated shared subprocess transport still need actual Windows execution.
  Input is bounded and the source-only tests are authored, not executed.
  File sharing/AV/Sandboxie may prevent acquiring the
  read-only handle (safe UNKNOWN); file identity is not an attestation of
  the executable already mapped in memory. Reparse/long-path cases can be
  conservatively refused. Latency/compatibility remain unmeasured.
- **Next:** bounded source-only audit of signing/installation path
  provenance and diagnostic failure messaging without a second manager.

## Previous source-only batch — boxed executable identity before window actions

- Confirmed a concrete gap: Focus/Place only required a name-matched,
  sandboxed process. A non-Education process named Minecraft.Windows
  could otherwise be treated as a game window.
- Reused the one canonical, read-only PowerShell collector's existing
  Authenticode/ProductName/Microsoft-signer logic. Added a selected PID
  mode `-BoxedImageProofPid` for Focus/Place only. No separate runtime
  image-verifier service, account access, persistent cache or polling.
- The collector checks only a boxed PID with known start time and visible
  window, and reopens it afterward to compare process FILETIME and
  executable path; inconclusive evidence stays UNKNOWN. The backend's
  pure admission helper requires fresh signed Education file evidence
  for the exact PID/FILETIME/HWND, disregarding the caller's
  imageEvidence. It rechecks process handle and Win32 window as before.
- The existing `imageEvidence` enum allows boxed signed candidates,
  while `officialImageOutsideSelectedBoxCount` still counts outside
  only; no schema increment. Manual outside-box `-ImageProof` vendor
  DLL checks remain separate; Launch continues using fast inventory
  and its existing signed executable preflight.
- Updated Rust/TypeScript contract regressions, one old test expecting
  boxed signed to fail, UI copy, documentation and implementation map.
- **Proof:** remote exact-source and external Windows API documentation
  only; regressions are authored, NOT_EXECUTED. Local Windows,
  PowerShell, Rust, Node, Tauri, Minecraft and performance tests remain
  postponed. No claim of sandboxed account or game playability.
- **Unresolved:** this proves a signed file candidate, not that the
  mapped running image is immutable; process/path/file races or
  publisher metadata inconsistencies can still cause UNKNOWN.
  Signature verification overhead and compatibility on a real
  Windows machine are unmeasured.
- **Next:** bounded audit of signed-file path/provenance and executable
  replacement races without adding a parallel identity store.

## Previous source-only batch — PID/window ownership hardening

- Cross-checked Microsoft Win32 GetAncestor GA_ROOT, GetWindow GW_OWNER,
  GetWindowThreadProcessId, SetWindowPos and SetForegroundWindow contracts.
  GA_ROOT does not exclude owned top-level popups; the previous Focus/Place
  owner validation did not check GW_OWNER.
- Reused one Rust live-window validation helper for both actions. It checks
  HWND validity/visibility, PID ownership, root status and absence of an
  owner window. Retained the existing Sandboxie membership and creation-
  FILETIME verification with an open process handle for the action.
- Checked the 64-bit observed HWND before conversion to platform pointer
  width; refused silent truncation. After Focus restoration, the live
  window is checked again; immediately before Place, full window checks,
  minimized/maximized state and current monitor are revalidated.
- Updated UI guidance, focused source assertions and validation procedure;
  no additional daemon, polling, login automation, IPC schema or VM routes.
- **Proof:** pinned GitHub source review and Microsoft Win32 references,
  GitHub source/consumer inspection; regression assertions are *authored,
  not executed*. Windows/Rust/Node/Minecraft remain NOT_EXECUTED by request.
- **Unresolved:** a same-process HWND could be destroyed/reused between the
  final check and the API call; asynchronous placement may be delivered
  after the check. Name-matched boxed game processes are not authenticated
  Minecraft Education images or accounts. Native Windows acceptance pending.
- **Next:** bounded audit of process image attribution for boxed candidates
  (without credential access, EXE modifications, or expanded provider scope).

## Previous source-only batch — signed read-only enumeration fallback

- Cross-checked upstream Sandboxie `SbieApi_EnumProcessEx` against pinned
  DLL implementation, driver capacity handling and Start.exe caller. The
  current upstream uses a five-argument API with a separate count pointer;
  driver truncation can otherwise appear as a successful read.
- In the existing short-lived canonical PowerShell collector, added a
  **fallback only when /listpids cannot be parsed**. It loads the installed
  SbieDll only after signature and signer-certificate checks match Start.exe;
  its bounded API call checks two PID snapshots plus a final count, rejects
  duplicates/zero PIDs, oversized and saturated inventories and races.
  Valid zero-PID results use a typed wrapper to avoid being treated as null
  by PowerShell.
- Reused the one vendor-DLL trust guard for the existing manual ImageProof
  attribution. No new service, provider, persistent state, API or schema.
  Backend launch still requires verified OBSERVED membership with no
  Minecraft-name process, and UNKNOWN still blocks.
- Aligned source-level regression assertions, including a stale UI text
  assertion from the preceding guidance update.
- **Proof:** pinned exact-upstream C sources and exact-current GitHub code
  and consumer review; *checks are authored, not executed*.
  Node/Rust/PowerShell builds, vendor DLL loading and Windows/Minecraft
  runtime remain **NOT_EXECUTED** (user postponed tests).
- **Unresolved:** SbieDll load/ABI/crash/latency behavior across installed
  releases is unproven; enumeration remains a race-prone snapshot;
  Microsoft WAM isolation and two gameplays are unproven.
- **Next:** narrow source review of process/window ownership and candidate
  attribution, with no account or VM route changes.

## Previous source-only batch — Sandboxie process discovery and launch admission

- Corrected a source-proven duplicate-launch risk: Client 02 now refuses
  launching when Sandboxie membership is UNKNOWN. Only a fresh OBSERVED
  inventory with no Minecraft-name process candidate passes backend preflight.
- Corrected the mistaken shared 16-PID limit. Sandboxie /listpids counts all
  box processes, including helpers. The collector now accepts up to 256 PIDs
  with strict format/count/unique/32-bit PID/output-size bounds, while game
  candidates remain capped at 16.
- Updated user-facing guidance and guarded the launch button following an
  explicit UNKNOWN Refresh. The backend still rechecks on each launch.
- No new daemon, IPC schema or report schema; manual-only SbieDll proof and
  paused VMware remain untouched.
- **Proof:** exact-GitHub source review and authored Rust/TypeScript
  regressions; no executed Node/Rust/PowerShell/Windows/Minecraft tests.
- **Unresolved:** GUI Start.exe redirected stdout may still be unavailable;
  unknown membership is a safety block, not a reason to claim an empty box.
  There is no atomic reservation against out-of-band sandbox launches.
- **Next:** targeted identity/window attribution review only, preserving
  all license/credential and runtime acceptance boundaries.

## Previous source-only batch — external research and operator guidance

- Compared Zebrunner MCloud, MCloud agent/Redroid, DeviceFarmer STF, Minecraft Education documentation, Sandboxie API/security docs, Microsoft Win32 and PowerToys FancyZones. [Research and decisions](../experiments/mcloud-windows-crosscheck.md) are non-authoritative and do not introduce a new provider.
- Updated the active desktop's presentation-only setup guidance from the existing observation: session, persistent box settings, process membership and a concrete next action. Low-level Sandboxie fields are available on demand under diagnostics; backend preflight remains authoritative.
- Preserved explicit launch, no polling/recording, no account/token access, no automatic edits to Sandboxie settings, and legacy VMware freeze.
- **Proof:** GitHub exact-source review only. Source tests, Windows build, local test, licensed sign-ins, worlds, networking and four-client acceptance are **NOT_EXECUTED**; operator postponed testing.
- **Next:** source-only examination of remaining UI/identity and installation blockers in the existing owner; do not scale to three boxed clients or claim Microsoft SSO isolation without actual evidence.

## One selected outcome and engine

The product goal remains **four Minecraft Education Windows Desktop clients with
four separate legitimate licensed accounts on one PC**. The **only active
experiment** is **Client 01 (host-native)** and **Client 02 (Sandboxie Plus box
`MinecraftClient02`)**. Two independent logins, interactive gameplay,
multiplayer, reboot persistence and four-client capacity are **unproven**.

No Android/ADB runtime, Windows VM, second provider, virtual controller,
new daemon, background polling, account/token copying or EXE patching is
part of the active implementation.

## Current source authority

| Responsibility | Authoritative source |
| --- | --- |
| Active user interface | `apps/desktop/src/NativeFeasibilityApp.svelte` |
| Tauri IPC and Windows launch/inspector | `apps/desktop/src-tauri/src/commands/native_clients.rs`, `src-tauri/src/engine/native_clients.rs` |
| Frontend schema validation | `apps/desktop/src/app/bridge/nativeFeasibilityApi.ts` |
| Canonical on-demand Sandboxie inspection | `tooling/acceptance/windows/collect-sandboxie-feasibility.ps1` |
| Two-client evidence interpretation | `tooling/acceptance/evaluate-sandboxie-feasibility.mjs` |
| Lightweight architecture and tradeoffs | [Architecture](../docs/system/architecture.md) |
| Current local proof procedure | [Sandboxie two-client feasibility](../docs/validation/sandboxie-two-client-feasibility.md) |
| Retained old VMware/installer source | [Legacy Retirement](../docs/system/legacy-retirement.md) |

## Implemented source — not runtime claims

- Windows desktop official Client 01 launch request and one sandboxed Client 02
  launch request; manually select the signed Minecraft Education Desktop EXE.
- Canonical Sandboxie collector invoked on explicit Refresh/preflight in
  `-SummaryOnly` mode: **one observation for both process candidate classes,
  no report file per Refresh and no background polling**.
- Read-only inspection of Sandboxie box configuration, on-demand process/PID
  membership, visible window candidates and known WinCred-bypass settings,
  including explicit local/global protected-storage template selections.
- Backend launch admission serializes Client 02 preflight and requests without
  relying on UI buttons; a brief retry gap guards ambiguous requests.
- The SummaryOnly IPC schema is now 6: one bounded candidate list carries
  PID, optional creation FILETIME, HWND and observed box membership, with
  Rust/TypeScript validation of counts, uniqueness and attribution.
  Creation FILETIME is a decimal string so JavaScript cannot lose precision.
  An inaccessible start time stays null; a PID alone is never a stable identity.
  On explicit Refresh only, the collector optionally verifies Microsoft
  Authenticode status and Education ProductName for visible name-matched
  processes outside the selected box. It sends only a candidate classification
  and count, not paths, account data or passwords. This does not prove native
  Windows ownership because other Sandboxie boxes may exist.
  On manual -ImageProof only, if signed candidates exist outside Client 02,
  the collector probes the signed installed SbieDll.dll export
  SbieApi_QueryProcess for each candidate PID. The query uses a Windows
  process handle and checks creation FILETIME before and after the vendor
  call, avoiding PID-reuse false attribution. A successful box name other
  than MinecraftClient02 is OTHER_BOX; every API failure, missing process
  or inconsistent identity stays UNKNOWN, never "native".
  Loading Sandboxie's DLL is confined to the short-lived PowerShell
  collector, never the Tauri manager. Only modules signed with the same
  certificate as the trusted Sandboxie Start.exe are loaded. DLL in-process
  startup behavior, ABI across installed versions, image load failure and
  real latency are still NOT_EXECUTED; a catastrophic DLL init failure
  could terminate the collector child and surface an inspection error.
  The old multi-box SbieIni/Start.exe CLI sweep has been replaced; there
  is no fallback that infers native status from missing box matches.
  Launch preflight and Focus/Place use the existing SummaryOnly collector
  without -ImageProof or SbieDll loading; one-shot image caching remains.
  Persisted CLI evidence remains schema 1. The collector runs only on demand;
  the optional vendor-DLL call exists ONLY in its short-lived child, not
  in any always-running application or service.
  Collector stdout wait is bounded after helper exit; the launch
  helper handle is disposed without terminating game or box.
- Client 02 now has one explicit Focus action: Rust obtains a fresh
  Sandboxie summary, matches PID/creation FILETIME/HWND/box membership,
  then rechecks process creation time and HWND owner through Win32
  before requesting foreground activation. A missing creation time,
  recycled PID, changed window or ambiguous box membership blocks Focus.
  Windows may deny foreground activation; no input injection, service
  or legacy VMware window arrangement is enabled.
- Client 02 has explicit Place Left / Place Right controls for the current
  monitor's Windows work area. They reuse the exact same fresh PID/creation
  FILETIME/HWND/Sandboxie identity guard as Focus, and do not move a process
  merely because it is outside the selected Sandboxie box. A minimized or
  maximized game window must be manually restored first. Placement requests
  are asynchronous to avoid blocking on Minecraft's input queue, preserve
  focus/z-order, and do not prove final rendered geometry.
- One fixed persistent box `MinecraftClient02`, with checks for
  `AutoDelete`, `AutoRemove` and known credential configuration. No
  automatic sandbox creation/deletion, VM mutation or account management.
- Fail-closed typed contracts and candidate-only labels. A visible process
  **outside** the selected box is **not proven** to be host-native.
- Legacy VMware UI/Guest Agent and mutation entrypoints remain paused;
  historical installed application identity and user data stay preserved.
  The old VMware NSIS package remains deliberately blocked.

## Unresolved risks that actually matter

1. **Login isolation:** Sandboxie does not create another Windows user.
   `OpenCredentials=OFF` is not proof of independent WinCred, WAM, ADAL or
   Microsoft Education sessions. Custom/nested templates are not fully resolved.
2. **Launch / process identity:** Sandboxie's command may return without an
   authenticated Minecraft child. Name-matched HWND/PID candidates are not
   Edition, sign-in, world or multiplayer proof. Manager-request overlap,
   immediate retries and observed windowless boxed Minecraft-name processes
   now block duplicate launch. Out-of-band starts and unknown membership
   remain unproven; no account or gameplay state is inferred.
3. **Graphics and input:** DirectX/OpenGL rendering, Windows foreground focus
   and two playable simultaneous game sessions remain untested.
4. **Actual resource savings:** no measured manager/WebView2 CPU/RAM baseline,
   Sandboxie overhead, Minecraft per-process GPU/VRAM, latency or long-run
   stability. Low-overhead design is not a benchmark.
5. **Compilation / distribution:** Rust/Tauri, Svelte/TypeScript, Vitest,
   Windows PowerShell and packaging have no successful **exact-head**
   execution evidence. An approved native installer does not exist.

## Proof policy and next task

Source review and isolated JS evaluator callbacks are supporting diagnostics,
not an executed `npm run verify:source` or a Windows acceptance run. Earlier
15/15 Sandboxie evaluator regression callbacks were executed inside
ChatGPT V8 at prior pinned revisions; this is **not** Node/Vitest, Rust,
PowerShell or a two-game proof. Do not promote old evidence to new HEAD.

**Current proof:** exact-source structural/consumer review and authored Rust,
TypeScript and collector regression checks only. Node, Rust, PowerShell and
Windows/Minecraft executions on current HEAD remain **NOT_EXECUTED**.

**Next bounded engineering action:** verify the installed SbieDll vendor
signature, load/return behavior and actual per-PID access on Windows
when permitted execution evidence is available. A nonzero return does not
prove native Client 01. If load behavior is incompatible or costly, keep
direct PID query unavailable and return UNKNOWN without changing Launch,
Focus, Place or user account data. No two-client automatic layout yet.

## Historical provenance (not active task state)

Earlier milestone-by-milestone notes are preserved in Git history at
[pre-cleanup Local commit `940ade5`](https://github.com/MIVUBI-STD/M-Minecraft-Emulator/blob/940ade5c03b6ec7bdf1fe6e9c06f26334ab08b87/planning/development.md).
This file deliberately contains **current handoff only**; archived prose must
not override current source, architecture or proof.
