---
id: document.validation.gpu-pv-disposable-pilot
class: DOCUMENT
domain: validation
role: PROCEDURE
authority: WORKING
lifecycle: ACTIVE
---

# App Sandbox GPU-PV: one disposable Windows guest

This procedure is an **isolated feasibility experiment**, not the production VMware client lifecycle. The one pilot guest is manually created using App Sandbox v0.1.9. The Rust CLI can then inspect, start, gracefully shut down and show its display. **No Rust VM-creation, deletion, hard-stop, snapshot or account-reset route exists in this pilot.** Source and Windows/GPU/game acceptance are separate.

## Host and identity boundaries

Use the exact pilot name `MVB-PILOT-01` (not Virtual-01/02/03). Its per-guest root must be:

`%ProgramData%\M-Bedrock\VirtualClients\pilots\MVB-PILOT-01\`

The VM's configured `diskDirectory` is the **parent** `%ProgramData%\M-Bedrock\VirtualClients\pilots`, and its active VHDX must be `MVB-PILOT-01\disk.vhdx` (no differencing branches). The guest is **Windows 11 x64**, and the planned initial App Sandbox allocation is exactly **4096 MB RAM**, **2 CPU cores**, **GPU Default (GPU-PV, gpuMode 1)**, **NAT (networkMode 1)**, with **zero snapshots/branches**. These are a conservative starting configuration, not proof that Minecraft works.

Create the disposable Windows guest through App Sandbox GUI or its documented API, **not by the MIVUBI CLI**. App Sandbox creation can start a Windows installation asynchronously. Complete Windows setup and power the guest down through its *graceful* shutdown mechanism before asking this pilot to start it. Only use a valid Windows guest evaluation or entitlement appropriate to the scenario. **An activated Windows 11 Enterprise host does not automatically license three Windows VM installations.** Minecraft Education accounts also require their own entitlements.

## Operator-controlled enrollment

Run the existing CLI command `virtual-clients app-sandbox-pilot inspect`. It reports a non-secret `enrollmentFingerprint`, derived from the canonical active VHDX path, VM name and persisted MAC in upstream `vms.cfg`, plus `operatorConsentValid=false` until explicitly enrolled. This is a marker for the disposable experiment, **not a trusted cryptographic attestation of VHDX contents, HCS attachment, or Windows licensing**.

After independently verifying on the local machine that the VHDX contains **no valuable account or world data**, an authorized operator may create the UTF-8 file `pilot-consent.json` **inside that specific pilot VM root**:

```json
{
  "schema": 1,
  "vm_name": "MVB-PILOT-01",
  "fingerprint": "<exact enrollmentFingerprint from inspect>",
  "disposable": true,
  "windows_entitlement_confirmed": true
}
```

The final boolean records **the operator's own licensing assertion**, not an entitlement check. Do not add this file, VM images, tokens, credentials or registry data to Git. A marker in the wrong directory, with a stale fingerprint, or inside a redirected/reparse directory is rejected. Replacing the active VHDX path or MAC invalidates the marker. **There is no automatic enrollment.**

## Explicit actions

The only pilot commands are:

```text
virtual-clients app-sandbox-pilot inspect
virtual-clients app-sandbox-pilot start --confirm-disposable-pilot
virtual-clients app-sandbox-pilot display --confirm-disposable-pilot
virtual-clients app-sandbox-pilot shutdown --confirm-disposable-pilot
```

`start` works only from `stopped` and only on the named, enrolled disposable VHDX; it uses the upstream `POST /v1/vms/MVB-PILOT-01/start` with `{}` and **never supplies a snapshot/branch selector**. `shutdown` uses upstream `/shutdown`, *not* `/stop` (which is forced power-off). `display` requires upstream `GET /display` readiness and the interactive App Sandbox daemon desktop session. HTTP `202 Accepted` is **not a completed boot/shutdown**; the CLI waits for observed state, and a timeout or unknown status requires manual inspection, not an automatic retry, force-off or rollback.

The pilot's host session is local-loopback authenticated, with no HTTP proxy or redirects. The Rust operation lock excludes concurrent product operations during explicit actions. Source code includes no auto-start, recurring VM polling or implicit app startup connection. Neither the normal desktop `snapshot` nor `Virtual-01/02/03` commands use this pilot route.

## Evidence required before any production cutover

Treat pilot running, IDD display ready and SSH `online` as **separate observations**. A viable G1 outcome also requires **actual hardware Direct3D 11 FL 11_0 and NVIDIA-backed OpenGL >=4.4 within Windows guest**, not WARP/llvmpipe, plus Minecraft Education licensed sign-in, world rendering and usable keyboard/mouse. Capture actual machine evidence before cloning any account-bearing VHDX. If one guest cannot pass, stop the three-guest scaling plan and diagnose the graphics/driver failure.

The legacy VMware G0–G4 verification text and artifacts have **not** yet been migrated for App Sandbox. Source-only inspection and authored Rust regressions cannot make G0/G1 pass. All G0–G4 remain `NOT_EXECUTED` until executable evidence on the same candidate exists.

Do **not** use this disposable pilot as a recovery/reset mechanism for a production account. The pilot consent file is not proof of HCS disk attachment, VM identity continuity, or Microsoft account preservation.
