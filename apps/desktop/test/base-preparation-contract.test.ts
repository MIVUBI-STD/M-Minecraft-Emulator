import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { basePreparation } from "../src/app/bridge/payloadValidation.js";
import { parseSuccessEnvelope, type BasePreparationReport } from "../src/contracts.js";

describe("Base preparation public contract", () => {
  it("accepts read-only Base preflight facts without setup authority", () => {
    const report = parseSuccessEnvelope<BasePreparationReport>(JSON.stringify({
      schema: 1,
      data: {
        platform: "windows",
        provider: "vmware-workstation",
        providerVersion: "17.6",
        nativeVersion: "1.21.120.0",
        nativeInstallType: "DESKTOP",
        baseExpectedPath: "C:/Base/Base.vmx",
        basePresent: true,
        baseStopped: true,
        baseState: null,
        configuredMemoryMb: 4096,
        configuredVcpus: 2,
        graphics3dEnabled: true,
        networkPresent: true,
        networkStartConnected: true,
        networkConnectionType: "nat"
      }
    }), basePreparation);
    expect(report.basePresent).toBe(true);
    expect((report as unknown as Record<string, unknown>).nextSetupAction).toBeUndefined();
  });
  it("uses the official 32-bit Minecraft Education Desktop registry view after EXE installation", () => {
    const source = readFileSync(new URL("../../../engine/guest/windows/prepare-base.ps1", import.meta.url), "utf8");
    const profile = readFileSync(new URL("../../../engine/runtime-core/src/profile.rs", import.meta.url), "utf8");
    expect(source).toContain("[Microsoft.Win32.RegistryView]::Registry32");
    expect(source).toContain("OpenBaseKey(");
    expect(source).toContain("GetValue('Version', '')");
    expect(source).not.toContain("Get-ItemProperty -LiteralPath $registryPath -Name Version");
    expect(source).toContain("[IO.Path]::GetExtension($MinecraftInstaller)");
    expect(source).toContain("INSTALL_UPDATER=");
    expect(profile).toContain('"/reg:32"');
  });

});
