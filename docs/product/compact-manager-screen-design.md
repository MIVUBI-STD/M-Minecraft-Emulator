---
id: document.product.compact-manager-screen-design
class: DOCUMENT
domain: product
role: SPECIFICATION
authority: WORKING
lifecycle: DRAFT
---

# Minecraft Instance Manager — Clean Compact Screen Design

**Status:** DRAFT / DESIGN ONLY, 2026-10-13. Not implemented in Tauri, no local Minecraft testing resumed.
**Parent:** [Compact Manager UX Specification](./compact-manager-ux-spec.md).
**Reviewed runtime source:** `Local` at `580b4e386538aa4aa906bfe4c555e43a77135e1c`.
**Visual references:** M-TranslateIT for dark neutral tokens and labeled navigation, M-LazyBuilder for operational error recovery, Prism Launcher and BlueStacks for instance-first workflows, Windows/Fluent guidelines for desktop accessibility and content density.
**Prototype:** A standalone, offline interactive HTML/CSS/JS design prototype was produced for review in the ChatGPT conversation. It is NOT a GitHub production application or a backend-connected build.

## 1. Product identity and non-goals

The app's durable purpose is **daily management of legitimate Minecraft Education Windows Desktop instances**, eventually four independent licensed game sessions. Never present the product as a test runner or developer tool. `Local Test`, `Dev Mode`, `PID Membership`, `GAMEPLAY NOT VERIFIED` and `Sandboxie Pilot` are NOT main navigation items or persistent marketing banners. Source-level feasibility limitations remain documented and can appear where an actual operation depends on them.

Current code supports **Client 01: official Windows Start-app launch request**; **Client 02: conditional Sandboxie isolated launch request, read-only joint inspection, and validated boxed-window Focus / Left / Right**. It has no proven four-client launcher, no native Client 01 Focus/placement, no Stop, no Start All, no persistent saved preference contract, no account automation, and no verified signed-in play. Visual treatment must not obscure these differences or offer fake buttons.

## 2. Design direction — clean, not empty

- Dominant impression: compact professional Windows utility, not a gamer-themed dashboard.
- Background: subdued neutral charcoal; no large gradients, hero illustrations, high-contrast glow, decorative status pills or Minecraft pixel ornaments.
- Navigation: labeled sidebar with three items: **Instances**, **Window Layout**, **Settings**. **Help & Diagnostics** in footer only.
- Typography: Segoe UI / system sans fallback; size 13–15 px for primary content, 11.5–12.5 px for secondary text if actual Windows legibility testing approves. Never use 9 px for body-critical information.
- One bright neutral primary action at a time; other actions bordered/quiet. Success, warning and error colors are strictly semantic and always paired with text.
- Target desktop reading pattern: page heading -> list title -> two instances -> status/help. Maximum four instance rows in eventual release.
- Flat surfaces with thin borders and occasional quiet elevation; reserve overlays for details, setup and recovery.

### Proposed semantic tokens (not yet applied to app source)

| Token | Example |
| --- | --- |
| `--bg` | `#101316` |
| `--sidebar` | `#0d1013` |
| `--surface` | `#171b1f` |
| `--surface-raised` | `#1d2227` |
| `--surface-hover` | `#23292e` |
| `--border` | `#2b3238` |
| `--border-strong` | `#434b53` |
| `--text` | `#f5f7fa` |
| `--text-muted` | `#a8b0b7` |
| `--text-secondary` | `#87919b` |
| `--primary` | `#eef2f6` with dark text `#11151b` |
| `--success` | `#78c99b` |
| `--warning` | `#eac084` |
| `--danger` | `#ec898c` |

Use **one** token source in the future implementation rather than copying token definitions into multiple Svelte components. Recommended base radius 8–12 px; control height 36–40 px; instance row target 88–100 px; sidebar approximately 184–196 px; page padding 24–40 px depending on viewport. These are visual baselines to validate, not a guarantee of accessibility until tested.

**Current Tauri reality:** `apps/desktop/src-tauri/tauri.conf.json` declares 1180×760 default, 920×620 minimum. UI review must validate at 1180×760 and 920×620; any proposed 680-wide adaptive mode requires a separately reviewed Tauri window constraint change, not only CSS.

## 3. Screen A — Instances (home)

### Information order
1. Tiny app identity in top bar; no separate Overview.
2. `Instances` heading and one-line description (`Open and manage your Minecraft Education windows.`).
3. One explicit `Check Status` utility action.
4. Section label `Available instances`, no misleading running count.
5. Row `Minecraft 01` and row `Minecraft 02`, always in stable numerical order. Support adding 03/04 later only with real backend capabilities.
6. `Last inspection: not available` / actual last session inspection timestamp and evidence qualifier.
7. Optional contextual problem message under affected instance, not a giant global diagnostic panel.

### Row anatomy
- Neutral monitor glyph in a 48×48-ish subtle square.
- Stable title `Minecraft 01` (not user-relabelable yet).
- Secondary `This PC · Native` or `Isolated` (technical provider may be shown in details).
- Short status line with icon/dot + literal text.
- One primary action; possible overflow More menu for safe secondary actions.
- Row itself is NOT a nested clickable button that competes with keyboard-accessible inner buttons.

**Client 01:** `Open Minecraft` always means requesting official Start app, NOT guaranteed new window, guaranteed Focus, or independent account session. If open request fails, show a specific error.

**Client 02:** `Check Status` when uninspected/unknown; `Set Up` when configuration insufficient; `Start` only when inspection + selected official EXE + explicit license/persistence confirmation enable requesting a launch; `Focus` only when a unique eligible boxed-window candidate exists. Backend always revalidates. After Start succeeds, show `Open request sent; check the Minecraft window`, not `Running`.

**Never say `Stopped` just because no process was observed at some earlier time**; prefer `No game process found at last check`. Never display live-style `2 running` without suitable independent lifecycle evidence.

### More menu
- Client 01: `View details` only until more supported controls exist.
- Client 02: `View details`; `Place left`, `Place right` ONLY when window candidate eligibility permits. No Stop, Clone, Delete, Reset, Restart, Preview Game, or login controls.
- Menu placement: anchored to row, no layout shift, Escape and outside click close, preserve keyboard focus.

### Interaction and failure states
- Initial: two rows visible, non-validated status clearly `Not checked`; Client 01 Open remains available.
- Inspection pending: `Checking…`, serialized UI actions; never auto-attempt launch.
- Collector fails/unknown: `Status unknown` + `Check Status` / `View Issue` and next step, never unsafe Start.
- Client 02 already has process candidate(s) but no unique focus candidate: refuse duplicate Start; explain uncertainty.
- Client 02 focus action accepted: do not claim guaranteed foreground activation; suggest Alt+Tab fallback if needed.
- Any action timeout: treat as ambiguous unless backend can prove a failure, never auto-retry.

## 4. Screen B — Instance details panel

Use a **right side sheet** of approximately 420–460 px on standard desktop widths. Dim background slightly; keep most page context visible. On narrower future layouts, sheet becomes the primary content layer.

Panel content:
1. Title `Minecraft 02` + close button.
2. Key/value facts: `Environment`, `Last observation`, `Gameplay status` (not verified by manager).
3. One compact **About this instance** paragraph contextual to Client 01 or Client 02.
4. Safe primary action already supported by the corresponding row.
5. Optional `Setup guidance` for Client 02.
6. Collapsed **Technical explanation** / diagnostics. No credentials, accounts, or private game data.

Keyboard: opening puts focus in panel; Tab stays within active modal panel; Escape closes; closing returns focus to trigger. The offline prototype demonstrates opening/closing and focus return but is NOT an accessibility certification; production must implement a robust focus trap and screen-reader checks.

## 5. Screen C — Guided setup (contextual, nonblocking)

Do **not** add `Setup` to primary navigation and do not block Client 01 simply because Client 02 is unconfigured. Open setup through the affected instance or Settings.

Recommended steps:
1. **Install/Locate** — verify official Minecraft Education Desktop. For isolated route allow user to choose the installed executable through existing native picker, never ask for credentials.
2. **Isolate** — explain the Sandboxie Plus persistent box `MinecraftClient02`, legitimate licensing, disabled AutoDelete/AutoRemove and unsafe credential bypass settings. User-owned steps stay explicit; manager does not silently configure the box.
3. **Check** — explicit inspection of the live Windows/Sandboxie session; show valid/invalid/unknown with exact corrective guidance. Conclude by returning to Instances, not an invented success state.

Buttons: `Back`, `Continue`, `Check Status` when connected and permitted, and `Close`. Do not persist license assertion as a bypass, fake a completed checklist, or keep stale readiness after invalidating operations. If user closes setup mid-way, no state mutation beyond selected transient UI values.

**Copy:** Use plain English in the current prototype, keep implementation localization-ready. Indonesian-first versus English-first for eventual public release remains a separate product decision.

## 6. Screen D — Window Layout

One purpose: arrange window geometry without changing game session state.

Current active capability: **Client 02 left or right only** once target candidate is unique and eligible for backend revalidation. Client 01 must not move as a side effect.

Layout content:
- Heading + one-line description.
- Clear representation of primary Windows display.
- Preview showing Client 02 on the left or right. Ghost area labeled `Other windows` does **not** claim access to Client 01 window.
- `Place left` and `Place right` choices. Changing preview alone never moves actual windows.
- Explicit Apply/request action, enabled only after eligible inspection, with result or error.
- Smaller `Future layouts` note may appear in prototype/docs, **not a persistent production advertisement**.

**Future only**, after real provider capabilities: 2-window side-by-side, 3-window main+2, 4-window grid/columns/focus+3, monitor picker, presets, saved preference, DPI-aware placement and partial-result handling. Never present these as supported now.

## 7. Screen E — Settings and Help

Settings is a single vertical column grouped:
- **General**: Appearance / Language as proposed preferences, only editable after persistence and localization ownership exists.
- **Instances**: Minecraft installation and contextual setup; window placement navigation.
- **Advanced**: Help & Diagnostics, read-only inspection facts, app version and privacy-safe troubleshooting.

Microsoft recommends limiting ordinary settings complexity and keeping common actions out of Settings. Do not add Start/Stop/Focus to Settings. No RAM/GPU knobs, instance cloning, account storage, credential reset or automatic startup controls without separately implemented behavior.

Help:
- `Why is Client 02 unavailable?`
- `Does the manager sign into Minecraft?`
- `Where can I view technical details?`
- Problem format: **what happened → why it matters → safe next action**.

## 8. Screen state acceptance matrix

| Scenario | Exact expected UI |
| --- | --- |
| First open without inspection | `Not checked`, `Check Status`; Client 01 may still offer `Open Minecraft`; no running count |
| Valid empty-box last inspection | Client 02 may say `No process found at last check`; Start appears only if EXE/licence and all launch UI/backend gates are met |
| Box missing | Client 02 `Setup required` + guided instructions, Client 01 remains usable |
| Membership UNKNOWN | `Status unknown` + Check, never Start |
| Boxed process found but no eligible window | View Issue/Check, no duplicate launch or unsafe Focus |
| Unique eligible boxed window | Focus offered; Rust revalidates on invocation |
| Launch request accepted | `Request sent`, not `Game running` or `Signed in` |
| Window disappears between check and Focus | Safe backend refusal, invalidate UI candidate and ask to recheck |
| Layout selection | Pure visual preview; actual position changes only by explicit supported request |
| User closes manager | No implicit Stop action; real Windows session behavior to be verified separately |
| 920×620 | Core actions remain visible and not clipped at Tauri's current minimum |
| Keyboard and scaling | Tabbing, visible focus, focus return, text contrast, Narrator/125–150% scaling tested on actual Windows |

## 9. Component architecture for implementation

```text
AppShell (single active entry)
├── PrimaryNavigation
├── AppHeader
├── InstancesPage
│   ├── InstancesHeader
│   ├── InstanceList
│   │   └── InstanceRow (name / status / primary command / More)
│   ├── InstanceDetailsSheet
│   ├── InstanceSetupSheet
│   └── ContextualIssueNotice
├── WindowLayoutPage
├── SettingsPage
└── HelpSurface

Presentation-only projections
├── instanceViewModel.ts
├── instanceActionPresentation.ts
├── statusPresentation.ts
└── operationErrorPresentation.ts

Existing authority (unchanged)
├── app/bridge/nativeFeasibilityApi.ts
├── src-tauri/src/commands/native_clients.rs
└── src-tauri/src/engine/native_clients.rs
```

Start with **one** live application shell; `apps/desktop/src/App.svelte` is legacy and must not be blindly re-mounted. Do not create a duplicate Rust runtime, duplicate persisted client state, separate Sandboxie collector, new periodic polling, account automation, or package-release path.

## 10. Design review and implementation sequence

1. **Design review**: check the offline prototype's Instances, state switcher, More actions, details sheet, setup sheet, Window Layout, Settings and error screen with users. Reject controls that look actionable but cannot be explained.
2. **Presentation foundation**: extract approved semantic tokens and reusable components from prototype concepts to Svelte. Do not embed prototype demo state in production.
3. **Backend mapping**: use existing typed IPC and proven eligibility gates; isolate all derived labels in pure projection tests.
4. **UX hardening**: keyboard and screen reader, Escape/initial focus/focus return, client 02 unknown/stale status, disabled reasons, error copy, minimum window size, 125–150% scaling.
5. **Local verification separately**: only after user authorizes resuming the paused Windows test; UI source/build checks cannot prove login, gameplay or client 03/04.

## 11. Reference sources

- Windows design principles (Effortless, Calm, Familiar): https://learn.microsoft.com/en-us/windows/apps/design/design-principles
- Windows app basics: https://learn.microsoft.com/en-us/windows/apps/design/basics/
- Microsoft productivity and responsive design: https://learn.microsoft.com/en-us/windows/apps/get-started/line-of-business/design-for-lob
- Microsoft settings guidelines: https://learn.microsoft.com/en-us/windows/apps/design/app-settings/guidelines-for-app-settings
- Windows compact control density: https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/compact-sizing
- NN/g visibility of system status: https://www.nngroup.com/articles/visibility-system-status/

**Draft discipline:** Nothing in this document asserts that frontend runtime wiring, native installer, current branch build/test, Minecraft sign-in/playability or four-client support have passed.
