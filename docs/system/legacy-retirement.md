---
id: document.system.legacy-retirement
class: DOCUMENT
domain: system
role: CONTRACT
authority: CANONICAL
lifecycle: ACTIVE
---

# Native-first cutover and inactive legacy inventory

**Decision 2026-10-12:** Prefer one official Minecraft Education Desktop
installation supporting four separately licensed, simultaneously playable
accounts, with application isolation only if necessary. This outcome is
**UNPROVEN**. The current desktop pilot does not claim four working clients.

This document is the **single deprecation register**. Executable command
authority is engine/runtime-core/src/command.rs; desktop entry is
apps/desktop/src/main.ts; Tauri command registration is
apps/desktop/src-tauri/src/app_bootstrap.rs. Retired code is not removed.

## ACTIVE: minimum launcher feasibility

| Source | State / responsibility |
| --- | --- |
| apps/desktop/src/NativeFeasibilityApp.svelte | ACTIVE PILOT; official native launch only |
| apps/desktop/src-tauri/src/engine/native_clients.rs | ACTIVE LIMITED; registered official Windows Start app, no authentication automation |
| tooling/acceptance/windows/collect-native-feasibility.ps1 | ACTIVE EXPERIMENT; read-only unless explicit launch request |
| tooling/acceptance/evaluate-native-feasibility.mjs | ACTIVE EXPERIMENT; evidence, not proof of gameplay |
| tooling/acceptance/windows/collect-sandboxie-feasibility.ps1 | FALLBACK ONLY; optional read-only third-party inspection |
| tooling/acceptance/evaluate-sandboxie-feasibility.mjs | FALLBACK ONLY; does not establish account independence |

Two-account Windows behavior, persistent authentication, multiplayer and
four-client performance are all NOT_EXECUTED. No credentials, account
tokens, profile copies or private worlds are stored in Git.

## INACTIVE: keep source until removal is safe

| Root | State / reason |
| --- | --- |
| apps/desktop/src/App.svelte and legacy app/surfaces, dialogs | UNMOUNTED; VMware wizard and VM controls not available to user |
| Tauri commands/virtual_clients.rs, setup_tools.rs, window_arrangement.rs | NOT REGISTERED in desktop IPC; old layout assumes VMware |
| engine/runtime-core/src/runtime.rs and provider/workstation.rs, fusion.rs, vmx.rs, storage.rs | VM MUTATIONS PAUSED at public command boundary |
| engine/runtime-core/src/provider/app_sandbox_pilot.rs | POWER/DISPLAY ACTIONS PAUSED; explicit inspect remains read-only |
| engine/guest/windows/, Base preparation and Guest Agent | LEGACY BUILD-ONLY; installed guest binaries not modified |
| tooling/acceptance/windows/collect-client-feasibility.ps1 and old VM G0–G4 scripts | HISTORICAL EVIDENCE ROUTE; not an active campaign |
| experiments/gpu-pv-migration-design.md | RESEARCH ARCHIVE, no production provider migration |
| engine/distribution/ and existing NSIS resources | COMPATIBILITY PRESERVED; no active production release authorized |

The pause list at command.rs blocks actions, stage-update, register-base,
open-base-finalization, provision, reprovision, verify-identities, start,
start-setup, start-client, suspend, stop, restart, set-ready, reset, open,
launch-minecraft. It also blocks App Sandbox pilot start/shutdown/display.
Every mutation returns UNSUPPORTED before invoking a provider. There is
no UI toggle or user-selectable override. Unpausing requires a reviewed
source change.

Read-only legacy diagnostics are retained by explicit CLI:
product-status, doctor, policy, base-preflight, snapshot, status,
resources, diagnostics, history, support-bundle, check-update, and
app-sandbox-pilot inspect. Some may inspect existing VMware state when
explicitly invoked. The active desktop makes no such startup calls.

## Do not delete

- Existing VM directories; VMX/VMDK, VHDX, Base disks, snapshots,
  account-bearing guest profiles, worlds, saved Microsoft sessions.
- The persisted Windows runtime root at
  %ProgramData%\M-Bedrock\VirtualClients and its provenance files.
- Installed identifier com.mivubi.mbedrock.virtualclients, release naming,
  signing/update contracts, guest protocol IDs and compatibility paths.
- Old test evidence, exact-SHA G0 proof, Git history and migration notes.

The pilot desktop cannot stop existing running VMs. If needed, an
authorized user must use the vendor's existing console to perform a
manual graceful shutdown. Installing this code does not stop or erase VMs.

## Deletion criteria — not yet met

1. Two independently logged-in Education sessions verified through actual
   game windows and real playable worlds, not candidate PIDs.
2. Four accounts playable concurrently, with multiplayer, persistence
   across close/reboot, acceptable RAM/GPU/storage and no account crossing.
3. Genuine Windows installer/upgrade/uninstall proof that preserves
   old account-bearing state and provides a practical recovery route.
4. Separate approved cleanup commit: remove old Svelte/IPC screens and
   obsolete UI tests while preserving useful regressions.
5. Separate approved provider removal commit: eliminate VMX, VMware,
   Guest Agent and packaging payloads only when migration is reversible
   and no guest data is automatically deleted.
6. Review installed product identifier and release contracts separately
   if an explicit compatible rename is ever warranted.

## Proof ceiling

At this stage GitHub source/tree inspection verifies only recorded source
paths and control guards. Rust, Node, Svelte, Windows NSIS, Sandboxie,
Microsoft authentication and real Minecraft sessions require independent
execution evidence and must not be described as passing.
