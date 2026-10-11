use std::io;

// Desktop-only conveniences: requesting an application launch does not
// prove that Minecraft rendered, signed in, or is ready for gameplay.
// VM lifecycle authority remains in engine/runtime-core.

#[cfg(target_os = "windows")]
pub fn open_native_minecraft() -> io::Result<()> {
    use std::{path::Path, time::Duration};

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
    virtual_clients_core::bounded_command_output(
        Path::new("powershell.exe"),
        ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", SCRIPT],
        Duration::from_secs(12),
    ).map(|_| ()).map_err(|_| io::Error::new(
        io::ErrorKind::NotFound,
        "Minecraft Education Start menu launch was not accepted. Check that the official desktop or Store version is installed.",
    ))
}

#[cfg(not(target_os = "windows"))]
pub fn open_native_minecraft() -> io::Result<()> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "The four-account MVP currently targets a Windows PC.",
    ))
}
