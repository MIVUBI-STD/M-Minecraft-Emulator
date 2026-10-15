import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Interpret process-only evidence; never infer licensed accounts, Minecraft
// rendering, frametimes, GPU behavior or four-client readiness from CPU/RAM.
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const integer = (value) => Number.isSafeInteger(value);
const missing = ["ACCOUNT_ISOLATION", "GAMEPLAY_RENDERING", "FRAME_TIMES",
  "GPU_VRAM", "MULTIPLAYER", "INPUT_RESPONSIVENESS"];

function exactly(object, names) {
  return isObject(object) && Object.keys(object).length === names.length &&
    Object.keys(object).every(key => names.includes(key));
}
function sampleMetrics(value) {
  if (!exactly(value, ["status", "cpuPercentOfHost", "workingSetMb"]) ||
      !["OBSERVED", "UNKNOWN"].includes(value.status)) throw new TypeError("Invalid process sample.");
  const cpu = value.cpuPercentOfHost, ram = value.workingSetMb;
  if (value.status === "UNKNOWN") {
    if (cpu !== null || ram !== null) throw new TypeError("Missing data must be null, not zero.");
  } else if (!finite(cpu) || cpu < 0 || !finite(ram) || ram < 0) {
    throw new TypeError("Observed CPU/RAM must be finite nonnegative values.");
  }
}
function metrics(samples, key) {
  // This is ONE operator-selected process, not its full descendant tree.
  // Missing readings may mean exit, inaccessibility or restart, not a crash.
  const observed = samples.filter(sample => sample[key].status === "OBSERVED");
  const firstMissing = samples.find(sample => sample[key].status === "UNKNOWN");
  const mean = (field) => observed.length
    ? Number((observed.reduce((total, sample) => total + sample[key][field], 0) /
        observed.length).toFixed(2))
    : null;
  return {
    observedSamples: observed.length,
    missingSamples: samples.length - observed.length,
    observationCoveragePercent: Number((100 * observed.length / samples.length).toFixed(2)),
    firstMissingAtSeconds: firstMissing?.elapsedSeconds ?? null,
    meanHostCpuPercent: mean("cpuPercentOfHost"),
    peakHostCpuPercent: observed.length
      ? Math.max(...observed.map(sample => sample[key].cpuPercentOfHost))
      : null,
    meanWorkingSetMb: mean("workingSetMb"),
    maxWorkingSetMb: observed.length
      ? Math.max(...observed.map(sample => sample[key].workingSetMb))
      : null,
  };
}

export function evaluateNativePerformance(report) {
  const fields = ["schema", "scope", "evidenceOrigin", "attribution",
    "automaticVerdict", "capturedAtUtc", "durationRequestedSeconds",
    "durationObservedSeconds", "sampleIntervalSeconds", "hostLogicalCpus",
    "sampleCount", "nativeProcessIdentityLost", "isolatedProcessIdentityLost",
    "samples", "missingEvidence"];
  if (!exactly(report, fields) || report.schema !== 1 ||
      report.scope !== "NATIVE_SANDBOXIE_PROCESS_PERFORMANCE" ||
      report.evidenceOrigin !== "WINDOWS_HOST" ||
      report.attribution !== "OPERATOR_SELECTED_UNVERIFIED_PIDS" ||
      report.automaticVerdict !== "NOT_PROVIDED" ||
      typeof report.capturedAtUtc !== "string" ||
      !Number.isFinite(Date.parse(report.capturedAtUtc)) ||
      !integer(report.durationRequestedSeconds) ||
      report.durationRequestedSeconds < 30 || report.durationRequestedSeconds > 7200 ||
      !finite(report.durationObservedSeconds) || report.durationObservedSeconds < 0 ||
      !integer(report.sampleIntervalSeconds) || report.sampleIntervalSeconds < 1 ||
      report.sampleIntervalSeconds > 60 ||
      !integer(report.hostLogicalCpus) || report.hostLogicalCpus < 1 ||
      report.hostLogicalCpus > 1024 ||
      typeof report.nativeProcessIdentityLost !== "boolean" ||
      typeof report.isolatedProcessIdentityLost !== "boolean" ||
      !integer(report.sampleCount) || report.sampleCount < 1 ||
      report.sampleCount > 7200 ||
      !Array.isArray(report.samples) || report.samples.length !== report.sampleCount ||
      !Array.isArray(report.missingEvidence) ||
      report.missingEvidence.length !== missing.length ||
      !missing.every((flag, index) => report.missingEvidence[index] === flag)) {
    throw new TypeError("Unrecognized or inconsistent native performance report.");
  }
  let lastTime = -1;
  let nativeLostInSamples = false;
  let isolatedLostInSamples = false;
  for (const sample of report.samples) {
    if (!exactly(sample, ["elapsedSeconds", "native", "isolated"]) ||
        !finite(sample.elapsedSeconds) || sample.elapsedSeconds <= lastTime ||
        sample.elapsedSeconds < 0 ||
        sample.elapsedSeconds > report.durationObservedSeconds + 0.1) {
      throw new TypeError("Invalid or unordered sample timestamp.");
    }
    lastTime = sample.elapsedSeconds;
    sampleMetrics(sample.native);
    sampleMetrics(sample.isolated);
    // The process collector pins creation time and never follows a reused PID.
    // Once identity is lost, a later OBSERVED sample would be contradictory.
    if ((nativeLostInSamples && sample.native.status === "OBSERVED") ||
        (isolatedLostInSamples && sample.isolated.status === "OBSERVED")) {
      throw new TypeError("A lost process identity cannot resume within one capture.");
    }
    nativeLostInSamples ||= sample.native.status === "UNKNOWN";
    isolatedLostInSamples ||= sample.isolated.status === "UNKNOWN";
  }
  if (nativeLostInSamples !== report.nativeProcessIdentityLost ||
      isolatedLostInSamples !== report.isolatedProcessIdentityLost) {
    throw new TypeError("Process identity-loss flags contradict the observed samples.");
  }
  const native = metrics(report.samples, "native");
  const isolated = metrics(report.samples, "isolated");
  return {
    interpretation: "PROCESS_TELEMETRY_ONLY",
    automaticGameplayProof: false,
    automaticPerformanceVerdict: "NOT_PROVIDED",
    fourClientReady: false,
    durationRequestedSeconds: report.durationRequestedSeconds,
    durationObservedSeconds: report.durationObservedSeconds,
    sampleCount: report.sampleCount,
    native,
    isolated,
    identityDiscontinuityObserved: report.nativeProcessIdentityLost || report.isolatedProcessIdentityLost,
    identityDiscontinuityInterpretation: "PROCESS_MISSING_OR_INACCESSIBLE_NOT_PROOF_OF_CRASH",
    metricScope: "OPERATOR_SELECTED_PROCESSES_ONLY_NOT_PROCESS_TREES",
    missingEvidence: [...missing],
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    if (process.argv.length !== 3) throw new TypeError("Usage: node evaluate-native-performance.mjs <report.json>");
    const report = JSON.parse(readFileSync(process.argv[2], "utf8"));
    process.stdout.write(JSON.stringify(evaluateNativePerformance(report), null, 2) + "\n");
  } catch (error) {
    process.stderr.write("Performance evidence invalid: " + error.message + "\n");
    process.exitCode = 1;
  }
}
