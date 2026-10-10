# M-Minecraft-Emulator

**Primary goal:** four separate Minecraft Education windows, simultaneously signed in with **four different licensed accounts**, usable together on **one Windows PC**. The simplest supported mechanism wins. Test direct Windows multi-instance first; the existing one-native-plus-three-VMware architecture is a conditional fallback, not the product goal itself. No official client-in-VM compatibility or concurrent four-account success is claimed.

## Branch authority

```text
Local → active development / source authority
main  → reviewed stable/release authority
```

## Start here

For ChatGPT + GitHub development, the authoritative route is:

```text
AGENTS.md → GITHUB_RULES.md → docs/system/implementation-map.md
→ exact canonical source owner → bounded source change → evidence review → STOP
```

An operator does **not** need a local checkout to complete repository/source-verifiable tasks. Windows or Minecraft acceptance is a separate, higher proof context. `DEV.cmd` is an optional local developer convenience, never the remote GitHub completion requirement.

**Definition of DONE:** [Four simultaneous Minecraft Education accounts](docs/product/four-concurrent-accounts.md). Documentation: [docs/README.md](docs/README.md). Current work and continuation: [planning/development.md](planning/development.md).

## Choose one work route

| Intended work | Entry | Actual authority |
| --- | --- | --- |
| Develop, refactor, repair, or improve repository | [AGENTS.md](AGENTS.md) → [.agents development procedure](.agents/skills/emulator-development/SKILL.md) | Existing source owner in `apps/` or `engine/` |
| Probe a second native Minecraft Education window before assuming VMs are necessary | [Four-account goal](docs/product/four-concurrent-accounts.md) → [native Windows probe](tooling/acceptance/windows/probe-native-multi-instance.ps1) | Source-only probe; actual distinct logged-in windows require observed Windows evidence |
| Examine VM behavior or diagnose setup | [Implementation Map](docs/system/implementation-map.md) → [Runtime Core](docs/system/runtime-core.md) | `engine/runtime-core/`, observed provider/guest evidence |
| Prove Minecraft Education can render on one Windows VMware guest before scaling | [Client Feasibility](docs/validation/client-feasibility.md) | Scratch VM; diagnostics separate from manual game observation |
| Verify Windows/VMware/Minecraft usability | [Validation](docs/validation/README.md) | Real machine and game observations; `tooling/acceptance/` collects bounded evidence |
| Prepare package or validate update trust | [Distribution](engine/distribution/README.md) | Machine-readable contracts in `engine/distribution/` and Tauri package config |
| Resume work without the previous chat | [Development Planning](planning/development.md) | Current `Local` source + explicit proof records |

Repository development does not implicitly start VM operations or change a user's guest disks.

## Root file ownership and navigation

The root is a thin entry/configuration boundary, not a second home for VM lifecycle policy or active task state.

| Root file | One responsibility | Detailed owner |
| --- | --- | --- |
| `README.md` | Human overview and navigation | Domain READMEs |
| `AGENTS.md` | Agent mode/task routing and invariants | Selected procedure, source owner |
| `GITHUB_RULES.md` | Exact-ref GitHub write, proof and STOP policy | GitHub source/commit |
| `CONTEXT.md` | Stable product/architecture facts | Source, not progress |
| `CONTRIBUTING.md` | Contribution expectations | Development discipline |
| `SECURITY.md` | Repository-wide trust and secret boundaries | Backend/Guest Agent and distribution owner |
| `package.json` | One set of repository command entrypoints | `tooling/`, `apps/desktop/`, `engine/runtime-core/` |
| `toolchain.json` | Canonical developer tool and proof policy | `tooling/windows-toolchain/` |
| `.node-version` | Node version selector | `toolchain.json` |
| `VERSION` | Product release version text | Desktop/Tauri/Rust versions must agree |
| `DEV.cmd` | Optional Windows-local command launcher | `tooling/windows-toolchain/dev.ps1` |
| `.editorconfig`, `.gitattributes`, `.gitignore` | Editing, Git and generated-data boundaries | No executable VM semantics |

The root **does not** need a `tsconfig.json` or `package-lock.json`: the only Node dependency installation belongs to `apps/desktop/`. Backend Rust dependencies are locked in `engine/runtime-core/Cargo.lock`. Avoid duplicate manifests just for visual symmetry with another repository.

## Canonical repository domains

```text
.agents/                 bounded developer-agent procedure
.github/                 manual-only verification and Windows package smoke
apps/desktop/            Svelte UI, Tauri command adapters, native window layout
engine/runtime-core/     authoritative Rust VM lifecycle, identity, provider and guest protocol
engine/guest/windows/    Windows Base and Guest Agent install/uninstall/finalize scripts
engine/distribution/     installer/update contracts, release manifest and lifecycle rules
docs/product/            Base preparation and user-facing setup expectations
docs/system/             architecture, runtime semantics, ownership and developer procedure
docs/validation/         proof policy, failure matrix and platform constraints
planning/                current development intent and continuation
tooling/repository/      static repository/source contract verification
tooling/windows-toolchain/ optional Windows developer launcher
tooling/acceptance/      bounded Windows host/guest evidence collection
workspace/               untracked private execution material / project handoffs
experiments/             bounded non-authoritative research
```

All human-facing documentation routes start at `docs/README.md`. Product policies are implemented by their source owner; documentation must not create another runtime state machine.

## Development verification

```bash
npm run setup                    # app lockfile install (optional local/cloud execution)
npm run verify:repository        # static repository and cross-file contract verification
npm run test:feasibility          # pure Node evidence classification regressions
npm run test                     # desktop contract tests
npm run check:desktop            # Svelte, frontend, desktop/Tauri source checks
npm run check:runtime            # Rust canonical runtime checks
npm run test:runtime             # Rust canonical runtime tests
npm run format:runtime           # Rust format check
npm run verify:source            # complete source checkpoint
npm run dev                      # Tauri desktop development
npm run package:windows          # explicit Windows NSIS build, not signed publication
```

Windows developers may use `DEV.cmd help`; all of its operations delegate to the scripts above. GitHub workflows are **manual-only**. A committed test or valid static check is not proof of a passing Windows package or working four-client Minecraft session.

## Product and compatibility invariants

- Svelte is presentation; thin Tauri commands route to the Rust runtime authority.
- VMware Workstation is the initial Windows provider; Fusion implementation is retained as macOS backend source.
- Native/Base/Virtual Minecraft version parity and finalized Base lineage gate VM start/provisioning.
- Each Virtual retains its own guest disk and account state; destructive reprovision requires explicit confirmation.
- VM running, Guest Agent reachable, game process running, sign-in usable and multiplayer-ready are different observations.
- Legacy installed product name **M-Bedrock Virtual Clients**, Windows application identifier, guest/protocol identities, persisted runtime paths and release-asset naming remain compatibility contracts. **Repository/source-path cleanup does not rename installed artifacts.**
- The target one-native-plus-three-virtual use case is **not yet proven on a real machine**. Consult [Validation](docs/validation/README.md).

## Extraction history

This dedicated repository originated from Virtual Clients in `MIVUBI-STD/M-Lazy-Developer` `Experimental`, exact source SHA `89cb8691f6757d287707bb8cae2d0d810b751404` (2026-10-10). Repository operating discipline is adapted from `M-Lazy-Developer/Local`. This history is provenance, **not** a dependency on the old monorepo.

No account tokens, licensed game binaries, VM images or client worlds are included.
