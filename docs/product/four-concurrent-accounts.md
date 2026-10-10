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

### Route 2: One native Windows client + three isolated VMware guests (existing source, conditional)

- Retain `apps/desktop/` + `engine/runtime-core/` as the currently implemented fallback.
- Before provisioning an immutable Base, prove one disposable VMware Windows guest actually renders and accepts Minecraft Education input; see [Single Guest Feasibility](../validation/client-feasibility.md).
- Only after one guest runs the game and logs into one distinct licensed account should two then three guests be attempted with measured performance.
- VMware guest Minecraft Education Client is **not officially supported in the same way as the Dedicated Server**, so no guarantees or automatic claims of compatibility.

If neither route meets all four requirements on the target hardware, call out technical infeasibility rather than pretending a process counter is the product.

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

**Source and Windows runtime acceptance are different.** As of 2026-10-10, the native second-window experiment and Windows/VMware game session have NOT been executed against the target machine. The existing VM backend, GUI and pilot tooling are source implementation only. No four-client success claim is justified yet.

Official references:
- Historical Minecraft Education multi-instance response: https://edusupport.minecraft.net/hc/en-us/community/posts/360072475972-Multi-World-Setup
- Current Minecraft Education account management (switching, not concurrency): https://edusupport.minecraft.net/hc/en-us/articles/360061382672-Sign-Into-Minecraft-Education
- VM client vs VM dedicated server: https://edusupport.minecraft.net/hc/en-us/articles/46913335157140-Dedicated-Server-System-Requirements
