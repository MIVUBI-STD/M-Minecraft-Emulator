# Developer and Acceptance Tooling

| Folder | Responsibility |
| --- | --- |
| [`repository/`](./repository/) | Static structure, dependency and cross-file contract verifier |
| [`windows-toolchain/`](./windows-toolchain/) | Optional Windows developer command dispatcher used by root `DEV.cmd` |
| [`acceptance/windows/`](./acceptance/windows/) | Windows VMware guest boot + Education install/login + gameplay proof **first**, before three-VM provisioning |
| [`acceptance/evaluate-client-feasibility.mjs`](./acceptance/evaluate-client-feasibility.mjs) | Fail-closed interpretation of operator-declared gameplay and guest diagnostics; never official-support proof |

Executable VM lifecycle, update trust and guest behavior remain in `../engine/`. Tooling is not a parallel state authority.
