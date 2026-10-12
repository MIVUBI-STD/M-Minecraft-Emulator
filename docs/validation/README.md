---
id: document.validation.router
class: DOCUMENT
domain: validation
role: ROUTER
authority: CANONICAL
lifecycle: ACTIVE
---

# Validation and Evidence

## Current native-first feasibility investigation (2026-10-12)

The approved *new product outcome* is four Minecraft Education Windows
sessions with four independent accounts, **without VM guests if feasible**.
The first engineering work is a bounded, non-destructive
[native two-client feasibility experiment](./native-multi-instance-feasibility.md).
This is an evidence collector and evaluator only; it does not imply native
multi-instance works or supersede any passed legacy VM package G0 record.
Existing VMware G1–G4 remain unexecuted and unrelated to native viability.

| Question | Authoritative reference |
| --- | --- |
| What are the only product-test progress gates and their exit criteria? | [Acceptance G0–G4](./acceptance.md) — one canonical five-gate campaign |
| What comprises the first source/package integrity gate? | [G0 Source & Package Readiness](./pre-local-test-readiness.md) — four mandatory checks within G0 |
| Can one Windows VMware guest boot, install/sign in and play Minecraft Education responsively? | [Client Feasibility Gate](./client-feasibility.md) — before Base cloning |
| What real tests must pass? | [Target-machine Acceptance](./acceptance.md) |
| What is statically covered versus unproven? | [Static Readiness](./static-readiness.md) |
| What specific four-client failures must be exercised? | [Four-Client Failure Matrix](./four-client-failure-matrix.md) |
| What does the Minecraft/VMware platform officially require? | [Platform Prerequisites](./platform-prerequisites.md) |

The existing Rust tests, Vitest, static checks, and Windows stage recorder provide supporting evidence. They do not introduce more product-progress gates; no new status schema or runner is used.

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

The available development mode is ChatGPT + GitHub `Local`. Existing GitHub workflow files are manual-only but cannot currently be dispatched under the protected `main` branch policy. Do not substitute a synthetic execution PASS; `planning/development.md` records the currently unexecuted gate evidence, not a second database.
