import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  client02Presentation, focusCandidate, rowPresentation,
  safeErrorDetails, setupInstruction, shouldClearPickerIssue,
} from "../src/app/presentation/compactManager.js";
import type { IsolatedClientObservation } from "../src/app/bridge/nativeFeasibilityApi.js";

function inspected(): IsolatedClientObservation {
  return {
    schema: 6, boxName: "MinecraftClient02", stage: "INSPECT",
    boxConfigured: "YES", boxSettingsSource: "BOX_SECTION_ENUMERATED",
    autoDelete: "OFF", autoRemove: "OFF", credentialHostAccess: "OFF",
    membershipStatus: "OBSERVED", interactiveSession: true,
    processEvidenceClass: "NAME_MATCH_CANDIDATE_ONLY",
    candidateProcessCount: 0, processCandidates: [],
    officialImageOutsideSelectedBoxCount: 0,
    directPidQuery: "NOT_REQUESTED", signedImageOtherBoxCount: 0,
    signedImageUnknownBoxCount: 0,
    isolatedCandidateProcesses: 0, nativeVisibleCandidates: 0,
    isolatedVisibleCandidates: 0,
    interpretation: "CONFIG_AND_PROCESS_CANDIDATES_ONLY_NO_AUTHENTICATION_PROOF",
  };
}

describe("Compact Manager projections", () => {
  it("does not treat a missing observation as stopped or ready", () => {
    expect(client02Presentation(undefined, "", false)).toMatchObject({ status: "Not checked", action: null });
  });
  it("keeps native Open separate from any isolated setup or inspection blocker", () => {
    const isolation = client02Presentation({ ...inspected(), boxConfigured: "NO", boxSettingsSource: "UNKNOWN", credentialHostAccess: "UNKNOWN" }, "", false);
    expect(isolation.action).toBe("setup");
    expect(rowPresentation("01", false, isolation, "", null, null).action).toBe("open");
    expect(rowPresentation("02", false, isolation, "", null, null).action).toBe("setup");
  });
  it("requires the entire proven-empty-box and UI setup before enabling Open", () => {
    expect(client02Presentation(inspected(), "", false).action).toBe("setup");
    expect(client02Presentation(inspected(), "some-selected-path", false).action).toBe("setup");
    expect(client02Presentation(inspected(), "some-selected-path", true).action).toBe("open");
    for (const change of [
      { membershipStatus: "UNKNOWN" as const },
      { autoDelete: "UNKNOWN" as const },
      { autoRemove: "ON" as const },
      { credentialHostAccess: "ON" as const },
      { interactiveSession: false },
    ]) expect(client02Presentation({ ...inspected(), ...change }, "some-selected-path", true).action).not.toBe("open");
  });
  it("never treats a boxed process without one eligible window as an empty box", () => {
    const ambiguous = { ...inspected(), isolatedCandidateProcesses: 1, candidateProcessCount: 1,
      processCandidates: [{ pid: 123, windowHandle: null, createdFileTime: null, inSelectedBox: true, imageEvidence: "UNKNOWN" as const }] };
    expect(client02Presentation(ambiguous, "path", true)).toMatchObject({ action: "issue", canMove: false });
    expect(focusCandidate(ambiguous)).toBeNull();
  });
  it("focuses only a unique last-observed boxed window and leaves signing proof to Rust", () => {
    const candidate = { pid: 123, windowHandle: "0x100", createdFileTime: "133400000000000000", inSelectedBox: true, imageEvidence: "UNKNOWN" as const };
    const found = { ...inspected(), isolatedCandidateProcesses: 1, isolatedVisibleCandidates: 1, candidateProcessCount: 1,
      processCandidates: [candidate] };
    expect(focusCandidate(found)).toEqual(candidate);
    expect(client02Presentation(found, "", false)).toMatchObject({ status: "Window detected", action: "switch", canMove: true });
    expect(focusCandidate({ ...found, membershipStatus: "UNKNOWN" })).toBeNull();
    expect(focusCandidate({ ...found, isolatedCandidateProcesses: 2 })).toBeNull();
  });
  it("does not mark Client 01 as being checked by Client 02 inspection", () => {
    const isolated = client02Presentation(inspected(), "path", true);
    expect(rowPresentation("01", false, isolated, "check", null, null).status).toBe("Not checked");
    expect(rowPresentation("02", true, isolated, "check", null, null))
      .toMatchObject({ status: "Checking…", action: null });
  });
  it("retains native errors while displaying isolated request outcomes", () => {
    const isolated = client02Presentation(inspected(), "path", true);
    const nativeIssue = { instance: "01" as const, title: "Native launch uncertain", message: "Look for existing window." };
    const boxedNotice = { instance: "02" as const, text: "Open requested" };
    expect(rowPresentation("01", false, isolated, "", nativeIssue, null))
      .toMatchObject({ status: "Native launch uncertain", action: "issue" });
    expect(rowPresentation("02", true, isolated, "", null, boxedNotice))
      .toMatchObject({ status: "Open requested", action: null });
  });
  it("does not present Client 02 as ready while executable selection is pending", () => {
    const safeBox = inspected();
    const initial = client02Presentation(safeBox, "C:/old.exe", true);
    expect(initial).toMatchObject({ status: "Ready to open", action: "open" });
    expect(rowPresentation("02", true, initial, "select", null, null))
      .toMatchObject({ status: "Selecting…", action: null, canMove: false });
    expect(rowPresentation("01", false, initial, "select", null, null).status).toBe("Not checked");
    const afterChangedFile = client02Presentation(safeBox, "C:/new.exe", false);
    expect(afterChangedFile).toMatchObject({ status: "Setup required", action: "setup" });
    expect(client02Presentation(safeBox, "C:/new.exe", true))
      .toMatchObject({ status: "Ready to open", action: "open" });
    const uncertain = { instance: "02" as const, title: "Couldn't confirm if Minecraft opened",
      message: "Check status before opening another copy." };
    expect(rowPresentation("02", true, afterChangedFile, "", uncertain, null))
      .toMatchObject({ status: uncertain.title, action: "issue", canMove: false });
    expect(client02Presentation(undefined, "C:/new.exe", true))
      .toMatchObject({ status: "Not checked", action: null });
  });
  it("does not show an available action during busy and uncertain operations", () => {
    const base = client02Presentation(inspected(), "path", true);
    expect(rowPresentation("02", true, base, "open-02", null, null)).toMatchObject({ status: "Opening…", action: null });
    const issue = { instance: "02" as const, title: "Couldn't confirm if Minecraft opened", message: "Check status." };
    expect(rowPresentation("02", false, base, "", issue, null)).toMatchObject({ action: "issue", canMove: false });
    expect(rowPresentation("02", false, base, "", null, { instance: "02", text: "Open requested" }))
      .toMatchObject({ status: "Open requested", action: null });
  });
  it("the open-request notice cannot be confused with a verified window", () => {
    const base = client02Presentation(inspected(), "path", true);
    expect(rowPresentation("02", false, base, "", null, { instance: "02", text: "Open requested" }))
      .toMatchObject({ status: "Open requested", action: null });
  });
  it("gives user-owned setup steps without claiming configuration automation", () => {
    expect(setupInstruction({ ...inspected(), boxConfigured: "NO", boxSettingsSource: "UNKNOWN", credentialHostAccess: "UNKNOWN" }).text).toContain("Sandboxie Plus");
    expect(setupInstruction({ ...inspected(), autoDelete: "ON" }).title).toContain("sandbox data");
  });
  it("resolves only picker-origin errors when an executable is selected", () => {
    const pickerIssue = {
      instance: "02" as const, title: "Couldn't select Minecraft",
      message: "Choose the official executable.",
      origin: "executable-picker" as const,
    };
    const launchIssue = {
      instance: "02" as const, title: "Couldn't confirm if Minecraft opened",
      message: "Inspect the window before retrying.",
    };
    const path = "C:/Program Files/Minecraft Education/Minecraft.Windows.exe";
    expect(shouldClearPickerIssue(pickerIssue, path)).toBe(true);
    expect(shouldClearPickerIssue(pickerIssue, null)).toBe(false);
    expect(shouldClearPickerIssue(pickerIssue, "")).toBe(false);
    expect(shouldClearPickerIssue(launchIssue, path)).toBe(false);
    expect(shouldClearPickerIssue(undefined, path)).toBe(false);
  });
  it("redacts Windows, forward-slash and macOS-style user directories", () => {
    for (const path of [
      "C:\\Users\\PersonalName\\Documents\\file.exe failed",
      "C:/Users/PersonalName/Documents/file.exe failed",
      "/Users/PersonalName/Library/file.exe failed",
    ]) {
      const result = safeErrorDetails(path);
      expect(result).not.toContain("PersonalName");
      expect(result).toContain("[user directory]");
      expect(result).toContain("file.exe failed");
    }
  });
  it("redacts common authentication details before truncating errors", () => {
    const sensitive = [
      "Authorization: Bearer topSecretAccessValue",
      'api_key="credential with spaces"',
      "access_token=highlySensitive",
      "refresh-token=keepprivate",
      "password=123",
      "token=abc",
      "secret=hidden",
      "alex@example.com",
    ];
    for (const value of sensitive) {
      const result = safeErrorDetails(value);
      expect(result).not.toContain("topSecretAccessValue");
      expect(result).not.toContain("credential with spaces");
      expect(result).not.toContain("highlySensitive");
      expect(result).not.toContain("keepprivate");
      expect(result).not.toContain("password=123");
      expect(result).not.toContain("token=abc");
      expect(result).not.toContain("secret=hidden");
      expect(result).not.toContain("alex@example.com");
    }
    expect(safeErrorDetails("a".repeat(700)).length).toBe(450);
  });
});

describe("Compact Manager app source and command boundary", () => {
  const entry = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
  const app = readFileSync(new URL("../src/CompactManagerApp.svelte", import.meta.url), "utf8");
  const bootstrap = readFileSync(new URL("../src-tauri/src/app_bootstrap.rs", import.meta.url), "utf8");
  it("keeps the active Sandboxie localtest instructions aligned with mounted controls", () => {
    const guide = readFileSync(new URL("../../../docs/validation/sandboxie-two-client-feasibility.md", import.meta.url), "utf8");
    expect(app).toContain('{busy === "check" ? "Checking…" : "Check status"}');
    expect(app).toContain(">Settings</button>");
    expect(app).toContain('on:click={showClient02MoveDetails}>Move window</button>');
    expect(guide).toContain(".\\DEV.cmd preflight");
    expect(guide).toContain(".\\DEV.cmd dev");
    expect(guide).toContain("**Check status**");
    expect(guide).toContain("**Set up**");
    expect(guide).toContain("**Open**");
    expect(guide).toContain("**Switch to**");
    expect(guide).toContain("**Move window**");
    expect(guide).toContain("not the historical");
    expect(guide).not.toContain("Click **Refresh both clients**");
    expect(guide).not.toContain("click **Launch isolated Client 02**");
    expect(guide).not.toContain("manual **Focus Client 02** button");
  });
  it("keeps the Windows operator procedure and architecture owner aligned with mounted Compact Manager", () => {
    const localGuide = readFileSync(new URL("../../../docs/validation/native-pilot-localtest.md", import.meta.url), "utf8");
    const map = readFileSync(new URL("../../../docs/system/implementation-map.md", import.meta.url), "utf8");
    const acceptanceSteps = localGuide.split("## B. Two-client manual acceptance sequence")[1]
      ?.split("## C. Read-only collector")[0] ?? "";
    expect(entry).toContain('mount(CompactManagerApp, { target });');
    expect(app).toContain('{busy === "check" ? "Checking…" : "Check status"}');
    expect(app).toContain('on:click={showClient02MoveDetails}>Move window</button>');
    expect(localGuide).toContain(".\\DEV.cmd preflight");
    expect(localGuide).toContain(".\\DEV.cmd dev");
    for (const control of ["**Check status**", "**Set up**", "**Browse…**", "**Open**", "**Switch to**", "**Move window**"]) {
      expect(acceptanceSteps).toContain(control);
    }
    expect(acceptanceSteps).toContain("**Check status** before Client 02 setup or launch");
    expect(acceptanceSteps).toContain("does not authenticate Client 01");
    expect(acceptanceSteps).toContain("do not auto-retry");
    expect(acceptanceSteps).not.toMatch(/Refresh both clients|Launch Client 0[12]|Launch isolated Client 02|Focus Client 02|Place Left/);
    expect(localGuide).toContain("CHECK STATUS (CLIENT 02):");
    expect(localGuide).not.toContain("REFRESH STATUS:");
    expect(localGuide).toContain("**NOT_EXECUTED** for that revision");
    expect(map).toContain("Active desktop navigation / transient visual state | `apps/desktop/src/CompactManagerApp.svelte`");
    expect(map).toContain("Legacy VMware client-owned setup wizard (inactive)");
    expect(map).toContain("legacy VMware layout/overlay (inactive)");
    expect(map).toContain("Explicit **Check status** (`-ImageProof`)");
  });

  it("mounts exactly one compact UI with no new native providers", () => {
    expect(entry).toContain('mount(CompactManagerApp, { target });');
    expect(entry).not.toContain("NativeFeasibilityApp");
    expect(app).not.toContain("<aside");
    expect(app).toContain("Virtual Manager");
    expect(app).toContain("Settings");
    expect(bootstrap).not.toContain("commands::virtual_clients::virtual_clients_");
  });
  it("treats Sandboxie as an internal MIVUBI capability without pretending new virtuals work", () => {
    expect(app).toContain('aria-label="Create virtual availability"');
    expect(app).toContain('<h1>Virtual Manager</h1>');
    expect(app).toContain('<h2>Host · Minecraft 01</h2>');
    expect(app).toContain('<h2>Virtual 02 · Minecraft Education</h2>');
    expect(app).toMatch(/<button type="button" class="cm-button cm-secondary" disabled[\s\S]*?>Create virtual<\/button>/);
    expect(app).toContain("M-Isolation-Engine · Internal runtime");
    expect(app).toContain("MIVUBI-owned virtual creation requires a tested internal driver");
    expect(app).toContain('ownedCandidate.upstreamCommit === "cdba7096240b93d79c5373aa81a75a1c5c71b883"');
    expect(app).not.toContain("Create virtual requested");
    expect(bootstrap).not.toContain("desktop_create_virtual");
  });
  it("keeps checking explicitly user-triggered and launch calls guarded", () => {
    expect(app).toContain("nativeFeasibility.inspectIsolatedClient02()");
    expect(app).toContain("nativeFeasibility.requestSandboxClient02(");
    expect(app).toContain("nativeFeasibility.openOfficialMinecraft()");
    expect(app).toContain("nativeFeasibility.focusObservedClient02(");
    expect(app).toContain("nativeFeasibility.placeObservedClient02(");
    expect(app).not.toMatch(/onMount\s*\(|setInterval\s*\(|setTimeout\s*\(/);
    expect(app).not.toContain("localStorage");
    expect(app).not.toContain("Stop All");
    expect(app).not.toContain("Start All");
  });
  it("restores keyboard focus when a panel closes and allows Escape to close it", () => {
    expect(app).toContain('import { tick } from "svelte"');
    expect(app).toContain("origin?.isConnected && !origin.disabled");
    const close = app.split("function closeDetails()")[1]?.split("function showSettings()")[0] ?? "";
    expect(close).toContain("else if (checkStatusButton?.isConnected && !checkStatusButton.disabled) checkStatusButton.focus();");
    expect(app).toContain('<svelte:window on:keydown={handleWindowKeydown} />');
    expect(app).toContain('event.key !== "Escape"');
    expect(app.match(/on:click={closeDetails}>Close details/g)).toHaveLength(2);
  });
  it("does not close or replace the other client's open issue details", () => {
    const inspector = app.split("async function checkStatus()")[1]?.split("async function openMinecraft01()")[0] ?? "";
    expect(inspector).toContain('expanded === "02" && detailMode === "issue") expanded = null;');
    const issueReport = app.split("function reportIssue(")[1]?.split("async function checkStatus()")[0] ?? "";
    expect(issueReport).toContain('(expanded === null || expanded === instance)');
    expect(issueReport).toContain("issues = { ...issues, [instance]");
  });
  it("tracks instance-local issue/notice feedback, not a shared global message", () => {
    expect(app).toContain("let issues: Partial<Record<InstanceId, UiIssue>> = {}");
    expect(app).toContain("let notices: Partial<Record<InstanceId, UiNotice>> = {}");
    expect(app).toContain('clearFeedback("01");');
    expect(app.match(/clearFeedback\("02"\);/g)).toHaveLength(4);
    expect(app).toMatch(/issues = \{ \.\.\.issues, \[instance\]: \{\s+instance, title, message,/);
    expect(app).toContain('notices = { ...notices, [instance]: undefined }');
    expect(app).toContain('rowPresentation("01", observation !== undefined, base02, busy, issue01, notice01)');
    expect(app).toContain('rowPresentation("02", observation !== undefined, base02, busy, issue02, notice02)');
    expect(app).not.toContain("let issue: UiIssue | null");
    expect(app).not.toContain("let notice: UiNotice | null");
    expect(app).toContain('{#if issue01}');
    expect(app).toContain('{#if issue02?.details}');
  });
  it("counts the inline Move window action as user navigation for pending IPC results", () => {
    const action = app.split("function showClient02MoveDetails()")[1]?.split("function expandDetails(")[0] ?? "";
    expect(action).toContain('page !== "instances" || expanded !== "02" || !moveEligible');
    expect(action).toContain("navigationRevision += 1;");
    expect(action).toContain('detailMode = "move";');
    expect(app).toContain('on:click={showClient02MoveDetails}>Move window</button>');
    expect(app).not.toContain('on:click={() => (detailMode = "move")}');
  });
  it("fails closed on Focus/Move errors without discarding the error or native feedback", () => {
    const focus = app.split("async function switchMinecraft02()")[1]?.split("async function moveMinecraft02()")[0] ?? "";
    const move = app.split("async function moveMinecraft02()")[1]?.split("function choosePrimary(")[0] ?? "";
    for (const operation of [focus, move]) {
      const failure = operation.split("} catch (error) {")[1]?.split("} finally {")[0] ?? "";
      // Never leave PID/HWND eligibility active when a backend revalidation
      // or asynchronous Win32 outcome fails.
      expect(failure).toContain("invalidateCurrentInspection();");
      expect(failure).toContain('reportIssue("02",');
      expect(failure.indexOf("invalidateCurrentInspection();"))
        .toBeLessThan(failure.indexOf('reportIssue("02",'));
      expect(operation).toContain('busy = "";');
      expect(operation).toContain("const requestRevision = navigationRevision;");
      expect(operation).toContain('clearFeedback("02");');
    }
    expect(focus).toContain("focusObservedClient02(target)");
    expect(move).toContain("placeObservedClient02(target, moveSide)");
    expect(move).toContain("Check status before trying again.");
    expect(move).toContain("If Minecraft is maximized or minimized");
    expect(move).not.toContain("Restore Minecraft to a normal window, then check status");
    expect(app).toContain("lastCheckIsCurrent ?");
  });
  it("keeps IPC outcome effects subordinate to later UI navigation", () => {
    expect(app).toContain("let navigationRevision = 0;");
    for (const operation of [
      "checkStatus", "openMinecraft01", "selectMinecraft",
      "openMinecraft02", "switchMinecraft02", "moveMinecraft02",
    ]) {
      const body = app.split(`async function ${operation}()`)[1]?.split("async function ")[0] ?? "";
      expect(body).toContain("const requestRevision = navigationRevision;");
      expect(body).not.toMatch(/reportIssue\([\s\S]*?, error\);/);
    }
    expect(app).toContain('if (page === "instances" && requestRevision === navigationRevision &&');
    expect(app).toContain('(expanded === null || expanded === instance)');
    expect(app).toContain('expanded === "02" && detailMode === "issue") expanded = null;');
    expect(app).toContain('requestedPanel === "02" && expanded === requestedPanel && detailMode === requestedMode');
    expect(app).toContain('if (selected && page === "instances" && requestRevision === navigationRevision && expanded === "02")');
    expect(app).not.toContain("      issue = null;\n      detailMode = \"setup\";");
  });
  it("reconciles only picker-origin feedback and preserves ambiguous outcomes", () => {
    const picker = app.split("async function selectMinecraft()")[1]?.split("async function openMinecraft02()")[0] ?? "";
    expect(picker).toContain('shouldClearPickerIssue(issues["02"], selected)');
    expect(picker).toContain('issues = { ...issues, "02": undefined };');
    expect(picker).toContain('requestRevision, "executable-picker");');
    expect(picker).not.toContain('clearFeedback("02")');
    const report = app.split("function reportIssue(")[1]?.split("async function checkStatus()")[0] ?? "";
    expect(report).toContain('origin?: UiIssue["origin"]');
    expect(report).toContain('...(origin ? { origin } : {})');
  });
  it("retains canceled file-picker errors until actual reinspection", () => {
    const picker = app.split("async function selectMinecraft()")[1]?.split("async function openMinecraft02()")[0] ?? "";
    expect(picker).not.toContain("issue = null;");
    expect(picker).toContain("if (selected && selected !== selectedExecutable)");
    expect(picker).toContain('if (selected && page === "instances"');
  });

  it("keeps keyboard focus inside the mounted page after Settings navigation", () => {
    expect(app).toContain("function showSettings()");
    expect(app).toContain("function showInstances()");
    expect(app).toContain('page === "settings" && settingsBackButton?.isConnected');
    expect(app).toContain('page === "instances" && checkStatusButton?.isConnected && !checkStatusButton.disabled');
    expect(app).toContain('on:click={showSettings}>Settings</button>');
    expect(app).toContain('on:click={showInstances}>Back to Virtuals</button>');
    expect(app).toContain('openClient02DetailsFromSettings("setup")');
    expect(app).toContain('openClient02DetailsFromSettings("move")');
    expect(app).toContain('page === "instances" && expanded === "02" && detailMode === mode && client02DetailPanel?.isConnected');
    expect(app).toContain("client02DetailPanel.focus()");
    expect(app).toContain('tabindex="-1" bind:this={client02DetailPanel}');
  });
  it("does not steal focus from Settings or newly expanded details after an async close", () => {
    expect(app).toContain('if (page !== "instances" || expanded !== null) return;');
    expect(app).toContain("checkStatusButton?.isConnected && !checkStatusButton.disabled");
    expect(app).toContain("disclosureTrigger = null;");
    expect(app).not.toMatch(/on:click=\{\(\) => \(page =/);
  });

  it("uses the selected Client 02 detail mode even if an earlier issue persists", () => {
    // Issue status may remain available through View issue, but selecting
    // Set up in Settings must not be trapped in the previous issue panel.
    expect(app).toContain('{#if detailMode === "issue"}');
    expect(app).not.toContain('{#if detailMode === "issue" || issue?.instance === "02"}');
    expect(app).toContain('{:else if detailMode === "setup"}');
    expect(app).toContain('{:else if detailMode === "move" && moveEligible}');
    expect(app).toContain('if (action === "issue") { expandDetails(id, "issue", origin); return; }');
    expect(app).toContain('on:click={() => openClient02DetailsFromSettings("setup")}');
  });
  it("never toggles an already visible issue closed from View issue", () => {
    expect(app).toContain('if (action === "issue") { expandDetails(id, "issue", origin); return; }');
    expect(app).toContain('if (action === "setup") toggleDetails(id, "setup", origin);');
    expect(app).toContain('id="cm-details-01"');
    expect(app).toContain('id="cm-details-02"');
    expect(app).toContain('aria-controls="cm-details-02"');
  });
});
