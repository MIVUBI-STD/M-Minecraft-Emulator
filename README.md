# M-Minecraft-Emulator

A dedicated Minecraft Education multi-instance virtual-machine manager developed by MIVUBI-STD.

> **What it is:** an application for coordinating one manually operated native Minecraft Education client and up to three isolated Minecraft Education clients in VMware guests. It does **not** emulate the Minecraft game engine or implement its own hypervisor.

## Branches

- `Local`: current development and source authority.
- `main`: reviewed stable/release authority. No promotion without explicit approval.

## Current implementation

- Desktop: Tauri 2 + Svelte 5 + TypeScript (`apps/virtual-clients/`).
- Runtime authority: Rust (`virtual-clients/runtime-core/`).
- VM providers: VMware Workstation on Windows, VMware Fusion on macOS (platform-specific backend sources).
- Guest: Windows Guest Agent, interactive-session launcher, guided Base preparation.
- Operational target: Native + Virtual-01/02/03, manual gameplay, distinct licensed accounts, persistent per-VM sessions.
- Desktop distribution currently targets Windows NSIS; macOS desktop release acceptance has not been established.

The app's existing installed identity remains **M-Bedrock Virtual Clients** during extraction. The repository name **M-Minecraft-Emulator** is its project identity, not a reason to silently change installed data paths, Windows integration, signing identity or compatibility contracts.

## Ownership map

```text
apps/virtual-clients/          Svelte desktop, thin Tauri adapters, native window controls
virtual-clients/runtime-core/  canonical VM lifecycle, provider, identity, state and policy
virtual-clients/guest/         Windows Guest Agent installation and Base preparation
virtual-clients/acceptance/    machine evidence collection
virtual-clients/distribution/  installer and trusted update/release contracts
virtual-clients/docs/          canonical product/domain details
docs/                          repository-wide architecture and verification routing
planning/                      current and future development intent
workspace/                     local execution evidence (sensitive artifacts ignored)
experiments/                   bounded non-authoritative research
tooling/                       source-only repository verification
```

**One responsibility, one authoritative owner.** Desktop presentation must not infer VM truth or create a parallel lifecycle database.

## Source verification and development

On a supported developer environment with the pinned toolchain from `toolchain.json`:

```bash
npm --prefix apps/virtual-clients ci
npm run verify:layout
npm run test
npm run check:desktop
npm run check:runtime
npm run test:runtime
npm run format:runtime
```

For the desktop interface: `npm run dev`. For the Windows installer package: `npm run package:windows` on an appropriately provisioned Windows build host. These commands are **not claims that builds or tests have been executed in this migration**.

When working through ChatGPT/GitHub, repository-level source edits must be completed remotely when possible; absence of access to a user's Windows PC is not a reason to abandon source-level work.

## Proof status

The imported implementation and its source contracts can be inspected in GitHub. A commit, added test, or static review is **not** proof of a successful test run, Windows installer, VMware session, Minecraft sign-in, GPU performance, or concurrent multiplayer.

See `planning/development.md` for current continuation, `docs/validation/platform-prerequisites.md` for official platform constraints, and `virtual-clients/docs/static-readiness-freeze.md` for the machine-level proof gaps.

## Migration provenance

Source files under `apps/virtual-clients/` and `virtual-clients/` were extracted from [M-Lazy-Developer / Experimental](https://github.com/MIVUBI-STD/M-Lazy-Developer/tree/Experimental), source commit `89cb8691f6757d287707bb8cae2d0d810b751404`, on 2026-10-10. Extraction keeps the existing relative source paths intact. Development conventions are modeled on [M-Lazy-Developer / Local](https://github.com/MIVUBI-STD/M-Lazy-Developer/tree/Local), not a copy of its Bedrock map-analysis engine.

No Minecraft worlds, account credentials, guest VM images, operating-system installers or runtime data are included.
