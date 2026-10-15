import assert from "node:assert/strict";
import test from "node:test";
import { evaluateNativePerformance } from "./evaluate-native-performance.mjs";

const sample = () => ({
  schema: 1,
  scope: "NATIVE_SANDBOXIE_PROCESS_PERFORMANCE",
  evidenceOrigin: "WINDOWS_HOST",
  attribution: "OPERATOR_SELECTED_UNVERIFIED_PIDS",
  automaticVerdict: "NOT_PROVIDED",
  capturedAtUtc: "2026-10-13T12:00:00Z",
  durationRequestedSeconds: 60,
  durationObservedSeconds: 60,
  sampleIntervalSeconds: 5,
  hostLogicalCpus: 8,
  sampleCount: 2,
  nativeProcessIdentityLost: false,
  isolatedProcessIdentityLost: false,
  samples: [
    { elapsedSeconds: 5, native: {status: "OBSERVED", cpuPercentOfHost: 5, workingSetMb: 100},
      isolated: {status: "OBSERVED", cpuPercentOfHost: 10, workingSetMb: 220} },
    { elapsedSeconds: 10, native: {status: "OBSERVED", cpuPercentOfHost: 7, workingSetMb: 120},
      isolated: {status: "OBSERVED", cpuPercentOfHost: 20, workingSetMb: 240} },
  ],
  missingEvidence: ["ACCOUNT_ISOLATION", "GAMEPLAY_RENDERING", "FRAME_TIMES",
    "GPU_VRAM", "MULTIPLAYER", "INPUT_RESPONSIVENESS"],
});

test("complete CPU/RAM values still never create gameplay or performance PASS", () => {
  const result = evaluateNativePerformance(sample());
  assert.equal(result.interpretation, "PROCESS_TELEMETRY_ONLY");
  assert.equal(result.automaticGameplayProof, false);
  assert.equal(result.automaticPerformanceVerdict, "NOT_PROVIDED");
  assert.equal(result.fourClientReady, false);
  assert.deepEqual(result.native, {
    observedSamples: 2, missingSamples: 0,
    observationCoveragePercent: 100, firstMissingAtSeconds: null,
    meanHostCpuPercent: 6, peakHostCpuPercent: 7,
    meanWorkingSetMb: 110, maxWorkingSetMb: 120,
  });
  assert.equal(result.isolated.peakHostCpuPercent, 20);
  assert.equal(result.isolated.meanWorkingSetMb, 230);
  assert.equal(result.isolated.maxWorkingSetMb, 240);
  assert.equal(result.metricScope, "OPERATOR_SELECTED_PROCESSES_ONLY_NOT_PROCESS_TREES");
  assert.equal(result.identityDiscontinuityInterpretation,
    "PROCESS_MISSING_OR_INACCESSIBLE_NOT_PROOF_OF_CRASH");
});

test("inaccessible/restarted process stays unknown instead of fabricating 0 samples", () => {
  const r = sample();
  r.isolatedProcessIdentityLost = true;
  r.samples[1].isolated = {status: "UNKNOWN", cpuPercentOfHost: null, workingSetMb: null};
  const result = evaluateNativePerformance(r);
  assert.equal(result.identityDiscontinuityObserved, true);
  assert.equal(result.isolated.observedSamples, 1);
  assert.equal(result.isolated.missingSamples, 1);
  assert.equal(result.isolated.meanHostCpuPercent, 10);
  assert.equal(result.isolated.peakHostCpuPercent, 10);
  assert.equal(result.isolated.meanWorkingSetMb, 220);
  assert.equal(result.isolated.observationCoveragePercent, 50);
  assert.equal(result.isolated.firstMissingAtSeconds, 10);
  // A missing reading is not automatically classified as a Minecraft crash.
  assert.equal(result.automaticPerformanceVerdict, "NOT_PROVIDED");
});

test("no process observations preserve null metrics, not artificial zeros", () => {
  const r = sample();
  r.nativeProcessIdentityLost = true;
  r.samples.forEach(s => s.native = {status: "UNKNOWN", cpuPercentOfHost: null, workingSetMb: null});
  const result = evaluateNativePerformance(r);
  assert.equal(result.native.meanHostCpuPercent, null);
  assert.equal(result.native.peakHostCpuPercent, null);
  assert.equal(result.native.meanWorkingSetMb, null);
  assert.equal(result.native.maxWorkingSetMb, null);
  assert.equal(result.native.observationCoveragePercent, 0);
  assert.equal(result.native.firstMissingAtSeconds, 5);
});

test("reject impossible process reappearance and mismatched identity flags", () => {
  const falseFlag = sample();
  falseFlag.samples[1].native = {status: "UNKNOWN", cpuPercentOfHost: null, workingSetMb: null};
  assert.throws(() => evaluateNativePerformance(falseFlag), TypeError);
  const impossibleResurrection = sample();
  impossibleResurrection.nativeProcessIdentityLost = true;
  impossibleResurrection.samples[0].native = {status: "UNKNOWN", cpuPercentOfHost: null, workingSetMb: null};
  assert.throws(() => evaluateNativePerformance(impossibleResurrection), TypeError);
});

test("reject PID/account injection, fabricated verdict, and invalid schema", () => {
  for (const mutate of [
    r => r.PID = 100,
    r => r.samples[0].native.pid = 100,
    r => r.accountEmail = "hidden@example.com",
    r => r.automaticVerdict = "PASS",
    r => r.scope = "FOUR_CLIENT_READY",
    r => r.samples[0].native.cpuPercentOfHost = Number.NaN,
    r => r.samples[0].native.workingSetMb = -3,
    r => r.samples[0].isolated.status = "GAMEPLAY_VERIFIED",
    r => r.samples[0].isolated.workingSetMb = null,
    r => r.samples[1].elapsedSeconds = 5,
    r => r.sampleCount = 20,
    r => r.missingEvidence = [],
    r => r.nativeProcessIdentityLost = true
  ]) {
    const r = sample();
    mutate(r);
    assert.throws(() => evaluateNativePerformance(r), TypeError);
  }
});

test("zero CPU samples remain legitimate observations, not missing evidence", () => {
  const r = sample();
  r.samples[0].native.cpuPercentOfHost = 0;
  r.samples[1].native.cpuPercentOfHost = 0;
  r.samples[0].native.workingSetMb = 0;
  const result = evaluateNativePerformance(r);
  assert.equal(result.native.meanHostCpuPercent, 0);
  assert.equal(result.native.peakHostCpuPercent, 0);
  assert.equal(result.native.meanWorkingSetMb, 60);
  assert.equal(result.native.observationCoveragePercent, 100);
  assert.equal(result.native.firstMissingAtSeconds, null);
  assert.equal(result.fourClientReady, false);
});

test("fractional observation coverage and first loss locate incomplete samples", () => {
  const r = sample();
  r.sampleCount = 3;
  r.samples.push({ elapsedSeconds: 15,
    native: {status: "OBSERVED", cpuPercentOfHost: 3, workingSetMb: 90},
    isolated: {status: "UNKNOWN", cpuPercentOfHost: null, workingSetMb: null},
  });
  r.isolatedProcessIdentityLost = true;
  assert.equal(evaluateNativePerformance(r).isolated.observationCoveragePercent, 66.67);
  assert.equal(evaluateNativePerformance(r).isolated.firstMissingAtSeconds, 15);
});
