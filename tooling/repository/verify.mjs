import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
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
  "engine/guest/windows/prepare-base.ps1",
  ".github/workflows/verify.yml", ".github/workflows/package-smoke.yml",
  "docs/validation/client-feasibility.md",
  "docs/validation/pre-local-test-readiness.md",
  "docs/product/four-concurrent-accounts.md",
  "apps/desktop/src-tauri/src/engine/native_clients.rs",
  "apps/desktop/src-tauri/src/commands/native_clients.rs",
  "tooling/acceptance/windows/collect-client-feasibility.ps1",
  "tooling/acceptance/evaluate-client-feasibility.mjs",
  "tooling/acceptance/evaluate-client-feasibility.test.mjs"
];
for (const file of required) {
  requireFact(existsSync(resolve(root, file)), "Missing canonical repository owner: " + file);
}
// The aggregate G0 source route requests an extra reproducibility prerequisite.
// Keep normal repository structure inspections available independently while the
// actual Tauri dependency graph has not yet been generated.
if (process.argv.includes("--g0")) {
  const desktopLock = "apps/desktop/src-tauri/Cargo.lock";
  requireFact(existsSync(resolve(root, desktopLock)),
    "G0 BLOCKED: Tauri Cargo.lock is missing. Resolve it with real Cargo; do not fabricate versions.");
  // A generated but uncommitted file cannot be the reproducible exact-SHA G0
  // dependency graph. Inspect HEAD directly instead of trusting the Git index.
  const committed = spawnSync("git", ["ls-tree", "-r", "--name-only", "HEAD", "--", desktopLock], {
    cwd: root,
    encoding: "utf8",
  });
  requireFact(!committed.error && committed.status === 0 &&
    committed.stdout.trim() === desktopLock,
    "G0 BLOCKED: Tauri Cargo.lock exists locally but is not committed in HEAD. Commit it to Local before source/package verification.");
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
const prepareBase = read("engine/guest/windows/prepare-base.ps1");
requireFact(prepareBase.includes("[Microsoft.Win32.RegistryView]::Registry32") &&
  prepareBase.includes("GetValue('Version', '')") &&
  read("engine/runtime-core/src/profile.rs").includes('"/reg:32"'),
  "Minecraft Education Base preparation must use the documented 32-bit Desktop registry view");
requireFact(read("docs/product/four-concurrent-accounts.md").includes(
  "four separate Minecraft Education Windows desktop clients concurrently"),
  "Four-client end-user outcome was removed from canonical product contract");
const nativeDesktop = read("apps/desktop/src-tauri/src/engine/native_clients.rs");
const desktopFacade = read("apps/desktop/src/app/bridge/virtualClientsApi.ts");
const desktopBootstrap = read("apps/desktop/src-tauri/src/app_bootstrap.rs");
requireFact(read("apps/desktop/src-tauri/src/commands/native_clients.rs").includes("fn desktop_open_native_minecraft(") &&
  desktopFacade.includes('"desktop_open_native_minecraft"') &&
  desktopBootstrap.includes("commands::native_clients::desktop_open_native_minecraft,"),
  "Only native Windows Minecraft desktop launcher may be exposed outside the canonical VMware runtime");
requireFact(!nativeDesktop.includes("BlueStacks") && !nativeDesktop.includes("open_android") &&
  !nativeDesktop.includes("Get-Credential") && !nativeDesktop.includes("vmrun.exe"),
  "Desktop native launcher must not own another emulator, credential or VM lifecycle");
for (const file of ["apps/desktop/src/App.svelte", "apps/desktop/src/app/surfaces/SetupSurface.svelte",
  "apps/desktop/src/app/surfaces/ClientsSurface.svelte", "apps/desktop/src/app/bridge/virtualClientsApi.ts"]) {
  requireFact(!/BlueStacks|onOpenAndroid|openAndroidInstances|desktop_open_android_instances/.test(read(file)),
    "Retired alternative client backend remains in desktop source: " + file);
}
requireFact(!existsSync(resolve(root,"tooling/acceptance/windows/probe-android-instances.ps1")) &&
  !existsSync(resolve(root,"tooling/acceptance/windows/probe-native-multi-instance.ps1")),
  "Competing multi-instance acceptance probes must be retired");

// Catch stale relative source references that survive a monorepo extraction.
// GitHub search indexing alone cannot certify that current tests have no dead imports.
for (const name of readdirSync(resolve(root, "apps/desktop/test"))) {
  if (!name.endsWith(".test.ts")) continue;
  const source = read("apps/desktop/test/" + name);
  requireFact(!source.includes("../../../virtual-clients/runtime-core/") &&
    !source.includes("apps/virtual-clients/"),
    "Desktop test still references the retired monorepo source: " + name);
}
requireFact(read("tooling/acceptance/windows/new-stage-result.ps1").includes("'CLIENT_FEASIBILITY'"),
  "Client feasibility evidence stage not recognized by acceptance recorder");
const hostAcceptance = read("tooling/acceptance/windows/collect-acceptance.ps1");
requireFact(hostAcceptance.includes("if ($provisionedCount -eq 3)") &&
  hostAcceptance.includes("$runningCount -ne 3") &&
  hostAcceptance.includes("invalid CLI success envelope") &&
  hostAcceptance.includes("$resources = $null") &&
  hostAcceptance.includes("resourcesCollected = ($null -ne $resources)") &&
  !hostAcceptance.includes("readyForProvisioning = [bool]$doctor.readyForProvisioning") &&
  !hostAcceptance.includes("multiplayerVerified = $_.multiplayerVerified"),
  "Host-stage acceptance must collect before VM provisioning without inventing readiness");
const guestProofSource = read("tooling/acceptance/windows/collect-client-feasibility.ps1");
const evaluatorSource = read("tooling/acceptance/evaluate-client-feasibility.mjs");
for (const fact of ["vmDesktopOpened", "educationInstalled", "educationSignedIn",
  "crashOrFreezeObserved", "observedMinutes"]) {
  requireFact(guestProofSource.includes(fact) && evaluatorSource.includes(fact),
    "Single Windows guest boot, install/login and gameplay proof owner drift: " + fact);
}

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
