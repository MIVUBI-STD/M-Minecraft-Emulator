import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PIN = "abd4c240031cfb46666daa74ca47ed4e48b561e4";
const STAGES = [
  ["win32-support", "Sandboxie/SandboxDll.sln", "Win32"],
  ["x64-core", "Sandboxie/Sandbox.sln", "x64"],
  ["x64-kernel", "Sandboxie/SandboxDrv.sln", "x64"],
];
const SHA256 = /^[a-f0-9]{64}$/;
const PATH = /^[A-Za-z0-9_.\/-]+$/;

function requireFact(ok, description) {
  if (!ok) throw new Error("Invalid baseline: " + description);
}
function sameStage(s, e) {
  return s?.id === e[0] && s?.solution === e[1] && s?.platform === e[2];
}

export function verifyManifest(m) {
  requireFact(m?.schema === 1 && m.purpose === "SOURCE_ONLY_UNMODIFIED_UPSTREAM_BUILD_PROVENANCE", "manifest schema");
  requireFact(m.upstream?.repository === "sandboxie-plus/Sandboxie" &&
    m.upstream.tag === "v1.18.5" && m.upstream.commit === PIN, "upstream pin");
  requireFact(m.configuration === "SbieRelease" &&
    JSON.stringify(m.platforms) === JSON.stringify(["Win32", "x64"]), "platforms");
  requireFact(Array.isArray(m.buildStages) && m.buildStages.length === 3 &&
    m.buildStages.every((s, i) => sameStage(s, STAGES[i])), "build stages");
  requireFact(m.distribution === "NOT_APPROVED" && m.driverLoad === "NOT_EXECUTED" &&
    m.windowsGameplay === "NOT_EXECUTED", "unsafe manifest acceptance");
  requireFact(m.upstream.sourceLicenseFiles?.includes("Sandboxie/COPYING"), "GPL notice");
  const seen = new Set();
  for (const key of ["requiredArtifacts", "optionalSymbols", "sourceResources"]) {
    requireFact(Array.isArray(m[key]) && m[key].length > 0, "missing group " + key);
    for (const path of m[key]) {
      requireFact(typeof path === "string" && PATH.test(path) &&
        !path.split("/").includes("..") && !path.includes("\\") &&
        !path.startsWith("/") && !seen.has(path), "invalid artifact path");
      seen.add(path);
    }
  }
  for (const name of ["SbieDrv.sys", "SbieSvc.exe", "SbieDll.dll"]) {
    requireFact(m.requiredArtifacts.includes("Sandboxie/Bin/x64/SbieRelease/" + name),
      "core artifact absent: " + name);
  }
  for (const name of ["SbieSvc.exe", "SbieDll.dll"]) {
    requireFact(m.requiredArtifacts.includes("Sandboxie/Bin/Win32/SbieRelease/" + name),
      "Win32 companion absent: " + name);
  }
  return { status: "MANIFEST_VALID", upstreamSha: PIN };
}

export function verifyReport(m, r) {
  verifyManifest(m);
  requireFact(r?.schema === 1 && r.sourceRepository === m.upstream.repository &&
    r.sourceTag === m.upstream.tag && r.sourceCommit === PIN, "report provenance");
  requireFact(r.sourceCleanAtStart === true &&
    typeof r.compiledInThisInvocation === "boolean", "clean checkout / build evidence");
  requireFact(r.signingLoadAcceptance === "NOT_EXECUTED" &&
    r.minecraftLoginGameplayAcceptance === "NOT_EXECUTED" &&
    r.distributionApproval === "NOT_APPROVED", "fabricated runtime acceptance");
  requireFact(Array.isArray(r.stageResults) && r.stageResults.length === 3,
    "missing stages");
  for (let i = 0; i < 3; i++) {
    const stage = r.stageResults[i];
    requireFact(sameStage(stage, STAGES[i]), "stage order/identity");
    requireFact(r.compiledInThisInvocation
      ? stage.state === "COMPILED" && stage.exitCode === 0
      : stage.state === "NOT_EXECUTED" && stage.exitCode === null,
    "stage evidence contradicts compilation status");
  }
  const expected = [
    ...m.requiredArtifacts.map(path => ({ path, kind: "required" })),
    ...m.optionalSymbols.map(path => ({ path, kind: "optional-symbol" })),
    ...m.sourceResources.map(path => ({ path, kind: "source-resource" })),
  ];
  requireFact(Array.isArray(r.artifacts) && r.artifacts.length === expected.length,
    "missing or extra artifacts");
  let missing = 0;
  for (let i = 0; i < expected.length; i++) {
    const actual = r.artifacts[i];
    requireFact(actual.path === expected[i].path && actual.kind === expected[i].kind,
      "artifact row mismatch");
    requireFact(actual.state === "PRESENT" || actual.state === "MISSING",
      "unknown artifact state");
    if (actual.state === "PRESENT") {
      requireFact(Number.isSafeInteger(actual.sizeBytes) && actual.sizeBytes > 0 &&
        SHA256.test(actual.sha256) &&
        typeof actual.authenticode === "string" && actual.authenticode.length > 0,
      "artifact size/hash/signature metadata incomplete");
    } else {
      requireFact(actual.sizeBytes === null && actual.sha256 === null &&
        actual.authenticode === "NOT_EXECUTED", "fabricated missing artifact data");
      if (actual.kind !== "optional-symbol") missing++;
    }
  }
  const result = !r.compiledInThisInvocation ? "COLLECTION_ONLY_NOT_BUILD_PROOF" :
    missing === 0 ? "BUILD_ARTIFACTS_COLLECTED" : "BUILD_OUTPUT_INCOMPLETE";
  requireFact(r.artifactResult === result, "false result: " + r.artifactResult);
  return {
    status: "REPORT_VALID",
    artifactResult: result,
    missingRequired: missing,
    driverLoadVerified: false,
    gameplayVerified: false,
    cutoverApproved: false,
  };
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), "utf8").replace(/^\uFEFF/, ""));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    requireFact(args.length === 1 || args.length === 2,
      "usage: node validate-baseline.mjs <manifest.json> [report.json]");
    const manifest = readJson(args[0]);
    const result = args.length === 2
      ? verifyReport(manifest, readJson(args[1])) : verifyManifest(manifest);
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}
