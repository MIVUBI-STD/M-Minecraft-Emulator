# Emulator Stable Context

Last source model review: 2026-10-10. **Stable facts only** — current status and next tasks live in `planning/development.md`.

## Product

A local VM manager intended for Minecraft Education QA with one manually controlled native Minecraft and three VMware-based guest clients. Not a Minecraft engine emulator or general-purpose hypervisor.

- `Local`: active GitHub source authority; `main`: deliberate stable/release authority.
- Rust runtime-core owns lifecycle, provisioning, identity, capacity, version parity, Guest Agent and persistent state.
- Tauri 2 desktop presents typed contracts via thin adapters; Svelte 5 owns presentation state only.
- Windows VMware Workstation and macOS VMware Fusion are provider implementations. Windows NSIS is the declared desktop package target.
- Native Minecraft version is the version authority. Base and virtual clients must match that lineage; compatibility is gated, not inferred.
- Guest Base: `REGISTERED → FINALIZING → FINALIZED`. Clones require a stopped finalized Base.
- Account state is contained in each guest disk. No passwords, tokens or Microsoft sessions belong in host runtime/profile metadata.
- VM run state, agent reachability, Minecraft process, signed-in menu and multiplayer usability are distinct facts.
- Readiness and provider mutations belong to the backend, not separate UI/CLI/guest state machines.
- A virtual client has a configured 4096 MB memory ceiling and two vCPUs as a provisional policy, not as proven performance measurements.
- Up to three virtual clients plus native form the target; target-machine concurrency is **not** confirmed by source review.
- Installed legacy identity/data paths remain stable until an explicitly reviewed migration.

## Canonical routes

```text
AGENTS.md → GITHUB_RULES.md → canonical source
README.md → docs/README.md → product-domain documents
planning/development.md → current work handoff
virtual-clients/docs/acceptance.md → target-machine proof obligations
```

Source provenance: `MIVUBI-STD/M-Lazy-Developer` `Experimental` @ `89cb8691f6757d287707bb8cae2d0d810b751404`.
