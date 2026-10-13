---
id: document.system.owned-isolation-design
class: DOCUMENT
domain: system
role: DESIGN
authority: WORKING
lifecycle: ACTIVE
---

# App-owned isolation design — decision and incremental implementation

**Selected direction (2026-10-14):** Personal educational/noncommercial isolation engine, integrated into Minecraft Instance Manager and eventually usable without installing official Sandboxie-Plus. The first implementation is Sandboxie-derived, not a clean-room substitute. Upstream source and license audit: [pinned inventory](../validation/owned-isolation-upstream-inventory.md).

## The two distinct independence goals

1. **Deployment independence (approved target):** our app can install, diagnose, manage and update an appropriately licensed and signed app-owned isolation backend without external SandMan/official Sandboxie installation. This still contains appropriately credited Sandboxie-derived GPL components.
2. **Source independence (NOT approved/NOT planned as first fork):** zero Sandboxie-derived code, independently designed isolation internals. Forking or renaming upstream does not achieve this. A later clean-room project would require its own security engineering and compatibility work.

## Baseline and scope

The active released-to-developer prototype remains `Client 01 → official native Minecraft Education` and `Client 02 → official Sandboxie 1.18.5 / MinecraftClient02`. Operator reports distinct licensed accounts, playable concurrent worlds, multiplayer, and account retention after reopen; boxed Client 02 later crashed idle, crash owner UNKNOWN. Reboot persistence, 30–60 minute complete profile and Client 03–04 acceptance remain NOT_EXECUTED. Never transfer passwords/tokens, modify Minecraft game binaries, copy per-account profiles or silently modify current box settings.

Core premise: **the app owns desired actions and observations, not Microsoft's authentication state or Minecraft gameplay.** Existing backend source remains authority; this design does not implement a new runtime.

## Control plane boundary, without a second state store

~~~text
Svelte CompactManagerApp
    ↓ typed frontend IPC (preserved)
Tauri native client commands (thin)
    ↓
Rust native_clients.rs (current single authority)
    ↓ proposed internal IsolationBackend boundary
    ├─ OfficialSandboxieAdapter → installed signed official 1.18.5 tools (ACTIVE)
    └─ OwnedIsolationAdapter  → independently built/signed/tested fork (FUTURE)
           ↓ service/driver/DLL matched as one release
    ↓
Persistent per-client profile, Windows process and HWND
~~~

This is an internal implementation boundary, not a new Tauri public schema, network API, daemon or parallel lifecycle manager. One backend selected for an entire local runtime **installation context**, not per-client free switching between incompatible drivers. Windows driver/service namespace, system settings and reused box paths must be proven nonconflicting before any cutover.

### Draft internal interface (design-only; no source implementation yet)

~~~rust
trait IsolationBackend {
    fn inspect_installation(&self) -> Result<InstallationObservation, IsolationError>;
    fn inspect_box(&self, box_id: &BoxId) -> Result<BoxObservation, IsolationError>;
    fn observe_processes(&self, box_id: &BoxId) -> Result<ProcessObservation, IsolationError>;
    fn request_launch(&self, request: LaunchRequest) -> Result<LaunchRequestReceipt, IsolationError>;
}
~~~

**Not** an API that declares success or queries Microsoft credentials:
- `InstallationObservation`: provider kind, signed artifact provenance, service/driver version, supported capabilities, completeness.
- `BoxObservation`: box existence, persistence, compatibility-profile provenance, unknown fields kept UNKNOWN, no account content.
- `ProcessObservation`: bounded PID + creation FILETIME + HWND, reliable box attribution, image signer and verified file identity for privileged window actions.
- `LaunchRequestReceipt`: launch request submitted; separate later observation required for process/window; login/gameplay verified by operator independently.
- `IsolationError`: bounded categories `UNSUPPORTED`, `INCOMPLETE_EVIDENCE`, `PRECONDITION_FAILED`, `TIMEOUT_UNKNOWN`, `INTERNAL_FAILURE`; a timeout MUST NOT trigger an automatic second launch.

Provisioning, config edits, driver deployment, stop/kill, recovery and migration are **not added to the initial read/launch interface**. They require explicit approval/confirmation, new safety design and respective tests; no silent destructive methods.

### Capability set rather than confusing product states

First cut capabilities: `inspectInstallation`, `inspectBox`, `processMembership`, `requestLaunch`, `focusVerifiedWindow`, `persistentBox`. Unsupported != failed, and a provider-proclaimed feature != validated Minecraft gameplay. Current public desktop schema/box identifier remain unchanged until a reviewed compatibility migration.

### Persistence and compatibility

- Each client box is independently named/identified and has persistent storage. `MinecraftClient02` is an **existing occupied production-test box**: never reuse, rename, reset, overwrite, import, or point a custom kernel/service at it during experimental fork development.
- Maintain explicit provenance: official box/data versus new fork's disposable box. Reversible settings apply only to newly created disposable profiles until migration is independently reviewed.
- No auto-delete/auto-remove; no shared credentials or token-copy flow; preserve COMPARTMENT/OpenCOM/DropAdminRights compatibility as observed baseline rather than default for arbitrary untrusted applications.
- App close must not kill existing game processes; manager startup is read-only until user requests operations.
- Never infer native Client 01 account or Minecraft readiness from an outside-box PID.

### Fail-closed transition/cutover

1. **Phase A / inventory:** pinned upstream projects, source/licenses/build graph and separation boundary. Documentation only.
2. **Phase B / application contract:** add internal Rust adapter with official implementation first; source-level mocks for unknown/no-PID, PID reuse, multiple candidates, launcher timeouts and box drift. Existing UI unchanged.
3. **Phase C / source fork baseline:** separate upstream-history-preserving repository; compile unchanged pinned x86/x64 required artifacts, reproduce native interfaces, compare hashes and actual behavior; no driver install on account-bearing host.
4. **Phase D / defect attribution:** capture redacted crash metadata during matched native-vs-boxed idle/foreground comparison. Preserve UNKNOWN if not determined. Do not patch kernel hooks by speculation.
5. **Phase E / controlled owned adapter:** in a disposable Windows test environment, demonstrate signed driver install/uninstall, broker sign-in, gameplay, multiplayer, persistence after reopen/reboot, resource profile and failure recovery. Valid artifacts/signatures/privileged service scope required.
6. **Phase F / independent deployment:** review legal obligations, Windows driver signing and separate installer identity; support dry-run preflight and approved rollback without deleting existing profiles. Only then allow official dependency removal from app install requirements.
7. **Phase G / optional scaling:** after two-client stability, extend to 03 then 04 with exact same evidence obligations per instance.

No claimed fixed timeline, percentage complete, or automatic upgrade. Later stages only promote on direct evidence.

### Stop conditions

Stop before modifying the host if: required source/license provenance UNKNOWN, driver/companion hashes mismatched, unsigned or untrusted privileged component, two competing kernel service versions, conflicting box roots, unclear account data ownership, active Minecraft in a profile to be migrated, unresolved driver uninstall recovery, failed/ambiguous process enumeration or Windows capability uncertainty. Never weaken process-signer checks or Microsoft account isolation to pass a test.

### Developer evidence package

Each meaningful implementation batch records exact product SHA, upstream SHA, changed module owner, Windows/compiler/WDK versions where applicable, artifact digests/signatures, exercised tests, results, unknowns, rollback method, and explicit `NOT_EXECUTED` for unavailable layers. REA may analyze **owned build artifacts only if helpful**; it is a developer tool and not a runtime dependency.

**First next coding task:** introduce only the internal read-only backend abstraction at `apps/desktop/src-tauri/src/engine/native_clients.rs` and wire the existing official adapter through it, with behavioral tests for malformed/UNKNOWN evidence and no change to UI or public Tauri interface. The future owned implementation comes later, after the unmodified upstream build and its signing prerequisites are established.
