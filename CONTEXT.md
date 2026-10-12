# Emulator Stable Context

Verified product direction: 2026-10-11. This file contains **stable product and repository facts only**. Current tasks, progress and evidence status belong in `planning/development.md`.

## Product and target

**Approved product outcome (2026-10-12):** Four concurrently playable Minecraft Education Windows desktop game windows with four different legitimately licensed accounts on one PC. **New engineering direction:** feasibility-first native multi-process with one official Desktop installation; if unsupported, test application isolation before considering guest VMs. No process/account-isolation method is proven yet. Do not modify game binaries, bypass sign-in, or promise supported native multi-instance.

**Current implemented source remains VMware Workstation (legacy/frozen for new features).** Its virtual accounts, disks and guest-state must be preserved. App Sandbox GPU-PV remains a guarded experimental pilot only, not the chosen launcher implementation. No UI/provider cutover may occur until native feasibility evidence is independently reviewed. Current development experiment and proof owner: docs/validation/native-multi-instance-feasibility.md; planning/development.md.

The legacy implementation path is:

```text
Host Native Minecraft Education
+ VMware Virtual-01
+ VMware Virtual-02
+ VMware Virtual-03
```


## Branch and execution authority

```text
Local  → GitHub development/source authority
main   → reviewed stable/release authority

REMOTE_GITHUB source work
→ exact-head bounded source evidence
→ unresolved executable/Windows/Minecraft evidence explicitly separated
```

ChatGPT + GitHub work does not require a user PC. A committed test or written acceptance procedure is not equivalent to a passed test.

## Canonical repository ownership

```text
apps/desktop/           UI, Tauri bridges, desktop-native window behavior
engine/runtime-core/    Rust lifecycle, provider, identity, version, readiness, recovery
engine/guest/windows/   Windows Base/Guest Agent setup
engine/distribution/    release, package and installer policy
docs/                   durable product, system and validation explanation
planning/               current development and operations intent
tooling/                developer checks, optional Windows entrypoint, acceptance collectors
workspace/              project-scoped working handoff; sensitive captures ignored
experiments/            non-authoritative bounded research
.agents/                bounded agent procedure
```

One implemented behavior has one owner and one source of truth. The Rust runtime owns VM lifecycle and setup decisions. Svelte presentation may project runtime truth but never duplicate it.

## Stable runtime contracts

- Tauri 2 + Svelte 5 desktop, thin Tauri commands, Rust canonical runtime-core.
- VMware Workstation on Windows is the still-active legacy provider; VMware Fusion provider exists on macOS. App Sandbox GPU-PV has only a guarded one-disposable-guest CLI pilot, not a production Provider implementation. Windows NSIS desktop package remains the declared distribution target.
- Native Minecraft Education version is the version authority; Base and guest version/lineage must match before unsafe lifecycle actions.
- Base lifecycle: REGISTERED → FINALIZING → FINALIZED. Clone/provision requires a stopped finalized Base.
- Normal stop/start/suspend/restart must not replace a Virtual's account-bearing guest disk. Reprovision is explicitly destructive.
- Guest Agent protocol and tokens remain authenticated and isolated per VM; Windows interactive session is not SYSTEM session 0.
- VM RUNNING, agent reachable, Minecraft process RUNNING, signed-in menu usable and multiplayer READY are distinct observations.
- Virtual profile policy currently caps a guest at 4096 MB RAM and 2 vCPUs; this is not a measured real-world performance guarantee.
- Installed **M-Bedrock Virtual Clients** identity, release asset name, persisted Windows runtime path, Guest Agent protocol and external schemas are compatibility boundaries. Source folder renames do not alter them.
- Self-apply update remains disabled. Release publication/signing requires separate authorization.

## Navigation

```text
README.md → docs/README.md → domain documentation
AGENTS.md → GITHUB_RULES.md → docs/system/implementation-map.md → canonical source
planning/development.md → current work and next single task
docs/validation/acceptance.md → target-machine proof obligations
```

Source provenance: MIVUBI-STD/M-Lazy-Developer Experimental @ 89cb8691f6757d287707bb8cae2d0d810b751404.
