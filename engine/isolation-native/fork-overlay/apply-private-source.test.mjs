import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { buildPrivateSourcePatch, buildExpectedPrivateSources, verifyExactPrivateSourceBytes, SOURCE_FILES } from "./apply-private-source.mjs";

const header = [
  "// Source fixture matching pinned upstream literal identifiers",
  "#define MY_ABI_VERSION  0x57230",
  '#define SBIEDRV                 L"SbieDrv"',
  '#define SBIESVC                 L"SbieSvc"',
  '#define SANDBOXIE_INI           L"Sandboxie.ini"',
  '#define FILTER_ALTITUDE         L"86900"',
  "",
].join("\n");
function sources() {
  return Object.fromEntries(SOURCE_FILES.map((path, i) => [
    path, i === 0 ? header : path === "Sandboxie/apps/start/start.cpp" ? [
      "// isolated fixture component: " + path,
      '#include "common/my_version.h"',
      "int test_function(void) { return 0; }",
      '    if (_wcsicmp(cmd, L"run_sbie_ctrl") == 0 || _wcsnicmp(cmd, L"open_agent", 10) == 0) {',
      "            run_regular_start();",
      "",
    ].join("\n") : path === "Sandboxie/core/drv/api.c" ? [
      "// isolated fixture component: " + path,
      '#include "common/my_version.h"',
      "static NTSTATUS Api_GetVersion(PROCESS *proc, ULONG64 *parms) {",
      "    API_GET_VERSION_ARGS *args = (API_GET_VERSION_ARGS *)parms;",
      "    return STATUS_SUCCESS;",
      "}",
      "",
    ].join("\n") : [
      "// isolated fixture component: " + path,
      '#include "common/my_version.h"',
      "int test_function(void) { return 0; }",
      "",
    ].join("\n"),
  ]));
}
function git(root, args, input) {
  const result = spawnSync("git", ["-C", root, ...args], {
    input, encoding: "utf8", maxBuffer: 512 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

test("generated patch touches exactly seven core build owners and preserves kernel names", () => {
  const patch = buildPrivateSourcePatch(sources());
  assert.equal((patch.match(/^diff --git/gm) ?? []).length, 7);
  assert.equal((patch.match(/^@@ /gm) ?? []).length, 9);
  // Git apply rejects the earlier anchor-only hunks even when the line
  // matches. Every insertion must retain a following source context line.
  assert.match(patch, /@@ -\d+,2 \+\d+,4 @@/);
  assert.match(patch, /\+#define MIVUBI_PRIVATE_ISOLATION_ABI   0x57230\n #define SBIEDRV/);
  assert.match(patch, /\+#endif\n int test_function\(void\)/);
  assert.equal((patch.match(/^@@ -\d+,2 \+\d+,\d+ @@$/gm) ?? []).length, 9);
  assert.match(patch, /MIVUBI_PRIVATE_DRIVER_ID/);
  assert.match(patch, /const WCHAR \*Driver_Version = MIVUBI_PRIVATE_DRIVER_ID/);
  assert.match(patch, /SbieApi_GetVersionEx\(observedVersion, &observedAbi\)/);
  assert.match(patch, /MivubiOwnedDriverMatches\(observedVersion, observedAbi\)/);
  assert.ok(patch.includes("mivubi_client:"));
  assert.ok(patch.includes("MivubiEdu02"));
  assert.ok(patch.includes("MinecraftEducationEdition.exe"));
  assert.ok(patch.includes("MivubiParseOwnedStart(cmd, &ownedLaunch)"));
  assert.ok(patch.includes("MivubiOwnedDecision::Admitted"));
  assert.ok(patch.includes("#define MIVUBI_PRIVATE_ISOLATION_BUILD 0x4D495655"));
  assert.ok(patch.includes("MY_ABI_VERSION != MIVUBI_PRIVATE_ISOLATION_ABI"));
  assert.ok(!patch.includes('-#define SBIEDRV'));
  assert.ok(!patch.includes('-#define SBIESVC'));
  assert.ok(!patch.includes("FILTER_ALTITUDE 87000"));
});

test("entire patch applies atomically to a disposable Git checkout without renaming service identities", () => {
  const root = mkdtempSync(join(tmpdir(), "owned-source-overlay-"));
  try {
    const fixture = sources();
    for (const [path, content] of Object.entries(fixture)) {
      const target = join(root, ...path.split("/"));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
    git(root, ["init", "-b", "main"]);
    git(root, ["config", "user.name", "MIVUBI Test"]);
    git(root, ["config", "user.email", "test@example.invalid"]);
    git(root, ["add", "--", "Sandboxie"]);
    git(root, ["commit", "-m", "Original source fixture"]);
    const before = git(root, ["rev-parse", "HEAD"]);
    const patch = buildPrivateSourcePatch(fixture);
    git(root, ["apply", "--check", "--index", "--whitespace=error", "-"], patch);
    git(root, ["apply", "--index", "--whitespace=error", "-"], patch);
    assert.equal(git(root, ["rev-parse", "HEAD"]), before);
    assert.deepEqual(git(root, ["diff", "--cached", "--name-only"]).split("\n"),
      [...SOURCE_FILES].sort());
    const expected = buildExpectedPrivateSources(fixture);
    for (const path of SOURCE_FILES) {
      assert.equal(readFileSync(join(root, path), "utf8"), expected[path]);
    }
    const feature = readFileSync(join(root, "Sandboxie/apps/start/start.cpp"), "utf8");
    assert.match(feature, /mivubi_client:/);
    assert.match(feature, /MivubiEdu02/);
    assert.match(feature, /MivubiParseOwnedStart/);
    assert.match(feature, /SbieApi_GetVersionEx\(observedVersion, &observedAbi\)/);
    assert.match(feature, /MivubiOwnedDriverMatches\(observedVersion, observedAbi\)/);
    const driver = readFileSync(join(root, "Sandboxie/core/drv/api.c"), "utf8");
    assert.match(driver, /const WCHAR \*Driver_Version = MIVUBI_PRIVATE_DRIVER_ID/);
    assert.match(feature, /end\[1\] != L'/);
    const editedHeader = readFileSync(join(root, SOURCE_FILES[0]), "utf8");
    assert.ok(editedHeader.includes('L"SbieDrv"'));
    assert.ok(editedHeader.includes('L"SbieSvc"'));
    assert.ok(editedHeader.includes("MIVUBI_PRIVATE_ISOLATION_BUILD"));
    for (const path of SOURCE_FILES.slice(1)) {
      assert.ok(readFileSync(join(root, path), "utf8").includes(
        "#error MIVUBI_isolation_build_requires_matching_pinned_core"));
    }
    assert.throws(() => buildPrivateSourcePatch(Object.fromEntries(
      SOURCE_FILES.map(path => [path, readFileSync(join(root, path), "utf8")]))),
      /private marker already/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("refuses unexpected upstream line endings before writing a patch", () => {
  const crlf = sources();
  crlf[SOURCE_FILES[0]] = crlf[SOURCE_FILES[0]].replace(/\n/g, "\r\n");
  assert.throws(() => buildPrivateSourcePatch(crlf), /upstream newline format changed/);
});

test("private launcher and driver reject unreviewed runtime-identity edits", () => {
  const original = sources();
  const edited = buildExpectedPrivateSources(original);
  const driver = "Sandboxie/core/drv/api.c";
  const launcher = "Sandboxie/apps/start/start.cpp";
  assert.ok(edited[driver].includes('MIVUBI_PRIVATE_DRIVER_ID'));
  assert.ok(edited[launcher].includes('MivubiOwnedDriverMatches'));
  assert.equal(verifyExactPrivateSourceBytes(original, edited), true);
  const driverEdited = {...edited, [driver]:
    edited[driver].replace("MIVUBI_PRIVATE_DRIVER_ID", "L\"5.73.5\"")};
  assert.throws(() => verifyExactPrivateSourceBytes(original, driverEdited),
    /unexpected modified source bytes/);
  const launcherEdited = {...edited, [launcher]:
    edited[launcher].replace("!MivubiOwnedDriverMatches(observedVersion, observedAbi)",
      "MivubiOwnedDriverMatches(observedVersion, observedAbi)")};
  assert.throws(() => verifyExactPrivateSourceBytes(original, launcherEdited),
    /unexpected modified source bytes/);
});

test("wrong ABI, unexpected service identity and duplicate compiler anchors fail closed", () => {
  const wrongAbi = sources();
  wrongAbi[SOURCE_FILES[0]] = wrongAbi[SOURCE_FILES[0]].replace(
    "0x57230", "0x12345");
  assert.throws(() => buildPrivateSourcePatch(wrongAbi), /upstream anchor changed/);
  const renamed = sources();
  renamed[SOURCE_FILES[0]] = renamed[SOURCE_FILES[0]].replace(
    'L"SbieDrv"', 'L"DifferentDriver"');
  assert.throws(() => buildPrivateSourcePatch(renamed), /upstream identity changed/);
  const duplicate = sources();
  duplicate[SOURCE_FILES[1]] += '#include "common/my_version.h"\n';
  assert.throws(() => buildPrivateSourcePatch(duplicate), /upstream anchor changed/);
});

test("exact committed source comparison refuses extra code even with valid markers", () => {
  const before = sources();
  const after = buildExpectedPrivateSources(before);
  assert.equal(verifyExactPrivateSourceBytes(before, after), true);
  const target = SOURCE_FILES[3];
  after[target] += "\nint invisible_unreviewed_change = 1;\n";
  assert.throws(() => verifyExactPrivateSourceBytes(before, after),
    /unexpected modified source bytes/);
  after[target] = before[target];
  assert.throws(() => verifyExactPrivateSourceBytes(before, after),
    /unexpected modified source bytes/);
});

test("Windows private build report uses committed proof, never removed staged-variable", () => {
  const script = readFileSync(new URL("./build-private.ps1", import.meta.url), "utf8");
  assert.match(script, /Set-StrictMode -Version Latest/);
  assert.doesNotMatch(script, /\$expected\b/);
  assert.match(script, /sourceFilesModified\s*=\s*\[string\[\]\]@\(\$sourceProof\.sourceFilesModified\)/);
  assert.match(script, /privateForkHead\s*=\s*\[string\]\$sourceProof\.privateForkHead/);
  assert.match(script, /privateForkTree\s*=\s*\[string\]\$sourceProof\.privateForkTree/);
  assert.match(script, /privatePatchSha256\s*=\s*\[string\]\$sourceProof\.privatePatchSha256/);
  const verificationCalls = script.match(/--verify-committed --fork-root/g) ?? [];
  assert.equal(verificationCalls.length, 2, "build must verify before and after MSBuild");
  assert.match(script, /\$sourceProof\.privatePatchSha256 -cne \$afterProof\.privatePatchSha256/);
  // Reject evidence clobber and avoid expensive compilation for bad paths.
  assert.match(script, /Build report already exists/);
  assert.match(script, /Existing build log must be preserved/);
  assert.match(script, /Private payload destination already exists/);
  assert.match(script, /Private stage destination may not overlap/);
  assert.match(script, /Private build report must not be inside the staged payload directory/);
  assert.match(script, /Private build report path collides with a reserved stage log/);
  const stageIf = script.match(/if \(\$stageDestination\.Equals[\s\S]*?\{/);
  assert.ok(stageIf, "stage-overlap PowerShell if must exist");
  // Ignore PowerShell single-quoted literal substrings when counting parens.
  const withoutStrings = stageIf[0].replace(/'(?:[^']|'')*'/g, "''");
  let balance = 0;
  for (const ch of withoutStrings) {
    if (ch === "(") balance++;
    if (ch === ")") balance--;
    assert.ok(balance >= 0, "unexpected closing PowerShell parenthesis");
  }
  assert.equal(balance, 0, "stage-overlap PowerShell if has a missing closing parenthesis");
  assert.match(script, /Private payload destination parent is missing/);
  assert.match(script, /Missing required private packaging resource/);
  assert.match(script, /@\(\$manifest\.requiredArtifacts\) \+ @\(\$manifest\.optionalSymbols\)/);
  assert.match(script, /Stale binary or debug symbol detected/);
  assert.match(script, /Out-File -LiteralPath \$log -Encoding UTF8 -NoClobber/);
  assert.match(script, /Out-File -LiteralPath \$report -Encoding UTF8 -NoClobber/);
  assert.match(script, /Pinned complete upstream manifest validation failed/);
  assert.match(script, /& \$node \$validateManifest \$manifestPath/);
  assert.doesNotMatch(script, /\b(?:Start-Service|Stop-Service|Remove-Service|sc\.exe)\b/i);
});

test("private ABI probe CMake invokes canonical exact committed-fork verifier", () => {
  const cmake = readFileSync(new URL("../CMakeLists.txt", import.meta.url), "utf8");
  assert.match(cmake, /find_program\(MIVUBI_NODE_EXECUTABLE NAMES node\.exe node REQUIRED\)/);
  assert.match(cmake, /fork-overlay\/apply-private-source\.mjs/);
  assert.match(cmake, /--verify-committed --fork-root/);
  assert.match(cmake, /RESULT_VARIABLE PRIVATE_SOURCE_RESULT/);
  assert.match(cmake, /NOT PRIVATE_SOURCE_RESULT STREQUAL "0"/);
  assert.match(cmake, /message\(FATAL_ERROR/);
  assert.doesNotMatch(cmake, /MIVUBI_BUILD_MARKER REGEX/);
  assert.doesNotMatch(cmake, /MIVUBI_ABI_MARKER REGEX/);
  assert.match(cmake, /PINNED_COMMIT "abd4c240031cfb46666daa74ca47ed4e48b561e4"/);
  assert.match(cmake, /status --porcelain=v1 --untracked-files=all/);
  assert.match(cmake, /Pinned upstream ABI source checkout is dirty/);
});
