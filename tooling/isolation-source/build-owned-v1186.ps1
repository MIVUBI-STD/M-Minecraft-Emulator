# Compile-only v1.18.6 MIVUBI native engine. NEVER installs, signs or starts drivers.
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$ReportDirectory,
  [string]$PackageDirectory = ''
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($env:OS -cne 'Windows_NT') { throw 'Native MSVC/WDK build requires Windows.' }
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$source = Join-Path $repo 'engine/isolation-owned'
$profile = Join-Path $repo 'engine/isolation-native/owned-runtime/build-profile-v1186.json'
$verifier = Join-Path $repo 'tooling/isolation-source/verify-owned-v1186.mjs'
$reportFolder = [IO.Path]::GetFullPath($ReportDirectory).TrimEnd('\')
if (-not (Test-Path -LiteralPath $source -PathType Container)) {
  throw 'Complete owned native source is missing.'
}
if (Test-Path -LiteralPath $reportFolder) {
  throw 'Report destination exists; use a new directory to preserve build evidence.'
}
$reportParent = Split-Path -Parent $reportFolder
if (-not (Test-Path -LiteralPath $reportParent -PathType Container)) {
  throw 'Report destination parent does not exist.'
}
$sourceFull = [IO.Path]::GetFullPath($source).TrimEnd('\')
if ($reportFolder.Equals($sourceFull, [StringComparison]::OrdinalIgnoreCase) -or
    $reportFolder.StartsWith($sourceFull + '\', [StringComparison]::OrdinalIgnoreCase) -or
    $sourceFull.StartsWith($reportFolder + '\', [StringComparison]::OrdinalIgnoreCase)) {
  throw 'Build report may not overlap native source.'
}
# The optional assembler refuses existing targets and destinations within
# the repository. Reject those predictable failures BEFORE spending time on
# three native MSBuild stages. The assembler remains the final path verifier.
if ($PackageDirectory) {
  $packageAbsolute = [IO.Path]::GetFullPath($PackageDirectory)
  $rootPath = [IO.Path]::GetPathRoot($packageAbsolute)
  if ($packageAbsolute.TrimEnd('\').Equals($rootPath.TrimEnd('\'),
      [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Engine package output must not be a drive root.'
  }
  $packageFolder = $packageAbsolute.TrimEnd('\')
  $repoFolder = [IO.Path]::GetFullPath($repo).TrimEnd('\')
  if ($packageFolder.Equals($repoFolder, [StringComparison]::OrdinalIgnoreCase) -or
      $packageFolder.StartsWith($repoFolder + '\', [StringComparison]::OrdinalIgnoreCase) -or
      $repoFolder.StartsWith($packageFolder + '\', [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Engine package output must be outside the repository checkout.'
  }
  if (Test-Path -LiteralPath $packageFolder) {
    throw 'Engine package destination already exists; refuse replacement.'
  }
  $packageParent = Split-Path -Parent $packageFolder
  if (-not (Test-Path -LiteralPath $packageParent -PathType Container)) {
    throw 'Engine package destination parent must exist before native compilation.'
  }
  # A junction anywhere in the parent chain could redirect an apparently
  # outside-checkout package path into the repository after MSBuild completes.
  # Check every ancestor now; the assembler still performs final realpath proof.
  $ancestor = $packageParent
  while ($ancestor) {
    $parentItem = Get-Item -LiteralPath $ancestor -Force -ErrorAction Stop
    if (($parentItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw 'Engine package parent must not be a Windows reparse point.'
    }
    $next = Split-Path -Parent $ancestor
    if (-not $next -or $next -eq $ancestor) { break }
    $ancestor = $next
  }
}
$git = (Get-Command git.exe -ErrorAction Stop).Source
$node = (Get-Command node.exe -ErrorAction Stop).Source
# A plain PowerShell session usually has no msbuild.exe on PATH. Resolve the
# VS2022 tool explicitly; this avoids accidentally using an older PATH binary.
$programFilesX86 = [Environment]::GetFolderPath('ProgramFilesX86')
$vswhere = Join-Path $programFilesX86 'Microsoft Visual Studio/Installer/vswhere.exe'
if (-not (Test-Path -LiteralPath $vswhere -PathType Leaf)) {
  throw 'Visual Studio 2022 vswhere.exe is missing; install VS2022 C++/MSBuild.'
}
$installation = (& $vswhere -latest -products '*' -version '[17.0,18.0)' -requires Microsoft.Component.MSBuild -property installationPath | Select-Object -First 1)
if ($LASTEXITCODE -ne 0 -or -not $installation) {
  throw 'No Visual Studio 2022 installation with MSBuild was found.'
}
$installationRoot = ([string]$installation).Trim()
$msbuild = Join-Path $installationRoot 'MSBuild/Current/Bin/MSBuild.exe'
if (-not (Test-Path -LiteralPath $msbuild -PathType Leaf)) {
  throw 'The selected VS2022 installation does not contain MSBuild.exe.'
}
$msbuildFile = Get-Item -LiteralPath $msbuild
$msbuildDigest = (Get-FileHash -LiteralPath $msbuild -Algorithm SHA256).Hash.ToLowerInvariant()
$branch = (& $git -C $repo branch --show-current | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $branch -cne 'Local') { throw 'Build requires branch Local.' }
$dirty = (& $git -C $repo status --porcelain=v1 --untracked-files=all | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $dirty) { throw 'Working tree must be clean; refuse mixed-source build.' }
# Git status excludes ignored native compiler intermediates (.obj/.lib/.pdb).
# Refuse a reused checkout instead of attributing stale files to this build.
$ignoredNative = (& $git -C $repo ls-files --others --ignored --exclude-standard -- engine/isolation-owned | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot establish absence of ignored native build files.' }
if ($ignoredNative) { throw 'Ignored native build outputs exist; use a fresh clean source checkout.' }
$head = (& $git -C $repo rev-parse HEAD | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $head -notmatch '^[a-f0-9]{40}$') {
  throw 'Cannot establish exact Git HEAD.'
}
$spec = Get-Content -LiteralPath $profile -Encoding UTF8 -Raw | ConvertFrom-Json
if ($spec.sourceVersion -cne 'v1.18.6' -or $spec.privateDriverIdentity -cne '5.73.6-MIVU' -or
    $spec.driverAbi -cne '0x57230' -or
    $spec.pristineSourceTree -cne 'f690477c07a40810f479f53973334ceae7e0ab13' -or
    $spec.canonicalEditableSource -cne 'engine/isolation-owned' -or
    $spec.status -cne 'SOURCE_PATCHED_NOT_BUILT') {
  throw 'Incorrect or unreviewed v1.18.6 source build profile.'
}
$rawProof = (& $node $verifier | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Exact modified-source proof failed; refusing MSBuild.' }
$proof = $rawProof | ConvertFrom-Json -ErrorAction Stop
if ($proof.head -cne $head -or $proof.nativeModifiedFiles -ne 11 -or
    $proof.sourceFiles -ne 1627 -or
    $proof.state -cne 'MIVUBI_V1186_NATIVE_SOURCE_PATCHED_NOT_BUILT' -or
    $proof.installationPermitted -ne $false) {
  throw 'Unexpected source verifier result.'
}
# One native build profile is shared with the v1.18.6 packaging owner.
# Do not keep a second hard-coded list of outputs in this builder.
$stages = @($spec.buildStages)
$required = @($spec.requiredArtifacts)
if ($stages.Count -ne 3 -or $required.Count -ne 16 -or
    $spec.sourceResources.Count -ne 5 -or $spec.enginePayloadState -cne 'MIVUBI_V1186_CORE_STAGED_NOT_INSTALLABLE') {
  throw 'Incomplete owned v1.18.6 build/payload profile.'
}
$expectedStages = @('win32-support|Sandboxie/SandboxDll.sln|Win32',
                    'x64-user-core|Sandboxie/Sandbox.sln|x64',
                    'x64-wdk-kernel|Sandboxie/SandboxDrv.sln|x64')
for ($i = 0; $i -lt $expectedStages.Count; $i++) {
  $actual = "$($stages[$i].id)|$($stages[$i].sln)|$($stages[$i].platform)"
  if ($actual -cne $expectedStages[$i]) { throw 'Unexpected native solution order.' }
}
if (@($required | Select-Object -Unique).Count -ne 16 -or
    @($required | Where-Object { $_ -cnotmatch '^Sandboxie/Bin/(Win32|x64)/SbieRelease/[A-Za-z0-9._-]+$' }).Count -ne 0) {
  throw 'Unexpected or duplicate native build artifact paths.'
}
foreach ($rel in $required) {
  $path = Join-Path $source ($rel -replace '/', '\')
  if (Test-Path -LiteralPath $path) {
    throw "Preexisting native binary would contaminate build evidence: $rel"
  }
}
New-Item -ItemType Directory -Path $reportFolder -ErrorAction Stop | Out-Null
$results = @()
$report = [ordered]@{
  schema = 1
  state = 'BUILD_FAILED_OR_INCOMPLETE'
  sourceVersion = 'v1.18.6'
  repoHead = $head
  compiler = [ordered]@{
    path = $msbuild
    fileVersion = [string]$msbuildFile.VersionInfo.FileVersion
    sha256 = $msbuildDigest
  }
  upstreamTree = [string]$proof.upstreamTree
  ownedTree = [string]$proof.ownedTree
  nativeModifiedFiles = 11
  buildStages = @()
  artifacts = @()
  driverBuilt = $false
  driverSigned = $false
  driverLoaded = $false
  installPermitted = $false
  activeProviderChanged = $false
  minecraftGameplayVerified = $false
}
try {
  foreach ($stage in $stages) {
    $solution = Join-Path $source ($stage.sln -replace '/', '\')
    if (-not (Test-Path -LiteralPath $solution -PathType Leaf)) {
      throw "Missing source solution: $($stage.sln)"
    }
    # PowerShell 5.1 may elevate an MSBuild stderr line into a terminating
    # ErrorRecord when ErrorActionPreference=Stop. Run the compiler as a child
    # process instead: always capture its REAL exit code and both streams.
    $stdoutName = $stage.id + '.stdout.log'
    $stderrName = $stage.id + '.stderr.log'
    $stdout = Join-Path $reportFolder $stdoutName
    $stderr = Join-Path $reportFolder $stderrName
    $arguments = @(
      ('"' + $solution + '"'),
      '/t:Build',
      '/p:Configuration=SbieRelease',
      ("/p:Platform=" + $stage.platform),
      '/maxcpucount:8',
      '/nodeReuse:false',
      '/nologo'
    )
    $stageResult = [ordered]@{
      stage=$stage.id; platform=$stage.platform; exitCode=$null
      stdoutLog=$stdoutName; stderrLog=$stderrName
    }
    $results += $stageResult
    try {
      $process = Start-Process -FilePath $msbuild -WorkingDirectory $source -ArgumentList $arguments `
        -NoNewWindow -PassThru -Wait -RedirectStandardOutput $stdout `
        -RedirectStandardError $stderr -ErrorAction Stop
      $stageResult.exitCode = [int]$process.ExitCode
    }
    catch {
      $stageResult.launchFailure = $_.Exception.Message
      throw
    }
    if ($stageResult.exitCode -ne 0) {
      throw "MSBuild failed: $($stage.id) (exit $($stageResult.exitCode)); see $stdout and $stderr"
    }
    # Every build stage must produce its own complete output set before the
    # next expensive MSBuild invocation. Derive names from the SINGLE pinned
    # profile; Sandbox.sln does not schedule SboxDrv in SbieRelease|x64.
    $stageRequired = @($required | Where-Object {
      if ($stage.id -ceq 'win32-support') {
        $_.StartsWith('Sandboxie/Bin/Win32/SbieRelease/', [StringComparison]::Ordinal)
      } elseif ($stage.id -ceq 'x64-user-core') {
        $_.StartsWith('Sandboxie/Bin/x64/SbieRelease/', [StringComparison]::Ordinal) -and
          -not $_.EndsWith('/SbieDrv.sys', [StringComparison]::Ordinal)
      } else {
        $_.EndsWith('/SbieDrv.sys', [StringComparison]::Ordinal)
      }
    })
    $expectedStageCount = switch ($stage.id) {
      'win32-support' { 2 }
      'x64-user-core' { 13 }
      'x64-wdk-kernel' { 1 }
      default { throw "Unknown native build stage: $($stage.id)" }
    }
    if ($stageRequired.Count -ne $expectedStageCount) {
      throw "Unexpected native build-stage inventory: $($stage.id)"
    }
    foreach ($rel in $stageRequired) {
      $built = Join-Path $source ($rel -replace '/', '\')
      if (-not (Test-Path -LiteralPath $built -PathType Leaf)) {
        throw "Native stage $($stage.id) succeeded but required output is missing: $rel"
      }
      if ((Get-Item -LiteralPath $built).Length -le 0) {
        throw "Native stage $($stage.id) produced an empty required output: $rel"
      }
    }
  }
  $artifacts = @()
  foreach ($rel in $required) {
    $path = Join-Path $source ($rel -replace '/', '\')
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
      throw "Required newly built native artifact missing: $rel"
    }
    $f = Get-Item -LiteralPath $path
    $digest = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    $artifacts += [ordered]@{ path=$rel; bytes=$f.Length; sha256=$digest }
  }
  $report.artifacts = $artifacts
  $report.driverBuilt = $true
  $report.state = 'NATIVE_BUILD_ARTIFACTS_CAPTURED_NOT_INSTALLABLE'
}
catch {
  $report.failureReason = $_.Exception.Message
  throw
}
finally {
  $report.buildStages = $results
  $output = Join-Path $reportFolder 'build-result.json'
  $report | ConvertTo-Json -Depth 8 | Out-File -LiteralPath $output -Encoding UTF8 -NoClobber
}
Write-Output "Build-only result written to $reportFolder; no driver or service was installed."
if ($PackageDirectory) {
  # Explicit opt-in: package the already-hashed native outputs, NEVER install them.
  # Source tree and build report are reverified by the single v1.18.6 assembler.
  $assembler = Join-Path $repo 'tooling/isolation-source/assemble-owned-v1186.mjs'
  $packageResult = (& $node $assembler --build-report $output --output $PackageDirectory | Out-String).Trim()
  if ($LASTEXITCODE -ne 0) {
    throw 'Owned v1.18.6 bundle assembly failed; native build artifacts remain NOT INSTALLABLE.'
  }
  Write-Output $packageResult
}
