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
| What real tests must pass? | [Target-machine Acceptance](./acceptance.md) |
| What is statically covered versus unproven? | [Static Readiness](./static-readiness.md) |
| What specific four-client failures must be exercised? | [Four-Client Failure Matrix](./four-client-failure-matrix.md) |
| What does the Minecraft/VMware platform officially require? | [Platform Prerequisites](./platform-prerequisites.md) |

## Evidence hierarchy

```text
Exact GitHub source and static contract review
→ executed desktop/Rust checks
→ actual installer construction/package smoke
→ actual Windows + VMware Base/Guest observations
→ Minecraft Education sign-in, usable UI and multiplayer
→ Native + Virtual-01/02/03 full concurrent acceptance
```

A lower level cannot authorize the next. Machine collector source lives in `../../tooling/acceptance/windows/`; a completed collection proves only the fields directly observed. Player/gameplay acceptance still requires real Minecraft evidence.

Verification jobs are manual-only; `planning/development.md` records open proof status, not this router.
