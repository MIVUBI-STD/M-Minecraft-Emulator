---
id: document.validation.router
class: DOCUMENT
domain: validation
role: ROUTER
authority: CANONICAL
lifecycle: ACTIVE
---

# Validation and Evidence

| Question | Authoritative reference |
| --- | --- |
| Can direct Windows launch create **independent** Minecraft Education instances? | [Four-account goal](../product/four-concurrent-accounts.md) + [native probe](../../tooling/acceptance/windows/probe-native-multi-instance.ps1) |
| Can Minecraft Education render inside **one** VMware guest? | [Client Feasibility Gate](./client-feasibility.md) — before Base cloning |
| What real tests must pass? | [Target-machine Acceptance](./acceptance.md) |
| What is statically covered versus unproven? | [Static Readiness](./static-readiness.md) |
| What specific four-client failures must be exercised? | [Four-Client Failure Matrix](./four-client-failure-matrix.md) |
| What does the Minecraft/VMware platform officially require? | [Platform Prerequisites](./platform-prerequisites.md) |

## Evidence hierarchy

```text
Exact GitHub source and static contract review
→ native Windows second-window + distinct-account feasibility (no VM unless needed)
→ single Windows VMware guest if native instance isolation is not viable
→ executed desktop/Rust checks
→ actual installer construction/package smoke
→ actual Windows + VMware Base/Guest observations
→ Minecraft Education sign-in, usable UI and multiplayer
→ Native + Virtual-01/02/03 full concurrent acceptance
```

A lower level cannot authorize the next. Machine collector source lives in `../../tooling/acceptance/windows/`; a completed collection proves only the fields directly observed. Player/gameplay acceptance still requires real Minecraft evidence.

Verification jobs are manual-only; `planning/development.md` records open proof status, not this router.
