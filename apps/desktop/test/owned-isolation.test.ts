import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseOwnedCandidateInspection } from "../src/app/bridge/nativeFeasibilityApi.js";

const candidate = () => ({
  schema: 1,
  state: "CANDIDATE_INTEGRITY_VERIFIED_NOT_INSTALLABLE",
  upstreamCommit: "abd4c240031cfb46666daa74ca47ed4e48b561e4",
  verifiedArtifactCount: 24,
  requiredArtifactCount: 23,
  providerSelected: false,
  driverLoadVerified: false,
  gameplayVerified: false,
  installPermitted: false,
});

describe("Owned isolation candidate — strictly read-only", () => {
  it("accepts staged artifact integrity without claiming readiness", () => {
    expect(parseOwnedCandidateInspection(candidate())).toEqual(candidate());
  });

  it("rejects inflated readiness, altered source and incomplete assets", () => {
    const overrides = [
      { providerSelected: true }, { driverLoadVerified: true },
      { gameplayVerified: true }, { installPermitted: true },
      { verifiedArtifactCount: 22 }, { verifiedArtifactCount: 49 },
      { requiredArtifactCount: 16 }, { schema: 2 },
      { state: "INSTALLED_AND_READY" }, { upstreamCommit: "0".repeat(40) },
      { surpriseEmail: "private@example.invalid" },
    ];
    for (const override of overrides) {
      expect(() => parseOwnedCandidateInspection({ ...candidate(), ...override })).toThrow();
    }
  });

  it("exposes one read-only desktop route without switching active backend", () => {
    const engine = readFileSync(new URL("../src-tauri/src/engine/native_clients.rs", import.meta.url), "utf8");
    const owned = readFileSync(new URL("../src-tauri/src/engine/owned_isolation.rs", import.meta.url), "utf8");
    const bootstrap = readFileSync(new URL("../src-tauri/src/app_bootstrap.rs", import.meta.url), "utf8");
    const commands = readFileSync(new URL("../src-tauri/src/commands/native_clients.rs", import.meta.url), "utf8");
    const screen = readFileSync(new URL("../src/CompactManagerApp.svelte", import.meta.url), "utf8");
    expect(engine).toContain("const ACTIVE_ISOLATION_BACKEND: OfficialSandboxieBackend");
    expect(engine).toContain("inspect_owned_engine_candidate(");
    expect(owned).toContain("CANDIDATE_INTEGRITY_VERIFIED_NOT_INSTALLABLE");
    expect(owned).toContain("driver_load_verified: false");
    expect(owned).toContain("install_permitted: false");
    expect(bootstrap).toContain("commands::native_clients::desktop_inspect_owned_engine_candidate,");
    expect(bootstrap).toContain("commands::native_clients::desktop_select_owned_engine_candidate_directory,");
    expect(commands).toContain("fn desktop_inspect_owned_engine_candidate(");
    expect(screen).toContain("Inspect engine candidate");
    expect(screen).toContain("No engine was activated.");
  });
});
