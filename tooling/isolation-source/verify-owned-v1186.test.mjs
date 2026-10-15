import test from 'node:test';
import assert from 'node:assert/strict';
import {assessOwnedV1186, V1186_FILE_COUNT} from './verify-owned-v1186.mjs';

const approved = ['Sandboxie/common/my_version.h',
  'Sandboxie/core/drv/api.c', 'Sandboxie/apps/start/start.cpp'];
function fixture() {
  const candidate = new Map(), owned = new Map();
  for (let i = 0; i < V1186_FILE_COUNT - approved.length; i++) {
    const p = 'Sandboxie/common/file-' + i + '.h';
    const v = {mode:'100644', sha:'a'.repeat(40)};
    candidate.set(p,v); owned.set(p,{...v});
  }
  for (const p of approved) {
    candidate.set(p,{mode:'100644',sha:'a'.repeat(40)});
    owned.set(p,{mode:'100644',sha:'b'.repeat(40)});
  }
  return {candidate, owned};
}
test('only complete pinned source and the reviewed private delta are accepted', () => {
  const f = fixture(), result = assessOwnedV1186(f.candidate,f.owned,approved);
  assert.equal(result.sourceFiles,1627);
  assert.equal(result.nativeModifiedFiles,3);
  assert.equal(result.nativeBuildVerified,false);
});
test('missing upstream path or independently added path is refused', () => {
  const f = fixture();f.owned.delete('Sandboxie/common/file-0.h');
  assert.throws(()=>assessOwnedV1186(f.candidate,f.owned,approved),/incomplete/);
  f.owned.set('unexpected/source.c',{mode:'100644',sha:'a'.repeat(40)});
  assert.throws(()=>assessOwnedV1186(f.candidate,f.owned,approved),/missing/);
});
test('an unapproved native source modification is refused', () => {
  const f = fixture();
  f.owned.set('Sandboxie/common/file-0.h',{mode:'100644',sha:'c'.repeat(40)});
  assert.throws(()=>assessOwnedV1186(f.candidate,f.owned,approved),/exact approved/);
});
test('file-mode changes and accidentally unmodified overlay paths are refused', () => {
  const f = fixture();
  f.owned.set('Sandboxie/common/file-0.h',{mode:'100755',sha:'a'.repeat(40)});
  assert.throws(()=>assessOwnedV1186(f.candidate,f.owned,approved),/mode/);
  const g = fixture();
  g.owned.set(approved[0],{...g.candidate.get(approved[0])});
  assert.throws(()=>assessOwnedV1186(g.candidate,g.owned,approved),/exact approved/);
});
