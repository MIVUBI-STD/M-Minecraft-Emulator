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
  "            !MivubiOwnedDriverMatches(observedVersion, observedAbi))",
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

/** Pure transformation based on exact pinned upstream bytes. */
export function buildPrivateSourcePatch(files) {
  assert(files && typeof files === "object" && !Array.isArray(files),
    "source file collection required");
  assert(Object.keys(files).length === SOURCE_FILES.length &&
    SOURCE_FILES.every(path => typeof files[path] === "string"),
    "the seven exact pinned source files are required");
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
    const additions = path === START_PATH
      ? [...GUARD, "", ...CORE_IDENTITY, "", ...START_POLICY]
      : path === DRIVER_PATH ? [...GUARD, "", ...CORE_IDENTITY] : GUARD;
    parts.push(hunk(files[path], path, ANCHOR, additions));
    if (path === DRIVER_PATH) {
      // Kernel returns a private runtime identity through the EXISTING
      // API_GET_VERSION response. No ioctl or argument-structure change.
      onlyOnce(files[path], DRIVER_VERSION_ANCHOR, path);
      parts.push(hunk(files[path], path, DRIVER_VERSION_ANCHOR,
        DRIVER_IDENTITY_OVERRIDE, true, additions.length, false));
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
    const anchor = index === 0 ? VERSION_ANCHOR : ANCHOR;
    const additions = index === 0 ? MARKERS
      : path === START_PATH ? [...GUARD, "", ...CORE_IDENTITY, "", ...START_POLICY]
      : path === DRIVER_PATH ? [...GUARD, "", ...CORE_IDENTITY] : GUARD;
    const newline = original[path].includes("\r\n") ? "\r\n" : "\n";
    let value = original[path].replace(anchor,
      [anchor, ...additions].join(newline));
    if (path === DRIVER_PATH) {
      onlyOnce(original[path], DRIVER_VERSION_ANCHOR, path);
      value = value.replace(DRIVER_VERSION_ANCHOR,
        [...DRIVER_IDENTITY_OVERRIDE, DRIVER_VERSION_ANCHOR].join(newline));
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
    "private commit must modify exactly seven authorized source files");
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
