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

test('build stages match the actual v1.18.6 solution projects and output directories', () => {
  const root = new URL('../../engine/isolation-owned/Sandboxie/', import.meta.url);
  const read = name => readFileSync(new URL(name, root), 'utf8');
  const stages = [
    ['SandboxDll.sln', 'Win32', ['SboxSvc', 'SboxDll']],
    ['Sandbox.sln', 'x64', ['Start', 'SbieIni', 'KmdUtil', 'SbieControl']],
    ['SandboxDrv.sln', 'x64', ['SboxDrv']],
  ];
  for (const [solution, platform, projectNames] of stages) {
    const contents = read(solution);
    assert.ok(contents.includes('SbieRelease|'+platform),
      'missing stage configuration: '+solution);
    for (const project of projectNames) {
      const line = contents.split(/\\r?\\n/).find(item => item.includes(' = "'+project+'", '));
      assert.ok(line, 'solution omits '+project+': '+solution);
      const id = line.match(/, "\\{([0-9a-fA-F-]{36})\\}"\\s*$/)?.[1];
      assert.ok(id, 'unrecognized project GUID: '+project);
      assert.ok(contents.includes('{'+id+'}.SbieRelease|'+platform+'.Build.0'),
        project+' is not scheduled to build in '+platform);
    }
  }
  for (const propsFile of ['Sandbox32.props', 'Sandbox64.props']) {
    const props = read(propsFile);
    assert.ok(props.includes('<OutDir>$(SolutionDir)Bin\\\\$(PlatformName)\\\\$(Configuration)\\\\</OutDir>'),
      'upstream output path drift: '+propsFile);
  }
  assert.match(source, /Sandboxie\\/Bin\\/Win32\\/SbieRelease\\/SbieSvc\\.exe/);
  assert.match(source, /Sandboxie\\/Bin\\/x64\\/SbieRelease\\/SbieDrv\\.sys/);
});
