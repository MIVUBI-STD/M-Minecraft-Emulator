[CmdletBinding()]
param(
  [ValidateSet('INSPECT', 'TWO_CLIENT')]
  [string]$Stage = 'INSPECT',
  [ValidatePattern('^[A-Za-z][A-Za-z0-9]{0,31}$')]
  [string]$BoxName = 'MinecraftClient02',
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
  [string]$OutputDirectory = '',
  [switch]$SummaryOnly,
  [switch]$ImageProof
)

$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') {
  throw 'Sandboxie feasibility requires a Windows host.'
}
if ($SummaryOnly -and $Stage -ne 'INSPECT') {
  throw 'SummaryOnly is available for read-only INSPECT observations only.'
}
if ($ImageProof -and (-not $SummaryOnly -or $Stage -ne 'INSPECT')) {
  throw 'ImageProof is supported only for explicit read-only SummaryOnly inspection.'
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

# Read-only SbieIni/Start.exe queries are preferred. When Start.exe stdout is
# unavailable, a bounded SbieApi_EnumProcessEx read can run in this short-lived
# collector after verifying the installed vendor DLL signature. Never mutate
# Sandboxie settings, terminate processes, read tokens or infer gameplay.
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
    # Start.exe and descendants may inherit the stdout pipe after the helper exits.
    # A successful WaitForExit alone does not imply the read reached EOF.
    if (-not $reading.Wait(1000)) { return $null }
    $result = $reading.GetAwaiter().GetResult()
    if ($process.ExitCode -ne 0 -or $result.Length -gt 4096) { return $null }
    return $result.Trim()
  }
  catch { return $null }
  finally {
    # Closing the reader also releases its pipe if an inherited writer
    # prevents EOF; never terminate a Minecraft game to finish inspection.
    try { $process.StandardOutput.Dispose() } catch { }
    $process.Dispose()
  }
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

# One trust boundary shared by both on-demand Sandboxie DLL probes. Never
# load an unsigned, mismatched or unexpected DLL into the persistent Tauri app.
function Get-TrustedSbieDll {
  if (-not $trustedTools -or -not $serviceRunning -or -not $dir) { return $null }
  $dll = Join-Path $dir 'SbieDll.dll'
  if (-not (Test-Path -LiteralPath $dll -PathType Leaf)) { return $null }
  try {
    $dllSig = Get-AuthenticodeSignature -LiteralPath $dll
    $toolSig = Get-AuthenticodeSignature -LiteralPath $startExe
    if ($dllSig.Status -eq 'Valid' -and $toolSig.Status -eq 'Valid' -and
        $null -ne $dllSig.SignerCertificate -and
        $null -ne $toolSig.SignerCertificate -and
        $dllSig.SignerCertificate.Thumbprint -eq
          $toolSig.SignerCertificate.Thumbprint) {
      return $dll
    }
  } catch { }
  return $null
}

function Read-BoxSetting {
  param([string]$Section, [string]$Key)
  if (-not $trustedTools -or -not $serviceRunning) { return $null }
  $value = Invoke-BoundedReadOnlyTool $iniExe ('query ' + $Section + ' ' + $Key)
  if ($value -eq 'y' -or $value -eq 'n') { return $value }
  return $null
}
# SandMan reads these two lifecycle controls from the box itself. Both
# default to "n" when absent from a successfully queried box section.
# Do not fall back to GlobalSettings; do not treat a failed query as absence.
# SbieIni query <BoxName> * lists explicit box-local setting NAMES.
$enabled = Read-BoxSetting $BoxName 'Enabled'
$boxSettingsSource = 'UNKNOWN'
$delete = $null
$remove = $null
if ($trustedTools -and $serviceRunning -and $enabled -eq 'y') {
  $rawNames = Invoke-BoundedReadOnlyTool $iniExe ('query ' + $BoxName + ' *')
  if ($null -ne $rawNames) {
    $names = @($rawNames -split '\r?\n' |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_ -ne '' })
    $allNamesValid = $names.Count -ge 1 -and $names.Count -le 128 -and
      @($names | Where-Object { $_ -cnotmatch '^[A-Za-z_][A-Za-z0-9_.:-]{0,79}$' }).Count -eq 0 -and
      @($names | Select-Object -Unique).Count -eq $names.Count -and
      ($names -contains 'Enabled')
    if ($allNamesValid) {
      $boxSettingsSource = 'BOX_SECTION_ENUMERATED'
      $delete = if ($names -contains 'AutoDelete') {
        Read-BoxSetting $BoxName 'AutoDelete'
      } else { 'n' }
      $remove = if ($names -contains 'AutoRemove') {
        Read-BoxSetting $BoxName 'AutoRemove'
      } else { 'n' }
    }
  }
}
# This is a bounded inspection of EXPLICIT Sandboxie settings, not a
# proof of effective WAM, WinCred read isolation or independent identities.
# Global templates must be checked even if OpenCredentials is set locally:
# a global OpenProtectedStorage template may bypass Sandboxie's WinCred hooks.
$credentialValue = $null
if ($boxSettingsSource -eq 'BOX_SECTION_ENUMERATED') {
  $rawGlobal = Invoke-BoundedReadOnlyTool $iniExe 'query GlobalSettings *'
  if ($null -ne $rawGlobal) {
    $globalNames = @($rawGlobal -split '\r?\n' |
      ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
    $validGlobal = $globalNames.Count -le 128 -and
      @($globalNames | Where-Object { $_ -cnotmatch '^[A-Za-z_][A-Za-z0-9_.:-]{0,79}$' }).Count -eq 0 -and
      @($globalNames | Select-Object -Unique).Count -eq $globalNames.Count
    if ($validGlobal) {
      if ($names -contains 'OpenCredentials') {
        $credentialValue = Read-BoxSetting $BoxName 'OpenCredentials'
      } elseif ($globalNames -contains 'OpenCredentials') {
        $credentialValue = Read-BoxSetting 'GlobalSettings' 'OpenCredentials'
      } else {
        $credentialValue = 'n'
      }
      foreach ($section in @($BoxName, 'GlobalSettings')) {
        $sectionNames = if ($section -eq $BoxName) { $names } else { $globalNames }
        if ($sectionNames -contains 'OpenProtectedStorage') {
          $direct = Read-BoxSetting $section 'OpenProtectedStorage'
          if ($null -eq $direct) { $credentialValue = $null; break }
          if ($direct -eq 'y') { $credentialValue = 'y'; break }
        }
        if ($sectionNames -contains 'Template') {
          $rawTemplates = Invoke-BoundedReadOnlyTool $iniExe ('query ' + $section + ' Template')
          if ($null -eq $rawTemplates) { $credentialValue = $null; break }
          $templates = @($rawTemplates -split '\r?\n' |
            ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
          if ($templates.Count -lt 1 -or $templates.Count -gt 128 -or
              @($templates | Where-Object { $_ -cnotmatch '^[A-Za-z_][A-Za-z0-9_.:-]{0,79}$' }).Count -gt 0) {
            $credentialValue = $null
            break
          }
          if ($templates -contains 'OpenProtectedStorage') {
            $credentialValue = 'y'
            break
          }
        }
      }
    }
  }
}
# OFF only means the inspected explicit WinCred bypass settings were not
# enabled. Sandboxie can still read native credentials; template expansion
# and Microsoft WAM/SSO isolation are NOT established by this observation.
$toFlag = { param($value) if ($value -eq 'y') { return 'ON' } if ($value -eq 'n') { return 'OFF' } return 'UNKNOWN' }
$credentialHostAccess = (& $toFlag $credentialValue)
$boxConfigured = if ($enabled -eq 'y') { 'YES' } elseif ($enabled -eq 'n') { 'NO' } else { 'UNKNOWN' }

$membershipStatus = 'UNKNOWN'
$boxedPids = @()
if ($trustedTools -and $serviceRunning -and $boxConfigured -eq 'YES') {
  $raw = Invoke-BoundedReadOnlyTool $startExe ('/box:' + $BoxName + ' /listpids')
  if ($null -ne $raw -and $raw -match '^[0-9\s]+$') {
    # /listpids counts ALL processes in a box, including helpers; the
    # independent Minecraft candidate limit below is still 16.
    # Keep enumeration bounded at 256 PIDs plus the existing 4096-char
    # output limit, with strict count, numeric and uniqueness checks.
    $lines = @($raw -split '\r?\n' |
      ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
    if ($lines.Count -ge 1 -and
        @($lines | Where-Object { $_ -notmatch '^\d+$' }).Count -eq 0) {
      $count = 0
      if ([int]::TryParse($lines[0], [ref]$count) -and
          $count -ge 0 -and $count -le 256 -and
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

# The normal /listpids path can fail because Start.exe is a GUI executable
# whose stdout pipe is not consistently captured. Only in that case, try
# the vendor's read-only SbieApi_EnumProcessEx in this short-lived child.
# Exact upstream implementation (pinned):
# https://github.com/sandboxie-plus/Sandboxie/blob/43b629be6c17628e6298befccfec279774895ba5/Sandboxie/core/dll/sbieapi.c
# https://github.com/sandboxie-plus/Sandboxie/blob/43b629be6c17628e6298befccfec279774895ba5/Sandboxie/core/drv/process_api.c
# The API uses five arguments and boxed_count is a separate ULONG pointer.
# A zero return alone cannot prove completeness: the driver can truncate
# to the supplied buffer capacity. Compare two full bounded snapshots and
# a final independent count, failing closed on churn, duplicates or truncation.
if ($membershipStatus -ne 'OBSERVED' -and
    $trustedTools -and $serviceRunning -and $boxConfigured -eq 'YES') {
  $sbieDll = Get-TrustedSbieDll
  if ($null -ne $sbieDll) {
    try {
      if (-not ('MivubiReadOnlySbieEnumeration' -as [type])) {
        Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class MivubiReadOnlySbieEnumeration {
  const uint LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR = 0x100;
  const uint LOAD_LIBRARY_SEARCH_DEFAULT_DIRS = 0x1000;

  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  static extern IntPtr LoadLibraryExW(string path, IntPtr reserved, uint flags);
  [DllImport("kernel32.dll", CharSet = CharSet.Ansi, ExactSpelling = true)]
  static extern IntPtr GetProcAddress(IntPtr module, string name);
  [DllImport("kernel32.dll")]
  [return: MarshalAs(UnmanagedType.Bool)]
  static extern bool FreeLibrary(IntPtr module);

  [UnmanagedFunctionPointer(CallingConvention.StdCall, CharSet = CharSet.Unicode)]
  delegate int EnumProcessEx(
    [In, MarshalAs(UnmanagedType.LPArray, ArraySubType = UnmanagedType.U2, SizeConst = 34)]
      char[] boxName,
    [MarshalAs(UnmanagedType.U1)] bool allSessions,
    uint whichSession,
    [Out, MarshalAs(UnmanagedType.LPArray)] uint[] boxedPids,
    ref uint boxedCount);

  static uint[] Read(EnumProcessEx query, char[] box, uint capacity) {
    uint[] data = new uint[capacity];
    uint count = capacity;
    int status = query(box, false, uint.MaxValue, data, ref count);
    // count == capacity might be truncated by the Sandboxie driver.
    if (status != 0 || count > 256 || count >= capacity)
      throw new InvalidOperationException("Sandboxie PID enumeration incomplete");
    uint[] result = new uint[count];
    Array.Copy(data, result, count);
    Array.Sort(result);
    for (int i = 0; i < result.Length; i++) {
      if (result[i] == 0 || (i > 0 && result[i] == result[i - 1]))
        throw new InvalidOperationException("Invalid Sandboxie PID inventory");
    }
    return result;
  }

  public sealed class Inventory {
    public readonly uint[] Pids;
    public Inventory(uint[] pids) { Pids = pids; }
  }

  public static Inventory Query(string dll, string box) {
    if (String.IsNullOrEmpty(box) || box.Length > 32 ||
        !System.Text.RegularExpressions.Regex.IsMatch(
          box, @"^[A-Za-z][A-Za-z0-9]{0,31}$"))
      throw new ArgumentException("Invalid selected box");
    IntPtr module = LoadLibraryExW(dll, IntPtr.Zero,
      LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR | LOAD_LIBRARY_SEARCH_DEFAULT_DIRS);
    if (module == IntPtr.Zero)
      throw new InvalidOperationException("Signed SbieDll load unavailable");
    try {
      IntPtr entry = GetProcAddress(module, "SbieApi_EnumProcessEx");
      if (entry == IntPtr.Zero)
        throw new MissingMethodException("Vendor enumeration export unavailable");
      EnumProcessEx query = (EnumProcessEx)Marshal.GetDelegateForFunctionPointer(
        entry, typeof(EnumProcessEx));
      // The Sandboxie driver probes a fixed 32-WCHAR prefix, even when
      // a shorter name is supplied. Allocate the documented WCHAR[34].
      char[] name = new char[34];
      box.CopyTo(0, name, 0, box.Length);
      uint expected = 0;
      if (query(name, false, uint.MaxValue, null, ref expected) != 0 ||
          expected > 256)
        throw new InvalidOperationException("Sandboxie count unavailable");
      // 128 slots of race headroom match upstream Start.exe. The consumer
      // accepts at most 256 actual PIDs, independently of the buffer size.
      uint capacity = (uint)Math.Min(384, Math.Max(16, (int)expected + 128));
      uint[] first = Read(query, name, capacity);
      uint[] second = Read(query, name, capacity);
      uint finalCount = 0;
      if (query(name, false, uint.MaxValue, null, ref finalCount) != 0 ||
          finalCount != expected || first.Length != (int)expected ||
          second.Length != first.Length)
        throw new InvalidOperationException("Sandboxie inventory changed");
      for (int i = 0; i < first.Length; i++)
        if (first[i] != second[i])
          throw new InvalidOperationException("Sandboxie inventory identity changed");
      // Wrap the array: PowerShell otherwise unwraps a valid empty list
      // to null and mistakes an OBSERVED empty box for UNKNOWN.
      return new Inventory(first);
    } finally { FreeLibrary(module); }
  }
}
'@ -ErrorAction Stop | Out-Null
      }
      # Empty array is an observed empty box; null is a failed probe.
      $enumerated = [MivubiReadOnlySbieEnumeration]::Query($sbieDll, $BoxName)
      if ($null -ne $enumerated) {
        $boxedPids = @($enumerated.Pids | ForEach-Object { [int64]$_ })
        $membershipStatus = 'OBSERVED'
      }
    } catch {
      # No fallback to zero PIDs or assumptions about native processes.
      $boxedPids = @()
      $membershipStatus = 'UNKNOWN'
    }
  }
}

$session = [System.Diagnostics.Process]::GetCurrentProcess().SessionId
# This cold, explicit Refresh path may inspect image signatures, but only
# for visible candidates outside the selected box. Cache by path for this
# single invocation; never persist private paths or use this as login proof.
$educationImageProof = @{}
function Get-EducationImageCandidate {
  param([object]$ProcessObject)
  $image = $null
  try { $image = [string]$ProcessObject.Path } catch { }
  if ([string]::IsNullOrWhiteSpace($image) -or
      -not (Test-Path -LiteralPath $image -PathType Leaf)) {
    return 'UNKNOWN'
  }
  if ($educationImageProof.ContainsKey($image)) {
    return $educationImageProof[$image]
  }
  $result = 'UNKNOWN'
  try {
    $product = [Diagnostics.FileVersionInfo]::GetVersionInfo($image).ProductName
    if ($product -match '(?i)(Minecraft.*Education|Education.*Minecraft)') {
      $signature = Get-AuthenticodeSignature -LiteralPath $image
      $publisher = if ($null -ne $signature.SignerCertificate) {
        [string]$signature.SignerCertificate.Subject
      } else { '' }
      if ($signature.Status -eq 'Valid' -and
          $publisher -match '(?i)(^|,\s*)O=Microsoft Corporation(,|$)') {
        $result = 'SIGNED_EDUCATION_IMAGE_CANDIDATE'
      }
    }
  } catch { }
  $educationImageProof[$image] = $result
  return $result
}
$gameCandidates = @(
  Get-Process -ErrorAction SilentlyContinue |
  Where-Object {
    $_.SessionId -eq $session -and
    $_.ProcessName -match '^(Minecraft\.Windows|Minecraft.*Education.*|Education.*Minecraft.*)$'
  } |
  Sort-Object Id |
  ForEach-Object {
    # PID alone is reusable. Capture the start timestamp from this
    # particular process object while enumerating; UNKNOWN is allowed if
    # access is denied or the process exits between reads.
    $createdFileTime = $null
    try {
      $createdFileTime = $_.StartTime.ToFileTimeUtc().ToString(
        [System.Globalization.CultureInfo]::InvariantCulture)
    } catch { }
    $handle = if ($_.MainWindowHandle -ne [IntPtr]::Zero) {
      '0x' + $_.MainWindowHandle.ToInt64().ToString('x')
    } else { $null }
    $inBox = if ($membershipStatus -eq 'OBSERVED') {
      [bool]($boxedPids -contains [int]$_.Id)
    } else { $null }
    $imageEvidence = 'UNKNOWN'
    if ($ImageProof -and $inBox -eq $false -and $null -ne $handle) {
      $imageEvidence = Get-EducationImageCandidate $_
    }
    [ordered]@{
      pid = [int]$_.Id
      createdFileTime = $createdFileTime
      windowHandle = $handle
      inSelectedBox = $inBox
      imageEvidence = $imageEvidence
    }
  }
)
if ($gameCandidates.Count -gt 16) {
  throw 'Too many name-matched process candidates; inspect directly.'
}

# Optional manual-only per-PID probe of the signed installed SbieDll.dll.
# QueryProcess is a documented read-only export. Loading it into this SHORT
# lived PowerShell inspection child avoids loading DLL initialization/hook
# machinery into the long-lived Tauri application.
# A nonzero QueryProcess status is UNKNOWN (including non-sandboxed, exited
# or permission-denied PIDs); never treat it as native proof.
$directPidQuery = 'NOT_REQUESTED'
$signedOtherBoxCount = 0
$signedUnknownBoxCount = 0
$signedOutside = @($gameCandidates | Where-Object {
  $_.imageEvidence -eq 'SIGNED_EDUCATION_IMAGE_CANDIDATE'
})
if ($ImageProof -and $signedOutside.Count -gt 0) {
  $directPidQuery = 'UNAVAILABLE'
  $signedUnknownBoxCount = $signedOutside.Count
  $sbieDll = Get-TrustedSbieDll
  if ($null -ne $sbieDll) {
      try {
        if (-not ('MivubiReadOnlySbieProcessQuery' -as [type])) {
          Add-Type -TypeDefinition @'
using System;
using System.Globalization;
using System.Runtime.InteropServices;

public static class MivubiReadOnlySbieProcessQuery {
  const uint PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
  const uint LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR = 0x100;
  const uint LOAD_LIBRARY_SEARCH_DEFAULT_DIRS = 0x1000;
  [StructLayout(LayoutKind.Sequential)]
  struct FILETIME { public uint Low, High; }

  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  static extern IntPtr LoadLibraryExW(string path, IntPtr reserved, uint flags);
  [DllImport("kernel32.dll", CharSet = CharSet.Ansi, ExactSpelling = true)]
  static extern IntPtr GetProcAddress(IntPtr module, string name);
  [DllImport("kernel32.dll")]
  [return: MarshalAs(UnmanagedType.Bool)]
  static extern bool FreeLibrary(IntPtr module);
  [DllImport("kernel32.dll", SetLastError = true)]
  static extern IntPtr OpenProcess(uint desiredAccess,
    [MarshalAs(UnmanagedType.Bool)] bool inherit, uint pid);
  [DllImport("kernel32.dll")]
  [return: MarshalAs(UnmanagedType.Bool)]
  static extern bool CloseHandle(IntPtr process);
  [DllImport("kernel32.dll", SetLastError = true)]
  [return: MarshalAs(UnmanagedType.Bool)]
  static extern bool GetProcessTimes(IntPtr process,
    out FILETIME created, out FILETIME exited,
    out FILETIME kernel, out FILETIME user);

  [UnmanagedFunctionPointer(CallingConvention.StdCall, CharSet = CharSet.Unicode)]
  delegate int QueryProcess(IntPtr pid,
    [Out, MarshalAs(UnmanagedType.LPArray, ArraySubType = UnmanagedType.U2, SizeConst = 34)]
      char[] box,
    IntPtr image, IntPtr sid, IntPtr session);

  static bool SameProcess(IntPtr process, ulong createdExpected) {
    FILETIME created, exited, kernel, user;
    if (!GetProcessTimes(process, out created, out exited, out kernel, out user))
      return false;
    ulong actual = ((ulong)created.High << 32) | created.Low;
    return actual != 0 && actual == createdExpected;
  }

  // Returns OTHER_BOX or UNKNOWN. It intentionally cannot return NATIVE.
  public static string[] Query(string dll, uint[] pids,
    string[] fileTimes, string selectedBox) {
    if (pids == null || fileTimes == null ||
        pids.Length != fileTimes.Length || pids.Length > 16)
      throw new ArgumentException("Invalid bounded PID request");
    IntPtr module = LoadLibraryExW(dll, IntPtr.Zero,
      LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR | LOAD_LIBRARY_SEARCH_DEFAULT_DIRS);
    if (module == IntPtr.Zero) throw new InvalidOperationException("SbieDll unavailable");
    try {
      IntPtr entry = GetProcAddress(module, "SbieApi_QueryProcess");
      if (entry == IntPtr.Zero) throw new MissingMethodException("QueryProcess unavailable");
      QueryProcess query = (QueryProcess)Marshal.GetDelegateForFunctionPointer(
        entry, typeof(QueryProcess));
      string[] results = new string[pids.Length];
      for (int i = 0; i < pids.Length; i++) {
        results[i] = "UNKNOWN";
        ulong expected;
        if (pids[i] == 0 || !ulong.TryParse(fileTimes[i],
            NumberStyles.None, CultureInfo.InvariantCulture, out expected) ||
            expected == 0)
          continue;
        IntPtr process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pids[i]);
        if (process == IntPtr.Zero) continue;
        try {
          if (!SameProcess(process, expected)) continue;
          char[] boxName = new char[34];
          int status = query((IntPtr)(long)pids[i], boxName,
            IntPtr.Zero, IntPtr.Zero, IntPtr.Zero);
          if (!SameProcess(process, expected) || status != 0) continue;
          int len = Array.IndexOf(boxName, '\0');
          if (len < 1 || len > 32) continue;
          string box = new string(boxName, 0, len);
          if (!System.Text.RegularExpressions.Regex.IsMatch(
                box, @"^[A-Za-z][A-Za-z0-9_]{0,31}$"))
            continue;
          if (!String.Equals(box, selectedBox, StringComparison.OrdinalIgnoreCase))
            results[i] = "OTHER_BOX";
        } finally { CloseHandle(process); }
      }
      return results;
    } finally { FreeLibrary(module); }
  }
}
'@ -ErrorAction Stop | Out-Null
        }
        $pids = [uint32[]]@($signedOutside | ForEach-Object { $_.pid })
        $times = [string[]]@($signedOutside | ForEach-Object { $_.createdFileTime })
        $results = @([MivubiReadOnlySbieProcessQuery]::Query(
          $sbieDll, $pids, $times, $BoxName))
        if ($results.Count -eq $signedOutside.Count -and
            @($results | Where-Object { $_ -notin @('OTHER_BOX', 'UNKNOWN') }).Count -eq 0) {
          $directPidQuery = 'QUERIED'
          $signedOtherBoxCount = @($results | Where-Object { $_ -eq 'OTHER_BOX' }).Count
          $signedUnknownBoxCount = $signedOutside.Count - $signedOtherBoxCount
        }
      } catch {
        # DLL load, ABI mismatch or Windows access failure must never infer
        # the process is unsandboxed. Discard partially inferred counts.
        $directPidQuery = 'UNAVAILABLE'
        $signedOtherBoxCount = 0
        $signedUnknownBoxCount = $signedOutside.Count
      }
  }
}

# UI quick-refresh uses SummaryOnly and does not write any evidence file.
if (-not $SummaryOnly) {
  if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $env:TEMP 'MinecraftInstanceManager\SandboxieFeasibility'
  }
  New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
}
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
    boxSettingsSource = $boxSettingsSource
    autoDelete = (& $toFlag $delete)
    autoRemove = (& $toFlag $remove)
    credentialHostAccess = $credentialHostAccess
    membershipStatus = $membershipStatus
  }
  machine = [ordered]@{
    interactiveSession = ($session -ne 0)
    processEvidenceClass = 'NAME_MATCH_CANDIDATE_ONLY'
    # Preserve the existing schema-1 persisted report exactly. Process
    # creation time is exposed only by the bounded live desktop summary.
    candidateProcesses = @($gameCandidates | ForEach-Object {
      [ordered]@{
        pid = $_.pid
        windowHandle = $_.windowHandle
        inSelectedBox = $_.inSelectedBox
      }
    })
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
$path = $null
if (-not $SummaryOnly) {
  $name = 'sandboxie-feasibility-' + (Get-Date -Format 'yyyyMMdd-HHmmss') +
    '-' + [guid]::NewGuid().ToString('N').Substring(0, 8) + '.json'
  $path = Join-Path $OutputDirectory $name
  [System.IO.File]::WriteAllText($path, (ConvertTo-Json -InputObject $report -Depth 8),
    [System.Text.UTF8Encoding]::new($false))
}
$summary = [ordered]@{
  # Desktop summary schema evolves independently of the persisted
  # schema-1 CLI report consumed by the existing evidence evaluator.
  schema = 6
  boxName = $BoxName
  stage = $Stage
  boxConfigured = $boxConfigured
  boxSettingsSource = $boxSettingsSource
  autoDelete = (& $toFlag $delete)
  autoRemove = (& $toFlag $remove)
  credentialHostAccess = $credentialHostAccess
  membershipStatus = $membershipStatus
  interactiveSession = ($session -ne 0)
  processEvidenceClass = 'NAME_MATCH_CANDIDATE_ONLY'
  candidateProcessCount = $gameCandidates.Count
  processCandidates = @($gameCandidates)
  officialImageOutsideSelectedBoxCount = $signedOutside.Count
  directPidQuery = $directPidQuery
  signedImageOtherBoxCount = $signedOtherBoxCount
  signedImageUnknownBoxCount = $signedUnknownBoxCount
  # Include Minecraft-name processes that have not created an HWND yet.
  # UNKNOWN Sandboxie membership is never treated as an empty box.
  isolatedCandidateProcesses = @($gameCandidates | Where-Object {
    $_.inSelectedBox -eq $true
  }).Count
  nativeVisibleCandidates = @($gameCandidates | Where-Object {
    $null -ne $_.windowHandle -and $_.inSelectedBox -eq $false
  }).Count
  isolatedVisibleCandidates = @($gameCandidates | Where-Object {
    $null -ne $_.windowHandle -and $_.inSelectedBox -eq $true
  }).Count
  interpretation = 'CONFIG_AND_PROCESS_CANDIDATES_ONLY_NO_AUTHENTICATION_PROOF'
}
if ($null -ne $path) { $summary['reportPath'] = $path }
[pscustomobject]$summary | ConvertTo-Json -Compress
