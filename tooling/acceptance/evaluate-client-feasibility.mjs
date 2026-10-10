import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Evaluates the existing acceptance evidence; never infers official Minecraft
// Education support or renders a configuration bit as game-playability proof.
export function evaluateClientFeasibility(report) {
  const fail = (message) => { throw new TypeError(message); };
  if (!report || typeof report !== "object" || report.schema !== 1 || report.scope !== "CLIENT_FEASIBILITY" || report.evidenceOrigin !== "WINDOWS_GUEST" || report.automaticVerdict !== "NOT_PROVIDED") fail("Unknown or untrusted feasibility-report contract.");
  if (!["ENVIRONMENT", "INTERACTIVE"].includes(report.stage)) fail("Invalid feasibility stage.");
  const win = report.windows;
  const gl = report.graphics?.openGl;
  const mc = report.minecraft;
  const operator = report.operator;
  if (!win || typeof win.interactiveSession !== "boolean" || !gl || !["MEASURED", "UNKNOWN"].includes(gl.status) || !mc || mc.processEvidenceClass !== "CANDIDATE_ONLY" || !operator || operator.attribution !== "OPERATOR_DECLARED_NOT_MACHINE_VERIFIED") fail("Missing or invalid source attribution.");
  const flags = ["menuRendered", "worldRendered", "inputResponsive", "blockingGraphicsError"];
  if (!flags.every(k => ["YES", "NO", "UNKNOWN"].includes(operator[k]))) fail("Unexpected operator observation value.");
  if (mc.candidateProcessCount !== null && (!Number.isInteger(mc.candidateProcessCount) || mc.candidateProcessCount < 0)) fail("Invalid candidate process count.");
  if (gl.status === "MEASURED" && (typeof gl.version !== "string" || !gl.version.trim())) fail("OpenGL measurement is missing its version.");
  const reference = operator.evidenceReference;
  if (reference !== null && (typeof reference !== "string" || !/^[a-zA-Z0-9_.-]{1,80}$/.test(reference))) fail("Evidence reference must be a non-sensitive file label.");
  if (report.stage === "ENVIRONMENT" && (flags.some(k => operator[k] !== "UNKNOWN") || reference !== null)) fail("Environment probe cannot contain operator gameplay claims.");
  const risks = ["VIRTUAL_MINECRAFT_CLIENT_NOT_OFFICIALLY_SUPPORTED"];
  if (!win.interactiveSession) risks.push("NON_INTERACTIVE_WINDOWS_SESSION");
  if (!/\b64[- ]bit\b/i.test(win.architecture ?? "")) risks.push("WINDOWS_64_BIT_UNVERIFIED");
  if (win.vmwareToolsRunning !== true) risks.push("VMWARE_TOOLS_UNVERIFIED");
  if (gl.status === "MEASURED") {
    const match = /^\s*(\d+)\.(\d+)(?:\D|$)/.exec(gl.version);
    if (!match) risks.push("OPENGL_VERSION_UNPARSEABLE");
    else if (+match[1] < 4 || (+match[1] === 4 && +match[2] < 4)) risks.push("OPENGL_BELOW_PUBLISHED_4_4_REFERENCE");
  } else risks.push("OPENGL_UNMEASURED");
  if (mc.candidateProcessCount === null || mc.candidateProcessCount === 0) risks.push("MINECRAFT_PROCESS_NOT_OBSERVED");
  let verdict = "INCONCLUSIVE";
  if (report.stage === "INTERACTIVE") {
    if (["menuRendered","worldRendered","inputResponsive"].some(k => operator[k] === "NO") || operator.blockingGraphicsError === "YES") verdict = "OPERATOR_REPORTED_FAILURE";
    else if (operator.menuRendered === "YES" && operator.worldRendered === "YES" && operator.inputResponsive === "YES" && operator.blockingGraphicsError === "NO" && reference !== null && win.interactiveSession && mc.candidateProcessCount > 0) verdict = "OPERATOR_REPORTED_PLAYABLE";
  }
  return {
    schema: 1,
    scope: "CLIENT_FEASIBILITY",
    stage: report.stage,
    verdict,
    proofCeiling: "OPERATOR_DECLARED_AND_GUEST_DIAGNOSTICS_ONLY",
    officialVmClientSupport: "NOT_CLAIMED",
    risks,
    next: verdict === "OPERATOR_REPORTED_PLAYABLE" ? "REVIEW_EVIDENCE_BEFORE_PRODUCTION_BASE" : verdict === "OPERATOR_REPORTED_FAILURE" ? "STOP_AND_DIAGNOSE_RENDER_OR_INPUT" : "COLLECT_MISSING_INTERACTIVE_EVIDENCE"
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node tooling/acceptance/evaluate-client-feasibility.mjs <guest-report.json>");
    process.exitCode = 2;
  } else {
    try {
      const report = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
      console.log(JSON.stringify(evaluateClientFeasibility(report), null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 2;
    }
  }
}
