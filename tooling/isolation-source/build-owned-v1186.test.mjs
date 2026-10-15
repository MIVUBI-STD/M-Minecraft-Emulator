import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./build-owned-v1186.ps1', import.meta.url), 'utf8');

test('v1.18.6 builder checks exact owned C/C++ source before any MSBuild call', () => {
  assert.match(source, /verify-owned-v1186\.mjs/);
  assert.match(source, /MIVUBI_V1186_NATIVE_SOURCE_PATCHED_NOT_BUILT/);
  assert.match(source, /nativeModifiedFiles -ne 11/);
  assert.match(source, /sourceFiles -ne 1627/);
  assert.match(source, /privateDriverIdentity -cne '5\.73\.6-MIVU'/);
  assert.match(source, /Working tree must be clean/);
  assert.ok(source.indexOf('verify-owned-v1186.mjs') < source.indexOf('foreach ($stage in $stages)'));
});

test('builder only compiles and captures unsigned artifacts, never installs a driver', () => {
  for (const stage of ['SandboxDll.sln','Sandbox.sln','SandboxDrv.sln']) {
    assert.ok(source.includes(stage), 'missing build stage '+stage);
  }
  for (const path of ['SbieDrv.sys','SbieSvc.exe','SbieDll.dll','Start.exe',
    'SbieIni.exe','kmdutil.exe']) assert.ok(source.includes(path));
  assert.match(source, /Preexisting native binary would contaminate build evidence/);
  assert.match(source, /NATIVE_BUILD_ARTIFACTS_CAPTURED_NOT_INSTALLABLE/);
  assert.match(source, /driverSigned = \$false/);
  assert.match(source, /driverLoaded = \$false/);
  assert.match(source, /installPermitted = \$false/);
  assert.match(source, /activeProviderChanged = \$false/);
  assert.doesNotMatch(source, /\b(Start-Service|New-Service|sc\.exe|pnputil|signtool|bcdedit|Start-Process)\b/i);
  assert.match(source, /Report destination exists; use a new directory/);
});
