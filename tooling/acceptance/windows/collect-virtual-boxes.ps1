# Read-only on-demand discovery of boxes in the EXISTING official Sandboxie pilot.
# Does not create, configure, launch, stop or delete any virtual or access accounts.
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($env:OS -cne 'Windows_NT') { throw 'Windows required.' }
$roots = @(
  [Environment]::GetEnvironmentVariable('ProgramW6432'),
  [Environment]::GetEnvironmentVariable('ProgramFiles'),
  [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
) | Where-Object { $_ } | Select-Object -Unique
$install = @($roots | ForEach-Object { Join-Path $_ 'Sandboxie-Plus' } |
  Where-Object { Test-Path -LiteralPath (Join-Path $_ 'SbieIni.exe') -PathType Leaf })
if ($install.Count -ne 1) { throw 'Official Sandboxie installation unavailable or ambiguous.' }
$ini = Join-Path $install[0] 'SbieIni.exe'
$signature = Get-AuthenticodeSignature -LiteralPath $ini -ErrorAction Stop
if ($signature.Status -ne 'Valid') { throw 'Installed Sandboxie query tool has untrusted signature.' }
# Upstream SbieIni accepts query /boxes *; this lists box names available for
# the current user. It is NOT proof that a process is running or signed in.
$names = @(& $ini query /boxes '*' 2>$null)
if ($LASTEXITCODE -ne 0 -or $names.Count -gt 128) {
  throw 'Cannot reliably enumerate existing Sandboxie boxes.'
}
$seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$boxes = @()
foreach ($item in $names) {
  $name = ([string]$item).Trim()
  if ($name -cnotmatch '^[a-zA-Z0-9_]{1,32}$' -or -not $seen.Add($name)) {
    throw 'Unexpected or duplicate Sandboxie box name.'
  }
  $boxes += $name
}
[ordered]@{
  schema = 1
  source = 'EXISTING_OFFICIAL_SANDBOXIE_PILOT'
  evidence = 'BOX_NAMES_ONLY'
  boxes = @($boxes | Sort-Object -CaseSensitive)
  ownedProviderSelected = $false
  gameplayVerified = $false
} | ConvertTo-Json -Depth 3 -Compress
