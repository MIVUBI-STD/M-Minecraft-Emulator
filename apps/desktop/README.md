# Virtual Clients Desktop

Canonical desktop source for M-Bedrock Virtual Clients. The current src/main.ts mounts **NativeFeasibilityApp.svelte** only. Its two explicit controls are the official Minecraft Desktop launch request and a read-only same-session candidate PID/HWND inspection through the strict typed src/app/bridge/nativeFeasibilityApi.ts bridge. Old App.svelte and VMware surfaces/IPC adapters are preserved but unmounted or unregistered. Public Rust VM mutation commands are paused. See [Legacy Retirement](../../docs/system/legacy-retirement.md) for deletion criteria. No four-account gameplay is verified. Non-UI authority remains in ../../engine/.

## Stack

```text
Tauri 2
Svelte 5
Vite
TypeScript
Rust
```

This follows the same desktop architecture as `M-LazyBuilder-Plugin/apps/launcher`.

## Layer boundary

```text
Svelte product surfaces
        ↓
typed runtime facade
        ↓
thin Tauri command adapters
        ↓
Virtual Clients Rust backend
```

Ownership:

```text
src/                         presentation + ephemeral UI state
src/app/bridge/              typed Tauri boundary
src-tauri/src/commands/      thin adapters
src-tauri/src/engine/        desktop-native behavior only
engine/runtime-core/
                             VM lifecycle/domain authority
```

There is no localhost HTTP bridge, injected browser-global API, or second VM state authority.

**Legacy window arrangement (unmounted):** Window arrangement was desktop-native presentation behavior. VM lifecycle eligibility stays in the backend. Its Windows discovery enumerates **visible, ownerless top-level HWNDs**, checks owning PIDs and constrained Minecraft Education/VMware window titles, and refuses duplicate or ambiguous client/window mappings. Placement rechecks HWND ownership/title and rejects a failed Win32 `MoveWindow` result instead of reporting success. VMware tabs are not assumed to be independent windows; grid/focus/columns geometry and the public layout response remain unchanged.

## Packaging

**Native-first pilot guard:** npm run build:app is intentionally blocked
with PACKAGE_BLOCKED_NATIVE_FEASIBILITY. The former NSIS contract still
embeds VMware scripts and Guest Agent under the old application identity.
The guard prevents staging old guest binaries as a new native product.
No new, smaller installer has been built or verified. Desktop source
checks and experimental dev mode are separate from packaging.
A future package migration must preserve existing account-bearing data.

The legacy Tauri NSIS package includes the support CLI as the only host sidecar. Guest Agent is a guest payload and is packaged beside the guest preparation scripts under `guest/windows/`. `scripts/prepare-package-binaries.mjs` builds both binaries, stages the CLI as a target-specific sidecar, and stages Guest Agent as a package resource. Normal dev/check/test does not depend on package binary staging.

## Commands

```bash
npm ci
npm run dev:app
npm run typecheck
npm run verify:source
npm run build:app  # intentionally blocked during native feasibility
```


## Legacy first-run orchestration (unmounted)

The previous VMware manager used `DoctorReport.nextSetupAction` as the sole setup decision owner. Its old desktop mapped that machine action to one of four presentation owners:

```text
APP      → safe operation can run directly
USER     → Windows/VMware infrastructure step requires a person
CLIENTS  → continue in the client manager
BLOCKED  → stop and route to support
```

The desktop never infers the next setup state from health issues. User-owned steps always finish by refreshing backend truth; there is no UI-completed setup flag.

Base creation and Windows Sysprep remain guided user steps because the backend has no safe primitive that owns those actions yet. The UI must not pretend they are automated.

## Complete source checkpoint

From repository root, use `npm run verify:source` as the optional complete developer checkpoint. The root route includes the app's Svelte/Vitest/build/Tauri checks and the canonical backend crate's check, tests and rustfmt. App-local `verify:source` covers the desktop but does not replace the backend's own checks.

Prepare desktop dependencies from `apps/desktop/package-lock.json` with `npm --prefix apps/desktop ci`. The new repository root has no Bedrock analysis engine dependencies. Use the pinned Node/npm versions in toolchain.json, the
Rust toolchain used by the Virtual Clients backend workflow (including rustfmt),
and Windows desktop build prerequisites. See
[Development Operations](../../docs/system/development-operations.md).

This command does not build/install the distributable or start VMware/Minecraft.
Package and real-machine acceptance remain separate gates.
