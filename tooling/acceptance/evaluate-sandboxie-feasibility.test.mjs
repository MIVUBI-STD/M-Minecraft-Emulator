import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSandboxieFeasibility } from "./evaluate-sandboxie-feasibility.mjs";

const sample = () => ({
  schema: 1,
  scope: "SANDBOXIE_TWO_CLIENT_FEASIBILITY",
  stage: "TWO_CLIENT",
  evidenceOrigin: "WINDOWS_HOST",
  automaticVerdict: "NOT_PROVIDED",
  sandboxie: {
    toolsPresent: true,
    toolSignaturesValid: true,
    serviceRunning: true,
    boxConfigured: "YES",
    autoDelete: "OFF",
    autoRemove: "OFF",
    membershipStatus: "OBSERVED"
  },
  machine: {
    interactiveSession: true,
    processEvidenceClass: "NAME_MATCH_CANDIDATE_ONLY",
    candidateProcesses: [
      { pid: 101, windowHandle: "0x100", inSelectedBox: false },
      { pid: 202, windowHandle: "0x200", inSelectedBox: true }
    ]
  },
  operator: {
    attribution: "OPERATOR_DECLARED_NOT_MACHINE_VERIFIED",
    licensedForUse: "YES",
    nativeWorldPlayable: "YES",
    sandboxWorldPlayable: "YES",
    distinctAccounts: "YES",
    independentInput: "YES",
    accountCrossingObserved: "NO",
    reopenAndRebootPersistent: "YES",
    multiplayerJoined: "UNKNOWN",
    observedMinutes: 10,
    evidenceReference: "sandbox-session-001"
  }
});

test("positive operator claims never become independently verified Microsoft sessions", () => {
  const result = evaluateSandboxieFeasibility(sample());
  assert.equal(result.verdict, "OPERATOR_REPORTED_COMPATIBLE");
  assert.equal(result.nativeVisibleCandidates, 1);
  assert.equal(result.isolatedVisibleCandidates, 1);
  assert.equal(result.automatedAccountProof, false);
  assert.equal(result.automatedGameProof, false);
  assert.equal(result.productionFourClientReady, false);
  assert.ok(result.risks.includes("MULTIPLAYER_NOT_CONFIRMED"));
});

test("inspecting the box without game observations is inconclusive", () => {
  const r = sample();
  r.stage = "INSPECT";
  for (const k of ["licensedForUse", "nativeWorldPlayable", "sandboxWorldPlayable",
    "distinctAccounts", "independentInput", "accountCrossingObserved",
    "reopenAndRebootPersistent", "multiplayerJoined"]) {
    r.operator[k] = "UNKNOWN";
  }
  r.operator.observedMinutes = 0;
  r.operator.evidenceReference = null;
  assert.equal(evaluateSandboxieFeasibility(r).verdict, "INCONCLUSIVE");
});

test("automatic deletion or removal blocks even when operator claims success", () => {
  for (const change of [
    r => r.sandboxie.autoDelete = "ON",
    r => r.sandboxie.autoRemove = "ON",
    r => r.sandboxie.boxConfigured = "NO"
  ]) {
    const r = sample();
    change(r);
    // A disabled box cannot have trustworthy observed PID membership.
    if (r.sandboxie.boxConfigured === "NO") {
      r.sandboxie.membershipStatus = "UNKNOWN";
      for (const p of r.machine.candidateProcesses) p.inSelectedBox = null;
    }
    const result = evaluateSandboxieFeasibility(r);
    assert.equal(result.verdict, "CONFIGURATION_BLOCKED");
  }
});

test("unknown persistence settings never pass as disabled", () => {
  for (const key of ["autoDelete", "autoRemove"]) {
    const r = sample();
    r.sandboxie[key] = "UNKNOWN";
    const result = evaluateSandboxieFeasibility(r);
    assert.equal(result.verdict, "INCONCLUSIVE");
    assert.ok(result.risks.length > 0);
  }
});

test("unknown PID membership and incomplete visible game inventory are inconclusive", () => {
  for (const change of [
    r => {
      r.sandboxie.membershipStatus = "UNKNOWN";
      r.machine.candidateProcesses.forEach(p => p.inSelectedBox = null);
    },
    r => r.machine.candidateProcesses[1].windowHandle = null,
    r => r.machine.candidateProcesses[0].windowHandle = null,
    r => r.machine.candidateProcesses[1].inSelectedBox = false,
    r => r.machine.interactiveSession = false
  ]) {
    const r = sample();
    change(r);
    assert.equal(evaluateSandboxieFeasibility(r).verdict, "INCONCLUSIVE");
  }
});

test("unknown account isolation, license, persistence or observation reference stays inconclusive", () => {
  for (const change of [
    r => r.operator.distinctAccounts = "UNKNOWN",
    r => r.operator.licensedForUse = "UNKNOWN",
    r => r.operator.reopenAndRebootPersistent = "UNKNOWN",
    r => r.operator.observedMinutes = 9,
    r => r.operator.evidenceReference = null
  ]) {
    const r = sample();
    change(r);
    assert.equal(evaluateSandboxieFeasibility(r).verdict, "INCONCLUSIVE");
  }
});

test("explicit cross-account, license, gameplay or persistence failure remains visible", () => {
  for (const change of [
    r => r.operator.accountCrossingObserved = "YES",
    r => r.operator.licensedForUse = "NO",
    r => r.operator.nativeWorldPlayable = "NO",
    r => r.operator.sandboxWorldPlayable = "NO",
    r => r.operator.reopenAndRebootPersistent = "NO"
  ]) {
    const r = sample();
    change(r);
    assert.equal(evaluateSandboxieFeasibility(r).verdict, "OPERATOR_REPORTED_FAILURE");
  }
});

test("untrusted process attribution or invented automatic PASS is rejected", () => {
  for (const change of [
    r => r.scope = "NATIVE_TWO_CLIENT_FEASIBILITY",
    r => r.automaticVerdict = "PASS",
    r => r.machine.processEvidenceClass = "VERIFIED_GAME",
    r => r.operator.attribution = "AUTOMATED",
    r => r.machine.candidateProcesses[1].pid = 101,
    r => r.machine.candidateProcesses[1].windowHandle = "0x100",
    r => r.machine.candidateProcesses[0].windowHandle = "0x0",
    r => r.operator.evidenceReference = "C:\\Accounts\\secret",
    r => r.operator.observedMinutes = 1441,
    r => r.sandboxie.membershipStatus = "UNKNOWN",
    r => r.sandboxie.toolSignaturesValid = false
  ]) {
    const r = sample();
    change(r);
    assert.throws(() => evaluateSandboxieFeasibility(r), TypeError);
  }
});

test("no box membership can be reported with missing tools, service or enabled box", () => {
  for (const change of [
    r => r.sandboxie.toolsPresent = false,
    r => r.sandboxie.serviceRunning = false,
    r => r.sandboxie.boxConfigured = "UNKNOWN"
  ]) {
    const r = sample();
    change(r);
    assert.throws(() => evaluateSandboxieFeasibility(r), TypeError);
  }
});

test("inspection mode rejects user-injected game or licensing assertions", () => {
  const r = sample(); r.stage = "INSPECT";
  assert.throws(() => evaluateSandboxieFeasibility(r), TypeError);
});
