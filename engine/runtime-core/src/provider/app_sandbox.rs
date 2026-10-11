//! Read-only App Sandbox v0.1.9 inspection for explicit CLI diagnostics.
//! This is NOT a second provider, lifecycle authority, or Minecraft readiness probe.
//! Never send mutations, copy tokens to logs, or infer GPU/render compatibility.
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, fs, io::Read, path::Path, time::Duration};

const MAX_DISCOVERY_BYTES: u64 = 4096;
const MAX_API_BYTES: u64 = 256 * 1024;
const EXPECTED_PRODUCT_VERSION: &str = "0.1.9";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AppSandboxInspection {
    pub state: &'static str,
    pub reason: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<HostCapacity>,
    pub guests: Vec<GuestObservation>,
    pub game_and_gpu_verified: bool,
}

impl AppSandboxInspection {
    fn unavailable(reason: &'static str) -> Self {
        Self {
            state: "UNVERIFIED",
            reason,
            version: None,
            host: None,
            guests: Vec::new(),
            game_and_gpu_verified: false,
        }
    }
}

#[derive(Debug, Deserialize)]
struct Discovery {
    endpoint: String,
    port: u16,
    token: String,
    pid: u32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Version {
    product: String,
    version: String,
    api_version: String,
    host_os: String,
    capabilities: Capabilities,
}

#[derive(Debug, Deserialize)]
struct Capabilities {
    snapshots: bool,
    templates: bool,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HostCapacity {
    host_cores: u64,
    host_ram_mb: u64,
    free_gb: u64,
    vm_cores: u64,
    vm_ram_mb: u64,
    vm_hdd_gb: u64,
}

#[derive(Debug, Deserialize)]
struct VmList {
    // Other users may have Linux VMs with longer hostnames or different
    // device modes. Only parse full state for OUR three canonical names.
    vms: Vec<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VmState {
    name: String,
    os_type: String,
    state: String,
    running: bool,
    agent_online: bool,
    install_complete: bool,
    building: bool,
    ram_mb: u64,
    cpu_cores: u64,
    gpu_mode: u8,
    network_mode: u8,
    display_open: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct GuestObservation {
    name: String,
    state: String,
    running: bool,
    agent_online: bool,
    display_open: bool,
    ram_mb: u64,
    cpu_cores: u64,
    gpu_mode: u8,
    network_mode: u8,
    ownership_verified: bool,
}

fn parse_discovery(data: &[u8]) -> Result<Discovery, &'static str> {
    let entry: Discovery =
        serde_json::from_slice(data).map_err(|_| "INVALID_DISCOVERY")?;
    let expected = format!("http://127.0.0.1:{}", entry.port);
    if entry.port == 0
        || entry.endpoint != expected
        || entry.pid == 0
        || entry.token.len() != 40
        || !entry.token.bytes().all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
    {
        return Err("INVALID_DISCOVERY");
    }
    Ok(entry)
}

fn parse_version(data: &[u8]) -> Result<Version, &'static str> {
    let info: Version =
        serde_json::from_slice(data).map_err(|_| "INVALID_PROVIDER_RESPONSE")?;
    if info.product != "AppSandbox"
        || info.version != EXPECTED_PRODUCT_VERSION
        || info.api_version != "v1"
        || info.host_os != "Windows"
        || !info.capabilities.snapshots
        || !info.capabilities.templates
    {
        return Err("PROVIDER_INCOMPATIBLE");
    }
    Ok(info)
}

fn parse_host(data: &[u8]) -> Result<HostCapacity, &'static str> {
    let host: HostCapacity =
        serde_json::from_slice(data).map_err(|_| "INVALID_PROVIDER_RESPONSE")?;
    if host.host_cores == 0 || host.host_ram_mb == 0 {
        return Err("INVALID_PROVIDER_RESPONSE");
    }
    Ok(host)
}

fn parse_vm(data: &[u8]) -> Result<VmState, &'static str> {
    let vm: VmState =
        serde_json::from_slice(data).map_err(|_| "INVALID_PROVIDER_RESPONSE")?;
    if vm.name.is_empty()
        || vm.name.len() > 15
        || !vm.name.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
        || vm.cpu_cores == 0
        || vm.ram_mb < 512
        || vm.gpu_mode > 1
        || vm.network_mode > 3
        || !matches!(
            vm.state.as_str(),
            "building" | "stopped" | "installing" | "booting" | "online" | "stopping"
        )
    {
        return Err("INVALID_PROVIDER_RESPONSE");
    }
    // Validate invariants observed in src/app_win/headless.c::derive_state.
    let consistent = match vm.state.as_str() {
        "building" => vm.building,
        "stopped" => !vm.running && !vm.building,
        "installing" => vm.running && !vm.install_complete && !vm.building,
        "booting" => vm.running && vm.install_complete && !vm.agent_online && !vm.building,
        "online" => vm.running && vm.install_complete && vm.agent_online && !vm.building,
        "stopping" => vm.running && !vm.building,
        _ => false,
    };
    if !consistent {
        return Err("INVALID_PROVIDER_RESPONSE");
    }
    Ok(vm)
}

fn parse_vm_list(data: &[u8]) -> Result<Vec<VmState>, &'static str> {
    let raw: VmList = serde_json::from_slice(data).map_err(|_| "INVALID_PROVIDER_RESPONSE")?;
    if raw.vms.len() > 128 {
        return Err("INVALID_PROVIDER_RESPONSE");
    }
    let mut names = HashSet::new();
    let mut values = Vec::with_capacity(raw.vms.len());
    for record in raw.vms {
        let name = record.get("name").and_then(serde_json::Value::as_str)
            .ok_or("INVALID_PROVIDER_RESPONSE")?;
        if name.is_empty() || !names.insert(name.to_ascii_lowercase()) {
            return Err("INVALID_PROVIDER_RESPONSE");
        }
        if is_tracked_guest(name) {
            // Validate tracked guests as strictly as the named status route.
            let encoded = serde_json::to_vec(&record).map_err(|_| "INVALID_PROVIDER_RESPONSE")?;
            values.push(parse_vm(&encoded)?);
        }
    }
    Ok(values)
}

fn is_tracked_guest(name: &str) -> bool {
    matches!(name, "Virtual-01" | "Virtual-02" | "Virtual-03")
}

fn read_discovery_at(path: &Path) -> Result<Discovery, &'static str> {
    let metadata = fs::symlink_metadata(path).map_err(|_| "DISCOVERY_UNAVAILABLE")?;
    if !metadata.file_type().is_file() || metadata.len() > MAX_DISCOVERY_BYTES {
        return Err("INVALID_DISCOVERY");
    }
    let data = fs::read(path).map_err(|_| "DISCOVERY_UNAVAILABLE")?;
    if data.len() as u64 > MAX_DISCOVERY_BYTES {
        return Err("INVALID_DISCOVERY");
    }
    parse_discovery(&data)
}

#[cfg(target_os = "windows")]
fn discover() -> Result<Discovery, &'static str> {
    let root = std::env::var_os("ProgramData").ok_or("DISCOVERY_UNAVAILABLE")?;
    let root = Path::new(&root);
    if !root.is_absolute() {
        return Err("INVALID_DISCOVERY");
    }
    // Do not follow a redirected AppSandbox directory or host.json file.
    let folder = root.join("AppSandbox");
    if fs::symlink_metadata(&folder)
        .map_err(|_| "DISCOVERY_UNAVAILABLE")?
        .file_type()
        .is_symlink()
    {
        return Err("INVALID_DISCOVERY");
    }
    read_discovery_at(&folder.join("host.json"))
}

#[cfg(not(target_os = "windows"))]
fn discover() -> Result<Discovery, &'static str> {
    Err("WINDOWS_HOST_REQUIRED")
}

fn get_json(agent: &ureq::Agent, endpoint: &str, route: &str, token: Option<&str>)
    -> Result<Vec<u8>, &'static str>
{
    let url = format!("{endpoint}/v1/{route}");
    let mut request = agent.get(&url);
    if let Some(token) = token {
        let authorization = format!("Bearer {token}");
        request = request.set("Authorization", &authorization);
    }
    let response = match request.call() {
        Ok(response) => response,
        Err(ureq::Error::Status(401, _)) => return Err("PROVIDER_AUTH_FAILED"),
        Err(ureq::Error::Status(404, _)) => return Err("VM_NOT_FOUND"),
        Err(ureq::Error::Status(_, _)) => return Err("PROVIDER_HTTP_ERROR"),
        Err(ureq::Error::Transport(_)) => return Err("PROVIDER_UNREACHABLE"),
    };
    if response.status() != 200 {
        return Err("PROVIDER_HTTP_ERROR");
    }
    let mut bytes = Vec::new();
    response
        .into_reader()
        .take(MAX_API_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| "PROVIDER_UNREACHABLE")?;
    if bytes.len() as u64 > MAX_API_BYTES {
        return Err("INVALID_PROVIDER_RESPONSE");
    }
    Ok(bytes)
}

fn inspect_inner() -> Result<AppSandboxInspection, &'static str> {
    let discovery = discover()?;
    let agent = ureq::AgentBuilder::new()
        .try_proxy_from_env(false)
        .redirects(0)
        .timeout_connect(Duration::from_secs(2))
        .timeout_read(Duration::from_secs(3))
        .timeout_write(Duration::from_secs(3))
        .build();
    let version_bytes = get_json(&agent, &discovery.endpoint, "version", None)?;
    let version = parse_version(&version_bytes)?;
    let host_bytes = get_json(&agent, &discovery.endpoint, "host", Some(&discovery.token))?;
    let host = parse_host(&host_bytes)?;
    let list_bytes = get_json(&agent, &discovery.endpoint, "vms", Some(&discovery.token))?;
    let records = parse_vm_list(&list_bytes)?;
    let mut guests = Vec::new();
    for item in records {
        if !is_tracked_guest(&item.name) {
            continue;
        }
        let route = format!("vms/{}", item.name);
        let status_bytes = get_json(&agent, &discovery.endpoint, &route, Some(&discovery.token))?;
        let status = parse_vm(&status_bytes)?;
        if status.name != item.name || status.os_type != "Windows" {
            return Err("INVALID_PROVIDER_RESPONSE");
        }
        // VM names are observations, not trusted bindings to our account disks.
        guests.push(GuestObservation {
            name: status.name,
            state: status.state,
            running: status.running,
            agent_online: status.agent_online,
            display_open: status.display_open,
            ram_mb: status.ram_mb,
            cpu_cores: status.cpu_cores,
            gpu_mode: status.gpu_mode,
            network_mode: status.network_mode,
            ownership_verified: false,
        });
    }
    Ok(AppSandboxInspection {
        state: "OBSERVED",
        reason: "VM_API_ONLY_NO_GAME_OR_GPU_PROOF",
        version: Some(version.version),
        host: Some(host),
        guests,
        game_and_gpu_verified: false,
    })
}

/// Explicit one-shot diagnostic; never used by normal UI snapshot polling.
pub(crate) fn inspect() -> AppSandboxInspection {
    match inspect_inner() {
        Ok(report) => report,
        Err(reason) => AppSandboxInspection::unavailable(reason),
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_discovery, parse_host, parse_version, parse_vm, parse_vm_list};
    use serde_json::json;

    #[test]
    fn discovery_is_literal_loopback_with_a_distinct_40_hex_token() {
        let valid = json!({"endpoint":"http://127.0.0.1:8787","port":8787,"pid":412,"token":"a".repeat(40)});
        assert!(parse_discovery(&serde_json::to_vec(&valid).unwrap()).is_ok());
        for altered in [
            json!({"endpoint":"http://localhost:8787","port":8787,"pid":412,"token":"a".repeat(40)}),
            json!({"endpoint":"http://127.0.0.1:8788","port":8787,"pid":412,"token":"a".repeat(40)}),
            json!({"endpoint":"http://127.0.0.1:8787/evil","port":8787,"pid":412,"token":"a".repeat(40)}),
            json!({"endpoint":"http://127.0.0.1:8787","port":8787,"pid":412,"token":"z".repeat(40)}),
            json!({"endpoint":"http://127.0.0.1:8787","port":8787,"pid":412,"token":"a".repeat(64)}),
        ] {
            assert!(parse_discovery(&serde_json::to_vec(&altered).unwrap()).is_err());
        }
    }

    #[test]
    fn version_pinned_and_host_requires_positive_capacity() {
        let v = json!({"product":"AppSandbox","version":"0.1.9","apiVersion":"v1","hostOs":"Windows","capabilities":{"snapshots":true,"templates":true}});
        assert!(parse_version(&serde_json::to_vec(&v).unwrap()).is_ok());
        let mut wrong = v.clone();
        wrong["apiVersion"] = json!("v2");
        assert!(parse_version(&serde_json::to_vec(&wrong).unwrap()).is_err());
        let host = json!({"hostCores":28,"hostRamMb":32768,"freeGb":100,"vmCores":6,"vmRamMb":12288,"vmHddGb":180});
        assert_eq!(parse_host(&serde_json::to_vec(&host).unwrap()).unwrap().vm_ram_mb, 12288);
        let mut bad = host.clone();
        bad["hostCores"] = json!(0);
        assert!(parse_host(&serde_json::to_vec(&bad).unwrap()).is_err());
    }

    fn vm(name: &str) -> serde_json::Value {
        json!({"name":name,"osType":"Windows","state":"online","running":true,"agentOnline":true,"installComplete":true,"building":false,"ramMb":4096,"cpuCores":2,"gpuMode":1,"networkMode":1,"displayOpen":true})
    }

    #[test]
    fn vm_states_and_duplicate_names_are_not_silently_accepted() {
        let record = vm("Virtual-01");
        assert!(parse_vm(&serde_json::to_vec(&record).unwrap()).is_ok());
        let mut bad = record.clone();
        bad["state"] = json!("online");
        bad["agentOnline"] = json!(false);
        assert!(parse_vm(&serde_json::to_vec(&bad).unwrap()).is_err());
        let mut bad = record.clone();
        bad["gpuMode"] = json!(2);
        assert!(parse_vm(&serde_json::to_vec(&bad).unwrap()).is_err());
        let list = json!({"vms":[vm("Virtual-01"),vm("Virtual-02"),vm("Virtual-03")]});
        assert_eq!(parse_vm_list(&serde_json::to_vec(&list).unwrap()).unwrap().len(), 3);
        let duplicates = json!({"vms":[vm("Virtual-01"),vm("virtual-01")]});
        assert!(parse_vm_list(&serde_json::to_vec(&duplicates).unwrap()).is_err());
        // Linux guests with 63-character names are unrelated to our Windows
        // sessions; they must not make the read-only inventory fail.
        let foreign = json!({"vms":[vm("Virtual-01"),{"name":"unrelated-linux-guest-with-a-long-hostname-okay","osType":"Linux","state":"online","gpuMode":2}]});
        assert_eq!(parse_vm_list(&serde_json::to_vec(&foreign).unwrap()).unwrap().len(), 1);
    }

    #[test]
    fn no_minecraft_or_gpu_playability_promise_is_serialized() {
        let report = super::AppSandboxInspection::unavailable("PROVIDER_UNREACHABLE");
        let output = serde_json::to_value(report).unwrap();
        assert_eq!(output["state"], "UNVERIFIED");
        assert_eq!(output["gameAndGpuVerified"], false);
        assert!(output.get("token").is_none());
    }
}
