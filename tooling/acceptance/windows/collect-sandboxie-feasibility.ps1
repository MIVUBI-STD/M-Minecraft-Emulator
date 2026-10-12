[CmdletBinding()]
param(
  [ValidateSet('INSPECT', 'TWO_CLIENT')]
  [string]$Stage = 'INSPECT',
  [ValidatePattern('^[A-Za-z][A-Za-z0-9]{0,31}$')]
  [string]$BoxName = 'Mivubi2',
  [string]$InstallDirectory = '',
  [ValidateSet('YES', 'NO', 'UNKNOWN')]
  [string]$LicensedForUse = 'UNKNOWN',
  [ValidateSet('YES', 'NO', 'UNKNOWN')]
  [string]$NativeWorldPlayable = 'UNKNOWN',
  [ValidateSet('YES', 'NO', 'UNKNOWN')]
  [string]$SandboxWorldPlayable = 'UNKNOWN',
  [ValidateSet('YES', 'NO', 'UNKNOWN')]
  [string]$DistinctAccounts = 'UNKNOWN',
  [ValidateSet('YES', 'NO', 'UNKNOWN')]
  [string]$IndependentInput = 'UNKNOWN',
  [ValidateSet('YES', 'NO', 'UNKNOWN')]
  [string]$AccountCrossingObserved = 'UNKNOWN',
  [ValidateSet('YES', 'NO', 'UNKNOWN')]
  [string]$ReopenAndRebootPersistent = 'UNKNOWN',
  [ValidateSet('YES', 'NO', 'UNKNOWN')]
  [string]$MultiplayerJoined = 'UNKNOWN',
  [ValidateRange(0, 1440)]
  [int]$ObservedMinutes = 0,
  [ValidatePattern('^(?:$|[A-Za-z0-9_.-]{1,80})$')]
  [string]$EvidenceReference = '',
  [string]$OutputDirectory = ''
)

$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') {
  throw 'Sandboxie feasibility requires a Windows host.'
}
$observations = @($LicensedForUse, $NativeWorldPlayable, $SandboxWorldPlayable,
  $DistinctAccounts, $IndependentInput, $AccountCrossingObserved,
  $ReopenAndRebootPersistent, $MultiplayerJoined)
if ($Stage -eq 'INSPECT' -and (
  @($observations | Where-Object { $_ -ne 'UNKNOWN' }).Count -gt 0 -or
  $ObservedMinutes -ne 0 -or $EvidenceReference
)) {
  throw 'Account, license and game claims belong only to TWO_CLIENT.'
}

# The only commands ever invoked are exact read-only SbieIni query and
# Start.exe /listpids, never install, launch, terminate, delete or config write.
function Invoke-BoundedReadOnlyTool {
  param([string]$Exe, [string]$Arguments)
  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $Exe
  $psi.Arguments = $Arguments
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.CreateNoWindow = $true
  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $psi
  try {
    if (-not $process.Start()) { return $null }
    $reading = $process.StandardOutput.ReadToEndAsync()
    if (-not $process.WaitForExit(5000)) {
      try { $process.Kill() } catch { }
      return $null
    }
    $result = $reading.GetAwaiter().GetResult()
    if ($process.ExitCode -ne 0 -or $result.Length -gt 4096) { return $null }
    return $result.Trim()
  }
  catch { return $null }
  finally { $process.Dispose() }
}

$dirs = @()
if ($InstallDirectory) {
  $dirs = @($InstallDirectory)
} else {
  foreach ($root in @(
    [Environment]::GetEnvironmentVariable('ProgramW6432'),
    [Environment]::GetEnvironmentVariable('ProgramFiles'),
    [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
  )) {
    if ($root) { $dirs += (Join-Path $root 'Sandboxie-Plus') }
  }
}
$dir = $null
foreach ($candidate in @($dirs | Select-Object -Unique)) {
  if ((Test-Path -LiteralPath (Join-Path $candidate 'Start.exe') -PathType Leaf) -and
      (Test-Path -LiteralPath (Join-Path $candidate 'SbieIni.exe') -PathType Leaf)) {
    $dir = $candidate
    break
  }
}
$installed = $null -ne $dir
$trustedTools = $false
$startExe = $null
$iniExe = $null
if ($installed) {
  $startExe = Join-Path $dir 'Start.exe'
  $iniExe = Join-Path $dir 'SbieIni.exe'
  $trustedTools = (
    (Get-AuthenticodeSignature -LiteralPath $startExe).Status -eq 'Valid' -and
    (Get-AuthenticodeSignature -LiteralPath $iniExe).Status -eq 'Valid'
  )
}
$service = Get-Service -Name 'SbieSvc' -ErrorAction SilentlyContinue
$serviceRunning = ($null -ne $service -and $service.Status -eq 'Running')

function Read-BoxSetting {
  param([string]$Section, [string]$Key)
  if (-not $trustedTools -or -not $serviceRunning) { return $null }
  $value = Invoke-BoundedReadOnlyTool $iniExe ('query ' + $Section + ' ' + $Key)
  if ($value -eq 'y' -or $value -eq 'n') { return $value }
  return $null
}
$enabled = Read-BoxSetting $BoxName 'Enabled'
$delete = Read-BoxSetting $BoxName 'AutoDelete'
$remove = Read-BoxSetting $BoxName 'AutoRemove'
if ($null -eq $delete) { $delete = Read-BoxSetting 'GlobalSettings' 'AutoDelete' }
if ($null -eq $remove) { $remove = Read-BoxSetting 'GlobalSettings' 'AutoRemove' }
$toFlag = { param($value) if ($value -eq 'y') { return 'ON' } if ($value -eq 'n') { return 'OFF' } return 'UNKNOWN' }
$boxConfigured = if ($enabled -eq 'y') { 'YES' } elseif ($enabled -eq 'n') { 'NO' } else { 'UNKNOWN' }

$membershipStatus = 'UNKNOWN'
$boxedPids = @()
if ($trustedTools -and $serviceRunning -and $boxConfigured -eq 'YES') {
  $raw = Invoke-BoundedReadOnlyTool $startExe ('/box:' + $BoxName + ' /listpids')
  if ($null -ne $raw -and $raw -match '^[0-9\s]+$') {
    $lines = @($raw -split '\r?\n' | Where-Object { $_ -match '^\d+$' })
    if ($lines.Count -ge 1) {
      $count = 0
      if ([int]::TryParse($lines[0], [ref]$count) -and
          $count -ge 0 -and $count -le 16 -and
          ($lines.Count - 1) -eq $count) {
        $parsed = @()
        foreach ($line in @($lines | Select-Object -Skip 1)) {
          $number = 0
          if (-not [int]::TryParse($line, [ref]$number) -or $number -le 0) {
            $parsed = @()
            break
          }
          $parsed += $number
        }
        if ($parsed.Count -eq $count -and
            @($parsed | Select-Object -Unique).Count -eq $count) {
          $boxedPids = @($parsed)
          $membershipStatus = 'OBSERVED'
        }
      }
    }
  }
}

$session = [System.Diagnostics.Process]::GetCurrentProcess().SessionId
$gameCandidates = @(
  Get-Process -ErrorAction SilentlyContinue |
  Where-Object {
    $_.SessionId -eq $session -and
    $_.ProcessName -match '(?i)(minecraft|education)'
  } |
  Sort-Object Id |
  ForEach-Object {
    $handle = if ($_.MainWindowHandle -ne [IntPtr]::Zero) {
      '0x' + $_.MainWindowHandle.ToInt64().ToString('x')
    } else { $null }
    [ordered]@{
      pid = [int]$_.Id
      windowHandle = $handle
      inSelectedBox = $(if ($membershipStatus -eq 'OBSERVED') {
        [bool]($boxedPids -contains [int]$_.Id)
      } else { $null })
    }
  }
)
if ($gameCandidates.Count -gt 16) {
  throw 'Too many name-matched process candidates; inspect directly.'
}

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path $env:TEMP 'MIVUBI-Sandboxie-Feasibility'
}
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$report = [ordered]@{
  schema = 1
  scope = 'SANDBOXIE_TWO_CLIENT_FEASIBILITY'
  stage = $Stage
  evidenceOrigin = 'WINDOWS_HOST'
  automaticVerdict = 'NOT_PROVIDED'
  capturedUtc = (Get-Date).ToUniversalTime().ToString('o')
  sandboxie = [ordered]@{
    toolsPresent = [bool]$installed
    toolSignaturesValid = [bool]$trustedTools
    serviceRunning = [bool]$serviceRunning
    boxConfigured = $boxConfigured
    autoDelete = (& $toFlag $delete)
    autoRemove = (& $toFlag $remove)
    membershipStatus = $membershipStatus
  }
  machine = [ordered]@{
    interactiveSession = ($session -ne 0)
    processEvidenceClass = 'NAME_MATCH_CANDIDATE_ONLY'
    candidateProcesses = @($gameCandidates)
  }
  operator = [ordered]@{
    attribution = 'OPERATOR_DECLARED_NOT_MACHINE_VERIFIED'
    licensedForUse = $LicensedForUse
    nativeWorldPlayable = $NativeWorldPlayable
    sandboxWorldPlayable = $SandboxWorldPlayable
    distinctAccounts = $DistinctAccounts
    independentInput = $IndependentInput
    accountCrossingObserved = $AccountCrossingObserved
    reopenAndRebootPersistent = $ReopenAndRebootPersistent
    multiplayerJoined = $MultiplayerJoined
    observedMinutes = $ObservedMinutes
    evidenceReference = $(if ($EvidenceReference) { $EvidenceReference } else { $null })
  }
}
$name = 'sandboxie-feasibility-' + (Get-Date -Format 'yyyyMMdd-HHmmss') +
  '-' + [guid]::NewGuid().ToString('N').Substring(0, 8) + '.json'
$path = Join-Path $OutputDirectory $name
[System.IO.File]::WriteAllText($path, (ConvertTo-Json -InputObject $report -Depth 8),
  [System.Text.UTF8Encoding]::new($false))
[pscustomobject]@{
  reportPath = $path
  boxName = $BoxName
  stage = $Stage
  candidateProcessCount = $gameCandidates.Count
  interpretation = 'CONFIG_AND_PROCESS_CANDIDATES_ONLY_NO_AUTHENTICATION_PROOF'
} | ConvertTo-Json -Compress
