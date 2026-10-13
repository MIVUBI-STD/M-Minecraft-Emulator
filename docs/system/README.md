---
id: document.system.router
class: DOCUMENT
domain: system
role: ROUTER
authority: CANONICAL
lifecycle: ACTIVE
---

# System Documentation

Choose one document based on the requested concern:

| Concern | Canonical document |
| --- | --- |
| Layering, source authority and architecture | [Architecture](./architecture.md) |
| Paused VM pathways and safe future deletion | [Legacy Retirement](./legacy-retirement.md) |
| Locate Rust/Tauri/Guest Agent owner from an issue | [Implementation Map](./implementation-map.md) |
| VM states, provenance, parity, readiness and resource policies | [Runtime Core](./runtime-core.md) |
| Naming, source path and installed compatibility contracts | [Canonical Naming](./canonical-naming.md) |
| Smallest correct change and evidence discipline | [Development Discipline](./development-discipline.md) |
| Source verification, optional local commands, CI and release boundaries | [Development Operations](./development-operations.md) |
| Installer downloads, build outputs, local-test evidence and Git hygiene | [Artifact and Local-Test Storage](./artifact-storage.md) |

Source files remain the current implementation authority; documents organize understanding. Root `AGENTS.md` selects task mode and `GITHUB_RULES.md` controls repository writes. Work in progress is recorded in `../../planning/development.md`, not here.
