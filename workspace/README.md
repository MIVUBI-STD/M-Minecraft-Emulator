# Local workspace

This is an **untracked machine-local storage area**. Only this README is
versioned. See the canonical [Artifact and Local-Test Storage Policy](../docs/system/artifact-storage.md).

| Local folder (create on demand) | Owner and intent |
| --- | --- |
| `downloads/` | External installer/prerequisite staging; note publisher URL, version and SHA-256 |
| `packages/` | Copies of future **approved** package candidates; not a publishing channel |
| `runs/<UTC>-<shortSHA>-<scenario>/` | `DEV.cmd preflight` writes a metadata-only `manifest.json` after pinned toolchain checks; raw evidence is opt-in only |
| `scratch/` | Disposable research and experiments |
| `private/` | Operator-controlled sensitive material, never publish |
| `evidence/`, `captures/`, `images/`, `runtime/`, `diagnostics/` | Historical local paths: preserve until producers and consumers are reviewed |

Compiled and dependency outputs remain tool-owned: `apps/desktop/node_modules/`,
`apps/desktop/dist/`, Rust/Tauri `target/` and generated Tauri staging directories.
Do not move them for visual consistency.

**The native + Sandboxie feasibility pilot has no approved installer.** Use the
separately authorized `DEV.cmd preflight` and `DEV.cmd dev` routes; do not
unblock the old VMware NSIS package. Never commit Minecraft game binaries,
account profiles/tokens, Windows machine identifiers, guest disks, private
worlds, signing keys, or unredacted logs. Git ignore is not encryption.
