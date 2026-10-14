# Pinned upstream isolation baseline (source-only)

**Purpose:** reproduce Sandboxie-Plus **v1.18.5** core build inputs and record source/artifact provenance for the planned personal, educational/noncommercial **M-Isolation-Engine**. This is **not** an app installation routine, driver signing tool, fork repository, or migration command. The active Minecraft manager continues using official Sandboxie with the existing account-bearing box unchanged.

## What is pinned

- Full upstream repository: <https://github.com/sandboxie-plus/Sandboxie>
- Tag: `v1.18.5` → commit `abd4c240031cfb46666daa74ca47ed4e48b561e4`
- Main source contracts: `Sandboxie/{SandboxDll.sln,Sandbox.sln,SandboxDrv.sln}`, `Installer/copy_build.cmd`, `Sandboxie/ReadMe.md`, upstream `.github/workflows/main.yml`, `LICENSE.Plus`, `Sandboxie/COPYING`.
- File/build contract: [upstream-baseline.json](./upstream-baseline.json). One source of truth for required artifacts and stage order.
- Read-only pre-build checkout verification: [verify-checkout.mjs](./verify-checkout.mjs) and [six Git tests](./verify-checkout.test.mjs). It rejects changed upstream remotes, shallow clones, missing/retargeted tags, detached/wrong branches, untracked modifications and symlinked checkout paths; a SHA string alone is not enough.
- Metadata validator: [validate-baseline.mjs](./validate-baseline.mjs) with [six tests](./validate-baseline.test.mjs). Checks source revision, stage order and report consistency.
- File-byte verifier: [verify-artifact-files.mjs](./verify-artifact-files.mjs) with [five tests](./verify-artifact-files.test.mjs). Independently rehashes every `PRESENT` file and confirms every `MISSING` file is absent; refuses symlinked and dangling-symlink file paths and changed files. Read-only; still **not** proof of signing, driver load or Minecraft gameplay. PowerShell invokes both verifiers after collection; Node.js is required.

## Pinned upstream source inside the application repository

The `Local` Git tree now contains a real Git submodule at `engine/isolation-upstream/Sandboxie`, pointing to the upstream Sandboxie **v1.18.5** commit `abd4c240031cfb46666daa74ca47ed4e48b561e4`. The actual upstream history remains in that Git repository, rather than copying kernel source into Rust or committing a ZIP. This is a **pinned source reference**, not a new MIVUBI GitHub fork and not a compiled engine.

For a checkout with GitHub access, the source-to-build route is:

~~~powershell
# From the M-Minecraft-Emulator repository root (Local):
git submodule update --init -- engine/isolation-upstream/Sandboxie

# Make a SEPARATE full-history checkout with a modifiable development branch.
# The target's parent must exist; the target itself must be absent.
node tooling/isolation-source/bootstrap-fork.mjs --destination 'D:\Source\M-Isolation-Engine' --local-seed 'engine/isolation-upstream/Sandboxie'

# Inspect the standalone, unmodified source before the Windows build.
node tooling/isolation-source/verify-checkout.mjs --source-root 'D:\Source\M-Isolation-Engine'
~~~

The local-seed mode checks the seed's real directory, remote URL, pinned Git SHA/tag, full history and clean working tree. It creates a full, independent Git checkout and sets its `upstream` remote back to the official public repository, without a second network clone. Eight disposable-Git tests passed in Linux Node 22; **the real submodule materialization and native Windows build remain NOT_EXECUTED here** because this runtime cannot resolve github.com through Git.

## Independent source checkout — full history preserved

The new bootstrap tool creates a complete, non-shallow Git checkout **outside** the application source and points an independent working branch at the pinned v1.18.5 commit. It verifies the tag, commit, clean working tree and history before promoting a temporary checkout into the chosen empty destination. It does **not** publish a GitHub fork or install a driver.

From the M-Minecraft-Emulator repository root, where Git and Node.js are available:

~~~powershell
node tooling/isolation-source/bootstrap-fork.mjs --destination 'D:\Source\M-Isolation-Engine'
~~~

The parent directory must already exist, and the requested destination must not exist yet. A failed clone refuses a partial result, cleans only its own temporary staging folder and leaves existing directories alone. It does not invoke game tools or touch `MinecraftClient02`. An upstream network connection is required for a real run; only the Git-local tests have executed here.

Equivalent manual full-history checkout (alternative operator route, **not executed by ChatGPT**):

~~~powershell
git clone https://github.com/sandboxie-plus/Sandboxie.git M-Isolation-Engine
cd M-Isolation-Engine
git switch --create isolation/baseline-v1.18.5 abd4c240031cfb46666daa74ca47ed4e48b561e4
git remote rename origin upstream
git rev-parse HEAD
git status --porcelain=v1 --untracked-files=all
git remote -v
~~~

Eight local Git regression tests are included in [bootstrap-fork.test.mjs](./bootstrap-fork.test.mjs); they cover full-history cloning, wrong pin/tag refusal, existing destination preservation, dangling-symlink refusal, local pinned seed verification, wrong seed remote and dirty source using disposable repositories. Tests do not download Sandboxie.

**Do not** use GitHub's "Download ZIP" as your eventual fork provenance: it loses Git history. Creating a **new GitHub fork** requires a repository-fork operation not available through this session's connected GitHub actions. Do not claim that a fork has been published or that a local independent checkout is already a GitHub fork. A later approved remote fork must preserve the upstream history and its notices; pin this tag as the base of its working branch. Never delete/rename upstream GPL license notices.

## First build (unchanged upstream; not installed)

On a Windows build environment with Visual Studio 2022 C++, MSVC v143, MFC, Windows SDK, a compatible WDK extension, Git and PowerShell, execute the following from the **M-Minecraft-Emulator** checkout:

~~~powershell
# Collection-only check; no compilation or driver operations:
.\tooling\isolation-source\build-baseline.ps1 -SourceRoot 'D:\Source\M-Isolation-Engine' -ReportPath '.\workspace\isolation-baseline.json'

# After prerequisites: explicitly opt into compilation of unmodified upstream:
.\tooling\isolation-source\build-baseline.ps1 -SourceRoot 'D:\Source\M-Isolation-Engine' -ReportPath '.\workspace\isolation-baseline.json' -Build
~~~

For source-only verification on any platform, run `npm run isolation-source:verify` and `npm run test:isolation-source` from the app repository root. To check an existing independent checkout before the Windows build, run `node tooling/isolation-source/verify-checkout.mjs --source-root 'D:\Source\M-Isolation-Engine'`. The PowerShell build procedure now requires that exact verification, too. These checks are read-only and have no build or Windows dependencies. The real file-byte verifier is invoked during `build-baseline.ps1` on the actual Windows checkout after artifact collection; metadata validation alone is insufficient.

A clean source tree with HEAD and tag identical to the manifest is mandatory. **Build mode also refuses pre-existing required binaries or symbols**, preventing stale output from being attributed to the new build; it never deletes them. Use a separate clean source checkout for another build. The script refuses modified source or an evidence report inside the upstream source checkout. It invokes upstream's **Win32 DLL/service → x64 core → x64 driver** MSBuild stages in the order of its v1.18.5 CI, logs each stage locally, hashes expected files, and records their signatures. It **never installs, starts, stops or replaces a service/driver**, launches Minecraft, reads account tokens, or copies a box. Unmodified locally compiled kernel binaries are normally **not** production-signed or guaranteed loadable. Report status `BUILD_ARTIFACTS_COLLECTED` means build outputs were found after these commands; it does **not** imply a loadable signed driver, working Sandboxie, successful Microsoft login or Minecraft gameplay.

The companion Windows x86 binaries `SbieSvc.exe`/`SbieDll.dll` matter even for x64 packaging; `LowLevel` is embedded by upstream project resources. The source tree includes upstream Classic UI and optional helpers because the first build must verify **complete dependency closure before removing any targets**. Required artifact inventory is based on `Installer/copy_build.cmd`; missing optional PDBs do not masquerade as a successful debug-symbol capture.

## Private binary payload assembly (no installation)

The new [assemble-engine.mjs](./assemble-engine.mjs) assembles a **private, unmodified upstream engine candidate** only after the successful pinned Win32/x64 build and full file-byte checks. Its structure follows upstream runtime packaging: x64 driver/service/DLL and helpers in the root, 32-bit companions in `32/`, required templates/manifests and upstream copyright/licenses under `LICENSES/`, optional PDB symbols under `_debug/`. Each copied artifact is SHA-256 checked again and recorded in `engine-provenance.json`.

Optional Windows build-and-stage command, **NOT_EXECUTED here**:

~~~powershell
.\tooling\isolation-source\build-baseline.ps1 -SourceRoot 'D:\Source\M-Isolation-Engine' -ReportPath '.\workspace\isolation-baseline.json' -Build -StageOutput 'D:\Source\M-Isolation-Payload'
~~~

The destination's parent must exist and the destination must not exist yet. The result is labeled `ARTIFACTS_STAGED_NOT_INSTALLABLE`: it is **not** a signed, installed, loadable or gameplay-tested independent isolation engine. Seven executable assembly tests passed with disposable fixture binaries and injected source/byte-verification dependencies. Actual upstream build, staging of genuine binaries, signing and Minecraft acceptance remain NOT_EXECUTED.

## Product separation, attribution and acceptance

Raw outputs remain in the upstream checkout; a private candidate may be staged into an explicitly requested separate folder. Neither is committed to `Local`, merged into Rust, or installed under the existing `M-Bedrock Virtual Clients` identity. Do not try a custom driver next to the official Sandboxie service/driver in the same account-bearing Windows installation: device/service/IPC namespaces may collide. The future cutover needs a dedicated disposable Windows environment, signing and crash-attribution evidence, game compatibility, persist/reboot and rollback tests, plus a new license/distribution decision. A fork is **deployment independence** once proved, not source independence from Sandboxie.

Source references and license findings: [inventory](../../docs/validation/owned-isolation-upstream-inventory.md); product isolation/rollback design: [owned isolation design](../../docs/system/owned-isolation-design.md). Store local logs/manifests under ignored `workspace/`; never commit credentials, Minecraft worlds, machine-specific paths or raw dumps.

**Current evidence ceiling (2026-10-14):** GitHub accepted a pinned upstream v1.18.5 Gitlink. Bootstrap/local-seed tests 8/8 PASS, and private-payload assembly tests 7/7 PASS on disposable fixtures using Node22. Real upstream source checkout, Windows driver build, payload staging from genuine binaries, driver loading and Minecraft gameplay are NOT_EXECUTED.
