# GPU-PV Migration Study — M-Minecraft-Emulator

Status: DESIGN DRAFT / DIRECTION APPROVED / NO RUNTIME MIGRATION
Decision date: 2026-10-11
Baseline repository: MIVUBI-STD/M-Minecraft-Emulator, GitHub `Local` @ `d568e48dbc9cc518eb29b5a536e12e431aaa0a7b`
Upstream examined: jamesstringer90/appsandbox, release `v0.1.9` (2026-09-22), `main` @ `6f3adb6aafd4fc819d7715bdfacf52ac87df26a6`
Proof ceiling: REMOTE_GITHUB and public vendor documentation. No Node, Rust, installer, GPU-PV, Minecraft sign-in, network, or 4-client execution.

This file is research/design only under `experiments/`, **not** a second implementation registry, committed runtime policy, test gate, compatibility guarantee or permission to delete old guest data. Existing `docs/system/implementation-map.md`, `AGENTS.md`, `GITHUB_RULES.md`, and actual source continue to describe the CURRENT VMware implementation until a coherent HCS migration is implemented and accepted. `planning/development.md` holds the single current handoff.

## User-selected product intent

- Keep **one Minecraft Education Native Windows client + three isolated Windows 11 x64 guests**, each with distinct, manually signed-in licensed Education accounts, on one personal Windows 11 computer. No cloud execution and no recurring **engine/provider** fee.
- Target hardware: **Intel Core i7-14700F (20 cores / 28 threads, no iGPU), GeForce RTX 3070 (standard 8 GB GDDR6), 32 GB host RAM, NVMe SSD**. CPU scheduling is not the principal expected constraint; 8 GB shared GPU memory and 32 GB RAM are important resource risks. No automatic CPU affinity/power plan/GPU override based on conjecture.
- **Both GPU APIs required in the same x64 guest:** actual hardware-accelerated D3D11 device supporting feature level >=11_0 **AND** hardware OpenGL context >=4.4 with an identified RTX 3070 renderer. WARP/Basic Render Driver, Microsoft GDI Generic, software Mesa, host-only capability, VM setting, and version-string spoofing do not qualify.
- Minecraft Education must install/sign in, render an actual world, respond to keyboard/mouse and sustain interactive use. GPU API presence does not certify Education compatibility.
- App Sandbox (GPU-PV over Host Compute Service / Virtual Machine Platform) is the selected **new engineering direction**, not yet a production backend. The prior VMware architecture is **LEGACY / FROZEN FOR NEW FEATURES**, not deleted. Preserve Git history, account-bearing disks, snapshots, path contracts and old code until safe cutover. Do not create copied `legacy-v2` folders or two user-visible providers.
- No extra recurring App Sandbox/NVIDIA vGPU subscription. **Windows guest and Minecraft Education licensing is separate**; a Windows 11 host OEM/Pro license does not automatically license three Windows 11 guests. Verify already-held entitlement (e.g. qualifying Education/Enterprise/A3/A5 arrangements) before claiming zero additional license spending.

## Upstream technical facts; critical constraints

App Sandbox `v0.1.9` exposes a local **127.0.0.1** authenticated HTTP API from `appsandbox.exe --headless`. It discovers a per-run random token/port via `%ProgramData%\\AppSandbox\\host.json`, is admin-elevated, uses an interactive desktop session to open guest windows, and enforces a **single GUI-or-headless instance**. Guest display needs an online agent plus display driver readiness. A separate session-0 Windows service cannot display guest windows. App Sandbox owns VM mechanics; Rust may own **policy/admission, UI contracts and user-facing orchestration only**. Frontend `Svelte → Tauri → Rust` remains unchanged; **do not** connect the Svelte frontend directly to the local App Sandbox HTTP API or persist bearer tokens.

Important API/lifecycle semantics from `tools/headless-api/README.md`:
- `create` is async and automatically starts guest OS installation. Create guests sequentially to avoid staging races.
- `shutdown(name)` is **graceful ACPI shutdown**, `stop(name)` is **force-power-off**. Never map existing routine `Stop` to force power-off or invoke daemon exit with active VMs. `shutdown_daemon(force=false)` rejects live guests.
- `start` has snapshot/branch arguments; `snap_take` only works for STOPPED VMs. Snapshot/branch handling is **not equivalent** to old VMware `QA_READY` semantics. Do not claim reliable identity preservation, disk/account recovery, or safe reset without examining HCS VHDX branch behavior.
- There are multiple networking modes (`None/NAT/External/Internal`), display-open status and SSH capability. Minecraft peer-to-peer reachability from host to guest and guest-to-guest must be observed, not assumed from `networkMode=1`.
- Windows guest setup needs administrator privileges, enabled VirtualMachinePlatform and original image/driver prerequisites. The product must use the upstream dependency/snapshot/guest-agent mechanics rather than secretly running a second lifecycle manager.
- Upstream has a custom Mesa D3D12 Gallium route that may modify system `opengl32.dll` in guest Windows and can report OpenGL 4.6 **even via WARP software**. `v0.1.6` added **native NVIDIA OpenGL** paths. Prefer correct NVIDIA GPU hardware context; do not inject unreviewed DLLs into production guests or mistake "GL 4.6" for hardware acceleration. Follow upstream redistribution/signing/recovery obligations and third-party licenses.
- Upstream currently creates optional Windows autologin/SSH setup. Do not reuse a guest template after Education sign-in, embed Windows administrator credentials in Git/source, log API bearer credentials, use auto Microsoft sign-in, or expose guest account-bearing drives. App Sandbox admin process is a privileged security boundary.

## Resource baseline — hypotheses, not measured performance

| Budget | Initial design (reversible) | Do not assume |
| --- | --- | --- |
| Host CPU | i7-14700F 20C/28T; leave Windows scheduler in control | 28 dedicated vCPUs or automatic P/E affinity |
| Guests | 3 x **2 vCPU** to begin, staggered startup | that all three need 4+ vCPU |
| RAM | 3 x **4096 MB guest** = 12 GiB allocated; keep memory for host + Native, diagnostics and HCS overhead | this is guaranteed adequate for real Windows 11 + Minecraft Education |
| GPU | 1 shared RTX 3070 8 GB; hardware GPU-PV with actual NVIDIA renderer | 8 GB per guest or three separate GPUs |
| Display | Begin at approximately 1280x720/window, conservative game render/simulation distance, capped graphics features where supported | forced FPS or resolution knobs if upstream does not expose them |
| Storage | NVMe and dynamic guest VHDX; require free-space preflight, real allocation and snapshot-growth observation | allocated size equals actual on-disk usage |
| Networking | NAT first for internet; verify Native↔guest and guest↔guest join before preserving default | Internet connectivity means multiplayer success |

Host memory pressure and GPU VRAM contention are expected bottlenecks; no fixed FPS, minimum frame time, VRAM partition quota, or "eco mode" without actual device data. Avoid extra telemetry daemons, continuous GPU polling, forced power off, VM hibernation hacks, Hyper-V GPU-P undocumented tuning and security/driver workarounds.

## Target ownership boundaries

```text
Svelte product UI / Window Layout (apps/desktop)
  -> typed Tauri IPC, current Rust public contract
  -> Rust runtime-core: one policy, one Doctor, one admission,
     one operation lock, one truthful evidence/readiness projection
  -> one provider implementation selected for production: App Sandbox HCS adapter
     -> App Sandbox headless API (single upstream VM authority)
       -> GPU-PV, VHDX, built-in guest tools/display and driver setup
  -> observed GPU/guest/game facts -> Rust projection -> UI

Native Minecraft Education stays in host Windows.
Three isolated Windows 11 x64 guests retain unique identity/account state.
```

No shadow lifecycle database. Provider status must be **observed from upstream** after command receipt, not inferred from `HTTP 202 Accepted`. App Sandbox `online` means its guest agent connected, not Minecraft Education signed in or game playable. Do not persist `online == QA_READY`; do not redefine existing public enum names without intentional versioned migration.

The existing `Provider` trait and Rust runtime are VMware-semantic today (`vmx`, `vmrun`, `guest_token`, `BaseState`, `QA_READY`, VMware window discovery and path conventions). **They cannot simply receive an App Sandbox class with no contract redesign.** Trace the actual use sites and replace only the first wrong owners in a coherent batch; prevent a permanent layer of fake VMX compatibility or duplicated setup/agent managers. Keep guest account disks and historical VMware implementation inspectable through Git history; do not rename/delete installed data and guest image resources as a folder tidy-up.

## Coherent migration phases (not new acceptance gates)

**M0 — Research and source ownership design (NOW).** Freeze VMware feature work and preserve historical commit/SHA. Inventory all VMware-specific provider, profile, admission, doctor, window, package, Guest Agent, VMX/QA_READY and tests. Map App Sandbox API semantics and external source risk. Decide how the existing Rust Public Contract can be kept or version-migrated. Finish on GitHub with a single source-grounded plan; no VM mutation.

**M1 — Non-destructive App Sandbox boundary.** Design a thin Rust local loopback client consuming the upstream `version/host/list/status/capabilities` API, errors, token discovery and version pin, without authoring a second daemon, frontend HTTP access, or storing token. Provider status must remain read-only while unknown or no daemon. Address elevated daemon ownership and GUI-session display in an explicit operator workflow; do not automatically install drivers or create guests during application startup. This is SOURCE WORK before M2; do not call M1 accepted without executed evidence.

**M2 — One disposable GPU-PV guest, before account-bearing clones.** Use supported Windows 11 x64; validate RTX 3070 hardware D3D11 FL11_0, hardware OpenGL >=4.4, vendor/renderer (not WARP), guest display/input and real Minecraft Education installation/manual login and world rendering. A source-written probe or upstream rotating-cube demo is supporting evidence **only**. No "PASS" until real G1 review. If either API or game fails, STOP product scaling and diagnose actual driver/renderer first.

**M3 — Single guest daily operation and identity.** Integrate Rust's observation, admission and graceful stop with upstream `start/shutdown`. Trace VM identity, Windows identity, persistence, OS update/driver compatibility, host crash handling, guest shutdown, snapshot retention, and branch behavior. Explicitly handle force-stop as recovery-only and **never** delete a VM/account disk during setup. Separate App Sandbox agent from any Minecraft-specific launch helper, and keep the host/guest authority count minimal.

**M4 — Three guests + Native capacity.** Sequential guest provisioning with account-clean template; manual independent Windows/ Education sign-in; unique IDs and MACs; expose windows on the interactive desktop; native + three simultaneous worlds; verify GPU/CPU/RAM/VRAM pressure, VHDX I/O and all required Native↔guest, guest↔guest multiplayer paths. Keep 4 GB / 2 vCPU starting budget until actual evidence dictates changes. If 32 GB host memory or 8 GB RTX VRAM proves insufficient, mark hardware capacity limit honestly instead of introducing fake resource features.

**M5 — Coherent production switch and clean-up.** Only after a viable new path exists: migrate canonical backend/domain contracts, UI window discovery, build/package payloads, source router, product/docs and validation terminology in **bounded reviewable batches**. Preserve user-installed identity and old VMware VMs/backups by explicit migration policy. Remove old VMware implementation from active source only when no consumers remain; Git history is its archive. Do not keep dual provider modes, fork App Sandbox without necessity, publish a release or alter `main` without explicit authorization.

Only the repository's existing **G0–G4** are product test gates; M0–M5 are engineering delivery phases, not extra test-progress gates. Execute proportional source checks after a coherent change, and G0/Windows/G1/G2/G3/G4 only at their genuine proof context. No local PC use is needed to finish GitHub-verifiable source work. Runtime/GPU facts are `NOT_EXECUTED` here.

## Key blocking decisions before claiming no usage cost / maturity

1. **Windows guest rights:** App Sandbox is free/MIT; three guest Windows installations might require separate licenses or qualifying existing virtualization rights. Minecraft Education itself needs proper four-account entitlement. Never call operating costs zero without confirming both.
2. **Privileged process and secrets:** App Sandbox currently admin-elevated, loopback bearer token, single instance and optional auto-login/SSH. Decide how to run it visibly and minimize privilege exposure; protect `host.json` and guest passwords.
3. **Graphics correctness:** NVIDIA native GL vs Mesa D3D12 fallback must be distinguished. D3D11/GL both on *same* guest, same host driver, same GPU, before Minecraft gameplay.
4. **Recovery and snapshot semantics:** HCS VHDX templates/branches are not VMware linked clones. Maintain old disks untouched and do not wire destructive VM deletion/branch/reset until proven.
5. **API stability:** Upstream App Sandbox is still a relatively young 0.1.x product. Pin tested release, audit schema/commit/API, and tolerate unsupported/missing fields and `202` asynchronous outcomes.
6. **Sustained capacity:** 4 clients share one RTX 3070 8 GB; 3 Windows guests share 32 GB RAM. High CPU core count does not resolve VRAM or Windows 11 memory pressure.

## Further reading (externally owned, no code copied yet)

- App Sandbox source: https://github.com/jamesstringer90/appsandbox
- v0.1.9 release: https://github.com/jamesstringer90/appsandbox/releases/tag/v0.1.9
- API/lifecycle/security: https://github.com/jamesstringer90/appsandbox/blob/main/tools/headless-api/README.md
- Mesa/OpenGL caveats: https://github.com/jamesstringer90/appsandbox/blob/main/tools/win-mesa-gl/README.md
- NVIDIA native OpenGL change: https://github.com/jamesstringer90/appsandbox/releases/tag/v0.1.6
- Intel i7-14700F specs/no iGPU: https://www.intel.com/content/www/us/en/products/sku/236854/intel-core-i7-processor-14700f-33m-cache-up-to-5-40-ghz/specifications.html
- NVIDIA RTX3070 8GB specs: https://www.nvidia.com/id-id/geforce/graphics-cards/30-series/rtx-3070-3070ti/
- Education requirements: https://edusupport.minecraft.net/hc/en-us/articles/360047556591-System-Requirements
- Windows VM licensing: https://www.microsoft.com/licensing/guidance/Windows-11-Licensing-for-Virtual-Desktops

**Next single source task:** complete a read-only mapping from existing Rust `Provider` methods and VMware-bound runtime call sites to App Sandbox `v0.1.9` headless API capabilities, classify `preserve / adapt / remove / missing / high-risk`, and design one canonical provider boundary. Do not write executable VM mutation paths or delete VMware code until that map is reviewed.
