[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateRange(1, 2147483647)]
  [int]$NativePid,
  [Parameter(Mandatory = $true)]
  [ValidateRange(1, 2147483647)]
  [int]$IsolatedPid,
  [ValidateRange(30, 7200)]
  [int]$DurationSeconds = 3600,
  [ValidateRange(1, 60)]
  [int]$SampleIntervalSeconds = 5,
  [string]$OutputDirectory = ''
)

$ErrorActionPreference = 'Stop'
# Diagnostic-only sampler. It never starts/stops Minecraft, changes Sandboxie,
# reads sign-in/profile/world content or infers gameplay from PID existence.
if ($NativePid -eq $IsolatedPid) {
  throw 'Native and isolated process IDs must be distinct.'
}
if ($SampleIntervalSeconds -gt $DurationSeconds) {
  throw 'The sample interval cannot exceed the duration.'
}

function Read-Target {
  param([int]$ProcessId, [long]$ExpectedStartTicks = 0)
  try {
    $process = Get-Process -Id $ProcessId -ErrorAction Stop
    $started = [long]$process.StartTime.ToUniversalTime().Ticks
    if ($started -le 0 -or ($ExpectedStartTicks -ne 0 -and $started -ne $ExpectedStartTicks)) {
      return $null
    }
    $cpu = [double]$process.TotalProcessorTime.TotalSeconds
    $workingSet = [double]$process.WorkingSet64 / 1MB
    if ([double]::IsNaN($cpu) -or [double]::IsInfinity($cpu) -or
        [double]::IsNaN($workingSet) -or [double]::IsInfinity($workingSet)) {
      return $null
    }
    return [pscustomobject]@{
      startTicks = $started
      cpuSeconds = $cpu
      workingSetMb = $workingSet
    }
  } catch {
    # Missing/inaccessible/restarted process is UNKNOWN, not zero CPU/RAM.
    return $null
  }
}

function Process-Sample {
  param($Previous, $Current, [double]$ElapsedSeconds, [int]$LogicalCpus)
  if ($null -eq $Current -or $null -eq $Previous -or $ElapsedSeconds -le 0) {
    return [ordered]@{ status = 'UNKNOWN'; cpuPercentOfHost = $null; workingSetMb = $null }
  }
  $cpuDelta = $Current.cpuSeconds - $Previous.cpuSeconds
  if ($cpuDelta -lt 0) {
    return [ordered]@{ status = 'UNKNOWN'; cpuPercentOfHost = $null; workingSetMb = $null }
  }
  # Normalize process CPU time over all host logical processors. This is not FPS.
  $cpuPercent = [math]::Round(100.0 * $cpuDelta / ($ElapsedSeconds * $LogicalCpus), 2)
  return [ordered]@{
    status = 'OBSERVED'
    cpuPercentOfHost = $cpuPercent
    workingSetMb = [math]::Round($Current.workingSetMb, 2)
  }
}

$baselineNative = Read-Target -ProcessId $NativePid
$baselineIsolated = Read-Target -ProcessId $IsolatedPid
if ($null -eq $baselineNative -or $null -eq $baselineIsolated) {
  throw 'Both manually selected processes must be accessible before measurement. No report produced.'
}
$logicalCpus = [Environment]::ProcessorCount
if ($logicalCpus -lt 1) { throw 'Host logical CPU count is invalid.' }
if (-not $OutputDirectory) {
  $OutputDirectory = Join-Path $env:TEMP 'MinecraftInstanceManager\Performance'
}
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$beginUtc = [DateTime]::UtcNow
$timer = [System.Diagnostics.Stopwatch]::StartNew()
$previousSecond = 0.0
$previousNative = $baselineNative
$previousIsolated = $baselineIsolated
$nativeLost = $false
$isolatedLost = $false
$samples = [System.Collections.Generic.List[object]]::new()

while ($timer.Elapsed.TotalSeconds -lt $DurationSeconds) {
  $remainingMs = [math]::Max(1, [math]::Ceiling(1000 * ($DurationSeconds - $timer.Elapsed.TotalSeconds)))
  $pauseMs = [int][math]::Min(1000 * $SampleIntervalSeconds, $remainingMs)
  Start-Sleep -Milliseconds $pauseMs
  $elapsed = [double]$timer.Elapsed.TotalSeconds
  $delta = $elapsed - $previousSecond

  $nativeCurrent = if ($nativeLost) { $null } else {
    Read-Target -ProcessId $NativePid -ExpectedStartTicks $baselineNative.startTicks
  }
  $isolatedCurrent = if ($isolatedLost) { $null } else {
    Read-Target -ProcessId $IsolatedPid -ExpectedStartTicks $baselineIsolated.startTicks
  }
  # Once a candidate disappears or becomes inaccessible, do not silently
  # follow a new process with the same PID. A new capture must be deliberate.
  if ($null -eq $nativeCurrent) { $nativeLost = $true }
  if ($null -eq $isolatedCurrent) { $isolatedLost = $true }

  $samples.Add([ordered]@{
    elapsedSeconds = [math]::Round($elapsed, 2)
    native = (Process-Sample -Previous $previousNative -Current $nativeCurrent -ElapsedSeconds $delta -LogicalCpus $logicalCpus)
    isolated = (Process-Sample -Previous $previousIsolated -Current $isolatedCurrent -ElapsedSeconds $delta -LogicalCpus $logicalCpus)
  })
  $previousNative = $nativeCurrent
  $previousIsolated = $isolatedCurrent
  $previousSecond = $elapsed
}

# This is process telemetry, not account, GPU, frame pacing or multiplayer proof.
$report = [ordered]@{
  schema = 1
  scope = 'NATIVE_SANDBOXIE_PROCESS_PERFORMANCE'
  evidenceOrigin = 'WINDOWS_HOST'
  attribution = 'OPERATOR_SELECTED_UNVERIFIED_PIDS'
  automaticVerdict = 'NOT_PROVIDED'
  capturedAtUtc = $beginUtc.ToString('o')
  durationRequestedSeconds = $DurationSeconds
  durationObservedSeconds = [math]::Round($timer.Elapsed.TotalSeconds, 2)
  sampleIntervalSeconds = $SampleIntervalSeconds
  hostLogicalCpus = $logicalCpus
  sampleCount = $samples.Count
  nativeProcessIdentityLost = $nativeLost
  isolatedProcessIdentityLost = $isolatedLost
  samples = @($samples.ToArray())
  missingEvidence = @('ACCOUNT_ISOLATION', 'GAMEPLAY_RENDERING', 'FRAME_TIMES', 'GPU_VRAM', 'MULTIPLAYER', 'INPUT_RESPONSIVENESS')
}
$stamp = $beginUtc.ToString('yyyyMMddTHHmmssfffffffZ')
$file = Join-Path $OutputDirectory ('native-process-performance-' + $stamp + '.json')
if (Test-Path -LiteralPath $file) {
  throw 'A report already exists at the generated destination; refusing overwrite.'
}
$report | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath $file -Encoding UTF8
[ordered]@{
  report = $file
  sampleCount = $samples.Count
  automaticVerdict = 'NOT_PROVIDED'
  interpretation = 'PROCESS_TELEMETRY_ONLY'
} | ConvertTo-Json -Depth 3
