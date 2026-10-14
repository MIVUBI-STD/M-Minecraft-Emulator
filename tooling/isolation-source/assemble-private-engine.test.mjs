import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { stagePrivateCore } from './assemble-private-engine.mjs';
import { SOURCE_FILES } from '../../engine/isolation-native/fork-overlay/apply-private-source.mjs';

const PIN='abd4c240031cfb46666daa74ca47ed4e48b561e4';
const SHA = bytes=>createHash('sha256').update(bytes).digest('hex');
const required = [
  'Sandboxie/Bin/Win32/SbieRelease/SbieSvc.exe',
  'Sandboxie/Bin/Win32/SbieRelease/SbieDll.dll',
  ...['SbieDrv.sys','SbieSvc.exe','SbieDll.dll','Start.exe','SbieIni.exe',
    'kmdutil.exe','SbieMsg.dll','SandboxieRpcSs.exe','SandboxieDcomLaunch.exe',
    'SandboxieCrypto.exe','SandboxieBITS.exe','SandboxieWUAU.exe','SbieCtrl.exe',
    'SboxHostDll.dll'].map(f=>'Sandboxie/Bin/x64/SbieRelease/'+f),
];
const resources=['Templates.ini','SbieSettings.ini','Manifest0.txt',
  'Manifest1.txt','Manifest2.txt'].map(f=>'Sandboxie/install/'+f);
const license=['LICENSE.Plus','Sandboxie/COPYING'];
function fixture() {
  const base=mkdtempSync(join(tmpdir(),'mivubi-private-stage-'));
  const root=join(base,'fork');
  const output=join(base,'payload');
  mkdirSync(root);
  function file(path,bytes=Buffer.from('fixture:'+path)) {
    const name=join(root,...path.split('/'));
    mkdirSync(dirname(name),{recursive:true});
    writeFileSync(name,bytes);
    return {path,sizeBytes:bytes.length,sha256:SHA(bytes),authenticode:'NotSigned'};
  }
  const artifacts=required.map(p=>file(p));
  for(const rel of [...resources,...license]) file(rel);
  const buildStages=[
    {id:'win32-support',platform:'Win32',exitCode:0},
    {id:'x64-core',platform:'x64',exitCode:0},
    {id:'x64-kernel',platform:'x64',exitCode:0},
  ];
  const manifest={upstream:{repository:'sandboxie-plus/Sandboxie',
    commit:PIN,tag:'v1.18.5',sourceLicenseFiles:license},
    buildStages:buildStages.map(({id,platform})=>({id,platform})),
    requiredArtifacts:required,sourceResources:resources,optionalSymbols:[
      'Sandboxie/Bin/x64/SbieRelease/SbieDrv.pdb',
    ]};
  const report={schema:1,state:'PRIVATE_CORE_BINARIES_BUILT_NOT_SIGNED_OR_RUN',
    upstreamCommit:PIN,privateForkHead:PIN,sourceFilesModified:[...SOURCE_FILES],
    sourceBuildMarker:'MIVUBI_PRIVATE_ISOLATION_BUILD',
    buildStages,artifacts,driverSigningPolicyAccepted:false,
    driverLoadVerified:false,installerReady:false,
    canCoexistWithOfficialSandboxie:false,microsoftSignInVerified:false,
    minecraftGameplayVerified:false,distributionApproved:false};
  return {base,root,output,manifest,report,
    cleanup:()=>rmSync(base,{force:true,recursive:true})};
}
const run=f=>stagePrivateCore({sourceRoot:f.root,manifest:f.manifest,
  report:f.report,outputDirectory:f.output},
  {checkSource:()=>({privateForkHead:PIN})});

test('assembles genuine file bytes into exclusive private payload with fork provenance',async()=>{
  const f=fixture();try {
    const result=await run(f);
    assert.equal(result.state,'PRIVATE_CORE_STAGED_NOT_INSTALLABLE');
    assert.equal(result.driverInstalled,false);
    const data=JSON.parse(readFileSync(join(f.output,'engine-provenance.json'),'utf8'));
    assert.equal(data.privateCoreBuild,true);
    assert.equal(data.privateForkHead,PIN);
    assert.deepEqual(data.sourceFilesModified,[...SOURCE_FILES]);
    assert.equal(data.canCoexistWithOfficialSandboxie,false);
    assert.equal(data.upstreamCommit,PIN);
    assert.equal(data.artifacts.length,required.length+resources.length+license.length);
    assert.ok(existsSync(join(f.output,'32','SbieDll.dll')));
    assert.ok(existsSync(join(f.output,'SbieDrv.sys')));
    assert.ok(existsSync(join(f.output,'LICENSES','Sandboxie','COPYING')));
    assert.ok(!existsSync(join(f.output,'_debug','x64','SbieDrv.pdb')));
    assert.match(readFileSync(join(f.output,'NOT-INSTALLABLE.txt'),'utf8'),/NOT installable/);
  }finally{f.cleanup();}
});
test('refuses modified fork report mislabeled as original upstream or as install-ready',async()=>{
  const f=fixture();try{
    for(const change of [
      {state:'BUILD_ARTIFACTS_COLLECTED'},
      {driverLoadVerified:true},
      {canCoexistWithOfficialSandboxie:true},
      {sourceFilesModified:['Sandboxie/core/drv/api.c']},
      {privateForkHead:'not-sha'},
    ]) {
      await assert.rejects(stagePrivateCore({sourceRoot:f.root,manifest:f.manifest,
        report:{...f.report,...change},outputDirectory:f.output},{checkSource:()=>{}}),
        /private build provenance/);
      assert.equal(existsSync(f.output),false);
    }
  }finally{f.cleanup();}
});
test('detects changed compiled binary bytes and rejects output without touching existing data',async()=>{
  const f=fixture();try {
    writeFileSync(join(f.root,...required[2].split('/')),'tampered binary');
    await assert.rejects(run(f),/binary bytes do not match/);
    assert.equal(existsSync(f.output),false);
  }finally{f.cleanup();}
});
test('fails closed on missing helper, license, or source resources',async()=>{
  const f=fixture();try {
    rmSync(join(f.root,...resources[0].split('/')));
    await assert.rejects(run(f));
    assert.equal(existsSync(f.output),false);
  }finally{f.cleanup();}
});
test('strict stage identity and artifact ordering cannot be forged',async()=>{
  const f=fixture();try {
    f.report.buildStages[2].exitCode=1;
    await assert.rejects(run(f),/compilation not proven/);
    f.report.buildStages[2].exitCode=0;
    f.report.artifacts.reverse();
    await assert.rejects(run(f),/artifact list/);
  }finally{f.cleanup();}
});
test('refuses existing payload directory and leaves it unchanged',async()=>{
  const f=fixture();try {
    mkdirSync(f.output);
    writeFileSync(join(f.output,'keep.txt'),'account-bearing data');
    await assert.rejects(run(f),/already exists/);
    assert.equal(readFileSync(join(f.output,'keep.txt'),'utf8'),'account-bearing data');
  }finally{f.cleanup();}
});
test('rejects symlink to external private binary even when self-reported hash matches',async t=>{
  const f=fixture();try {
    const target=join(f.root,...required[2].split('/'));
    rmSync(target);
    const external=join(f.base,'outside.sys');
    const bytes=Buffer.from('external');
    writeFileSync(external,bytes);
    try{symlinkSync(external,target)}catch(error){
      if(process.platform==='win32'&&['EPERM','EACCES'].includes(error.code)){
        t.skip('Windows symlink privilege unavailable');return;
      }
      throw error;
    }
    f.report.artifacts[2].sizeBytes=bytes.length;
    f.report.artifacts[2].sha256=SHA(bytes);
    await assert.rejects(run(f),/symlinked source artifact/);
  }finally{f.cleanup();}
});
