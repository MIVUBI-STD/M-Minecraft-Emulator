# MIVUBI native isolation ABI probe — source-first

This is product-specific **Windows-native source** for the prospective M-Isolation-Engine.
It consumes the original Sandboxie-Plus v1.18.5 `Sandboxie/common/my_version.h`
from pinned upstream commit `abd4c240031cfb46666daa74ca47ed4e48b561e4`.
Driver ABI: `0x57230`; driver version: `5.73.5`.

## Private-exclusive MIVUBI source fork (source-first)

The **first independently built runtime** preserves the pinned upstream's
`SbieDrv`, `SbieSvc`, `SbieDll`, IPC object names and minifilter altitude.
This is intentional: the first MIVUBI distribution is **exclusive**, not
coinstallable with official Sandboxie. Independent deployment is a different
target from simultaneous namespace coexistence.

The source transformation under [fork-overlay](./fork-overlay/apply-private-source.mjs)
uses a single exact-context Git patch against seven upstream source owners:
the common version/ABI header plus driver API, DLL API, service driver assist,
launcher, SbieIni and KmdUtil. It installs compile-time private-build/ABI guards
but **does not modify upstream copyright, licensed attribution, kernel service
names, device/IPC names or signing requirements**. It only accepts a separate
clean full-history checkout descending from pinned v1.18.5, not the application
submodule or official installation.

~~~powershell
# From this application's root, after separately bootstrapping source:
node engine/isolation-native/fork-overlay/apply-private-source.mjs --fork-root 'D:\Source\M-Isolation-Engine'

# Produces private binaries and source-specific hashes; does NOT install:
.\engine\isolation-native\fork-overlay\build-private.ps1 -ForkRoot 'D:\Source\M-Isolation-Engine' -ReportPath '.\workspace\isolation-private-build.json'

# Build native ABI probe against the separately patched source:
cmake -S engine/isolation-native -B workspace/isolation-native-private -G "Visual Studio 17 2022" -A x64 -DMIVUBI_PRIVATE_FORK_ROOT="D:/Source/M-Isolation-Engine"
cmake --build workspace/isolation-native-private --config Release
~~~

The source patch stages seven changes in the fork Git index for review. The
private build script only permits these exact source modifications and uses
upstream's Win32 -> x64 -> kernel build order. It does not sign, install,
load, stop, launch or migrate anything. A private source build is **not**
an unmodified upstream build and its report is deliberately separate.
These Windows scripts are authored source, **not executed** here.

No proprietary/private credentials, world files or copied original Sandboxie
binary builds are committed to `Local`.

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
