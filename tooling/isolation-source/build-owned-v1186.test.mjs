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
  assert.doesNotMatch(source, /\b(Start-Service|New-Service|sc\.exe|pnputil|signtool|bcdedit)\b/i);
  assert.match(source, /Report destination exists; use a new directory/);
});

test('builder resolves VS2022 deterministically and captures native MSBuild failure evidence', () => {
  assert.match(source, /Visual Studio\/Installer\/vswhere\.exe/);
  assert.match(source, /-version '\[17\.0,18\.0\)'/);
  assert.match(source, /MSBuild\/Current\/Bin\/MSBuild\.exe/);
  assert.match(source, /\$msbuildDigest = \(Get-FileHash -LiteralPath \$msbuild -Algorithm SHA256\)/);
  assert.match(source, /compiler = \[ordered\]@\{/);
  assert.match(source, /fileVersion = \[string\]\$msbuildFile\.VersionInfo\.FileVersion/);
  assert.match(source, /sha256 = \$msbuildDigest/);
  assert.doesNotMatch(source, /Get-Command msbuild\.exe/);
  assert.match(source, /Start-Process -FilePath \$msbuild/);
  assert.match(source, /-RedirectStandardOutput \$stdout/);
  assert.match(source, /-RedirectStandardError \$stderr/);
  assert.match(source, /stageResult\.exitCode = \[int\]\$process\.ExitCode/);
  assert.match(source, /stageResult\.launchFailure = \$_\.Exception\.Message/);
  assert.match(source, /\/nodeReuse:false/);
  assert.match(source, /\$report\.buildStages = \$results/);
  assert.match(source, /build-result\.json/);
});
