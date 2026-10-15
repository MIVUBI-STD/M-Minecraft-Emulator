/**
 * Import ALL tracked files from the authentic pinned Sandboxie tag into the
 * MIVUBI application repository as a writable Git subtree snapshot.
 *
 * This does NOT install, load, compile or distribute a driver. The full source
 * remains subject to its ORIGINAL component licenses and attributions.
 *
 * CLI: node tooling/isolation-source/import-full-sandboxie.mjs \
 *   --seed engine/isolation-upstream/Sandboxie --expect-head <Local SHA>
 */
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyPinnedSeed } from './bootstrap-fork.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const UPSTREAM = 'https://github.com/sandboxie-plus/Sandboxie.git';
const PIN = 'abd4c240031cfb46666daa74ca47ed4e48b561e4';
const TAG = 'v1.18.5';
export const OWNED_PATH = 'engine/isolation-owned';

function refuse(condition, message) {
  if (!condition) throw new Error('Full Sandboxie source import refused: ' + message);
}
function git(root, args, timeout = 120000) {
  const r = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8', windowsHide: true, timeout, maxBuffer: 8 * 1024 * 1024,
  });
  refuse(!r.error && r.status === 0,
    `Git ${args[0]} failed: ${(r.error?.message || r.stderr || '').slice(0, 700)}`);
  return (r.stdout || '').trim();
}
function ordinaryDirectory(path) {
  let s;
  try { s = lstatSync(path); } catch { return false; }
  return s.isDirectory() && !s.isSymbolicLink() &&
    realpathSync(path) === resolve(path);
}

/** A one-time source COPY into the app's own Git tree, not a Git submodule.
 * Test-only overrides permit synthetic disposable Git fixtures. The CLI has
 * no options to override the authentic tag, root, prefix or upstream URL.
 */
export function importFullSandboxie({
  repoRoot, seedRoot, expectedHead, upstreamCommit = PIN, tag = TAG,
  upstreamUrl = UPSTREAM,
}) {
  refuse(typeof expectedHead === 'string' && /^[a-f0-9]{40}$/.test(expectedHead),
    'an exact parent Local SHA is mandatory');
  const root = resolve(repoRoot), seed = resolve(root, seedRoot);
  refuse(ordinaryDirectory(root), 'application Git root must be an ordinary directory');
  refuse(git(root, ['rev-parse', '--show-toplevel']) === root,
    'must target the application repository root');
  refuse(git(root, ['branch', '--show-current']) === 'Local',
    'only the Local branch may receive the owned source');
  refuse(git(root, ['rev-parse', 'HEAD']) === expectedHead,
    'Local moved since the import was approved');
  refuse(git(root, ['status', '--porcelain=v1', '--untracked-files=all']) === '',
    'the application working tree or index is dirty');
  refuse(!existsSync(join(root, ...OWNED_PATH.split('/'))),
    'owned source prefix already exists; never replace existing source');
  refuse(git(root, ['ls-tree', '-r', '--name-only', 'HEAD', '--', OWNED_PATH]) === '',
    'owned source is already present in committed Git history');
  // The seed is a complete separate checkout, normally the initialized
  // pinned submodule. Never import from an official installed Sandboxie box.
  refuse(ordinaryDirectory(seed), 'pinned source seed is missing or redirected');
  verifyPinnedSeed(seed, { expectedCommit: upstreamCommit, tag,
    upstreamUrl });
  const sourceTree = git(seed, ['rev-parse', `${upstreamCommit}^{tree}`]);
  const tracked = git(seed, ['ls-tree', '-r', '--name-only', upstreamCommit]);
  for (const required of [
    'LICENSE.Plus', 'LICENSE.Classic', 'Sandboxie/COPYING',
    'SandboxiePlus/QSbieAPI/LICENSE', 'Sandboxie/core/drv/box.c',
    'Sandboxie/core/svc/DriverAssist.cpp', 'Sandboxie/core/dll/sbieapi.c',
    'Sandboxie/apps/start/start.cpp', 'SandboxiePlus/SandMan',
  ]) {
    // SandMan is a directory prefix; all other entries are tracked files.
    refuse(required === 'SandboxiePlus/SandMan' ?
      tracked.split('\n').some(p => p.startsWith(required + '/')) :
      tracked.split('\n').includes(required),
    'source seed lacks expected pinned component: ' + required);
  }
  // Squash avoids inflating the app repository with decades of unrelated
  // upstream commits, but the entire pinned file tree is copied byte-for-byte.
  // The original commit and the git subtree provenance remain recorded.
  git(root, ['subtree', 'add', '--prefix=' + OWNED_PATH, '--squash',
    seed, upstreamCommit, '-m',
    'feat(engine): import complete pinned Sandboxie source tree'], 600000);
  const importedTree = git(root, ['rev-parse', `HEAD:${OWNED_PATH}`]);
  refuse(importedTree === sourceTree,
    'imported source tree differs from the authentic pinned upstream tree');
  refuse(git(root, ['status', '--porcelain=v1', '--untracked-files=all']) === '',
    'subtree import did not leave a clean repository');
  return {
    state: 'OWNED_SANDBOXIE_FULL_SOURCE_IMPORTED_NOT_BUILT',
    upstreamCommit, sourceTree, importedTree, ownedPath: OWNED_PATH,
    importedFileCount: tracked.split('\n').filter(Boolean).length,
    appCommit: git(root, ['rev-parse', 'HEAD']),
    independentSourceFiles: true, privateEngineCompiled: false,
    driverInstalled: false, minecraftValidated: false,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 4 || args[0] !== '--seed' ||
        args[2] !== '--expect-head') {
      throw new Error('Usage: node import-full-sandboxie.mjs --seed <pinned-source-checkout> --expect-head <Local-SHA>');
    }
    const result = importFullSandboxie({ repoRoot: ROOT,
      seedRoot: args[1], expectedHead: args[3] });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  }
}
