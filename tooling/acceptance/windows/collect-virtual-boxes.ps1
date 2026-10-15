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
# Verified upstream query.c: "query /boxes *" silently skips disabled
# boxes via SbieApi_IsBoxEnabled. An occupied but disabled name must remain
# visible; "query *" enumerates the sections and prints GlobalSettings first.
# This is a read-only official-pilot inventory, never owned-engine authority.
$sections = @(& $ini query '*' 2>$null)
if ($LASTEXITCODE -ne 0 -or $sections.Count -lt 1 -or
    $sections.Count -gt 129 -or
    ([string]$sections[0]).Trim() -cne 'GlobalSettings') {
  throw 'Cannot reliably enumerate existing Sandboxie boxes.'
}
$seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$boxes = @()
foreach ($item in @($sections | Select-Object -Skip 1)) {
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
