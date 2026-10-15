import { describe, expect, it } from "vitest";
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
