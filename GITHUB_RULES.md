# GitHub Delivery Rules — M-Minecraft-Emulator

**Working authority:** `Local`. **Release authority:** `main`.

## Operating sequence

```text
PIN → READ OWNER → CLASSIFY EVIDENCE → DIAGNOSE → CHANGE ONCE → VERIFY → COMMIT/HANDOFF → STOP
```

### Pin

Read the exact target repository/branch HEAD; identify the first canonical owner and its callers before writing. GitHub file responses are code authority. Historical commits and discussions are research, not current source truth.

### Execution boundary

- `REMOTE_GITHUB`: source inspection, static contract reasoning, commits, repository integrity review. Complete these independently of a user PC.
- `SOURCE_EXECUTION`: actually executed build, formatter, unit/integration tests.
- `PACKAGE_EXECUTION`: constructed/inspected Windows installer and its required bundled files.
- `TARGET_WINDOWS`: guest OS, VMware, authentication session, window, GPU and VM lifecycle observations.
- `MINECRAFT_RUNTIME`: verified Minecraft Education usability, sign-in, network and gameplay.
- `FOUR_CLIENT_ACCEPTANCE`: one native + three virtual Minecraft clients meet the full acceptance matrix.

Never inflate evidence from a lower level. Existing test source does not equal a passing test run.

### Write/verify

Make the smallest complete change in the existing domain owner, without duplicate state. Changes must preserve VM disk/snapshot state by default; destructive reprovision always requires explicit confirmation. Use exact-head source checks where possible. Prefer targeted tests over full workflows.

CI is **manual-only, last resort**. Do not add push, pull_request or scheduled triggers. Do not run an Action automatically for source-reviewable work; do not gate ChatGPT GitHub work on the user installing anything locally. Do not publish to `main`, create a release, trigger a signing workflow, or change release identity without separate authorization.

### Safety

Treat Guest Agent tokens, Microsoft account sessions, VM images, host IDs, collected diagnostics, private worlds, signer keys and signing credentials as sensitive. Never commit them. Avoid shell arguments that interpolate user-controlled content; bound provider operations and ambiguous outcomes fail closed.

### Commit/handoff

After an update: report exact branch, commit, changed owners, evidence actually obtained, unexecuted tests and next single relevant task. Keep continuation in `planning/development.md`; do not duplicate it in `CONTEXT.md`.

### STOP

Stop after the requested bounded outcome. Source completeness does not authorize speculative feature growth or untested platform changes.
