import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { actionLabel } from "../src/view-model.js";
import { setupExperience, setupPhaseIndex, shouldShowClientControls } from "../src/app/setupFlow.js";

describe("Virtual Clients first-run presentation", () => {
  it("keeps the native multi-instance experiment separate from account or VM proof", () => {
    const probe = readFileSync(new URL("../../../tooling/acceptance/windows/probe-native-multi-instance.ps1", import.meta.url), "utf8");
    expect(probe).toContain("[string]$Mode = 'OBSERVE'");
    expect(probe).toContain("Start-Process -FilePath 'explorer.exe'");
    expect(probe).toContain("simultaneousDistinctAccounts = 'NOT_VERIFIED'");
    expect(probe).toContain("minecraftGameplay = 'NOT_VERIFIED'");
    expect(probe).toContain("verdict = 'INCONCLUSIVE'");
    expect(probe).not.toContain("Get-Credential");
    expect(probe).not.toContain("Stop-Process");
  });

  it("routes client-owned setup phases to actual client controls instead of a looping wizard", () => {
    for (const action of ["VERIFY_IDENTITIES", "CREATE_READY_SNAPSHOTS", "REPROVISION_VIRTUALS", "READY"] as const) {
      expect(shouldShowClientControls(action)).toBe(true);
    }
    for (const action of ["INSTALL_PROVIDER", "PREPARE_BASE", "REGISTER_BASE", "FINALIZE_BASE", "PROVISION_VIRTUALS", "RUNTIME_DATA_INCOMPATIBLE"] as const) {
      expect(shouldShowClientControls(action)).toBe(false);
    }
    const app = readFileSync(new URL("../src/App.svelte", import.meta.url), "utf8");
    expect(app).toContain('!shouldShowClientControls(snapshot.doctor.nextSetupAction)');
    expect(app).not.toContain('page === "clients" && !setupComplete');
    expect(app).toContain('onVerifyIdentities={() => mutate("verify-identities", backend.verifyIdentities)}');
    const wizard = readFileSync(new URL("../src/app/surfaces/SetupSurface.svelte", import.meta.url), "utf8");
    expect(wizard).not.toContain("onOpenClients");
    expect(wizard).not.toContain('experience.owner === "CLIENTS"');
  });

  it("presents the one-native-plus-three-virtual objective without faking a native login", () => {
    const app = readFileSync(new URL("../src/App.svelte", import.meta.url), "utf8");
    const clients = readFileSync(new URL("../src/app/surfaces/ClientsSurface.svelte", import.meta.url), "utf8");
    expect(app).toContain("{native}");
    expect(clients).toContain("Four Minecraft Education clients");
    expect(clients).toContain("Native game process and account sign-in are not automatically verified");
    expect(clients).toContain("Start virtual clients");
  });

  it("keeps backend nextSetupAction as the only setup input", () => {
    expect(setupExperience("REGISTER_BASE").owner).toBe("APP");
    expect(setupExperience("FINALIZE_BASE").owner).toBe("USER");
    expect(setupExperience("VERIFY_IDENTITIES").owner).toBe("CLIENTS");
    expect(setupExperience("RUNTIME_DATA_INCOMPATIBLE").owner).toBe("BLOCKED");
  });

  it("does not claim Base or Sysprep work is automated", () => {
    expect(setupExperience("PREPARE_BASE").owner).toBe("USER");
    expect(setupExperience("FINALIZE_BASE").steps.join(" ")).toMatch(/finalization|generalize/i);
  });

  it("projects a monotonic four-phase setup view", () => {
    expect(setupPhaseIndex("INSTALL_PROVIDER")).toBe(0);
    expect(setupPhaseIndex("REGISTER_BASE")).toBe(1);
    expect(setupPhaseIndex("PROVISION_VIRTUALS")).toBe(2);
    expect(setupPhaseIndex("CREATE_READY_SNAPSHOTS")).toBe(3);
  });
  it("uses one recreation term in setup navigation and guidance", () => {
    expect(actionLabel("REPROVISION_VIRTUALS")).toBe("Recreate outdated clients");
    expect(setupExperience("REPROVISION_VIRTUALS").title).toBe(actionLabel("REPROVISION_VIRTUALS"));
    expect(setupExperience("REPROVISION_VIRTUALS").owner).toBe("CLIENTS");
  });

  it("labels completed setup without claiming gameplay readiness", () => {
    expect(actionLabel("READY")).toBe("Setup complete");
    expect(setupExperience("READY").title).toBe(actionLabel("READY"));
  });
  it("keeps interactive launcher registration per Virtual after OOBE", () => {
    const steps = setupExperience("VERIFY_IDENTITIES").steps.join(" ");
    expect(steps).toContain("Enable Virtual Clients Launcher");
    expect(setupExperience("CREATE_READY_SNAPSHOTS").steps.join(" ")).toMatch(/same virtual Windows session/i);
  });

  it("directs first boot through explicit setup startup and all-three verification", () => {
    const steps = setupExperience("VERIFY_IDENTITIES").steps.join(" ");
    expect(steps).toContain("Start first-time setup");
    expect(steps).toContain("all three clients running together");
    expect(steps).toContain("Check clients");
  });
});
