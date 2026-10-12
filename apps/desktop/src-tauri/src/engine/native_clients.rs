use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    io,
    sync::{Mutex, MutexGuard},
    time::{Duration, Instant},
};

// One backend admission boundary for explicitly requested Client 02 launches.
// This protects in-process callers without a worker, daemon or persisted state.
const CLIENT_02_LAUNCH_RETRY_GAP: Duration = Duration::from_secs(30);
static CLIENT_02_LAUNCH: Mutex<Option<Instant>> = Mutex::new(None);

fn acquire_client_02_launch() -> io::Result<MutexGuard<'static, Option<Instant>>> {
    let guard = CLIENT_02_LAUNCH.try_lock().map_err(|_| {
        io::Error::new(io::ErrorKind::WouldBlock,
            "A Client 02 launch is already in progress")
    })?;
    if guard.as_ref().is_some_and(|last| last.elapsed() < CLIENT_02_LAUNCH_RETRY_GAP) {
        return Err(io::Error::new(io::ErrorKind::AlreadyExists,
            "Client 02 was recently requested; inspect before retrying after 30 seconds"));
    }
    Ok(guard)
}


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
pub struct ProcessIdentityCandidate {
    pub pid: u32,
    // Decimal FILETIME, carried as a string to preserve full precision in JS.
    // None means start time was inaccessible; it is not a verified identity.
    pub created_file_time: Option<String>,
    pub window_handle: Option<String>,
    pub in_selected_box: Option<bool>,
    // Microsoft signed Education product image candidate, not native/authenticated.
    pub image_evidence: String,
}

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
    pub process_candidates: Vec<ProcessIdentityCandidate>,
    pub official_image_outside_selected_box_count: u32,
    pub isolated_candidate_processes: u32,
    pub native_visible_candidates: u32,
    pub isolated_visible_candidates: u32,
    pub interpretation: String,
}

fn parse_sandboxie_observation(raw: &str) -> io::Result<SandboxieClientObservation> {
    let report: SandboxieClientObservation = serde_json::from_str(raw)
        .map_err(|_| invalid_evidence("invalid Sandboxie collector summary"))?;
    let one_of = |value: &str, allowed: &[&str]| allowed.contains(&value);
    if report.schema != 4
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
        || report.process_candidates.len() != report.candidate_process_count as usize
        || report.official_image_outside_selected_box_count > report.candidate_process_count
        || report.isolated_candidate_processes > report.candidate_process_count
        || report.isolated_visible_candidates > report.isolated_candidate_processes
        || report.native_visible_candidates.saturating_add(report.isolated_visible_candidates)
            > report.candidate_process_count
        || (report.membership_status == "UNKNOWN"
            && (report.native_visible_candidates != 0
                || report.isolated_visible_candidates != 0
                || report.isolated_candidate_processes != 0))
    {
        return Err(invalid_evidence("untrusted or contradictory Sandboxie process observation"));
    }
    // Reconcile the identity list with the published candidate counts.
    // No PID/HWND snapshot is proof of Education sign-in or active gameplay.
    let mut pids = HashSet::new();
    let mut windows = HashSet::new();
    let mut boxed = 0_u32;
    let mut boxed_visible = 0_u32;
    let mut outside_visible = 0_u32;
    let mut official_outside = 0_u32;
    for candidate in &report.process_candidates {
        if candidate.pid == 0 || !pids.insert(candidate.pid) {
            return Err(invalid_evidence("duplicate or zero process identity PID"));
        }
        if let Some(time) = &candidate.created_file_time {
            let n = time.parse::<u64>()
                .map_err(|_| invalid_evidence("invalid process FILETIME"))?;
            if n == 0 || n.to_string() != *time {
                return Err(invalid_evidence("noncanonical process FILETIME"));
            }
        }
        if report.membership_status == "UNKNOWN" && candidate.in_selected_box.is_some() {
            return Err(invalid_evidence("unknown Sandboxie membership cannot attribute a PID"));
        }
        if candidate.in_selected_box == Some(true) { boxed += 1; }
        match candidate.image_evidence.as_str() {
            "UNKNOWN" => (),
            "SIGNED_EDUCATION_IMAGE_CANDIDATE" => {
                if candidate.in_selected_box != Some(false)
                    || candidate.window_handle.is_none()
                {
                    return Err(invalid_evidence(
                        "signed Education image requires a visible outside-box candidate"));
                }
                official_outside += 1;
            }
            _ => return Err(invalid_evidence("unrecognized executable image evidence")),
        }
        if let Some(hwnd) = &candidate.window_handle {
            let raw = hwnd.as_bytes();
            if !(3..=18).contains(&raw.len())
                || !hwnd.starts_with("0x")
                || !raw[2..].iter().all(u8::is_ascii_hexdigit)
            {
                return Err(invalid_evidence("invalid process identity HWND"));
            }
            let handle = u64::from_str_radix(&hwnd[2..], 16)
                .map_err(|_| invalid_evidence("invalid process identity HWND"))?;
            if handle == 0 || !windows.insert(handle) {
                return Err(invalid_evidence("duplicate or zero process HWND"));
            }
            if candidate.in_selected_box == Some(true) { boxed_visible += 1; }
            if candidate.in_selected_box == Some(false) { outside_visible += 1; }
        }
    }
    if boxed != report.isolated_candidate_processes
        || official_outside != report.official_image_outside_selected_box_count
        || boxed_visible != report.isolated_visible_candidates
        || outside_visible != report.native_visible_candidates
    {
        return Err(invalid_evidence("process candidate identities contradict counters"));
    }
    Ok(report)
}

// The same collector owns both paths. Explicit UI Refresh checks candidate
// executable provenance; Focus/Place/Launch inspect only the process/box
// evidence they need, without repeated Authenticode verification.
#[cfg(windows)]
fn inspect_sandbox_client_02_mode(
    image_proof: bool,
) -> io::Result<SandboxieClientObservation> {
    use std::{path::Path, time::Duration};
    const INSPECT: &str = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../../tooling/acceptance/windows/collect-sandboxie-feasibility.ps1"
    ));
    let script = if image_proof {
        ["& {\n", INSPECT, "\n} -SummaryOnly -ImageProof"].concat()
    } else {
        ["& {\n", INSPECT, "\n} -SummaryOnly"].concat()
    };
    let output = virtual_clients_core::bounded_command_output(
        Path::new("powershell.exe"),
        ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script.as_str()],
        Duration::from_secs(30),
    )?;
    parse_sandboxie_observation(&output)
}

#[cfg(windows)]
pub fn inspect_sandbox_client_02() -> io::Result<SandboxieClientObservation> {
    inspect_sandbox_client_02_mode(true)
}

#[cfg(windows)]
fn inspect_sandbox_client_02_fast() -> io::Result<SandboxieClientObservation> {
    inspect_sandbox_client_02_mode(false)
}

#[cfg(not(windows))]
pub fn inspect_sandbox_client_02() -> io::Result<SandboxieClientObservation> {
    Err(io::Error::new(io::ErrorKind::Unsupported, "Windows is required"))
}

#[cfg(not(windows))]
fn inspect_sandbox_client_02_fast() -> io::Result<SandboxieClientObservation> {
    Err(io::Error::new(io::ErrorKind::Unsupported, "Windows is required"))
}

// Focus is a user-requested, non-destructive window operation. Never use a
// previously observed PID/HWND as authority without fresh Sandboxie membership,
// process creation time and window-owner checks.
fn verify_fresh_focus_target(
    target: &ProcessIdentityCandidate,
    fresh: &SandboxieClientObservation,
) -> io::Result<(u64, u64)> {
    let invalid = || io::Error::new(io::ErrorKind::InvalidInput,
        "Client 02 focus requires a visible boxed process with known identity; Refresh first");
    if target.pid == 0 || target.in_selected_box != Some(true)
        || !fresh.interactive_session || fresh.membership_status != "OBSERVED"
    {
        return Err(invalid());
    }
    let created = target.created_file_time.as_deref()
        .ok_or_else(invalid)?.parse::<u64>().map_err(|_| invalid())?;
    let window_text = target.window_handle.as_deref().ok_or_else(invalid)?;
    let hwnd = u64::from_str_radix(
        window_text.strip_prefix("0x").ok_or_else(invalid)?, 16
    ).map_err(|_| invalid())?;
    if created == 0 || hwnd == 0 ||
        !fresh.process_candidates.iter().any(|candidate| candidate == target)
    {
        return Err(io::Error::new(io::ErrorKind::NotFound,
            "Client 02 process or window changed since Refresh; inspect again"));
    }
    Ok((created, hwnd))
}

// Compute a single client slot inside a monitor's usable work area. This
// deliberately does not infer, move or claim ownership of Client 01.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Client02PlacementSide {
    Left,
    Right,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Client02PlacementRect {
    x: i32,
    y: i32,
    width: i32,
    height: i32,
}

fn client_02_half_slot(
    left: i32, top: i32, right: i32, bottom: i32, side: Client02PlacementSide,
) -> io::Result<Client02PlacementRect> {
    let width = right.checked_sub(left)
        .ok_or_else(|| invalid_evidence("invalid monitor work-area width"))?;
    let height = bottom.checked_sub(top)
        .ok_or_else(|| invalid_evidence("invalid monitor work-area height"))?;
    if width < 2 || height < 1 {
        return Err(invalid_evidence("monitor work area is too small for window placement"));
    }
    let left_width = width / 2;
    let (x, slot_width) = match side {
        Client02PlacementSide::Left => (left, left_width),
        Client02PlacementSide::Right => (
            left.checked_add(left_width)
                .ok_or_else(|| invalid_evidence("monitor placement overflow"))?,
            width - left_width,
        ),
    };
    Ok(Client02PlacementRect { x, y: top, width: slot_width, height })
}

// One ownership boundary for both Focus and Place. Keep the process handle
// alive across the entire Win32 action to prevent PID reuse. Recheck the
// observed box membership and HWND owner immediately before calling the OS.
#[cfg(windows)]
fn with_verified_client_02_window(
    target: ProcessIdentityCandidate,
    action: impl FnOnce(windows_sys::Win32::Foundation::HWND) -> io::Result<()>,
) -> io::Result<()> {
    use windows_sys::Win32::{
        Foundation::{CloseHandle, FILETIME},
        System::Threading::{GetProcessTimes, OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION},
        UI::WindowsAndMessaging::{
            GetAncestor, GetWindowThreadProcessId, IsWindow, IsWindowVisible, GA_ROOT,
        },
    };
    // An explicit operation never bypasses an in-progress launch or another
    // window mutation in the same manager.
    let _guard = CLIENT_02_LAUNCH.try_lock().map_err(|_| {
        io::Error::new(io::ErrorKind::WouldBlock,
            "Another Client 02 operation is in progress")
    })?;
    let fresh = inspect_sandbox_client_02_fast()?;
    let (expected_time, hwnd_number) = verify_fresh_focus_target(&target, &fresh)?;
    let process = unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, target.pid) };
    if process.is_null() {
        return Err(io::Error::new(io::ErrorKind::PermissionDenied,
            "Cannot inspect Client 02 process identity; action refused"));
    }

    let outcome = (|| -> io::Result<()> {
        let empty = || FILETIME { dwLowDateTime: 0, dwHighDateTime: 0 };
        let mut created = empty();
        let mut exited = empty();
        let mut kernel = empty();
        let mut user = empty();
        if unsafe { GetProcessTimes(process, &mut created, &mut exited,
            &mut kernel, &mut user) } == 0
        {
            return Err(io::Error::new(io::ErrorKind::PermissionDenied,
                "Cannot recheck Client 02 creation time"));
        }
        let actual_time = (u64::from(created.dwHighDateTime) << 32)
            | u64::from(created.dwLowDateTime);
        if actual_time != expected_time {
            return Err(io::Error::new(io::ErrorKind::NotFound,
                "Client 02 PID was reused or process identity changed; Refresh first"));
        }

        let hwnd = hwnd_number as usize as *mut core::ffi::c_void;
        let mut window_pid = 0_u32;
        if unsafe { IsWindow(hwnd) } == 0
            || unsafe { IsWindowVisible(hwnd) } == 0
            || unsafe { GetWindowThreadProcessId(hwnd, &mut window_pid) } == 0
            || window_pid != target.pid
            || unsafe { GetAncestor(hwnd, GA_ROOT) } != hwnd
        {
            return Err(io::Error::new(io::ErrorKind::NotFound,
                "Client 02 window no longer belongs to the observed process; Refresh first"));
        }
        action(hwnd)
    })();
    unsafe { CloseHandle(process); }
    outcome
}

#[cfg(windows)]
pub fn focus_observed_client_02(target: ProcessIdentityCandidate) -> io::Result<()> {
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        IsIconic, SetForegroundWindow, ShowWindow, SW_RESTORE,
    };
    with_verified_client_02_window(target, |hwnd| {
        if unsafe { IsIconic(hwnd) } != 0 {
            unsafe { ShowWindow(hwnd, SW_RESTORE); }
        }
        if unsafe { SetForegroundWindow(hwnd) } == 0 {
            return Err(io::Error::new(io::ErrorKind::PermissionDenied,
                "Windows refused to focus Client 02; select its window or use Alt+Tab"));
        }
        Ok(())
    })
}

#[cfg(not(windows))]
pub fn focus_observed_client_02(_target: ProcessIdentityCandidate) -> io::Result<()> {
    Err(io::Error::new(io::ErrorKind::Unsupported,
        "Focusing Client 02 requires Windows"))
}

#[cfg(windows)]
pub fn place_observed_client_02(
    target: ProcessIdentityCandidate,
    side: Client02PlacementSide,
) -> io::Result<()> {
    use windows_sys::Win32::{
        Graphics::Gdi::{
            GetMonitorInfoW, MonitorFromWindow, MONITORINFO, MONITOR_DEFAULTTONEAREST,
        },
        UI::WindowsAndMessaging::{
            GetWindowThreadProcessId, IsIconic, IsZoomed, SetWindowPos,
            SWP_ASYNCWINDOWPOS, SWP_NOACTIVATE, SWP_NOOWNERZORDER, SWP_NOZORDER,
        },
    };
    let process_id = target.pid;
    with_verified_client_02_window(target, |hwnd| {
        // Never silently change Minecraft's maximized/fullscreen or minimized
        // state. The operator can restore the window explicitly first.
        if unsafe { IsIconic(hwnd) } != 0 || unsafe { IsZoomed(hwnd) } != 0 {
            return Err(io::Error::new(io::ErrorKind::InvalidInput,
                "Restore Client 02 to a normal window before arranging"));
        }
        let monitor = unsafe { MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST) };
        if monitor.is_null() {
            return Err(io::Error::new(io::ErrorKind::NotFound,
                "Cannot locate the monitor containing Client 02"));
        }
        let mut info = MONITORINFO::default();
        info.cbSize = std::mem::size_of::<MONITORINFO>() as u32;
        if unsafe { GetMonitorInfoW(monitor, &mut info) } == 0 {
            return Err(io::Error::last_os_error());
        }
        let work = info.rcWork;
        let slot = client_02_half_slot(
            work.left, work.top, work.right, work.bottom, side,
        )?;
        // A HWND may be replaced while monitor geometry is queried. Recheck
        // ownership immediately before the only window mutation.
        let mut owner = 0_u32;
        if unsafe { GetWindowThreadProcessId(hwnd, &mut owner) } == 0
            || owner != process_id
        {
            return Err(io::Error::new(io::ErrorKind::NotFound,
                "Client 02 window ownership changed before placement"));
        }
        // Async placement avoids waiting indefinitely on a game window's
        // input queue. Success means the request was accepted, not that the
        // game rendered or the final geometry is already confirmed.
        let flags = SWP_ASYNCWINDOWPOS | SWP_NOACTIVATE
            | SWP_NOZORDER | SWP_NOOWNERZORDER;
        if unsafe { SetWindowPos(
            hwnd, std::ptr::null_mut(), slot.x, slot.y,
            slot.width, slot.height, flags,
        ) } == 0 {
            return Err(io::Error::last_os_error());
        }
        Ok(())
    })
}

#[cfg(not(windows))]
pub fn place_observed_client_02(
    _target: ProcessIdentityCandidate,
    _side: Client02PlacementSide,
) -> io::Result<()> {
    Err(io::Error::new(io::ErrorKind::Unsupported,
        "Arranging Client 02 requires Windows"))
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
    // UI buttons are not an IPC concurrency guarantee. Hold the backend
    // guard across preflight and launch to prevent overlapping requests.
    let mut launch_guard = acquire_client_02_launch()?;
    let observation = inspect_sandbox_client_02_fast()?;
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
    // A Minecraft-name process can still be starting without any HWND.
    // Refuse duplicates when membership is observed; never infer gameplay.
    // Unknown membership remains explicitly unknown: some Sandboxie GUI
    // versions provide no stdout from /listpids.
    if observation.membership_status == "OBSERVED"
        && observation.isolated_candidate_processes > 0
    {
        return Err(io::Error::new(io::ErrorKind::AlreadyExists,
            "Client 02 already contains a Minecraft process candidate, possibly without a window; inspect before retrying"));
    }
    let escaped = executable.replace('\'', "''");
    let box_name = CLIENT_02_BOX_NAME;
    let script = format!(r#"
$ErrorActionPreference = 'Stop'
$game = '{escaped}'
$box = '{box_name}'
# Sandboxie's GUI normally receives a working directory for sandboxed
# run commands; pin this to the signed installed game EXE directory.
$gameFolder = [System.IO.Path]::GetDirectoryName($game)
if (-not (Test-Path -LiteralPath $gameFolder -PathType Container)) {{
    throw 'Selected Education executable directory is unavailable'
}}
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
# Search the same trusted Windows installation roots as the canonical
# read-only collector, avoiding preflight/launch path inconsistencies.
$roots = @(
    [Environment]::GetEnvironmentVariable('ProgramW6432'),
    [Environment]::GetEnvironmentVariable('ProgramFiles'),
    [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
) | Where-Object {{ $_ }} | Select-Object -Unique
$install = @($roots | ForEach-Object {{ Join-Path $_ 'Sandboxie-Plus' }} |
    Where-Object {{
        (Test-Path -LiteralPath (Join-Path $_ 'Start.exe') -PathType Leaf) -and
        (Test-Path -LiteralPath (Join-Path $_ 'SbieIni.exe') -PathType Leaf)
    }}) | Select-Object -First 1
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
$launcher = Start-Process -FilePath $start -WorkingDirectory $gameFolder -ArgumentList @(('/box:' + $box), ('"' + $game + '"')) -PassThru -ErrorAction Stop
try {{
    if (-not $launcher.WaitForExit(8000)) {{
        # Start.exe is not Minecraft. Leave game and box untouched when
        # the helper's outcome is ambiguous, but release our process handle.
        throw 'Sandboxie Start.exe did not confirm the launch request within 8 seconds; game state remains UNKNOWN'
    }}
    if ($launcher.ExitCode -ne 0) {{
        throw "Sandboxie Start.exe rejected the launch request (exit code $($launcher.ExitCode))"
    }}
}} finally {{
    $launcher.Dispose()
}}
"#);
    // Even a timed-out launch command might have spawned Minecraft already.
    // Reserve a brief retry gap before the potentially ambiguous side effect.
    *launch_guard = Some(Instant::now());
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
    use super::{acquire_client_02_launch, parse_native_observation, parse_sandboxie_observation, validate_education_path};
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
    fn placement_slot_keeps_all_pieces_inside_monitor_work_area() {
        use super::{client_02_half_slot, Client02PlacementSide};
        let left = client_02_half_slot(-1280, 40, 641, 1120, Client02PlacementSide::Left).unwrap();
        let right = client_02_half_slot(-1280, 40, 641, 1120, Client02PlacementSide::Right).unwrap();
        assert_eq!(left.x, -1280);
        assert_eq!(left.y, 40);
        assert_eq!(left.width, 960);
        assert_eq!(right.x, -320);
        assert_eq!(right.width, 961);
        assert_eq!(left.height, 1080);
        assert_eq!(right.x + right.width, 641);
        assert!(client_02_half_slot(30, 0, 31, 800, Client02PlacementSide::Left).is_err());
        assert!(client_02_half_slot(10, 40, 10, 400, Client02PlacementSide::Right).is_err());
        assert!(client_02_half_slot(i32::MIN, 0, i32::MAX, 800,
            Client02PlacementSide::Right).is_err());
    }

    #[test]
    fn focus_requires_exact_fresh_box_process_and_window_identity() {
        let report = serde_json::json!({
            "schema":4, "boxName":"MinecraftClient02", "stage":"INSPECT",
            "boxConfigured":"YES", "boxSettingsSource":"BOX_SECTION_ENUMERATED",
            "autoDelete":"OFF", "autoRemove":"OFF", "credentialHostAccess":"OFF",
            "membershipStatus":"OBSERVED", "interactiveSession":true,
            "processEvidenceClass":"NAME_MATCH_CANDIDATE_ONLY",
            "candidateProcessCount":1,
            "processCandidates":[{
                "pid":202, "createdFileTime":"133400000000000001",
                "windowHandle":"0x200", "inSelectedBox":true, "imageEvidence":"UNKNOWN"
            }],
            "officialImageOutsideSelectedBoxCount":0,
            "isolatedCandidateProcesses":1, "nativeVisibleCandidates":0,
            "isolatedVisibleCandidates":1,
            "interpretation":"CONFIG_AND_PROCESS_CANDIDATES_ONLY_NO_AUTHENTICATION_PROOF"
        });
        let fresh = parse_sandboxie_observation(&report.to_string()).unwrap();
        let target = fresh.process_candidates[0].clone();
        assert_eq!(super::verify_fresh_focus_target(&target, &fresh).unwrap().0,
            133400000000000001);
        let mut changed = target.clone();
        changed.created_file_time = Some("133400000000000002".into());
        assert!(super::verify_fresh_focus_target(&changed, &fresh).is_err());
        changed = target.clone();
        changed.window_handle = Some("0x201".into());
        assert!(super::verify_fresh_focus_target(&changed, &fresh).is_err());
        changed = target.clone();
        changed.in_selected_box = None;
        assert!(super::verify_fresh_focus_target(&changed, &fresh).is_err());
        changed = target.clone();
        changed.created_file_time = None;
        assert!(super::verify_fresh_focus_target(&changed, &fresh).is_err());
        let mut unknown = fresh.clone();
        unknown.membership_status = "UNKNOWN".into();
        assert!(super::verify_fresh_focus_target(&target, &unknown).is_err());
    }

    #[test]
    fn backend_rejects_overlapping_client_02_launches() {
        let first = acquire_client_02_launch().expect("first request admitted");
        let second = acquire_client_02_launch().err().expect("concurrent request refused");
        assert_eq!(second.kind(), std::io::ErrorKind::WouldBlock);
        drop(first);
        assert!(acquire_client_02_launch().is_ok());
    }

    #[test]
    fn sandboxie_summary_rejects_fabricated_membership_and_credentials() {
        let base = serde_json::json!({
            "schema":4, "boxName":"MinecraftClient02", "stage":"INSPECT",
            "boxConfigured":"YES", "boxSettingsSource":"BOX_SECTION_ENUMERATED",
            "autoDelete":"OFF", "autoRemove":"OFF", "credentialHostAccess":"OFF",
            "membershipStatus":"OBSERVED", "interactiveSession":true,
            "processEvidenceClass":"NAME_MATCH_CANDIDATE_ONLY",
            "candidateProcessCount":2,
            "processCandidates":[
                {"pid":101, "createdFileTime":"133400000000000000", "windowHandle":"0x100", "inSelectedBox":false, "imageEvidence":"SIGNED_EDUCATION_IMAGE_CANDIDATE"},
                {"pid":202, "createdFileTime":"133400000000000001", "windowHandle":"0x200", "inSelectedBox":true, "imageEvidence":"UNKNOWN"}
            ],
            "officialImageOutsideSelectedBoxCount":1,
            "isolatedCandidateProcesses":1,
            "nativeVisibleCandidates":1, "isolatedVisibleCandidates":1,
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
        let mut wrong = base.clone();
        wrong["isolatedCandidateProcesses"] = serde_json::json!(0);
        assert!(parse_sandboxie_observation(&wrong.to_string()).is_err());
        let mut wrong = base.clone();
        wrong["isolatedCandidateProcesses"] = serde_json::json!(3);
        assert!(parse_sandboxie_observation(&wrong.to_string()).is_err());
        let mut wrong = base.clone();
        wrong["processCandidates"][1]["createdFileTime"] = serde_json::json!("invalid");
        assert!(parse_sandboxie_observation(&wrong.to_string()).is_err());
        let mut wrong = base.clone();
        wrong["processCandidates"][1]["pid"] = serde_json::json!(101);
        assert!(parse_sandboxie_observation(&wrong.to_string()).is_err());
        let mut wrong = base.clone();
        wrong["processCandidates"][1]["inSelectedBox"] = serde_json::json!(false);
        assert!(parse_sandboxie_observation(&wrong.to_string()).is_err());
        let mut wrong = base.clone();
        wrong["officialImageOutsideSelectedBoxCount"] = serde_json::json!(0);
        assert!(parse_sandboxie_observation(&wrong.to_string()).is_err());
        let mut wrong = base.clone();
        wrong["processCandidates"][1]["imageEvidence"] = serde_json::json!("SIGNED_EDUCATION_IMAGE_CANDIDATE");
        assert!(parse_sandboxie_observation(&wrong.to_string()).is_err());
        let mut wrong = base.clone();
        wrong["processCandidates"][0]["imageEvidence"] = serde_json::json!("AUTHENTICATED_NATIVE");
        assert!(parse_sandboxie_observation(&wrong.to_string()).is_err());
        let mut missing_time = base.clone();
        missing_time["processCandidates"][1]["createdFileTime"] = serde_json::Value::Null;
        assert!(parse_sandboxie_observation(&missing_time.to_string()).is_ok());
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
