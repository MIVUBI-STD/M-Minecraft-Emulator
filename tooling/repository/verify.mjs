import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const requireFact = (condition, message) => {
  if (!condition) throw new Error(message);
};
const required = [
  "README.md", "AGENTS.md", "GITHUB_RULES.md", "CONTEXT.md", "CONTRIBUTING.md",
  "SECURITY.md", "VERSION", "DEV.cmd", ".agents/skills/emulator-development/SKILL.md",
  "planning/development.md", "docs/README.md", "docs/system/implementation-map.md",
  "apps/desktop/package.json", "apps/desktop/package-lock.json",
  "apps/desktop/src-tauri/Cargo.toml", "apps/desktop/src-tauri/tauri.conf.json",
  "engine/runtime-core/Cargo.toml", "engine/distribution/release-channel.json",
  "tooling/acceptance/windows/collect-acceptance.ps1",
  ".github/workflows/verify.yml", ".github/workflows/package-smoke.yml",
  "docs/validation/client-feasibility.md",
  "docs/product/four-concurrent-accounts.md",
  "tooling/acceptance/windows/probe-native-multi-instance.ps1",
  "tooling/acceptance/windows/collect-client-feasibility.ps1",
  "tooling/acceptance/evaluate-client-feasibility.mjs",
  "tooling/acceptance/evaluate-client-feasibility.test.mjs"
];
for (const file of required) {
  requireFact(existsSync(resolve(root, file)), "Missing canonical repository owner: " + file);
}
// Root governance continuity is source-owned; keep it within this verifier.
for (const [file, markers] of Object.entries({
  "AGENTS.md": ["ChatGPT-GitHub Work Continuity", "Short-prompt repository startup", "Cross-chat recovery"],
  "GITHUB_RULES.md": ["Short-prompt repository startup", "Commit-based continuity", "Work:", "State:", "Proof:"],
  "CONTRIBUTING.md": ["GitHub-first", "planning/development.md"]
})) {
  const content = read(file);
  for (const marker of markers) {
    requireFact(content.includes(marker), "Missing governance continuity marker in " + file + ": " + marker);
  }
}
for (const retired of ["virtual-clients", "apps/virtual-clients", "tooling/verify-repository.mjs"]) {
  requireFact(!existsSync(resolve(root, retired)), "Obsolete monorepo path remains: " + retired);
}

const version = read("VERSION").trim();
const rootPackage = json("package.json");
const appPackage = json("apps/desktop/package.json");
const lock = json("apps/desktop/package-lock.json");
const tauri = json("apps/desktop/src-tauri/tauri.conf.json");
const tauriPackage = json("apps/desktop/src-tauri/tauri.package.conf.json");
const release = json("engine/distribution/release-channel.json");
const toolchain = json("toolchain.json");
const cargoVersion = (path) => /^version\s*=\s*"([^"]+)"/m.exec(read(path))?.[1];

requireFact(rootPackage.name === "m-minecraft-emulator", "Root package identity drift");
requireFact(version === rootPackage.version && version === appPackage.version &&
  version === tauri.version && version === cargoVersion("apps/desktop/src-tauri/Cargo.toml") &&
  version === cargoVersion("engine/runtime-core/Cargo.toml"), "Product version mismatch");
requireFact(toolchain.node.version === read(".node-version").trim(), "Node pin mismatch");
requireFact(toolchain.npm.lockfile === "apps/desktop/package-lock.json", "App lockfile path drift");
requireFact(toolchain.policy.ciPolicy === "manual-only", "Manual-only CI policy drift");
requireFact(lock.packages[""]?.version === appPackage.version, "Desktop lockfile version mismatch");
for (const [name, range] of Object.entries({ ...appPackage.dependencies, ...appPackage.devDependencies })) {
  requireFact(lock.packages[""]?.dependencies?.[name] === range ||
    lock.packages[""]?.devDependencies?.[name] === range, "Lock missing dependency: " + name);
  requireFact(lock.packages["node_modules/" + name], "Lock missing installed package: " + name);
}
requireFact(rootPackage.scripts["verify:repository"] === "node tooling/repository/verify.mjs",
  "Root static verifier route drift");
requireFact(rootPackage.scripts["check:desktop"].includes("apps/desktop"), "Desktop route drift");
requireFact(rootPackage.scripts["check:runtime"].includes("engine/runtime-core/Cargo.toml"),
  "Runtime check route drift");
requireFact(rootPackage.scripts["verify:source"].includes("npm run verify:repository"),
  "Aggregate source check omits repository contract");
requireFact(rootPackage.scripts["test:feasibility"] ===
  "node --test tooling/acceptance/evaluate-client-feasibility.test.mjs",
  "Single guest feasibility regression route drift");
requireFact(rootPackage.scripts["verify:source"].includes("npm run test:feasibility"),
  "Aggregate source check must include client-feasibility evidence regressions");
requireFact(read("apps/desktop/src/App.svelte").includes(
  "!shouldShowClientControls(snapshot.doctor.nextSetupAction)"),
  "Client-owned setup actions must show real client controls, not the setup wizard");
const nativeProbe = read("tooling/acceptance/windows/probe-native-multi-instance.ps1");
requireFact(nativeProbe.includes("[string]$Mode = 'OBSERVE'") &&
  nativeProbe.includes("simultaneousDistinctAccounts = 'NOT_VERIFIED'") &&
  nativeProbe.includes("verdict = 'INCONCLUSIVE'"),
  "Native multi-instance probe must remain read-only by default and unverified");
requireFact(read("docs/product/four-concurrent-accounts.md").includes(
  "four independent Minecraft Education game windows"),
  "Four-client end-user outcome was removed from canonical product contract");
requireFact(read("tooling/acceptance/windows/new-stage-result.ps1").includes("'CLIENT_FEASIBILITY'"),
  "Client feasibility evidence stage not recognized by acceptance recorder");

requireFact(read("apps/desktop/src-tauri/Cargo.toml").includes('path = "../../../engine/runtime-core"'),
  "Tauri backend dependency points outside canonical engine");
requireFact(release.repository === "MIVUBI-STD/M-Minecraft-Emulator", "Update repository identity drift");
requireFact(release.selfUpdateRuntimeEnabled === false, "Runtime updater must not self-apply");
requireFact(read("engine/runtime-core/src/update.rs").includes(
  'policy.repository != "MIVUBI-STD/M-Minecraft-Emulator"'), "Backend update policy pin drift");

const resourceRoots = [
  "../../../engine/guest/windows/",
  "../../../tooling/acceptance/windows/",
  "../../../engine/distribution/release-channel.json",
  "../../../engine/distribution/package-contract.json"
];
const baseResources = tauri.bundle?.resources ?? {};
const packageResources = tauriPackage.bundle?.resources ?? {};
const packageContract = json("engine/distribution/package-contract.json");
requireFact(packageContract.schema === 1 && Array.isArray(packageContract.requiredFiles),
  "Unsupported or invalid installed package contract");
const resourceDestinations = new Set([...Object.values(baseResources), ...Object.values(packageResources)]);
const generatedExecutables = new Set(["m-bedrock-virtual-clients.exe", "virtual-clients.exe"]);
for (const requiredFile of packageContract.requiredFiles) {
  if (generatedExecutables.has(requiredFile)) continue;
  requireFact([...resourceDestinations].some((destination) =>
    destination === requiredFile || (destination.endsWith("/") && requiredFile.startsWith(destination))),
    "Tauri resources do not cover required installed file: " + requiredFile);
}
for (const origin of resourceRoots) {
  requireFact(origin in baseResources && origin in packageResources,
    "Installer resource route is missing: " + origin);
  requireFact(existsSync(resolve(root, "apps/desktop/src-tauri", origin)),
    "Installer source resource does not exist: " + origin);
}
requireFact(tauri.bundle?.windows?.nsis?.installMode === "currentUser", "Windows install scope changed");
requireFact(tauri.bundle?.windows?.allowDowngrades === false, "Downgrade restriction changed");
for (const path of [".github/workflows/verify.yml", ".github/workflows/package-smoke.yml"]) {
  const workflow = read(path);
  requireFact(/^on:\s*\n\s+workflow_dispatch:/m.test(workflow), "Workflow is not manual: " + path);
  requireFact(!/^\s{2}(?:push|pull_request|schedule):/m.test(workflow),
    "Automatic workflow trigger detected: " + path);
}

function markdownFiles(dir) {
  return readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith(".md") ? [path] : [];
  });
}
for (const path of markdownFiles("docs")) {
  const content = read(path);
  requireFact(/^---\s*\nid: document\./.test(content), "Documentation identity missing: " + path);
  for (const link of content.matchAll(/\]\(([^)]+)\)/g)) {
    const target = link[1].split("#", 1)[0];
    if (!target || target.startsWith("#") || /^[a-z]+:/i.test(target)) continue;
    requireFact(existsSync(resolve(root, dirname(path), decodeURIComponent(target))),
      "Broken documentation link in " + path + " -> " + target);
  }
}
console.log("Emulator repository contract: PASS (source/layout inspection only).");
