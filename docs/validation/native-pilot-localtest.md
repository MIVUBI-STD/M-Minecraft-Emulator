---
id: document.validation.native-pilot-localtest
class: DOCUMENT
domain: validation
role: PROCEDURE
authority: WORKING
lifecycle: ACTIVE
---

# Minecraft Instance Manager — Windows local test (native + Sandboxie)

**Scope:** developer-mode local feasibility check for **one native Minecraft Education Client 01 + one Sandboxie Plus Client 02**, on a **single Windows 10/11 x64 PC**. Does not install/replace the legacy VMware manager. Does not start/delete/reset VMware guests and does not automate Microsoft sign-in. The goal of four independently playable licensed sessions is **NOT PROVEN**.

## A. Before starting (stop on failures)

1. Use **branch `Local`** at a known commit (prefer latest reviewed `Local`). Confirm the checkout is clean with `git status --short` and record `git rev-parse HEAD`. Source changes or untracked edits can invalidate exact-head verification.
2. Install development prerequisites matching `toolchain.json`: Node **24.21.0**, bundled npm **11.19.0**, Rust **1.98.1** with rustfmt and **x86_64-pc-windows-msvc** host, and PowerShell **7+** for the optional `DEV.cmd` launcher. Windows desktop build prerequisites must be installed; use the existing `docs/system/development-operations.md`.
3. Use an official, installed **Minecraft Education Windows Desktop** build, not copied binaries or mixed Microsoft Store + Desktop editions. Have **two distinct properly entitled Education accounts** ready for manual sign-in. Do not place usernames, tokens, passwords, world files or screenshots exposing identities in Git.
4. Use a legitimately licensed Sandboxie Plus installation in the applicable environment. Create **one clean, persistent, enabled** box named exactly `MinecraftClient02` in Sandboxie Plus. Keep **AutoDelete**, **AutoRemove** and credential-bypass/protected-storage settings disabled; do not clone existing account data. The manager does **not** provision the box or its license. Check effective settings in Sandboxie Plus, including templates.

### Source verification (repository root)

```powershell
git branch --show-current
git rev-parse HEAD
git status --short
.\DEV.cmd doctor
npm run setup
npm run verify:source
```

**Stop if any command fails.** The source verifier runs repository rules, evidence evaluator tests, frontend Svelte/TypeScript/Vitest/build checks, Rust checks/tests/format. A Git commit or an authored test is *not* evidence of a passing command. A clean verification result does not prove Minecraft playability.

**Do not use** `npm run package:windows`, `npm run build:app`, `DEV.cmd package` or `DEV.cmd g0` to obtain an installer: those legacy VMware packaging paths are deliberately blocked while this native pilot is active.

### Start the developer-mode application

```powershell
npm run dev
```

This runs the desktop development UI, **not** the release installer or a virtual machine. Leave the developer console visible; record only generic error classifications and timings. Do not edit game executables, profiles, or credential storage.

## B. Two-client manual acceptance sequence

| Step | Action | Expected observation | Decision |
| --- | --- | --- | --- |
| 1 | Open the app; select **Refresh both clients** | Clear Sandboxie configuration and process membership, or an actionable refusal/UNKNOWN | If UNKNOWN, inspect Sandboxie service, box and process access. **Never interpret UNKNOWN as an empty box.** |
| 2 | Select the official installed Education **EXE** and confirm Sandboxie licensing | **Launch Client 02** only becomes available after a valid refreshed empty-box observation | Disabled state is expected when a candidate already exists; avoid duplicate launches |
| 3 | Launch Client 01 through the UI; verify that one real Education menu appears | Native window accepts input; game edition is correct | Refocusing an existing app or candidate PID is not proof of an additional client |
| 4 | Refresh again, then explicitly request **Launch Client 02** | An *independent* window opens in `MinecraftClient02` | Sandboxie Start.exe success alone is not evidence of a game window; on ambiguity refresh, **do not automatically retry** |
| 5 | Manually sign in to two distinct licensed Education accounts | Each window maintains its own account; no shared sign-in / crossing | Abort test if login cannot be independent |
| 6 | Open two separate playable worlds, interact with both, and check focus/placement | Both render and respond; controls and audio meet practical needs | If one freezes, document scenario and mark failure, not PASS |
| 7 | Test approved multiplayer connection (only with valid permissions) | Both clients interact as intended | Record errors without names, tokens, IP addresses or world contents |
| 8 | Close/reopen Client 02, restart the Windows PC, refresh and repeat | Sessions persist without cross-account reuse or unexpected data deletion | Failure means no suitable two-client verdict |
| 9 | Optional 30–60-minute sustained-use observation | Note process count, CPU/RAM/GPU/VRAM trends, responsiveness and crashes | No invented RAM or FPS acceptance threshold; measure same PC and game version |

The **focus and placement** UI actions are optional; Windows may refuse foreground focus. Use normal Alt+Tab as fallback. No manual account information is read by the manager.

## C. Read-only collector (optional diagnostics)

```powershell
powershell.exe -NoProfile -File tooling/acceptance/windows/collect-sandboxie-feasibility.ps1 -Stage INSPECT -BoxName MinecraftClient02
```

The collector emits candidate/process and box-setting information, **not** verified account or game status. Some snapshots may correctly return `UNKNOWN` if Sandboxie processes exit mid-inspection or Windows blocks discovery. Source changes now reconcile every reported box PID against a complete Windows process snapshot; inaccessible or missing IDs do not authorize Client 02 launch.

For a manually confirmed two-game report, follow the existing commands in [Sandboxie two-client feasibility](./sandboxie-two-client-feasibility.md). **Only enter YES/NO for outcomes actually observed.** An operator-reported compatible outcome is still not automated login evidence or four-client acceptance.

## D. Failure classification and next action

| Symptom | Record / action |
| --- | --- |
| `npm run verify:source` fails | Save the first failing command, compiler message, git SHA and tool versions; do not proceed to gameplay. |
| `Refresh` fails or membership UNKNOWN | Report Sandboxie version, collector error category, whether the box exists, and whether its service is running; do **not** keep clicking launch. |
| Start Menu / Desktop edition rejected | Inspect official Windows installation/Start app mapping; record language and install-path category, **not** private path or credentials. Do not relax signer verification just to pass. |
| Launch requested but no second window | Check whether Minecraft focused the first instance, an unsigned/unattributed process appeared, or Sandboxie reported an error; record result as inconclusive/failure as appropriate. |
| Distinct sign-ins fail | Stop the experiment; do not patch the executable, broker, tokens or license checks. |
| Game crashes / input broken / account crossing | Stop scaling; preserve existing worlds/profiles and record the first reproducible failure and hardware summary. |
| Installer request | Existing package path is deliberately blocked. Only developer mode is supported for this pilot. |

## E. Evidence handoff — no secret data

Record the exact SHA, Windows version, official Minecraft version, Sandboxie version, app/toolchain versions, elapsed time for Refresh and launch, observed window count, world responsiveness, distinct-account outcome as **YES/NO/UNKNOWN** (no identities), multiplayer result, persistence result, approximate CPU/RAM/GPU measurements, reproducible error message, and whether the observation is **machine-observed** or **operator-reported**.

**Proof ceiling:** Until real source verification and Windows two-client testing execute, `SOURCE_EXECUTION`, `TARGET_WINDOWS`, `MINECRAFT_RUNTIME` and four-client acceptance remain **NOT_EXECUTED**. Review [REA-aligned audit](./rea-source-audit-2026-10-13.md) for still-open source risks. This document does not add a second state machine, test gate or service.
