---
id: document.product.four-concurrent-accounts
class: DOCUMENT
domain: product
role: CONTRACT
authority: CANONICAL
lifecycle: ACTIVE
---

# Product Objective: Four Simultaneous Minecraft Education Accounts on One PC

## One sentence

**One Windows PC must show four independent Minecraft Education game windows at the same time, each signed in with a distinct, legitimately licensed Microsoft 365 Education account, and all four must remain responsive.**

This is the entire primary product goal. A virtualization manager, updater, Guest Agent, snapshots, and account setup tools are implementation details, not outcomes.

## Definition of DONE

1. Four actual, separate visible Minecraft Education windows coexist on the **same Windows interactive desktop**. Four process names, four VM power states, or four Start-menu shortcuts do not count by themselves.
2. Each window maintains a *different*, properly entitled Education account **simultaneously**. Switching between accounts inside one application is not sufficient. User sign-in, authentication and MFA remain manual; passwords and tokens are never stored by this project.
3. The same supported Minecraft Education version runs in all four windows; each menu can be interacted with, and a world can be loaded and played at the same time.
4. The four windows remain usable concurrently, without repeatable crashes, account cross-talk, major rendering defects, or unacceptable input lag. Performance must be observed on the actual target PC, not inferred from RAM capacity alone.
5. A normal daily session must not require users to recreate VMs, reinstall Minecraft, or sign out and replace the other three accounts.

Multiplayer join between four independent accounts is an additional valuable acceptance test, but it is not a replacement for the above four client requirements.

## Choose the lightest viable mechanism, based on evidence

### Route 1: Direct Windows native multi-instance (test first)

- Inspect the actual installed Education client type and already-visible game window.
- From a read-only default probe, optionally *request* one additional launch through its unique registered Start-menu application ID.
- Observe whether a genuinely additional window becomes visible and remains interactive. The official Education support response that multiple copies are not supported is historical (2019) and **does not prove or disprove** the current 2026 executable behavior.
- **Separate Windows and login state:** if two windows appear but sign-in in one replaces the other, native multi-instance is not sufficient. An independent operating-system user profile may provide isolation, but this too must actually work on the same interactive desktop. Do not implement credential switching, AppX patching, binary modification, mutex bypass, or fake accounts.
- Repeat to four only if the two-client proof succeeds; stop on any identity collision.

Use `tooling/acceptance/windows/probe-native-multi-instance.ps1`. By default it only observes process/window candidates; `-Mode TRY_SECOND` explicitly requests one Start-menu activation. **All of its outputs are diagnostic `INCONCLUSIVE`**, never account or game proof.

### Route 2: Native Windows + three Android instances via BlueStacks 5 (pilot after native)

- BlueStacks officially offers **Multi-instance Manager**, distinct Android instance profiles, per-instance shortcuts, and per-instance graphics/CPU/memory controls. Its own catalog lists Minecraft Education for Android, but that catalog entry was updated in **2023/2024**, and it does not prove current 2026 app, Microsoft 365 login, rendering or multi-user functionality.
- Minecraft Education's **official system requirements explicitly do not support third-party Android emulators**. Treat this as a *compatibility experiment*, not a guaranteed supported solution or a recommendation to rely on unverified third-party accounts.
- Run **one** fresh BlueStacks 5 Android instance first; install the legitimate Minecraft Education app from Google Play. Verify one correctly licensed organization account signs in and a world is playable. Do not clone a signed-in instance to manufacture identical account sessions.
- If one works, create a second **fresh, independent** instance, sign in with another licensed Education account, confirm both remain active and playable alongside the Windows Native client. Then try **three Android guests plus one Windows Native** (four accounts total), minimizing emulator overhead. Four Android guests is an alternative only if that proves superior on the actual host.
- The app's optional "Open Android instances" action opens a locally installed BlueStacks 5 Multi-instance Manager; it does not install the emulator or assert successful game operation. `tooling/acceptance/windows/probe-android-instances.ps1` observes host process/window candidates with no account or disk reads.
- BlueStacks offers application/instance desktop shortcuts and built-in multi-instance arrangement; reuse those instead of building another lifecycle manager or inventing internal command-line switches before provider behavior is proven.

References:
- https://www.bluestacks.com/apps/education/minecraft-education-edition-on-pc.html
- https://support.bluestacks.com/hc/en-us/articles/360052834092-How-to-create-and-manage-instances-using-the-Multi-instance-Manager-on-BlueStacks-5
- https://support.bluestacks.com/hc/en-us/articles/4402959142541-How-to-create-desktop-shortcut-for-a-specific-instance-on-BlueStacks-5
- https://edusupport.minecraft.net/hc/en-us/articles/360047556591-System-Requirements

### Route 3: One native Windows client + three isolated VMware guests (existing source, conditional)

- Retain `apps/desktop/` + `engine/runtime-core/` as the currently implemented fallback.
- Before provisioning an immutable Base, prove one disposable VMware Windows guest actually renders and accepts Minecraft Education input; see [Single Guest Feasibility](../validation/client-feasibility.md).
- Only after one guest runs the game and logs into one distinct licensed account should two then three guests be attempted with measured performance.
- VMware guest Minecraft Education Client is **not officially supported in the same way as the Dedicated Server**, so no guarantees or automatic claims of compatibility.

If none of these routes meets all four requirements on the target hardware, report the limitation rather than claiming a process counter, four emulator windows, or four sequential account switches satisfy the goal.

## Minimal user experience

The intended finished workflow is:

```text
Open M-Minecraft-Emulator
→ Start / Open 4 clients
→ each client uses its own persisted signed-in account
→ arrange 4 visible game windows
→ manually play/test each account
```

Any first-time installation or login assistance should be clearly separated from the daily workflow. No credential vault, multi-purpose VM management app, custom hypervisor, automation of Microsoft sign-in, or speculative performance-control UI is required by this goal.

## Status

**Source and Windows runtime acceptance are different.** As of 2026-10-10, native second-window, BlueStacks Android instance, and Windows/VMware game experiments have NOT been executed against the target machine. The existing VM backend, GUI and pilot tooling are source implementation only. No four-client success claim is justified yet.

Official references:
- Historical Minecraft Education multi-instance response: https://edusupport.minecraft.net/hc/en-us/community/posts/360072475972-Multi-World-Setup
- Current Minecraft Education account management (switching, not concurrency): https://edusupport.minecraft.net/hc/en-us/articles/360061382672-Sign-Into-Minecraft-Education
- VM client vs VM dedicated server: https://edusupport.minecraft.net/hc/en-us/articles/46913335157140-Dedicated-Server-System-Requirements
