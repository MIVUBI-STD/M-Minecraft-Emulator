---
id: document.validation.sandboxie-two-client-feasibility
class: DOCUMENT
domain: validation
role: PROCEDURE
authority: WORKING
lifecycle: ACTIVE
---

# Sandboxie Plus — two-client application-isolation experiment

**Work:** emulator/sandboxie-client02. This is the **single selected Windows
isolation experiment**: one normal Minecraft Education Desktop game and one
launch requested inside the persistent Sandboxie Plus `MinecraftClient02` box.
It is not a proven multi-account product or a production provider. Do not
stop/delete VMware guests, modify sign-in data or duplicate game binaries.

## Why this small experiment exists

The target is one official Minecraft Education Windows Desktop installation
and four concurrently playable accounts, with **no full Windows guest VMs if
possible**. Development is currently restricted to **two Windows Desktop
clients**, one host native and one inside the preconfigured `MinecraftClient02` box.
No Android emulator, controller, multi-provider engine or 4-client scheduler
is developed in this experiment.

Sandboxie Plus provides:
- SbieIni.exe query SECTION SETTING to read box configuration;
- Start.exe /box:BOX /listpids to enumerate PIDs reported inside a box.
  Start.exe is a GUI subsystem program; redirected stdout may not work
  on every configuration. No result means UNKNOWN, not zero processes.

These calls remain **read-only** in the collector. The active desktop adds
one separate, explicitly requested launch action via the official
`Start.exe /box:MinecraftClient02 <installed Education EXE>` command, without
creating, deleting, resetting or configuring Sandboxie boxes. The app never
copies Microsoft account data or modifies Minecraft executable files.

Upstream references:
- https://sandboxie-plus.github.io/sandboxie-docs/Content/SbieIniCommandLine/
- https://sandboxie-plus.github.io/sandboxie-docs/Content/StartCommandLine/
- https://sandboxie-plus.github.io/sandboxie-docs/Content/SandboxieIni/
- https://sandboxie-plus.github.io/sandboxie-docs/Content/SandboxRemoval.html
- https://github.com/sandboxie-plus/Sandboxie/blob/master/Sandboxie/install/SbieSettings.ini
- https://github.com/sandboxie-plus/sandboxie-docs/blob/main/docs/PlusContent/supporter-certificate.md
- https://edusupport.minecraft.net/hc/en-us/articles/13106858087956-Windows-Installation-Guide

## Canonical, generic naming

- Manager: **Minecraft Instance Manager** (developer UI only).
- Native process: **Client 01**.
- Isolated process: **Client 02**, fixed Sandboxie box `MinecraftClient02`.
- Pilot state: `%LOCALAPPDATA%\MinecraftInstanceManager\NativePilot`.
- Reports: `%TEMP%\MinecraftInstanceManager\SandboxieFeasibility`.

An older developer experiment may have created a differently named box.
The manager does **not** rename, erase, or import data from it. Prepare a
new, clean, persistent `MinecraftClient02` box manually in Sandboxie Plus;
never clone saved Microsoft login data into the new box.

## Single desktop experiment — Client 01 + Client 02

In a clean `Local` checkout, run `npm run setup`, `npm run
verify:source`, then `npm run dev`. Use the **Minecraft Instance Manager**
interface, not the blocked VMware NSIS installer. Start Client 01 through
the existing official Windows launcher. For Client 02:

1. Prepare exactly one persistent `MinecraftClient02` box in the licensed Sandboxie
   Plus interface; keep AutoDelete/AutoRemove OFF.
2. Select the **installed** Minecraft Education Windows Desktop EXE in Minecraft Instance Manager.
   Do not select the downloaded installer. The current pilot requires
   valid Authenticode signing by **Microsoft Corporation**, together with
   Education product metadata. If the real installed Education release
   has a different verified signing organization, record its evidence and
   review the trust rule in source rather than disabling the signature check.
3. Acknowledge Sandboxie licensing and click **Launch isolated Client 02**.
   The backend reuses the canonical Windows collector, requires a persistent
   enabled box with AutoDelete/AutoRemove OFF and verifiable
   OpenCredentials OFF (box-local or inherited), then requests launch.
   A nonzero Start.exe exit code is reported as an error; a launcher that
   never exits before the deadline is UNKNOWN, not gameplay success.
4. Click **Refresh both clients**. One collector reports candidates
   **outside the selected box** versus **inside MinecraftClient02**.
   Being outside the box is not proof a process belongs to native Client 01.
   It also reports the WinCred hook-bypass configuration. The desktop uses
   `-SummaryOnly`, which does not write an evidence file. A PID/window
   candidate is not Microsoft account proof.
5. Independently verify two different licensed Microsoft Education logins,
   world/input, multiplayer and persistence. Mark missing evidence UNKNOWN.

A launch or PID count does not override a manual game observation; a failed
launch is diagnosed without altering account/VM data. Sandboxie Plus requires
a Business Certificate for business/educational use as described upstream.

## Prerequisites, manually managed

Use the official **Desktop** version of Minecraft Education, not a copied
executable or a Store/Win32 dual installation. Leave native Minecraft world
files unchanged. Sandboxie Plus is optional and third party: its drivers,
installer, box creation and license are NOT managed by Minecraft Instance Manager.

Before running the two-game test, an authorized operator:
1. Verifies Sandboxie Plus is legitimately licensed for its intended use.
   Its own documentation requires a Business Certificate for business or
   educational environments; App Compartment options require an eligible
   Supporter Certificate. Do not assume access is licensed.
2. Creates a **test-only**, ordinary, persistent box named **exactly
   MinecraftClient02** using Sandboxie Plus SandMan. The active backend and
   collector use this single fixed name; other box names are not supported.
3. Reviews **Auto Delete**, **Auto Remove** and **Open System Protected
   Storage / OpenCredentials** in the selected box. AutoDelete/AutoRemove
   must be OFF. The collector resolves OpenCredentials in the box and
   inherited GlobalSettings; it also checks a box's explicit
   `OpenProtectedStorage` template if configured. A known bypass or
   unreadable/UNKNOWN setting prevents launch. Even with OFF, intercepted
   WinCred operations can fall back to host credential reads; therefore
   OFF **does not independently establish Windows-account or WAM/SSO
   session isolation**.
   Do not enable profile copying, credential sharing or automatic cleanup.
4. Starts one official Minecraft Education Windows Desktop game natively,
   then requests the official game from within that selected Sandboxie box
   through the **Minecraft Instance Manager Client 02** launch action using the same signed,
   installed executable. Neither a launch request nor explorer.exe alone
   proves that Minecraft is actually sandboxed.
5. If *two real independent windows* appear, signs in to two distinct,
   properly entitled Education accounts **manually**. Checks both worlds,
   Microsoft sign-in redirects, input, multiplayer, closing and reopening,
   and a host reboot. No account/credential values go into the report.

If Minecraft cannot authenticate or open inside the box, mark it NO-GO.
Do NOT bypass Microsoft licensing, app single-instance guards, WAM/SSO
broker restrictions or Sandboxie driver protections.

## Read-only inspection (runs from repo root)

    powershell.exe -NoProfile -File tooling/acceptance/windows/collect-sandboxie-feasibility.ps1 -Stage INSPECT -BoxName MinecraftClient02

The collector checks signed installed Start.exe / SbieIni.exe,
Sandboxie service state, enabled-box/AutoDelete/AutoRemove settings,
the WinCred-hook bypass setting (including an explicitly configured
OpenProtectedStorage template), selected-box PID membership and Windows
candidate process windows. The historical JSON field
`credentialHostAccess` must be interpreted as a configuration/bypass
indicator, not a proof that host credentials are inaccessible. Its source is embedded in the development
Tauri backend so the inspector and launcher preflight reuse the same rules.
It first queries the enabled box and enumerates its explicit box-local
setting keys using SbieIni.exe query BOX *. If that enumeration succeeds,
a missing AutoDelete/AutoRemove key means default OFF. An explicit key is
queried directly. A failed/ambiguous enumeration or invalid value remains
UNKNOWN, never OFF. GlobalSettings is deliberately not used for those
SandMan lifecycle controls. New reports record boxSettingsSource as
BOX_SECTION_ENUMERATED or UNKNOWN; legacy reports lacking provenance remain
readable but cannot be reported compatible. Old records that omit
credentialHostAccess likewise stay INCONCLUSIVE until new host evidence
is collected. Full evidence reports now contain this field (older reports
are not silently migrated or treated as complete).
It never records full process paths, CLI arguments, box filesystem paths,
world names, account identities, cookies or tokens. Its OpenCredentials
field is a Sandboxie configuration observation, not proof that Microsoft's
WAM helper processes are contained. The explicit CLI collector writes
an evidence file by default. The desktop's `-SummaryOnly` inspection
returns only a bounded response without writing an evidence file. All
unreadable probes stay UNKNOWN, never an invented success. An unsigned/custom source build
is NOT automatically invoked; it requires separate review.

Optional manually selected install directory:

    powershell.exe -NoProfile -File tooling/acceptance/windows/collect-sandboxie-feasibility.ps1 -InstallDirectory "D:\Tools\Sandboxie-Plus"

The -InstallDirectory option is only used for read-only inspection
of tools already installed. It never downloads or installs binaries.

After actually observing **both** login/gameplay sessions and completing
the close/reopen/reboot persistence check, record operator statements.
Replace each YES/NO with UNKNOWN unless personally observed:

    powershell.exe -NoProfile -File tooling/acceptance/windows/collect-sandboxie-feasibility.ps1 -Stage TWO_CLIENT -BoxName MinecraftClient02 -LicensedForUse YES -NativeWorldPlayable YES -SandboxWorldPlayable YES -DistinctAccounts YES -IndependentInput YES -AccountCrossingObserved NO -ReopenAndRebootPersistent YES -MultiplayerJoined UNKNOWN -ObservedMinutes 10 -EvidenceReference isolated-local-001

The JSON is written under %TEMP%\MinecraftInstanceManager\SandboxieFeasibility. Previous reports remain at their prior paths; nothing is migrated or deleted.
Record no screenshots/account identifiers in Git. Evaluate the specific file:

    node tooling/acceptance/evaluate-sandboxie-feasibility.mjs "<report.json>"

Pure Node fixture tests only:

    npm run test:sandboxie-feasibility

## Interpretation and safety

- CONFIGURATION_BLOCKED: AutoDelete/AutoRemove is ON, or box explicitly
  disabled; accounts must not be entrusted to this box.
- OPERATOR_REPORTED_FAILURE: operator observed failed sign-in, loss of
  persistence, cross-account reuse, failed world, or missing entitlement.
- OPERATOR_REPORTED_COMPATIBLE: candidate Windows PID/window
  inventory, verified box-local settings, and operator reports include
  both independent gameplay, multiplayer success, and reboot persistence.
  This is **not** automated Minecraft or account proof.
- INCONCLUSIVE: absent or incomplete evidence, including unknown storage
  settings, unsigned tools, service failure, or unverified PID membership.

The evaluator additionally distinguishes processFeasibility
(TWO_WINDOW_CANDIDATES_OBSERVED or INCONCLUSIVE) from accountFeasibility
(operator-reported, failure or inconclusive). Neither is a product
acceptance gate: productAcceptance remains NOT_EVALUATED for four clients.
An unknown reboot/persistence **or multiplayer** result does not erase
genuine intermediate account observations; it still prevents the final
compatible verdict. An explicitly failed multiplayer attempt yields an
operator-reported failure, not a compatible verdict.

A valid Authenticode signature proves binary-signature integrity only,
**not** the current license/certificate, game compatibility or account
isolation. Even a compatible two-client pilot is not proof that four
accounts, networking, Microsoft broker behavior after updates, or long-run
storage use work. An operator must independently review genuine game
evidence before any production architecture decision.

**STOP:** do not add an application-provider adapter, modify Rust VM
lifecycle, rewrite the UI, or remove guest data based on this collector.
Only the next bounded Windows compatibility observation is authorized
by this experiment.

## Proof ceiling

At authoring: REMOTE_GITHUB source only. Node regression fixtures
authored but not necessarily executed; actual signed Sandboxie runtime,
interactive Minecraft Education, two/four account use and persistence
are NOT_EXECUTED.
