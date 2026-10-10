---
id: document.system.development-operations
class: DOCUMENT
domain: system
role: OPERATIONAL
authority: CANONICAL
lifecycle: ACTIVE
---

# Development Operations

## Source authority

Develop on the remote GitHub branch `Local`; do not require a user workstation or local checkout to complete source-only tasks. Pin HEAD, read the canonical owner, make a bounded change, verify only what is actually executable, and record the resulting commit and evidence.

## Toolchain

See `../../toolchain.json` for Node 24.21.0, npm 11.19.0 and Rust 1.98.1 (rustfmt). Windows desktop packaging additionally requires the Windows Tauri/NSIS build prerequisites. VMware Workstation/Fusion and Minecraft Education are not provided with this repository.

## Developer commands

After dependencies are available:

```bash
npm --prefix apps/virtual-clients ci
npm run verify:layout
npm run test
npm run check:desktop
npm run check:runtime
npm run test:runtime
npm run format:runtime
npm run dev
```

`npm run check:desktop` runs Svelte typecheck, Vitest desktop contract tests, frontend build, Tauri check and Rust desktop tests. `npm run check:runtime` and `npm run test:runtime` check the separate canonical backend crate. The repository source/layout verifier only checks selected cross-file contracts and does not compile or exercise VM lifecycle.

```bash
npm run package:windows
```

This is a Windows package operation requiring suitable build prerequisites, not the default development step. It is not an automatically signed trusted release.

## No automatic CI

CI is manual-only and not the normal ChatGPT/source-change completion gate. A manually dispatched workflow may provide additional source or installer evidence. It cannot stand in for target-machine VMware/Minecraft acceptance.

## Runtime proof

Read `../../virtual-clients/docs/acceptance.md` before a real-machine trial. `../../virtual-clients/acceptance/windows/collect-acceptance.ps1` captures scoped proof outside Git. Do not collect or commit raw accounts, tokens, guest disks or private machine snapshots.

Actual test/build commands have **not** been run as a consequence of writing these documents; report their status separately when evidence exists.
