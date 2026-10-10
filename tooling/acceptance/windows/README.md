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

## Four-accounts-first acceptance route

[Product objective](../../../docs/product/four-concurrent-accounts.md): four different Education accounts must stay logged in concurrently in four separate **real, interactive Windows windows**.

**Before starting VMware:** use `probe-native-multi-instance.ps1` on the Windows host. Its default `OBSERVE` mode only counts candidate visible Education windows; `TRY_SECOND` explicitly requests one additional launch using the unique registered Start-menu entry, if available. Neither a launch request nor an extra candidate process/window establishes account independence. Verify actual distinct game windows and two simultaneously signed-in different authorized accounts by direct observation, without capturing credentials. If both succeed, test reaching four with native isolation; if not, move to the one-guest pilot below.

```powershell
.\probe-native-multi-instance.ps1 -Mode OBSERVE
.\probe-native-multi-instance.ps1 -Mode TRY_SECOND
```

When `TRY_SECOND` cannot find a unique Start-menu AppID, do not guess an executable or patch single-instance safeguards. The native experiment is `INCONCLUSIVE` until real windows and accounts are observed. These commands are future acceptance steps; adding the scripts to source does not execute them.

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
