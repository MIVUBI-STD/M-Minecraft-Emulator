---
id: document.docs.router
class: DOCUMENT
domain: docs
role: ROUTER
authority: CANONICAL
lifecycle: ACTIVE
---

# Emulator Documentation

This is the **single documentation entrypoint**. Load only the domain needed for the task; GitHub source and machine-readable contracts remain implementation authority.

| Task | Domain route | Canonical source where applicable |
| --- | --- | --- |
| First-run VM Base, guest preparation and product setup | [Product](./product/README.md) | `engine/runtime-core/`, `engine/guest/windows/` |
| Architecture, ownership, naming, developer commands | [System](./system/README.md) | `apps/desktop/`, `engine/runtime-core/`, `tooling/` |
| Source proof, Windows/VMware/ Minecraft acceptance | [Validation](./validation/README.md) | `tooling/acceptance/windows/` and live evidence |
| Installer packaging, update and trust policy | [Distribution](../engine/distribution/README.md) | `engine/distribution/`, Tauri packaging |
| Current tasks, blockers and continuation | [Planning](../planning/README.md) | Current branch HEAD and `planning/development.md` |
| Working artifacts | [Workspace](../workspace/README.md) | Private machine evidence is not committed |

## Canonical navigation

```text
question
→ docs/README.md
→ one domain README
→ one topic owner / section
→ source and evidence only when needed
→ STOP
```

All documents under `docs/` have stable `document.<domain>.<topic>` frontmatter IDs. Paths locate documents; IDs express durable roles. Do not create parallel docs under `engine/`, `apps/` or a legacy `virtual-clients/docs/` hierarchy. README files next to source only explain local ownership and commands; they are not second normative documentation paths.

Stable implementation contract: `CONTEXT.md` + owning source. Current progress belongs only in `planning/`. Historical experiments cannot prove current VM behavior.
