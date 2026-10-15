import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {importFullSandboxie,OWNED_PATH} from './import-full-sandboxie.mjs';
function git(root,...args) {
 const r=spawnSync('git',['-C',root,...args],{encoding:'utf8'});
 assert.equal(r.status,0,`git ${args.join(' ')}: ${r.stderr}`);
 return r.stdout.trim();
}
function makeFixture(){
 const dir=mkdtempSync(join(tmpdir(),'mivubi-vendor-fixture-'));
 const seed=join(dir,'source'),repo=join(dir,'app');mkdirSync(seed);mkdirSync(repo);
 git(seed,'init','-b','master');git(seed,'config','user.name','Fixture');git(seed,'config','user.email','f@example.invalid');
 git(seed,'remote','add','origin','https://github.com/sandboxie-plus/Sandboxie.git');
 for(const file of ['LICENSE.Plus','LICENSE.Classic','Sandboxie/COPYING','SandboxiePlus/QSbieAPI/LICENSE','Sandboxie/core/drv/box.c','Sandboxie/core/svc/DriverAssist.cpp','Sandboxie/core/dll/sbieapi.c','Sandboxie/apps/start/start.cpp','SandboxiePlus/SandMan/Main.cpp','SandboxiePlus/qt-extra/resource.dat']){
  const p=join(seed,file);mkdirSync(dirname(p),{recursive:true});writeFileSync(p,`original ${file}\n`);
 }
 git(seed,'add','.');git(seed,'commit','-m','Pinned upstream fixture');git(seed,'tag','v1.18.5');
 const pin=git(seed,'rev-parse','HEAD');
 git(repo,'init','-b','Local');git(repo,'config','user.name','Fixture');git(repo,'config','user.email','f@example.invalid');
 writeFileSync(join(repo,'README.md'),'MIVUBI application\n');git(repo,'add','.');git(repo,'commit','-m','App baseline');
 const head=git(repo,'rev-parse','HEAD');return {dir,seed,repo,pin,head};
}
test('imports every original upstream tracked source byte as owned editable tree',()=>{
 const f=makeFixture();try{
  const r=importFullSandboxie({repoRoot:f.repo,seedRoot:f.seed,expectedHead:f.head,upstreamCommit:f.pin});
  assert.equal(r.state,'OWNED_SANDBOXIE_FULL_SOURCE_IMPORTED_NOT_BUILT');
  assert.equal(r.sourceTree,r.importedTree);
  assert.equal(r.importedFileCount,10);
  assert.equal(git(f.repo,'rev-parse',`HEAD:${OWNED_PATH}`),git(f.seed,'rev-parse','HEAD^{tree}'));
  assert.equal(readFileSync(join(f.repo,OWNED_PATH,'SandboxiePlus/SandMan/Main.cpp'),'utf8'),'original SandboxiePlus/SandMan/Main.cpp\n');
  assert.equal(git(f.repo,'branch','--show-current'),'Local');
  assert.equal(git(f.repo,'show',`${f.head}:README.md`),'MIVUBI application');
  assert.equal(git(f.repo,'status','--porcelain'),'');
  const ownedFile=join(f.repo,OWNED_PATH,'Sandboxie/core/drv/box.c');
  writeFileSync(ownedFile, 'MIVUBI own modification\n');
  assert.equal(readFileSync(join(f.seed,'Sandboxie/core/drv/box.c'),'utf8'),'original Sandboxie/core/drv/box.c\n');
 } finally {rmSync(f.dir,{recursive:true,force:true})}
});
test('refuses dirty Local, bad branch, existing owner directory, or changed HEAD before copying',()=>{
 const f=makeFixture();try{
  writeFileSync(join(f.repo,'stray.txt'),'must not overwrite');
  assert.throws(()=>importFullSandboxie({repoRoot:f.repo,seedRoot:f.seed,expectedHead:f.head,upstreamCommit:f.pin}),/working tree or index is dirty/);
  rmSync(join(f.repo,'stray.txt'));
  assert.throws(()=>importFullSandboxie({repoRoot:f.repo,seedRoot:f.seed,expectedHead:'a'.repeat(40),upstreamCommit:f.pin}),/Local moved/);
  git(f.repo,'checkout','-b','main');
  assert.throws(()=>importFullSandboxie({repoRoot:f.repo,seedRoot:f.seed,expectedHead:f.head,upstreamCommit:f.pin}),/only the Local branch/);
  git(f.repo,'checkout','Local');
  mkdirSync(join(f.repo,OWNED_PATH),{recursive:true});
  assert.throws(()=>importFullSandboxie({repoRoot:f.repo,seedRoot:f.seed,expectedHead:f.head,upstreamCommit:f.pin}),/already exists/);
 } finally {rmSync(f.dir,{recursive:true,force:true})}
});
