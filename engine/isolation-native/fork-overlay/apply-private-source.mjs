// Prepare the first EXCLUSIVE private Sandboxie-derived source fork.
// Actual C/C++ source changes, not only an audit report. The v1 branch keeps
// upstream Windows service/driver/IPC/ABI names intact: it may NOT coexist
// with the official Sandboxie service. Changes apply only to a separately
// cloned, clean, full-history working checkout (never the app submodule).
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {verifyCheckout} from "../../../tooling/isolation-source/verify-checkout.mjs";

const PIN = "abd4c240031cfb46666daa74ca47ed4e48b561e4";
const ABI = "0x57230";
const ANCHOR = '#include "common/my_version.h"';
const VERSION_ANCHOR = "#define MY_ABI_VERSION  0x57230";
const GUARD = [
  "",
  "// MIVUBI private source build: match core driver/service/DLL/launcher ABI.",
  "#if !defined(MIVUBI_PRIVATE_ISOLATION_BUILD) || MIVUBI_PRIVATE_ISOLATION_BUILD != 0x4D495655 || MY_ABI_VERSION != MIVUBI_PRIVATE_ISOLATION_ABI",
  "#error MIVUBI_isolation_build_requires_matching_pinned_core",
  "#endif",
];
const MARKERS = [
  "#define MIVUBI_PRIVATE_ISOLATION_BUILD 0x4D495655",
  "#define MIVUBI_PRIVATE_ISOLATION_ABI   0x57230",
];

// The first FUNCTIONAL fork extension lives in the private Start.exe binary,
// not in a second launcher or a renamed upstream service. /mivubi_client:02,
// :03 and :04 route to distinct reserved persistent box names. This is
// intentionally opt-in; all upstream Start.exe switches retain their meaning.
// The private core still uses upstream SbieSvc/SbieDrv and cannot co-install.
const START_PATH = "Sandboxie/apps/start/start.cpp";
const DRIVER_PATH = "Sandboxie/core/drv/api.c";
const DLL_PATH = "Sandboxie/core/dll/sbieapi.c";
const SVC_START_PATH = "Sandboxie/core/svc/DriverAssistStart.cpp";
const DLL_ARG_ANCHOR = "    args->string.val = version_string;";
const DLL_ERROR_ANCHOR = "    if (! NT_SUCCESS(status)){";
const DLL_ABI_ANCHOR = "    args->abi_ver.val = abi_version;";
const DLL_HANDLE_ANCHOR = "HANDLE SbieApi_DeviceHandle = INVALID_HANDLE_VALUE;";
const DLL_NULL_ANCHOR = "    if (parms == NULL) { // close request as used by kmdutil";
const DLL_OPEN_ANCHOR = "    if (SbieApi_DeviceHandle == INVALID_HANDLE_VALUE) {";
const DLL_HANDLE_RESET = [
  "#if defined(MIVUBI_PRIVATE_ISOLATION_BUILD)",
  "        // Reopening even with a reused HANDLE value revokes prior trust.",
  "        MivubiResetVerifiedDeviceHandle();",
  "#endif",
];
const DLL_DISPATCH_ANCHOR =
  "        // note that all requests are synchronous which means";
const DLL_HANDLE_PROBE = [
  "#if defined(MIVUBI_PRIVATE_ISOLATION_BUILD)",
  "// Bind ordinary private DLL calls to the opened driver BEFORE sending",
  "// any non-version ioctl. Query once per opened handle, not per game call.",
  "// SbieDll can receive calls on multiple threads. The approval cache",
  "// must use atomic accesses; this does not serialize upstream handle I/O.",
  "static PVOID volatile MivubiVerifiedDeviceHandle = INVALID_HANDLE_VALUE;",
  "static HANDLE MivubiReadVerifiedDeviceHandle(void)",
  "{",
  "    return (HANDLE)InterlockedCompareExchangePointer(",
  "        &MivubiVerifiedDeviceHandle, INVALID_HANDLE_VALUE,",
  "        INVALID_HANDLE_VALUE);",
  "}",
  "static void MivubiResetVerifiedDeviceHandle(void)",
  "{",
  "    InterlockedExchangePointer(",
  "        &MivubiVerifiedDeviceHandle, INVALID_HANDLE_VALUE);",
  "}",
  "static NTSTATUS MivubiVerifyOpenedDevice(void)",
  "{",
  "    WCHAR version[16] = {0};",
  "    ULONG abi = 0;",
  "    __declspec(align(8)) ULONG64 args[API_NUM_ARGS];",
  "    API_GET_VERSION_ARGS *versionArgs = (API_GET_VERSION_ARGS *)args;",
  "    IO_STATUS_BLOCK ioStatus;",
  "    NTSTATUS status;",
  "    memzero(args, sizeof(args));",
  "    versionArgs->func_code = API_GET_VERSION;",
  "    versionArgs->string.val = version;",
  "    versionArgs->abi_ver.val = &abi;",
  "    if (__sys_NtDeviceIoControlFile)",
  "        status = __sys_NtDeviceIoControlFile(",
  "            SbieApi_DeviceHandle, NULL, NULL, NULL, &ioStatus,",
  "            API_SBIEDRV_CTLCODE, args, sizeof(ULONG64) * 8, NULL, 0);",
  "    else",
  "        status = NtDeviceIoControlFile(",
  "            SbieApi_DeviceHandle, NULL, NULL, NULL, &ioStatus,",
  "            API_SBIEDRV_CTLCODE, args, sizeof(ULONG64) * 8, NULL, 0);",
  "    if (!NT_SUCCESS(status)) return status;",
  "    return MivubiOwnedDriverMatches(version, 16, abi)",
  "        ? STATUS_SUCCESS : STATUS_REVISION_MISMATCH;",
  "}",
  "#endif",
];
const DLL_EARLY_CLOSE = [
  "#if defined(MIVUBI_PRIVATE_ISOLATION_BUILD)",
  "    // Avoid the upstream close-path fallthrough to parms[0].",
  "    if (parms == NULL) {",
  "        if (SbieApi_DeviceHandle != INVALID_HANDLE_VALUE)",
  "            NtClose(SbieApi_DeviceHandle);",
  "        SbieApi_DeviceHandle = INVALID_HANDLE_VALUE;",
  "        MivubiResetVerifiedDeviceHandle();",
  "        return STATUS_SUCCESS;",
  "    }",
  "#endif",
];
const DLL_BEFORE_DISPATCH = [
  "#if defined(MIVUBI_PRIVATE_ISOLATION_BUILD)",
  "        if (parms[0] != API_GET_VERSION &&",
  "                MivubiReadVerifiedDeviceHandle() != SbieApi_DeviceHandle) {",
  "            status = MivubiVerifyOpenedDevice();",
  "            if (!NT_SUCCESS(status)) return status;",
  "            InterlockedExchangePointer(",
  "                &MivubiVerifiedDeviceHandle, SbieApi_DeviceHandle);",
  "        }",
  "#endif",
];
const SVC_INCLUDE_ANCHOR = '#include "core/drv/verify.h"';
const SVC_START_ANCHOR = "    LONG rc = SbieApi_GetVersionEx(NULL, NULL);";
const SVC_START_INCLUDE = ['#include "common/my_version.h"', ...GUARD];
const DLL_PRIVATE_ARGS = [
  "#if defined(MIVUBI_PRIVATE_ISOLATION_BUILD)",
  "    WCHAR mivubiVersion[16] = {0};",
  "    ULONG mivubiAbi = 0;",
  "    args->string.val = mivubiVersion;",
  "    args->abi_ver.val = &mivubiAbi;",
  "#else",
];
const DLL_PRIVATE_ARGS_END = [
  "#endif",
];
const DLL_CHECK = [
  "#if defined(MIVUBI_PRIVATE_ISOLATION_BUILD)",
  "    // Gate GetVersionEx even when the caller requested NULL outputs.",
  "    if (NT_SUCCESS(status)) {",
  "        if (!MivubiOwnedDriverMatches(mivubiVersion, 16, mivubiAbi))",
  "            status = STATUS_REVISION_MISMATCH;",
  "        else {",
  "            if (version_string) wcscpy(version_string, mivubiVersion);",
  "            if (abi_version) *abi_version = mivubiAbi;",
  "        }",
  "    }",
  "#endif",
];
const SERVICE_FOREIGN_DRIVER = [
  "#if defined(MIVUBI_PRIVATE_ISOLATION_BUILD)",
  "    // Do not attempt NtLoadDriver when another Sandboxie driver is alive.",
  "    // The private DLL returns REVISION_MISMATCH for an official kernel.",
  "    if (rc == STATUS_REVISION_MISMATCH) {",
  "        LogEvent(MSG_9234, 0x9154, rc);",
  "        AbortServer();",
  "        return 0;",
  "    }",
  "#endif",
];

const DRIVER_VERSION_ANCHOR =
  "    API_GET_VERSION_ARGS *args = (API_GET_VERSION_ARGS *)parms;";
// This portable identity is inlined into BOTH kernel API and private Start.
// Existing kernel ABI/IOCTL/function codes remain exactly the pinned upstream.
const CORE_IDENTITY = readFileSync(
  new URL("../owned-runtime/mivubi_core_identity.h", import.meta.url),
  "utf8").trimEnd().split("\n");
const DRIVER_IDENTITY_OVERRIDE = [
  "#if defined(MIVUBI_PRIVATE_ISOLATION_BUILD)",
  "    // Change only the private fork's GET_VERSION response, not its ABI.",
  "    const WCHAR *Driver_Version = MIVUBI_PRIVATE_DRIVER_ID;",
  "#endif",
];
const START_PARSE_ANCHOR =
  '    if (_wcsicmp(cmd, L"run_sbie_ctrl") == 0 || _wcsnicmp(cmd, L"open_agent", 10) == 0) {';
// The canonical portable C++ parser is compiled by independent tests and
// INLINED into pinned Start.cpp: the standalone upstream clone needs no
// external MIVUBI header include path during MSVC compilation.
const START_POLICY = readFileSync(
  new URL("../owned-runtime/mivubi_owned_start_policy.h", import.meta.url),
  "utf8").trimEnd().split("\n");
const START_DISPATCH = [
  "#if defined(MIVUBI_PRIVATE_ISOLATION_BUILD)",
  "    // MIVUBI-only opt-in: explicit, bounded client selection BEFORE restart.",
  "    MivubiOwnedLaunch ownedLaunch{nullptr, nullptr};",
  "    const MivubiOwnedDecision result = MivubiParseOwnedStart(cmd, &ownedLaunch);",
  "    if (result == MivubiOwnedDecision::Rejected) return FALSE;",
  "    if (result == MivubiOwnedDecision::Admitted) {",
  "        // Never route a MIVUBI-owned box through the official driver.",
  "        WCHAR observedVersion[16] = {0};",
  "        ULONG observedAbi = 0;",
  "        if (!NT_SUCCESS(SbieApi_GetVersionEx(observedVersion, &observedAbi)) ||",
  "            !MivubiOwnedDriverMatches(observedVersion, 16, observedAbi))",
  "            return FALSE;",
  "        wcscpy(BoxName, ownedLaunch.box);",
  "        cmd = ownedLaunch.command;",
  "    }",
  "#endif",
];

export const SOURCE_FILES = Object.freeze([
  "Sandboxie/common/my_version.h",
  "Sandboxie/core/drv/api.c",
  "Sandboxie/core/dll/sbieapi.c",
  "Sandboxie/core/svc/DriverAssist.cpp",
  "Sandboxie/core/svc/DriverAssistStart.cpp",
  "Sandboxie/apps/start/start.cpp",
  "Sandboxie/apps/ini/main.c",
  "Sandboxie/install/kmdutil/kmdutil.c",
]);

function assert(condition, message) {
  if (!condition) throw new Error("Private fork source refused: " + message);
}
function onlyOnce(source, anchor, path) {
  assert(typeof source === "string" && source.includes(anchor) &&
    source.split(anchor).length === 2, "upstream anchor changed in " + path);
}
function hunk(source, path, anchor, added, before = false, offset = 0, headers = true) {
  onlyOnce(source, anchor, path);
  // Git applies a context hunk against the INDEX, not against a matching
  // isolated line. An anchor-only hunk can fail despite an exact match.
  // The pinned upstream files have LF endings and a following source line.
  assert(!source.includes("\r\n"), "upstream newline format changed in " + path);
  const at = source.indexOf(anchor);
  const after = source.slice(at + anchor.length);
  assert(after.startsWith("\n") && after.length > 1,
    "upstream trailing patch context missing in " + path);
  const followingLine = after.slice(1).split("\n")[0];
  const line = source.slice(0, at).split("\n").length;
  const plus = added.map(text => "+" + text).join("\n");
  return [
    ...(headers ? [
      "diff --git a/" + path + " b/" + path,
      "--- a/" + path,
      "+++ b/" + path,
    ] : []),
    "@@ -" + line + ",2 +" + (line + offset) + "," + (added.length + 2) + " @@",
    ...(before ? [plus, " " + anchor, " " + followingLine] :
      [" " + anchor, plus, " " + followingLine]),
    "",
  ].join("\n");
}

// Three GetVersionEx edits touch adjacent original lines. Git refuses
// overlapping unified-diff context hunks, even when each anchor matches.
// Emit one coherent hunk spanning all three edits.
function dllVersionHunk(source, path, offset) {
  for (const anchor of [DLL_ARG_ANCHOR, DLL_ABI_ANCHOR, DLL_ERROR_ANCHOR])
    onlyOnce(source, anchor, path);
  const lines = source.split("\n");
  const first = lines.indexOf(DLL_ARG_ANCHOR);
  const last = lines.indexOf(DLL_ERROR_ANCHOR);
  assert(first >= 0 && first < last && last + 1 < lines.length,
    "upstream GetVersionEx body changed in " + path);
  const original = lines.slice(first, last + 2);
  const generated = [];
  for (const line of original) {
    if (line === DLL_ARG_ANCHOR)
      generated.push(...DLL_PRIVATE_ARGS.map(value => "+" + value));
    if (line === DLL_ERROR_ANCHOR)
      generated.push(...DLL_CHECK.map(value => "+" + value));
    generated.push(" " + line);
    if (line === DLL_ABI_ANCHOR)
      generated.push(...DLL_PRIVATE_ARGS_END.map(value => "+" + value));
  }
  const count = original.length + DLL_PRIVATE_ARGS.length +
    DLL_PRIVATE_ARGS_END.length + DLL_CHECK.length;
  return ["@@ -" + (first + 1) + "," + original.length +
    " +" + (first + 1 + offset) + "," + count + " @@",
    ...generated, ""].join("\n");
}

/** Pure transformation based on exact pinned upstream bytes. */
export function buildPrivateSourcePatch(files) {
  assert(files && typeof files === "object" && !Array.isArray(files),
    "source file collection required");
  assert(Object.keys(files).length === SOURCE_FILES.length &&
    SOURCE_FILES.every(path => typeof files[path] === "string"),
    "the exact pinned source-file closure is required");
  const header = files[SOURCE_FILES[0]];
  onlyOnce(header, VERSION_ANCHOR, SOURCE_FILES[0]);
  for (const original of [
    '#define SBIEDRV                 L"SbieDrv"',
    '#define SBIESVC                 L"SbieSvc"',
    '#define SANDBOXIE_INI           L"Sandboxie.ini"',
    '#define FILTER_ALTITUDE         L"86900"',
  ]) {
    assert(header.includes(original), "core upstream identity changed: " + original);
  }
  assert(!header.includes("MIVUBI_PRIVATE_ISOLATION_BUILD"),
    "private marker already applied");
  const parts = [hunk(header, SOURCE_FILES[0], VERSION_ANCHOR, MARKERS)];
  for (const path of SOURCE_FILES.slice(1)) {
    assert(!files[path].includes("MIVUBI_PRIVATE_ISOLATION_BUILD"),
      "private marker already present: " + path);
    const includeAnchor = path === SVC_START_PATH ? SVC_INCLUDE_ANCHOR : ANCHOR;
    const additions = path === START_PATH
      ? [...GUARD, "", ...CORE_IDENTITY, "", ...START_POLICY]
      : path === DRIVER_PATH || path === DLL_PATH
        ? [...GUARD, "", ...CORE_IDENTITY]
      : path === SVC_START_PATH ? SVC_START_INCLUDE : GUARD;
    parts.push(hunk(files[path], path, includeAnchor, additions,
      path === SVC_START_PATH));
    if (path === DRIVER_PATH) {
      // Kernel returns a private runtime identity through the EXISTING
      // API_GET_VERSION response. No ioctl or argument-structure change.
      onlyOnce(files[path], DRIVER_VERSION_ANCHOR, path);
      parts.push(hunk(files[path], path, DRIVER_VERSION_ANCHOR,
        DRIVER_IDENTITY_OVERRIDE, true, additions.length, false));
    }
    if (path === DLL_PATH) {
      // Preserve the original ABI while querying identity even for callers
      // that supplied NULL pointers (notably the service startup sequence).
      for (const anchor of [
        DLL_HANDLE_ANCHOR, DLL_NULL_ANCHOR, DLL_OPEN_ANCHOR,
        DLL_DISPATCH_ANCHOR, DLL_ARG_ANCHOR, DLL_ABI_ANCHOR,
        DLL_ERROR_ANCHOR,
      ]) onlyOnce(files[path], anchor, path);
      let offset = additions.length;
      parts.push(hunk(files[path], path, DLL_HANDLE_ANCHOR,
        DLL_HANDLE_PROBE, false, offset, false));
      offset += DLL_HANDLE_PROBE.length;
      parts.push(hunk(files[path], path, DLL_NULL_ANCHOR,
        DLL_EARLY_CLOSE, true, offset, false));
      offset += DLL_EARLY_CLOSE.length;
      parts.push(hunk(files[path], path, DLL_OPEN_ANCHOR,
        DLL_HANDLE_RESET, false, offset, false));
      offset += DLL_HANDLE_RESET.length;
      parts.push(hunk(files[path], path, DLL_DISPATCH_ANCHOR,
        DLL_BEFORE_DISPATCH, true, offset, false));
      offset += DLL_BEFORE_DISPATCH.length;
      parts.push(dllVersionHunk(files[path], path, offset));
    }
    if (path === SVC_START_PATH) {
      onlyOnce(files[path], SVC_START_ANCHOR, path);
      parts.push(hunk(files[path], path, SVC_START_ANCHOR,
        SERVICE_FOREIGN_DRIVER, false, additions.length, false));
    }
    if (path === START_PATH) {
      // Functional C++ admission is shared with native regression tests.
      onlyOnce(files[path], START_PARSE_ANCHOR, path);
      parts.push(hunk(files[path], path, START_PARSE_ANCHOR,
        START_DISPATCH, true, additions.length, false));
    }
  }
  return parts.join("");
}

/** Produce the exact bytes expected from the approved functional fork.
 * This is shared by the verifier and regression tests: no duplicate patch
 * implementations are allowed to silently diverge. */
export function buildExpectedPrivateSources(original) {
  buildPrivateSourcePatch(original);
  const expected = {};
  for (const [index, path] of SOURCE_FILES.entries()) {
    const anchor = index === 0 ? VERSION_ANCHOR
      : path === SVC_START_PATH ? SVC_INCLUDE_ANCHOR : ANCHOR;
    const additions = index === 0 ? MARKERS
      : path === START_PATH ? [...GUARD, "", ...CORE_IDENTITY, "", ...START_POLICY]
      : path === DRIVER_PATH || path === DLL_PATH
        ? [...GUARD, "", ...CORE_IDENTITY]
      : path === SVC_START_PATH ? SVC_START_INCLUDE : GUARD;
    const newline = original[path].includes("\r\n") ? "\r\n" : "\n";
    let value = original[path].replace(anchor,
      (path === SVC_START_PATH ? [...additions, anchor] : [anchor, ...additions])
        .join(newline));
    if (path === DRIVER_PATH) {
      onlyOnce(original[path], DRIVER_VERSION_ANCHOR, path);
      value = value.replace(DRIVER_VERSION_ANCHOR,
        [...DRIVER_IDENTITY_OVERRIDE, DRIVER_VERSION_ANCHOR].join(newline));
    }
    if (path === DLL_PATH) {
      for (const anchor of [
        DLL_HANDLE_ANCHOR, DLL_NULL_ANCHOR, DLL_OPEN_ANCHOR,
        DLL_DISPATCH_ANCHOR, DLL_ARG_ANCHOR, DLL_ABI_ANCHOR,
        DLL_ERROR_ANCHOR,
      ]) onlyOnce(original[path], anchor, path);
      value = value.replace(DLL_HANDLE_ANCHOR,
        [DLL_HANDLE_ANCHOR, ...DLL_HANDLE_PROBE].join(newline));
      value = value.replace(DLL_NULL_ANCHOR,
        [...DLL_EARLY_CLOSE, DLL_NULL_ANCHOR].join(newline));
      value = value.replace(DLL_OPEN_ANCHOR,
        [DLL_OPEN_ANCHOR, ...DLL_HANDLE_RESET].join(newline));
      value = value.replace(DLL_DISPATCH_ANCHOR,
        [...DLL_BEFORE_DISPATCH, DLL_DISPATCH_ANCHOR].join(newline));
      value = value.replace(DLL_ARG_ANCHOR,
        [...DLL_PRIVATE_ARGS, DLL_ARG_ANCHOR].join(newline));
      value = value.replace(DLL_ABI_ANCHOR,
        [DLL_ABI_ANCHOR, ...DLL_PRIVATE_ARGS_END].join(newline));
      value = value.replace(DLL_ERROR_ANCHOR,
        [...DLL_CHECK, DLL_ERROR_ANCHOR].join(newline));
    }
    if (path === SVC_START_PATH) {
      onlyOnce(original[path], SVC_START_ANCHOR, path);
      value = value.replace(SVC_START_ANCHOR,
        [SVC_START_ANCHOR, ...SERVICE_FOREIGN_DRIVER].join(newline));
    }
    if (path === START_PATH) {
      onlyOnce(original[path], START_PARSE_ANCHOR, path);
      value = value.replace(START_PARSE_ANCHOR,
        [...START_DISPATCH, START_PARSE_ANCHOR].join(newline));
    }
    expected[path] = value;
  }
  return expected;
}

/** Reject any committed Git blob outside the reviewed functional extension. */
export function verifyExactPrivateSourceBytes(original, edited) {
  const expected = buildExpectedPrivateSources(original);
  assert(edited && Object.keys(edited).length === SOURCE_FILES.length,
    "modified source closure incomplete");
  for (const path of SOURCE_FILES) {
    assert(edited[path] === expected[path],
      "unexpected modified source bytes: " + path);
  }
  return true;
}

function gitRaw(root, args) {
  const result = spawnSync("git", ["-C", root, ...args], {
    encoding: "utf8", timeout: 60000, windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error("Private fork Git read failed: " + args[0] +
      ": " + (result.error?.message ?? (result.stderr || "").slice(0, 650)));
  }
  return result.stdout || "";
}

/** Bind a private build to one clean, committed, exact upstream-derived patch. */
export function verifyCommittedPrivateFork(rootDirectory) {
  assert(typeof rootDirectory === "string" && rootDirectory.trim(),
    "checkout location required");
  const root = resolve(rootDirectory);
  assert(git(root, ["rev-parse", "--is-shallow-repository"]) === "false",
    "shallow private fork refused");
  assert(git(root, ["remote", "get-url", "upstream"]) ===
    "https://github.com/sandboxie-plus/Sandboxie.git",
    "unexpected upstream remote");
  assert(git(root, ["branch", "--show-current"]) === "isolation/baseline-v1.18.5",
    "unexpected private branch");
  assert(git(root, ["status", "--porcelain=v1", "--untracked-files=all"]) === "",
    "private fork must have a clean committed index and worktree");
  const head = git(root, ["rev-parse", "HEAD"]);
  assert(head !== PIN && /^[a-f0-9]{40}$/.test(head),
    "a distinct private fork commit is required");
  const parents = git(root, ["rev-list", "--parents", "-n", "1", "HEAD"]).split(" ");
  assert(parents.length === 2 && parents[0] === head && parents[1] === PIN,
    "private commit must be a single direct child of pinned upstream");
  const changed = git(root, ["diff", "--name-only", PIN, head])
    .split("\n").filter(Boolean);
  assert(changed.length === SOURCE_FILES.length &&
    SOURCE_FILES.every(path => changed.includes(path)),
    "private commit must modify the entire approved source-file closure");
  const original = Object.fromEntries(SOURCE_FILES.map(path => [
    path, gitRaw(root, ["show", PIN + ":" + path]),
  ]));
  const edited = Object.fromEntries(SOURCE_FILES.map(path => [
    path, gitRaw(root, ["show", head + ":" + path]),
  ]));
  verifyExactPrivateSourceBytes(original, edited);
  const privateForkTree = git(root, ["rev-parse", "HEAD^{tree}"]);
  const diff = gitRaw(root, ["diff", "--no-ext-diff", "--no-textconv",
    "--no-renames", "--full-index", "--binary", "--no-color", PIN, head]);
  assert(diff.length > 0 && /^[a-f0-9]{40}$/.test(privateForkTree),
    "private patch or tree missing");
  return {
    state: "PRIVATE_COMMITTED_SOURCE_VERIFIED_NOT_BUILT",
    privateForkHead: head,
    privateForkTree,
    privatePatchSha256: createHash("sha256").update(diff, "utf8").digest("hex"),
    sourceFilesModified: [...SOURCE_FILES],
  };
}

function git(root, args, input) {
  const result = spawnSync("git", ["-C", root, ...args], {
    encoding: "utf8", input, timeout: 60000, windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error("Private fork Git operation failed: " +
      (result.error?.message ?? (result.stderr || "").slice(0, 650)));
  }
  return (result.stdout || "").trim();
}

/**
 * Apply a SINGLE staged patch to the isolated private fork checkout.
 * Original Git ancestry and upstream copyright/license files are preserved.
 * Does not install a driver, sign binaries, edit main, or touch Minecraft data.
 */
export function preparePrivateForkSource(rootDirectory) {
  assert(typeof rootDirectory === "string" && rootDirectory.trim(),
    "checkout location required");
  const root = resolve(rootDirectory);
  verifyCheckout(root);
  const source = Object.fromEntries(SOURCE_FILES.map(path => [
    path, readFileSync(resolve(root, ...path.split("/")), "utf8"),
  ]));
  const patch = buildPrivateSourcePatch(source);
  // --index checks current index and worktree together; no partial
  // multi-file overwrite should be accepted from an anchored patch.
  git(root, ["apply", "--check", "--index", "--whitespace=error", "-"], patch);
  git(root, ["apply", "--index", "--whitespace=error", "-"], patch);
  const touched = git(root, ["diff", "--cached", "--name-only"])
    .split("\n").filter(Boolean);
  assert(touched.length === SOURCE_FILES.length &&
    SOURCE_FILES.every(path => touched.includes(path)),
    "unexpected indexed source changes");
  assert(git(root, ["rev-parse", "HEAD"]) === PIN,
    "source parent revision changed after patch");
  return {
    state: "PRIVATE_CORE_SOURCE_PATCH_STAGED_NOT_COMPILED",
    upstreamCommit: PIN, sourceFiles: touched,
    upstreamDriverAbi: ABI, serviceDriverIpcNamesRenamed: false,
    sourcePatchApplied: true, coreBuilt: false,
    driverSigned: false, driverInstalled: false,
    canCoexistWithOfficialSandboxie: false,
    minecraftGameplayVerified: false,
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const verify = args.length === 3 &&
      args[0] === "--verify-committed" && args[1] === "--fork-root";
    const prepare = args.length === 2 && args[0] === "--fork-root";
    if (!verify && !prepare) {
      throw new Error("Usage: node apply-private-source.mjs [--verify-committed] --fork-root <separate-private-checkout>");
    }
    const result = verify ? verifyCommittedPrivateFork(args[2])
      : preparePrivateForkSource(args[1]);
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}
