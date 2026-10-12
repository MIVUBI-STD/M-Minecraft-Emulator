---
id: document.system.implementation-map
class: DOCUMENT
domain: system
role: GUIDE
authority: CANONICAL
lifecycle: ACTIVE
---

# Implementation Ownership Map

This is a **navigation guide**, not a second registry or copy of implementation truth. For an issue, select its responsibility, then inspect the exact owning source and affected consumers.

## Locate work by problem

| Question / fault | Primary implementation owner | Consumer / companion |
| --- | --- | --- |
| Native PID/HWND candidates without accounts, tokens or VM | `apps/desktop/src-tauri/src/engine/native_clients.rs`, `apps/desktop/src/app/bridge/nativeFeasibilityApi.ts` | [Native feasibility](../validation/native-multi-instance-feasibility.md); candidate-only |
| Active desktop and blocked legacy VM routing | `apps/desktop/src/main.ts`, `apps/desktop/src/NativeFeasibilityApp.svelte`, `engine/runtime-core/src/command.rs` | [Legacy Retirement](./legacy-retirement.md); old Tauri handlers not registered |
| Prove two Minecraft Education Desktop sessions can run natively without VMs | `tooling/acceptance/windows/collect-native-feasibility.ps1`, `tooling/acceptance/evaluate-native-feasibility.mjs` | [Native feasibility](../validation/native-multi-instance-feasibility.md); historical alternative, not selected launch architecture |
| Request Client 02 launch in one persistent MinecraftClient02 Windows Sandboxie box | `apps/desktop/src-tauri/src/engine/native_clients.rs` → Tauri native command | [Sandboxie Client 02 experiment](../validation/sandboxie-two-client-feasibility.md); explicit, non-destructive launch request only |
| Distinguish signed Education image candidates positively registered in another Sandboxie box from un-attributed candidates (never native proof) | `tooling/acceptance/windows/collect-sandboxie-feasibility.ps1` → `apps/desktop/src-tauri/src/engine/native_clients.rs` | Only manual `-SummaryOnly -ImageProof` may load trusted SbieDll.dll in the short-lived inspection child and invoke SbieApi_QueryProcess; Launch/Focus/Place skip DLL probes |
| Inspect current Client 02 box membership, credentials and persistent settings, without touching accounts | `tooling/acceptance/windows/collect-sandboxie-feasibility.ps1`, `tooling/acceptance/evaluate-sandboxie-feasibility.mjs` | [Sandboxie feasibility](../validation/sandboxie-two-client-feasibility.md); active collector/evaluator, candidate observations are not proof of login |
| Focus or place known Client 02 window left/right with fresh PID/FILETIME/HWND and Sandboxie box membership | `apps/desktop/src-tauri/src/engine/native_clients.rs` → `commands/native_clients.rs` | Active `NativeFeasibilityApp.svelte`; Win32 can refuse foreground, never enable legacy VM window routes |
| Resource-efficient native/isolated management, no VM or new daemon | `apps/desktop/src-tauri/src/engine/native_clients.rs` and [Architecture](./architecture.md) | `apps/desktop/src/NativeFeasibilityApp.svelte`; one on-demand no-write SummaryOnly observation for both clients, no governor |
| Prove one disposable Windows guest can boot, sign in and render Minecraft Education on VMware or App Sandbox GPU-PV, with provider-specific graphics evidence | `tooling/acceptance/windows/collect-client-feasibility.ps1`, `tooling/acceptance/evaluate-client-feasibility.mjs` | [Client Feasibility](../validation/client-feasibility.md); no production VM mutation |
| VM status, start/stop/suspend/restart/reprovision and rollback | `engine/runtime-core/src/runtime.rs` | `lifecycle_admission.rs`, provider implementation |
| Lifecycle eligibility / guard decisions | `engine/runtime-core/src/lifecycle_admission.rs` | `runtime.rs`, `client.rs` |
| Client-owned setup phases stranded in wizard | `apps/desktop/src/app/setupFlow.ts` and `apps/desktop/src/App.svelte` | `shouldShowClientControls` and `apps/desktop/test/setup-flow.test.ts` regression |
| First-run setup decision, environment problems | `engine/runtime-core/src/doctor.rs` | Desktop `src/app/setupFlow.ts`, `src/app/surfaces/SetupSurface.svelte` |
| Base provenance, immutable finalized image and parity | `engine/runtime-core/src/profile.rs`, `base_preparation.rs` | `engine/guest/windows/prepare-base.ps1`, `finalize-base.ps1` |
| VMware Workstation/Fusion operations and VMX | `engine/runtime-core/src/provider/` | `runtime.rs`, `diagnostics.rs` |
| Explicit disposable App Sandbox pilot (`inspect/start/graceful shutdown/display`) | `engine/runtime-core/src/provider/app_sandbox_pilot.rs` | [GPU-PV Disposable Pilot](../validation/gpu-pv-disposable-pilot.md), CLI only; no production VM controls |
| Identity and guest disk isolation | `engine/runtime-core/src/identity.rs`, `provider/vmx.rs` | `profile.rs`, `engine/guest/windows/` |
| Guest Agent authenticated status/launch | `engine/runtime-core/src/guest.rs`, `src/bin/virtual-guest-agent.rs` | `engine/guest/windows/install-guest-agent.ps1` |
| Native Minecraft detection and executable constraints | `engine/runtime-core/src/minecraft_runtime.rs`, `profile.rs` | `guest.rs`, `doctor.rs` |
| RAM/CPU resource pressure and start admission | `engine/runtime-core/src/resources.rs`, `policy.rs` | `runtime.rs`, `capacity.rs` |
| State schema, durable profile and recovery | `engine/runtime-core/src/schema.rs`, `persistence.rs` | `journal.rs`, `runtime.rs` |
| Update policy, signed-asset manifest, installer integrity | `engine/runtime-core/src/update.rs`, `engine/distribution/` | Tauri package configurations, package smoke |
| Open host-native Windows Minecraft / inspect candidate HWNDs without claiming account or gameplay proof | `apps/desktop/src-tauri/src/engine/native_clients.rs`, native Tauri adapter | Active `apps/desktop/src/app/bridge/nativeFeasibilityApi.ts`; legacy `virtualClientsApi.ts` unmounted |
| Product desktop navigation / visual state | `apps/desktop/src/App.svelte`, `src/app/surfaces/` | `src/contracts.ts`, `src/view-model.ts` |
| Typed frontend/backend IPC and contract validation | `apps/desktop/src/app/bridge/` | `apps/desktop/src-tauri/src/commands/` |
| Desktop-native window layout, DPI and overlay | `apps/desktop/src-tauri/src/engine/` | `src-tauri/src/commands/window_arrangement.rs` |
| Windows package contents/install lifecycle | `engine/distribution/package-contract.json`, `install-lifecycle-policy.json` | `apps/desktop/src-tauri/tauri*.json`, `scripts/prepare-package-binaries.mjs` |
| Target Windows machine acceptance collector | `tooling/acceptance/windows/` | [Validation](../validation/README.md) |
| Root scripts, tooling pin/metadata and source checks | `package.json`, `toolchain.json`, `tooling/repository/verify.mjs` | `tooling/windows-toolchain/dev.ps1`, `.github/workflows/` |

## Domain boundaries

```text
ACTIVE: Svelte UI → typed bridge → thin Tauri command
→ native_clients.rs → official Windows launcher / Sandboxie Plus
→ bounded process + Sandboxie observation → candidate-only UI

PAUSED: Rust VM runtime → VMware provider / bounded Guest Agent
→ old VM status schema and desktop surfaces (unmounted)
```

UI never decides or stores whether the Base, guest or signed-in session is ready. The runtime does not own Windows window layout presentation. Documentation never replaces either.

## Route by work type

| Work | First navigation |
| --- | --- |
| Change engine behavior | [Runtime Core](./runtime-core.md) → listed Rust owner → source tests |
| Improve desktop | `apps/desktop/README.md` → affected Svelte/Tauri owner |
| Base image or guest Windows concern | [Base Image](../product/base-image.md) → `engine/guest/windows/` |
| Package/release safety | `engine/distribution/README.md` → contract JSON → Tauri consumer |
| Investigate VM/game acceptance | [Acceptance](../validation/acceptance.md) → [Failure Matrix](../validation/four-client-failure-matrix.md) |
| Continue unfinished repo work | `planning/development.md` + current GitHub `Local` HEAD |

## Exact lookup rule

Identify one first wrong owner and only its caller/test dependency closure. Search the entire repository only when a concrete cross-domain reference remains unresolved. Source, machine-readable contracts and actual runtime evidence take precedence over overview text. Keep obsolete implementation names in Git history, **not** duplicated source folders.
