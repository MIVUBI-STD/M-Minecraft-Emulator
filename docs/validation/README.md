---
id: document.validation.router
class: DOCUMENT
domain: validation
role: ROUTER
authority: CANONICAL
lifecycle: ACTIVE
---

# Validation and Evidence

Read the canonical [Virtual Clients Acceptance](../../virtual-clients/docs/acceptance.md), [Static Readiness Freeze](../../virtual-clients/docs/static-readiness-freeze.md), and [Four-Client Failure Matrix](../../virtual-clients/docs/four-client-failure-matrix.md).

Platform constraints and dated external sources: [Platform Prerequisites](./platform-prerequisites.md).

## Evidence ladder

```text
Remote static source and lock references
→ executed focused frontend/Rust checks
→ Windows installer package smoke
→ real VMware host and Base/guest lifecycle
→ interactive Minecraft Education sign-in and version parity
→ Native + three virtuals, multiplayer and failure recovery
```

Do not treat a lower rung as proof of a higher one. Each failed stage belongs to a concrete existing source owner or an unresolved environment/acceptance requirement.
