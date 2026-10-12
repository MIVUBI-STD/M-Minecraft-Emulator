# Current Development Handoff

**Branch:** `Local` only. **Product:** Minecraft Instance Manager.
**Current work:** `emulator/operator-guidance-source-crosscheck` (source-only; runtime tests postponed).
**Engineering state:** source prototype / **Windows build and two-account gameplay NOT_EXECUTED**.

## Latest source-only batch — external research and operator guidance

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
