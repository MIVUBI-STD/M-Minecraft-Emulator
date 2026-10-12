import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseNativeObservation } from "../src/app/bridge/nativeFeasibilityApi.js";

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

  it("registers only the two native Desktop operations in active Tauri", () => {
    const bootstrap = readFileSync(new URL("../src-tauri/src/app_bootstrap.rs", import.meta.url), "utf8");
    const commands = readFileSync(new URL("../src-tauri/src/commands/native_clients.rs", import.meta.url), "utf8");
    const engine = readFileSync(new URL("../src-tauri/src/engine/native_clients.rs", import.meta.url), "utf8");
    const active = readFileSync(new URL("../src/NativeFeasibilityApp.svelte", import.meta.url), "utf8");
    const bridge = readFileSync(new URL("../src/app/bridge/nativeFeasibilityApi.ts", import.meta.url), "utf8");

    expect(bootstrap).toContain("commands::native_clients::desktop_open_native_minecraft,");
    expect(bootstrap).toContain("commands::native_clients::desktop_inspect_native_candidates,");
    expect(bootstrap).not.toContain("commands::virtual_clients::virtual_clients_");
    expect(bootstrap).not.toContain("commands::setup_tools::setup_");
    expect(bootstrap).not.toContain("commands::window_arrangement::window_");

    expect(commands).toContain("fn desktop_inspect_native_candidates(");
    expect(engine).toContain("pub fn inspect_native_candidates()");
    expect(bridge).toContain('"desktop_inspect_native_candidates"');
    expect(active).toContain("nativeFeasibility.inspectCandidates()");
    expect(active).toContain("nativeFeasibility.openOfficialMinecraft()");
    expect(active).not.toContain("backend.");
  });

  it("keeps the new inspection read-only and no implicit polling", () => {
    const engine = readFileSync(new URL("../src-tauri/src/engine/native_clients.rs", import.meta.url), "utf8");
    const section = engine.slice(
      engine.indexOf("pub fn inspect_native_candidates()"),
      engine.indexOf("pub fn open_native_minecraft()")
    );
    const active = readFileSync(new URL("../src/NativeFeasibilityApp.svelte", import.meta.url), "utf8");
    expect(section).toContain("Get-Process");
    expect(section).not.toContain("Start-Process");
    expect(section).not.toContain("Get-Content");
    expect(section).not.toContain("Set-Item");
    expect(active).not.toContain("onMount(");
    expect(active).not.toContain("setInterval");
    expect(active).not.toContain("localStorage");
  });
});
