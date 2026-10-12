import assert from "node:assert/strict";
import test from "node:test";
import { evaluateNativeFeasibility } from "./evaluate-native-feasibility.mjs";

const sample = () => ({
  schema: 1,
  scope: "NATIVE_TWO_CLIENT_FEASIBILITY",
  stage: "TWO_CLIENT",
  evidenceOrigin: "WINDOWS_HOST",
  automaticVerdict: "NOT_PROVIDED",
  software: {
    desktopVersion: "1.21.120.1",
    storePackagePresent: false,
    uniqueRegisteredStartApp: true
  },
  machine: {
    interactiveSession: true,
    launchRequests: 0,
    processEvidenceClass: "NAME_MATCH_CANDIDATE_ONLY",
    candidateProcesses: [
      { pid: 101, windowHandle: "0x101", workingSetMb: 900 },
      { pid: 202, windowHandle: "0x202", workingSetMb: 950 }
    ]
  },
  operator: {
    attribution: "OPERATOR_DECLARED_NOT_MACHINE_VERIFIED",
    distinctAccounts: "YES",
    bothWorldsPlayable: "YES",
    independentInput: "YES",
    accountCrossingObserved: "NO",
    multiplayerJoined: "UNKNOWN",
    observedMinutes: 10,
    evidenceReference: "local-two-client-001"
  }
});

test("operator reported playability never becomes automated gameplay or account proof", () => {
  const r = evaluateNativeFeasibility(sample());
  assert.equal(r.verdict, "OPERATOR_REPORTED_TWO_CLIENTS");
  assert.equal(r.licensedAccountsVerified, false);
  assert.equal(r.automatedGameplayProof, false);
  assert.equal(r.noVmFeasibilityProven, false);
  assert.ok(r.risks.includes("MULTIPLAYER_NOT_OBSERVED"));
});

test("launch requests do not prove independent processes or playable game", () => {
  const r = sample();
  r.stage = "BASELINE";
  r.machine.launchRequests = 2;
  r.machine.candidateProcesses = [];
  for (const key of ["distinctAccounts", "bothWorldsPlayable", "independentInput",
    "accountCrossingObserved", "multiplayerJoined"]) r.operator[key] = "UNKNOWN";
  r.operator.observedMinutes = 0;
  r.operator.evidenceReference = null;
  assert.equal(evaluateNativeFeasibility(r).verdict, "INCONCLUSIVE");
});

test("missing independent process, visible window or interactive Windows session stays unknown", () => {
  for (const alter of [
    r => r.machine.candidateProcesses.pop(),
    r => r.machine.candidateProcesses[1].windowHandle = null,
    r => r.machine.interactiveSession = false
  ]) {
    const r = sample(); alter(r);
    assert.equal(evaluateNativeFeasibility(r).verdict, "INCONCLUSIVE");
  }
});

test("Store package or ambiguous Desktop registration is not accepted", () => {
  for (const alter of [
    r => r.software.storePackagePresent = true,
    r => r.software.uniqueRegisteredStartApp = false,
    r => r.software.desktopVersion = null
  ]) {
    const r = sample(); alter(r);
    assert.equal(evaluateNativeFeasibility(r).verdict, "INCONCLUSIVE");
  }
});

test("explicit operator game failures stay failures", () => {
  for (const alter of [
    r => r.operator.distinctAccounts = "NO",
    r => r.operator.bothWorldsPlayable = "NO",
    r => r.operator.independentInput = "NO",
    r => r.operator.accountCrossingObserved = "YES"
  ]) {
    const r = sample(); alter(r);
    assert.equal(evaluateNativeFeasibility(r).verdict, "OPERATOR_REPORTED_FAILURE");
  }
});

test("ten observed minutes, clear account evidence and reference are required", () => {
  for (const alter of [
    r => r.operator.observedMinutes = 9,
    r => r.operator.evidenceReference = null,
    r => r.operator.distinctAccounts = "UNKNOWN",
    r => r.operator.accountCrossingObserved = "UNKNOWN"
  ]) {
    const r = sample(); alter(r);
    assert.equal(evaluateNativeFeasibility(r).verdict, "INCONCLUSIVE");
  }
});

test("reject fabricated automatic pass, duplicate identities, unsafe references", () => {
  for (const alter of [
    r => r.automaticVerdict = "PASS",
    r => r.machine.candidateProcesses[1].pid = 101,
    r => r.machine.candidateProcesses[1].windowHandle = "0x101",
    r => r.operator.evidenceReference = "C:\\Users\\private\\world",
    r => r.machine.processEvidenceClass = "VERIFIED_GAME",
    r => r.operator.attribution = "AUTOMATED",
    r => r.operator.observedMinutes = 1441,
    r => r.software.desktopVersion = "fake",
    r => r.machine.candidateProcesses[0].windowHandle = "0x0"
  ]) {
    const r = sample(); alter(r);
    assert.throws(() => evaluateNativeFeasibility(r), TypeError);
  }
});

test("baseline claims and other scopes are rejected", () => {
  const r = sample(); r.stage = "BASELINE";
  assert.throws(() => evaluateNativeFeasibility(r), TypeError);
  const s = sample(); s.scope = "CLIENT_FEASIBILITY";
  assert.throws(() => evaluateNativeFeasibility(s), TypeError);
  const t = sample(); t.machine.launchRequests = 2;
  assert.throws(() => evaluateNativeFeasibility(t), TypeError);
});

test("unknown gameplay stays inconclusive and extra processes are only candidates", () => {
  const r = sample(); r.operator.bothWorldsPlayable = "UNKNOWN";
  assert.equal(evaluateNativeFeasibility(r).verdict, "INCONCLUSIVE");
  const s = sample();
  s.machine.candidateProcesses.push({pid:303,windowHandle:null,workingSetMb:null});
  const result = evaluateNativeFeasibility(s);
  assert.equal(result.candidateProcessCount, 3);
  assert.equal(result.candidateWindowCount, 2);
});
