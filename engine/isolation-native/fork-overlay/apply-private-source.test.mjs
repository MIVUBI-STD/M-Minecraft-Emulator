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
    ].join("\n") : path === "Sandboxie/core/drv/box.c" ? [
      "// isolated kernel box fixture",
      '#include "box.h"',
      "static BOX *Box_Alloc(POOL *pool, const WCHAR *boxname, ULONG session_id) {",
      "    BOX *box = Mem_Alloc(pool, sizeof(BOX));",
      "    if (!box) return NULL;",
      "    return box;",
      "}",
      "",
    ].join("\n") : path === "Sandboxie/core/dll/sbieapi.c" ? [
      "// isolated fixture component: " + path,
      '#include "common/my_version.h"',
      "// Original upstream headers/helpers between include and handle.",
      "HANDLE SbieApi_DeviceHandle = INVALID_HANDLE_VALUE;",
      "static NTSTATUS SbieApi_Ioctl(ULONG64 *parms) {",
      "    if (parms == NULL) { // close request as used by kmdutil",
      "        return STATUS_SUCCESS;",
      "    if (SbieApi_DeviceHandle == INVALID_HANDLE_VALUE) {",
      "        SbieApi_DeviceHandle = 1;",
      "    } else {",
      "        //",
      "        // note that all requests are synchronous which means",
      "        return STATUS_SUCCESS;",
      "    }",
      "}",
      "NTSTATUS SbieApi_GetVersionEx() {",
      "    args->string.val = version_string;",
      "    args->abi_ver.val = abi_version;",
      "    status = SbieApi_Ioctl(parms);",
      "    if (! NT_SUCCESS(status)){",
      "        return status;",
      "    }",
      "}",
      "",
    ].join("\n") : path === "Sandboxie/core/svc/DriverAssistStart.cpp" ? [
      "// isolated fixture component: " + path,
      '#include "core/drv/verify.h"',
      "ULONG DriverAssist::StartDriverAsync(void *arg) {",
      "    LONG rc = SbieApi_GetVersionEx(NULL, NULL);",
      "    if (rc == 0) {",
      "        return 1;",
      "    }",
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

test("generated patch includes DLL and service startup in exact core closure and preserves kernel names", () => {
  const patch = buildPrivateSourcePatch(sources());
  assert.equal((patch.match(/^diff --git/gm) ?? []).length, 9);
  assert.equal((patch.match(/^@@ /gm) ?? []).length, 18);
  // Git apply rejects the earlier anchor-only hunks even when the line
  // matches. Every insertion must retain a following source context line.
  assert.match(patch, /@@ -\d+,2 \+\d+,4 @@/);
  assert.match(patch, /\+#define MIVUBI_PRIVATE_ISOLATION_ABI   0x57230\n #define SBIEDRV/);
  assert.match(patch, /\+#endif\n int test_function\(void\)/);
  assert.equal((patch.match(/^@@ -\d+,2 \+\d+,\d+ @@$/gm) ?? []).length, 17);
  // Real upstream has seven context lines; the synthetic fixture packs
  // the same three source anchors into five. Both must be one Git hunk.
  assert.match(patch, /^@@ -\d+,(?:5|7) \+\d+,\d+ @@$/m);
  assert.match(patch, /MivubiVerifyOpenedDevice/);
  assert.match(patch, /Sandboxie\/core\/drv\/box.c/);
  assert.match(patch, /MivubiBoxNameAllowed\(boxname\)/);
  assert.match(patch, /STATUS_ACCESS_DENIED/);
  assert.match(patch, /MivubiVerifiedDeviceHandle/);
  assert.match(patch, /InterlockedCompareExchangePointer/);
  assert.match(patch, /InterlockedExchangePointer/);
  assert.match(patch, /MivubiReadVerifiedDeviceHandle/);
  assert.match(patch, /MivubiResetVerifiedDeviceHandle/);
  assert.match(patch, /Reopening even with a reused HANDLE value revokes prior trust/);
  assert.match(patch, /AbortServer\(\)/);
  // Every patch hunk must be ordered and NONOVERLAPPING on old source.
  // Adjacent GetVersionEx edits previously generated overlapping Git hunks.
  for (const fileDiff of patch.split(/^diff --git /m).filter(Boolean)) {
    const ranges = [...fileDiff.matchAll(/^@@ -(\d+),(\d+) \+(\d+),(\d+) @@$/gm)]
      .map(m => ({start: Number(m[1]), end: Number(m[1]) + Number(m[2]) - 1}));
    for (let index = 1; index < ranges.length; index++) {
      assert.ok(ranges[index - 1].end < ranges[index].start,
        "Git source hunks must never share context lines");
    }
  }
  assert.match(patch, /MIVUBI_PRIVATE_DRIVER_ID/);
  assert.match(patch, /const WCHAR \*Driver_Version = MIVUBI_PRIVATE_DRIVER_ID/);
  assert.match(patch, /SbieApi_GetVersionEx\(observedVersion, &observedAbi\)/);
  assert.match(patch, /MivubiOwnedDriverMatches\(observedVersion, 16, observedAbi\)/);
  assert.match(patch, /MivubiOwnedDriverMatches\(mivubiVersion, 16, mivubiAbi\)/);
  assert.match(patch, /MivubiOwnedDriverMatches\(version, 16, abi\)/);
  assert.match(patch, /STATUS_REVISION_MISMATCH/);
  assert.match(patch, /DriverAssistStart\.cpp/);
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
    assert.match(feature, /MivubiOwnedDriverMatches\(observedVersion, 16, observedAbi\)/);
    const boxed = readFileSync(join(root, "Sandboxie/core/drv/box.c"), "utf8");
    assert.match(boxed, /MivubiBoxNameAllowed\(boxname\)/);
    assert.match(boxed, /STATUS_ACCESS_DENIED/);
    assert.ok(boxed.indexOf("if (!MivubiBoxNameAllowed(boxname))") <
      boxed.indexOf("BOX *box = Mem_Alloc"));
    const dll = readFileSync(join(root, "Sandboxie/core/dll/sbieapi.c"), "utf8");
    assert.match(dll, /MivubiOwnedDriverMatches\(mivubiVersion, 16, mivubiAbi\)/);
    assert.match(dll, /MivubiVerifyOpenedDevice/);
    assert.match(dll, /parms\[0\] != API_GET_VERSION/);
    assert.match(dll, /MivubiReadVerifiedDeviceHandle\(\) != SbieApi_DeviceHandle/);
    assert.match(dll, /InterlockedCompareExchangePointer/);
    assert.match(dll, /InterlockedExchangePointer/);
    assert.match(dll, /MivubiResetVerifiedDeviceHandle\(\)/);
    const service = readFileSync(join(root, "Sandboxie/core/svc/DriverAssistStart.cpp"), "utf8");
    assert.match(service, /rc == STATUS_REVISION_MISMATCH/);
    assert.match(service, /AbortServer\(\);/);
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

test("accepts clean Windows CRLF source without changing the Git patch bytes", () => {
  const lf = sources();
  const windows = Object.fromEntries(Object.entries(lf).map(([name, data]) =>
    [name, data.replace(/\n/g, "\r\n")]));
  assert.equal(buildPrivateSourcePatch(windows), buildPrivateSourcePatch(lf));
  const mixed = {...windows, [SOURCE_FILES[1]]:
    windows[SOURCE_FILES[1]].replace("\r\n", "\n")};
  assert.throws(() => buildPrivateSourcePatch(mixed),
    /unsupported mixed\/lone-CR line endings/);
  const lone = {...lf, [SOURCE_FILES[0]]:
    lf[SOURCE_FILES[0]].replace("\n", "\r")};
  assert.throws(() => buildPrivateSourcePatch(lone),
    /unsupported mixed\/lone-CR line endings/);
});

test("Git applies the private patch to a Windows-style CRLF checkout", () => {
  const root = mkdtempSync(join(tmpdir(), "owned-source-windows-crlf-"));
  try {
    git(root, ["init", "-b", "main"]);
    git(root, ["config", "user.name", "MIVUBI Test"]);
    git(root, ["config", "user.email", "test@example.invalid"]);
    git(root, ["config", "core.autocrlf", "true"]);
    // Same .c/.cpp policy as pinned Sandboxie upstream .gitattributes.
    writeFileSync(join(root, ".gitattributes"),
      "*.c text working-tree-encoding=UTF-8\n" +
      "*.cpp text working-tree-encoding=UTF-8\n");
    for (const [path, data] of Object.entries(sources())) {
      const target = join(root, ...path.split("/"));
      mkdirSync(dirname(target), {recursive: true});
      writeFileSync(target, data);
    }
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "Pinned source fixture with Windows conversion"]);
    for (const path of SOURCE_FILES)
      rmSync(join(root, ...path.split("/")));
    git(root, ["restore", "--worktree", "--", "Sandboxie"]);
    const checkout = Object.fromEntries(SOURCE_FILES.map(path => [
      path, readFileSync(join(root, ...path.split("/")), "utf8")
    ]));
    assert.ok(SOURCE_FILES.every(path => checkout[path].includes("\r\n")));
    assert.equal(git(root, ["status", "--porcelain"]), "");
    const patch = buildPrivateSourcePatch(checkout);
    assert.equal(patch, buildPrivateSourcePatch(sources()));
    git(root, ["apply", "--check", "--index", "--whitespace=error", "-"], patch);
    git(root, ["apply", "--index", "--whitespace=error", "-"], patch);
    const expected = buildExpectedPrivateSources(checkout);
    for (const path of SOURCE_FILES) {
      const actual = readFileSync(join(root, ...path.split("/")), "utf8");
      assert.equal(actual, expected[path]);
      assert.ok(actual.includes("\r\n"), "Git must preserve Windows worktree EOL");
    }
    assert.deepEqual(git(root, ["diff", "--cached", "--name-only"]).split("\n"),
      [...SOURCE_FILES].sort());
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
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
    edited[launcher].replace("!MivubiOwnedDriverMatches(observedVersion, 16, observedAbi)",
      "MivubiOwnedDriverMatches(observedVersion, 16, observedAbi)")};
  assert.throws(() => verifyExactPrivateSourceBytes(original, launcherEdited),
    /unexpected modified source bytes/);
});

test("DLL and service refuse unreviewed private startup bypasses", () => {
  const before = sources();
  const after = buildExpectedPrivateSources(before);
  assert.equal(verifyExactPrivateSourceBytes(before, after), true);
  const dll = "Sandboxie/core/dll/sbieapi.c";
  const svc = "Sandboxie/core/svc/DriverAssistStart.cpp";
  const modifiedDll = {...after, [dll]:
    after[dll].replace("!MivubiOwnedDriverMatches(mivubiVersion, 16, mivubiAbi)",
      "MivubiOwnedDriverMatches(mivubiVersion, 16, mivubiAbi)")};
  assert.throws(() => verifyExactPrivateSourceBytes(before, modifiedDll),
    /unexpected modified source bytes/);
  const modifiedSvc = {...after, [svc]:
    after[svc].replace("if (rc == STATUS_REVISION_MISMATCH)",
      "if (rc != STATUS_REVISION_MISMATCH)")};
  assert.throws(() => verifyExactPrivateSourceBytes(before, modifiedSvc),
    /unexpected modified source bytes/);
});

test("private DLL per-handle ioctl and service abort cannot be bypassed", () => {
  const original = sources();
  const edited = buildExpectedPrivateSources(original);
  const dll = "Sandboxie/core/dll/sbieapi.c";
  const svc = "Sandboxie/core/svc/DriverAssistStart.cpp";
  assert.match(edited[dll], /if \(parms\[0\] != API_GET_VERSION &&/);
  assert.match(edited[dll], /status = MivubiVerifyOpenedDevice\(\)/);
  assert.match(edited[svc], /AbortServer\(\);/);
  assert.throws(() => verifyExactPrivateSourceBytes(original, {
    ...edited, [dll]: edited[dll].replace(
      "status = MivubiVerifyOpenedDevice();", "status = STATUS_SUCCESS;")
  }), /unexpected modified source bytes/);
  assert.throws(() => verifyExactPrivateSourceBytes(original, {
    ...edited, [svc]: edited[svc].replace("        AbortServer();", "        // no abort")
  }), /unexpected modified source bytes/);
});

test("DLL verification cache uses atomic reads, stores and invalidation", () => {
  const original = sources();
  const edited = buildExpectedPrivateSources(original);
  const dll = "Sandboxie/core/dll/sbieapi.c";
  const candidate = edited[dll];
  assert.match(candidate, /PVOID volatile MivubiVerifiedDeviceHandle/);
  assert.match(candidate, /InterlockedCompareExchangePointer/);
  assert.match(candidate, /InterlockedExchangePointer/);
  assert.match(candidate, /MivubiReadVerifiedDeviceHandle\(\) != SbieApi_DeviceHandle/);
  assert.match(candidate, /MivubiResetVerifiedDeviceHandle\(\)/);
  assert.doesNotMatch(candidate, /MivubiVerifiedDeviceHandle = SbieApi_DeviceHandle;/);
  assert.doesNotMatch(candidate, /^\s*MivubiVerifiedDeviceHandle = INVALID_HANDLE_VALUE;/m);
  for (const [needle, replacement] of [
    ["MivubiReadVerifiedDeviceHandle() != SbieApi_DeviceHandle",
      "MivubiReadVerifiedDeviceHandle() == SbieApi_DeviceHandle"],
    ["InterlockedExchangePointer(", "FakeNoAtomicExchange("],
    ["MivubiResetVerifiedDeviceHandle();", "/* cache not reset */"],
  ]) {
    const tampered = {...edited, [dll]: candidate.replace(needle, replacement)};
    assert.throws(() => verifyExactPrivateSourceBytes(original, tampered),
      /unexpected modified source bytes/);
  }
});

test("kernel Box_Alloc rejects unowned names before BOX allocation", () => {
  const original = sources();
  const expected = buildExpectedPrivateSources(original);
  const driver = "Sandboxie/core/drv/box.c";
  const src = expected[driver];
  assert.match(src, /static int MivubiBoxNameAllowed\(/);
  assert.match(src, /if \(!MivubiBoxNameAllowed\(boxname\)\)/);
  assert.ok(src.indexOf("return NULL;") < src.indexOf("BOX *box = Mem_Alloc"));
  assert.match(src, /STATUS_ACCESS_DENIED/);
  const replaced = {...expected, [driver]: src.replace(
    "if (!MivubiBoxNameAllowed(boxname))",
    "if (MivubiBoxNameAllowed(boxname))")};
  assert.throws(() => verifyExactPrivateSourceBytes(original, replaced),
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
