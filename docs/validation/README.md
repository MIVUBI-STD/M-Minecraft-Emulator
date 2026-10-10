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
| Is the source and Windows installer ready to be taken to the user's PC for the first local test? | [Pre-Local-Test Readiness](./pre-local-test-readiness.md) — mandatory G1–G4 gates |
| Can one Windows VMware guest boot, install/sign in and play Minecraft Education responsively? | [Client Feasibility Gate](./client-feasibility.md) — before Base cloning |
| What real tests must pass? | [Target-machine Acceptance](./acceptance.md) |
| What is statically covered versus unproven? | [Static Readiness](./static-readiness.md) |
| What specific four-client failures must be exercised? | [Four-Client Failure Matrix](./four-client-failure-matrix.md) |
| What does the Minecraft/VMware platform officially require? | [Platform Prerequisites](./platform-prerequisites.md) |

## Evidence hierarchy

```text
Exact GitHub source / package verification
→ one interactive Windows VMware guest: boot
→ Minecraft Education Windows desktop install and distinct licensed login
→ real world rendering, input and responsive gameplay
→ prepared account-clean Base + three isolated Windows guests
→ Native + Virtual-01/02/03: four separate licensed sessions concurrently
→ measured load, recovery and optional multiplayer acceptance
```

A lower level cannot authorize the next. Machine collector source lives in `../../tooling/acceptance/windows/`; a completed collection proves only the fields directly observed. Player/gameplay acceptance still requires real Minecraft evidence.

Verification jobs are manual-only; `planning/development.md` records open proof status, not this router.
