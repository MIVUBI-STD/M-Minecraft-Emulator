# Security

## Trust boundaries

This project touches host VMware operations, per-guest Windows systems, Microsoft sign-in, signed release assets and local support evidence.

- Never check in credentials, Microsoft tokens, session cookies, signing material, live Guest Agent tokens, VM disks, account-bearing snapshots or private world data.
- Native Minecraft/guest Minecraft identity is validated through bounded status/provenance; account login and MFA stay manual in the appropriate guest session.
- Per-guest authenticated Guest Agent actions must stay bounded to declared operations. Do not introduce unauthenticated remote control or a general network command execution API.
- Treat provider state and ambiguous mutation outcomes as authoritative uncertainty; do not blindly replay lifecycle/destructive operations.
- Runtime data and guest account state persist across normal stop/start. Reprovision is destructive and explicitly gated.
- Release updates must remain staged, signature/hash verified and **not self-applied** until an approved implementation and target-machine proof exist.
- Support and acceptance diagnostics must be privacy-bounded. Do not commit machine fingerprints, account names or personal data.

Security improvements need source-owner tests when possible and real-machine validation where Windows ACL, firewall, scheduled tasks, VMware and signing properties are relevant. See `virtual-clients/docs/static-readiness-freeze.md`.
