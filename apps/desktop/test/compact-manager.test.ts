import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  client02Presentation, focusCandidate, rowPresentation,
  safeErrorDetails, setupInstruction,
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
  it("mounts exactly one compact UI with no new native providers", () => {
    expect(entry).toContain('mount(CompactManagerApp, { target });');
    expect(entry).not.toContain("NativeFeasibilityApp");
    expect(app).not.toContain("<aside");
    expect(app).toContain("Instances");
    expect(app).toContain("Settings");
    expect(bootstrap).not.toContain("commands::virtual_clients::virtual_clients_");
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
    expect(app).toContain("checkStatusButton?.focus()");
    expect(app).toContain('<svelte:window on:keydown={handleWindowKeydown} />');
    expect(app).toContain('event.key !== "Escape"');
    expect(app.match(/on:click={closeDetails}>Close details/g)).toHaveLength(2);
  });
  it("keeps keyboard focus inside the mounted page after Settings navigation", () => {
    expect(app).toContain("function showSettings()");
    expect(app).toContain("function showInstances()");
    expect(app).toContain("settingsBackButton?.focus()");
    expect(app).toContain("checkStatusButton?.focus()");
    expect(app).toContain('on:click={showSettings}>Settings</button>');
    expect(app).toContain('on:click={showInstances}>Back to Instances</button>');
    expect(app).toContain('openClient02DetailsFromSettings("setup")');
    expect(app).toContain('openClient02DetailsFromSettings("move")');
    expect(app).toContain("client02DetailPanel?.focus()");
    expect(app).toContain('tabindex="-1" bind:this={client02DetailPanel}');
  });
  it("does not steal focus from Settings or newly expanded details after an async close", () => {
    expect(app).toContain('if (page !== "instances" || expanded !== null) return;');
    expect(app).toContain("checkStatusButton?.isConnected && !checkStatusButton.disabled");
    expect(app).toContain("disclosureTrigger = null;");
    expect(app).not.toMatch(/on:click=\{\(\) => \(page =/);
  });

  it("never toggles an already visible issue closed from View issue", () => {
    expect(app).toContain('if (action === "issue") { expandDetails(id, "issue", origin); return; }');
    expect(app).toContain('if (action === "setup") toggleDetails(id, "setup", origin);');
    expect(app).toContain('id="cm-details-01"');
    expect(app).toContain('id="cm-details-02"');
    expect(app).toContain('aria-controls="cm-details-02"');
  });
});
