---
id: document.system.owned-source-import
class: DOCUMENT
domain: system
role: PROCEDURE
authority: WORKING
lifecycle: ACTIVE
---

# Complete Sandboxie source in the MIVUBI repository

## Chosen ownership model

The application retains the authentic **Sandboxie Plus / Classic v1.18.5**
source as a **writable Git subtree snapshot** at `engine/isolation-owned/`.
This is the *complete tracked upstream source tree*, including the Sandboxie
kernel/service/DLL/launcher, SandboxiePlus/SandMan sources, resources, tools,
installer and **all original license files**. It is **not a Git submodule**:
editing `engine/isolation-owned/Sandboxie/core/drv/box.c` is an ordinary commit
to `M-Minecraft-Emulator/Local` and cannot change upstream Sandboxie.

This is a source-ownership change, not a separate replacement operating-system
kernel, an app install, a signed SbieDrv.sys, or a proof of Minecraft gameplay.
The active official Sandboxie Plus installation remains untouched.

## Legal boundary before redistribution

Read the original pinned `LICENSE.Plus`, `LICENSE.Classic`,
`Sandboxie/COPYING`, and `SandboxiePlus/QSbieAPI/LICENSE` after importing.
The GPLv3 Sandboxie core, LGPL libraries and custom-licensed Plus UI have
**different obligations**. In particular, the Plus source license governs
modified binary redistribution, name/attribution, commercial use and
certificates. All existing original headers, authorship and licenses must
remain intact. Do not rename/relicense the SandMan Plus application, remove
certificate checks, or treat the repository's core GPL metadata as an
all-components license. This work does not grant commercial distribution rights.

## One-time import into `Local`

Only use a **clean, authorized, full-history** checkout of
`sandboxie-plus/Sandboxie` pinned to original tag `v1.18.5`, commit
`abd4c240031cfb46666daa74ca47ed4e48b561e4`. The app already records
this upstream reference as a Git submodule. The import never touches a
Windows driver/service or any Minecraft account, settings, boxes or worlds.

From the **root of a full checkout of M-Minecraft-Emulator**, in a PowerShell
terminal with Git and Node.js:

```powershell
git switch Local
git submodule update --init -- engine/isolation-upstream/Sandboxie
$head = (git rev-parse HEAD).Trim()
node tooling/isolation-source/import-full-sandboxie.mjs --seed engine/isolation-upstream/Sandboxie --expect-head $head
```

The importer verifies the seed's tag, exact commit, origin, full Git history
and clean tree; it requires the application's exact `Local` HEAD and a clean
index. It refuses an already occupied destination. Git's `subtree add
--squash` creates a normal `Local` commit, and the importer **compares the
complete imported Git tree hash to the original upstream Git tree hash**.
Unlike copying only the 11 modified source files, this retains **all** tracked
Plus/Classic sources. The `--squash` choice retains the pinned original commit
and Git subtree provenance without inserting decades of unrelated upstream
commit history into the application repository. The pinned submodule remains
as a read-only reference, not the engine's future source of truth.

## Apply existing native MIVUBI modifications to the owned COPY

```powershell
$head = (git rev-parse HEAD).Trim()
node tooling/isolation-source/apply-owned-sandboxie.mjs --seed engine/isolation-upstream/Sandboxie --expect-head $head
```

This second **one-time** command refuses a tree that no longer matches the
unmodified pinned upstream snapshot. It generates the already-reviewed
private driver/service/DLL/Start/SbieIni changes, applies them with
`git apply --index --directory=engine/isolation-owned`, verifies their exact
expected bytes, checks that only the approved source paths changed, then
commits the changes on `Local`. The upstream seed is never modified.
Later fixes should edit the actual owned files directly and be committed
normally, rather than creating another wrapper or regenerating the whole
overlay. The historical overlay remains only the initial migration source.

The script is **not idempotent**: reruns refuse an already-imported or patched
source. Neither command pushes automatically. Review the resulting commits
and push `Local` by the normal repository-approved Git workflow.

## Acceptance boundary

1. **Source imported:** exact upstream subtree hash matches (portable Git test).
2. **Owned source patched:** exact approved 11-file modifications are present
   as regular changes to the MIVUBI repository, original upstream unchanged.
3. **Windows build:** compile Win32, x64 user-mode, and WDK x64 kernel from
   `engine/isolation-owned/Sandboxie/` using the upstream documented MSBuild
   order; examine genuine compiler/linker errors. **Not executed here.**
4. **Runtime:** sign/load private driver in an authorized isolated Windows
   environment, verify service/DLL/launcher operation and rollback. Private
   core retains upstream service/device names and must not coexist with the
   official account-bearing installation. **Not executed here.**
5. **Minecraft:** test two separate Education sign-ins, stable graphics and
   multiplayer, then Clients 03–04 with distinct legitimately licensed
   accounts, preserving user data. **Not executed here.**

REA, if installed alongside a native analysis provider, may inspect genuine
built binaries; it does not replace Windows/MSVC/WDK or driver signing.

## Executed evidence versus current GitHub state

The import and patch routines have been exercised with separate disposable
Git repositories and synthetic source fixtures, including exact imported
Git-tree parity, direct editability of copied files, refusal on dirty/incorrect
branch or existing target, and refusal to reapply the native patch. This is
**not** an executed import of all 1,624 authentic upstream blobs to GitHub:
ChatGPT's current GitHub connector cannot create a fork/repository or reuse
unrelated upstream Git tree objects, and the ChatGPT Linux container does not
have outbound GitHub DNS/network access. A full source transfer requires the
above one-time Git subtree operation. Until it has run on the actual `Local`
checkout, `engine/isolation-owned/` does not exist in the remote repository.
