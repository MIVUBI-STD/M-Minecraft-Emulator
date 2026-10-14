// Private-exclusive core artifacts -> the EXISTING owned engine payload layout.
// Refuses to treat a modified fork report as an unmodified upstream build.
// No driver/service install and no Tauri backend switch.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, join, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleEngine } from './assemble-engine.mjs';
import { SOURCE_FILES } from '../../engine/isolation-native/fork-overlay/apply-private-source.mjs';

const PIN = 'abd4c240031cfb46666daa74ca47ed4e48b561e4';
const SHA = /^[a-f0-9]{64}$/;
const SHA_COMMIT = /^[a-f0-9]{40}$/;
const UPSTREAM = 'https://github.com/sandboxie-plus/Sandboxie.git';
const BRANCH = 'isolation/baseline-v1.18.5';
const STATUS = 'PRIVATE_CORE_BINARIES_BUILT_NOT_SIGNED_OR_RUN';

const refuse = (yes, message) => {
  if (!yes) throw new Error('Private core staging refused: ' + message);
};
function same(a,b) {
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
}
function command(root, args) {
  const p = spawnSync('git', ['-C', root, ...args], {
    encoding:'utf8', timeout: 15000, maxBuffer: 1024 * 1024, windowsHide: true,
  });
  refuse(!p.error && p.status === 0, 'source git verification failed: ' + args[0]);
  return p.stdout.trim();
}
function safeFile(root, rel) {
  refuse(typeof rel === 'string' && /^[A-Za-z0-9._/-]+$/.test(rel) &&
    !rel.split('/').includes('..') && !rel.startsWith('/'), 'invalid source path');
  const file = resolve(root, ...rel.split('/'));
  const remainder = relative(root, file);
  refuse(remainder !== '..' && !remainder.startsWith('..'+sep) &&
    !isAbsolute(remainder), 'source escapes the fork checkout');
  let part = root;
  for (const component of rel.split('/')) {
    part = join(part, component);
    const stat = lstatSync(part);
    refuse(!stat.isSymbolicLink(), 'symlinked source artifact');
  }
  refuse(lstatSync(file).isFile(), 'source artifact not a file');
  return file;
}
async function sizeAndHash(path) {
  const hash = createHash('sha256');
  let size = 0;
  for await (const data of createReadStream(path)) {
    size += data.length;
    hash.update(data);
  }
  refuse(Number.isSafeInteger(size) && size > 0, 'source file size invalid');
  return {sizeBytes:size, sha256:hash.digest('hex')};
}
/** True source identity checks, not the unmodified-upstream verifier. */
export function verifyPrivateForkCheckout(root, report) {
  const real = realpathSync(root);
  refuse(same(real, root) && lstatSync(root).isDirectory(), 'redirected source root');
  refuse(command(root, ['rev-parse','--is-shallow-repository']) === 'false', 'shallow source');
  refuse(command(root, ['remote','get-url','upstream']) === UPSTREAM, 'unexpected source remote');
  refuse(command(root, ['branch','--show-current']) === BRANCH, 'wrong private branch');
  refuse(command(root, ['merge-base','--is-ancestor', PIN, 'HEAD']) === '', 'wrong ancestry');
  refuse(command(root, ['rev-parse','HEAD']) === report.privateForkHead, 'private fork SHA mismatch');
  const changed = new Set([
    ...command(root, ['diff','--name-only',PIN,'HEAD']).split('\n').filter(Boolean),
    ...command(root, ['diff','--cached','--name-only']).split('\n').filter(Boolean),
  ]);
  refuse(changed.size === SOURCE_FILES.length &&
    SOURCE_FILES.every(path=>changed.has(path)), 'unexpected patched source closure');
  const status = command(root, ['status','--porcelain=v1','--untracked-files=all'])
    .split('\n').filter(Boolean);
  refuse(status.every(row=>/^M  /.test(row) &&
    SOURCE_FILES.includes(row.slice(3))), 'unstaged or unrelated source changes');
  const header = readFileSync(safeFile(root, SOURCE_FILES[0]),'utf8');
  refuse(header.includes('#define MIVUBI_PRIVATE_ISOLATION_BUILD 0x4D495655') &&
    header.includes('#define MIVUBI_PRIVATE_ISOLATION_ABI   0x57230') &&
    header.includes('#define MY_ABI_VERSION  0x57230'), 'private fork ABI marker absent');
  for (const file of SOURCE_FILES.slice(1)) {
    refuse(readFileSync(safeFile(root,file),'utf8')
      .includes('#error MIVUBI_isolation_build_requires_matching_pinned_core'),
      'missing core translation-unit guard');
  }
  return {privateForkHead:report.privateForkHead,sourceFilesModified:[...SOURCE_FILES]};
}
function checkReport(manifest, report) {
  refuse(manifest?.upstream?.commit === PIN &&
    report?.schema === 1 && report.state === STATUS &&
    report.upstreamCommit === PIN && SHA_COMMIT.test(report.privateForkHead) &&
    report.sourceBuildMarker === 'MIVUBI_PRIVATE_ISOLATION_BUILD' &&
    JSON.stringify(report.sourceFilesModified) === JSON.stringify(SOURCE_FILES) &&
    report.driverSigningPolicyAccepted === false &&
    report.driverLoadVerified === false && report.installerReady === false &&
    report.canCoexistWithOfficialSandboxie === false &&
    report.microsoftSignInVerified === false &&
    report.minecraftGameplayVerified === false &&
    report.distributionApproved === false,
    'untrusted, incomplete or overstated private build provenance');
  const stages = manifest.buildStages;
  refuse(Array.isArray(report.buildStages) &&
    report.buildStages.length === stages.length &&
    report.buildStages.every((s,i)=>s.id===stages[i].id &&
      s.platform===stages[i].platform && s.exitCode===0),
    'native Win32/x64/driver compilation not proven');
  refuse(Array.isArray(report.artifacts) &&
    report.artifacts.length === manifest.requiredArtifacts.length &&
    report.artifacts.every((item,i)=>
      item.path===manifest.requiredArtifacts[i] &&
      SHA.test(item.sha256) && Number.isSafeInteger(item.sizeBytes) &&
      item.sizeBytes>0 && typeof item.authenticode === 'string'),
    'private build artifact list/order/hash invalid');
}
async function inspectPrivateArtifacts(root, manifest, report) {
  for (const row of report.artifacts) {
    const actual = await sizeAndHash(safeFile(root,row.path));
    refuse(actual.sha256===row.sha256 && actual.sizeBytes===row.sizeBytes,
      'private binary bytes do not match the compiled report: ' + row.path);
  }
  const resourceRows = [];
  for (const path of manifest.sourceResources) {
    const meta = await sizeAndHash(safeFile(root,path));
    resourceRows.push({path,kind:'source-resource',state:'PRESENT',...meta,
      authenticode:'NOT_EXECUTED'});
  }
  const symbols = [];
  for (const path of manifest.optionalSymbols) {
    const f = resolve(root,...path.split('/'));
    if (existsSync(f)) {
      const meta = await sizeAndHash(safeFile(root,path));
      symbols.push({path,kind:'optional-symbol',state:'PRESENT',...meta,
        authenticode:'NOT_EXECUTED'});
    } else {
      // Dangling symlink must not be silently reported as missing.
      try {
        const stat = lstatSync(f);
        refuse(!stat.isSymbolicLink(), 'dangling optional symbol symlink');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      symbols.push({path,kind:'optional-symbol',state:'MISSING',
        sizeBytes:null,sha256:null,authenticode:'NOT_EXECUTED'});
    }
  }
  for (const path of manifest.upstream.sourceLicenseFiles) {
    safeFile(root,path);
  }
  return [
    ...report.artifacts.map(item=>({...item,kind:'required',state:'PRESENT'})),
    ...resourceRows,...symbols,
  ];
}

/** Generates a private package with its identity, never a false upstream one. */
export async function stagePrivateCore({
  sourceRoot, manifest, report, outputDirectory,
}, {checkSource = verifyPrivateForkCheckout} = {}) {
  refuse(typeof sourceRoot === 'string' && sourceRoot.trim(), 'source directory required');
  const root = realpathSync(resolve(sourceRoot));
  checkReport(manifest,report);
  await checkSource(root,report);
  const data = await inspectPrivateArtifacts(root,manifest,report);
  const normalized = {
    compiledInThisInvocation:true,
    artifactResult:'BUILD_ARTIFACTS_COLLECTED',
    stageResults:report.buildStages.map(s=>({
      id:s.id,platform:s.platform,state:'COMPILED',
    })),
    artifacts:data,
  };
  const privateBuild = {
    kind:'PRIVATE_EXCLUSIVE_SOURCE',
    privateForkHead:report.privateForkHead,
    sourceBuildMarker:report.sourceBuildMarker,
    sourceFilesModified:[...SOURCE_FILES],
    canCoexistWithOfficialSandboxie:false,
  };
  // Reuse exactly the existing layout, atomic output and attribution owner.
  // Source and file-byte checks were performed above against the PRIVATE
  // report rather than claiming an unmodified upstream build.
  return assembleEngine({
    sourceRoot:root,manifest,report:normalized,outputDirectory,privateBuild,
  }, {
    checkSource:()=>undefined,
    checkFiles:()=>undefined,
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    refuse(args.length===8 && args[0]==='--fork-root' &&
      args[2]==='--manifest' && args[4]==='--private-report' &&
      args[6]==='--output',
      'usage: assemble-private-engine.mjs --fork-root <private-checkout> --manifest <baseline-manifest> --private-report <private-build.json> --output <new-dir>');
    const json = p=>JSON.parse(readFileSync(resolve(p),'utf8').replace(/^\uFEFF/,''));
    const result = await stagePrivateCore({
      sourceRoot:args[1],manifest:json(args[3]),
      report:json(args[5]),outputDirectory:args[7],
    });
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
  } catch (error) {
    process.stderr.write(error.message+'\n');
    process.exitCode=1;
  }
}
