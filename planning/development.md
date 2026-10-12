# Current Development Handoff

**Branch:** `Local` only. **Product:** Minecraft Instance Manager.
**Current work:** `emulator/repository-documentation-hygiene`.
**Engineering state:** source prototype / **Windows build and two-account gameplay NOT_EXECUTED**.

## One selected outcome and engine

The product goal remains **four Minecraft Education Windows Desktop clients with
four separate legitimate licensed accounts on one PC**. The **only active
experiment** is **Client 01 (host-native)** and **Client 02 (Sandboxie Plus box
`MinecraftClient02`)**. Two independent logins, interactive gameplay,
multiplayer, reboot persistence and four-client capacity are **unproven**.

No Android/ADB runtime, Windows VM, second provider, virtual controller,
new daemon, background polling, account/token copying or EXE patching is
part of the active implementation.

## Current source authority

| Responsibility | Authoritative source |
| --- | --- |
| Active user interface | `apps/desktop/src/NativeFeasibilityApp.svelte` |
| Tauri IPC and Windows launch/inspector | `apps/desktop/src-tauri/src/commands/native_clients.rs`, `src-tauri/src/engine/native_clients.rs` |
| Frontend schema validation | `apps/desktop/src/app/bridge/nativeFeasibilityApi.ts` |
| Canonical on-demand Sandboxie inspection | `tooling/acceptance/windows/collect-sandboxie-feasibility.ps1` |
| Two-client evidence interpretation | `tooling/acceptance/evaluate-sandboxie-feasibility.mjs` |
| Lightweight architecture and tradeoffs | [Architecture](../docs/system/architecture.md) |
| Current local proof procedure | [Sandboxie two-client feasibility](../docs/validation/sandboxie-two-client-feasibility.md) |
| Retained old VMware/installer source | [Legacy Retirement](../docs/system/legacy-retirement.md) |

## Implemented source — not runtime claims

- Windows desktop official Client 01 launch request and one sandboxed Client 02
  launch request; manually select the signed Minecraft Education Desktop EXE.
- Canonical Sandboxie collector invoked on explicit Refresh/preflight in
  `-SummaryOnly` mode: **one observation for both process candidate classes,
  no report file per Refresh and no background polling**.
- Read-only inspection of Sandboxie box configuration, on-demand process/PID
  membership, visible window candidates and known WinCred-bypass settings,
  including explicit local/global protected-storage template selections.
- One fixed persistent box `MinecraftClient02`, with checks for
  `AutoDelete`, `AutoRemove` and known credential configuration. No
  automatic sandbox creation/deletion, VM mutation or account management.
- Fail-closed typed contracts and candidate-only labels. A visible process
  **outside** the selected box is **not proven** to be host-native.
- Legacy VMware UI/Guest Agent and mutation entrypoints remain paused;
  historical installed application identity and user data stay preserved.
  The old VMware NSIS package remains deliberately blocked.

## Unresolved risks that actually matter

1. **Login isolation:** Sandboxie does not create another Windows user.
   `OpenCredentials=OFF` is not proof of independent WinCred, WAM, ADAL or
   Microsoft Education sessions. Custom/nested templates are not fully resolved.
2. **Launch / process identity:** Sandboxie's command may return without an
   authenticated Minecraft child. Name-matched HWND/PID candidates are not
   Edition, sign-in, world or multiplayer proof. Repeated launch of a still
   invisible child has not been ruled out.
3. **Graphics and input:** DirectX/OpenGL rendering, Windows foreground focus
   and two playable simultaneous game sessions remain untested.
4. **Actual resource savings:** no measured manager/WebView2 CPU/RAM baseline,
   Sandboxie overhead, Minecraft per-process GPU/VRAM, latency or long-run
   stability. Low-overhead design is not a benchmark.
5. **Compilation / distribution:** Rust/Tauri, Svelte/TypeScript, Vitest,
   Windows PowerShell and packaging have no successful **exact-head**
   execution evidence. An approved native installer does not exist.

## Proof policy and next task

Source review and isolated JS evaluator callbacks are supporting diagnostics,
not an executed `npm run verify:source` or a Windows acceptance run. Earlier
15/15 Sandboxie evaluator regression callbacks were executed inside
ChatGPT V8 at prior pinned revisions; this is **not** Node/Vitest, Rust,
PowerShell or a two-game proof. Do not promote old evidence to new HEAD.

**One next step:** execute the pinned source build/checks when an authorized
source-execution context exists, then verify two real, independently licensed
Minecraft Education Windows sessions on the fixed native + Sandboxie route.
Repair the first demonstrated failure rather than adding a new checker/engine.

## Historical provenance (not active task state)

Earlier milestone-by-milestone notes are preserved in Git history at
[pre-cleanup Local commit `940ade5`](https://github.com/MIVUBI-STD/M-Minecraft-Emulator/blob/940ade5c03b6ec7bdf1fe6e9c06f26334ab08b87/planning/development.md).
This file deliberately contains **current handoff only**; archived prose must
not override current source, architecture or proof.
