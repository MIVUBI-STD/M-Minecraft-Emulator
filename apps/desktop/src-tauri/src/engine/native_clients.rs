use std::io;

// Desktop-only conveniences: requesting an application launch does not
// prove that Minecraft rendered, signed in, or started a second instance.
// VM lifecycle authority remains in engine/runtime-core.

#[cfg(target_os = "windows")]
pub fn open_native_minecraft() -> io::Result<()> {
    use std::process::Command;

    // Start the registered application as the current interactive Windows
    // user. Never guess an EXE path or take caller-provided executable args.
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
    let output = Command::new("powershell.exe")
        .args(["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", SCRIPT])
        .output()?;
    if output.status.success() {
        Ok(())
    } else {
        Err(io::Error::new(
            io::ErrorKind::NotFound,
            "Minecraft Education Start menu launch was not accepted. Check that the official desktop or Store version is installed.",
        ))
    }
}

#[cfg(not(target_os = "windows"))]
pub fn open_native_minecraft() -> io::Result<()> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "The four-account MVP currently targets a Windows PC.",
    ))
}

#[cfg(target_os = "windows")]
pub fn open_android_instance_manager() -> io::Result<()> {
    use std::{env, path::PathBuf, process::Command};

    // BlueStacks is an optional independent third-party installation, not an
    // embedded dependency or evidence of Minecraft Education compatibility.
    // Never search user-writable PATH entries or execute untrusted shortcuts.
    for key in ["ProgramW6432", "ProgramFiles", "ProgramFiles(x86)"] {
        if let Some(root) = env::var_os(key) {
            let candidate = PathBuf::from(root)
                .join("BlueStacks_nxt")
                .join("HD-MultiInstanceManager.exe");
            if candidate.is_file() {
                Command::new(candidate).spawn()?;
                return Ok(());
            }
        }
    }
    Err(io::Error::new(
        io::ErrorKind::NotFound,
        "BlueStacks 5 Multi-instance Manager was not found in the standard Windows installation folders. Open the manager manually if it was installed in another location.",
    ))
}

#[cfg(not(target_os = "windows"))]
pub fn open_android_instance_manager() -> io::Result<()> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "The four-account MVP currently targets a Windows PC.",
    ))
}
