---
id: document.system.architecture
class: DOCUMENT
domain: system
role: CONTRACT
authority: CANONICAL
lifecycle: ACTIVE
---

# Minecraft Instance Manager — Lightweight Windows Architecture

## Product outcome and one chosen implementation

The user experience goal is **ADB-like lightweight control and MEmu-like
multi-instance management**, for **Minecraft Education Windows Desktop**, not
Android emulation. This is an architectural comparison, not a claim that a
Tauri/WebView2 desktop manager can consume exactly the same resources as ADB.

The **only selected isolation engine is Sandboxie Plus**. The current
two-client experimental target is one official installed Education game
running natively (Client 01) and one running in a persistent Sandboxie Plus
box called exactly `MinecraftClient02` (Client 02). Distinct legitimately
licensed Microsoft Education accounts, interactive gameplay and multiplayer
are mandatory real-world proof, not inferred from process count or Sandboxie
configuration. Four clients remain the future product target, **not** current
implemented behavior. No Windows VM, Android runtime, fake touchscreen
controller, copied EXE or cloned login profile is part of the selected path.

## One lightweight control plane, two independent Windows game processes

```text
Windows host
  ├─ Minecraft Instance Manager (one WebView2/Tauri UI + Rust coordinator)
  │    ├─ Client 01 → official Windows Start app → native Education game
  │    ├─ Client 02 → Sandboxie Start.exe /box:MinecraftClient02
  │    │               → official Windows Desktop game
  │    └─ Inspect → Sandboxie box membership + Windows process/window facts
  ├─ Existing Sandboxie driver/service (third-party; separately licensed)
  │    └─ Persistent MinecraftClient02 file/registry/IPC overlay
  └─ Windows GPU, keyboard, mouse, sound, networking (game owns rendering)
```

**One operational owner:** `apps/desktop/src-tauri/src/engine/native_clients.rs`
handles the currently selected Windows launch and inspection decisions;
`src-tauri/src/commands/native_clients.rs` is a thin Tauri adapter,
`src/app/bridge/nativeFeasibilityApi.ts` validates its data and
`src/NativeFeasibilityApp.svelte` only presents user actions and transient
status. Existing `tooling/acceptance/windows/collect-sandboxie-feasibility.ps1`
is the canonical, read-only **evidence collector**, not another lifecycle
manager. It is embedded in the current proof-of-concept backend, so it is
**not** an extra daemon. `engine/runtime-core/src/resources.rs` describes
the **paused VM** policy and must not be silently reused as a Minecraft
native-instance CPU/RAM governor.

The existing legacy VMware provider, Guest Agent, installer identity and all
account-bearing VM files remain unchanged and unmounted. No local HTTP
backend, new listening port, remote service, extra persistent status DB or
separate launcher process should be built.

## ADB-like control semantics without Android

- **Addressability:** `Client 01` is always host-native; `Client 02`
  always means Sandboxie box `MinecraftClient02`. Sandbox membership
  is authoritative for the latter, not a duplicated window title or PID alone.
- **Explicit operations:** `Launch`, `Inspect`, and later `Focus/Arrange`
  act on one selected instance. No timer silently starts or restarts a game.
- **Observed states:** `UNKNOWN → REQUESTED → PROCESS_CANDIDATE →
  VISIBLE_WINDOW_CANDIDATE`. These are process observations only.
  `SIGNED_IN / PLAYABLE / MULTIPLAYER` require separately attributed
  human game evidence; no automatic user-session status is inferred.
  If launch times out or a PID belongs to another product, preserve UNKNOWN.
- **One owner per action:** no second Rust resource governor, duplicated
  Sandboxie checker, scheduled recovery daemon, account cache or UI-owned
  lifecycle inference. One request at a time where operations conflict.
- **Restart semantics:** closing the manager never silently kills a game;
  closing/reopening the manager requires a fresh read-only observation.
  Client 02's box persists; never auto-clean, clone, reset or copy sessions.

## Performance contract: control-plane overhead, not fantasy VM savings

There are **three different resource costs** that must be measured separately:

| Cost owner | What counts | Action |
| --- | --- | --- |
| Manager (Rust + Tauri + WebView2 children) | Private bytes, working set, CPU, process count and GUI responsiveness | Keep UI small, no renderer or persistent worker loop |
| Existing Sandboxie service/driver and box overlays | Incremental host CPU/RAM, registry/filesystem and disk write growth | Use one licensed, persistent box; observe without duplicating Minecraft install |
| Minecraft processes 01 and 02 | Per-game private bytes/working set, CPU, GPU, VRAM, world data, disk and network | Preserve native graphics/input; tune only supported game settings |

Memory numbers have distinct meanings: `WorkingSetSize` is mapped physical
memory, while `PrivateUsage` represents process-private committed bytes.
Simply adding both working sets can double-count shared pages. Measure
whole-host available/committed RAM **as well as** per-process values. GPU/VRAM
requires Windows-supported counters or trustworthy measurement and cannot
be inferred from PID or Minecraft FPS alone.

**Non-negotiable low-overhead defaults:**

1. **Zero background polling while idle.** No busy loop, FPS sampler,
   screenshot capture, video encoder, or CPU watchdog in the manager.
   UI updates after explicit user actions and fresh observations; no
   auto-relaunch or automatic SSO retry.
2. **Cold path = expensive validation.** Official game signature, Desktop
   installation, Sandboxie service, `SbieIni` box/global settings and
   `Start.exe /listpids` are checked on launch/explicit inspection or
   later evidenced configuration change, not on every UI render.
   The canonical PowerShell collector is a **manual diagnostic cold path**.
   The active desktop invokes it once on explicit Refresh or Client 02
   preflight in SummaryOnly mode, never once per second.
3. **Hot path = bounded, native observation, only if needed and proven.**
   After two-game acceptance, the existing Rust owner may replace repeated
   PowerShell launches with Windows process/window APIs and Sandboxie's
   supported inspection interface while retaining the canonical collector
   as the reference diagnostic. Do not introduce a duplicate always-running
   observer or new service. UI can remain manual-refresh by default.
4. **No cloned Windows installation.** One legitimate Desktop installation;
   Client 02 gets its own Sandboxie writes and Microsoft login context.
   Persist the box; do not copy Windows profiles, Microsoft tokens or private
   world files. Reuse of the executable is not a guarantee of shared game
   RAM/GPU assets or successful login.
5. **No process-level throttling until measured.** Do not impose default
   CPU affinity, job objects, RAM caps, EcoQoS or forced `BelowNormal`
   on either Minecraft game. Sandboxie may manage its own Windows job
   objects; nesting/inheritance and unexpected termination must be
   evaluated before any governor touches a sandboxed game.
   Never set kill-on-manager-close behavior. EcoQoS is for noncritical
   background work, **not a foreground playable game**.
6. **No unnecessary display pipeline.** Use ordinary Windows game
   windows with original mouse/keyboard handling. Focus/arrange through
   the existing desktop-native Windows window owner only after PID/HWND
   identity is proven. Do not mirror/embed the entire DirectX/OpenGL
   framebuffer into WebView2 or capture video to make a fake 2×2 screen.
7. **No unbounded diagnostics.** Raw accounts, command lines, window
   titles, OAuth tokens and world files stay out of reports. The current
   UI uses `-SummaryOnly`, a **single no-write observation for both clients**.
   The explicitly invoked full CLI collector continues to save an opt-in
   JSON report in `%TEMP%\MinecraftInstanceManager\SandboxieFeasibility`.
   Neither mode should run continuously.
   Never auto-delete existing user reports or sandbox state to save space.
8. **No hidden worker farm.** Launch helpers execute briefly and exit.
   Do not start per-client manager processes, Python services, telemetry
   exporters, log tailers, or an ADB-like custom server; Windows and
   Sandboxie already supply process and isolation facilities.

## Resource-performance evidence, measured against a baseline

Benchmark on the **same Windows host** and pinned release, with two
legitimately licensed Education accounts:

A. Baseline: Windows idle before launching manager, Minecraft or Sandboxie
   helper calls. Measure available RAM, CPU, GPU, disk activity.
B. Manager only (10 minutes idle): include the Tauri EXE **and all WebView2
   child processes**. Check that no automatic inspection runs while idle
   and CPU returns near the host baseline.
C. Client 01 only, running one playable world (10 minutes).
D. Client 01 + running Sandboxie service/box with no Client 02 game.
E. Client 01 + Client 02, each in a playable world (10 minutes), with
   separate manual Microsoft account identities. Exercise focus changes,
   native keyboard/mouse, local networking, join, restart, and reopening.
F. Compare incremental costs C→D (isolation overhead) and D→E (second
   real game). Never report E−C as "Sandboxie overhead" because it
   includes the entire second Minecraft.

Measure manager CPU idle/active, private committed memory, working set,
host available RAM, Minecraft process CPU/RAM, GPU utilization/VRAM when
available, frame responsiveness, startup time, game world load, disk writes,
and whether Microsoft login survives game and host restarts. Record native
sources and sample duration, not invented performance numbers.

**Engineering budgets, not claimed benchmark results:**

- Idle manager should not spawn periodic PowerShell/Sandboxie commands;
  aim for effectively zero sustained CPU activity beyond WebView2/OS idle.
- No user-visible persistent performance penalty to Client 01 from keeping
  the manager open, compared with the game-only baseline.
- All commands have bounded duration and explicit UNKNOWN on timeout;
  no background helper remains unintentionally running.
- No VM/guest OS memory reservation whatsoever in the selected workflow.
  Actual game RAM, Sandboxie overhead and WebView2 footprint cannot be
  truthfully bounded without machine measurements.
- Preserve both worlds, sessions and gameplay ahead of shaving RAM with
  destructive cache cleaning, hard memory caps or process killing.

## The one implementation sequence (dependency-ordered)

**Current — correctness and proof:** The canonical collector's
broken/duplicated source has been repaired. The active UI uses one
explicit `SummaryOnly` inspection for both clients; launch preflight
uses the same no-write path. No periodic polling or new daemon exists.
First run pinned Rust/Svelte/Node source checks; then verify sandbox PID
and real two-account gameplay. **No performance benefit is claimed
without Windows resource measurements.**

**After two-client gameplay proof — low-overhead operating mode:**
Benchmark A–F above. If explicit inspections are measurably too slow,
replace the high-frequency observation path within the **existing** Rust
owner with bounded Win32 reads; retain the collector as the canonical
deep diagnostic. No new daemon or second provider. Refuse unsafe ownership
assumptions.

**After proven membership and game responsiveness — useful MEmu-like UX:**
Connect the existing window geometry owner to proven Client 01/02 HWNDs
for focus and side-by-side layouts. This is OS-native window arrangement,
not streaming or image capture. Do not revive legacy VMware window labels
or public mutation routes by accident.

**Only after stable 2-account measured operation:** evaluate extending
the **same Sandboxie isolation model** to four separately licensed clients;
do not implement Client 03/04 or create boxes now.

## Deep pre-Windows-test failure analysis (bounded, one engine)

The source audit is **not limited to previously proven behavior**: it also
anticipates technically plausible failures, but it does not label hypotheses
as observed bugs or invent secondary virtualization providers.

| Risk | Pre-test decision / mitigation | Boundary still unresolved |
| --- | --- | --- |
| Microsoft WAM / Entra broker identity shared under the host Windows account | Manual licensed login, no token copying, no fake credential manager; block known WinCred-bypass settings and keep read-through caveat explicit | Two different playable accounts must be observed; sandbox configuration alone can never prove broker isolation |
| Single-instance handoff / shared IPC objects | Launch the official signed Desktop EXE in one fixed Sandboxie box; require its real PID membership before accepting process isolation | A launcher return code or second window label cannot prove the Minecraft child remained inside the box |
| Inherited/local templates and permission overrides | Canonical collector now checks locally and globally selected explicit OpenProtectedStorage and the legacy direct flag where declared; failures are UNKNOWN | Nested custom templates, runtime effective config, other paths and application compatibility may still be unknown; no automatic *full isolation* verdict |
| Repeated launch during startup | Serialize active manager launch requests in Rust; suppress rapid ambiguous retries and refuse an existing name-matched boxed Minecraft process **even without an HWND** | Other launchers and unknown `Start.exe /listpids` results still cannot establish exclusive ownership; never infer signed-in status |
| Installed EXE current directory, helper discovery and identity | Use the selected signed game directory as the launcher working directory, find the Sandboxie Plus helper under the same trusted Program Files roots as the collector, verify installed Desktop product metadata | Launcher/API behavior, Authenticode publisher for actual installed release, and game resource loading are not yet tested |
| GUI Start.exe output / listpids integrity | Bound executable calls, verify Start.exe exit code and listpids membership; retain UNKNOWN for malformed/unavailable output | Standard-output behavior for specific Sandboxie and Windows versions cannot be proven here |
| Game window, input and graphics ownership | Use native Windows rendering and keyboard/mouse; only window candidates identified, no gameplay or concurrent-input claims | One keyboard and mouse have one foreground-focus target at a time; independent *sequential* playability is not simultaneous independent physical input |
| Per-client operating cost | No resident extra service, VM memory reservation, screenshot streaming, background polling or power throttling. One SummaryOnly request per user Refresh | PowerShell and SbieIni still launch multiple short-lived helpers per refresh; idle vs click latency and whole-machine RAM/VRAM impact require actual benchmark |
| Persistent box and world data | Never delete, reset, clone, auto-clean or import signed-in worlds/tokens | Sandbox write overlay/disk growth and persistence through reboot are unmeasured |
| Legacy installer / environment | Existing VMware/installer identities remain untouched; experimental Tauri development route only | An installable two-client Windows release is not yet produced |

**Do not solve unknowns by adding validators that prevent every launch.**
Only reject unsafe or contradictory evidence that is actually observable.
For unresolved Microsoft identity or compatibility behavior, preserve
UNKNOWN and use the existing single two-account acceptance workflow.
The first objective remains real playable Minecraft, not a large
catalogue of static checker passes.

## Security and technical caveats

- Sandboxie is **not** a Windows user account. `OpenCredentials=OFF`
  means Sandboxie's WinCred hooks are not explicitly bypassed, **not**
  that a sandboxed process cannot read host credentials. The WinCred
  compatibility layer may fall back to native reads. A locally or globally selected
  `Template=OpenProtectedStorage` can disable the WinCred hooks regardless
  of `OpenCredentials`; the on-demand collector checks these explicit
  selections and the deprecated direct Boolean. This is not a complete
  effective-template graph audit (custom templates can include other rules);
  unreadable settings remain UNKNOWN. Neither setting establishes WAM/ADAL login-helper or SSO
  isolation; only actual independent account/gameplay evidence can do that.
- Sandboxie may be incompatible with an Education release, login broker,
  anti-tamper mechanism or protected process. Never bypass game instance
  protection, licensed account checks or authentication enforcement by
  patching DLLs/EXEs or extracting tokens.
- Sandboxie driver/service overhead is not zero. The project must respect
  applicable Sandboxie licensing and certificate terms.
- Windows Job Objects permit nested process groups under constraints; they
  can conflict with an existing sandbox lifecycle and can terminate games
  when kill-on-close is configured. Do not build a second resource governor
  until such behavior is proven necessary and safe.
- Windows EcoQoS is documented for noncritical background work, not
  performance-critical foreground interaction. Do not force it on active
  Minecraft game clients to advertise fake "Eco Mode".
- Legacy VMware source and account-bearing guest data remain preserved and
  inactive. No installer/product identity migration is authorized.

## Technical reference sources

- Sandboxie start and listpids:
  https://sandboxie-plus.github.io/sandboxie-docs/Content/StartCommandLine/
- Sandboxie credential isolation:
  https://sandboxie-plus.github.io/sandboxie-docs/Content/OpenCredentials/
- Sandboxie deletion persistence and limitations:
  https://sandboxie-plus.github.io/sandboxie-docs/Content/SandboxRemoval.html
- Windows process working set and private committed memory:
  https://learn.microsoft.com/en-us/windows/win32/api/psapi/ns-psapi-process_memory_counters_ex
- Windows job object/nested job constraints:
  https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects
- Windows EcoQoS foreground limitation:
  https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-setprocessinformation

---

## Paused VMware implementation (as-built layering)

Desktop now mounts NativeFeasibilityApp only and does not register old VMware/guest handlers. The public Rust VM mutation path fails closed. Existing guest and account files are retained. The diagram below is historical, for controlled future removal.

## One runtime owner per responsibility

```text
Svelte desktop UI (apps/desktop/src)
    ↓ typed bridge (apps/desktop/src/app/bridge)
Thin Tauri command adapters (apps/desktop/src-tauri/src/commands)
    ↓ public Rust contract
Rust canonical runtime-core (engine/runtime-core)
    ├── doctor / one first-run setup decision
    ├── lifecycle admission, provenance, identity, version parity
    ├── provider reconciliation and resource pressure
    ├── guest protocol / interactive Minecraft launcher
    ├── recovery / snapshots / staged update
    └── VMware provider
        ├── Workstation (Windows)
        └── Fusion (macOS)
    ↓
Windows guest and bounded Agent scripts (engine/guest/windows)
```

Desktop window arrangement/overlay is a desktop-native operation in `apps/desktop/src-tauri/src/engine/`; it never determines VM readiness. `engine/distribution/` owns machine-readable installer and trusted-release policy.

## Critical invariants

- Rust is the only provider/lifecycle/readiness decision authority; Svelte presents state, not a second lifecycle manager.
- Native Minecraft is the version authority. Guest Base and live Virtual lineage must match.
- A stopped, finalized Base is required for a safe clone; normal VM operations do not destroy selected account-bearing state.
- Per-Virtual Guest Agent authentication, Windows identity and Microsoft account sessions must remain isolated.
- Provider power state, Guest Agent response, process execution, signed-in game UI and actual multiplayer usability are distinct evidence.
- Memory and vCPU limits are configuration, not measured GPU/RAM/game performance proof.
- App updates may stage trusted files, but automatic self-apply remains off.
- Source-path cleanup never renames installed `M-Bedrock Virtual Clients`, its Windows identifier, guest wire protocol, snapshot identity or persisted runtime path.

## Proof boundary

Use [Validation](../validation/README.md) for source, package, VM and game proof. Review the [Implementation Map](./implementation-map.md) before changing a consumer. Windows NSIS is the declared desktop packaging route; Fusion source exists but a macOS desktop release is not yet accepted.

## Provenance

Product source was separated from `MIVUBI-STD/M-Lazy-Developer` `Experimental` at commit `89cb8691f6757d287707bb8cae2d0d810b751404`. This history is not an active runtime dependency.
