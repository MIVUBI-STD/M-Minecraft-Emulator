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
    // PowerShell Get-Process exposes only name-matched PID and visible HWND.
    const SCRIPT: &str = r#"
$ErrorActionPreference = 'Stop'
$sessionId = (Get-Process -Id $PID -ErrorAction Stop).SessionId
$items = @(
  Get-Process -ErrorAction SilentlyContinue |
    Where-Object {
      $_.SessionId -eq $sessionId -and
      $_.ProcessName -match '^(Minecraft.*Education.*|Education.*Minecraft.*)$'
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

#[cfg(test)]
mod tests {
    use super::parse_native_observation;
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
    fn empty_observation_is_not_a_game_failure() {
        let mut report = fixture();
        report["candidates"] = json!([]);
        let parsed = parse_native_observation(&report.to_string()).unwrap();
        assert!(parsed.candidates.is_empty());
        assert!(parsed.interactive_session);
    }
}
