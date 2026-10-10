import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = (name) => JSON.parse(readFileSync(resolve(root, name), "utf8"));
const read = (name) => readFileSync(resolve(root, name), "utf8");
const must = (ok, message) => { if (!ok) throw new Error(message); };

for (const path of [
  "AGENTS.md", "GITHUB_RULES.md", "CONTEXT.md", "planning/development.md",
  "apps/virtual-clients/package.json", "apps/virtual-clients/package-lock.json",
  "apps/virtual-clients/src-tauri/Cargo.toml", "apps/virtual-clients/src-tauri/tauri.conf.json",
  "virtual-clients/runtime-core/Cargo.toml", "virtual-clients/docs/acceptance.md",
  "virtual-clients/distribution/release-channel.json",
]) {
  must(existsSync(resolve(root, path)), `Missing required source/authority: ${path}`);
}

const rootPackage = load("package.json");
const app = load("apps/virtual-clients/package.json");
const lock = load("apps/virtual-clients/package-lock.json");
const tauri = load("apps/virtual-clients/src-tauri/tauri.conf.json");
const release = load("virtual-clients/distribution/release-channel.json");
const toolchain = load("toolchain.json");
const version = (text) => /^version\s*=\s*"([^"]+)"/m.exec(text)?.[1];
must(rootPackage.name === "m-minecraft-emulator", "Repository package identity changed");
must(app.version === tauri.version, "Desktop/Tauri version mismatch");
must(app.version === version(read("apps/virtual-clients/src-tauri/Cargo.toml")), "Desktop/Rust version mismatch");
must(app.version === version(read("virtual-clients/runtime-core/Cargo.toml")), "Desktop/backend version mismatch");
must(app.devDependencies?.vitest === lock.packages?.[""]?.devDependencies?.vitest, "Vitest manifest/lock mismatch");
for (const [name, range] of Object.entries({ ...app.dependencies, ...app.devDependencies })) {
  must(lock.packages?.[""]?.dependencies?.[name] === range || lock.packages?.[""]?.devDependencies?.[name] === range, `Lock root missing manifest dependency ${name}`);
}
must(lock.packages?.["node_modules/vitest"], "Test runner is not locked");
must(release.repository === "MIVUBI-STD/M-Minecraft-Emulator", "Release update authority points to old repository");
must(read("virtual-clients/runtime-core/src/update.rs").includes('policy.repository != "MIVUBI-STD/M-Minecraft-Emulator"'), "Backend release-channel pin is not migrated");
must(release.selfUpdateRuntimeEnabled === false, "Runtime self-update must remain disabled");
must(toolchain.node.trim() === read(".node-version").trim(), "Node selector/toolchain mismatch");
must(toolchain.ciPolicy === "manual-only", "CI policy drift");
console.log("Repository layout and source-contract cross-references: PASS (static only).");
