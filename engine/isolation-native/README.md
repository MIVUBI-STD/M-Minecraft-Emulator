# MIVUBI native isolation ABI probe — source-first

This is product-specific **Windows-native source** for the prospective M-Isolation-Engine.
It consumes the original Sandboxie-Plus v1.18.5 `Sandboxie/common/my_version.h`
from pinned upstream commit `abd4c240031cfb46666daa74ca47ed4e48b561e4`.
Driver ABI: `0x57230`; driver version: `5.73.5`.

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
