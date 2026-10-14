# Current Development Handoff — M-Minecraft-Emulator

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
