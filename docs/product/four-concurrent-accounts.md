---
id: document.product.four-concurrent-accounts
class: DOCUMENT
domain: product
role: CONTRACT
authority: CANONICAL
lifecycle: ACTIVE
---

# Four concurrent Minecraft Education Windows desktop clients

## Approved product outcome — feasibility-first (2026-10-12)

Four concurrent, independently playable **Minecraft Education Windows Desktop**
sessions with four distinct legitimately licensed accounts on one Windows PC.
The **single selected lightweight architecture** is one native Minecraft
Education Windows Desktop process plus Minecraft Client 02 launched using
Sandboxie Plus box `MinecraftClient02`. Both must use distinct legitimately
licensed accounts, preserved data and normal Windows keyboard/mouse/GPU.
The future four-account outcome is not implemented; no Android, controller
emulation, Windows VM, account copying or custom resident launcher service
is part of the current development. See the canonical
[Lightweight Windows Architecture](../system/architecture.md).

**Implementation and proof status (updated 2026-10-14):** the active
Tauri/Rust/Svelte route supports explicit launch requests and read-only
process/box observations. Operator-confirmed Client 01 + Sandboxie Client 02
playability, independent Education accounts and permitted multiplayer were
observed, followed by a Client 02 idle crash. Stable two-client acceptance
remains FAILED/INCOMPLETE; reboot persistence, four-client gameplay and the
private owned isolation engine are **NOT_EXECUTED**. See the
[first success/crash evidence](../validation/two-client-first-success-2026-10-14.md).
No resource benchmark has established an ADB-sized
footprint; the manager's minimal-overhead design is a goal, not evidence.
Legacy VMware source and saved accounts remain inactive and untouched.
Avoid game EXE modification, injection, authentication bypass or storage of
account secrets.

## Selected scale-out direction (proposed, not proven)

One host-native Education Client 01 plus up to three separately profiled,
concurrent isolated Windows Desktop Clients 02–04 using a single Sandboxie-derived
runtime service/driver. Each account requires its own legitimate Microsoft
Education entitlement and independent interactive sign-in. No four-account
performance, isolation, persistence or multiplayer acceptance exists yet.
Initial owned core source is intentionally exclusive and must **not** coexist
with the official Sandboxie installation on the same account-bearing host.

## Existing VMware implementation (legacy, not new product direction)

One Windows PC runs **four separate Minecraft Education Windows desktop clients concurrently**, each with its own licensed Microsoft 365 Education account: **one native Windows client + three isolated Windows 10/11 VMware Workstation guests**. The game must install, sign in, render, accept input and remain responsive in each guest. No Android, BlueStacks, multi-mode launcher or account automation is in scope. Four active VM processes are not evidence of four playable game windows.

```text
Windows host ─ Minecraft Education Desktop ─ Account 1 (native)
          └ VMware Workstation
              ├ Windows guest 01 ─ Minecraft Education Desktop ─ Account 2
              ├ Windows guest 02 ─ Minecraft Education Desktop ─ Account 3
              └ Windows guest 03 ─ Minecraft Education Desktop ─ Account 4
```

VMware is infrastructure only. The application should present a simple **Start clients**, **Open/Arrange**, and **Stop** workflow after one-time setup. It must not expose a second Android/native-instance product route.

## Historical VMware acceptance procedure (legacy only)

1. **Boot:** VMware Workstation opens one Windows 10/11 64-bit guest to a responsive interactive desktop, with working VMware Tools, display and input.
2. **Install and sign in:** the actual Windows desktop installer or Microsoft Store Minecraft Education build installs **inside that guest**, matches host version, and a distinct correctly entitled organization account signs in manually to the real game menu. Do not install both package variants or copy a signed-in Base.
3. **Play responsively:** a real world renders in that Windows guest, camera and keyboard/mouse work, there are no blocking graphics errors or crashes, and the observed session meets the actual machine's usability criteria. A process counter, static 3D flag or configured RAM limit never establishes this.
4. **Scale only after one guest works:** use an **account-clean** immutable Windows Base; create isolated Virtual-01/02/03, finish each Windows OOBE independently, sign into three different licensed accounts and retain account-bearing disks. Native + three guests must be playable concurrently on one host, not merely booted.
5. **Daily operation:** normal restart/stop/start/suspend must preserve separate sessions; only explicitly confirmed reprovision may erase an account-bearing guest. Record measured host RAM/CPU, VMware guest GPU behavior, launch times and interactivity. Game state and multiplayer remain separate evidence.

No credentials, account tokens, private worlds or Windows user-profile data go into GitHub. No automated Microsoft sign-in or anti-single-instance bypass is authorized.

## Key compatibility risk

Minecraft Education supports Windows 10/11 64-bit desktop installations, but [Microsoft/Minecraft Education's Dedicated Server documentation](https://edusupport.minecraft.net/hc/en-us/articles/46913335157140-Dedicated-Server-System-Requirements) says VM-hosted Dedicated Server has official support **unlike the Client**. Its [PC requirements](https://edusupport.minecraft.net/hc/en-us/articles/360047556591-System-Requirements) list OpenGL 4.4 GPU capability, while documented VMware guest OpenGL limits may differ. Thus **VM desktop-client gameplay remains unproven until actually observed**. Do not equate VMware 3D configuration with successful Minecraft rendering.

The official [Windows installation guide](https://edusupport.minecraft.net/hc/en-us/articles/13106858087956-Windows-Installation-Guide) explains the two mutually exclusive installer variants.

## Proof and continuation

Follow [current development handoff](../../planning/development.md), the
[owned isolation design](../system/owned-isolation-design.md), and
[target machine acceptance](../validation/acceptance.md). Never infer
four-client readiness from two processes or two operator-confirmed worlds.
Source commits do not establish Windows/driver/gameplay acceptance.
All development stays on `Local`; `main` remains untouched.
