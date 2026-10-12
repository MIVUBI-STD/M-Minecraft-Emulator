---
id: document.validation.sandboxie-two-client-feasibility
class: DOCUMENT
domain: validation
role: PROCEDURE
authority: WORKING
lifecycle: ACTIVE
---

# Sandboxie Plus — two-client application-isolation experiment

**Work:** emulator/native-multi-instance-feasibility. This document is a
**backup experiment**, not a selected production provider, a second runtime
owner, or permission to replace the current VMware installation. Do not
delete/stop/reprovision old guest VMs or change installed accounts.

## Why this small experiment exists

The target is one official Minecraft Education Windows Desktop installation
and four concurrently playable accounts, with **no full Windows guest VMs if
possible**. First prefer the existing native
[two-client test](./native-multi-instance-feasibility.md). If native
cannot sustain two independent sessions, test one host-native game plus
one game launched through an independently configured Sandboxie Plus box.

Sandboxie Plus provides:
- SbieIni.exe query SECTION SETTING to read box configuration;
- Start.exe /box:BOX /listpids to enumerate PIDs reported inside a box.
  Start.exe is a GUI subsystem program; redirected stdout may not work
  on every configuration. No result means UNKNOWN, not zero processes.

These are **read-only** calls in this experiment. The collector never
uses Sandboxie's delete, terminate, reload, set, update, or launch actions.
It never creates boxes, installs Sandboxie or touches Minecraft account data.

Upstream references:
- https://sandboxie-plus.github.io/sandboxie-docs/Content/SbieIniCommandLine/
- https://sandboxie-plus.github.io/sandboxie-docs/Content/StartCommandLine/
- https://sandboxie-plus.github.io/sandboxie-docs/Content/SandboxieIni/
- https://sandboxie-plus.github.io/sandboxie-docs/Content/SandboxRemoval.html
- https://github.com/sandboxie-plus/Sandboxie/blob/master/Sandboxie/install/SbieSettings.ini
- https://github.com/sandboxie-plus/sandboxie-docs/blob/main/docs/PlusContent/supporter-certificate.md
- https://edusupport.minecraft.net/hc/en-us/articles/13106858087956-Windows-Installation-Guide

## Prerequisites, manually managed

Use the official **Desktop** version of Minecraft Education, not a copied
executable or a Store/Win32 dual installation. Leave native Minecraft world
files unchanged. Sandboxie Plus is optional and third party: its drivers,
installer, box creation and license are NOT managed by MIVUBI.

Before running the two-game test, an authorized operator:
1. Verifies Sandboxie Plus is legitimately licensed for its intended use.
   Its own documentation requires a Business Certificate for business or
   educational environments; App Compartment options require an eligible
   Supporter Certificate. Do not assume access is licensed.
2. Creates a **test-only**, ordinary, persistent box using Sandboxie Plus
   SandMan GUI named Mivubi2 (or another 1–32-character alphanumeric name
   starting with a letter).
3. Reviews **Auto Delete** and **Auto Remove** in the selected box.
   SandMan defaults both to OFF when absent from a successfully read box
   section; an explicit y is unsafe for account persistence. Do not
   enable automatic cleanup, deletion, reset, shared Microsoft login,
   or profile copying. A default of OFF is not proof against manual deletion.
4. Starts one official Minecraft Education Windows Desktop game natively,
   then requests the official game from within that selected Sandboxie box
   via the Sandboxie UI. Merely starting explorer.exe in a box is **not**
   evidence that the actual Minecraft process is sandboxed.
5. If *two real independent windows* appear, signs in to two distinct,
   properly entitled Education accounts **manually**. Checks both worlds,
   Microsoft sign-in redirects, input, multiplayer, closing and reopening,
   and a host reboot. No account/credential values go into the report.

If Minecraft cannot authenticate or open inside the box, mark it NO-GO.
Do NOT bypass Microsoft licensing, app single-instance guards, WAM/SSO
broker restrictions or Sandboxie driver protections.

## Read-only inspection (runs from repo root)

    powershell.exe -NoProfile -File tooling/acceptance/windows/collect-sandboxie-feasibility.ps1 -Stage INSPECT -BoxName Mivubi2

The collector checks only signed, installed Start.exe / SbieIni.exe,
Sandboxie service state, enabled-box/AutoDelete/AutoRemove settings,
selected box PID membership and Windows candidate process windows.
It first queries the enabled box and enumerates its explicit box-local
setting keys using SbieIni.exe query BOX *. If that enumeration succeeds,
a missing AutoDelete/AutoRemove key means default OFF. An explicit key is
queried directly. A failed/ambiguous enumeration or invalid value remains
UNKNOWN, never OFF. GlobalSettings is deliberately not used for those
SandMan lifecycle controls. New reports record boxSettingsSource as
BOX_SECTION_ENUMERATED or UNKNOWN; legacy reports lacking provenance remain
readable but cannot be reported compatible.
It never records full process paths, CLI arguments, box filesystem paths,
world names, account identities, cookies or tokens. All probes fail
closed to UNKNOWN when unavailable. An unsigned/custom source build
is NOT automatically invoked; it requires separate review.

Optional manually selected install directory:

    powershell.exe -NoProfile -File tooling/acceptance/windows/collect-sandboxie-feasibility.ps1 -InstallDirectory "D:\Tools\Sandboxie-Plus"

The -InstallDirectory option is only used for read-only inspection
of tools already installed. It never downloads or installs binaries.

After actually observing **both** login/gameplay sessions and completing
the close/reopen/reboot persistence check, record operator statements.
Replace each YES/NO with UNKNOWN unless personally observed:

    powershell.exe -NoProfile -File tooling/acceptance/windows/collect-sandboxie-feasibility.ps1 -Stage TWO_CLIENT -BoxName Mivubi2 -LicensedForUse YES -NativeWorldPlayable YES -SandboxWorldPlayable YES -DistinctAccounts YES -IndependentInput YES -AccountCrossingObserved NO -ReopenAndRebootPersistent YES -MultiplayerJoined UNKNOWN -ObservedMinutes 10 -EvidenceReference isolated-local-001

The JSON is written under %TEMP%\MIVUBI-Sandboxie-Feasibility.
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
