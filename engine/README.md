# Emulator Engine

Canonical VM implementation and machine-readable product contracts.

| Owner | Responsibility |
| --- | --- |
| [`runtime-core/`](./runtime-core/) | Rust VM lifecycle, admission/doctor, VMware provider, account-state boundary, version parity, guest transport, updates |
| [`guest/windows/`](./guest/windows/) | Base preparation, finalized-image flow and per-guest Windows Agent installation |
| [`distribution/`](./distribution/) | Installer and release-channel policy, staged update and package integrity contracts |

Runtime source owns executable truth. Human documentation is routed through `../docs/README.md`; Windows acceptance collectors are under `../tooling/acceptance/windows/`.
