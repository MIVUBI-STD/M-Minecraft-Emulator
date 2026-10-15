import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { stageOwnedV1186 } from './assemble-owned-v1186.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const HEAD='a'.repeat(40);
const TREE='b'.repeat(40);
const profile = JSON.parse(readFileSync(
  new URL('../../engine/isolation-native/owned-runtime/build-profile-v1186.json', import.meta.url),
  'utf8',
));
function fixture() {
  const base = mkdtempSync(join(tmpdir(),'mivubi-owned-v1186-'));
  const repository = join(base,'repo');
  const outputDirectory = join(base,'payload');
  const buildReport = join(base,'native-build.json');
  mkdirSync(repository);
  function file(relative, bytes=Buffer.from('owned test: '+relative)) {
    const full = join(repository,...relative.split('/'));
    mkdirSync(dirname(full),{recursive:true});
    writeFileSync(full,bytes);
    return bytes;
  }
  file('engine/isolation-native/owned-runtime/build-profile-v1186.json',
    JSON.stringify(profile));
  const artifacts=profile.requiredArtifacts.map(path=>{
    const bytes=file('engine/isolation-owned/'+path);
    return {path,bytes:bytes.length,sha256:sha(bytes)};
  });
  for (const path of [...profile.sourceResources,...profile.originalLicensesMustBeRetained]) {
    file('engine/isolation-owned/'+path);
  }
  const report={
    schema:1,state:'NATIVE_BUILD_ARTIFACTS_CAPTURED_NOT_INSTALLABLE',
    sourceVersion:'v1.18.6',repoHead:HEAD,upstreamTree:profile.pristineSourceTree,
    ownedTree:TREE,nativeModifiedFiles:11,
    compiler:{path:'C:\\VS\\MSBuild.exe',fileVersion:'17.0',sha256:'c'.repeat(64)},
    buildStages:profile.buildStages.map(row=>({
      stage:row.id,platform:row.platform,exitCode:0,
      stdoutLog:row.id+'.stdout.log',stderrLog:row.id+'.stderr.log',
    })),
    artifacts,driverBuilt:true,driverSigned:false,driverLoaded:false,
    installPermitted:false,activeProviderChanged:false,
    minecraftGameplayVerified:false,
  };
  const save=()=>writeFileSync(buildReport,JSON.stringify(report));
  save();
  const adapters={
    verifySource:()=>({head:HEAD,ownedTree:TREE,nativeModifiedFiles:11}),
    readGit:(_root,...args)=>{
      const key=args.join(' ');
      if(key==='branch --show-current')return 'Local';
      if(key==='rev-parse HEAD')return HEAD;
      if(key==='rev-parse HEAD:engine/isolation-owned')return TREE;
      if(key==='rev-parse HEAD:engine/isolation-candidates/sandboxie-v1.18.6')
        return profile.pristineSourceTree;
      throw Error('Unexpected Git command in fixture: '+key);
    },
  };
  return {
    base,repository,outputDirectory,buildReport,report,save,
    run:()=>stageOwnedV1186({repository,buildReport,outputDirectory},adapters),
    clean:()=>rmSync(base,{force:true,recursive:true}),
  };
}
test('owned v1.18.6 build produces a closed read-only 25-file engine payload',async()=>{
  const f=fixture();try{
    const result=await f.run();
    assert.equal(result.state,'MIVUBI_V1186_CORE_STAGED_NOT_INSTALLABLE');
    assert.equal(result.artifactCount,25);
    assert.equal(result.providerSelected,false);
    assert.equal(result.installPermitted,false);
    const manifest=JSON.parse(readFileSync(join(f.outputDirectory,'engine-provenance.json'),'utf8'));
    assert.equal(manifest.schema,2);
    assert.equal(manifest.sourceVersion,'v1.18.6');
    assert.equal(manifest.upstreamCommit,profile.sourceCommit);
    assert.equal(manifest.ownedRepoHead,HEAD);
    assert.equal(manifest.ownedTree,TREE);
    assert.equal(manifest.nativeModifiedFiles,11);
    assert.equal(manifest.canCoexistWithOfficialSandboxie,false);
    assert.equal(manifest.windowsKernelDriverLoaded,false);
    assert.equal(manifest.artifacts.length,25);
    assert.ok(existsSync(join(f.outputDirectory,'SbieDrv.sys')));
    assert.ok(existsSync(join(f.outputDirectory,'32','SbieDll.dll')));
    assert.ok(existsSync(join(f.outputDirectory,'Templates.ini')));
    assert.ok(existsSync(join(f.outputDirectory,'LICENSES','LICENSE.Classic')));
    assert.ok(existsSync(join(f.outputDirectory,'LICENSES','Sandboxie','COPYING')));
    assert.match(readFileSync(join(f.outputDirectory,'NOT-INSTALLABLE.txt'),'utf8'),/NOT installable or co-installable/);
  }finally{f.clean();}
});
test('build report claiming loaded driver or signing cannot create package',async()=>{
  for(const key of ['driverSigned','driverLoaded','installPermitted',
    'activeProviderChanged','minecraftGameplayVerified']){
    const f=fixture();try{
      f.report[key]=true;f.save();
      await assert.rejects(f.run(),/unsafe runtime activation/);
      assert.equal(existsSync(f.outputDirectory),false);
    }finally{f.clean();}
  }
});
test('rejects missing, corrupt, reordered or skipped native build files',async()=>{
  const f=fixture();try{
    f.report.buildStages[2].exitCode=1;f.save();
    await assert.rejects(f.run(),/build stages not completed/);
    f.report.buildStages[2].exitCode=0;
    f.report.artifacts.reverse();f.save();
    await assert.rejects(f.run(),/artifact paths/);
    f.report.artifacts.reverse();f.save();
    writeFileSync(join(f.repository,'engine/isolation-owned',
      ...profile.requiredArtifacts[0].split('/')),'tampered');
    await assert.rejects(f.run(),/native output bytes differ/);
    assert.equal(existsSync(f.outputDirectory),false);
  }finally{f.clean();}
});
test('missing licensing/source resource and existing output preserve data',async()=>{
  const f=fixture();try{
    rmSync(join(f.repository,'engine/isolation-owned/LICENSE.Plus'));
    await assert.rejects(f.run());
    assert.equal(existsSync(f.outputDirectory),false);
  }finally{f.clean();}
  const g=fixture();try{
    mkdirSync(g.outputDirectory);
    writeFileSync(join(g.outputDirectory,'existing.txt'),'keep data');
    await assert.rejects(g.run(),/destination already exists/);
    assert.equal(readFileSync(join(g.outputDirectory,'existing.txt'),'utf8'),'keep data');
  }finally{g.clean();}
});
test('untrusted source HEAD, tree, report and path mismatch fail closed',async()=>{
  const f=fixture();try{
    for(const edit of [
      r=>r.repoHead='d'.repeat(40),
      r=>r.ownedTree='d'.repeat(40),
      r=>r.upstreamTree='d'.repeat(40),
      r=>r.state='BUILD_FAILED_OR_INCOMPLETE',
      r=>r.nativeModifiedFiles=10,
      r=>r.artifacts.pop(),
    ]){
      const r=structuredClone(f.report);edit(r);
      writeFileSync(f.buildReport,JSON.stringify(r));
      await assert.rejects(f.run());
      assert.equal(existsSync(f.outputDirectory),false);
    }
  }finally{f.clean();}
});
