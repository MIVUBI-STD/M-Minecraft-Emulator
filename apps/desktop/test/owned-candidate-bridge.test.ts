import { describe, expect, it } from "vitest";
import { parseOwnedCandidateInspection } from "../src/app/bridge/nativeFeasibilityApi.js";

const OLD = "abd4c240031cfb46666daa74ca47ed4e48b561e4";
const OWNED = "cdba7096240b93d79c5373aa81a75a1c5c71b883";

const candidate = (upstreamCommit: string, count: number) => ({
  schema: 1,
  state: "CANDIDATE_INTEGRITY_VERIFIED_NOT_INSTALLABLE",
  upstreamCommit,
  verifiedArtifactCount: count,
  requiredArtifactCount: count,
  providerSelected: false,
  driverLoadVerified: false,
  gameplayVerified: false,
  installPermitted: false,
});

describe("one Rust owned engine inspection to MIVUBI desktop bridge", () => {
  it("accepts both historical v1.18.5 (24 files) and current owned v1.18.6 (25 files)", () => {
    expect(parseOwnedCandidateInspection(candidate(OLD, 24)).upstreamCommit).toBe(OLD);
    const current = parseOwnedCandidateInspection(candidate(OWNED, 25));
    expect(current.upstreamCommit).toBe(OWNED);
    expect(current.requiredArtifactCount).toBe(25);
    expect(current.providerSelected).toBe(false);
    expect(current.installPermitted).toBe(false);
  });

  it("rejects a swapped version, insufficient license closure and fake readiness", () => {
    const mutate = [
      { upstreamCommit: OLD, requiredArtifactCount: 25 },
      { upstreamCommit: OWNED, verifiedArtifactCount: 24 },
      { upstreamCommit: OWNED, requiredArtifactCount: 24 },
      { upstreamCommit: "a".repeat(40) },
      { installPermitted: true },
      { providerSelected: true },
      { driverLoadVerified: true },
      { gameplayVerified: true },
      { state: "OWNED_ENGINE_READY" },
      { schema: 2 },
    ];
    for (const fields of mutate) {
      expect(() => parseOwnedCandidateInspection({ ...candidate(OWNED, 25), ...fields })).toThrow(TypeError);
    }
  });

  it("rejects extra fields and invalid counts rather than assuming installation", () => {
    for (const input of [
      { ...candidate(OWNED, 25), userAccount: "must not be in this contract" },
      { ...candidate(OWNED, 25), verifiedArtifactCount: -1 },
      { ...candidate(OWNED, 25), verifiedArtifactCount: 24.5 },
      { ...candidate(OWNED, 25), verifiedArtifactCount: 49 },
      { ...candidate(OWNED, 25), verifiedArtifactCount: null },
    ]) {
      expect(() => parseOwnedCandidateInspection(input)).toThrow(TypeError);
    }
  });
});
