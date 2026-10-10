# Contributing

`Local` is the development branch; `main` is stable/release-only.

For every change, follow `AGENTS.md` and `GITHUB_RULES.md`. Locate one canonical owner and identify its consumers. Prefer changes that preserve public contracts and guest disks. Avoid speculative managers, broad renames, compatibility aliases without consumers, and unbounded VM retries.

**Check hierarchy:** repository static layout → focused source tests → cross-platform Rust/desktop checks → installer/package smoke → real Windows/VMware → Minecraft Education → four-client acceptance.

Use focused logical commits such as `fix(runtime): ...`, `feat(desktop): ...`, `test(guest): ...`, or `docs(acceptance): ...`. Source tests and machine acceptance are different proof levels. Never claim one from the other.

Do not commit runtime data, VM images, Microsoft sessions, Minecraft account details, world files, signing keys, log captures, downloaded installers or build outputs.

No automatic GitHub Actions workflows or deployment. Test commands are documented in `docs/system/development-operations.md` and are optional higher-level verification when actual execution is available; ChatGPT source-only tasks use GitHub directly.
