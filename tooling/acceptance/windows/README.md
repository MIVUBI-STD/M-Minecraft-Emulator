# Windows Acceptance Tooling

**Selected active experiment:** [Client 01 native + Client 02 Sandboxie Plus](../../../docs/validation/sandboxie-two-client-feasibility.md).
Use `collect-sandboxie-feasibility.ps1 -Stage INSPECT -BoxName MinecraftClient02`
for an explicitly requested observation; the desktop uses its read-only
`-SummaryOnly` option. PID/window counts cannot prove licensed login,
Minecraft rendering or multiplayer.

## Active two-client process performance sampling (manual, read-only)

`collect-native-performance.ps1` is an **optional on-demand** Windows
sampler for the current native + Sandboxie experiment. It does not launch games,
inspect accounts/worlds, certify which process belongs to Minecraft, or test FPS.
The operator must first identify two existing game PIDs via the approved
Sandboxie inspection and verify them in the actual Windows session. Example:

```powershell
powershell.exe -NoProfile -File .\tooling\acceptance\windows\collect-native-performance.ps1 `
  -NativePid <NATIVE_PID> -IsolatedPid <BOXED_PID> `
  -DurationSeconds 3600 -SampleIntervalSeconds 5
```

The command is **not executable until real client processes are available**.
It captures relative elapsed times, per-process working set and process CPU
percentage normalized to the logical CPU count, into a timestamped JSON file
under the user's local TEMP folder. Output intentionally excludes PIDs,
process paths, user/account names, world data and credentials. An inaccessible,
terminated or replaced PID becomes UNKNOWN for the remainder of that capture.
No thresholds are declared; `automaticVerdict=NOT_PROVIDED` and the result is
**PROCESS_TELEMETRY_ONLY**. Do not upload raw private device captures to Git.

For the actual 60-minute acceptance review, pair the process sample with
independently recorded PresentMon frametimes (if supported by the real renderer),
GPU/VRAM telemetry, user-observed input responsiveness, independent licensed
worlds and multiplayer evidence. Compare single versus two-client runs on the
same PC, resolution and game settings. No performance sample alone promotes
G0–G4 or proves account separation. Windows/PowerShell execution of the sampler
is currently **NOT_EXECUTED**.

## Historical VMware-only G0–G4 campaign (paused)

The stages and procedures below document the retained Windows-guest
acceptance implementation. They are **not** the active startup/installation
workflow and do not authorize changing account-bearing guests. The old NSIS
release is deliberately blocked. Do not create another test gate scheme.

This campaign is evidence collection, not simulation. A stage stays `NOT_RUN` until its target-machine action has actually been performed. **The only five product-test progress gates are G0–G4 in [Acceptance](../../../docs/validation/acceptance.md)**; the existing stage IDs and recorder schema stay unchanged. Stage records are supporting evidence, not twelve independent release milestones.

## Stages

| Stage | Supports gate | Purpose | Evidence owner |
| --- | --- | --- | --- |
| CLIENT_FEASIBILITY | G1 | **Before production VM setup:** prove one disposable Windows guest on the candidate provider renders Minecraft Education; capture actual OpenGL and D3D11 hardware when using GPU-PV | operator + read-only guest collector |
| HOST | G1 (baseline) | Record Windows, VMware, CPU, memory, GPU, hypervisor/VBS and Native Minecraft facts | collector |
| SINGLE_VM | G2 | Prove one Virtual lifecycle on the target provider | operator + collector |
| GUEST | G2 | Prove VMware Tools, Guest Agent and interactive launcher progression | collector |
| MINECRAFT | G2 | Prove Minecraft launches in the intended interactive session without duplicate launch | operator + collector |
| ACCOUNT | G2 | Prove one licensed account can sign in and persist through the intended recovery workflow | operator |
| THREE_VMS | G2 | Prove Virtual-01/02/03 coexist with unique identities | operator + collector |
| FOUR_MINECRAFT | G3 | Prove Native + three Virtual Minecraft clients coexist and remain interactive | operator + collector |
| FOUR_ACCOUNTS | G3 | Prove four distinct licensed sessions remain isolated | operator |
| MULTIPLAYER | G4 | Prove required Native↔Virtual and Virtual↔Virtual join paths | operator |
| RECOVERY | G4 | Prove stop/start, suspend/resume, reset and host reboot behavior | operator + collector |
| SOAK | G4 (supporting) | Record long-run stability and repeated lifecycle cycles | operator + collector |

## Historical Windows guest route (not currently selected)

The product target is **one Windows-native Minecraft Education desktop client plus three isolated Windows guest clients**. The installed production code remains VMware; the approved App Sandbox GPU-PV direction is limited to a disposable pilot until G1 proof. Do not run Android, BlueStacks or second-native-instance probes. Start with a disposable scratch Windows guest, before production Base preparation. Confirm **VM opens → Minecraft Education installs and signs in → a world is playable and responsive**.

The [Product Goal](../../../docs/product/four-concurrent-accounts.md) and [One Guest Feasibility Gate](../../../docs/validation/client-feasibility.md) specify evidence and stop criteria. The guest collector cannot observe account sign-in or game rendering directly: its operator declarations are **not automatically verified**. Do not record PASS until actual operator/game evidence has been reviewed.

## Mandatory one-Windows-guest proof

Before creating three account-bearing Windows VMware clones, record these **in order** on a disposable scratch Windows guest:

1. **VM opens** — guest boots to a responsive Windows desktop; VMware Tools and input function.
2. **Desktop Education installs and signs in** — choose exactly one official Windows installer type, launch the real Minecraft Education client, sign in manually with a distinct legitimately licensed organization account.
3. **World plays responsively** — load a Minecraft world, test camera/keyboard/mouse and 3D rendering for an initial 10 observed minutes without an obvious crash, freeze or severe input lag.

The `collect-client-feasibility.ps1` `INTERACTIVE` stage now asks for explicit operator observations (`-VmDesktopOpened`, `-EducationInstalled`, `-EducationSignedIn`, `-CrashOrFreezeObserved`, `-ObservedMinutes`) alongside the previous rendering flags. These are claims to review, not machine-certified PASS. Never submit identities, license keys or credentials. Stop escalation if any gate fails.

## Early client-graphics feasibility pilot

Use `collect-client-feasibility.ps1` **inside one interactive Windows scratch guest** with `-Provider VMWARE` (default) or `-Provider APP_SANDBOX_GPU_PV`. It is read-only except its temporary report and does not require Guest Agent, account-name capture or a configured three-VM application. Collect `ENVIRONMENT`, then manually open Minecraft Education, observe a usable world and collect `INTERACTIVE` with explicitly operator-attributed observations.

For GPU-PV, the collector measures a **D3D11 hardware FL11_0** device and WGL OpenGL version/vendor/renderer and the evaluator refuses a reported-playable GPU-PV outcome when hardware evidence is missing. Do not substitute VMware Tools, host GPU names or App Sandbox flags for guest graphics observations.

Review the JSON with `../evaluate-client-feasibility.mjs`. The reviewer never certifies official client support; it reports `OPERATOR_REPORTED_PLAYABLE`, `OPERATOR_REPORTED_FAILURE` or `INCONCLUSIVE`, never a synthetic PASS. The existing `new-stage-result.ps1 -Stage CLIENT_FEASIBILITY` records a **separately reviewed** decision with an actual evidence reference.

Canonical guide: [Client Feasibility](../../../docs/validation/client-feasibility.md). A scratch-guest failure stops further cloning and account setup until graphics/driver/VM compatibility is understood.

G0 has no Windows evidence-recorder stage: it is derived from executed source, package, payload and disposable installer-safety checks in [G0 Readiness](../../../docs/validation/pre-local-test-readiness.md). `HOST` establishes a baseline; it does not prove G1 on its own. `SOAK` is supporting evidence and cannot replace G4's recovery and multiplayer observations.

## Result vocabulary

**Safety:** `collect-acceptance.ps1` is observation-only by default. Optional `-VerifyIdentities` may update identity evidence and is blocked unless all three Virtual clients are provisioned and RUNNING. Every CLI response must have a valid schema-1 success envelope; malformed responses fail closed.

Use only:

- `NOT_RUN` — target-machine action has not been performed.
- `OBSERVED` — evidence was collected, but the stage does not have enough evidence for pass/fail.
- `PASS` — every required assertion for that stage was actually exercised and supported by evidence.
- `FAIL` — at least one exercised required assertion failed.
- `BLOCKED` — the stage could not be exercised because an earlier dependency failed.

Do not infer a **gate PASS** from a stage result, source tests, CI, documentation, configured NAT, process existence, or a successful collector run. The recorder's `NOT_RUN` means `NOT_EXECUTED` in the human-facing five-gate summary; partially observed stages do not promote their gate.

## Campaign order

Use the stages as **one campaign grouped by G1–G4**, not as a new test activity after each code patch. Stop escalation on a real failed required outcome; diagnose the first wrong owner and revisit affected/dependent gate outcomes. Do not re-run the entire campaign for source-only edits or repeatedly exercise already evidenced scenarios without a relevant change.

Use `collect-acceptance.ps1` before and after meaningful runtime transitions. The collector must support HOST/baseline **before any VM is provisioned**: `resourcesCollected=false` and null resource measurements explicitly mean *not yet available*, not zero or success. Only after all three Virtual clients are provisioned may the optional `resources 3` command be queried. No unobserved multiplayer or provisioning-ready flags may be created. Preserve each output as evidence for the campaign rather than overwriting previous captures.


## Performance evidence

Use `performance-contract.json` during target-machine performance acceptance. Record measurements as observations, not conclusions.

The purpose is to calibrate the single automatic performance policy with real Native + Virtual-01/02/03 evidence. Do not change configured RAM, vCPU, GPU policy or startup thresholds from an incomplete run. Missing measurements remain unknown; they are never treated as zero or PASS.

At minimum, capture the host baseline, each Virtual VM start duration, Guest Agent readiness duration, Minecraft readiness duration, observed host working set, 3D-graphics observation, resolution, peak host CPU during sequential startup, concurrent Minecraft count and operator responsiveness.

Performance acceptance must distinguish:
- capacity: what the hardware should reasonably support;
- pressure: whether another client should start now;
- experience: whether Native and the running Virtual clients remain usable together.

The benchmark harness does not automatically declare a performance PASS. Threshold calibration is a separate evidence review after representative target machines have been measured.
