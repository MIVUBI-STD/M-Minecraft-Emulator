# Virtual Clients Windows Acceptance Campaign

This campaign is evidence collection, not simulation. A stage stays `NOT_RUN` until the required target-machine action has actually been performed.

## Stages

| Stage | Purpose | Evidence owner |
| --- | --- | --- |
| CLIENT_FEASIBILITY | **Before production VM setup:** prove one scratch Windows VMware guest can render and interact with Minecraft Education; capture OpenGL separately | operator + read-only guest collector |
| HOST | Record Windows, VMware, CPU, memory, GPU, hypervisor/VBS and Native Minecraft facts | collector |
| SINGLE_VM | Prove one Virtual lifecycle on the target provider | operator + collector |
| GUEST | Prove VMware Tools, Guest Agent and interactive launcher progression | collector |
| MINECRAFT | Prove Minecraft launches in the intended interactive session without duplicate launch | operator + collector |
| ACCOUNT | Prove one licensed account can sign in and persist through the intended recovery workflow | operator |
| THREE_VMS | Prove Virtual-01/02/03 coexist with unique identities | operator + collector |
| FOUR_MINECRAFT | Prove Native + three Virtual Minecraft clients coexist and remain interactive | operator + collector |
| FOUR_ACCOUNTS | Prove four distinct licensed sessions remain isolated | operator |
| MULTIPLAYER | Prove required Native↔Virtual and Virtual↔Virtual join paths | operator |
| RECOVERY | Prove stop/start, suspend/resume, reset and host reboot behavior | operator + collector |
| SOAK | Record long-run stability and repeated lifecycle cycles | operator + collector |

## Single Windows desktop route

The only accepted design is **one Windows-native Minecraft Education desktop client plus three separate Windows VMware Workstation guest clients**. Do not run Android, BlueStacks or second-native-instance probes. Start with a disposable scratch Windows guest, before production Base preparation. Confirm **VM opens → Minecraft Education installs and signs in → a world is playable and responsive**.

The [Product Goal](../../../docs/product/four-concurrent-accounts.md) and [One Guest Feasibility Gate](../../../docs/validation/client-feasibility.md) specify evidence and stop criteria. The guest collector cannot observe account sign-in or game rendering directly: its operator declarations are **not automatically verified**. Do not record PASS until actual operator/game evidence has been reviewed.

## Mandatory one-Windows-guest proof

Before creating three account-bearing Windows VMware clones, record these **in order** on a disposable scratch Windows guest:

1. **VM opens** — guest boots to a responsive Windows desktop; VMware Tools and input function.
2. **Desktop Education installs and signs in** — choose exactly one official Windows installer type, launch the real Minecraft Education client, sign in manually with a distinct legitimately licensed organization account.
3. **World plays responsively** — load a Minecraft world, test camera/keyboard/mouse and 3D rendering for an initial 10 observed minutes without an obvious crash, freeze or severe input lag.

The `collect-client-feasibility.ps1` `INTERACTIVE` stage now asks for explicit operator observations (`-VmDesktopOpened`, `-EducationInstalled`, `-EducationSignedIn`, `-CrashOrFreezeObserved`, `-ObservedMinutes`) alongside the previous rendering flags. These are claims to review, not machine-certified PASS. Never submit identities, license keys or credentials. Stop escalation if any gate fails.

## Early client-graphics feasibility pilot

Use `collect-client-feasibility.ps1` **inside one interactive Windows scratch guest**. It is read-only except its temporary report and does not require Guest Agent, account-name capture or a configured three-VM application. Collect `ENVIRONMENT`, then manually open Minecraft Education, observe a usable world and collect `INTERACTIVE` with explicitly operator-attributed observations.

Review the JSON with `../evaluate-client-feasibility.mjs`. The reviewer never certifies official client support; it reports `OPERATOR_REPORTED_PLAYABLE`, `OPERATOR_REPORTED_FAILURE` or `INCONCLUSIVE`, never a synthetic PASS. The existing `new-stage-result.ps1 -Stage CLIENT_FEASIBILITY` records a **separately reviewed** decision with an actual evidence reference.

Canonical guide: [Client Feasibility](../../../docs/validation/client-feasibility.md). A scratch-guest failure stops further cloning and account setup until graphics/driver/VM compatibility is understood.

## Result vocabulary

Use only:

- `NOT_RUN` — target-machine action has not been performed.
- `OBSERVED` — evidence was collected, but the stage does not have enough evidence for pass/fail.
- `PASS` — every required assertion for that stage was actually exercised and supported by evidence.
- `FAIL` — at least one exercised required assertion failed.
- `BLOCKED` — the stage could not be exercised because an earlier dependency failed.

Do not infer `PASS` from source tests, CI, documentation, configured NAT, process existence, or a successful collector run.

## Campaign order

Run stages in table order. Stop escalation when a stage fails. Diagnose the first wrong owner before attempting later concurrency, account or multiplayer stages.

Use `collect-acceptance.ps1` before and after meaningful runtime transitions. Preserve each output as evidence for the campaign rather than overwriting previous captures.


## Performance evidence

Use `performance-contract.json` during target-machine performance acceptance. Record measurements as observations, not conclusions.

The purpose is to calibrate the single automatic performance policy with real Native + Virtual-01/02/03 evidence. Do not change configured RAM, vCPU, GPU policy or startup thresholds from an incomplete run. Missing measurements remain unknown; they are never treated as zero or PASS.

At minimum, capture the host baseline, each Virtual VM start duration, Guest Agent readiness duration, Minecraft readiness duration, observed host working set, 3D-graphics observation, resolution, peak host CPU during sequential startup, concurrent Minecraft count and operator responsiveness.

Performance acceptance must distinguish:
- capacity: what the hardware should reasonably support;
- pressure: whether another client should start now;
- experience: whether Native and the running Virtual clients remain usable together.

The benchmark harness does not automatically declare a performance PASS. Threshold calibration is a separate evidence review after representative target machines have been measured.
