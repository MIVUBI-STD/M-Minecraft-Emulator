use serde::{Deserialize, Serialize};
use std::{collections::HashSet, io};

// Desktop-native observation only. PIDs and window handles are candidates,
// not verified Minecraft, Microsoft account, rendering or gameplay evidence.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NativeProcessCandidate {
    pub pid: u32,
    pub window_handle: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NativeProcessObservation {
    pub schema: u32,
    pub evidence_class: String,
    pub interactive_session: bool,
    pub candidates: Vec<NativeProcessCandidate>,
}

fn invalid_evidence(reason: &'static str) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, reason)
}

fn parse_native_observation(raw: &str) -> io::Result<NativeProcessObservation> {
    let report: NativeProcessObservation = serde_json::from_str(raw)
        .map_err(|_| invalid_evidence("native process observation has invalid JSON/schema"))?;
    if report.schema != 1
        || report.evidence_class != "NAME_MATCH_CANDIDATE_ONLY"
        || report.candidates.len() > 16
    {
        return Err(invalid_evidence("unsupported native candidate observation"));
    }
    let mut pids = HashSet::new();
    let mut handles = HashSet::new();
    for process in &report.candidates {
        if process.pid == 0 || !pids.insert(process.pid) {
            return Err(invalid_evidence("native process candidates have invalid or duplicate PIDs"));
        }
        if let Some(handle) = &process.window_handle {
            let bytes = handle.as_bytes();
            if !(3..=18).contains(&bytes.len())
                || !handle.starts_with("0x")
                || !bytes[2..].iter().all(u8::is_ascii_hexdigit)
            {
                return Err(invalid_evidence("native candidate window handle is malformed"));
            }
            let numeric_handle = u64::from_str_radix(&handle[2..], 16)
                .map_err(|_| invalid_evidence("native candidate window handle is invalid"))?;
            if numeric_handle == 0 || !handles.insert(numeric_handle) {
                return Err(invalid_evidence("native candidate window handle is zero or duplicate"));
            }
        }
    }
    Ok(report)
}

#[cfg(target_os = "windows")]
pub fn inspect_native_candidates() -> io::Result<NativeProcessObservation> {
    use std::{path::Path, time::Duration};

    // Current interactive Windows session only. Never read executable paths,
    // command lines, titles, world files, account IDs, registry tokens or WAM.
    // Minecraft.Windows is shared by other Minecraft editions: every PID/HWND
    // remains a name-matched candidate, never authenticated Minecraft proof.
    const SCRIPT: &str = r#"
$ErrorActionPreference = 'Stop'
$sessionId = (Get-Process -Id $PID -ErrorAction Stop).SessionId
$items = @(
  Get-Process -ErrorAction SilentlyContinue |
    Where-Object {
      $_.SessionId -eq $sessionId -and
      $_.ProcessName -match '^(Minecraft\.Windows|Minecraft.*Education.*|Education.*Minecraft.*)$'
    } |
    Sort-Object Id |
    ForEach-Object {
      $handle = $null
      if ($_.MainWindowHandle -ne [IntPtr]::Zero) {
        $handle = '0x' + $_.MainWindowHandle.ToInt64().ToString('x')
      }
      [pscustomobject]@{ pid = [int]$_.Id; windowHandle = $handle }
    }
)
if ($items.Count -gt 16) { throw 'Candidate process cap exceeded' }
[pscustomobject]@{
  schema = 1
  evidenceClass = 'NAME_MATCH_CANDIDATE_ONLY'
  interactiveSession = ($sessionId -ne 0)
  candidates = @($items)
} | ConvertTo-Json -Depth 4 -Compress
"#;

    let output = virtual_clients_core::bounded_command_output(
        Path::new("powershell.exe"),
        ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", SCRIPT],
        Duration::from_secs(8),
    )?;
    parse_native_observation(&output)
}

#[cfg(not(target_os = "windows"))]
pub fn inspect_native_candidates() -> io::Result<NativeProcessObservation> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "Native Minecraft process inspection requires Windows",
    ))
}

#[cfg(target_os = "windows")]
pub fn open_native_minecraft() -> io::Result<()> {
    use std::{path::Path, time::Duration};

    // Request the single registered official application as the current
    // interactive user. This does NOT create a guaranteed second instance.
    // Never guess EXE paths, clone game files or accept arbitrary arguments.
    const SCRIPT: &str = r#"
$ErrorActionPreference = 'Stop'
$sessionId = (Get-Process -Id $PID -ErrorAction Stop).SessionId
if ($sessionId -eq 0) { throw 'Minecraft must launch from an interactive Windows session.' }
$registry = [Microsoft.Win32.RegistryKey]::OpenBaseKey(
  [Microsoft.Win32.RegistryHive]::LocalMachine,
  [Microsoft.Win32.RegistryView]::Registry32
)
$desktopVersion = $null
try {
  $entry = $registry.OpenSubKey('SOFTWARE\Microsoft\Microsoft Studios\Minecraft Education Edition')
  if ($null -ne $entry) {
    try { $desktopVersion = [string]$entry.GetValue('Version', '') }
    finally { $entry.Dispose() }
  }
}
finally { $registry.Dispose() }
$storePresent = @(Get-AppxPackage -Name 'Microsoft.MinecraftEducationEdition' -ErrorAction SilentlyContinue).Count -gt 0
if ($desktopVersion -notmatch '^\d+(?:\.\d+){1,4}$' -or $storePresent) {
  throw 'A single Minecraft Education Desktop installation is required; do not mix Desktop and Store editions.'
}
$apps = @(Get-StartApps -ErrorAction Stop | Where-Object {
    $_.Name -eq 'Minecraft Education' -or
    $_.Name -eq 'Minecraft: Education Edition' -or
    $_.Name -eq 'Minecraft Education Edition'
})
if ($apps.Count -ne 1) {
    throw 'Minecraft Education must have exactly one registered Start menu app. Check the official installation.'
}
$appId = [string]$apps[0].AppID
if (-not $appId -or $appId.Length -gt 256 -or $appId -notmatch '^[A-Za-z0-9_.!+{}-]+$') {
    throw 'Registered Minecraft Education application identity is invalid.'
}
Start-Process -FilePath 'explorer.exe' -ArgumentList ('shell:AppsFolder\' + $appId) -ErrorAction Stop | Out-Null
"#;
    virtual_clients_core::bounded_command_output(
        Path::new("powershell.exe"),
        ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", SCRIPT],
        Duration::from_secs(12),
    )
    .map(|_| ())
    .map_err(|error| {
        io::Error::new(
            error.kind(),
            format!("Minecraft Education launch request failed: {error}"),
        )
    })
}

#[cfg(not(target_os = "windows"))]
pub fn open_native_minecraft() -> io::Result<()> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "The four-account MVP currently targets a Windows PC.",
    ))
}



// The canonical Windows evidence collector is embedded into this development
// pilot. One implementation owns Sandboxie box/membership/config observations;
// its data never proves Microsoft account isolation or a playable Minecraft.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SandboxieClientObservation {
    pub schema: u32,
    pub box_name: String,
    pub stage: String,
    pub box_configured: String,
    pub box_settings_source: String,
    pub auto_delete: String,
    pub auto_remove: String,
    pub credential_host_access: String,
    pub membership_status: String,
    pub interactive_session: bool,
    pub process_evidence_class: String,
    pub candidate_process_count: u32,
    pub native_visible_candidates: u32,
    pub isolated_visible_candidates: u32,
    pub interpretation: String,
}

fn parse_sandboxie_observation(raw: &str) -> io::Result<SandboxieClientObservation> {
    let report: SandboxieClientObservation = serde_json::from_str(raw)
        .map_err(|_| invalid_evidence("invalid Sandboxie collector summary"))?;
    let one_of = |value: &str, allowed: &[&str]| allowed.contains(&value);
    if report.schema != 1
        || report.box_name != CLIENT_02_BOX_NAME
        || report.stage != "INSPECT"
        || report.process_evidence_class != "NAME_MATCH_CANDIDATE_ONLY"
        || report.interpretation != "CONFIG_AND_PROCESS_CANDIDATES_ONLY_NO_AUTHENTICATION_PROOF"
        || !one_of(&report.box_configured, &["YES", "NO", "UNKNOWN"])
        || !one_of(&report.box_settings_source, &["BOX_SECTION_ENUMERATED", "UNKNOWN"])
        || !one_of(&report.auto_delete, &["ON", "OFF", "UNKNOWN"])
        || !one_of(&report.auto_remove, &["ON", "OFF", "UNKNOWN"])
        || !one_of(&report.credential_host_access, &["ON", "OFF", "UNKNOWN"])
        || !one_of(&report.membership_status, &["OBSERVED", "UNKNOWN"])
        || (report.membership_status == "OBSERVED" && report.box_configured != "YES")
        || (report.box_settings_source == "BOX_SECTION_ENUMERATED" && report.box_configured != "YES")
        || (report.credential_host_access != "UNKNOWN" && report.box_settings_source != "BOX_SECTION_ENUMERATED")
        || report.candidate_process_count > 16
        || report.native_visible_candidates.saturating_add(report.isolated_visible_candidates)
            > report.candidate_process_count
        || (report.membership_status == "UNKNOWN"
            && (report.native_visible_candidates != 0
                || report.isolated_visible_candidates != 0))
    {
        return Err(invalid_evidence("untrusted or contradictory Sandboxie process observation"));
    }
    Ok(report)
}

#[cfg(windows)]
pub fn inspect_sandbox_client_02() -> io::Result<SandboxieClientObservation> {
    use std::{path::Path, time::Duration};
    const INSPECT: &str = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../../tooling/acceptance/windows/collect-sandboxie-feasibility.ps1"
    ));
    // Wrap the canonical diagnostic collector in a PowerShell script block
    // so its explicit -SummaryOnly switch can be bound without changing
    // the full, persisted CLI evidence route. No report written for UI refresh.
    let script = ["& {\n", INSPECT, "\n} -SummaryOnly"].concat();
    let output = virtual_clients_core::bounded_command_output(
        Path::new("powershell.exe"),
        ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script.as_str()],
        Duration::from_secs(30),
    )?;
    parse_sandboxie_observation(&output)
}

#[cfg(not(windows))]
pub fn inspect_sandbox_client_02() -> io::Result<SandboxieClientObservation> {
    Err(io::Error::new(io::ErrorKind::Unsupported, "Windows is required"))
}

// Client 02 only. The sandbox is provisioned and licensed outside the manager.
const CLIENT_02_BOX_NAME: &str = "MinecraftClient02";
// This is a bounded launch REQUEST, not an independent-account verdict.
fn validate_education_path(path: &str) -> io::Result<()> {
    let p = std::path::Path::new(path);
    let valid = p.file_name().and_then(|s| s.to_str()).is_some_and(|name| {
        matches!(name.to_ascii_lowercase().as_str(),
            "minecraft.windows.exe" | "minecrafteducation.exe" |
            "minecrafteducationedition.exe")
    });
    if path.is_empty() || path.len() > 1024 || path.chars().any(char::is_control)
        || !p.is_absolute() || !valid {
        return Err(io::Error::new(io::ErrorKind::InvalidInput,
            "Select the installed Minecraft Education Windows EXE, not a shortcut or installer"));
    }
    Ok(())
}

#[cfg(windows)]
pub fn select_education_exe() -> io::Result<Option<String>> {
    Ok(rfd::FileDialog::new()
        .set_title("Select Minecraft Education executable")
        .add_filter("Windows executable", &["exe"])
        .pick_file().map(|p| p.to_string_lossy().into_owned()))
}

#[cfg(not(windows))]
pub fn select_education_exe() -> io::Result<Option<String>> {
    Err(io::Error::new(io::ErrorKind::Unsupported, "Windows only"))
}

#[cfg(windows)]
pub fn request_sandbox_client_02(executable: String, licensed: bool) -> io::Result<()> {
    use std::{path::Path, time::Duration};
    validate_education_path(&executable)?;
    if !licensed {
        return Err(io::Error::new(io::ErrorKind::PermissionDenied,
            "Confirm licensing for Sandboxie Plus in this environment"));
    }
    if !Path::new(&executable).is_file() {
        return Err(io::Error::new(io::ErrorKind::NotFound,
            "Selected Minecraft Education EXE was not found"));
    }
    let observation = inspect_sandbox_client_02()?;
    if !observation.interactive_session
        || observation.box_configured != "YES"
        || observation.box_settings_source != "BOX_SECTION_ENUMERATED"
        || observation.auto_delete != "OFF"
        || observation.auto_remove != "OFF"
        || observation.credential_host_access != "OFF"
    {
        return Err(io::Error::new(io::ErrorKind::PermissionDenied,
            "Sandboxie Client 02 preflight blocked: box must be enabled, persistent and OpenCredentials must be verifiably OFF (including inherited global settings)"));
    }
    let escaped = executable.replace('\'', "''");
    let box_name = CLIENT_02_BOX_NAME;
    let script = format!(r#"
$ErrorActionPreference = 'Stop'
$game = '{escaped}'
$box = '{box_name}'
if ([Diagnostics.Process]::GetCurrentProcess().SessionId -eq 0) {{
    throw 'Interactive Windows user session required'
}}
$reg = [Microsoft.Win32.RegistryKey]::OpenBaseKey(
    [Microsoft.Win32.RegistryHive]::LocalMachine,
    [Microsoft.Win32.RegistryView]::Registry32)
$version = $null
try {{
    $k = $reg.OpenSubKey('SOFTWARE\Microsoft\Microsoft Studios\Minecraft Education Edition')
    if ($null -ne $k) {{
        try {{ $version = [string]$k.GetValue('Version','') }}
        finally {{ $k.Dispose() }}
    }}
}} finally {{ $reg.Dispose() }}
if ($version -notmatch '^\d+(?:\.\d+){{1,4}}$' -or
    @(Get-AppxPackage -Name 'Microsoft.MinecraftEducationEdition' -ErrorAction SilentlyContinue).Count -gt 0) {{
    throw 'Requires one official Desktop edition, without Store edition'
}}
$product = [Diagnostics.FileVersionInfo]::GetVersionInfo($game).ProductName
$signature = Get-AuthenticodeSignature -LiteralPath $game
$publisher = if ($null -ne $signature.SignerCertificate) {{
    [string]$signature.SignerCertificate.Subject
}} else {{ '' }}
if ($product -notmatch '(?i)(Minecraft.*Education|Education.*Minecraft)' -or
    $signature.Status -ne 'Valid' -or
    $publisher -notmatch '(?i)(^|,\s*)O=Microsoft Corporation(,|$)') {{
    throw 'Selected executable must be a valid Microsoft Corporation-signed Minecraft Education Desktop build'
}}
$install = @((Join-Path $env:ProgramFiles 'Sandboxie-Plus'),
             (Join-Path $env:ProgramFiles 'Sandboxie')) |
             Where-Object {{
                 (Test-Path -LiteralPath (Join-Path $_ 'Start.exe') -PathType Leaf) -and
                 (Test-Path -LiteralPath (Join-Path $_ 'SbieIni.exe') -PathType Leaf)
             }} | Select-Object -First 1
if (-not $install) {{ throw "Install Sandboxie Plus and create $box first" }}
$start = Join-Path $install 'Start.exe'
$ini = Join-Path $install 'SbieIni.exe'
if ((Get-AuthenticodeSignature -LiteralPath $start).Status -ne 'Valid' -or
    (Get-AuthenticodeSignature -LiteralPath $ini).Status -ne 'Valid') {{
    throw 'Sandboxie tools must be signed and trusted'
}}
if ((Get-Service SbieSvc -ErrorAction Stop).Status -ne 'Running') {{
    throw 'Sandboxie service not running'
}}
$enabled = @(& $ini query $box Enabled 2>$null)
if ($LASTEXITCODE -ne 0 -or $enabled.Count -ne 1 -or $enabled[0].Trim() -ne 'y') {{
    throw "Persistent box $box must exist and be enabled"
}}
$names = @(& $ini query $box '*' 2>$null)
if ($LASTEXITCODE -ne 0 -or $names.Count -lt 1 -or
    $names.Count -gt 128 -or $names -notcontains 'Enabled') {{
    throw 'Could not verify persistent box settings'
}}
foreach ($key in @('AutoDelete','AutoRemove')) {{
    if ($names -contains $key) {{
        $value = @(& $ini query $box $key 2>$null)
        if ($LASTEXITCODE -ne 0 -or $value.Count -ne 1 -or $value[0].Trim() -ne 'n') {{
            throw 'AutoDelete and AutoRemove must remain OFF'
        }}
    }}
}}
# Sandboxie's GUI Start.exe may return before a child actually launches.
# Never interpret this request as process membership, login or gameplay.
$launcher = Start-Process -FilePath $start -ArgumentList @(('/box:' + $box), ('"' + $game + '"')) -PassThru -ErrorAction Stop
if (-not $launcher.WaitForExit(8000)) {{
    throw 'Sandboxie Start.exe did not confirm the launch request within 8 seconds; game state remains UNKNOWN'
}}
if ($launcher.ExitCode -ne 0) {{
    throw "Sandboxie Start.exe rejected the launch request (exit code $($launcher.ExitCode))"
}}
"#);
    virtual_clients_core::bounded_command_output(
        Path::new("powershell.exe"),
        ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script.as_str()],
        Duration::from_secs(20),
    )?;
    Ok(())
}

#[cfg(not(windows))]
pub fn request_sandbox_client_02(_executable: String, _licensed: bool) -> io::Result<()> {
    Err(io::Error::new(io::ErrorKind::Unsupported, "Windows only"))
}

#[cfg(test)]
mod tests {
    use super::{parse_native_observation, parse_sandboxie_observation, validate_education_path};
    use serde_json::json;

    fn fixture() -> serde_json::Value {
        json!({
            "schema": 1,
            "evidenceClass": "NAME_MATCH_CANDIDATE_ONLY",
            "interactiveSession": true,
            "candidates": [
                {"pid": 123, "windowHandle": "0xAA"},
                {"pid": 456, "windowHandle": null}
            ]
        })
    }

    #[test]
    fn sandboxie_summary_rejects_fabricated_membership_and_credentials() {
        let base = serde_json::json!({
            "schema":1, "boxName":"MinecraftClient02", "stage":"INSPECT",
            "boxConfigured":"YES", "boxSettingsSource":"BOX_SECTION_ENUMERATED",
            "autoDelete":"OFF", "autoRemove":"OFF", "credentialHostAccess":"OFF",
            "membershipStatus":"OBSERVED", "interactiveSession":true,
            "processEvidenceClass":"NAME_MATCH_CANDIDATE_ONLY",
            "candidateProcessCount":2, "nativeVisibleCandidates":1,
            "isolatedVisibleCandidates":1,
            "interpretation":"CONFIG_AND_PROCESS_CANDIDATES_ONLY_NO_AUTHENTICATION_PROOF"
        });
        assert!(parse_sandboxie_observation(&base.to_string()).is_ok());
        let mut wrong = base.clone();
        wrong["boxName"] = serde_json::json!("AnotherBox");
        assert!(parse_sandboxie_observation(&wrong.to_string()).is_err());
        let mut wrong = base.clone();
        wrong["membershipStatus"] = serde_json::json!("UNKNOWN");
        assert!(parse_sandboxie_observation(&wrong.to_string()).is_err());
        let mut wrong = base.clone();
        wrong["credentialHostAccess"] = serde_json::json!("VERIFIED_GAMEPLAY");
        assert!(parse_sandboxie_observation(&wrong.to_string()).is_err());
    }

    #[test]
    fn accepts_only_non_authoritative_two_process_observation() {
        let parsed = parse_native_observation(&fixture().to_string()).unwrap();
        assert_eq!(parsed.candidates.len(), 2);
        assert_eq!(parsed.candidates[0].pid, 123);
        assert_eq!(parsed.candidates[1].window_handle, None);
        assert_eq!(parsed.evidence_class, "NAME_MATCH_CANDIDATE_ONLY");
    }

    #[test]
    fn rejects_duplicate_pids_handles_and_invalid_evidence_class() {
        let mutations: Vec<Box<dyn Fn(&mut serde_json::Value)>> = vec![
            Box::new(|r| r["candidates"][1]["pid"] = json!(123)),
            Box::new(|r| r["candidates"][1]["windowHandle"] = json!("0xaa")),
            Box::new(|r| r["candidates"][1]["windowHandle"] = json!("0x00aa")),
            Box::new(|r| r["candidates"][0]["pid"] = json!(0)),
            Box::new(|r| r["candidates"][0]["windowHandle"] = json!("0x0")),
            Box::new(|r| r["evidenceClass"] = json!("GAMEPLAY_VERIFIED")),
            Box::new(|r| r["schema"] = json!(2)),
        ];
        for mutate in mutations {
            let mut report = fixture();
            mutate(&mut report);
            assert!(parse_native_observation(&report.to_string()).is_err());
        }
    }

    #[test]
    fn rejects_unbounded_and_extra_private_data() {
        let mut report = fixture();
        report["candidates"] = json!((1..=17).map(|pid| json!({
            "pid": pid, "windowHandle": null
        })).collect::<Vec<_>>());
        assert!(parse_native_observation(&report.to_string()).is_err());

        let mut report = fixture();
        report["candidates"][0]["accountEmail"] = json!("private@example.com");
        assert!(parse_native_observation(&report.to_string()).is_err());
    }

    #[test]
    fn rejects_non_education_exe_and_unsafe_paths() {
        for bad in ["", "notepad.exe", "C:/Tools/notepad.exe",
                    "C:/Tools/Minecraft.Windows.cmd",
                    "../Minecraft.Windows.exe", "C:/Minecraft.Windows.exe\nother"] {
            assert!(validate_education_path(bad).is_err());
        }
    }

    #[test]
    fn empty_observation_is_not_a_game_failure() {
        let mut report = fixture();
        report["candidates"] = json!([]);
        let parsed = parse_native_observation(&report.to_string()).unwrap();
        assert!(parsed.candidates.is_empty());
        assert!(parsed.interactive_session);
    }
}
