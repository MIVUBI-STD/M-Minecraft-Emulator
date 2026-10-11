import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const root = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
const app = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const router = readFileSync(new URL("../../../tooling/windows-toolchain/dev.ps1", import.meta.url), "utf8");

describe("Emulator source verification routing", () => {
  it("has exactly one repository-to-desktop-to-runtime verification route", () => {
    expect(root.scripts["verify:source"].split(" && ")).toEqual([
      "npm run verify:repository -- --g0",
      "npm run test:feasibility",
      "npm run check:desktop",
      "npm run check:runtime",
      "npm run test:runtime",
      "npm run format:runtime",
    ]);
    expect(root.scripts["check:desktop"]).toBe("npm --prefix apps/desktop run verify:source");
    expect(root.scripts["check:runtime"]).toContain("engine/runtime-core/Cargo.toml");
    expect(root.scripts["test:runtime"]).toContain("engine/runtime-core/Cargo.toml");
  });

  it("runs desktop tests and source compilation checks without packaging", () => {
    expect(app.scripts["verify:source"]).toBe(
      "npm run typecheck && npm run test && npm run build:frontend && npm run check:rust && npm run test:rust",
    );
    expect(app.scripts["check:rust"]).toContain("npm run prepare:icons && cargo check");
    expect(app.scripts["test:rust"]).toContain("cargo test --all-targets");
    expect(root.scripts["verify:source"]).not.toMatch(/build:app|dev:app|vmrun/);
    expect(app.scripts["check:rust"]).toContain(" --locked ");
    expect(app.scripts["test:rust"]).toContain(" --locked ");
    expect(app.scripts["build:app"]).toContain(" -- --locked");
  });

  it("routes the optional Windows entrypoint through source checks", () => {
    expect(router).toContain("& npm @NpmArguments");
    expect(router).toMatch(/"check"\s*\{ Invoke-RepositoryNpm -NpmArguments @\("run", "verify:source"\) \}/);
    expect(router).toMatch(/"setup"\s*\{ Invoke-RepositoryNpm -NpmArguments @\("run", "setup"\) \}/);
    expect(router).not.toMatch(/virtual-clients:verify|M-Bedrock-Dev/);
  });
});
