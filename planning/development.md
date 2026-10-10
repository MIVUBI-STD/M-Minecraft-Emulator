# Emulator Development Handoff

Updated: 2026-10-10
Authority: `MIVUBI-STD/M-Minecraft-Emulator`, branch `Local`.

## Current state

**Source extraction and repository separation completed.** This is NOT the same as application-ready, package-ready or four-client-ready.

- Source snapshot: `MIVUBI-STD/M-Lazy-Developer` `Experimental` @ `89cb8691f6757d287707bb8cae2d0d810b751404`.
- Source migration: `625511ac905dc053e35ecc806463aaa16970ec77`.
- Desktop tests decoupled from the old monorepo: Vitest dependency added to app manifest/lock; root source command delegates to app and canonical backend.
- Release metadata and pinned Rust policy now point to `MIVUBI-STD/M-Minecraft-Emulator` (legacy origin rejected in a source-level regression test). No trusted release is claimed.
- New repo governance follows the one-owner, GitHub-first, source-vs-runtime-proof approach of M-Lazy-Developer `Local`, not its map-audit implementation.
- Original installed application identity and persisted VM/runtime paths remain unchanged intentionally.

## Proof ledger

| Claim | Status | Evidence |
| --- | --- | --- |
| Product domain source copied into `Local` | VERIFIED_GITHUB | 123/123 source files present; 116 identical Git blob IDs; 7 intentional changes for standalone repository setup/security |
| Source architecture and known interfaces reviewed | STATIC_REVIEWED | Source and original docs, Rust owner/consumer inspection |
| GitHub cross-file and lock inspection | VERIFIED_GITHUB_STATIC | 0 missing domain files, desktop/Tauri/backend versions 0.1.0 aligned; all 185 app lock nodes with no unresolved declared dependency edges; release pin matches this repo |
| Root layout/source contract validator | NOT_EXECUTED | Script added; no Node execution proof yet |
| Desktop npm dependency installation and Vitest | NOT_EXECUTED | Lock merged statically; install/test must be executed for PASS |
| Svelte/Tauri source build + Rust tests | NOT_EXECUTED | No compilation claim |
| Windows NSIS package smoke / signing | NOT_EXECUTED | No installer claim |
| VMware Workstation/Fusion host/guest lifecycle | NOT_EXECUTED | Requires provider/OS evidence |
| Minecraft Education session, sign-in, GPU, multiplayer | NOT_EXECUTED | Requires real game/runtime evidence |
| Native + Virtual-01/02/03 accepted concurrently | NOT_EXECUTED | Target objective, not present proof |

## Immediate development route

1. **Repository closure:** verify the final branch tree, canonical paths, Tauri/Rust version matches, app lock dependency closure, and no old-monorepo release/config pointers. Fix only concrete migration defects.
2. **Executable source gate (when execution context exists):** app `npm ci`, Svelte/Vitest/Tauri checks, `cargo check/test/fmt` backend, with exact HEAD evidence. Do not ask a user to execute these merely to finish ChatGPT-owned GitHub source work.
3. **Package gate:** manual Windows unsigned NSIS smoke; verify bundled CLI/Guest Agent/preparation scripts, installation/repair/uninstall preservation. Trusted release workflow/signing remains a separate expressly authorized task.
4. **Windows + VMware acceptance:** Base state, guest provisioning/identity, SYSTEM Guest Agent → interactive user launch, persistent independent account sessions, network and layout.
5. **Four-client acceptance:** Native + three virtual clients, manual switching, Minecraft Education join/host, memory/CPU/GPU observation, disconnect/reconnect, suspend/resume, host restart and failure isolation.

External platform baseline: Minecraft Education lists Windows 10/11 **64-bit** support, 2 GB minimum and 8 GB recommended RAM (February 2026 change). The Virtual Clients 4 GB guest memory ceiling is below that device recommendation and is not a measured success criterion. Peer-to-peer Minecraft Education joins require compatible versions and the same Microsoft 365 tenant. See `docs/validation/platform-prerequisites.md`.

## Highest-risk unverified boundaries

- Actual concurrent GPU/CPU/RAM performance; 4096 MB/2-vCPU per virtual is a policy, not proof.
- Windows Guest Agent service/session 0 to interactive desktop crossover.
- Account/license/tenant authorization and guest session isolation.
- Base finalization, first-boot generalization and independent guest Windows identity.
- NAT/firewall + Minecraft multiplayer host/join behavior.
- Installer/repair/signing behavior and update trust on the target machine.

## Architectural choice

Continue the **existing VMware provider architecture** for the first working Windows proof, rather than starting a custom hypervisor or pretending this is a Minecraft engine emulator. Keep the macOS Fusion backend source, but do not imply an accepted macOS desktop release. Any change in virtualization strategy requires concrete feasibility and compatibility evidence.

## Next task and STOP

Source extraction and targeted GitHub cross-file verification are complete. Next: **executed source/package verification when an appropriate execution context is available**; otherwise inspect a concrete backend/Windows-guest boundary only if there is a source-level defect to repair. Never substitute missing Windows/Minecraft runtime proof with speculative source refactoring.

Update this file at the next meaningful milestone with exact commit and proof (including `UNKNOWN` if needed).
