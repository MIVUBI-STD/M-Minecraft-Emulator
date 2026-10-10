---
id: document.product.four-concurrent-accounts
class: DOCUMENT
domain: product
role: CONTRACT
authority: CANONICAL
lifecycle: ACTIVE
---

# Four concurrent Minecraft Education Windows desktop clients

## Single approved architecture

One Windows PC runs **four separate Minecraft Education Windows desktop clients concurrently**, each with its own licensed Microsoft 365 Education account: **one native Windows client + three isolated Windows 10/11 VMware Workstation guests**. The game must install, sign in, render, accept input and remain responsive in each guest. No Android, BlueStacks, multi-mode launcher or account automation is in scope. Four active VM processes are not evidence of four playable game windows.

```text
Windows host ─ Minecraft Education Desktop ─ Account 1 (native)
          └ VMware Workstation
              ├ Windows guest 01 ─ Minecraft Education Desktop ─ Account 2
              ├ Windows guest 02 ─ Minecraft Education Desktop ─ Account 3
              └ Windows guest 03 ─ Minecraft Education Desktop ─ Account 4
```

VMware is infrastructure only. The application should present a simple **Start clients**, **Open/Arrange**, and **Stop** workflow after one-time setup. It must not expose a second Android/native-instance product route.

## Real acceptance gates

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

Start with [One Windows Guest Feasibility](../validation/client-feasibility.md), then [Target Machine Acceptance](../validation/acceptance.md). One guest must satisfy boot, install/login and gameplay before three account-bearing VMs are built.

As of 2026-10-10, executable Node/Rust/Tauri build and real Windows/VMware/Minecraft/4-account tests remain **NOT_EXECUTED**. Source commits are not evidence of game compatibility. All development stays on `Local`; `main` stays untouched.
