# Developer and Acceptance Tooling

| Folder | Responsibility |
| --- | --- |
| [`repository/`](./repository/) | Static structure, dependency and cross-file contract verifier |
| [`windows-toolchain/`](./windows-toolchain/) | Optional Windows developer command dispatcher used by root `DEV.cmd` |
| [`acceptance/windows/`](./acceptance/windows/) | Privacy-bounded target-machine evidence collection; not gameplay proof by itself |

Executable VM lifecycle, update trust and guest behavior remain in `../engine/`. Tooling is not a parallel state authority.
