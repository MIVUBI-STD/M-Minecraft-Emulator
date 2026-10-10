---
id: document.validation.pre-local-test-readiness
class: DOCUMENT
domain: validation
role: PROCEDURE
authority: CANONICAL
lifecycle: ACTIVE
---

# Pre-Local-Test Readiness — Windows Desktop VMware

## Scope

This is the STOP gate before asking the operator to install or exercise M-Minecraft-Emulator on their Windows PC. It applies only to the approved product: **Native Windows Minecraft Education plus three isolated Windows VMware Workstation Minecraft Education desktop guests**, four distinct licensed accounts, all usable simultaneously.

**Do not interpret source presence, static scans, a green documentation checklist or GitHub commits as executable readiness.** The real guest and Minecraft compatibility question is intentionally answered **during** targeted Windows acceptance, *after* source and package preparation are complete.

## Early diagnostic consistency

Base registration and daily guest startup now reject Guest Agent versions that only provide `GET /status` but lack the supported fixed Minecraft Education launch action. A VM's power state, reachable Agent or a v1 status protocol must not be mistaken for game-launch readiness. This invariant is covered by a pure Rust unit test, but the unit test is **NOT_EXECUTED** until the locked Rust source check runs.

## Four prerequisite checks (all mandatory before requesting a local PC test)

| Gate | Evidence required | State for current GitHub-only context |
| --- | --- | --- |
| G1 — exact-source validation | On **one pinned Local SHA**, successfully execute `npm run verify:source` using `toolchain.json` pins: Node/npm, Svelte typecheck/Vitest/frontend build, Tauri Rust check/tests, runtime Rust check/tests/fmt, and feasibility evaluator tests | NOT_EXECUTED |
| G2 — actual Windows package | On an independent, authorized Windows x64 build runner, successfully execute `npm run package:windows` and inspect the generated NSIS installer; build output/exit codes and package manifest recorded against same exact SHA | NOT_EXECUTED |
| G3 — package integrity | Run Windows package-smoke/installer inspection: verify **all `engine/distribution/package-contract.json` mandatory installed files**, including CLI, Guest Agent executable, Base setup/finalization scripts and `acceptance/windows/collect-client-feasibility.ps1` | NOT_EXECUTED |
| G4 — installation safety | Exercise install/repair/uninstall/reinstall in a disposable Windows environment; confirm no unexpected deletion of `M-Bedrock/VirtualClients` data or account-bearing VMs and no silent downgrade / unauthenticated updater behavior | NOT_EXECUTED |

When a gate fails: fix the **first causal source owner** on `Local`, repeat relevant source execution, and record the new exact commit SHA. Do not ask for piecemeal user-PC testing to compensate for unrun build steps.

Use the current canonical commands and workflows in [Development Operations](../system/development-operations.md) and [Target Acceptance](./acceptance.md). The GitHub `workflow_dispatch` YAML exists on `Local` but cannot currently be dispatched because GitHub requires its definition on default `main`, which the user explicitly wishes to leave README-only. **Do not modify main or switch the default branch to unlock CI.** An independently authorized cloud/Windows builder can provide the same exact-SHA proof.

## After these gates: first real target-PC acceptance

Only then move a genuinely built and package-smoke-inspected candidate to target Windows acceptance. The very **first** interaction is a **disposable, account-clean Windows VMware guest**, not three provisioned production clients:

1. Windows VMware guest opens to a responsive interactive desktop, with VMware Tools, virtual graphics and mouse/keyboard working.
2. One official Minecraft Education Windows Desktop EXE (or Store variant **separately**, never both) installs inside the guest; a distinct licensed Microsoft organization account signs in to the real game UI.
3. Load a real Minecraft Education world and observe rendering, movement and input response for an initial 10 minutes without blocking errors, freeze or crash; collect bounded display/driver/guest observations.

The first two steps are **operator/game/UI observations**, not something to fake with a registry entry or Guest Agent process count. Microsoft sign-in, authentication prompts, real 3D rendering and responsiveness require an actual Windows machine with proper entitlement and cannot be proven by hosted static code checks.

See [One Guest Feasibility](./client-feasibility.md). If step 1–3 fails, stop. Do not promote to three VMs or four-account readiness. After a successful scratch guest, prepare the account-clean Base, create three guests, sign in with separate legitimate accounts and measure four-client concurrency.

## Host/baseline collection before any guest provisioning

The `tooling/acceptance/windows/collect-acceptance.ps1` source now records a HOST baseline without requiring three pre-existing Virtual VMs. VM resource utilization remains null and `resourcesCollected=false` until all three clients exist, avoiding an early `resources 3` failure or fake zero. This correction is source-only until a Windows PowerShell + CLI execution verifies it.

## Handoff recording requirements

In `planning/development.md`, record the actual **exact SHA**, build environment, real command or package-smoke execution, exit status, artifact hash/path/identity where applicable and unresolved steps. One commit's code changes do not qualify as a test run. The state becomes `PRE_LOCAL_READY` only when G1–G4 have real positive evidence. Source/static-review alone is `SOURCE_REVIEWED / BUILD_UNPROVEN`.

**Current outcome: NOT READY FOR USER-PC LOCAL TEST.** Not a game failure; genuine build/installer proof remains unavailable.
