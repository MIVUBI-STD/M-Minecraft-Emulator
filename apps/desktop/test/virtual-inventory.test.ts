import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseVirtualBoxInventory } from "../src/app/bridge/nativeFeasibilityApi.js";

const inventory = (boxes: string[] = []) => ({
  schema: 1,
  source: "EXISTING_OFFICIAL_SANDBOXIE_PILOT",
  evidence: "BOX_NAMES_ONLY",
  boxes,
  ownedProviderSelected: false,
  gameplayVerified: false,
});

describe("existing virtual names in one MIVUBI desktop", () => {
  it("accepts a real names-only snapshot and an actually empty inventory", () => {
    const names = parseVirtualBoxInventory(inventory(["MinecraftClient02", "TestBox"]));
    expect(names.boxes).toEqual(["MinecraftClient02", "TestBox"]);
    expect(names.ownedProviderSelected).toBe(false);
    expect(names.gameplayVerified).toBe(false);
    expect(parseVirtualBoxInventory(inventory()).boxes).toEqual([]);
  });

  it("rejects invalid and duplicate names regardless of case", () => {
    for (const boxes of [
      ["Box", "box"], ["Bad Name"], ["../../Outside"], ["A\\B"],
      [""], [":bad"], ["a".repeat(33)], Array.from({length:129}, (_,i)=>"Box"+i),
    ]) {
      expect(() => parseVirtualBoxInventory(inventory(boxes))).toThrow(TypeError);
    }
  });

  it("refuses fabricated provider ownership, game readiness, and accounts", () => {
    const base = inventory(["MinecraftClient02"]);
    for (const altered of [
      { source: "MIVUBI_OWNED_ENGINE" },
      { evidence: "BOXES_READY" },
      { ownedProviderSelected: true },
      { gameplayVerified: true },
      { schema: 2 },
      { userAccount: "not allowed" },
      { boxes: "MinecraftClient02" },
    ]) {
      expect(() => parseVirtualBoxInventory({...base, ...altered})).toThrow(TypeError);
    }
  });
});

describe("Sandboxie box discovery completeness", () => {
  it("does not hide disabled boxes or treat GlobalSettings as a sandbox", () => {
    const upstream = readFileSync(new URL(
      "../../../engine/isolation-owned/Sandboxie/apps/ini/query.c", import.meta.url), "utf8");
    const collector = readFileSync(new URL(
      "../../../tooling/acceptance/windows/collect-virtual-boxes.ps1", import.meta.url), "utf8");
    // Actual upstream source only filters disabled boxes with /boxes.
    expect(upstream).toContain("if (boxes) {");
    expect(upstream).toContain("SbieApi_IsBoxEnabled(section_name)");
    expect(upstream).toContain('printf("GlobalSettings\\n")');
    expect(collector).toContain("$sections = @(& $ini query '*' 2>$null)");
    expect(collector).not.toContain("$ini query /boxes");
    expect(collector).toContain("([string]$sections[0]).Trim() -cne 'GlobalSettings'");
    expect(collector).toContain("Select-Object -Skip 1");
    expect(collector).toContain("$sections.Count -gt 129");
    // A displayed official box name is never owned-provider or game proof.
    expect(collector).toContain("ownedProviderSelected = $false");
    expect(collector).toContain("gameplayVerified = $false");
  });
});
