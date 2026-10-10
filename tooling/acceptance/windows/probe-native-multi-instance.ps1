[CmdletBinding()]
param(
  [ValidateSet('OBSERVE', 'TRY_SECOND')]
  [string]$Mode = 'OBSERVE',
  [string]$OutputDirectory = ''
)

$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') {
  throw 'This non-destructive native-client probe only supports Windows.'
}

# Use a conservative title/process heuristic adapted from the desktop
# window-arrangement code. It is a window CANDIDATE, not a login/graphics proof.
function Get-NativeEducationWindows {
  $windows = @(Get-Process -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowHandle -ne 0 -and
    ($_.MainWindowTitle -like '*Minecraft Education*' -or $_.MainWindowTitle -like '*Minecraft: Education Edition*') -and
    ($_.ProcessName -like '*Minecraft*' -or $_.ProcessName -like '*Education*')
  })
  return [ordered]@{
    candidateWindows = @($windows).Count
    candidateProcesses = @($windows | Select-Object -ExpandProperty Id -Unique).Count
  }
}

function Try-LaunchNativeAgain {
  # A second Start-menu activation may foreground the existing singleton.
  # Neither the explorer.exe PID nor a successful shell call proves a new
  # Minecraft process or an independent signed-in account.
  $entries = @(Get-StartApps -ErrorAction Stop | Where-Object {
    $_.Name -match '^Minecraft:? Education(?: Edition)?$'
  })
  if ($entries.Count -eq 0) { return 'NO_UNAMBIGUOUS_START_ENTRY' }
  if ($entries.Count -ne 1) { return 'MULTIPLE_START_ENTRIES' }

  $appId = [string]$entries[0].AppID
  if (-not $appId -or $appId.Length -gt 256 -or $appId -notmatch '^[A-Za-z0-9_.!+{}-]+$') {
    return 'START_ENTRY_REQUIRES_MANUAL_LAUNCH'
  }
  Start-Process -FilePath 'explorer.exe' -ArgumentList @("shell:AppsFolder\$appId") -ErrorAction Stop | Out-Null
  return 'ACTIVATION_REQUESTED_NOT_VERIFIED'
}

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path $env:TEMP 'M-Minecraft-Emulator-Native-Feasibility'
}
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$before = Get-NativeEducationWindows
$launch = 'NOT_REQUESTED'
if ($Mode -eq 'TRY_SECOND') {
  if ($before.candidateWindows -lt 1) {
    $launch = 'OPEN_FIRST_NATIVE_CLIENT_BEFORE_RETRY'
  } else {
    try {
      $launch = Try-LaunchNativeAgain
    } catch {
      $launch = 'SECOND_ACTIVATION_FAILED'
    }
    if ($launch -eq 'ACTIVATION_REQUESTED_NOT_VERIFIED') {
      Start-Sleep -Seconds 6
    }
  }
}
$after = Get-NativeEducationWindows

if ($Mode -eq 'OBSERVE') {
  $observation = 'OBSERVATION_ONLY'
} elseif ($before.candidateWindows -lt 1) {
  $observation = 'BASELINE_MISSING'
} elseif ($after.candidateWindows -gt $before.candidateWindows) {
  $observation = 'ADDITIONAL_WINDOW_CANDIDATE'
} else {
  $observation = 'NO_ADDITIONAL_WINDOW_OBSERVED'
}

$report = [ordered]@{
  schema = 1
  scope = 'DIRECT_NATIVE_MULTI_INSTANCE'
  observedAtUtc = [DateTime]::UtcNow.ToString('o')
  mode = $Mode
  baseline = $before
  after = $after
  launchAttempt = $launch
  observation = $observation
  observationClass = 'WINDOW_CANDIDATES_ONLY'
  simultaneousDistinctAccounts = 'NOT_VERIFIED'
  minecraftGameplay = 'NOT_VERIFIED'
  verdict = 'INCONCLUSIVE'
  next = 'MANUALLY_CONFIRM_DISTINCT_GAME_WINDOWS_AND_LICENSED_SIGNED_IN_ACCOUNTS'
}
$path = Join-Path $OutputDirectory ("native-multi-" + [guid]::NewGuid().ToString('N') + '.json')
[System.IO.File]::WriteAllText(
  $path,
  ($report | ConvertTo-Json -Depth 5),
  [System.Text.UTF8Encoding]::new($false)
)
[ordered]@{
  report = $path
  launchAttempt = $launch
  observation = $observation
  distinctAccountsVerified = $false
} | ConvertTo-Json -Depth 3
