# Emulator Agent Routing

## Branch and source authority

`Local` is the remote GitHub development branch. `main` is release-only. A local checkout or user PC is not required to complete ChatGPT-owned source work. Never silently fall back to `main`.

Use `GITHUB_RULES.md` for GitHub mutation and evidence rules, `CONTEXT.md` for stable invariants, and `planning/development.md` for current handoff. Current code and exact HEAD supersede stale planning text.

## Task routing

| Task | First owner |
| --- | --- |
| Guest provisioning / lifecycle / snapshots / resource policy | `virtual-clients/runtime-core/` |
| VMware details and reconciliation | `virtual-clients/runtime-core/src/provider/` |
| Guest Agent protocol / interactive launcher | `virtual-clients/runtime-core/src/guest.rs`, `virtual-clients/runtime-core/src/bin/virtual-guest-agent.rs`, `virtual-clients/guest/` |
| Desktop UX / setup / window layout | `apps/virtual-clients/` |
| Packaged application or update trust | `virtual-clients/distribution/`, desktop Tauri package config |
| Windows/VMware/Minecraft acceptance | `virtual-clients/acceptance/`, `virtual-clients/docs/acceptance.md` |
| Current roadmap, blockers and progress | `planning/development.md` |
| Speculative/temporary studies | `experiments/` |

## Mandatory development discipline

1. Pin repository, branch, HEAD, and canonical owner before material edits.
2. Distinguish observed source, inference, test execution and actual Minecraft/VMware proof.
3. Trace consumer contracts and trust boundaries before edits.
4. Prefer no change, removal or a correction in the existing owner over new managers, aliases and duplicate state machines.
5. Preserve existing VM data paths, installed identity and schema contracts without explicit migration/proof.
6. Commit one coherent change to `Local`, inspect the resulting exact HEAD, record verification and unresolved evidence, then STOP.
7. Do not create automatic CI or publish a release without explicit approval.
8. Never request account passwords/tokens or automate Microsoft sign-in/MFA to meet a readiness claim.

## Evidence vocabulary

`SOURCE_REVIEWED`, `SOURCE_TESTED`, `PACKAGE_TESTED`, `TARGET_WINDOWS_VERIFIED`, `VMWARE_VERIFIED`, `MINECRAFT_VERIFIED`, `FOUR_CLIENT_ACCEPTED`. Levels are independent and may only be claimed with corresponding actual evidence.

No automatic elevation from a VM process to gameplay or multiplayer readiness. If evidence is unavailable, mark it `NOT_EXECUTED` or `UNKNOWN` and complete every source-level task that is still possible.
