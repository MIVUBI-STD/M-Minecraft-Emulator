//! Read-only candidate for an app-owned Sandboxie-derived engine.
//! This module NEVER installs/loads a driver, chooses a runtime backend,
//! migrates an occupied box, or treats checksums as Authenticode trust.
//! The officially installed Sandboxie provider remains the only active route.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashSet,
    fs::{self, File},
    io::{self, Read},
    path::{Component, Path, PathBuf},
};

const PINNED_UPSTREAM: &str = "abd4c240031cfb46666daa74ca47ed4e48b561e4";
const EXPECTED_STATE: &str = "ARTIFACTS_STAGED_NOT_INSTALLABLE";
const PRIVATE_STATE: &str = "PRIVATE_CORE_STAGED_NOT_INSTALLABLE";
const PRIVATE_SOURCE_FILES: &[&str] = &[
    "Sandboxie/common/my_version.h",
    "Sandboxie/core/drv/api.c",
    "Sandboxie/core/dll/sbieapi.c",
    "Sandboxie/core/svc/DriverAssist.cpp",
    "Sandboxie/apps/start/start.cpp",
    "Sandboxie/apps/ini/main.c",
    "Sandboxie/install/kmdutil/kmdutil.c",
];
const REQUIRED_FILES: &[&str] = &[
    "SbieDrv.sys", "SbieSvc.exe", "SbieDll.dll",
    "Start.exe", "SbieIni.exe", "kmdutil.exe", "SbieMsg.dll",
    "SandboxieRpcSs.exe", "SandboxieDcomLaunch.exe",
    "SandboxieCrypto.exe", "SandboxieBITS.exe", "SandboxieWUAU.exe",
    "SbieCtrl.exe", "SboxHostDll.dll",
    "32/SbieSvc.exe", "32/SbieDll.dll",
    "Templates.ini", "SbieSettings.ini",
    "Manifest0.txt", "Manifest1.txt", "Manifest2.txt",
    "LICENSES/LICENSE.Plus", "LICENSES/Sandboxie/COPYING",
];

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct StagedArtifact {
    path: String,
    source: String,
    size_bytes: u64,
    sha256: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct BuildStage {
    id: String,
    platform: String,
    state: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct StagedManifest {
    schema: u32,
    state: String,
    upstream_repository: String,
    upstream_tag: String,
    upstream_commit: String,
    build_stages: Vec<BuildStage>,
    artifacts: Vec<StagedArtifact>,
    windows_kernel_driver_loaded: bool,
    minecraft_gameplay_verified: bool,
    sandboxie_external_dependency_removed: bool,
    public_distribution_approved: bool,
    // Optional ONLY on the private exclusive source build. The original
    // upstream payload must not claim the new fork identity.
    private_core_build: Option<bool>,
    private_fork_head: Option<String>,
    private_fork_tree: Option<String>,
    private_patch_sha256: Option<String>,
    source_build_marker: Option<String>,
    source_files_modified: Option<Vec<String>>,
    can_coexist_with_official_sandboxie: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OwnedCandidateInspection {
    pub schema: u32,
    pub state: String,
    pub upstream_commit: String,
    pub verified_artifact_count: u32,
    pub required_artifact_count: u32,
    pub provider_selected: bool,
    pub driver_load_verified: bool,
    pub gameplay_verified: bool,
    pub install_permitted: bool,
}

fn rejected(message: &'static str) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, message)
}

fn safe_relative_file(root: &Path, relative: &str) -> io::Result<PathBuf> {
    if relative.is_empty() || relative.len() > 240 {
        return Err(rejected("empty or oversized owned-engine artifact path"));
    }
    let relative_path = Path::new(relative);
    if relative_path.is_absolute() || relative.contains('\\') {
        return Err(rejected("owned-engine artifact path is not portable"));
    }
    let mut joined = root.to_path_buf();
    let mut depth = 0;
    for component in relative_path.components() {
        let Component::Normal(part) = component else {
            return Err(rejected("owned-engine artifact path traversal refused"));
        };
        depth += 1;
        if depth > 6 {
            return Err(rejected("owned-engine artifact path depth exceeded"));
        }
        let part = part.to_string_lossy();
        if part.is_empty() || !part.bytes().all(|b|
            b.is_ascii_alphanumeric() || matches!(b, b'.' | b'_' | b'-'))
        {
            return Err(rejected("owned-engine artifact path has unsafe characters"));
        }
        joined.push(part.as_ref());
        // Include broken symlinks: metadata() follows them and can lie by returning ENOENT.
        let metadata = fs::symlink_metadata(&joined)
            .map_err(|_| rejected("owned-engine artifact entry missing or inaccessible"))?;
        if metadata.file_type().is_symlink() {
            return Err(rejected("owned-engine artifact symlink refused"));
        }
    }
    if depth == 0 {
        return Err(rejected("empty owned-engine artifact path"));
    }
    Ok(joined)
}

fn sha256_file(path: &Path, expected_size: u64) -> io::Result<String> {
    let mut file = File::open(path)?;
    let original = file.metadata()?;
    if !original.is_file() || original.len() != expected_size || expected_size == 0 {
        return Err(rejected("owned-engine artifact type or size changed"));
    }
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let count = file.read(&mut buffer)?;
        if count == 0 { break; }
        hasher.update(&buffer[..count]);
    }
    let current = file.metadata()?;
    if current.len() != original.len() || current.modified()? != original.modified()? {
        return Err(rejected("owned-engine artifact changed during hash verification"));
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn required_stages(stages: &[BuildStage]) -> bool {
    let expected = [
        ("win32-support", "Win32"),
        ("x64-core", "x64"),
        ("x64-kernel", "x64"),
    ];
    stages.len() == expected.len() && stages.iter().zip(expected).all(
        |(actual, (id, platform))|
            actual.id == id && actual.platform == platform && actual.state == "COMPILED"
    )
}

/// Read-only checksum and layout inspection. A result is NEVER approval to
/// install the upstream kernel driver or launch a separate Minecraft account.
pub fn inspect_candidate(root: &Path) -> io::Result<OwnedCandidateInspection> {
    if root.as_os_str().is_empty() || !root.is_absolute() {
        return Err(io::Error::new(io::ErrorKind::InvalidInput,
            "Owned engine candidate requires an absolute directory"));
    }
    let metadata = fs::symlink_metadata(root)?;
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err(rejected("owned-engine candidate root must be an ordinary directory"));
    }
    let manifest_path = safe_relative_file(root, "engine-provenance.json")?;
    let raw = fs::read(&manifest_path)?;
    if raw.len() > 256 * 1024 {
        return Err(rejected("owned-engine manifest exceeds bounded size"));
    }
    let manifest: StagedManifest = serde_json::from_slice(&raw)
        .map_err(|_| rejected("invalid owned-engine provenance schema"))?;
    let private = manifest.state == PRIVATE_STATE;
    let private_provenance_correct = if private {
        manifest.private_core_build == Some(true)
            && manifest.private_fork_head.as_ref().is_some_and(|sha| {
                sha.len() == 40 && sha != PINNED_UPSTREAM
                    && sha.bytes().all(|b| b.is_ascii_hexdigit()
                        && !b.is_ascii_uppercase())
            })
            && manifest.private_fork_tree.as_ref().is_some_and(|sha| {
                sha.len() == 40 && sha.bytes().all(|b| b.is_ascii_hexdigit()
                    && !b.is_ascii_uppercase())
            })
            && manifest.private_patch_sha256.as_ref().is_some_and(|sha| {
                sha.len() == 64 && sha.bytes().all(|b| b.is_ascii_hexdigit()
                    && !b.is_ascii_uppercase())
            })
            && manifest.source_build_marker.as_deref() == Some("MIVUBI_PRIVATE_ISOLATION_BUILD")
            && manifest.can_coexist_with_official_sandboxie == Some(false)
            && manifest.source_files_modified.as_ref().is_some_and(|files| {
                files.len() == PRIVATE_SOURCE_FILES.len() &&
                files.iter().zip(PRIVATE_SOURCE_FILES.iter())
                    .all(|(actual, expected)| actual.as_str() == *expected)
            })
    } else {
        manifest.private_core_build.is_none()
            && manifest.private_fork_head.is_none()
            && manifest.private_fork_tree.is_none()
            && manifest.private_patch_sha256.is_none()
            && manifest.source_build_marker.is_none()
            && manifest.source_files_modified.is_none()
            && manifest.can_coexist_with_official_sandboxie.is_none()
    };
    if manifest.schema != 1 || !(manifest.state == EXPECTED_STATE || private)
        || !private_provenance_correct
        || manifest.upstream_repository != "sandboxie-plus/Sandboxie"
        || manifest.upstream_tag != "v1.18.5"
        || manifest.upstream_commit != PINNED_UPSTREAM
        || manifest.windows_kernel_driver_loaded
        || manifest.minecraft_gameplay_verified
        || manifest.sandboxie_external_dependency_removed
        || manifest.public_distribution_approved
        || !required_stages(&manifest.build_stages)
        || !(REQUIRED_FILES.len()..=48).contains(&manifest.artifacts.len())
    {
        return Err(rejected("owned-engine manifest makes unproven runtime claims"));
    }

    let mut seen = HashSet::new();
    for artifact in &manifest.artifacts {
        if !seen.insert(artifact.path.as_str()) {
            return Err(rejected("duplicate owned-engine artifact path"));
        }
        if artifact.source.is_empty() || artifact.source.len() > 256
            || !artifact.source.starts_with("Sandboxie/")
                && !artifact.source.starts_with("LICENSE.Plus")
                && !artifact.source.starts_with("SandboxiePlus/")
        {
            return Err(rejected("unrecognized upstream artifact provenance"));
        }
        if artifact.sha256.len() != 64 || !artifact.sha256.bytes().all(|b|
            b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
        {
            return Err(rejected("invalid owned-engine artifact checksum"));
        }
        let path = safe_relative_file(root, &artifact.path)?;
        if sha256_file(&path, artifact.size_bytes)? != artifact.sha256 {
            return Err(rejected("owned-engine artifact checksum does not match bytes"));
        }
    }
    if !REQUIRED_FILES.iter().all(|name| seen.contains(name)) {
        return Err(rejected("incomplete owned-engine driver/service/DLL, helpers or license closure"));
    }
    // Explicit staging marker must accompany the purported uninstalled bundle.
    let marker = safe_relative_file(root, "NOT-INSTALLABLE.txt")?;
    if !fs::metadata(marker)?.is_file() {
        return Err(rejected("owned-engine safety marker missing"));
    }
    Ok(OwnedCandidateInspection {
        schema: 1,
        state: "CANDIDATE_INTEGRITY_VERIFIED_NOT_INSTALLABLE".into(),
        upstream_commit: PINNED_UPSTREAM.into(),
        verified_artifact_count: manifest.artifacts.len() as u32,
        required_artifact_count: REQUIRED_FILES.len() as u32,
        provider_selected: false,
        driver_load_verified: false,
        gameplay_verified: false,
        install_permitted: false,
    })
}

pub fn inspect_candidate_path(path: String) -> io::Result<OwnedCandidateInspection> {
    inspect_candidate(Path::new(&path))
}


#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct OwnedHostProbe {
    schema: u32,
    evidence_class: String,
    interactive_session: bool,
    inspection_status: String,
    service_registration: String,
    driver_registration: String,
    provider_selected: bool,
    trusted_driver_loaded: bool,
    gameplay_verified: bool,
}

/// A read-only Windows SCM namespace observation. A service name is not
/// trustworthy attribution to our payload; it may belong to official Sandboxie.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OwnedHostInspection {
    pub schema: u32,
    pub state: String,
    pub interactive_session: bool,
    pub service_registration: String,
    pub driver_registration: String,
    pub service_namespace_available: bool,
    pub provider_selected: bool,
    pub trusted_driver_loaded: bool,
    pub gameplay_verified: bool,
    pub activation_allowed: bool,
}

fn parse_host_probe(raw: &str) -> io::Result<OwnedHostInspection> {
    if raw.len() > 4096 {
        return Err(rejected("owned host service probe exceeded bounded size"));
    }
    let probe: OwnedHostProbe = serde_json::from_str(raw)
        .map_err(|_| rejected("owned host service probe has invalid schema"))?;
    let allowed = |s: &str| matches!(s, "PRESENT" | "ABSENT" | "UNKNOWN");
    let unknown = probe.service_registration == "UNKNOWN"
        || probe.driver_registration == "UNKNOWN";
    if probe.schema != 1
        || probe.evidence_class != "WINDOWS_SERVICE_NAME_ONLY_NO_OWNER_PROOF"
        || !allowed(&probe.service_registration)
        || !allowed(&probe.driver_registration)
        || (probe.inspection_status == "PARTIAL_UNKNOWN") != unknown
        || !matches!(probe.inspection_status.as_str(), "OBSERVED" | "PARTIAL_UNKNOWN")
        || probe.provider_selected || probe.trusted_driver_loaded || probe.gameplay_verified
    {
        return Err(rejected("owned host service probe is contradictory or overclaims trust"));
    }
    // Even an empty SCM namespace has no signed driver, configured isolation
    // profile, trusted IPC protocol or proved disposable-host provenance.
    let empty_namespace = !unknown && probe.service_registration == "ABSENT"
        && probe.driver_registration == "ABSENT";
    let state = if !probe.interactive_session {
        "BLOCKED_NON_INTERACTIVE_SESSION"
    } else if probe.service_registration == "PRESENT" || probe.driver_registration == "PRESENT" {
        "BLOCKED_SERVICE_NAMESPACE_IN_USE"
    } else if unknown {
        "BLOCKED_SERVICE_PROBE_UNKNOWN"
    } else {
        "BLOCKED_UNVERIFIED_OWNED_DRIVER"
    };
    Ok(OwnedHostInspection {
        schema: 1,
        state: state.into(),
        interactive_session: probe.interactive_session,
        service_registration: probe.service_registration,
        driver_registration: probe.driver_registration,
        service_namespace_available: empty_namespace,
        provider_selected: false,
        trusted_driver_loaded: false,
        gameplay_verified: false,
        activation_allowed: false,
    })
}

#[cfg(windows)]
pub fn inspect_host_service_namespace() -> io::Result<OwnedHostInspection> {
    use std::time::Duration;
    // Embedded source from our repository, no user-controlled executable path
    // and no account, token, private box or world inspection.
    const SCRIPT: &str = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../../tooling/isolation-source/windows/probe-host-service-names.ps1"
    ));
    let output = virtual_clients_core::bounded_command_output(
        &super::native_clients::system_powershell()?,
        ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", SCRIPT],
        Duration::from_secs(15),
    )?;
    parse_host_probe(&output)
}

#[cfg(not(windows))]
pub fn inspect_host_service_namespace() -> io::Result<OwnedHostInspection> {
    Err(io::Error::new(io::ErrorKind::Unsupported,
        "Owned host service inspection requires interactive Windows"))
}


#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    struct TempCandidate(PathBuf);
    impl TempCandidate {
        fn new() -> Self {
            let unique = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
            let path = std::env::temp_dir().join(format!("mivubi-owned-candidate-{}-{unique}", std::process::id()));
            fs::create_dir(&path).unwrap();
            Self(path)
        }
        fn add_file(&self, path: &str, content: &[u8]) -> serde_json::Value {
            let target = self.0.join(path);
            fs::create_dir_all(target.parent().unwrap()).unwrap();
            fs::write(&target, content).unwrap();
            let mut hash = Sha256::new();
            hash.update(content);
            serde_json::json!({
                "path": path,
                "source": if path == "LICENSES/LICENSE.Plus" { "LICENSE.Plus".to_string() }
                    else { format!("Sandboxie/{}", path) },
                "sizeBytes": content.len(),
                "sha256": format!("{:x}", hash.finalize()),
            })
        }
        fn populate(&self) {
            let mut files = Vec::new();
            for path in REQUIRED_FILES {
                files.push(self.add_file(path, format!("fixture:{path}").as_bytes()));
            }
            fs::write(self.0.join("NOT-INSTALLABLE.txt"), b"NOT INSTALLABLE").unwrap();
            let provenance = serde_json::json!({
                "schema": 1, "state": EXPECTED_STATE, "upstreamRepository": "sandboxie-plus/Sandboxie",
                "upstreamTag": "v1.18.5", "upstreamCommit": PINNED_UPSTREAM,
                "buildStages": [
                    {"id":"win32-support","platform":"Win32","state":"COMPILED"},
                    {"id":"x64-core","platform":"x64","state":"COMPILED"},
                    {"id":"x64-kernel","platform":"x64","state":"COMPILED"}
                ],
                "artifacts": files,
                "windowsKernelDriverLoaded": false,
                "minecraftGameplayVerified": false,
                "sandboxieExternalDependencyRemoved": false,
                "publicDistributionApproved": false
            });
            fs::write(self.0.join("engine-provenance.json"),
                serde_json::to_vec(&provenance).unwrap()).unwrap();
        }
    }
    impl Drop for TempCandidate {
        fn drop(&mut self) { let _ = fs::remove_dir_all(&self.0); }
    }


    fn host_probe(service: &str, driver: &str, interactive: bool) -> String {
        let unknown = service == "UNKNOWN" || driver == "UNKNOWN";
        serde_json::json!({
            "schema": 1,
            "evidenceClass": "WINDOWS_SERVICE_NAME_ONLY_NO_OWNER_PROOF",
            "interactiveSession": interactive,
            "inspectionStatus": if unknown { "PARTIAL_UNKNOWN" } else { "OBSERVED" },
            "serviceRegistration": service,
            "driverRegistration": driver,
            "providerSelected": false,
            "trustedDriverLoaded": false,
            "gameplayVerified": false
        }).to_string()
    }

    #[test]
    fn no_service_names_still_does_not_authorize_install_or_launch() {
        let result = parse_host_probe(&host_probe("ABSENT", "ABSENT", true)).unwrap();
        assert_eq!(result.state, "BLOCKED_UNVERIFIED_OWNED_DRIVER");
        assert!(result.service_namespace_available);
        assert!(!result.activation_allowed && !result.provider_selected
            && !result.trusted_driver_loaded && !result.gameplay_verified);
    }

    #[test]
    fn service_and_driver_names_block_an_ambiguous_owned_runtime() {
        for (service, driver) in [("PRESENT", "ABSENT"), ("ABSENT", "PRESENT"),
            ("PRESENT", "PRESENT")]
        {
            let result = parse_host_probe(&host_probe(service, driver, true)).unwrap();
            assert_eq!(result.state, "BLOCKED_SERVICE_NAMESPACE_IN_USE");
            assert!(!result.activation_allowed);
        }
    }

    #[test]
    fn unknown_or_noninteractive_host_evidence_blocks_activation() {
        let result = parse_host_probe(&host_probe("UNKNOWN", "ABSENT", true)).unwrap();
        assert_eq!(result.state, "BLOCKED_SERVICE_PROBE_UNKNOWN");
        assert!(!result.service_namespace_available);
        let result = parse_host_probe(&host_probe("ABSENT", "ABSENT", false)).unwrap();
        assert_eq!(result.state, "BLOCKED_NON_INTERACTIVE_SESSION");
        assert!(!result.activation_allowed);
    }

    #[test]
    fn rejects_fabricated_service_provenance_and_true_ready_fields() {
        let raw = host_probe("ABSENT", "ABSENT", true);
        for (field, value) in [
            ("providerSelected", true), ("trustedDriverLoaded", true),
            ("gameplayVerified", true),
        ] {
            let mut data: serde_json::Value = serde_json::from_str(&raw).unwrap();
            data[field] = serde_json::json!(value);
            assert!(parse_host_probe(&data.to_string()).is_err());
        }
        let mut data: serde_json::Value = serde_json::from_str(&raw).unwrap();
        data["inspectionStatus"] = serde_json::json!("PARTIAL_UNKNOWN");
        assert!(parse_host_probe(&data.to_string()).is_err());
        data["inspectionStatus"] = serde_json::json!("OBSERVED");
        data["serviceRegistration"] = serde_json::json!("RUNNING");
        assert!(parse_host_probe(&data.to_string()).is_err());
    }


    #[test]
    fn private_exclusive_candidate_is_inspected_but_never_selected_or_installable() {
        let c = TempCandidate::new();
        c.populate();
        let path = c.0.join("engine-provenance.json");
        let mut data: serde_json::Value =
            serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
        data["state"] = serde_json::json!(PRIVATE_STATE);
        data["privateCoreBuild"] = serde_json::json!(true);
        data["privateForkHead"] = serde_json::json!("a".repeat(40));
        data["privateForkTree"] = serde_json::json!("b".repeat(40));
        data["privatePatchSha256"] = serde_json::json!("c".repeat(64));
        data["sourceBuildMarker"] =
            serde_json::json!("MIVUBI_PRIVATE_ISOLATION_BUILD");
        data["sourceFilesModified"] = serde_json::json!(PRIVATE_SOURCE_FILES);
        data["canCoexistWithOfficialSandboxie"] = serde_json::json!(false);
        fs::write(&path, serde_json::to_vec(&data).unwrap()).unwrap();
        let valid = inspect_candidate(&c.0).unwrap();
        assert_eq!(valid.state, "CANDIDATE_INTEGRITY_VERIFIED_NOT_INSTALLABLE");
        assert!(!valid.provider_selected && !valid.install_permitted
            && !valid.driver_load_verified);
        data["privatePatchSha256"] = serde_json::json!("not-a-digest");
        fs::write(&path, serde_json::to_vec(&data).unwrap()).unwrap();
        assert!(inspect_candidate(&c.0).is_err());
        data["privatePatchSha256"] = serde_json::json!("c".repeat(64));
        data["privateForkHead"] = serde_json::json!(PINNED_UPSTREAM);
        fs::write(&path, serde_json::to_vec(&data).unwrap()).unwrap();
        assert!(inspect_candidate(&c.0).is_err());
        data["privateForkHead"] = serde_json::json!("a".repeat(40));
        data["privateForkTree"] = serde_json::json!("bad-tree");
        fs::write(&path, serde_json::to_vec(&data).unwrap()).unwrap();
        assert!(inspect_candidate(&c.0).is_err());
        data["privateForkTree"] = serde_json::json!("b".repeat(40));
        data["canCoexistWithOfficialSandboxie"] = serde_json::json!(true);
        fs::write(path, serde_json::to_vec(&data).unwrap()).unwrap();
        assert!(inspect_candidate(&c.0).is_err());
    }

    #[test]
    fn original_upstream_candidate_must_not_claim_private_fork_identity() {
        let c = TempCandidate::new();
        c.populate();
        let path = c.0.join("engine-provenance.json");
        let mut data: serde_json::Value =
            serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
        data["privateCoreBuild"] = serde_json::json!(true);
        fs::write(path, serde_json::to_vec(&data).unwrap()).unwrap();
        assert!(inspect_candidate(&c.0).is_err());
    }

    #[test]
    fn candidate_source_fixture_validates_hashes_but_never_proves_driver_load() {
        let c = TempCandidate::new();
        c.populate();
        let result = inspect_candidate(&c.0).unwrap();
        assert_eq!(result.verified_artifact_count, REQUIRED_FILES.len() as u32);
        assert!(!result.provider_selected && !result.driver_load_verified
            && !result.gameplay_verified && !result.install_permitted);
    }

    #[test]
    fn candidate_checksum_mismatch_is_rejected() {
        let c = TempCandidate::new();
        c.populate();
        fs::write(c.0.join("SbieDrv.sys"), b"tampered binary").unwrap();
        assert!(inspect_candidate(&c.0).is_err());
    }

    #[test]
    fn candidate_missing_license_is_rejected() {
        let c = TempCandidate::new();
        c.populate();
        fs::remove_file(c.0.join("LICENSES/Sandboxie/COPYING")).unwrap();
        assert!(inspect_candidate(&c.0).is_err());
    }

    #[test]
    fn candidate_runtime_claim_is_rejected() {
        let c = TempCandidate::new();
        c.populate();
        let path = c.0.join("engine-provenance.json");
        let mut manifest: serde_json::Value = serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
        manifest["windowsKernelDriverLoaded"] = true.into();
        fs::write(path, serde_json::to_vec(&manifest).unwrap()).unwrap();
        assert!(inspect_candidate(&c.0).is_err());
    }
}
