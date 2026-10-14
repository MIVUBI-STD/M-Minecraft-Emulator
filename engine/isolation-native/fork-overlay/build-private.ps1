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
# Do not independently reimplement source identity with marker-only checks.
# The staged overlay must first be reviewed and committed as one direct child
# of the pinned release; the canonical Node verifier checks exact Git blobs.
$node = (Get-Command node.exe -ErrorAction Stop).Source
$sourceVerifier = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'apply-private-source.mjs'))
$verifiedJson = & $node $sourceVerifier --verify-committed --fork-root $root
if ($LASTEXITCODE -ne 0) { throw 'Private source commit verification failed.' }
$sourceProof = $verifiedJson | ConvertFrom-Json -ErrorAction Stop
$msbuild = (Get-Command msbuild.exe -ErrorAction Stop).Source
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
# Reject changes to the source revision while compilation was running.
$afterJson = & $node $sourceVerifier --verify-committed --fork-root $root
if ($LASTEXITCODE -ne 0) { throw 'Private source changed during compilation.' }
$afterProof = $afterJson | ConvertFrom-Json -ErrorAction Stop
if ($sourceProof.privateForkHead -cne $afterProof.privateForkHead -or
    $sourceProof.privateForkTree -cne $afterProof.privateForkTree -or
    $sourceProof.privatePatchSha256 -cne $afterProof.privatePatchSha256) {
  throw 'Private source identity changed during compilation.'
}
$proof = [pscustomobject]@{
  schema = 1
  state = 'PRIVATE_CORE_BINARIES_BUILT_NOT_SIGNED_OR_RUN'
  upstreamCommit = $pin
  privateForkHead = [string]$sourceProof.privateForkHead
  privateForkTree = [string]$sourceProof.privateForkTree
  privatePatchSha256 = [string]$sourceProof.privatePatchSha256
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
