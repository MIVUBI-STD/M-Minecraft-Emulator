# Emulator Development Handoff

Updated: 2026-10-10
Authority: `MIVUBI-STD/M-Minecraft-Emulator`, branch `Local`. Current GitHub source HEAD always outranks this file.

## Current product status

The emulator/VM manager is now an independent repository with a canonical root and source ownership scheme aligned to the working discipline of `M-Lazy-Developer/Local`.

Scope is **repository setup/navigation and source-path separation**, not proof that Windows, VMware and Minecraft Education work together. Do not claim that any tests were executed merely because test source exists or the repository was refactored.

## Completed source work

- Original dedicated extraction: `M-Lazy-Developer` `Experimental` @ `89cb8691f6757d287707bb8cae2d0d810b751404`, initially migrated into this repository on `Local`.
- Canonical root entry: `README.md`, `AGENTS.md`, `GITHUB_RULES.md`, `CONTEXT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `VERSION`, `package.json`, `toolchain.json`, and optional `DEV.cmd`.
- `apps/desktop/`: one user interface and typed desktop/Tauri adapter.
- `engine/runtime-core/`: one Rust runtime and VMware provider authority.
- `engine/guest/windows/`, `engine/distribution/`: guest setup and machine-readable installer/update contracts.
- `docs/`: one documentation router with `product/`, `system/`, and `validation/` domains; old product-local docs path retired.
- `tooling/repository/`, `tooling/windows-toolchain/`, `tooling/acceptance/windows/`: verifier, optional developer commands, real-machine evidence collection.
- `.agents/skills/emulator-development/`: one bounded development procedure; no duplicate VM state owner.
- Old monorepo-style `virtual-clients/` and `apps/virtual-clients/` source paths retired. Cargo/Tauri/NSIS sources and consumer tests updated to the new paths.
- `verification-routing.test.ts` originally asserted a deleted `virtual-clients:verify` script. It now asserts the actual source verification command chain.

## Compatibility and non-goals

This source reorganization **does not** rename or delete the existing installed `M-Bedrock Virtual Clients` application identity, package binary names, snapshot `QA_READY`, `M-Bedrock/VirtualClients` persistent data path, provider state, registered Base images or per-VM Microsoft account sessions.

No VM data migration, credential automation, newly implemented hypervisor, automatic update/apply, CI on push or release to `main` is authorized by the repository setup.

## Evidence ledger

| Claim | Evidence / state |
| --- | --- |
| Canonical folder rename and cross-file references | `REMOTE_GITHUB`: Git tree, reference and ownership inspection; staged source verifier/test assertions, with final exact HEAD confirmation required |
| Release-channel repository identity | Source pinned to `MIVUBI-STD/M-Minecraft-Emulator`; runtime self-apply disabled |
| Desktop npm lock and Rust/Tauri versions | Source inspected; actual dependency installation and build `NOT_EXECUTED` |
| Repository static verifier and desktop regression tests | Source authored; execution `NOT_EXECUTED` unless evidence is later obtained |
| Source/backend compile and Rust tests | `NOT_EXECUTED` |
| NSIS installer package smoke, Windows install/repair/uninstall | `NOT_EXECUTED` |
| VMware Base/clone/lifecycle/identity and interactive Guest Agent | `NOT_EXECUTED` |
| Minecraft Education sign-in, graphics, network and multi-client usability | `NOT_EXECUTED` |
| Native + Virtual-01/02/03 concurrent acceptance | `NOT_EXECUTED` |

## Next substantive development route

1. Verify the current `Local` exact HEAD's repository structure, consumed Cargo/Tauri resource paths, docs links and source test assumptions. Fix only concrete migration defects.
2. When source execution can be completed independently, run the locked desktop TypeScript/Vitest/Tauri checks and Rust runtime `cargo check/test/fmt` on the **same SHA**. Manual GitHub Actions are an optional last-resort evidence path; do not demand a user PC as a ChatGPT source-work prerequisite.
3. If packaging is needed, run a separately authorized Windows NSIS package smoke, checking installed CLI/Guest Agent/scripts, data preservation and signature gates. Do not conflate an unsigned smoke with a release.
4. For actual VM acceptance, follow [Acceptance](../docs/validation/acceptance.md), [Static Readiness](../docs/validation/static-readiness.md), and [Failure Matrix](../docs/validation/four-client-failure-matrix.md). Measure account isolation, guest launcher Windows session, CPU/RAM/GPU and Minecraft Education connectivity.
5. Reopen architecture only for a diagnosed defect that the existing owner cannot correctly express. No speculative provider, VM manager or optimization system.

## STOP

Once exact-head source navigation and reference integrity are proven, stop repository tidying. Subsequent work is evidence-driven product development, not repeated cosmetic cleanup.
