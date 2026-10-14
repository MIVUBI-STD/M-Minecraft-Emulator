import test from "node:test";
import assert from "node:assert/strict";
import { verifyManifest, verifyReport } from "./validate-baseline.mjs";

function fixture() {
  return {
    schema: 1, purpose: "SOURCE_ONLY_UNMODIFIED_UPSTREAM_BUILD_PROVENANCE",
    upstream: {
      repository: "sandboxie-plus/Sandboxie", tag: "v1.18.5",
      commit: "abd4c240031cfb46666daa74ca47ed4e48b561e4",
      sourceLicenseFiles: ["Sandboxie/COPYING"],
    },
    platforms: ["Win32", "x64"], configuration: "SbieRelease",
    buildStages: [
      { id: "win32-support", solution: "Sandboxie/SandboxDll.sln", platform: "Win32" },
      { id: "x64-core", solution: "Sandboxie/Sandbox.sln", platform: "x64" },
      { id: "x64-kernel", solution: "Sandboxie/SandboxDrv.sln", platform: "x64" },
    ],
    requiredArtifacts: [
      "Sandboxie/Bin/x64/SbieRelease/SbieDrv.sys",
      "Sandboxie/Bin/x64/SbieRelease/SbieSvc.exe",
      "Sandboxie/Bin/x64/SbieRelease/SbieDll.dll",
      "Sandboxie/Bin/Win32/SbieRelease/SbieSvc.exe",
      "Sandboxie/Bin/Win32/SbieRelease/SbieDll.dll",
    ],
    optionalSymbols: ["Sandboxie/Bin/x64/SbieRelease/SbieDrv.pdb"],
    sourceResources: ["Sandboxie/install/Templates.ini"],
    distribution: "NOT_APPROVED", driverLoad: "NOT_EXECUTED",
    windowsGameplay: "NOT_EXECUTED",
  };
}
function report(m, compiled = true) {
  return {
    schema: 1, sourceRepository: m.upstream.repository, sourceTag: m.upstream.tag,
    sourceCommit: m.upstream.commit, sourceCleanAtStart: true,
    compiledInThisInvocation: compiled,
    stageResults: m.buildStages.map(s => ({
      ...s, state: compiled ? "COMPILED" : "NOT_EXECUTED",
      exitCode: compiled ? 0 : null,
    })),
    artifacts: [
      ...m.requiredArtifacts.map(path => ({ path, kind: "required" })),
      ...m.optionalSymbols.map(path => ({ path, kind: "optional-symbol" })),
      ...m.sourceResources.map(path => ({ path, kind: "source-resource" })),
    ].map(a => ({
      ...a, state: "PRESENT", sizeBytes: 4096,
      sha256: "a".repeat(64), authenticode: "NotSigned",
    })),
    artifactResult: compiled ? "BUILD_ARTIFACTS_COLLECTED" : "COLLECTION_ONLY_NOT_BUILD_PROOF",
    signingLoadAcceptance: "NOT_EXECUTED",
    minecraftLoginGameplayAcceptance: "NOT_EXECUTED", distributionApproval: "NOT_APPROVED",
  };
}
const clone = value => structuredClone(value);
test("pins upstream version, stage order and critical x86/x64 artifacts", () => {
  assert.equal(verifyManifest(fixture()).status, "MANIFEST_VALID");
  const bad = fixture(); bad.buildStages.reverse();
  assert.throws(() => verifyManifest(bad), /build stages/);
  const wrong = fixture(); wrong.upstream.commit = "0".repeat(40);
  assert.throws(() => verifyManifest(wrong), /upstream pin/);
  const missing = fixture(); missing.requiredArtifacts.pop();
  assert.throws(() => verifyManifest(missing), /Win32 companion/);
});
test("rejects path traversal, duplicates and removal of core GPL notice", () => {
  const bad = fixture(); bad.optionalSymbols.push("../malicious.pdb");
  assert.throws(() => verifyManifest(bad), /invalid artifact path/);
  const dup = fixture(); dup.optionalSymbols.push(dup.requiredArtifacts[0]);
  assert.throws(() => verifyManifest(dup), /invalid artifact path/);
  const license = fixture(); license.upstream.sourceLicenseFiles = [];
  assert.throws(() => verifyManifest(license), /GPL notice/);
});
test("collection-only and build reports never establish runnable driver or gameplay", () => {
  const m = fixture();
  assert.equal(verifyReport(m, report(m, false)).artifactResult, "COLLECTION_ONLY_NOT_BUILD_PROOF");
  const built = verifyReport(m, report(m));
  assert.equal(built.artifactResult, "BUILD_ARTIFACTS_COLLECTED");
  assert.equal(built.driverLoadVerified, false);
  assert.equal(built.gameplayVerified, false);
  assert.equal(built.cutoverApproved, false);
});
test("rejects forged compile stages or report source revision", () => {
  const m = fixture(); const r = report(m, false);
  r.stageResults[0].state = "COMPILED";
  assert.throws(() => verifyReport(m, r), /stage evidence/);
  const forged = report(m); forged.sourceCommit = "0".repeat(40);
  assert.throws(() => verifyReport(m, forged), /provenance/);
});
test("rejects missing rows, corrupted hashes and false runtime PASS", () => {
  const m = fixture(); let r = report(m);
  r.artifacts[0].sha256 = "bad"; assert.throws(() => verifyReport(m, r), /hash/);
  r = report(m); r.artifacts.pop(); assert.throws(() => verifyReport(m, r), /missing or extra/);
  r = report(m); r.signingLoadAcceptance = "PASS";
  assert.throws(() => verifyReport(m, r), /fabricated runtime/);
});
test("incomplete mandatory output cannot be reported as successful; missing symbols are optional", () => {
  const m = fixture(); const r = report(m);
  r.artifacts[0] = {
    ...r.artifacts[0], state: "MISSING", sizeBytes: null, sha256: null,
    authenticode: "NOT_EXECUTED",
  };
  assert.throws(() => verifyReport(m, r), /false result/);
  r.artifactResult = "BUILD_OUTPUT_INCOMPLETE";
  assert.equal(verifyReport(m, r).missingRequired, 1);
  const symbols = report(m); const i = m.requiredArtifacts.length;
  symbols.artifacts[i] = {
    ...symbols.artifacts[i], state: "MISSING", sizeBytes: null,
    sha256: null, authenticode: "NOT_EXECUTED",
  };
  assert.equal(verifyReport(m, symbols).artifactResult, "BUILD_ARTIFACTS_COLLECTED");
});
