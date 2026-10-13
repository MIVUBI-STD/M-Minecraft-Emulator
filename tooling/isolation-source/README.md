# Pinned upstream isolation baseline (source-only)

**Purpose:** reproduce Sandboxie-Plus **v1.18.5** core build inputs and record source/artifact provenance for the planned personal, educational/noncommercial **M-Isolation-Engine**. This is **not** an app installation routine, driver signing tool, fork repository, or migration command. The active Minecraft manager continues using official Sandboxie with the existing account-bearing box unchanged.

## What is pinned

- Full upstream repository: <https://github.com/sandboxie-plus/Sandboxie>
- Tag: `v1.18.5` → commit `abd4c240031cfb46666daa74ca47ed4e48b561e4`
- Main source contracts: `Sandboxie/{SandboxDll.sln,Sandbox.sln,SandboxDrv.sln}`, `Installer/copy_build.cmd`, `Sandboxie/ReadMe.md`, upstream `.github/workflows/main.yml`, `LICENSE.Plus`, `Sandboxie/COPYING`.
- File/build contract: [upstream-baseline.json](./upstream-baseline.json). One source of truth for required artifacts and stage order.

## Independent source checkout — full history preserved

Create an independent source checkout **outside** the existing app/source folders (these commands are an operator procedure, **not executed by ChatGPT**):

~~~powershell
git clone https://github.com/sandboxie-plus/Sandboxie.git M-Isolation-Engine
cd M-Isolation-Engine
git switch --detach abd4c240031cfb46666daa74ca47ed4e48b561e4
git rev-parse HEAD
git status --porcelain=v1 --untracked-files=all
git remote -v
~~~

**Do not** use GitHub's "Download ZIP" as your eventual fork provenance: it loses Git history. Creating a **new GitHub fork** requires a repository-fork operation not available through this session's connected GitHub actions. Do not claim that a fork has been published or that a local independent checkout is already a GitHub fork. A later approved remote fork must preserve the upstream history and its notices; pin this tag as the base of its working branch. Never delete/rename upstream GPL license notices.

## First build (unchanged upstream; not installed)

On a Windows build environment with Visual Studio 2022 C++, MSVC v143, MFC, Windows SDK, a compatible WDK extension, Git and PowerShell, execute the following from the **M-Minecraft-Emulator** checkout:

~~~powershell
# Collection-only check; no compilation or driver operations:
.\tooling\isolation-source\build-baseline.ps1 -SourceRoot 'D:\Source\M-Isolation-Engine' -ReportPath '.\workspace\isolation-baseline.json'

# After prerequisites: explicitly opt into compilation of unmodified upstream:
.\tooling\isolation-source\build-baseline.ps1 -SourceRoot 'D:\Source\M-Isolation-Engine' -ReportPath '.\workspace\isolation-baseline.json' -Build
~~~

A clean source tree with HEAD and tag identical to the manifest is mandatory. **Build mode also refuses pre-existing required binaries or symbols**, preventing stale output from being attributed to the new build; it never deletes them. Use a separate clean source checkout for another build. The script refuses modified source or an evidence report inside the upstream source checkout. It invokes upstream's **Win32 DLL/service → x64 core → x64 driver** MSBuild stages in the order of its v1.18.5 CI, logs each stage locally, hashes expected files, and records their signatures. It **never installs, starts, stops or replaces a service/driver**, launches Minecraft, reads account tokens, or copies a box. Unmodified locally compiled kernel binaries are normally **not** production-signed or guaranteed loadable. Report status `BUILD_ARTIFACTS_COLLECTED` means build outputs were found after these commands; it does **not** imply a loadable signed driver, working Sandboxie, successful Microsoft login or Minecraft gameplay.

The companion Windows x86 binaries `SbieSvc.exe`/`SbieDll.dll` matter even for x64 packaging; `LowLevel` is embedded by upstream project resources. The source tree includes upstream Classic UI and optional helpers because the first build must verify **complete dependency closure before removing any targets**. Required artifact inventory is based on `Installer/copy_build.cmd`; missing optional PDBs do not masquerade as a successful debug-symbol capture.

## Product separation, attribution and acceptance

The build outputs stay in the upstream checkout. They are not committed to `Local`, merged into Rust, or packaged under the existing `M-Bedrock Virtual Clients` install identity. Do not try a custom driver next to the official Sandboxie service/driver in the same account-bearing Windows installation: device/service/IPC namespaces may collide. The future cutover needs a dedicated disposable Windows environment, signing and crash-attribution evidence, game compatibility, persist/reboot and rollback tests, plus a new license/distribution decision. A fork is **deployment independence** once proved, not source independence from Sandboxie.

Source references and license findings: [inventory](../../docs/validation/owned-isolation-upstream-inventory.md); product isolation/rollback design: [owned isolation design](../../docs/system/owned-isolation-design.md). Store local logs/manifests under ignored `workspace/`; never commit credentials, Minecraft worlds, machine-specific paths or raw dumps.

**Current evidence ceiling (2026-10-14):** pinned upstream source and build recipe reviewed; unmodified upstream build, custom driver signing/loading, and new-gameplay acceptance **NOT_EXECUTED**.
