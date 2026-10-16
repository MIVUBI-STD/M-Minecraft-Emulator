import {
  canRequestClient02,
  isSandboxieBoxPrepared,
  type IsolatedClientObservation,
  type ProcessIdentityCandidate,
  type OwnedHostInspection,
} from "../bridge/nativeFeasibilityApi.js";

// One user-facing explanation of the existing read-only Windows host probe.
// This is not a create authorization or proof that any installed SbieSvc is
// MIVUBI-owned. Every possible observed state remains blocked.
export function ownedVirtualCreationReason(host: OwnedHostInspection | null): string {
  if (!host) return "Internal engine not checked. The private driver is not yet installed or validated.";
  switch (host.state) {
    case "BLOCKED_SERVICE_NAMESPACE_IN_USE":
      return "Sandboxie service or driver names are already registered. They may belong to the official installation; MIVUBI will not replace them.";
    case "BLOCKED_SERVICE_PROBE_UNKNOWN":
      return "Windows could not verify the service and driver names. Creating a virtual is blocked.";
    case "BLOCKED_NON_INTERACTIVE_SESSION":
      return "Open MIVUBI in an interactive Windows desktop session to inspect the engine.";
    case "BLOCKED_UNVERIFIED_OWNED_DRIVER":
      return "Service names are available, but no signed and verified MIVUBI driver has been activated.";
  }
}

/**
 * Lightweight default Balanced policy: permit at most one explicit
 * resource-intensive desktop operation at a time. A file-hash inspection,
 * PowerShell status probe, native launch or picker must never overlap
 * another helper via the mounted UI. This does NOT throttle Minecraft
 * processes, change Windows priority, or claim any GPU/FPS savings.
 */
export function isResourceOperationBusy(
  currentAction: string,
  ownedHostInspectionBusy: boolean,
  ownedPackageInspectionBusy: boolean,
): boolean {
  return currentAction !== "" ||
    ownedHostInspectionBusy || ownedPackageInspectionBusy;
}

export type InstanceAction = "check" | "open" | "switch" | "setup" | "issue" | null;
export type StateTone = "neutral" | "warning" | "success";
export type InstanceId = "01" | "02";
export interface InstanceRowView {
  status: string;
  tone: StateTone;
  action: InstanceAction;
  details: string;
  canMove: boolean;
}

export interface UiIssue {
  instance: InstanceId;
  title: string;
  message: string;
  details?: string;
  // UI picker provenance only: not a machine/runtime verdict.
  origin?: "executable-picker";
}

export function shouldClearPickerIssue(issue: UiIssue | undefined, selected: string | null): boolean {
  return Boolean(selected) && issue?.origin === "executable-picker";
}
export interface UiNotice {
  instance: InstanceId;
  text: string;
}

export function focusCandidate(observation: IsolatedClientObservation | undefined): ProcessIdentityCandidate | null {
  if (!observation || observation.membershipStatus !== "OBSERVED" || !observation.interactiveSession) return null;
  const candidates = observation.processCandidates.filter((candidate) =>
    candidate.inSelectedBox === true &&
    candidate.createdFileTime !== null &&
    candidate.windowHandle !== null
  );
  // One visible candidate alone does not prove login, gameplay or signing.
  return candidates.length === 1 && observation.isolatedCandidateProcesses === 1 ? candidates[0] : null;
}

export function setupInstruction(observation: IsolatedClientObservation | undefined): { title: string; text: string } {
  if (!observation) return { title: "Check the setup", text: "Choose Check status on Minecraft 02 to inspect its setup." };
  if (!observation.interactiveSession) return { title: "Open a Windows desktop session", text: "Open this manager from your signed-in Windows desktop." };
  if (observation.boxConfigured === "NO") return { title: "Prepare Sandboxie Plus", text: "Create and enable a persistent box named MinecraftClient02 in Sandboxie Plus." };
  if (observation.boxConfigured !== "YES" || observation.boxSettingsSource !== "BOX_SECTION_ENUMERATED")
    return { title: "Check Sandboxie Plus", text: "The app could not read the sandbox settings. Review the box, then check status again." };
  if (observation.autoDelete === "ON" || observation.autoRemove === "ON")
    return { title: "Keep your sandbox data", text: "Turn off AutoDelete and AutoRemove for MinecraftClient02 in Sandboxie Plus." };
  if (observation.credentialHostAccess === "ON")
    return { title: "Review isolation settings", text: "Review credential and protected-storage access in Sandboxie Plus before opening Minecraft." };
  if (observation.autoDelete !== "OFF" || observation.autoRemove !== "OFF" || observation.credentialHostAccess !== "OFF")
    return { title: "Check sandbox settings", text: "Some required settings could not be confirmed. Review them in Sandboxie Plus." };
  if (observation.membershipStatus !== "OBSERVED")
    return { title: "Check instance status", text: "The app could not confirm which processes belong to Minecraft 02. Check Sandboxie Plus, then check status again." };
  return { title: "Select Minecraft Education", text: "Choose the installed official Minecraft Education Desktop executable, then confirm your Sandboxie Plus licence." };
}

export function client02Presentation(
  observation: IsolatedClientObservation | undefined,
  executable: string,
  licensed: boolean,
): InstanceRowView {
  if (!observation) return { status: "Not checked", tone: "neutral", action: "check", details: "Check Virtual 02 before setup, opening, or switching.", canMove: false };

  if (!observation.interactiveSession) return {
    status: "Needs attention", tone: "warning", action: "issue",
    details: "Use this manager from an interactive Windows desktop.", canMove: false,
  };
  if (observation.boxConfigured === "NO" ||
      observation.autoDelete === "ON" || observation.autoRemove === "ON" ||
      observation.credentialHostAccess === "ON") return {
    status: "Setup required", tone: "warning", action: "setup",
    details: setupInstruction(observation).text, canMove: false,
  };
  if (!isSandboxieBoxPrepared(observation) || observation.membershipStatus !== "OBSERVED") return {
    status: "Couldn't check status", tone: "warning", action: "issue",
    details: setupInstruction(observation).text, canMove: false,
  };

  if (observation.isolatedCandidateProcesses > 0) {
    const candidate = focusCandidate(observation);
    return candidate
      ? { status: "Window detected", tone: "neutral", action: "switch",
          details: "Found at the last check. Account sign-in and gameplay were not inspected.", canMove: true }
      : { status: "Needs attention", tone: "warning", action: "issue",
          details: "A process may already be open, but no unique game window could be confirmed. Do not open another copy.", canMove: false };
  }

  if (!canRequestClient02(observation)) return {
    status: "Couldn't check status", tone: "warning", action: "issue",
    details: "The app could not confirm that the sandbox is empty.", canMove: false,
  };
  if (!executable || !licensed) return {
    status: "Setup required", tone: "neutral", action: "setup",
    details: "Select Minecraft Education and confirm the required licence.", canMove: false,
  };
  return {
    status: "Ready to open", tone: "neutral", action: "open",
    details: "Requirements were met at the last check. They will be checked again when opening.", canMove: false,
  };
}

export function rowPresentation(
  id: InstanceId,
  inspected: boolean,
  isolated: InstanceRowView,
  busy: string,
  issue: UiIssue | null,
  notice: UiNotice | null,
): InstanceRowView {
  const base = id === "01"
    ? { status: inspected ? "Status unconfirmed" : "Not checked",
        tone: "neutral" as const, action: "open" as const,
        details: "The app can request Windows to open Minecraft Education. It cannot confirm the native game window.", canMove: false }
    : isolated;
  // Check status observes isolated Client 02, not native Client 01.
  if (busy === "check" && id === "02") return { ...base, status: "Checking…", tone: "neutral", action: null, canMove: false };
  // The file dialog may change the selected EXE and reset licence consent.
  // Suppress a misleading Ready to open / Open action while it is unresolved.
  if (busy === "select" && id === "02") return { ...base, status: "Selecting…", tone: "neutral", action: null, canMove: false };
  if (busy === "open-" + id) return { ...base, status: "Opening…", tone: "neutral", action: null, canMove: false };
  if (busy === "switch" && id === "02") return { ...base, status: "Switching…", action: null, canMove: false };
  if (busy === "move" && id === "02") return { ...base, status: "Moving…", action: null, canMove: false };
  if (issue?.instance === id) return { ...base, status: issue.title, tone: "warning", action: "issue", canMove: false };
  if (notice?.instance === id) return { ...base, status: notice.text, tone: "neutral", action: null, canMove: false };
  return base;
}

// The UI must not expose user profiles or authentication values in advanced
// errors. Keep non-sensitive context while redacting both Windows slash styles,
// macOS-style home paths and common header/credential representations.
export function safeErrorDetails(value: unknown): string {
  const raw = value instanceof Error ? value.message : typeof value === "string" ? value : "No additional details available.";
  return raw
    .replace(/\b[A-Za-z]:[\\/]Users[\\/][^\\/\r\n]+/gi, "[user directory]")
    .replace(/\/Users\/[^/\r\n]+/g, "[user directory]")
    .replace(/[^\s@]+@[^\s@]+\.[A-Za-z]{2,}/g, "[account]")
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [redacted]")
    .replace(/\b(access[_-]?token|refresh[_-]?token|api[_-]?key|password|token|secret)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi, "$1=[redacted]")
    .slice(0, 450);
}
