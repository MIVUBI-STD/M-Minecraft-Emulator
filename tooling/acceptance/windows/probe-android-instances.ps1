[CmdletBinding()]
param(
  [string]$OutputDirectory = ''
)

$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') {
  throw 'Android instance observation is supported on Windows hosts only.'
}

# This is read-only host observation. Do not read BlueStacks configuration,
# Android instance disks, account state, log files, PIDs or Microsoft tokens.
# A running Android emulator is NOT proof Minecraft Education works.
$manager = $null
foreach ($variable in @('ProgramW6432', 'ProgramFiles', 'ProgramFiles(x86)')) {
  $root = [Environment]::GetEnvironmentVariable($variable)
  if (-not $root) { continue }
  $candidate = Join-Path (Join-Path $root 'BlueStacks_nxt') 'HD-MultiInstanceManager.exe'
  if (Test-Path -LiteralPath $candidate -PathType Leaf) {
    $manager = $candidate
    break
  }
}

$players = @(Get-Process -Name 'HD-Player' -ErrorAction SilentlyContinue)
$visible = @($players | Where-Object {
  $_.MainWindowHandle -ne 0 -and -not [string]::IsNullOrWhiteSpace($_.MainWindowTitle)
})
$managerRunning = @(Get-Process -Name 'HD-MultiInstanceManager' -ErrorAction SilentlyContinue).Count -gt 0

$memoryMb = $null
if ($players.Count -gt 0) {
  $sum = [long]0
  foreach ($process in $players) { $sum += [long]$process.WorkingSet64 }
  $memoryMb = [long][Math]::Ceiling($sum / 1MB)
}

if (-not $OutputDirectory) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $OutputDirectory = Join-Path $env:TEMP "M-Minecraft-Emulator-Android-$stamp"
}
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$report = [ordered]@{
  schema = 1
  scope = 'ANDROID_MULTI_INSTANCE_HOST'
  observedAtUtc = [DateTime]::UtcNow.ToString('o')
  provider = 'BLUESTACKS_5_CANDIDATE'
  standardInstallationDetected = ($null -ne $manager)
  multiInstanceManagerRunning = [bool]$managerRunning
  androidPlayerProcessCandidates = [int]$players.Count
  visiblePlayerWindowCandidates = [int]$visible.Count
  observedPlayerWorkingSetMb = $memoryMb
  minecraftEducationInstalled = 'UNKNOWN'
  minecraftEducationRunning = 'UNKNOWN'
  windowsArePlayable = 'UNKNOWN'
  distinctEducationAccountsVerified = 'NOT_VERIFIED'
  officialAndroidEmulatorSupport = 'NOT_SUPPORTED'
  verdict = 'INCONCLUSIVE'
  next = 'VERIFY_ANDROID_GAME_INSTALL_LOGIN_RENDER_AND_INPUT_IN_ONE_INSTANCE_FIRST'
}
$file = Join-Path $OutputDirectory ("android-instance-observation-" + [guid]::NewGuid().ToString('N') + ".json")
[System.IO.File]::WriteAllText(
  $file,
  ($report | ConvertTo-Json -Depth 4),
  [System.Text.UTF8Encoding]::new($false)
)
[ordered]@{
  report = $file
  visibleWindowCandidates = $report.visiblePlayerWindowCandidates
  verdict = $report.verdict
  next = $report.next
} | ConvertTo-Json -Depth 3
