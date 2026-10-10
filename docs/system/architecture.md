---
id: document.system.architecture
class: DOCUMENT
domain: system
role: CANONICAL
authority: CANONICAL
lifecycle: ACTIVE
---

# Architecture

## Scope

Manage one native Minecraft Education client and at most three isolated VMware guest clients. The user controls gameplay and Microsoft sign-in. The program is a VM manager, not a native Minecraft engine emulator or general VM hypervisor. Release-ready or four-client support has not been demonstrated on a real target machine.

## One execution and truth path

```text
Svelte 5 UI (apps/virtual-clients/src)
    ↓ typed facade
Tauri 2 commands (apps/virtual-clients/src-tauri/src/commands)
    ↓ thin adapter, no duplicated lifecycle policies
Rust VM authority (virtual-clients/runtime-core)
    ├── doctor / initial setup decision
    ├── lifecycle admission / state, immutable Base and snapshots
    ├── identity, Native/Base/Virtual version parity
    ├── pressure monitoring and staggered starts
    ├── guest protocol and launch
    └── provider abstraction
        ├── VMware Workstation (Windows)
        └── VMware Fusion (macOS)
    ↓
Windows guest and fixed-scope Guest Agent
```

Desktop-native screen/window layout is owned only by `apps/virtual-clients/src-tauri/src/engine/`; it never certifies that a guest is signed in or has joined multiplayer.

## Critical invariants

- One Native Minecraft version authority; mismatched Base or virtual lineage blocks unsafe operations.
- Base is registered and finalized before clone. Reprovision is explicit and destroys only the selected guest state.
- Three virtual clients have isolated guest disks, unique identities and per-VM tokens. Accounts stay inside the correct guest.
- First run uses backend `DoctorReport.nextSetupAction` as sole setup owner. The UI never persists a second setup-complete state.
- Provider operations must be observable, bounded and fail closed on uncertainty.
- VM RUNNING, Guest Agent reachable, Minecraft process running, Minecraft signed in, and multiplayer ready are separate observations.
- No auto-kill on memory pressure and no fictitious GPU/FPS optimization controls.
- App updates may be staged; runtime self-apply and unattended provider/Minecraft installation remain disabled.
- Installed `M-Bedrock Virtual Clients` identity and data paths are a compatibility boundary; a new repo title must not silently rewrite them.

## Proof boundaries

Static source review is not a Windows build. A Windows build is not proof of VMware's session, GPU, account isolation or four-client multiplayer. Reference acceptance authority: `../../virtual-clients/docs/acceptance.md`.

The backend provider includes a macOS implementation, but Windows NSIS is the currently specified desktop distribution path. Any macOS installer/support claim requires its own proof.

## Source extraction

The functional VM source was preserved from `MIVUBI-STD/M-Lazy-Developer` `Experimental` commit `89cb8691f6757d287707bb8cae2d0d810b751404`. Its map inspection and repair engine are **not** part of this repo. Governance follows the modular responsibility/proof approach of that project's `Local` branch.
