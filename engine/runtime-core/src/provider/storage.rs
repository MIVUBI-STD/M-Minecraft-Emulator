use crate::{client::ClientId, paths::staging_root};
use std::{ffi::OsStr, fs, io, path::Path};

pub(crate) fn vm_container(vmx: &Path) -> io::Result<&Path> {
    vmx.parent().ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "VMX has no parent directory"))
}

pub(crate) fn ensure_parent(path: &Path) -> io::Result<()> {
    fs::create_dir_all(vm_container(path)?)
}

pub(crate) fn remove_vm_container(path: &Path) -> io::Result<()> {
    let container = vm_container(path)?;
    if container.exists() { fs::remove_dir_all(container)?; }
    Ok(())
}

pub(crate) fn promote_staging_vm(staging_vmx: &Path, final_vmx: &Path) -> io::Result<()> {
    if !staging_vmx.is_file() {
        return Err(io::Error::new(io::ErrorKind::InvalidData, "provider reported clone success but staged VMX is missing"));
    }
    let staging = vm_container(staging_vmx)?;
    let final_dir = vm_container(final_vmx)?;
    if final_dir.exists() {
        return Err(io::Error::new(io::ErrorKind::AlreadyExists, format!("client destination already exists: {}", final_dir.display())));
    }
    let parent = final_dir.parent().ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "client path has no parent"))?;
    fs::create_dir_all(parent)?;
    fs::rename(staging, final_dir)
}

// Filesystem-only cutover primitive. The caller must stage a complete VM,
// including its client-profile.json, and verify VMware disk references first.
// Retain backup on success for explicit recovery; never delete it implicitly.
#[allow(dead_code)]
pub(crate) fn cutover_staged_vm(
    staged_vmx: &Path,
    final_vmx: &Path,
    backup_dir: &Path,
) -> io::Result<()> {
    cutover_staged_vm_with_rename(staged_vmx, final_vmx, backup_dir, fs::rename)
}

// Rename injection belongs to the existing filesystem owner, not a new
// lifecycle manager. It proves recovery when promotion fails after backup.
fn cutover_staged_vm_with_rename(
    staged_vmx: &Path,
    final_vmx: &Path,
    backup_dir: &Path,
    mut rename: impl FnMut(&Path, &Path) -> io::Result<()>,
) -> io::Result<()> {
    let staged_dir = vm_container(staged_vmx)?;
    let final_dir = vm_container(final_vmx)?;
    if !staged_vmx.is_file() || !staged_dir.join("client-profile.json").is_file() {
        return Err(io::Error::new(io::ErrorKind::InvalidData,
            "staged VM and its client profile must both exist before cutover"));
    }
    if !final_vmx.is_file() || !final_dir.join("client-profile.json").is_file() {
        return Err(io::Error::new(io::ErrorKind::InvalidData,
            "original VM and its client profile must both exist before cutover"));
    }
    if backup_dir.exists() {
        return Err(io::Error::new(io::ErrorKind::AlreadyExists,
            "recovery backup already exists; manual reconciliation required"));
    }
    if staged_dir.parent() != final_dir.parent() {
        return Err(io::Error::new(io::ErrorKind::InvalidInput,
            "staged and final VM directories must share a filesystem parent"));
    }
    if backup_dir.parent() != final_dir.parent() {
        return Err(io::Error::new(io::ErrorKind::InvalidInput,
            "recovery backup must be beside the original VM"));
    }
    rename(final_dir, backup_dir)?;
    if let Err(error) = rename(staged_dir, final_dir) {
        // Do not hide recovery failure: backup is intentionally preserved.
        match rename(backup_dir, final_dir) {
            Ok(()) => return Err(io::Error::new(error.kind(),
                format!("replacement promotion failed; original restored: {error}"))),
            Err(restore_error) => return Err(io::Error::new(error.kind(),
                format!("replacement promotion failed ({error}); original remains at recovery location, automatic restoration failed ({restore_error})"))),
        }
    }
    Ok(())
}

// Conservative read-only preflight for VMware linked-clone movement. A
// relative VMDK parent is resolved from its descriptor directory; moving the
// clone can change the target even when both moves succeed. This intentionally
// rejects ambiguity rather than rewriting VMware disk metadata.
#[allow(dead_code)]
pub(crate) fn validate_linked_disk_move(
    descriptor: &Path,
    destination_dir: &Path,
) -> io::Result<()> {
    let source_dir = descriptor.parent().ok_or_else(|| io::Error::new(
        io::ErrorKind::InvalidInput, "descriptor has no parent directory"))?;
    let data = fs::read_to_string(descriptor)?;
    let parent_lines: Vec<&str> = data.lines().map(str::trim)
        .filter(|line| line.starts_with("parentFileNameHint=")
            || line.starts_with("parentFileNameHint ="))
        .collect();
    if parent_lines.len() != 1 {
        return Err(io::Error::new(io::ErrorKind::InvalidData,
            "linked VMDK must have exactly one parentFileNameHint"));
    }
    let hint = parent_lines[0].split_once('=')
        .map(|(_, value)| value.trim().trim_matches('"'))
        .filter(|value| !value.is_empty())
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData,
            "linked VMDK parent path is missing"))?;
    let hint_path = Path::new(hint);
    // A parent with an absolute path may survive directory movement, but
    // validating the referenced disk chain still requires VMware execution.
    let before = if hint_path.is_absolute() {
        hint_path.to_path_buf()
    } else {
        source_dir.join(hint_path)
    };
    let after = if hint_path.is_absolute() {
        hint_path.to_path_buf()
    } else {
        destination_dir.join(hint_path)
    };
    if before != after {
        // Use canonical paths only when both files actually exist, and still
        // require independent VMware disk-chain validation before activation.
        let same = fs::canonicalize(&before).ok()
            .zip(fs::canonicalize(&after).ok())
            .is_some_and(|(left, right)| left == right);
        if !same {
            return Err(io::Error::new(io::ErrorKind::InvalidData,
                "moving linked VMDK changes its parent disk path; candidate must not be promoted"));
        }
    }
    if !before.is_file() {
        return Err(io::Error::new(io::ErrorKind::NotFound,
            "linked VMDK parent descriptor does not exist"));
    }
    Ok(())
}

pub(crate) fn has_suspend_state(vmx: &Path) -> bool {
    let Ok(container) = vm_container(vmx) else { return false; };
    let Ok(entries) = fs::read_dir(container) else { return false; };
    entries.flatten().any(|entry| {
        entry.path().extension().and_then(OsStr::to_str).is_some_and(|extension| extension.eq_ignore_ascii_case("vmss"))
    })
}

pub(crate) fn staging_residue_count() -> io::Result<usize> {
    let staging = staging_root()?;
    if !staging.exists() { return Ok(0); }
    Ok(fs::read_dir(staging)?.filter_map(Result::ok).count())
}

pub(crate) fn cleanup_staging() -> io::Result<()> {
    cleanup_staging_at(&staging_root()?)
}

fn cleanup_staging_at(staging: &Path) -> io::Result<()> {
    if !staging.exists() { return Ok(()); }
    // Clone failures may leave disks in an indeterminate state. Never
    // recursively delete those artifacts just because a new operation started.
    if fs::read_dir(&staging)?.next().transpose()?.is_some() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "staging contains unresolved VM artifacts; inspect and clear them manually before provisioning",
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::cleanup_staging_at;
    use std::{fs, io, time::{SystemTime, UNIX_EPOCH}};

    #[test]
    fn cutover_keeps_original_backup_with_profile() {
        let root = std::env::temp_dir().join(format!("vc-cutover-{}-{}", std::process::id(),
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
        let old = root.join("Virtual-01");
        let stage = root.join("Virtual-01-new");
        let backup = root.join("Virtual-01-backup");
        fs::create_dir_all(&old).unwrap();
        fs::create_dir_all(&stage).unwrap();
        for (dir, value) in [(&old, "original"), (&stage, "replacement")] {
            fs::write(dir.join("Virtual-01.vmx"), value).unwrap();
            fs::write(dir.join("client-profile.json"), value).unwrap();
        }
        super::cutover_staged_vm(&stage.join("Virtual-01.vmx"), &old.join("Virtual-01.vmx"), &backup).unwrap();
        assert_eq!(fs::read_to_string(old.join("client-profile.json")).unwrap(), "replacement");
        assert_eq!(fs::read_to_string(backup.join("client-profile.json")).unwrap(), "original");
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn failed_promotion_restores_original_vm_and_profile() {
        let root = std::env::temp_dir().join(format!("vc-cutover-fault-{}-{}", std::process::id(),
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
        let old = root.join("Virtual-01");
        let stage = root.join("Virtual-01-new");
        let backup = root.join("Virtual-01-backup");
        fs::create_dir_all(&old).unwrap();
        fs::create_dir_all(&stage).unwrap();
        for (dir, value) in [(&old, "old"), (&stage, "new")] {
            fs::write(dir.join("Virtual-01.vmx"), value).unwrap();
            fs::write(dir.join("client-profile.json"), value).unwrap();
        }
        let mut calls = 0;
        let error = super::cutover_staged_vm_with_rename(
            &stage.join("Virtual-01.vmx"),
            &old.join("Virtual-01.vmx"),
            &backup,
            |from, to| {
                calls += 1;
                if calls == 2 {
                    Err(io::Error::new(io::ErrorKind::PermissionDenied, "injected promotion failure"))
                } else {
                    fs::rename(from, to)
                }
            },
        ).unwrap_err();
        assert_eq!(error.kind(), io::ErrorKind::PermissionDenied);
        assert_eq!(calls, 3);
        assert!(error.to_string().contains("original restored"));
        assert_eq!(fs::read_to_string(old.join("Virtual-01.vmx")).unwrap(), "old");
        assert_eq!(fs::read_to_string(old.join("client-profile.json")).unwrap(), "old");
        assert_eq!(fs::read_to_string(stage.join("client-profile.json")).unwrap(), "new");
        assert!(!backup.exists());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn cutover_rejects_invalid_staging_without_touching_original() {
        let root = std::env::temp_dir().join(format!("vc-cutover-invalid-{}-{}", std::process::id(),
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
        let old = root.join("Virtual-01");
        let stage = root.join("candidate");
        let backup = root.join("backup");
        fs::create_dir_all(&old).unwrap();
        fs::create_dir_all(&stage).unwrap();
        fs::write(old.join("Virtual-01.vmx"), "old").unwrap();
        fs::write(old.join("client-profile.json"), "old-profile").unwrap();
        fs::write(stage.join("Virtual-01.vmx"), "new").unwrap();
        assert!(super::cutover_staged_vm(&stage.join("Virtual-01.vmx"), &old.join("Virtual-01.vmx"), &backup).is_err());
        assert_eq!(fs::read_to_string(old.join("client-profile.json")).unwrap(), "old-profile");
        assert!(!backup.exists());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn relative_linked_disk_parent_move_is_rejected() {
        let root = std::env::temp_dir().join(format!("vc-linked-{}-{}", std::process::id(),
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
        let stage = root.join("stage");
        let parent = root.join("parent.vmdk");
        fs::create_dir_all(&stage).unwrap();
        fs::write(&parent, "parent").unwrap();
        let descriptor = stage.join("disk.vmdk");
        fs::write(&descriptor, "parentFileNameHint=\"../parent.vmdk\"\n").unwrap();
        let result = super::validate_linked_disk_move(&descriptor, &root.join("elsewhere").join("candidate"));
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("changes its parent disk path"));
        assert_eq!(fs::read_to_string(parent).unwrap(), "parent");
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn missing_linked_disk_parent_is_rejected() {
        let root = std::env::temp_dir().join(format!("vc-linked-missing-{}-{}", std::process::id(),
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
        fs::create_dir_all(&root).unwrap();
        let descriptor = root.join("disk.vmdk");
        fs::write(&descriptor, "parentFileNameHint=\"missing.vmdk\"\n").unwrap();
        assert!(super::validate_linked_disk_move(&descriptor, &root).is_err());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn unresolved_staging_is_preserved() {
        let suffix = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let root = std::env::temp_dir().join(format!("virtual-clients-staging-{}-{suffix}", std::process::id()));
        let artifact = root.join("Virtual-01").join("Virtual-01.vmx");
        fs::create_dir_all(artifact.parent().unwrap()).unwrap();
        fs::write(&artifact, b"partial clone").unwrap();
        let error = cleanup_staging_at(&root).expect_err("residue must block cleanup");
        assert_eq!(error.kind(), io::ErrorKind::InvalidData);
        assert_eq!(fs::read(&artifact).unwrap(), b"partial clone");
        fs::remove_dir_all(root).unwrap();
    }
}
