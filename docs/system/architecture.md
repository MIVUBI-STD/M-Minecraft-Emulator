---
id: document.system.architecture
class: DOCUMENT
domain: system
role: CONTRACT
authority: CANONICAL
lifecycle: ACTIVE
---

# Emulator Architecture

## Product scope

Minecraft Education VM multi-instance manager for one Native client and up to three VMware Virtual clients. This is neither an implementation of Minecraft's engine nor a generic hypervisor. Source-level architecture is available; complete real-machine acceptance is separate.

## One runtime owner per responsibility

```text
Svelte desktop UI (apps/desktop/src)
    ↓ typed bridge (apps/desktop/src/app/bridge)
Thin Tauri command adapters (apps/desktop/src-tauri/src/commands)
    ↓ public Rust contract
Rust canonical runtime-core (engine/runtime-core)
    ├── doctor / one first-run setup decision
    ├── lifecycle admission, provenance, identity, version parity
    ├── provider reconciliation and resource pressure
    ├── guest protocol / interactive Minecraft launcher
    ├── recovery / snapshots / staged update
    └── VMware provider
        ├── Workstation (Windows)
        └── Fusion (macOS)
    ↓
Windows guest and bounded Agent scripts (engine/guest/windows)
```

Desktop window arrangement/overlay is a desktop-native operation in `apps/desktop/src-tauri/src/engine/`; it never determines VM readiness. `engine/distribution/` owns machine-readable installer and trusted-release policy.

## Critical invariants

- Rust is the only provider/lifecycle/readiness decision authority; Svelte presents state, not a second lifecycle manager.
- Native Minecraft is the version authority. Guest Base and live Virtual lineage must match.
- A stopped, finalized Base is required for a safe clone; normal VM operations do not destroy selected account-bearing state.
- Per-Virtual Guest Agent authentication, Windows identity and Microsoft account sessions must remain isolated.
- Provider power state, Guest Agent response, process execution, signed-in game UI and actual multiplayer usability are distinct evidence.
- Memory and vCPU limits are configuration, not measured GPU/RAM/game performance proof.
- App updates may stage trusted files, but automatic self-apply remains off.
- Source-path cleanup never renames installed `M-Bedrock Virtual Clients`, its Windows identifier, guest wire protocol, snapshot identity or persisted runtime path.

## Proof boundary

Use [Validation](../validation/README.md) for source, package, VM and game proof. Review the [Implementation Map](./implementation-map.md) before changing a consumer. Windows NSIS is the declared desktop packaging route; Fusion source exists but a macOS desktop release is not yet accepted.

## Provenance

Product source was separated from `MIVUBI-STD/M-Lazy-Developer` `Experimental` at commit `89cb8691f6757d287707bb8cae2d0d810b751404`. This history is not an active runtime dependency.
