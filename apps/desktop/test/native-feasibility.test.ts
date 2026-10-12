import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseNativeObservation, parseIsolatedClientObservation } from "../src/app/bridge/nativeFeasibilityApi.js";

const fixture = () => ({
  schema: 1,
  evidenceClass: "NAME_MATCH_CANDIDATE_ONLY",
  interactiveSession: true,
  candidates: [
    { pid: 123, windowHandle: "0xAA" },
    { pid: 456, windowHandle: null },
  ],
});

describe("Native candidate IPC evidence", () => {
  it("accepts bounded candidate data without promoting it to Minecraft gameplay", () => {
    expect(parseNativeObservation(fixture())).toEqual(fixture());
    const empty = fixture();
    empty.candidates = [];
    expect(parseNativeObservation(empty).candidates).toHaveLength(0);
    expect(parseNativeObservation({ ...empty, interactiveSession: false }).interactiveSession).toBe(false);
  });

  it("fails closed for malformed schemas, PIDs, handles and excess processes", () => {
    const bad = [
      { ...fixture(), schema: 2 },
      { ...fixture(), evidenceClass: "GAMEPLAY_VERIFIED" },
      { ...fixture(), interactiveSession: "yes" },
      { ...fixture(), candidates: Array.from({ length: 17 }, (_, i) => ({pid: i + 1, windowHandle: null})) },
      { ...fixture(), candidates: [{ pid: 0, windowHandle: null }] },
      { ...fixture(), candidates: [{ pid: 0x100000000, windowHandle: null }] },
      { ...fixture(), candidates: [{ pid: NaN, windowHandle: null }] },
      { ...fixture(), candidates: [{ pid: 123, windowHandle: "0x0" }] },
      { ...fixture(), candidates: [{ pid: 123, windowHandle: "0xXYZ" }] },
      { ...fixture(), candidates: [{ pid: 123, windowHandle: "0x" }] },
      { ...fixture(), candidates: [
        { pid: 123, windowHandle: "0xAA" },
        { pid: 123, windowHandle: null },
      ] },
      { ...fixture(), candidates: [
        { pid: 123, windowHandle: "0xAA" },
        { pid: 456, windowHandle: "0xaa" },
      ] },
      { ...fixture(), candidates: [
        { pid: 123, windowHandle: "0xAA" },
        { pid: 456, windowHandle: "0x000aa" },
      ] },
    ];
    for (const report of bad) {
      expect(() => parseNativeObservation(report)).toThrow(TypeError);
    }
  });

  it("rejects injected account identifiers, window titles and process command lines", () => {
    expect(() => parseNativeObservation({
      ...fixture(),
      accountEmail: "hidden@example.com",
    })).toThrow(TypeError);
    expect(() => parseNativeObservation({
      ...fixture(),
      candidates: [{ pid: 123, windowHandle: null, commandLine: "secret" }],
    })).toThrow(TypeError);
    expect(() => parseNativeObservation({
      ...fixture(),
      candidates: [{ pid: 123, windowHandle: null, windowTitle: "private world" }],
    })).toThrow(TypeError);
  });

  it("registers native observation and exactly one isolated Client 02 launch experiment", () => {
    const bootstrap = readFileSync(new URL("../src-tauri/src/app_bootstrap.rs", import.meta.url), "utf8");
    const commands = readFileSync(new URL("../src-tauri/src/commands/native_clients.rs", import.meta.url), "utf8");
    const engine = readFileSync(new URL("../src-tauri/src/engine/native_clients.rs", import.meta.url), "utf8");
    const active = readFileSync(new URL("../src/NativeFeasibilityApp.svelte", import.meta.url), "utf8");
    const bridge = readFileSync(new URL("../src/app/bridge/nativeFeasibilityApi.ts", import.meta.url), "utf8");

    expect(bootstrap).toContain("commands::native_clients::desktop_open_native_minecraft,");
    expect(bootstrap).toContain("commands::native_clients::desktop_inspect_native_candidates,");
    expect(bootstrap).toContain("commands::native_clients::desktop_select_education_exe,");
    expect(bootstrap).toContain("commands::native_clients::desktop_request_sandbox_client_02,");
    expect(bootstrap).toContain("commands::native_clients::desktop_inspect_sandbox_client_02,");
    expect(bootstrap).toContain("commands::native_clients::desktop_focus_observed_client_02,");
    expect(bootstrap).toContain("commands::native_clients::desktop_place_observed_client_02,");
    expect(commands).toContain("fn desktop_inspect_sandbox_client_02(");
    expect(commands).toContain("fn desktop_focus_observed_client_02(");
    expect(commands).toContain("fn desktop_place_observed_client_02(");
    expect(engine).toContain("pub fn inspect_sandbox_client_02()");
    expect(engine).toContain("pub fn focus_observed_client_02(");
    expect(engine).toContain("pub fn place_observed_client_02(");
    expect(engine).toContain("fn with_verified_client_02_window(");
    expect(engine).toContain("GetMonitorInfoW(monitor, &mut info)");
    expect(engine).toContain("MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST)");
    expect(engine).toContain("SetWindowPos(");
    expect(engine).toContain("SWP_NOACTIVATE");
    expect(engine).toContain("SWP_NOZORDER");
    expect(engine).toContain("SWP_ASYNCWINDOWPOS");
    expect(engine).toContain("fn placement_slot_keeps_all_pieces_inside_monitor_work_area()");
    expect(engine).toContain("verify_fresh_focus_target(&target, &fresh)");
    expect(engine).toContain("GetProcessTimes(process, &mut created");
    expect(engine).toContain("GetWindowThreadProcessId(hwnd, &mut window_pid)");
    expect(engine).toContain("SetForegroundWindow(hwnd)");
    expect(engine).not.toContain("AllowSetForegroundWindow");
    expect(engine).not.toContain("SendInput(");
    expect(engine).toContain("include_str!(concat!(");
    expect(engine).toContain("WaitForExit(8000)");
    expect(engine).toContain("$launcher.ExitCode");
    expect(engine).toContain("-WorkingDirectory $gameFolder");
    expect(engine).toContain("observation.isolated_candidate_processes > 0");
    expect(engine).toContain("let mut launch_guard = acquire_client_02_launch()?;");
    expect(engine).toContain("*launch_guard = Some(Instant::now());");
    expect(engine).toContain("GetEnvironmentVariable('ProgramW6432')");
    expect(engine).toContain('observation.credential_host_access != "OFF"');
    expect(bridge).toContain('"desktop_inspect_sandbox_client_02"');
    expect(bridge).toContain('"desktop_focus_observed_client_02"');
    expect(bridge).toContain('"desktop_place_observed_client_02"');
    expect(active).toContain('nativeFeasibility.placeObservedClient02(target, side)');
    expect(active).toContain('placeClient02("LEFT")');
    expect(active).toContain('placeClient02("RIGHT")');
    expect(active).toContain("Client 01 was not moved.");
    expect(active).toContain("officialImageOutsideSelectedBoxCount");
    expect(active).toContain("signedImageOtherBoxCount");
    expect(active).toContain("signedImageUnknownBoxCount");
    expect(active).toContain("Neither result proves an unsandboxed native process.");
    expect(bridge).toContain("officialImageOutsideSelectedBoxCount");
    expect(engine).toContain("official_image_outside_selected_box_count");
    expect(active).toContain("Direct Sandboxie PID lookup unavailable");
    expect(active).toContain("nativeFeasibility.focusObservedClient02(target)");
    expect(active).toContain("disabled={busy || !focusTarget}");
    expect(active).not.toContain("SetForegroundWindow");
    expect(active).toContain("nativeFeasibility.inspectIsolatedClient02()");
    expect(active).not.toContain("Promise.allSettled");
    expect(active).toContain("observation = await nativeFeasibility.inspectIsolatedClient02()");
    expect(active).not.toContain("nativeFeasibility.inspectCandidates()");
    expect(engine).toContain('["& {\\n", INSPECT, "\\n} -SummaryOnly"].concat()');
    expect(engine).toContain('["& {\\n", INSPECT, "\\n} -SummaryOnly -ImageProof"].concat()');
    expect(engine).toContain("inspect_sandbox_client_02_mode(true)");
    expect(engine).toContain("inspect_sandbox_client_02_mode(false)");
    expect(engine).toContain("let fresh = inspect_sandbox_client_02_fast()?;");
    expect(engine).toContain("let observation = inspect_sandbox_client_02_fast()?;");
    expect(engine).toContain("admit_client_02_launch_snapshot(&observation)?;");
    expect(engine).toContain('if observation.membership_status != "OBSERVED"');
    expect(engine).toContain("fn client_02_launch_requires_observed_empty_box()");
    expect(active).toContain('observation.membershipStatus !== "OBSERVED"');
    const sandboxList = readFileSync(new URL("../../../tooling/acceptance/windows/collect-sandboxie-feasibility.ps1", import.meta.url), "utf8");
    expect(sandboxList).toContain("$count -ge 0 -and $count -le 256");
    expect(sandboxList).toContain("if ($gameCandidates.Count -gt 16)");
    expect(active).toContain('typeof reason === "string"');
    expect(commands).toContain("fn desktop_request_sandbox_client_02(");
    expect(engine).toContain("pub fn request_sandbox_client_02(");
    expect(engine).toContain('const CLIENT_02_BOX_NAME: &str = "MinecraftClient02";');
    expect(engine).toContain("$box = '{box_name}'");
    expect(engine).toContain("('/box:' + $box)");
    expect(engine).toContain("AutoDelete");
    expect(engine).toContain("AutoRemove");
    expect(engine).toContain("Get-AuthenticodeSignature");
    expect(engine).toContain("O=Microsoft Corporation");
    expect(engine).toContain("$signature.Status -ne 'Valid'");
    expect(engine).toContain("Start-Process -FilePath $start");
    expect(engine).not.toContain("delete_sandbox");
    expect(engine).not.toContain("/terminate_all");
    expect(bridge).toContain('"desktop_request_sandbox_client_02"');
    expect(active).toContain("nativeFeasibility.requestSandboxClient02(");
    expect(bootstrap).not.toContain("commands::virtual_clients::virtual_clients_");
    expect(bootstrap).not.toContain("commands::setup_tools::setup_");
    expect(bootstrap).not.toContain("commands::window_arrangement::window_");

    expect(commands).toContain("fn desktop_inspect_native_candidates(");
    expect(engine).toContain("pub fn inspect_native_candidates()");
    expect(bridge).toContain('"desktop_inspect_native_candidates"');
    expect(active).toContain("nativeFeasibility.inspectIsolatedClient02()");
    expect(active).toContain("nativeFeasibility.openOfficialMinecraft()");
    expect(active).not.toContain("backend.");
  });

  it("accepts only non-authoritative isolated process and box observations", () => {
    const valid = {
      schema: 6, boxName: "MinecraftClient02", stage: "INSPECT",
      boxConfigured: "YES", boxSettingsSource: "BOX_SECTION_ENUMERATED",
      autoDelete: "OFF", autoRemove: "OFF", credentialHostAccess: "OFF",
      membershipStatus: "OBSERVED", interactiveSession: true,
      processEvidenceClass: "NAME_MATCH_CANDIDATE_ONLY",
      candidateProcessCount: 2,
      processCandidates: [
        { pid: 101, createdFileTime: "133400000000000000", windowHandle: "0x100", inSelectedBox: false, imageEvidence: "SIGNED_EDUCATION_IMAGE_CANDIDATE" },
        { pid: 202, createdFileTime: "133400000000000001", windowHandle: "0x200", inSelectedBox: true, imageEvidence: "UNKNOWN" },
      ],
      officialImageOutsideSelectedBoxCount: 1,
      directPidQuery: "QUERIED",
      signedImageOtherBoxCount: 0,
      signedImageUnknownBoxCount: 1,
      isolatedCandidateProcesses: 1,
      nativeVisibleCandidates: 1, isolatedVisibleCandidates: 1,
      interpretation: "CONFIG_AND_PROCESS_CANDIDATES_ONLY_NO_AUTHENTICATION_PROOF",
    };
    expect(parseIsolatedClientObservation(valid)).toEqual(valid);
    expect(parseIsolatedClientObservation({
      ...valid, signedImageOtherBoxCount: 1, signedImageUnknownBoxCount: 0,
    }).directPidQuery).toBe("QUERIED");
    expect(parseIsolatedClientObservation({
      ...valid, directPidQuery: "UNAVAILABLE",
    }).directPidQuery).toBe("UNAVAILABLE");
    const invalid = [
      { ...valid, boxName: "AnotherBox" },
      { ...valid, boxConfigured: "UNKNOWN" },
      { ...valid, boxSettingsSource: "UNKNOWN" },
      { ...valid, credentialHostAccess: "GAMEPLAY_VERIFIED" },
      { ...valid, candidateProcessCount: 1 },
      { ...valid, isolatedCandidateProcesses: 0 },
      { ...valid, isolatedCandidateProcesses: 3 },
      { ...valid, schema: 5 },
      { ...valid, directPidQuery: "NATIVE_VERIFIED" },
      { ...valid, directPidQuery: "NOT_REQUESTED" },
      { ...valid, signedImageOtherBoxCount: 2 },
      { ...valid, signedImageUnknownBoxCount: 0 },
      { ...valid, directPidQuery: "UNAVAILABLE", signedImageOtherBoxCount: 1, signedImageUnknownBoxCount: 0 },
      { ...valid, officialImageOutsideSelectedBoxCount: 0 },
      { ...valid, processCandidates: [
        valid.processCandidates[0],
        { ...valid.processCandidates[1], imageEvidence: "SIGNED_EDUCATION_IMAGE_CANDIDATE" },
      ] },
      { ...valid, processCandidates: [
        { ...valid.processCandidates[0], imageEvidence: "NATIVE_AUTHENTICATED" },
        valid.processCandidates[1],
      ] },
      { ...valid, processCandidates: [] },
      { ...valid, processCandidates: [
        { ...valid.processCandidates[0], pid: 202 }, valid.processCandidates[1],
      ] },
      { ...valid, processCandidates: [
        valid.processCandidates[0], { ...valid.processCandidates[1], createdFileTime: "0" },
      ] },
      { ...valid, processCandidates: [
        valid.processCandidates[0], { ...valid.processCandidates[1], createdFileTime: 133400000000000000 },
      ] },
      { ...valid, processCandidates: [
        valid.processCandidates[0], { ...valid.processCandidates[1], inSelectedBox: false },
      ] },
      { ...valid, processCandidates: [
        valid.processCandidates[0], { ...valid.processCandidates[1], windowHandle: "0x100" },
      ] },
      { ...valid, nativeVisibleCandidates: 17 },
      { ...valid, membershipStatus: "UNKNOWN" },
      { ...valid, accountEmail: "forbidden@example.com" },
    ];
    for (const item of invalid) expect(() => parseIsolatedClientObservation(item)).toThrow(TypeError);
    expect(parseIsolatedClientObservation({
      ...valid, membershipStatus: "UNKNOWN",
      nativeVisibleCandidates: 0, isolatedVisibleCandidates: 0, isolatedCandidateProcesses: 0,
      officialImageOutsideSelectedBoxCount: 0,
      directPidQuery: "NOT_REQUESTED",
      signedImageOtherBoxCount: 0,
      signedImageUnknownBoxCount: 0,
      processCandidates: valid.processCandidates.map(p => ({ ...p, inSelectedBox: null, imageEvidence: "UNKNOWN" })),
    }).membershipStatus).toBe("UNKNOWN");
    expect(parseIsolatedClientObservation({
      ...valid, processCandidates: [
        valid.processCandidates[0],
        { ...valid.processCandidates[1], createdFileTime: null },
      ],
    }).processCandidates[1].createdFileTime).toBeNull();
  });

  it("uses only generic live names without changing legacy installed identity", () => {
    const screen = readFileSync(new URL("../src/NativeFeasibilityApp.svelte", import.meta.url), "utf8");
    const backend = readFileSync(new URL("../src-tauri/src/engine/native_clients.rs", import.meta.url), "utf8");
    const pilotLease = readFileSync(new URL("../src-tauri/src/engine/app_instance.rs", import.meta.url), "utf8");
    const sandboxCollector = readFileSync(new URL("../../../tooling/acceptance/windows/collect-sandboxie-feasibility.ps1", import.meta.url), "utf8");
    const desktopConfig = JSON.parse(readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
    expect(screen).toContain("Minecraft Instance Manager");
    expect(screen).toContain("MinecraftClient02");
    expect(screen).toContain("native unverified");
    expect(screen).toContain("WinCred bypass configuration");
    expect(screen).not.toContain("MIVUBI");
    expect(backend).toContain('const CLIENT_02_BOX_NAME: &str = "MinecraftClient02";');
    expect(sandboxCollector).toContain("BoxName = 'MinecraftClient02'");
    expect(pilotLease).toContain('.join("MinecraftInstanceManager")');
    expect(pilotLease).toContain('.join("NativePilot")');
    expect(desktopConfig.app.windows[0].title).toBe("Minecraft Instance Manager");
    expect(desktopConfig.productName).toBe("M-Bedrock Virtual Clients");
    expect(desktopConfig.identifier).toBe("com.mivubi.mbedrock.virtualclients");
  });

  it("keeps the new inspection read-only and no implicit polling", () => {
    const engine = readFileSync(new URL("../src-tauri/src/engine/native_clients.rs", import.meta.url), "utf8");
    const section = engine.slice(
      engine.indexOf("pub fn inspect_native_candidates()"),
      engine.indexOf("pub fn open_native_minecraft()")
    );
    const active = readFileSync(new URL("../src/NativeFeasibilityApp.svelte", import.meta.url), "utf8");
    expect(section).toContain("Get-Process");
    const pattern = "^(Minecraft\\.Windows|Minecraft.*Education.*|Education.*Minecraft.*)$";
    const collector = readFileSync(new URL("../../../tooling/acceptance/windows/collect-native-feasibility.ps1", import.meta.url), "utf8");
    const isolated = readFileSync(new URL("../../../tooling/acceptance/windows/collect-sandboxie-feasibility.ps1", import.meta.url), "utf8");
    for (const source of [engine, collector, isolated]) expect(source).toContain(pattern);
    expect(new RegExp(pattern, "i").test("Minecraft.Windows")).toBe(true);
    expect(new RegExp(pattern, "i").test("EducationHelper")).toBe(false);
    expect(new RegExp(pattern, "i").test("MinecraftJava")).toBe(false);
    expect(engine).toContain("RegistryView]::Registry32");
    expect(engine).toContain("Get-AppxPackage -Name 'Microsoft.MinecraftEducationEdition'");
    expect(engine).toContain("Get-StartApps");
    expect(section).not.toContain("Start-Process");
    expect(section).not.toContain("Get-Content");
    expect(section).not.toContain("Set-Item");
    expect(active).not.toContain("onMount(");
    expect(active).not.toContain("setInterval");
    expect(active).not.toContain("localStorage");
  });
});
