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

## Quick start — first Windows session

For a new checkout, open PowerShell 7 in a normal developer folder and run:

```powershell
git clone --branch Local --single-branch https://github.com/MIVUBI-STD/M-Minecraft-Emulator.git
cd M-Minecraft-Emulator
.\DEV.cmd preflight
```

For an existing checkout, inspect `git status --short` first, preserve any local edits, then use `git switch Local` and `git pull --ff-only origin Local`. Never run `git reset --hard` as a troubleshooting shortcut.

**Stop at the first failed stage.** If preflight passes, run the developer UI in a terminal at the same repository root:

```powershell
.\DEV.cmd dev
```

This developer mode does not install/replace the old VMware manager.

## A. Before starting (stop on failures)

1. Use **branch `Local`** at a known commit (prefer latest reviewed `Local`). Confirm the checkout is clean with `git status --short` and record `git rev-parse HEAD`. Source changes or untracked edits can invalidate exact-head verification.
2. Install [Node **24.21.0** with bundled npm **11.19.0**](https://nodejs.org/en/download/archive/v24.21.0), Rust **1.98.1** with rustfmt and **x86_64-pc-windows-msvc** host, [PowerShell **7+**](https://learn.microsoft.com/en-us/powershell/scripting/install/install-powershell-on-windows) and Git. For Tauri, ensure [MSVC Desktop development with C++ and WebView2](https://v2.tauri.app/start/prerequisites/) are available. The toolchain doctor checks exact language versions; only a real build establishes linker/SDK compatibility.
3. Use an [official Minecraft Education Windows Desktop installation](https://edusupport.minecraft.net/hc/en-us/articles/13106858087956-Windows-Installation-Guide), not copied binaries or mixed Microsoft Store + Desktop editions. Have **two distinct properly entitled Education accounts** ready for manual sign-in. Do not place usernames, tokens, passwords, world files or screenshots exposing identities in Git.
4. Use a legitimately licensed [Sandboxie Plus installation](https://sandboxie-plus.com/downloads/) in the applicable environment. Check the vendor's business/educational certificate requirements where applicable. Create **one clean, persistent, enabled** box named exactly `MinecraftClient02` in Sandboxie Plus. Keep **AutoDelete**, **AutoRemove** and credential-bypass/protected-storage settings disabled; do not clone existing account data. The manager does **not** provision the box or its license. Check effective settings in Sandboxie Plus, including templates.

### Source verification (repository root)

```powershell
.\DEV.cmd preflight
```

**Stop if this command fails.** `DEV.cmd preflight` prints four numbered stages, rejects unsupported Windows hosts, and confirms a clean committed `Local` SHA, checks pinned developer tools and the tracked Cargo lockfile, installs locked desktop npm dependencies, runs root `npm run verify:source`, and rechecks that tracked source/HEAD did not change. It does not open the desktop or package the application. If a stage fails, keep the first error and SHA; do not retry by disabling checks. The source verifier runs repository rules, evidence evaluator tests, frontend Svelte/TypeScript/Vitest/build checks, Rust checks/tests/format. A Git commit or an authored test is *not* evidence of a passing command. A clean verification result does not prove Minecraft playability.

**Do not use** `npm run package:windows`, `npm run build:app`, `DEV.cmd package` or `DEV.cmd g0` to obtain an installer: those legacy VMware packaging paths are deliberately blocked while this native pilot is active.

### Start the developer-mode application

```powershell
.\DEV.cmd dev
```

This runs the desktop development UI, **not** the release installer or a virtual machine. Leave the developer console visible; record only generic error classifications and timings. Do not edit game executables, profiles, or credential storage.

## B. Two-client manual acceptance sequence

Start with a short smoke test: verify that the manager opens, then Client 01, then the independent Client 02 window, then distinct licensed sign-ins and playable worlds. Attempt multiplayer, restart persistence and long-duration performance only after this basic sequence succeeds. The controller does not automatically verify account identities or game playability.

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
| `DEV.cmd preflight` fails | Save the first failing command, compiler message, git SHA and tool versions; do not proceed to gameplay. |
| `Refresh` fails or membership UNKNOWN | Report Sandboxie version, collector error category, whether the box exists, and whether its service is running; do **not** keep clicking launch. |
| Start Menu / Desktop edition rejected | Inspect official Windows installation/Start app mapping; record language and install-path category, **not** private path or credentials. Do not relax signer verification just to pass. |
| Launch requested but no second window | Check whether Minecraft focused the first instance, an unsigned/unattributed process appeared, or Sandboxie reported an error; record result as inconclusive/failure as appropriate. |
| Distinct sign-ins fail | Stop the experiment; do not patch the executable, broker, tokens or license checks. |
| Game crashes / input broken / account crossing | Stop scaling; preserve existing worlds/profiles and record the first reproducible failure and hardware summary. |
| Installer request | Existing package path is deliberately blocked. Only developer mode is supported for this pilot. |

## E. Evidence handoff — no secret data

When reporting the **first** error, send a short manually redacted report instead of raw logs or account details:

```text
COMMIT SHA:
WINDOWS: 10/11 x64
PREFLIGHT: PASS / FAILED / NOT_RUN
FAILED STAGE: 1/4, 2/4, 3/4, 4/4 or NONE
FIRST ERROR: <failing command + redacted error>
DEV UI OPENS: YES / NO / NOT_TESTED
REFRESH STATUS: OBSERVED / UNKNOWN / ERROR / NOT_TESTED
CLIENT 01 PLAYABLE: YES / NO / NOT_TESTED
CLIENT 02 WINDOW: YES / NO / UNKNOWN / NOT_TESTED
SEPARATE ACCOUNT SESSIONS: YES / NO / UNKNOWN / NOT_TESTED
```

Do not share usernames, access tokens, IP addresses, full filesystem paths containing personal names, private worlds, or screenshots with visible account identities. A source preflight PASS does not establish successful multi-instance gameplay.



Record the exact SHA, Windows version, official Minecraft version, Sandboxie version, app/toolchain versions, elapsed time for Refresh and launch, observed window count, world responsiveness, distinct-account outcome as **YES/NO/UNKNOWN** (no identities), multiplayer result, persistence result, approximate CPU/RAM/GPU measurements, reproducible error message, and whether the observation is **machine-observed** or **operator-reported**.

**Proof ceiling:** Until real source verification and Windows two-client testing execute, `SOURCE_EXECUTION`, `TARGET_WINDOWS`, `MINECRAFT_RUNTIME` and four-client acceptance remain **NOT_EXECUTED**. Review [REA-aligned audit](./rea-source-audit-2026-10-13.md) for still-open source risks. This document does not add a second state machine, test gate or service.
