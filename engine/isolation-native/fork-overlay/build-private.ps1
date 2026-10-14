# Build ONLY from a separate MIVUBI private-fork checkout.
# No driver/service install, signing bypass, login or box migration.
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$ForkRoot,
  [Parameter(Mandatory=$true)][string]$ReportPath,
  [string]$StageOutput
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'Windows private source build required.' }
$root = (Resolve-Path -LiteralPath $ForkRoot -ErrorAction Stop).ProviderPath.TrimEnd('\')
$report = [IO.Path]::GetFullPath($ReportPath)
if ($report.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) {
  throw 'Report must be outside private checkout.'
}
$manifestPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../../tooling/isolation-source/upstream-baseline.json'))
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$pin = 'abd4c240031cfb46666daa74ca47ed4e48b561e4'
if ([string]$manifest.upstream.commit -cne $pin) { throw 'Upstream pin changed.' }
$git = (Get-Command git.exe -ErrorAction Stop).Source
$msbuild = (Get-Command msbuild.exe -ErrorAction Stop).Source
$remote = (& $git -C $root remote get-url upstream | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $remote -cne 'https://github.com/sandboxie-plus/Sandboxie.git') {
  throw 'Unexpected fork upstream remote.'
}
& $git -C $root merge-base --is-ancestor $pin HEAD
if ($LASTEXITCODE -ne 0) { throw 'Fork does not descend from pinned source.' }
$branch = (& $git -C $root branch --show-current | Out-String).Trim()
if ($branch -cne 'isolation/baseline-v1.18.5') { throw 'Unexpected source branch.' }
$expected = @(
  'Sandboxie/common/my_version.h',
  'Sandboxie/core/drv/api.c',
  'Sandboxie/core/dll/sbieapi.c',
  'Sandboxie/core/svc/DriverAssist.cpp',
  'Sandboxie/apps/start/start.cpp',
  'Sandboxie/apps/ini/main.c',
  'Sandboxie/install/kmdutil/kmdutil.c'
)
$changed = @(
  & $git -C $root diff --name-only $pin HEAD
  & $git -C $root diff --cached --name-only
) | Where-Object { $_ } | Sort-Object -Unique
if ($changed.Count -ne $expected.Count) { throw 'Unexpected modified source count.' }
foreach ($sourceFile in $expected) {
  if ($changed -cnotcontains $sourceFile) { throw "Missing fork modification $sourceFile" }
}
$dirty = @(& $git -C $root status --porcelain=v1 --untracked-files=all)
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect checkout status.' }
foreach ($entry in $dirty) {
  if ($entry -notmatch '^M  (.+)$' -or $expected -cnotcontains $Matches[1]) {
    throw 'Unstaged, untracked or unauthorized source files present.'
  }
}
$header = Get-Content -LiteralPath (Join-Path $root 'Sandboxie/common/my_version.h') -Raw -Encoding UTF8
if ($header -notmatch '(?m)^#define MIVUBI_PRIVATE_ISOLATION_BUILD 0x4D495655\r?$' -or
    $header -notmatch '(?m)^#define MIVUBI_PRIVATE_ISOLATION_ABI   0x57230\r?$') {
  throw 'Private fork header marker or ABI missing.'
}
foreach ($path in ($expected | Where-Object { $_ -ne 'Sandboxie/common/my_version.h' })) {
  $body = Get-Content -LiteralPath (Join-Path $root ($path -replace '/','\')) -Raw -Encoding UTF8
  if ($body -notmatch '#error MIVUBI_isolation_build_requires_matching_pinned_core') {
    throw "Missing private source compiler guard: $path"
  }
}
foreach ($rel in @($manifest.requiredArtifacts)) {
  $binary = Join-Path $root ([string]$rel -replace '/','\')
  if (Test-Path -LiteralPath $binary -PathType Leaf) {
    throw 'Stale artifact detected; use a clean private checkout.'
  }
}
$parent = Split-Path -Parent $report
[IO.Directory]::CreateDirectory($parent) | Out-Null
$stages = @()
foreach ($stage in @($manifest.buildStages)) {
  $solution = Join-Path $root ([string]$stage.solution -replace '/','\')
  if (-not (Test-Path -LiteralPath $solution -PathType Leaf)) {
    throw "Missing solution $($stage.solution)"
  }
  $log = Join-Path $parent ("private-" + [string]$stage.id + ".log")
  Push-Location -LiteralPath $root
  try {
    & $msbuild /t:build $solution /p:Configuration=SbieRelease ("/p:Platform=" + [string]$stage.platform) /maxcpucount:8 2>&1 | Out-File -FilePath $log -Encoding UTF8
    $code = $LASTEXITCODE
  } finally { Pop-Location }
  $stages += [pscustomobject]@{
    id = [string]$stage.id
    platform = [string]$stage.platform
    exitCode = [int]$code
  }
  if ($code -ne 0) { throw "Private build stage failed: $($stage.id)" }
}
$artifacts = @()
foreach ($rel in @($manifest.requiredArtifacts)) {
  $file = Join-Path $root ([string]$rel -replace '/','\')
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Private binary not generated: $rel"
  }
  $artifacts += [pscustomobject]@{
    path = [string]$rel
    sizeBytes = (Get-Item -LiteralPath $file).Length
    sha256 = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
    authenticode = [string](Get-AuthenticodeSignature -LiteralPath $file).Status
  }
}
$commit = (& $git -C $root rev-parse HEAD | Out-String).Trim()
$proof = [pscustomobject]@{
  schema = 1
  state = 'PRIVATE_CORE_BINARIES_BUILT_NOT_SIGNED_OR_RUN'
  upstreamCommit = $pin
  privateForkHead = $commit
  sourceFilesModified = $expected
  sourceBuildMarker = 'MIVUBI_PRIVATE_ISOLATION_BUILD'
  buildStages = $stages
  artifacts = $artifacts
  driverSigningPolicyAccepted = $false
  driverLoadVerified = $false
  installerReady = $false
  canCoexistWithOfficialSandboxie = $false
  microsoftSignInVerified = $false
  minecraftGameplayVerified = $false
  distributionApproved = $false
}
$proof | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $report -Encoding UTF8
Write-Output "Private core build report: $report"

if ($StageOutput) {
  # Optional source-first staging. Does not sign/install/load SbieDrv or touch
  # the installed Client 02. Private source identity is revalidated in Node.
  $node = (Get-Command node.exe -ErrorAction Stop).Source
  $assemble = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../../tooling/isolation-source/assemble-private-engine.mjs'))
  & $node $assemble --fork-root $root --manifest $manifestPath --private-report $report --output $StageOutput
  if ($LASTEXITCODE -ne 0) {
    throw 'Private payload assembly failed; no driver was installed.'
  }
}
