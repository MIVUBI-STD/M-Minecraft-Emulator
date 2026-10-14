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

## Source acquisition now pinned in Git (2026-10-14)

The application repository now contains a Git **submodule pointer** to the authentic upstream Sandboxie v1.18.5 commit at `engine/isolation-upstream/Sandboxie`. The `.gitmodules` URL targets the public upstream repository, and a tested `bootstrap-fork.mjs --local-seed` path creates a **separate full-history checkout** for engine development after initializing the submodule. This removes the need to copy kernel source files into this app repository. The pointer is a real Git tree entry, not an installed runtime; the actual submodule bytes have not been downloaded into the current execution environment.

**Non-claims:** a Git submodule is not a published MIVUBI fork; an independent checkout is not a custom signed driver; a compiled driver is not the same as a working, independently authenticated Minecraft Education session. The active official Sandboxie launch behavior and account-bearing profile remain unchanged.

## First owned runtime payload layout — source only

A new private assembler combines the pinned upstream kernel driver, service, DLL, Win32 companions and required helpers into a coherent isolated directory, preserving original licensing and hashing copied bytes. This is deliberately marked `ARTIFACTS_STAGED_NOT_INSTALLABLE`. No actual Windows artifacts, driver installation, runtime selection or gameplay validation exists in this ChatGPT session; production signing and coexistence remain separate gates.

## Source-first owned candidate inspection (2026-10-14)

The desktop now includes `apps/desktop/src-tauri/src/engine/owned_isolation.rs`, a private, read-only Rust module validating the staged engine payload's complete required x64/Win32 driver, service, DLL, COM helpers, manifests and license files against SHA-256. It exposes `desktop_inspect_owned_engine_candidate` through an isolated Tauri command, strict TypeScript parser, and an explicit read-only candidate-selection control in Settings. The result **always** declares `providerSelected=false`, `driverLoadVerified=false`, `gameplayVerified=false`, and `installPermitted=false`. The official Sandboxie backend remains selected. The candidate inspection prepares the application's native source while Windows compilation/signing and actual activation are validated only later.

Source-first policy: continue implementing provider management and disposable-environment lifecycle source regardless of absent WDK, but retain actual compilation, signing, driver loading, login, concurrency and rollback as separate evidence gates. No work in this source batch is an installed or live custom engine.

## Windows service-name admission source (2026-10-14)

The pinned upstream kernel/service source still defines `SbieDrv`/`SbieSvc` service identities. This is not independent enough to coexist safely with the official installation. The app now includes a read-only Windows SCM namespace probe and a fail-closed capability decision: present names block, unknown states block, an empty namespace also blocks pending signed driver/service, IPC and disposable-host evidence. The result cannot enable the owned provider and cannot infer Microsoft account or gameplay readiness. This is a **source-first activation prerequisite**, not an installed new isolation engine.

## Disposable Windows deployment transaction — source-first (2026-10-14)

The standalone `tooling/isolation-source/provision-disposable.mjs` source now models a bounded provisioning transaction using the **actual upstream KmdUtil** service/driver semantics, including minifilter altitude `86900`. It requires a staged pinned v1.18.5 payload, the read-only host assessment showing both `SbieSvc` and `SbieDrv` absent, and a target declaration excluding account-bearing boxes and the official Sandboxie installation. It emits explicit operations for kernel/service installation, signature checks, readback/ABI acceptance and reverse-order rollback with receipt/path ownership requirements.

**No Windows mutation is possible from this module:** it only constructs a noninstallable transaction plan with `installationPermitted=false`; a self-reported target type is not proof of a disposable VM. No Tauri or UI command invokes it. Partial/ambiguous receipts stop for manual reconciliation rather than automatically stopping/deleting any service. An independently reviewed executor, Windows signing and actual ownership checks remain required before this plan can ever become actionable.

## Disposable Windows execution contract and audit journal (source-first)

`tooling/isolation-source/execute-disposable.mjs` now implements the **transaction sequencer and write-ahead ledger** that a future Windows driver/service transport will use. It records each intent as `UNKNOWN` before calling the supplied simulation adapter; crashes, timeouts, unexpected responses, retries and changed plan fingerprints fail closed. A new exclusive journal directory is created, receipts are committed through file fsync/atomic replacement, and recorded transactions are never automatically deleted. The current transport accepts only an in-memory simulation and cannot invoke KmdUtil, modify the host, or claim successful installation.

The companion `windows/probe-disposable-readiness.ps1` is a **read-only Windows adapter** for service-name observations and Authenticode status of the staged kernel/service/helper files. A detected virtualized model is explicitly a heuristic, not proof of disposal: `disposableEnvironmentVerified=false`, `installationPermitted=false`, and `windowsKernelDriverLoadVerified=false` are always returned. Host trust, identity, binary signing and kernel acceptance need a dedicated privileged executor and independent Windows tests before any actual system mutation. The existing Minecraft 02 provider remains official Sandboxie.

## Windows transport binding — source-only (2026-10-14)

The disposable provision plan can now be compiled into a pinned `KmdUtil` command contract instead of invoking an arbitrary command line. The compiler restricts the payload path, validates the exact upstream step order, pins binary SHA-256 references and retains rollback image-path/receipt requirements. A separate PowerShell probe reads signatures and the `SbieSvc`/`SbieDrv` SCM namespace without changing Windows.

The command transport currently **cannot install, start, stop or delete** a service: no trusted signed disposable-lab attestation certificate is pinned, and service ownership needs independent evidence before any mutation. The transport never becomes active through Tauri, and the official Sandboxie Client 02 launch stays unchanged. This separation enables continued source work without falsely treating self-reported receipts or Authenticode `Valid` alone as trust or safe driver deployment.

## Signed lab evidence and SCM ownership review (source-first)

`tooling/isolation-source/windows/attestation-gate.mjs` validates Ed25519-signed, short-lived lab evidence bound to the exact upstream SHA, transaction ID, nonce digest, host fingerprint, snapshot UUID, plan hash and journal hash. It does not trust public keys supplied inside the signed JSON, and the *production trust key remains blank*: only test fixtures can exercise positive verification using generated ephemeral keys.

`service-ownership.mjs` correlates that signed evidence with the matching Windows SCM service image/path, observed executable hash and a journal receipt that claims prior absence and a matching creation step. `probe-owned-service-image.ps1` performs read-only Windows queries without leaking the raw machine UUID. A positive correlation explicitly still returns `rollbackPermitted=false`, `installationPermitted=false`, and `windowsServiceOwnershipIndependentlyAttested=false`, because JSON/SCM correlation cannot establish safe ownership by itself.

The KmdUtil command compiler is now tightened: self-declared `ownerProofVerified=true` and `signedReceiptAttested=true` cannot generate STOP/DELETE descriptors while there is no pinned lab attestation public key. The PowerShell transport is still sealed in Apply mode, and the app never selects or installs an owned driver.

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
    ↓ implemented inspect + explicit launch IsolationBackend boundary (official adapter)
    ├─ OfficialSandboxieAdapter → installed signed official 1.18.5 tools (ACTIVE)
    └─ OwnedIsolationAdapter  → independently built/signed/tested fork (FUTURE)
           ↓ service/driver/DLL matched as one release
    ↓
Persistent per-client profile, Windows process and HWND
~~~

This is an internal implementation boundary, not a new Tauri public schema, network API, daemon or parallel lifecycle manager. One backend selected for an entire local runtime **installation context**, not per-client free switching between incompatible drivers. Windows driver/service namespace, system settings and reused box paths must be proven nonconflicting before any cutover.

### Implemented source checkpoint: Inspection Adapter v0.1

The first **source-only** Rust boundary is implemented in the active desktop owner `apps/desktop/src-tauri/src/engine/native_clients.rs`. It privately defines `IsolationBackend::inspect` and `OfficialSandboxieBackend` as the **sole** active implementation. Existing UI status inspection, fast launch preflight and signed-PID window inspection now route through that interface. The actual sandboxed launch remains the **unchanged** official Sandboxie request path and still performs a fresh backend-admitted inspection before requesting `Start.exe`.

The public Tauri/schema-6 `SandboxieClientObservation` is intentionally preserved. This is still an upstream-specific observation; vendor-neutral models, launch abstraction and the separate owned runtime remain future tasks. No new daemon, driver, user setting, account migration or box mutation is added. A fake inspection adapter exercises timeout/incomplete evidence and a zero-PID refusal; authored tests are **NOT_EXECUTED** until Rust/Windows tooling becomes available. This checkpoint does not establish crash recovery, independent deployment, or new gameplay acceptance.

### Implemented source checkpoint: Launch Dispatcher v0.2

The internal `IsolationBackend` now includes `request_launch(executable, licensed)` alongside `inspect(mode)`. `request_sandbox_client_02` is retained as the existing public Tauri entrypoint, but delegates through the **single active** `OfficialSandboxieBackend`. The official provider's Windows launch body is preserved byte-for-byte: executable and license admission, signed Microsoft product check, box membership, service/tool verification, launch lock, and `Start.exe` timeout/retry gap remain unchanged. A test double records forwarded arguments and asserts exactly one request on a timed-out launch.

This is an internal API boundary, **not** a second isolation engine, switched backend, new service, installed fork, or gameplay evidence. `Ok(())` from a launcher remains a *request acknowledgment only*. Public schema 6, app identity, native Client 01, and existing Client 02 profile are unchanged. The future owned provider cannot be activated until independent source/build/signing/Windows acceptance is demonstrated.

### Future full interface (design-only; not implemented)

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

**Next bounded task:** determine the upstream-history-preserving fork repository and reproducible unchanged build plan from pinned Sandboxie v1.18.5; include provenance and artifact-hash manifest before any driver changes. The installed official pilot and account-bearing profiles remain untouched.
