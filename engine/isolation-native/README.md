# MIVUBI native isolation ABI probe — source-first

This is product-specific **Windows-native source** for the prospective M-Isolation-Engine.
It consumes the original Sandboxie-Plus v1.18.5 `Sandboxie/common/my_version.h`
from pinned upstream commit `abd4c240031cfb46666daa74ca47ed4e48b561e4`.
Driver ABI: `0x57230`; driver version: `5.73.5`.

## Private-exclusive MIVUBI source fork (source-first)

The **first planned private runtime** preserves the pinned upstream's
`SbieDrv`, `SbieSvc`, `SbieDll`, IPC object names and minifilter altitude.
This is intentional: the first MIVUBI distribution is **exclusive**, not
coinstallable with official Sandboxie. Independent deployment is a different
target from simultaneous namespace coexistence.

The source transformation under [fork-overlay](./fork-overlay/apply-private-source.mjs)
uses a single exact-context Git patch against seven upstream source owners:
the common version/ABI header plus driver API, DLL API, service driver assist,
launcher, SbieIni and KmdUtil. It installs compile-time private-build/ABI guards
**and a functional, opt-in MIVUBI Client 02–04 launch mode inside Start.exe**,
but **does not modify upstream copyright, licensed attribution, kernel service
names, device/IPC names or signing requirements**. It only accepts a separate
clean full-history checkout descending from pinned v1.18.5, not the application
submodule or official installation.

~~~powershell
# From this application's root, after separately bootstrapping source:
node engine/isolation-native/fork-overlay/apply-private-source.mjs --fork-root 'D:\Source\M-Isolation-Engine'
# The overlay is STAGED. Review exactly seven files / nine hunks and commit
# the standalone fork as one direct child of pinned v1.18.5:
git -C 'D:\Source\M-Isolation-Engine' diff --cached --check
git -C 'D:\Source\M-Isolation-Engine' diff --cached --stat
git -C 'D:\Source\M-Isolation-Engine' commit -m "feat: MIVUBI controlled three-client launch"
node engine/isolation-native/fork-overlay/apply-private-source.mjs --verify-committed --fork-root 'D:\Source\M-Isolation-Engine'

# Produces private binaries and source-specific hashes; does NOT install:
.\engine\isolation-native\fork-overlay\build-private.ps1 -ForkRoot 'D:\Source\M-Isolation-Engine' -ReportPath '.\workspace\isolation-private-build.json'

# Build native ABI probe against the separately patched source:
cmake -S engine/isolation-native -B workspace/isolation-native-private -G "Visual Studio 17 2022" -A x64 -DMIVUBI_PRIVATE_FORK_ROOT="D:/Source/M-Isolation-Engine"
cmake --build workspace/isolation-native-private --config Release
~~~

The source patch stages seven modified files (nine Git hunks) in the fork Git index for review. The
private build script only permits these exact source modifications and uses
upstream's Win32 -> x64 -> kernel build order. It does not sign, install,
load, stop, launch or migrate anything. A private source build is **not**
an unmodified upstream build and its report is deliberately separate.
These Windows scripts are authored source, **not executed** here.

No proprietary/private credentials, world files or copied original Sandboxie
binary builds are committed to `Local`.

## Hand off a private core build to the existing package owner

`build-private.ps1` now accepts optional `-StageOutput`. Once Win32,
x64 and kernel source compilation succeeds it invokes the sole private payload
assembler, which verifies the private binary hashes and puts both architectures,
templates, and upstream licenses in an exclusive `PRIVATE_CORE_STAGED_NOT_INSTALLABLE`
bundle. It is NOT safe to co-install with the official Sandboxie driver/service.
The app's existing candidate inspector can read this bundle but cannot activate
it. See [private package source](../../tooling/isolation-source/assemble-private-engine.mjs).

## Build source

After initializing the `engine/isolation-upstream/Sandboxie` Git submodule,
these Windows Visual Studio 2022 x64 steps build the standalone native program:

~~~powershell
cmake -S engine/isolation-native -B workspace/isolation-native-build -G "Visual Studio 17 2022" -A x64
cmake --build workspace/isolation-native-build --config Release
ctest --test-dir workspace/isolation-native-build -C Release --output-on-failure
~~~

CMake verifies upstream HEAD and rejects another revision. No actual Windows
compilation or CTest is claimed for this GitHub-source batch.

## Three explicit commands

- `--selftest` checks header ABI/version without accessing Windows services.
- `--offline D:\Source\M-Isolation-Payload` checks core binary layout and the
  `NOT-INSTALLABLE.txt` marker without loading a DLL or querying SCM.
- `--abi D:\Source\M-Isolation-Payload` is a **lab-only, manually invoked**
  runtime query. It demands exact `SbieDrv`/`SbieSvc` service image paths
  within the candidate, then validates Authenticode for the driver, service
  and DLL before loading that DLL by full path to call
  `SbieApi_GetVersionEx(WCHAR[16], ULONG*)`.

`--abi` runs upstream DLL initialization and queries the live driver.
**Never run it on the account-bearing host or next to official Sandboxie.**
The path/signature checks do NOT attest signed-kernel load acceptance,
ownership, a disposable Windows machine, isolation or Minecraft gameplay.
Its JSON always sets `driverSigningPolicyAccepted=false`,
`installerReady=false`, `providerSelected=false`, and
`gameplayVerified=false`. No Tauri command invokes it.

The utility does not rename `SbieDrv`, `SbieSvc`, IPC names, binaries,
or inject hooks into Minecraft. Renaming files alone cannot create an
independent fork. The complete native driver/service/DLL remains sourced
from upstream, with licenses and attributions preserved.

## Required committed-source identity before private build (2026-10-14)

Patch preparation intentionally stages seven files in a separate full-history
checkout for human review. **A staged patch with HEAD still at upstream is not
a private Git commit.** Review the staged changes and commit exactly those seven
files on `isolation/baseline-v1.18.5`. The commit must be one direct child of the
pinned v1.18.5 source, with a clean index and worktree. Then verify:

~~~powershell
node engine/isolation-native/fork-overlay/apply-private-source.mjs --verify-committed --fork-root 'D:\Source\M-Isolation-Engine'
~~~

The verifier reconstructs the exact authorized source insertions from original
upstream Git blobs and refuses any extra changes. It returns
`privateForkHead`, `privateForkTree` and `privatePatchSha256`; these must
match the Windows build report, private payload and Rust read-only inspector.
`build-private.ps1` checks the identity both before and after compilation.

Source hashes ensure traceability, **not** repeatable binary compilation,
Authenticode trust, driver load approval or Minecraft gameplay.

## ABI probe CMake source admission (2026-10-14)

For the private-fork option, CMake invokes the **same canonical**
`apply-private-source.mjs --verify-committed` verifier used by
`build-private.ps1` and `assemble-private-engine.mjs`. A Git descendant with
only matching source-header markers is no longer accepted: it must contain
exactly the committed, reviewed seven-file patch, with a clean worktree and
no additional changes. Node must be available at CMake configure time.
This check is source admission only, not driver/API compatibility proof.

No CMake/MSVC execution is claimed from the ChatGPT/GitHub source review.
The unmodified pinned submodule requires exact pinned HEAD and a clean
tracked/untracked source checkout. It is not falsely treated as a committed
MIVUBI fork.

## Corrected patch application preflight (2026-10-14)

The initial `apply-private-source.mjs` unified-diff generator included only
the insertion anchor as context. This generated syntactically plausible hunks
that Git could reject with `patch does not apply`, even against the exact
expected file contents. The source owner now includes the **following
original source line as trailing context** and adjusts old/new hunk lengths
to two original context lines. Unexpected CRLF source is refused before
writing a patch. The existing disposable-Git regression does real
`git apply --check --index --whitespace=error` and `git apply --index`
against its fixture checkout.

The regression was additionally reproduced and corrected with disposable
Git on the ChatGPT execution container. Seven fixture hunks now apply
atomically in the source checkout; no real Windows binary build, driver
load or account data was involved. Real upstream patch application remains
an additional integration obligation on the exact v1.18.5 source checkout.

## Private kernel–launcher runtime identity (2026-10-14)

The first **kernel-facing functional source change** is now included in
the seven-file MIVUBI private overlay. The pinned upstream kernel
`Sandboxie/core/drv/api.c` replies to its EXISTING `API_GET_VERSION`
request with the MIVUBI-specific version string `5.73.5-MIVU`,
preserving the original driver ABI `0x57230`, ioctl ID, buffer layout,
and upstream behavior for an unmodified build. The shared
[`mivubi_core_identity.h`](./owned-runtime/mivubi_core_identity.h)
is embedded verbatim into both private kernel API and launcher source.

When the explicitly opted-in MIVUBI launch mode is requested, private
`Start.exe` calls `SbieApi_GetVersionEx` and refuses to route an owned
box unless the connected kernel reports **both** the private marker and
pinned ABI. An official Sandboxie driver replies with its original
version and therefore fails this private launch admission. This change
does **not** rename device/service objects; official/private coexistence
remains unsupported. It is a version identity gate, not cryptographic
attestation, signer verification, service ABI proof or kernel-load proof.

The existing native owned-runtime CMake suite now builds **both**:
C++17 Start policy admission tests and C11 driver-identity/16-WCHAR buffer
tests. The two binaries passed under GCC and Clang using CTest in
ChatGPT's Linux container (2/2 on each toolchain). The actual kernel,
DLL, Start.exe and SbieSvc still require Windows MSVC/WDK compilation,
signing and exclusive disposable-lab integration. An upstream consumer
that requires an exact version string may need deliberate compatibility
work once compiled; do not claim Windows compatibility from this source
evidence.

## Functional core: native-owned Start.exe profile admission

**Implementation owner:** [mivubi_owned_start_policy.h](./owned-runtime/mivubi_owned_start_policy.h).
The private overlay INLINES this exact C++17 policy into upstream
`Sandboxie/apps/start/start.cpp` and adds one opt-in dispatch point after
upstream command-line parsing obtains the argument string. We no longer keep
an independently authored copy of the path/box parser inside the JavaScript
patch generator. The committed private-fork source still changes exactly
seven pinned upstream files, now with eight Git hunks (six ABI guard sites,
the shared header, and the native dispatch site).

The launch policy accepts only:

~~~text
Start.exe /mivubi_client:02 "C:\Program Files\Microsoft Studios\Minecraft Education\Minecraft.Windows.exe"
Start.exe /mivubi_client:03 "C:\Program Files\Microsoft Studios\Minecraft Education\Minecraft.Windows.exe"
Start.exe /mivubi_client:04 "C:\Program Files\Microsoft Studios\Minecraft Education\Minecraft.Windows.exe"
~~~

These select separate box names `MivubiEdu02`, `MivubiEdu03`,
`MivubiEdu04`. Non-owned `Start.exe` command lines follow upstream code
unchanged; owned requests reject unsupported client IDs, executable names,
UNC/relative paths, traversal, unwanted shell arguments and malformed quotes.
A requested box is passed to upstream `RestartInSandbox()` and
`SbieDll_RunSandboxed()`. It is NOT a new implementation of the driver or a
Microsoft-signature verifier, and is not proof of WAM/SSO isolation.

**Native executable evidence (ChatGPT, Linux):** the same portable C++ header
was compiled with GCC and Clang using C++17, `-Wall -Wextra -Werror -pedantic`.
Each CMake/CTest test executable passed in the isolated ChatGPT container.
The checked-in [native test](./owned-runtime/mivubi_owned_start_policy.test.cpp)
contains 20 positive/negative admission cases. This is **native C++ evidence**,
not Windows/MSVC compilation of the fork's complete `Start.exe`, service,
DLL or kernel driver.

Reproduce in a supported developer environment:

~~~powershell
cmake -S engine/isolation-native/owned-runtime -B workspace/owned-start-policy
cmake --build workspace/owned-start-policy --config Release
ctest --test-dir workspace/owned-start-policy -C Release --output-on-failure
~~~

The separate [profile plan](./owned-runtime/minecraft-profiles.mjs) constructs
non-overwriting per-client `SbieIni` settings and private `Start.exe` launch
arguments, but never executes them. The current official Client 02 sandbox
remains active and unchanged. The private fork still retains the upstream
`SbieSvc`/`SbieDrv` names and cannot coexist with the installed official
Sandboxie service. Real independent operation requires a separately tested
disposable Windows lab with signed/native core artifacts; legal distribution
review is mandatory for publishing this Sandboxie-derived fork.
