# Current Development Handoff

## Client 02 Microsoft sign-in failure — 2026-10-14

- **Current acceptance outcome:** two process/window candidates were observed, but the user reports Client 02 sign-in fails after email submission and before password with tag `7q6ch`, HRESULT `0x80070424` (`ERROR_SERVICE_DOES_NOT_EXIST`). The same second account signs in successfully outside Sandboxie; Client 01 login and a playable world are operator-reported successful. Independent concurrent licensed gameplay is NOT ACCEPTED; multiplayer, persistence and sustained-use acceptance remain NOT_EXECUTED.
- **Read-only diagnosis:** host TokenBroker and Microsoft Account Sign-in Assistant are present/running; AAD BrokerPlugin is installed. Explicit boxed `sc.exe query` probes for TokenBroker and wlidsvc both returned exit 0 through signed Sandboxie Start.exe /wait. Therefore the HRESULT does not identify either service as absent; exact failing service/activation remains UNKNOWN. No raw authentication events, identifiers, screenshot, tokens or world contents were saved to Git.
- **Inference:** failure is localized to this account's authentication flow under Sandboxie 1.18.5, not a proven general account/license failure. Microsoft documents WAM as an OS-integrated broker; upstream Sandboxie issue [4681](https://github.com/sandboxie-plus/Sandboxie/issues/4681) describes another Microsoft login failure in a standard box and remains open, but is not proof of the identical Minecraft defect or a fix. Release [1.18.6](https://github.com/sandboxie-plus/Sandboxie/releases/tag/v1.18.6) does not document an Education/WAM authentication fix in its published notes.
- **Preserved boundary:** configuration, games, worlds and accounts were not reset; OpenCredentials/OpenProtectedStorage remain OFF. No broker re-registration, host token sharing, game patch, speculative template change or automatic upgrade was performed. Standard Sandboxie isolation is not a separate Windows account/session. No verified safe workaround has been established for this test.
- **Next:** identify the exact failed service/broker activation using a narrowly redacted diagnostic before proposing a compatibility change; do not scale to Client 03–04 or treat two windows as successful sign-in. Any approach that exposes host account state requires a separate isolation review.

## Desktop x64 installation admission — 2026-10-14

- **Latest executed milestone:** full Windows `DEV.cmd preflight` PASS at `588046b3e989e6c1aa4a0737a085600b25b2a098` (116 desktop tests, frontend build, Tauri/runtime checks, runtime tests and rustfmt; one symlink test skipped). Developer UI subsequently completed Check status, selected the installed signed EXE, applied the user's licence confirmation and requested Client 02 exactly once. Two responsive Education HWND/PID candidates were observed concurrently, one outside the selected box and one inside `MinecraftClient02`; the second Education loading screen rendered. No account or world acceptance is claimed.
- **Session recovery:** removing PSModulePath alone did not persist through developer startup; a temporary metadata-only diagnostic confirmed the app still inherited Codex runtime module paths. Explicitly setting the developer session's PSModulePath to the installed Windows PowerShell system/module directories resolved actual UI Check status. Temporary debug instrumentation was removed. Global module paths and credentials were unchanged.
- **Observed runtime:** user installed Sandboxie Plus 1.18.5 and official Microsoft-signed Education Desktop 1.26.3200.0 after manually removing Store Education. One responsive Education window is a candidate only; no sign-in/world proof. The explicitly requested new persistent `MinecraftClient02` box has verified enabled/empty membership and AutoDelete/AutoRemove/credential-bypass OFF. Existing DefaultBox and game data were preserved.
- **First wrong source owner:** native launch and Client 02 preflight read Registry32 only and rejected the official x64 install's known-folder-path Start AppID. One shared preflight now accepts exactly one valid registration across Registry32/Registry64 and either the existing simple ID or a constrained GUID-relative Win32 path. Native Explorer receives one quoted argument. Store conflicts, ambiguous registration, interactive session and Client 02 signed-image checks remain fail-closed.
- **Executed correction evidence:** actual shared PowerShell preflight passed against the x64 installation; 116 desktop Vitest tests and Tauri all-target Cargo check passed in the corrected working tree. Full correction-commit preflight remains pending until recorded separately. Regression covers GUID path, quotes/command text/traversal rejection, both registry views and shared launch consumers.
- **Check status diagnosis:** inherited Codex PowerShell 7 PSModulePath caused Windows PowerShell Security module type-data collision. Reproduced with the exact embedded stdin transport; the same transport succeeded with PSModulePath removed from that child environment. Correct only the developer session environment; no global settings or product module-loading bypass.
- **Prior exact-SHA evidence:** full Windows `DEV.cmd preflight` PASS and responsive Compact Manager startup at `a8f4aa1bd6c4a3f3bdcaf37e3b68cc839b58270b`; one symlink test skipped for absent privilege. Metadata remains in ignored workspace/runs. This evidence does not certify this later source correction.
- **Next:** operator manually signs into two distinct entitled accounts and opens a playable world in each existing game window. Independent accounts, playable worlds, multiplayer, restart persistence and sustained use remain NOT_EXECUTED. Keep both games and the developer UI open for this handoff; do not request another launch while boxed membership is occupied.

## Windows localtest resumed — 2026-10-14

- **Authorization:** user resumed localtest through two licensed playable sessions, native Client 01 plus persistent Sandboxie Client 02; sign-in and Windows restart remain manual. User reports both Education accounts and applicable Sandboxie licensing available.
- **Baseline:** clean Windows `Local` at `2a5552518179e9c8fe6a4b27fb09a19457ad0f9d`. `DEV.cmd preflight` executed and recorded FAIL at desktop Vitest before Rust/build completion. The metadata-only manifest remains in ignored workspace storage.
- **First wrong owner:** two stale assertions in `apps/desktop/test/compact-manager.test.ts`: optional-call text no longer matched guarded focus restoration, and an issue-object assertion required obsolete single-line formatting. Correct the assertions to require the current guarded fallback and tolerate object whitespace; product behavior is unchanged.
- **Executed evidence:** all 115 desktop Vitest tests passed on Windows with Node 24.21.0/npm 11.19.0 after this test correction in the working tree. This is not a committed-SHA full preflight or gameplay verdict.
- **Next:** run `DEV.cmd preflight` on the clean correction commit, then developer startup only after PASS. Minecraft/Sandboxie installation, two windows, account isolation, worlds, multiplayer and reboot persistence remain NOT_EXECUTED for the resumed test.
- This active resumption supersedes historical PAUSED localtest entries below; their prior evidence remains revision-scoped history.

## Pre-localtest operator-guide and ownership reconciliation — 2026-10-14

- **Scope:** source/docs-only correction for the approved native + Sandboxie two-client pilot. The mounted entry point is `apps/desktop/src/main.ts` → `CompactManagerApp.svelte`; sandbox inspection cannot authenticate Client 01.
- **Confirmed defects:** `docs/validation/native-pilot-localtest.md` still instructed obsolete UI actions and used `REFRESH STATUS`. `docs/system/implementation-map.md` named unmounted legacy VMware UI/overlay modules as though they owned active navigation.
- **Change:** align the existing Windows acceptance procedure to Check status → Set up/Browse/licence → Minecraft 01 Open → Minecraft 02 Open → Check status → actual account/world observations; correct active/legacy ownership labels. Extend the existing Compact Manager regression to cover the second operator document and active source map; no new verifier, provider, IPC or installer route.
- **Proof:** REMOTE_GITHUB exact-ref code/guide review and authored static/Vitest assertions; Vitest/Svelte/Rust/Windows/Sandboxie/Minecraft **NOT_EXECUTED** in this batch. No REA binary-analysis output claimed.
- **Next:** upon approved Windows resumption, run `DEV.cmd preflight` on the exact clean `Local` SHA, then `DEV.cmd dev` only if it passes.

## Native Sandboxie pre-localtest operator route alignment — 2026-10-14

- **Pre-localtest audit:** `Local` includes pinned `apps/desktop/src-tauri/Cargo.lock` and active Svelte `CompactManagerApp.svelte`. `tooling/windows-toolchain/dev.ps1` provides native `DEV.cmd preflight` (exact clean Local SHA, pinned toolchain, npm ci/source tests) and `DEV.cmd dev` (Tauri developer UI); native NSIS packaging is intentionally blocked by `PACKAGE_BLOCKED_NATIVE_FEASIBILITY`.
- **Confirmed documentation defect:** the active Sandboxie procedure still told operators to click obsolete `Launch isolated Client 02`, `Refresh both clients`, `Focus Client 02` and `Place Left/Right` controls. Current UI uses Check status, Set up, Open, Switch to and contextual Move window. The test sequence also missed the required initial Check status before a prepared Client 02 can be opened.
- **Fix:** align the single existing active Sandboxie pilot document with mounted control labels, exact-SHA native preflight, correct Check status → Set up/EXE/licence → Open → Check status flow and manual licensed gameplay evidence; do not alter frontend/backend or unblock legacy installer. Add one desktop source/guide regression.
- **Proof:** REMOTE_GITHUB exact-source/static route inspection only on the current new SHA; Node24/Vitest/Svelte/Cargo/Rust, Windows actual UI, Sandboxie Plus licensing/compatibility and Minecraft gameplay remain NOT_EXECUTED. No claim that UI/system is fully correct before preflight.
- **Next:** execute `DEV.cmd preflight` at the same committed Local SHA when native Windows testing is resumed, then only if it passes launch `DEV.cmd dev`.


## Focus/Move refusal guidance and stale-status regressions — 2026-10-14

- **Verified existing safety:** the active UI's Focus and Move error branches already invalidate the last Client 02 PID/HWND observation, mark any previous inspection as historical, preserve the affected instance's error for View issue, and release the busy guard. Explicit Check status remains the recovery route; no poller or automatic retry is needed.
- **Concrete UX mismatch:** all Move failures were described as requiring a window restore, while Rust may instead refuse stale process identity, changed Sandboxie membership or untrusted signed-image evidence. Error guidance now says to Check status first, and conditionally restore Minecraft if maximized/minimized.
- **Verification:** six source-extracted Focus/Move IPC-mock scenarios executed in V8 at parent HEAD `495f25b783d9` and passed; targeted Vitest source-contract regression authored. Run the same mock check on the committed SHA before asserting its outcome. Node24/Vitest/Svelte/Cargo/Windows/Minecraft remain NOT_EXECUTED; Windows localtest PAUSED.
- **Next:** stop this bounded failure-path change after exact-head source review; actual full toolchain and Windows gameplay remain a separate proof boundary.


## Fresh Focus/Place uniqueness after a process changes — 2026-10-14

- **Confirmed mismatch:** the active frontend `focusCandidate` requires exactly one isolated game candidate, but Rust `verify_fresh_focus_target` previously accepted any matching target among a *newly larger* boxed-candidate set. A second boxed game process appearing between Check status and Focus/Place was not rejected, even though the original PID/FILETIME/HWND was still live.
- **Fix:** require the newly collected Rust snapshot to have exactly one isolated candidate and one visible isolated candidate, on top of its existing interactive session, verified membership, signed image and process/window ownership checks. Both Focus and Place use the same Rust owner. A native outside-box candidate remains allowed.
- **Regression coverage:** extend the existing Rust fixture with a late second boxed candidate without a window, then with a visible window, and a separate outside-box native candidate; parse every constructed snapshot to keep test evidence internally consistent. Add an accompanying source-contract assertion to the native bridge tests.
- **Proof ceiling:** REMOTE_GITHUB exact-source inspection and test source authored. Cargo/Rust, Vitest/Svelte, real Windows/Sandboxie, licensed Minecraft sign-in and multiplayer remain NOT_EXECUTED. Windows localtest remains PAUSED.
- **Next:** review committed source and verify structural contracts; do not claim hardware or four-client acceptance.


## Pending executable selection projection — 2026-10-14

- **Verified UI inconsistency:** while `busy === "select"`, Client 02 `rowPresentation` could still project `Ready to open` and an `open` action based on the previous executable/licence state. The mounted button was globally disabled by `Boolean(busy)`, so the issue was misleading presentation rather than bypass of the launch admission guard.
- **Change:** one narrowly scoped branch in existing `compactManager.ts`: for Client 02 only, show `Selecting…` with null action and null move eligibility during the file dialog. Existing source tests now cover old-path READY → picker pending → different-file unlicensed Setup required → licensed READY, no observation, and an ambiguous launch issue.
- **Backend audit:** `native_clients.rs` validates the selected executable basename/path, file existence, official Windows Desktop registry/registered Start app, signed product identity and current Sandboxie box state on launch. No new manager, filesystem mutation, Tauri command or account automation required.
- **Proof:** exact source inspection and targeted regression authored, with optional V8 direct projection tests if actually executed; Node24/Vitest/Svelte/Rust/Windows/Minecraft test execution remains NOT_EXECUTED and localtest PAUSED.
- **Next:** stop here for this source owner unless another concrete source-contract defect is found; do not claim G0 or game-session success.


## Executable-picker error provenance — 2026-10-14

- **Source finding:** successful `selectMinecraft()` kept its earlier file-picker error visible. Cancel already preserved it appropriately; launch/inspection failure must also be preserved when a file is selected.
- **Correction:** optional `UiIssue.origin = "executable-picker"` set solely by file-picker catch; pure `shouldClearPickerIssue` predicate clears only that error after a non-empty picker selection. No free-form Rust error classification or backend changes. Selecting a different path still resets the existing licence confirmation.
- **Proof:** exact GitHub source review, authored Vitest/static regressions, bounded V8 predicate checks. Full Node24/Vitest/Svelte/Rust/Windows/Minecraft execution remains NOT_EXECUTED and localtest PAUSED.
- **Next:** inspect committed source and optional V8 mocked-picker behavior, then stop; no imaginary G0 PASS.


## Inline Move navigation revision hardening — 2026-10-14

- **Confirmed first wrong owner:** `apps/desktop/src/CompactManagerApp.svelte`. The inline Client 02 `Move window` control wrote `detailMode = "move"` directly, without increasing the UI navigation revision that protects against late IPC responses. A pending Focus request could later reject and hijack the newly selected panel, because it still matched the old revision.
- **Patch:** route that one Move detail action through a guarded component function that checks Client 02 panel eligibility, increments `navigationRevision`, and changes the mode. No new state machine, dependency, IPC, runtime process, or provider is introduced. Add a focused source regression.
- **Proof:** REMOTE_GITHUB exact-source review and regression assertion authored; separately identify any V8 mock execution if performed. Node24/Vitest/Svelte/Rust/Windows/Minecraft acceptance is still NOT_EXECUTED, and localtest remains PAUSED.
- **Next:** only further source-proven state/action defects, or exact-SHA compiled checks when supported execution becomes available.


## Cross-client expanded detail isolation — 2026-10-14

- **Source finding:** isolated Check status could close a native Client 01 issue panel because it checked only shared `detailMode`. An incoming issue could also auto-replace the other client's currently open panel.
- **Fix:** Client 02 inspector only closes an expanded Client 02 issue; error auto-open requires an empty panel or the same instance. Both client errors remain accessible via their own View issue controls.
- **Proof:** GitHub exact-source/consumer checks and regression assertions authored; no Node24/Vitest/Svelte/Windows/Minecraft execution. Windows localtest remains PAUSED.
- **Next:** verify source-level cross-client scenarios; avoid unsupported source execution claims.


## Independent Client 01/02 UI feedback — 2026-10-14

- **Source defect:** a single `issue`/`notice` value was shared between both rows. Client 02-only Check status erased Client 01's unresolved native launch feedback, while native Open erased Client 02's error/notice. The Client 02 inspection also projected a misleading Checking status onto native Client 01.
- **Fix:** retain one global in-flight operation guard, with independent temporary feedback keyed by Client 01/02 in the mounted Svelte shell. All relevant actions clear/update only their own instance. The Client 02 Check status displays Checking only on Client 02.
- **Proof:** REMOTE_GITHUB exact-source review and targeted regression assertions authored. Full Node24/Vitest/Svelte/Tauri/Rust/Windows/Minecraft remains NOT_EXECUTED; Windows localtest is paused.
- **Next:** verify available feedback scenarios without a real Minecraft host; no new provider or Client 03–04 features.


## Asynchronous UI outcome versus newer navigation — 2026-10-13

- **Confirmed source race:** UI navigation/detail controls remain usable while IPC operations are pending. Client 02 Open/Move success unconditionally called `closeDetails()`, which could collapse a different panel opened after the request. Error callbacks unconditionally chose the issue panel, replacing newer Settings/contextual navigation. A cancelled executable picker cleared the previous issue even without a successful selection or renewed inspection.
- **Fix:** one ephemeral `navigationRevision` inside the existing Compact Manager shell; capture it when each IPC request begins. Preserve real operation notice/issue while guarding late panel close/auto-expand and post-picker detail changes against subsequent user navigation. Do not clear unresolved issues when file selection is canceled.
- **Proof:** REMOTE_GITHUB exact source/consumer contract review and regression assertions authored. No Node24/Vitest/Svelte/Tauri/Windows/Minecraft execution; Windows localtest remains PAUSED. No engine, Sandboxie, account or installer modification.
- **Next:** continue only narrowly reproducible source-level issues; use a genuine runtime environment for full source/game acceptance when it becomes available.


## Compact Manager issue/detail panel precedence — 2026-10-13

- **Confirmed source issue:** Client 02 template selected its issue branch whenever `issue?.instance === "02"`, overriding explicit `detailMode = "setup"` or `"info"` from the supported UI navigation while a previous error persisted.
- **Fix:** render the issue branch only when `detailMode === "issue"`. Keep issue state intact for the existing `View issue` action; preserve existing backend admission and ambiguity/UNKNOWN semantics. Regression assertions cover setup/move branches and the action returning to issue details.
- **Proof:** REMOTE_GITHUB source branch review and authored regressions. Node24/Vitest/Svelte/Tauri/Windows/Minecraft execution on the new exact HEAD remains **NOT_EXECUTED**, with Windows localtest paused.
- **Next:** only additional concrete source defects may be fixed without local runtime; do not promote source-only proof into gameplay acceptance.


## Compact Manager Settings navigation focus correction — 2026-10-13

- **Source finding:** the active Svelte Settings navigation used direct `page = ...` mutations without transferring keyboard focus after the clicked button unmounted. The existing `closeDetails` could attempt focus on an unmounted Check status button after an in-flight operation finished while Settings was open.
- **Fix:** keep navigation in the one active UI component. After Svelte's `tick()`, focus the mounted Settings Back button, Instances Check status button, or contextual Client 02 region. Asynchronous detail close checks that the Instances page still exists and no other panel has opened. Deferred navigation focus also checks the destination page and connected target before focusing; no auto-polling or backend behavior changed.
- **Proof:** GitHub exact-head source/contract inspection and regression assertions authored. Svelte/Vitest/Windows keyboard and screen-reader execution remains **NOT_EXECUTED**; Minecraft localtest still paused.
- **Next:** resume only available source-level changes supported by concrete findings; exact-head Svelte/Windows validation awaits a genuinely available execution context.


## Compact Manager advanced-error privacy hardening — 2026-10-13

- **Reproduced source defect:** `safeErrorDetails` redacted backslash-form Windows home paths but exposed names in forward-slash `C:/Users/...` or `/Users/...` paths and did not redact `Authorization: Bearer <value>`.
- **Repair:** keep the single existing presentation helper; redact Windows/Mac home directory prefixes, bearer credentials, quoted/unquoted credential assignments and email values; preserve the 450-character display limit. No backend IPC, account or filesystem operations changed.
- **Proof:** exact-HEAD GitHub source inspection plus eight executable V8 redaction probes (not Vitest or Node24).
- **Unresolved:** full source verification on compatible toolchain, Windows UI/accessibility and real Minecraft accounts/gameplay NOT_EXECUTED. Windows localtest remains paused.
- **Next:** run `npm run verify:source` on exact HEAD only when supported execution is available.


## Exact-source verification route correction — 2026-10-13

- **First wrong owner:** `apps/desktop/test/verification-routing.test.ts` expected the previous aggregate `verify:source` sequence and omitted the newly installed `test:native-performance` step. This was a deterministic source/test contradiction, not a Windows/Minecraft issue.
- **Repair:** align the exact expected route with `package.json`, require the performance reviewer/sampler at the existing repository verifier, and reject internally contradictory identity loss/reappearance in the performance evaluator plus a targeted regression test.
- **Proof:** source contracts inspected on GitHub and the evaluator's authored JS tests executed in a V8 adapter (Node test imports shimmed). Node 24, Vitest/Svelte and Cargo/Rust source suites on the new exact HEAD remain **NOT_EXECUTED**, since no matching toolchain is available; no Windows localtest was resumed.
- **Next:** once a supported source-execution environment exists, run the unchanged `npm run verify:source` route at a pinned HEAD, then perform the withheld Windows/gameplay campaign separately.


## Mac/Android architecture hypothesis and REA evidence plan — 2026-10-13

- **Research owner:** `experiments/minecraft-education-platform-research.md`; not a provider, engine, additional product gate or acceptance database.
- **Established externally:** Minecraft Education macOS uses an official Apple application installation route; Android is separately supported. Package type does not prove shared/different game engine, nor that macOS is a modified APK.
- **Unavailable proof:** no authorized official Mac/Android artifacts, REA native analysis provider, or runtime captures in this session. REA binary/package investigation remains NOT_EXECUTED, with no invented Evidence IDs.
- **Decision:** retain selected Windows native + Sandboxie two-client experiment; use PresentMon/ETW and independent licensed gameplay acceptance before considering any platform/architecture migration.
- **Next:** source changes are complete for this bounded research topic; defer platform internals until real artifacts and authorized host evidence exist.

## Offline native process-performance report interpretation — 2026-10-13

- **Scope:** reuse the existing Node evidence-evaluator pattern; read the JSON produced by the native process sampler.
- **Behavior:** reject foreign schemas, extra fields (including PID/account data), false PASS, invalid/missing measurements and contradictory sample counts; aggregate observed CPU/working set with nullable unknowns, never assert gameplay or performance success.
- **Verification:** Node tests authored and wired into the existing source verification command; executable Node and PowerShell checks on the new exact HEAD are **NOT_EXECUTED** in this GitHub-only session.
- **Next:** only actual Windows/PresentMon and interactive Minecraft observations can close the two-client performance and account-separation unknowns.

## Remote-only native performance evidence preparation — 2026-10-13

- **Scope:** add one opt-in read-only PowerShell sampler under the existing Windows acceptance owner, document its limits and its connection to the current two-client pilot.
- **Mechanism:** caller supplies two existing distinct PIDs; capture bounded elapsed time, CPU share and process working set; pin process creation identities, mark missing/reused PIDs UNKNOWN; write local-only JSON without PID/account/world data; provide no automatic performance/gameplay verdict.
- **Proof:** REMOTE_GITHUB source and static contract inspection only. No Windows process, PowerShell runner, PresentMon, game rendering, account isolation, stress benchmark, or installer was executed.
- **Next:** run one real two-client acceptance and 60-minute process/frame-time capture only after runtime access is available and explicitly resumed; do not reinterpret process telemetry as gameplay readiness.

## Remote-only UI hardening — 2026-10-13

- **Scope:** one active Compact Manager Svelte owner, its source-contract tests, and existing product specification.
- **Change:** correct View issue so a repeat click does not close the error; add Escape dismissal, keyboard focus restoration to a surviving disclosure origin (fallback to Check status), and semantic region/expanded relations. A successful Open/Move request can remove its inline panel without stranding keyboard focus.
- **Proof:** REMOTE_GITHUB exact-source review and authored source-contract assertions; Node/Svelte/Rust, actual Windows keyboard/screen-reader behavior, game account isolation and gameplay remain **NOT_EXECUTED** on this new HEAD.
- **Next while localtest is unavailable:** preserve manual validation requirements; investigate only source-provable performance/evidence tooling, without running Windows or changing sandbox/VM/account state.


**Repository/branch:** `MIVUBI-STD/M-Minecraft-Emulator` / `Local` only.
**Current work:** `emulator/pre-local-cleanup`; **PAUSED at user request on 2026-10-13**. User will continue repository discussion in ChatGPT; do not resume local runtime tests without explicit instruction.
**Execution ceiling:** Windows source preflight **PASS** at `e6e9ad22625cf0c5928ee6cf5ee6efb2e503e598`; developer binary/window observed; Refresh confirmation observed in user-supplied screenshot. Sandboxie membership, account isolation, Minecraft gameplay, package and four-client acceptance remain **NOT_EXECUTED / UNKNOWN**. Later documentation commits do not inherit exact-HEAD execution PASS.

## Compact Manager frontend implementation — 2026-10-13

- **Scope:** frontend source only. New mounted `CompactManagerApp.svelte`, `app/presentation/compactManager.ts`, compact `app.css`, direct source-mount and state-projection regression tests.
- **Active UI:** English-only Instances and Settings, no sidebar; single on-demand Check status; conditional Open, Set up, Switch to and Client 02 Left/Right; inline issue details. The old feasibility Svelte remains unmounted, and the legacy VMware app remains unmounted.
- **Safety:** existing native typed IPC and Rust backend untouched. Client 01 native window identity is NOT proven; Client 02 eligibility still requires fresh Rust preflight; operation success is only request acceptance. No auto-polling, auto-retry, automated sign-in, Stop, restart, tray, Start All or virtual client 03/04.
- **Verification status:** pending execution on this exact commit; source edits, tests written and commit are NOT proof of compiled or Windows gameplay behavior. Windows localtest remains PAUSED at user request.
- **Next:** run desktop source checks and actual Windows visual/keyboard/manual acceptance when explicitly approved; preserve package guard and legacy assets.

## Compact Manager consolidated design baseline — 2026-10-13

- **Decision:** UX design frozen for the current two-client UI; no runtime implementation or local Windows tests resumed.
- **SOLE ACTIVE UI DESIGN AUTHORITY:** [Compact Manager Implementation Specification](../docs/product/compact-manager-implementation.md). It supersedes the earlier UX and screen drafts (historical only), including Indonesian labels, sidebar, a separate Window Layout screen, side drawers, unsupported buttons and stale mock states.
- **English-only, no sidebar:** native title bar; Instances (home) + Settings; one Check status; compact flat list; instance-specific inline setup/issue/window-placement; advanced diagnostics collapsed.
- **Truthfulness:** request ≠ observed window ≠ independent licensed playable session. Client 01 supports official app Open only; Client 02 supports conditional isolated Open, validated Switch to and Left/Right placement. No 03/04, Stop, Start All, native Focus or global Arrange until backend exists and is proven.
- **Design versus implementation:** source currently still mounts `NativeFeasibilityApp.svelte`; the canonical specification is a future implementation contract, not proof of new Svelte components, package success or gameplay. Preserve exact current Rust/IPC security logic and legacy compatibility.
- **Next design-approved task:** implement the complete UI refactor in reviewed phases from the sole specification, then source/UI verification. Real Windows localtest stays **PAUSED** pending explicit user instruction.

## Compact Manager clean UI revision v2 — 2026-10-13

- **User requirement:** concise, clear, familiar wording and clean everyday application; no tester/developer dashboard on the user-facing home.
- **Latest design source:** `docs/product/compact-manager-screen-design.md`, section `Design revision v2 — concise Indonesian-first UI` (supersedes conflicting earlier visual/copy recommendations).
- **Standalone design artifact:** `compact-manager-clean-v2.html` with browser screenshots, delivered in the ChatGPT conversation; NOT a production Tauri build or GitHub app.
- **Design labels:** Minecraft / Tata Jendela / Pengaturan / Bantuan. Primary actions Buka / Periksa / Siapkan / Tampilkan. No duplicate headings, counters, technical instructions or future-instance roadmap cards on home.
- **Actual browser checks:** prototype JavaScript interactions and screenshots at 1180×760 and current 920×620 Tauri minimum, no horizontal overflow or page JS errors. This does NOT prove native IPC, Windows behavior or Minecraft sessions.
- **Next:** review visual/copy, then implement one Svelte shell and safe capability projection; local Windows/runtime test stays PAUSED until separately approved.

## Compact Manager UI design continuation — 2026-10-13

- **Work type:** design-only; no Tauri/Svelte/Rust UI implementation, no local Windows testing resumed.
- **Product decision:** everyday **Compact Manager**, **not** a testing dashboard. Three main destinations: Instances, Window Layout, Settings; contextual Help & Diagnostics; no Local Test navigation.
- **Design contracts:** [Compact Manager UX Specification](../docs/product/compact-manager-ux-spec.md) and [Clean Compact Screen Design](../docs/product/compact-manager-screen-design.md). Both are `DRAFT`, not running code or validation evidence.
- **Visual proof:** an offline standalone HTML/CSS/JS clickable prototype and browser-rendered screen captures were produced in the design conversation; no Tauri IPC, game process or sandbox interaction. The repository holds canonical UX decisions; the standalone prototype was delivered as a conversation artifact, not installed into the product.
- **Reviewed screens:** Instances rows and UNKNOWN-safe primary actions, contextual per-instance details, 3-step isolated setup, Client 02 Left/Right placement preview, grouped Settings, Help/Error states. Existing Tauri minimum window is 920×620, default 1180×760; design review must respect those dimensions.
- **Executed checks:** offline browser prototype smoke interactions only; do **not** interpret as actual app/build source verification or Minecraft success.
- **Next approved discussion:** visual review and refine wording, density, accessibility, future language choices; after design approval implement frontend in batches with one active app shell while preserving native security/IPC boundaries. Localtest remains **PAUSED** unless the user explicitly resumes it.

## Paused localtest report — 2026-10-13

- **Tested source:** GitHub `Local` / `e6e9ad22625cf0c5928ee6cf5ee6efb2e503e598`.
- **Environment observed:** Windows x64 (build 26100), PowerShell 7.6.5,
  Node 24.21.0, npm 11.19.0, Rust 1.98.1 MSVC with rustfmt; MSVC Build Tools
  and WebView2 found. Node and npm prefix were isolated to the test session;
  existing global installations were preserved.
- **Executed source result:** `DEV.cmd preflight` PASS, 2026-10-13
  07:19:35–07:19:51 UTC. Repository checks, evaluator tests, all 85 desktop
  Vitest tests, Svelte/TypeScript, frontend build, Tauri and runtime checks/tests,
  runtime rustfmt check completed. One local-test symlink test skipped because
  Windows symlink privilege was unavailable; existing compiler/CSS warnings remain.
- **Executed startup result:** `DEV.cmd dev` compiled and launched
  `Minecraft Instance Manager`; Windows reported a responsive window.
  Prior Vite EBUSY on a locked Rust PDB did not reproduce after excluding
  `src-tauri/target` from its watcher.
- **Operator evidence:** user clicked Refresh and supplied a cropped screenshot
  showing “Process observations refreshed. No accounts or worlds were inspected.”
  This confirms the visible Refresh completion message only. The screenshot
  did not include Client 02/Sandboxie readiness, membership or process results.
- **Remaining unknowns:** no Minecraft Education Desktop or Sandboxie installation
  was found in the limited installed-program/service inspection. This is not an
  exhaustive absence verdict. Two distinct licensed sessions, playable worlds,
  multiplayer, restart persistence and four-client usability are untested.
- **Local evidence:** metadata-only PASS manifest is retained in ignored
  `workspace/runs/20261013T071935Z-e6e9ad22-preflight-99ec7528/manifest.json`;
  startup observations are adjacent. Raw logs, screenshot and machine/account
  data are not uploaded to Git. Earlier FAIL manifests remain local.
- **Pause action:** the development process started by this session was stopped;
  no game, sandbox, account data or VM was changed by the pause.
- **ChatGPT continuation:** read this handoff and exact current `Local` source.
  Repository discussion may continue, but localtest remains PAUSED. After an
  explicit resume, inspect the full Client 02/Sandboxie readiness panel before
  proceeding with the existing two-client manual procedure. Do not repeat source
  checks merely to manufacture progress, or promote source/window proof into gameplay.

## Historical preflight corrections (2026-10-13; superseded by report above)

Exact Windows source preflight passed at
`070323474d0b7a4b9dd0a4966cd6750707f09601` (one symlink test skipped for
missing Windows privilege). Developer startup then failed when Vite watched
a locked Rust build PDB under `src-tauri/target`. The Vite watcher now ignores
that generated output tree; frontend source watching remains active.
Next: clean-commit preflight and developer startup on this correction.
Minecraft, Sandboxie and interactive UI acceptance remain NOT_EXECUTED.

The subsequent exact-SHA Windows preflight at
`83e1a978c3d9d920bf4331a5d1a75537f9f77fd6` passed desktop and runtime
checks/tests and frontend build, then failed at runtime `cargo fmt --check`.
Applied Rust 1.98.1 rustfmt to the two reported runtime files (`command.rs`
and `provider/process.rs`); only formatter layout and trailing commas changed.
Next: execute clean-commit `DEV.cmd preflight` on the formatting correction.

Actual Windows preflight at `9da075fd6b89d9c5ca8dac0b6461a366913c0998`
failed in desktop Vitest because the collector stdin guard searched the entire
native engine, including the separate launch script. The guard now checks only
`inspect_sandbox_client_02_mode`, including its stdin runner, payload and bootstrap.
All 85 desktop tests passed on Windows with Node 24.21.0 / npm 11.19.0 after
the correction. npm uses a session-only prefix; global tools were not replaced.
The prior ignored preflight manifest records FAIL, not PASS. Full clean-commit
preflight, Rust/Tauri builds, UI and Minecraft remain unproven for this correction.
Next: run `DEV.cmd preflight` on the committed corrected Local revision.

## Selected product scope

- **Goal:** four independent, licensed, concurrently playable Windows Minecraft Education clients on one PC.
- **Only active experiment:** official native Client 01 + a manually requested Client 02 in one persistent Sandboxie Plus box named `MinecraftClient02`. Client 03–04 and the eventual four-client provider choice are unproven and **not implemented** here.
- **Never automate:** Microsoft account credentials/tokens, sandbox deletion, guest disk reset, launching another client after an ambiguous result, runtime polling, or VMware guest mutation.
- **Legacy preserved:** old VMware/Fusion/App Sandbox/Guest Agent and installed NSIS identifier/data contracts are inactive; packaging the native UI using old VMware resources is deliberately blocked. Inactive Tauri VMware IPC/setup/layout module declarations are excluded from native desktop compilation while source remains in Git.

## Canonical first owners

| Responsibility | Source |
| --- | --- |
| Active UI / manual actions | `apps/desktop/src/NativeFeasibilityApp.svelte` |
| Native commands, launch checks and Windows HWND actions | `apps/desktop/src-tauri/src/engine/native_clients.rs` |
| Typed IPC validation | `apps/desktop/src/app/bridge/nativeFeasibilityApi.ts` |
| Read-only Sandboxie inspection, credential-setting flags and PID evidence | `tooling/acceptance/windows/collect-sandboxie-feasibility.ps1` |
| Shared subprocess runner and I/O worker lifetime | `engine/runtime-core/src/provider/process.rs` |
| Existing product proof boundaries and local operator path | `docs/validation/native-pilot-localtest.md` and `docs/validation/sandboxie-two-client-feasibility.md` |
| Legacy removals and compatibility | `docs/system/legacy-retirement.md` |
| Product/package version and manual source verification | `package.json`, `toolchain.json`, `tooling/windows-toolchain/dev.ps1` |

Use [implementation ownership](../docs/system/implementation-map.md) for older VM-related routes.

## Current source-hardening state

- Launch is explicit, serialized inside the app and re-inspects selected Sandboxie box membership; `UNKNOWN` fails closed. Signed image / PID / FILETIME / HWND values remain **candidate evidence**, never proof of session, account or Minecraft rendering.
- Collector reconciles full boxed PID enumeration (including helper processes), refuses incomplete/foreign-session or unstable snapshots, and bounds stdout. Vendor SbieDll fallback remains short-lived and version/ABI unproven.
- Native backend calls Windows PowerShell from an absolute system directory, rather than searching PATH; native candidate enumeration no longer converts failed discovery to zero candidates.
- Shared helper runner bounds stdin, output (64 KiB per stream), worker reservations (24 maximum), timeouts and direct-child cleanup; oversized output stops further reads, and failed thread creation returns an error rather than panicking.
- **Unresolved:** short-output descendants can retain inherited stdout/stderr handles, leaving a previously blocked reader alive. Cooperative overflow checks do not interrupt a kernel-level blocked read. No claim of complete worker reclamation without an executable inherited-handle reproducer.

The historical source-hardening history, evidence qualifications and per-batch details are retained in [pre-compaction development handoff](https://github.com/MIVUBI-STD/M-Minecraft-Emulator/blob/38aafe6817814b3f25e202d6ff8140d8be5b595f/planning/development.md) and the [REA-aligned baseline](../docs/validation/rea-source-audit-2026-10-13.md). Treat those as pinned history, **not** the present HEAD acceptance verdict.

## Local-test verifier and compiled desktop cleanup (2026-10-13)

Found a real test-contract mismatch: `apps/desktop/test/verification-routing.test.ts`
still expected the old `verify:source` command list after `test:localtest` was
added. Corrected the expected route so a source check no longer fails solely
because the test itself is stale. Hardened the single local-test recorder with
exclusive finalization, source-folder identity checks and adversarial
regressions. The screen-overlay implementation remains preserved as source,
but has been removed from the native pilot's compile graph since no active
command invoked it. No VM, guest or account data was touched.

The six focused recorder tests were executed and passed with Node 22.16.0
in an isolated Linux copy of the affected module. Exact repository HEAD,
Windows PowerShell, Node 24, Tauri/Rust compilation, Minecraft and Sandboxie
remain NOT_EXECUTED. Continue on source evidence only until target verification.

## Local-test recording and application ownership (2026-10-13)

`tooling/local-test/session.mjs` now provides one metadata-only
exact-SHA source-preflight record under ignored `workspace/runs/` after
validating the pinned Windows toolchain. `DEV.cmd preflight` finalizes
the attempted source check as PASS/FAIL without raw terminal logs.
The source verifier requires the recorder regressions and launcher wiring.
The active UI root diagnostic was renamed for clarity; no other native
process or IPC behavior was intentionally changed. Pure Node recorder
tests passed in a separate analysis environment. Pinned Windows PowerShell,
Tauri, Sandboxie and Minecraft execution remain NOT_EXECUTED.

## Local test storage governance (source policy, not runtime proof)

The canonical [Artifact and Local-Test Storage Policy](../docs/system/artifact-storage.md) now classifies downloaded prerequisites, package candidates, compiler output and per-session evidence. `workspace/` is Git-ignored except its README; the existing verifier enforces that boundary. Build output and historical runtime/evidence paths were **not moved or deleted**, and the native pilot's old NSIS release hold remains intact. This is a source-policy update: node/Rust/Windows/installer/Minecraft/REA execution is **NOT_EXECUTED**.

## Pre-local-test cleanup decision

The single current developer entrypoint is **`DEV.cmd preflight`**, which reuses existing clean-`Local` checkout and pinned toolchain checks, runs locked dependency setup and root source verification, then rechecks exact HEAD. The old VMware G0–G4 campaign is historical and must not be confused with this native source preflight. No installer, game, VM or account data is accessed. Fail on the first real error and preserve its command/log; do not weaken checks to report PASS. Manual gameplay starts separately with `DEV.cmd dev` only after preflight passes.

Inactive Tauri VMware command and layout modules were excluded from the active desktop Rust module tree after checking there were no native callers. No speculative deletion of their source, existing account-bearing data, or legacy runtime-core/provider code is authorized: those remain connected to backward compatibility and installed-data safety policy. Removing it requires a proven two-client direction, dependency inventory and a reversible migration decision. Source-only dead-code scans are suggestions, not proof of safe deletion.

## Material unresolved risks (priority order)

1. **Source verification:** Windows `DEV.cmd preflight` passed at `e6e9ad22625cf0c5928ee6cf5ee6efb2e503e598`; later source revisions require their own evidence when execution is resumed. This does not establish gameplay or installer compatibility.
2. **P0 — two authenticated clients:** Windows Desktop and Sandboxie must really create two independently signed-in licensed sessions with distinct playable worlds and stable input/rendering. Sandboxie `OpenCredentials=OFF` does not prove Microsoft WAM isolation.
3. **P1 — helper/process behavior:** inherited pipe handles, out-of-band game starts and PID/window churn remain runtime races. Never infer successful gameplay from helper exit status.
4. **P1 — vendor/environment compatibility:** Sandboxie Start.exe/SbieIni.exe/SbieDll versions/metadata, custom Minecraft APPDIR, localized Start Menu names, Windows signed-file inspection and focus restrictions have no runtime proof.
5. **P1 — resource and persistence evidence:** no reproducible 60-minute CPU/RAM/GPU/VRAM profile, restart persistence, cross-account test or multiplayer evidence on target hardware.
6. **P1 — release path:** an isolated native prototype installer, package manifest, coexistence, upgrades and uninstall preservation are not approved; the old VMware NSIS release hold remains.
7. **P2 — legacy reduction:** after feasibility, measure dependency graph and trace reachability; retire legacy files in reviewable, reversible commits without deleting VMs/worlds or installed identity.

## Historical first-session preparation (superseded by report above)

The native `DEV.cmd preflight` now shows four stages, checks Windows 10/11 x64 explicitly before running external source tasks, and prints one next developer-mode command. The localtest guide provides official prerequisite links, a clean-`Local` clone path, a short staged smoke test, and a minimal redacted first-error report. These changes are source-authored and are **not** proof of successful Windows compilation or two licensed Minecraft sessions.

## Stop rule and next action

**PAUSED by user.** Source preflight and developer startup are recorded above for
their exact tested SHA. Do not resume runtime testing automatically from any
historical Next entry. Once explicitly resumed, obtain the complete Client 02
readiness observation and follow the [two-client manual procedure](../docs/validation/native-pilot-localtest.md).
Do not run `DEV.cmd g0` or `npm run package:windows` for this pilot.

The present branch remains `Local`; never change `main`, workflow activation, installed app identifiers, guest data, or public IPC/schema as an incidental cleanup.
