# Current Development Handoff — M-Minecraft-Emulator

## Uploaded v1.18.6 full source and actual candidate migration — 15 October 2026

Source ZIP supplied by user was verified locally: **1,627 authentic files**,
Git tree **f690477c07a40810f479f53973334ceae7e0ab13**, original tag
commit **cdba7096240b93d79c5373aa81a75a1c5c71b883**.
Uploaded installer EXE is not the source, not executed or installed.

**Direct GitHub proof:** 526 authentic v1.18.6 source files now exist as
ordinary Git files at `engine/isolation-candidates/sandboxie-v1.18.6/`.
All 526 SHA/mode entries match v1.18.6 upstream (5 revised kernel/service/
common blobs were copied byte-identically; unchanged owned blobs reused).
This is **partial** (1,101 missing); not a completed full GitHub source transfer.
The parallel older `engine/isolation-owned/` remains at 526/1,624 v1.18.5.

**Executed source-only proof:** a Python standard-library importer was
successfully exercised on the user's ZIP in a disposable local Git fixture.
It copied the missing 1,625 files after a 2-file partial seed, reached the
exact **1,627-file upstream tree**, left a clean working tree, and passed an
idempotent second invocation. The exact tested importer source Git blob
`b8e3c500597103ea9d0a5f60b1b44fb7199a41c6` is committed under
`tooling/isolation-source/import-v1186-archive.py`.

**Next:** complete the remaining 1,101 v1.18.6 candidate source files to
GitHub (do not mislabel a locally tested copy as uploaded). After full tree
parity, port/review the 1.18.5 MIVUBI native patches against 1.18.6 and run
native build tests in an isolated Windows test environment. No driver install,
official Sandboxie modification, gameplay or multi-account acceptance here.

## Direct GitHub transfer of core runtime sources — 15 October 2026

**Committed migration checkpoint:** 314 / 1,624 pinned upstream v1.18.5
files are copied as normal MIVUBI-owned Git blobs. The complete
`Sandboxie/core/svc` (74), `Sandboxie/core/low` (7),
`Sandboxie/apps/start` (13), and `Sandboxie/apps/ini` (7) groups now
join the preexisting driver (89) and DLL (117).
All 314 actual blob SHAs and executable modes were compared against the
pinned upstream Git tree and matched exactly; 1,310 upstream files remain.
Source transfer only: private native overlay, Windows binary build, driver
installation and Minecraft runtime tests are NOT_EXECUTED.
The complete upstream target tree SHA is
`9b3d37901e0b6cfb0cfa77cfa465b23c758deefe`.

**Next:** import pinned common/shared, messages, build solution and other
remaining upstream paths without touching the official Windows installation.

## Resumable full-source import — 15 October 2026

**Current verified GitHub base**: `1752e98eeba3c5294889580b26537e6d4fa9a679` (Local).
The original checkpoint held 213 / 1,624 genuine pinned v1.18.5 tracked blobs:
89 core/drv, 117 core/dll and seven additional source/license files.
Existing SHA/mode parity against upstream is exact. The source migration
is NOT complete; private native 11-file patch has NOT been applied to owned
files. The external installed Sandboxie pilot is still active.

**This batch** corrects the partial-import blind spot in
`tooling/isolation-source/import-full-sandboxie.mjs`. The importer can
continue from a clean, committed partial `engine/isolation-owned/`,
refuses any changed/foreign blob or path, copies missing pinned binary/text
bytes, and requires exact final upstream Git tree parity before committing.
Negative and completion fixture tests were added. Native Windows build,
driver signing/loading, Minecraft gameplay and crash analysis remain
NOT_EXECUTED. The importer does NOT mutate existing account data.

**Next**: transfer all remaining pinned upstream blobs and verify that
`engine/isolation-owned/` resolves to source tree
`9b3d37901e0b6cfb0cfa77cfa465b23c758deefe`, then apply the
existing exact private MIVUBI native overlay directly to the owned files.
Avoid repeating source-plan work before achieving full source completeness.

## Complete upstream source ownership — 15 October 2026

**User decision:** stop developing only a small external Sandboxie overlay;
copy the *entire* authentic Sandboxie Plus / Classic v1.18.5 tracked source
tree into the existing `Local` repository, then modify native code directly.
The new `tooling/isolation-source/import-full-sandboxie.mjs` uses a
full-history pinned upstream Git seed and `git subtree add --squash` to
create a normal writable `engine/isolation-owned/` directory in `Local`.
It compares the imported complete Git tree SHA to the upstream tag's
tree SHA. A second command `apply-owned-sandboxie.mjs` applies and
commits the existing 11-file MIVUBI native changes directly inside the
imported COPY; the pinned upstream seed and account-bearing host are not
mutated. This is the future native source owner after actual import.

**Executed:** four positive/negative real local Git subtree/patch integration
tests passed on disposable fixture repositories in the ChatGPT Linux
container, including exact imported Git tree parity, independent source
editability, a clean Local boundary and a second committed engine patch.
The Git blobs of the four committed JS scripts/tests matched their
container-executed `git hash-object` source blobs.

**Not done:** the 1,624 authentic upstream tracked files have **not yet been
transferred into the remote MIVUBI GitHub repository**. The available
GitHub connector cannot create a fork or reference unrelated upstream
tree objects (GitHub returned 422), while the ChatGPT container has
no GitHub network/DNS. The user-approved one-time Git subtree import
is implemented, not executed against the real upstream checkout. No
MSVC/WDK build, signed driver, service activation or Minecraft private
engine runtime is claimed. See `docs/system/owned-source-import.md`.

**Next:** perform the single full-source Git subtree import from the
initialized pinned source checkout, then apply the native code as a regular
owned Git commit; only then build and debug real MSVC/WDK outputs.

## Private Minecraft Education login configuration parity — 15 October 2026

**Observed mismatch corrected in source:** the operator-confirmed
two-account Sandboxie 1.18.5 pilot signed in only after applying
`NoSecurityIsolation=y`, `DropAdminRights=y`,
`Template=OpenCOM`, and `OpenProtectedStorage=n`
alongside persistent storage and closed credential settings. The
private Client 02–04 `SbieIni.exe` profile planner previously
omitted those settings, risking recurrence of HRESULT `0x80070424`
even if the MIVUBI Windows driver compiled successfully.

The canonical `minecraft-profiles.mjs` now reproduces the proven
localtest configuration on three **new** isolated boxes, with
`Enabled=y` last; tests cover all expected values and ordering.
The plan explicitly marks reduced security isolation, requires
operator approval, and does not claim settings read-back or login.
Existing occupied boxes and accounts remain untouched.

**Executed proof:** portable JS plan was evaluated in ChatGPT against
expected three-box/24-command contract; this does not prove WAM/SSO
behavior, actual SbieIni calls or Windows source compilation.

**Next:** compile full private native runtime and verify authorized
box settings plus login in an isolated Windows environment.

## Native SbieIni configuration error signaling — 15 October 2026

**Functional defect:** pinned Sandboxie v1.18.5 `SbieIni.exe` always
returned exit code 0 for most `SbieDll_UpdateConf` or
`SbieApi_UpdateConf` failures, so a caller could falsely consider
a persistent Minecraft client sandbox configured.

**Change:** the private native `Sandboxie/apps/ini/update.c` now
returns 3 when the update API fails, retaining exit code 0 for success,
1 for invalid syntax and 2 for wrong password. The canonical overlay
extends to 11 upstream source files and 24 nonoverlapping hunks;
read-only Rust payload inspection and source tests reflect the same closure.

**Evidence boundary:** private source transformation and negative error-code
assertions can be executed against genuine upstream bytes without affecting
official Sandboxie. Native Windows MSVC/WDK binary build, service/driver
loading, persisted profile read-back and Minecraft gameplay remain
NOT_EXECUTED.

**Next:** compile and execute the full private Windows core and verify
SbieIni exit codes and read-back in an exclusive lab.

## Private Start.exe cold-boot launcher fix — 15 October 2026

**Functional integration issue:** the opt-in MIVUBI `Start.exe` mode
performed `SbieApi_GetVersionEx` before `Validate_Box_Name`, the first
normal location that waits for/starts `SbieSvc`. On a clean first run
without an already running service/driver, the private handshake could
reject the valid new installation instead of starting it.

**Source fix:** start and await the existing Sandboxie service broker via
`CallSbieSvcGetUser` **only for admitted private client modes**, then
perform the mandatory private version/ABI check before setting the box
name or launching a child. A failed broker request or foreign driver
remains rejected. This modifies actual private Start.exe source overlay,
not an app wrapper or an installer.

**Evidence:** source patch and regression test cover startup order,
private ABI admission, and tamper refusal. Full Windows MSVC/WDK,
SbieSvc service startup, driver loading, REA binary inspection and
Minecraft runtime remain NOT_EXECUTED; no official host mutation.

**Next:** compile the complete owned Windows fork to validate the changed
broker/launcher interplay against real service initialization.

## Unblocked iterative private native builds — 15 October 2026

The previous private fork verifier required one single direct-child commit
of Sandboxie v1.18.5. That forced rewriting Git history to record each new
compiler or linker fix, blocking normal native build/debug iterations.
The verifier now accepts a linear chain of source-only commits descending
from the pinned upstream revision; it rejects merges and unauthorized paths
in **every intermediate commit**. The final committed source still must
match the canonical exact 10-file overlay with a clean checkout. Existing
build scripts, candidate ABI and package staging retain this one verifier.

**Executed:** a four-case real disposable-Git reproduction on ChatGPT Linux
demonstrated controlled multi-commit acceptance and failure on merges,
unapproved intermediate files and non-descendant ancestry. Targeted Node
regression source is committed. This is a source workflow blocker removed,
not a signed Windows driver or engine runtime acceptance.

**Next:** run the existing private MSBuild pipeline, save first real Windows
compile/link failures, and commit the concrete kernel/service/DLL fixes
linearly without squashing the previously verified source history.

## Kernel query-box-path namespace admission — 15 October 2026

**Implementation:** the existing private Sandboxie kernel source now enforces
the MIVUBI box namespace in `Process_Api_QueryBoxPath` before calling
`Box_Create` for a non-sandboxed caller. Foreign names return
`STATUS_ACCESS_DENIED` directly; they no longer allocate and free a
transient BOX before surfacing an unrelated `STATUS_UNSUCCESSFUL` result.
The earlier named-process start, model-PID clone and Box_Alloc checks remain.

**Source scope:** canonical fork overlay patches ten pinned v1.18.5
files with 22 nonoverlapping hunks. Expected-source verifier and fixture
regression cover the extra query path. Service namespace, kernel ABI,
driver signing and active official Sandboxie installation are unchanged.

**Evidence:** authentic ten-file source transformation and byte-exact
comparison passed in ChatGPT V8. Node test runner, full Windows WDK/MSVC
build, signed driver loading, REA binary analysis, Minecraft gameplay and
four-account acceptance remain NOT_EXECUTED.

**Next:** integrated private Windows build and observed error-driven debugging
in an isolated environment; no migration from the official pilot.

## Model-PID kernel clone admission — 15 October 2026

**Work:** the private Sandboxie-derived `Process_Api_Start` kernel path
now rejects an unowned model PID's sandbox before calling `Box_Clone`.
The gate checks the existing model process's box name, and releases
`Process_ListLock` plus restores IRQL on the rejection path.
It returns `STATUS_ACCESS_DENIED`, rather than misclassifying the
denial from lower-level `Box_Alloc` as insufficient resources.
The prior explicit named-box admission and allocation-level denial remain.

**Source scope:** existing pinned 10-file private fork closure;
the process API gains one nonoverlapping patch hunk (21 total).
The canonical source assembler, strict expected-byte verifier, and
fixture-based regression tests all share this source owner.
No new driver ABI, service namespace, installer action, or provider switch.

**Proof boundary:** static source review of actual pinned upstream
`Process_Api_Start` and repository regression assertions. Node test suite,
full Windows WDK/MSVC compile, signed driver loading, REA binary inspection,
and Minecraft runtime acceptance have not been run in this change.
Existing official Sandboxie, account data, and world files are untouched.

**Next:** full private Windows WDK/MSVC build in an authorized isolated
environment; fix actual compiler/linker/runtime errors before any cutover.


## Kernel Process_Api_Start policy fix — 15 October 2026

**Implementation:** the MIVUBI Sandboxie-derived kernel source now checks
`MivubiBoxNameAllowed(boxname)` in upstream
`Sandboxie/core/drv/process_api.c` immediately after
`Api_CopyBoxNameFromUser`, before looking up an impersonation token or
allocating a BOX. Forbidden requested box names return
`STATUS_ACCESS_DENIED` (not misleading `STATUS_INSUFFICIENT_RESOURCES`).
Valid box names retain the original token/session/Box_CreateEx path.
The existing lower-level `Box_Alloc` denial remains active for
create/clone paths. This change adds a tenth exact pinned upstream
source file, producing 20 nonoverlapping Git hunks; the Rust inspector,
private assembler and source regression tests share the updated list.

**Executed evidence:** actual upstream v1.18.5 file bytes were used for
the exact-source transformation and strict byte check: 10 paths, 20
hunks, PASS. Ten authored pure JavaScript source regression tests ran
in ChatGPT V8 and passed, including altered status/gate detection.
The canonical `mivubi_kernel_box_policy.h` has a matching Git hash
`cdd280a784ccb67e9f6d4c56b0f20cde0fa86921` in the ChatGPT
container. A C smoke test using that exact header passed GCC/Clang and
compiled with clang-cl to a Windows x64 COFF object.

**Limits:** this does not compile the complete Sandboxie driver,
service, DLL or Start.exe. Model-PID clone failures still rely on the
lower-level Box_Alloc gate and existing upstream error mapping; the
new explicit STATUS_ACCESS_DENIED targets the named-box start path.
Actual Windows WDK/MSVC, signing, service load, process isolation,
REA binary inspection and Minecraft account tests are NOT_EXECUTED.
Keep the official Sandboxie installation, accounts and worlds intact.

**Next:** build and debug the real integrated Windows private kernel
and service in a disposable exclusive environment. Do not return to
metadata-only work unless needed to correct a blocking implementation.


## New native kernel function: whitelist BOX creation — 15 October 2026

**Work:** substantive MIVUBI-owned Sandboxie engine implementation,
not a launcher/UI/report-only milestone. The private pinned v1.18.5
fork now changes `Sandboxie/core/drv/box.c`, placing one canonical
`mivubi_kernel_box_policy.h` C gate immediately before `Box_Alloc`
allocates a kernel sandbox object. Both new boxes and cloned child
contexts go through this function. Only the three exact MIVUBI names
(02/03/04; ASCII case-insensitive) are permitted; unowned box names
are denied with `STATUS_ACCESS_DENIED`, before allocation. No new
Windows driver API, ioctl, or service namespace is introduced.
The approved canonical source closure becomes **nine source files**,
**18 source hunks**; Rust inspector and private assembler follow it.

**Executed:** 35 native allow/deny test cases, each run in GCC Release,
Clang Release, GCC ASan/UBSan and Clang ASan/UBSan (all PASS).
Candidate source/test Git SHA matched bytes in the ChatGPT container.
Nine eligible authored JavaScript source regression bodies PASS.
Actual nine pinned Sandboxie source blobs produce 18 nonoverlapping
hunks and pass the byte-exact private fork transform. Whole-driver
MSVC/WDK compilation/signing, REA binary analysis, service/kernel
loading and Minecraft account proof are **NOT_EXECUTED**.

**Next:** actual private full-core compilation with Windows toolchain
in an approved disposable lab, then test kernel box enforcement,
parent/child process isolation and service startup. No active
official Sandboxie installation, accounts, or world files changed.


## Private fork Windows Git CRLF compatibility — 15 October 2026

**Goal:** actual native MIVUBI-owned Sandboxie core binaries that compile
and run. Do not confuse source-work milestones with an operational
replacement for official Sandboxie.

**Implemented:** upstream .gitattributes marks .c/.cpp as text but not
`eol=lf`. A clean Windows fork with `core.autocrlf=true` can have CRLF
working-tree source. The previous private patch generator rejected CRLF
before invoking Git apply, preventing actual private fork construction
on a valid Windows checkout. The owner now normalizes each authorized
file *in memory* to LF for patch creation, rejects mixed/lone-CR source,
does not change `core.autocrlf` or rewrite source files, and preserves
expected source bytes for either clean newline convention.

**Evidence:** all eight actual pinned v1.18.5 upstream file contents
produced exactly the same 16-hunk patch from LF and CRLF representations;
mixed/lone-CR variants failed closed; eight authored pure JS test bodies
executed and passed in ChatGPT V8. A disposable Git checkout with
`core.autocrlf=true` demonstrated that `git apply --check --index`
and `git apply --index` accept the LF patch and preserve CRLF on disk.
The checked-in Git integration regression covers all eight source paths.
**NOT executed:** full pinned Node24 test suite, whole-Sandboxie Git
checkout/build in a Windows MSVC/WDK environment, REA native binaries,
kernel load/service, and Minecraft four-client acceptance.

**Next single step:** test and build the private fork using an eligible
isolated Windows toolchain, then fix actual native compile/load
incompatibilities and inspect artifacts with REA. Do not touch the active
account-bearing official Sandboxie host.


## Private DLL atomic handle-verification cache — 15 October 2026

**Primary goal:** MIVUBI's own functioning Sandboxie-derived native
engine. **State:** source implemented; portable pointer type probe
compiled; full native Windows core, signing, driver load and gameplay
still NOT_EXECUTED.

**Actual implementation:** in the private `SbieDll` source, replace
unsynchronized reads/writes of `MivubiVerifiedDeviceHandle` with
`InterlockedCompareExchangePointer` and
`InterlockedExchangePointer`. Verification remains per opened handle
with explicit invalidation on close/reopen. All modifications stay in
the canonical eight-file fork overlay, not a separate runtime wrapper.
The changed code was checked against Microsoft Win32 pointer-atomic
signatures. The relevant small native C type probe compiled through
`clang-cl` to Windows COFF. Eight authored source regression
test bodies passed in ChatGPT V8, including tampering with cache
admission, reset and atomic operations. Exact eight-file upstream
overlay generated 16 nonoverlapping hunks and matched expected bytes.

**Not established:** thread-safe lifetime of upstream
`SbieApi_DeviceHandle` itself. Atomically storing an approved handle
does not serialize concurrent handle close/reopen or the kernel ioctl
that may already be in progress. No claim of full multi-threaded
correctness, co-installability, authenticated kernel signing or
four-account acceptance is made.

**Next:** prioritize a full native MSVC/WDK build and runtime tests on
an approved disposable Windows environment; fix observed driver,
service and DLL issues before replacing the official backend.


## First valid native Release policy regression — 15 October 2026

**Primary objective remains:** an actual functioning Sandboxie-derived
MIVUBI native isolation engine. Desktop/client-manager additions are not
a substitute for kernel/service/DLL integration.

**Verified defect (fixed):** `owned-runtime/
mivubi_owned_start_policy.test.cpp` used `assert` for all native checks.
CMake Release builds normally define `NDEBUG`, which removes those
checks. The old test passed despite a deliberately wrong expected
result; the new always-on `require` helper fails on the same planted
error, and 26 correct cases pass. Six truncated-input cases were added.
The source policy's combined conditional was made sequential for
auditability; ASAN did *not* show a memory error in the old expression
because C++ short-circuit semantics already protected the missing
character positions. Do not cite it as a demonstrated memory-safety bug.

**Exact candidate proof in ChatGPT:** the two GitHub candidate C++/header
blobs were reproduced byte-for-byte and their `git hash-object`
matched. Native Release `-DNDEBUG` GCC and Clang: PASS, 26 cases
each. AddressSanitizer + UBSan GCC and Clang: PASS. Two CMake Release
builds and CTest PASS. The updated Start.cpp source patch still
matches all eight pinned upstream v1.18.5 source files, produces
16 hunks and passes exact edited-byte comparison in ChatGPT V8.
No claim is made about Windows/MSVC/WDK source compilation.

**Next substantive task:** the private runtime must be compiled as an
actual Windows kernel minifilter/service/DLL/Start set on an approved
disposable lab, with REA inspection of genuine native outputs and
driven bug fixes. Merely running more static/checker tests or modifying
docs must not be treated as product completion. Existing official
Sandboxie and account-bearing profiles are unchanged.


## Core identity memory-safety correction — 15 October 2026

**Priority:** deliver a functioning Sandboxie-derived native MIVUBI core,
not an external management wrapper or new readiness bureaucracy.

**Actual defect repaired:** the shared C identity helper previously ran
unbounded `wcscmp` on the `WCHAR[16]` response of upstream
`API_GET_VERSION`. A foreign driver may return a malformed response without
a NUL byte, risking an out-of-range read before the caller can reject it.
The implementation now takes the caller's explicit WCHAR capacity,
compares the exact marker including NUL only if it fits, and never scans
past that capacity. All private Start and DLL callsites pass 16 WCHAR;
the same C helper remains inlined into kernel and usermode source.

**Evidence actually executed:** C11 test binaries for the capacity-bounded
identity were compiled with GCC and Clang under
`-Wall -Wextra -Werror -pedantic -fsanitize=address,undefined` and
both exited successfully. Cases included 2-element nonterminated version,
16-WCHAR nonterminated version, truncated declared capacity, NULL,
wrong ABI, tampered prefix, correct identity. Exact pinned upstream
eight-file patch/expected-byte comparison in ChatGPT V8 PASS, with 16
hunks and all three caller capacities verified; seven authored pure JS
regression test bodies PASS. Pinned Node24/Rust and Windows MSVC/WDK,
native service/kernel, driver signing and Minecraft gameplay remain
NOT_EXECUTED.

**Next ONE task:** investigate actual native build/link failures with the
full Windows toolchain in a disposable isolated lab; correct the private
core driver/DLL/service source based on those results before attempting
private provider cutover. Existing official Sandboxie and account-bearing
world/profile data remain untouched.


## Private DLL ordinary-ioctl ownership and service shutdown — 15 October 2026

**Goal remains:** working MIVUBI-owned Sandboxie-derived core, not a
wrapper, demo dashboard or documentation project. **State: SOURCE_CHANGED;
Windows signed driver/service/DLL and Minecraft gameplay NOT_EXECUTED.**

**Functional implementation:** `core/dll/sbieapi.c` now checks the
MIVUBI driver version/ABI with an ordinary `API_GET_VERSION` on each
newly opened device handle, before permitting non-version ioctls.
It caches the verification per handle and resets when closing or
reopening, including reused Windows handle values. This avoids
requesting version on every normal game call. It continues to refuse
an official driver with `STATUS_REVISION_MISMATCH`. Private
`core/svc/DriverAssistStart.cpp` invokes the existing `AbortServer()`
shutdown path when it sees the same foreign-driver status, instead of
returning prematurely from the startup thread.

**Patch correctness:** the GetVersionEx source lines changed in three
adjacent places. Separate context hunks caused a reproducible Git
`patch does not apply` failure. The source owner now emits one combined
nonoverlapping 7-line hunk, rather than three overlapping hunks.
A disposable local Git fixture verified the combined hunk using
`git apply --check --index` and `git apply --index`. The exact eight
pinned upstream v1.18.5 source blobs produced **16** nonoverlapping
hunks and passed expected-byte verification in ChatGPT V8. Seven
authored JS source test bodies passed with service/DLL tamper rejection.

**Limits:** This is a source implementation, NOT a compiled Windows
kernel minifilter, production signing, installed isolated service,
authenticated kernel measurement, account separation, crash fix or
four-client acceptance. The normal private DLL ioctl path is guarded;
other external DLLs or kernel callers must not be assumed covered.
The unchanged `SbieDrv`/`SbieSvc` system namespace still prevents
coexistence with official Sandboxie.

**Next SINGLE substantive task:** inspect actual ABI and source build
failures in the complete Windows toolchain when available, then
correct concrete driver/service/DLL incompatibilities and test on a
separate disposable Windows host. Do not execute privileged engine
cutover on the user's official account box.


## Native DLL/service/driver core identity — 15 October 2026

**Primary goal:** MIVUBI's own *functioning Sandboxie-derived isolation
runtime*, not merely a launcher wrapper or audit machinery.
**This batch:** the pinned private fork now modifies eight actual upstream
source files. Coded and statically reviewed, but **not compiled or loaded
using Windows MSVC/WDK**.

**Concrete native changes:** kernel `api.c` continues responding with its
private `5.73.5-MIVU` version marker and pinned ABI `0x57230`. Private
`SbieApi_GetVersionEx` in `core/dll/sbieapi.c` always queries both the
driver version and ABI—even when its caller asks for `NULL` output—and
returns `STATUS_REVISION_MISMATCH` when the connected kernel is not the
MIVUBI fork. Original API signatures, IOCTL values and argument structures
remain intact. In the correct asynchronous service owner,
`core/svc/DriverAssistStart.cpp`, an early mismatch result aborts the
startup path **before** it tries `NtLoadDriver` against an already present
official Sandboxie driver. If no driver is present, the original driver
load/retry flow is preserved. The opt-in MIVUBI Start.exe path still
requires the private identity/ABI.

**Proof:** eight real pinned upstream files at
`abd4c240031cfb46666daa74ca47ed4e48b561e4` were passed through
the updated patch and strict expected-byte verifier in ChatGPT's JS runtime:
8 source paths, 14 patch hunks, exact bytes PASS. Six authored pure
JavaScript source tests were executed in ChatGPT V8 and passed, including
tamper rejection on service/DLL version admission. Portable C/C++ identity
tests from previous batch passed under GCC and Clang. Exact Windows
service startup and SbieDll binary behavior remain **NOT_EXECUTED**.

**Source ownership changes:** eight path names must be kept aligned between
the patch producer's SOURCE_FILES, Rust inspector's PRIVATE_SOURCE_FILES,
and build assembly's source closure. The existing service name `SbieSvc`,
driver name `SbieDrv` and minifilter registration still conflict with
official Sandboxie. This is a fail-closed *version-path* integration, not
total ioctl-channel attestation, cryptographic code-signing proof or
service/kernel installation success.

**Next ONE task:** when a disposable Windows environment with the pinned
MSVC/WDK is available, compile full upstream and private core and verify
SbieApi_GetVersionEx/StartDriverAsync behavior with real driver artifacts,
using REA to guide any actual binary mismatch correction. Before that,
continue only implementation improvements whose source failure can be
demonstrated. Do not install private drivers into the active account host.


## Core driver version identity — source batch 2026-10-14

**Goal:** build an independently functional MIVUBI Sandboxie-derived
driver/service/DLL/Start core, not a wrapper around installed Sandboxie.
**Status:** DRIVER-AND-START SOURCE MODIFIED, portable native tests PASS;
private Windows core NOT_COMPILED, NOT_INSTALLED, NOT_GAMEPLAY_VERIFIED.

**Concrete engine change:** reuse pinned upstream kernel
`API_GET_VERSION`, returning `5.73.5-MIVU` on MIVUBI private builds
while retaining `MY_ABI_VERSION=0x57230`, the original ioctl and struct
ABI. The private Start.exe opt-in three-client path now calls
`SbieApi_GetVersionEx` and refuses owned-box launches unless both
MIVUBI marker and ABI are returned. An upstream official driver cannot
be mistaken for the private engine on this path. The canonical C11
`owned-runtime/mivubi_core_identity.h` source is inlined into the
private driver's API and Start.cpp, alongside the earlier C++17
Start policy. Existing upstream service/driver names still collide,
so **no coexistence with the installed official runtime**.

**Actual execution:** CMake/CTest compiled and ran 2 portable native
tests (Start C++17 policy + C11 driver identity) on each of GCC/Clang,
2/2 PASS on both. Exact patched GitHub seven-file Sandboxie source
produced 9 hunks; strict expected-blob comparison and modified-driver
negative case passed using ChatGPT V8. Five authored pure-JS fork
regression tests executed and passed. This is not an MSVC/WDK/kernel
runtime test and does not establish a signed or functioning service.

**Main next task:** verify private SbieSvc and SbieDll lifecycle accepts
only this core identity, compile real private binaries, and investigate
inter-component compatibility with REA on a disposable Windows host.
Avoid ad-hoc driver installation or modification of account-bearing
Client 02. Functional code takes priority over further proof-only layers.

## Primary milestone: actual MIVUBI Sandboxie fork (2026-10-14)

**Priority contract:** The product objective is a **working, independently
built, Sandboxie-derived native isolation system owned by MIVUBI**. No more
source-checker/proof bureaucracy as a substitute for implementing the native
engine. Three Minecraft boxes, REA and desktop UI are consumers/developer
tools, not separate competing products.

**Current implementation batch:** the private upstream `Start.exe` parser
now consumes one shared, independently compilable C++17 admission policy
(`engine/isolation-native/owned-runtime/mivubi_owned_start_policy.h`).
The fork overlay INLINES those exact bytes into the pinned seven-file
upstream patch, with one opt-in dispatch site; non-owned upstream launch
behavior remains intact. The duplicated hand-authored JS array of C++
parser rules is eliminated. The final approved overlay has **seven source
files and eight Git hunks**. The standalone native test contains **20
positive/negative cases** and is registered under the canonical repo's
`isolation-native:test-owned-start` CMake/CTest command.

**Executed native evidence:** C++17 policy compiled with **GCC** and
**Clang** in this ChatGPT execution container under strict warnings, and
both CMake/CTest executable runs PASSED. The earlier handwritten harness
for the identical 3228-byte policy had 17+ edge cases, while the committed
native test source expands this to 20. Real full-upstream patch generation
and strict expected-byte verification using exact seven GitHub upstream
v1.18.5 source files passed in ChatGPT V8, with one additional modified
Start source rejected. The private native Start.exe, service, DLL and
driver remain **NOT_COMPILED / NOT_EXECUTED** in Windows/MSVC/WDK.

**Proof boundary:** Native C++ parser acceptance is not a full Sandboxie
core build, kernel minifilter signing, safe coexistence with official
Sandboxie or four-account Minecraft stability. Service `SbieSvc`, driver
`SbieDrv`, IPC and minifilter altitude are unchanged in the current
exclusive upstream-derived private fork. Do not attempt to install alongside
the user's active official environment.

**Priority after this batch:** compile the actual pinned upstream core
with Windows MSVC/WDK on an authorized disposable Windows host, then build
the same source with the reviewed MIVUBI patch, compare native binaries via
REA, validate DLL/service/driver ABI, and implement the necessary core
isolation changes revealed by those results. Only after a loadable,
self-contained MIVUBI core is proven should it replace the official
Sandboxie backend, and only after real two-client stability should Client
03/04 be enabled. Do not misclassify this as finished product.


## Historical initial JS-only launcher customization — superseded by native policy

**Work:** move from ABI-marker-only overlay to real pinned upstream C++
`Start.exe` command-line behavior plus deterministic MIVUBI three-box
profile/launch control. **State:** SOURCE_IMPLEMENTED with bounded tests;
native private binaries and Windows gameplay NOT_EXECUTED.

**New real behavior in the seven-file direct-child private fork:** upstream
`Sandboxie/apps/start/start.cpp` receives an opt-in
`/mivubi_client:02|03|04` parser branch and validation that routes those
three client IDs to separate `MivubiEdu02/03/04` box names. The managed
switch rejects nonexistent IDs, second switches, mismatched box selection,
non-absolute/UNC/URL targets, unexpected parameters and non-Education EXE
names. Other upstream Start CLI paths remain unchanged when not opting
into the new mode. The patch/verifier still approves EXACTLY seven source
files; Start now contains three unified hunks (ABI, CLI dispatch and target
restriction), making nine hunks total. The producer and verifier use one
canonical expected-byte transformation.

**New functional host contract:** `engine/isolation-native/owned-runtime/
minecraft-profiles.mjs` generates a three-box persistent `SbieIni set`
configuration command plan and strict per-client private `Start.exe`
launch command line. Existing box names cannot be overwritten. Its six
authored test bodies were executed in ChatGPT's JavaScript evaluator and
passed (not full pinned Node24). A disposable-Git three-hunk fixture
successfully accepted `git apply --check --index` and `git apply --index`;
the exact updated private-source patch was also checked in V8 against the
actual upstream seven-file corpus, yielding seven changed paths and nine
hunks, with extra edits rejected.

**Not claimed:** private fork compiled to a Windows Start.exe; actual
SbieIni.exe execution; signed SbieDrv/SbieSvc; safe coexistence with official
Sandboxie (NOT possible with unchanged service names); Microsoft WAM
credential isolation; or independent Minecraft gameplay. No profile,
account, official box, kernel driver or Windows installation was changed.

**Next SINGLE implementation task:** integrate an owned runtime adapter
behind a verified dedicated private-driver lab admission, *not* the active
official Sandboxie backend, then test native Start/SbieIni binaries. Do
not consider source implementation sufficient for four-client acceptance.


## Actual private-fork patch application defect fixed — 2026-10-14

**Work:** make the seven-file private source overlay actually applicable by
Git, rather than just syntactically plausible text. **State:** DONE for
source correction and disposable-Git reproduction; the genuine upstream
private checkout and native Windows build remain NOT_EXECUTED.

**Defect:** `buildPrivateSourcePatch()` emitted Git unified-diff hunks
containing the insertion anchor but no original following context line
(`@@ -line,1 +line,added+1 @@`). In a disposable seven-file Git fixture,
`git apply --check --index` rejected that form as `patch does not apply`
even though every anchor matched. This would block `--fork-root` before
MSBuild or REA could make progress.

**Fix:** each hunk retains one following original source line and updates
the header to `@@ -line,2 +line,added+2 @@`. Unexpected CRLF source is
rejected rather than producing misleading provenance. Existing disposable
Git patch-application test plus new format/negative-case assertions
cover the correction. Seven-file Git fixture application now succeeds
(`git apply --check --index`, then `git apply --index`) and the actual
candidate JS hunk output passed five focused assertions in ChatGPT V8.

**Boundaries:** this does NOT prove patch application to the *full pinned
upstream checkout* in this environment, successful MSBuild/WDK compilation,
driver load, independent Minecraft gameplay, license clearance or REA
native provider Evidence. No Windows PC, account data, kernel service or
real game process was touched.

**Next ONE task:** run the exact seven-file overlay test and subsequent
source/build stages against a verified full-history pinned upstream
checkout when eligible; continue ChatGPT-only development only for
demonstrable defects, not repeated unexecuted readiness audits.


## Status decision — 14 October 2026: ChatGPT source stage NOT completely closed

**Exact GitHub HEAD before this handoff update:** `0e486f151cef`.
The product is NOT a finished Sandboxie replacement. No private signed
driver/service, installed source-compiled runtime, REA native binary Evidence,
four-profile launch backend or four-client gameplay proof exists.

**Confirmed done in GitHub source:** pinned v1.18.5 upstream inventory,
source-fork/patch bootstrap, exact committed seven-file patch checker, Windows
build scripts, noninstallable artifact stager, offline source/ABI probe,
bounded read-only Tauri inspector, unchanged official Sandboxie Client 02
backend and regression fixtures. A source patch marker is NOT a new
isolation implementation.

**Remaining GitHub/ChatGPT-only work:** the full `npm run
test:isolation-source` and other exact-revision Node/Rust/desktop tests
remain unexecuted at the pinned toolchain. Static V8 test-body runs do
not count as those test suites. Any genuine test failures or demonstrable
source contradictions should be fixed on `Local`; do not add speculative
readiness layers. The upstream build guide was corrected to use **different
report paths** for collection-only and the subsequent build, while build
and build-plus-staging are **alternatives** on a fresh checkout.

**Cannot be completed by GitHub source review alone:** native MSVC/WDK
compilation, signing/cert trust, exclusive service/driver load and rollback,
REA disassembly/decompilation of compiled Windows PE outputs, Windows
WAM sign-in and idle-crash diagnosis, multi-hour soak, three/four-client
resource profiling and independent account acceptance. These must remain
NOT_EXECUTED until proper evidence exists.

**Acceptance to close source handoff:** source fixes are in a committed
exact `Local` HEAD; all documented commands are consistent with the current
nonclobber behavior; no critical source-only known blocker remains; and the
specific unexecuted toolchain/runtime tests are carried as an explicit
disposable-Windows lab handoff. This is **source handoff readiness**, not
product implementation completion.

**Next ONE task:** do not perform a private-driver cutover. Where an eligible
toolchain becomes available, execute pinned source suites at exact HEAD;
then build the unmodified baseline in disposable Windows, followed by the
separate committed private fork and REA comparisons. Never change
account-bearing Client 02 to force progress.


## Private build preflight syntax and path-collision repair — 2026-10-14

**Work:** remove an actual PowerShell parse blocker in the private native
builder and prevent report/stage/log path collisions before MSBuild.
**State:** DONE for source changes; Windows/WDK execution NOT_EXECUTED.

**Defect:** `engine/isolation-native/fork-overlay/build-private.ps1` had
one unmatched opening parenthesis in the `-StageOutput` source-overlap
`if` condition. The script could not enter native compilation as written.
The conditional was corrected, preserving its same three overlap checks.
Both private and upstream baseline builders now also reject report files
inside the staged payload directory and report paths matching reserved
MSBuild stage logs. This avoids expensive compilation before a predictable
staging failure. No installation, signing, service, box, account or world
mutation was added.

**Evidence:** 2/2 existing authored source regression test bodies executed
against the modified exact GitHub PowerShell candidate text and PASSED.
Both modified PowerShell files additionally passed a quote/comment-aware
balanced-delimiter scan, including parentheses, brackets and braces.
This custom lexical scan is *not* a PowerShell AST parser; actual PowerShell,
MSVC/WDK, complete Node24/Rust and Minecraft runtime remain NOT_EXECUTED.
The regression explicitly refuses the old missing-parenthesis condition.

**Next ONE task:** only address further demonstrable source blockers;
full parser, build and REA native-binary proof belongs in an authorized
disposable Windows lab after ChatGPT-first source work is complete.


## Latest source batch — protect Windows build evidence (2026-10-14)

**Done in GitHub source:** `build-baseline.ps1` and `build-private.ps1`
now reject pre-existing report/log/stage destinations *before MSBuild*;
the private build additionally rejects stale optional PDB symbols, matching
the upstream baseline's required+optional artifact preflight. Both keep
existing noninstalling behavior, use no-clobber writes, and refuse
source/output overlap. The repo's existing Node source tests contain
new build safety assertions.

**Executed evidence:** two authored JavaScript build-script contract tests
were run against the updated exact candidate files in ChatGPT V8 and
passed. Full pinned Node24 test runner, PowerShell parser, Rust, CMake,
MSBuild, WDK, REA native and Minecraft tests remain NOT_EXECUTED.
No private binaries were compiled and no active service or accounts
changed. No claim is made about cross-process atomic filesystem locks.

**Next:** only substantive remaining source blockers should prompt a new
source patch. Otherwise stop expanding static gates and proceed to
separately authorized disposable Windows native build/proof.


**Authority:** GitHub `MIVUBI-STD/M-Minecraft-Emulator`, branch `Local`. Never
change `main` or the active Windows user environment to satisfy source tests.
This is the current work queue, not a second implementation database.
Full older handoff (~130 KB) remains permanently available at
[the previous Local revision](https://github.com/MIVUBI-STD/M-Minecraft-Emulator/blob/dc695bf9670cd07a8d5b7a9b51a8dc6b80fb7999/planning/development.md);
commit history contains each bounded intervention and actual evidence status.

## Goal and current behavior

- Target: **four simultaneously playable Minecraft Education Windows desktop
  clients, four distinct licensed accounts, one host**. Preferred eventual
  layout is Client 01 native plus Client 02–04 in separately isolated profiles.
  This target has **NOT** passed four-client acceptance.
- The only **active** isolation backend is an independently installed,
  official Sandboxie Plus 1.18.5 using persistent `MinecraftClient02`.
  VMware/guest paths are historical and inactive; user accounts, worlds,
  saved VMs and Sandboxie service/driver are not to be migrated, deleted or
  modified without a separate approved Windows acceptance.
- Real operator evidence on 14 October 2026: two distinct logged-in accounts,
  concurrent gameplay and multiplayer initially worked, then Client 02 crashed
  while idle. Crash root cause UNKNOWN; stable two-client soak and reboot
  persistence NOT_EXECUTED. Refer to
  [first-success/crash observation](../docs/validation/two-client-first-success-2026-10-14.md).
- The app-owned Sandboxie-derived engine is **source/build candidate only**.
  No private production driver, signed service, installed native core,
  proven ABI, REA binary analysis or owned runtime cutover exists. Its initial
  fork source merely inserts seven ABI/build guards; it does **not** implement
  new isolation semantics, improve performance, or allow co-installation.
  The existing Sandboxie names `SbieSvc`/`SbieDrv` remain exclusive.

## Current source ownership

| Area | Canonical source | Guaranteed scope |
| --- | --- | --- |
| Exact pinned upstream and all native binary/resource/license paths | `tooling/isolation-source/upstream-baseline.json` and `validate-baseline.mjs` | v1.18.5 complete closure (16 binaries, 9 optional PDBs, 5 resources, 3 notices) |
| Upstream checkout and Windows baseline | `verify-checkout.mjs`, `build-baseline.ps1` | provenance/read-only build, no install |
| Private fork source | `engine/isolation-native/fork-overlay/apply-private-source.mjs` | exact seven-file patch, clean direct-child commit, SHA/tree/patch digest |
| Private Windows build and staging | `engine/isolation-native/fork-overlay/build-private.ps1`, `tooling/isolation-source/assemble-private-engine.mjs`, `assemble-engine.mjs` | noninstallable payload, no driver or account changes |
| Native ABI probe | `engine/isolation-native/CMakeLists.txt`, `src/abi_probe.cpp` | source ABI, lab-only probe, no service install |
| Candidate read-only inspection | `apps/desktop/src-tauri/src/engine/owned_isolation.rs` | exact source/path/digest and folder snapshot, ALWAYS not installable |
| Active Client 02 launch | `apps/desktop/src-tauri/src/engine/native_clients.rs` | official Sandboxie only, fresh box admission, mutex, post-helper retry gap |
| UI/IPC | `apps/desktop/src/app/bridge/nativeFeasibilityApi.ts`, `CompactManagerApp.svelte` | candidate diagnostics, never engine activation |
| REA workflow | `docs/validation/rea-source-audit-2026-10-13.md` | developer-side methodology, NOT_EXECUTED on native binaries |

The root [GitHub rules](../GITHUB_RULES.md), architecture and tests own their
specific behavior. Avoid second managers, generic CI, duplicate names,
unnecessary abstraction layers and parallel documents containing the same
authoritative state.

## Last substantive source work

1. Compiled-source provenance closes the bug of reporting the original
   upstream HEAD while private edits remained staged. The exact clean
   private Git commit/tree and patch SHA-256 propagate through build report,
   payload and the Rust read-only inspector. CMake also calls the same
   committed-source verifier.
2. Windows private build report no longer references the removed PowerShell
   `$expected`; it checks outputs, license/resource existence, logs, source
   provenance before/after build, and refuses overwriting previous evidence.
3. Candidate scanner enforces 24 mandatory payload files, optional pinned PDB
   mapping, manifest provenance, strict safety marker, bounded metadata read,
   closed folder inventory, and Windows reparse-point rejection. These are
   snapshot integrity checks, NOT authenticity, signing or installation.
4. Active Client 02 launch guard uses a 30-second in-process anti-duplicate
   interval starting **after** the Start.exe helper finishes or errors. It
   still requires a fresh sandbox membership check. External process races
   remain unproven.
5. **Most recent completed source closure:** `validate-baseline.mjs` is being changed to reject
   reduced/reordered/injected artifact, optional-symbol, resource and license
   lists; the private assembler and private MSBuild script now share that
   complete inventory validation. New negative-case tests use the actual
   pinned complete manifest, not a misleading five-file fixture.

## Evidence ledger — do not inflate results

- **Remote GitHub:** source reviewed, versioned commits on `Local`, original
  upstream source files and solutions checked through GitHub.
- **Source-level V8:** specific pure/structural scenarios ran in ChatGPT's
  JS execution environment, including the canonical manifest mutations.
  This does **not** establish full Node test-runner success.
- **Full pinned Node 24.21.0 + npm/Vitest, Rust 1.98.1, CMake/VS2022, WDK,
  Authenticode signing, kernel load, REA native provider, WAM/crash tracing,
  Minecraft four-account acceptance:** **NOT_EXECUTED** here.
- Terminal toolchain in ChatGPT currently has Node **22.16.0**, lacks Rust/Cargo
  and cannot DNS-resolve github.com; GitHub connector remains available to
  inspect and commit text source. Do not weaken toolchain pins to manufacture
  a success status.
- REA is **not a shipped runtime dependency**. Later inspect signed/native
  binaries in a disposable lab, record hashes/provider Evidence, and compare
  to pinned source. See [REA campaign](../docs/validation/rea-source-audit-2026-10-13.md).
- Modified upstream source may be subject to GPL and special Sandboxie Plus
  distribution conditions. Public commercial/rebranded redistribution needs
  an actual licensing review; source checkout is not distribution approval.

## Next ONE executable task

**At the first genuinely eligible execution context**, run the complete
exact-HEAD Node/Rust source tests and pinned *unmodified* Sandboxie MSBuild
baseline in a separate disposable Windows lab. Then compile the reviewed,
committed private fork and run REA offline binary comparisons and ABI checks.
Do NOT install any private `SbieDrv`/`SbieSvc` beside the account-bearing
official Sandboxie installation.

Until that execution context exists, focus ChatGPT work only on demonstrable
source defects with direct implementations and negative tests. Do not
repeatedly grow this handoff or call source verification real gameplay.
