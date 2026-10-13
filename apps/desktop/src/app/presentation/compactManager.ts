import {
  canRequestClient02,
  isSandboxieBoxPrepared,
  type IsolatedClientObservation,
  type ProcessIdentityCandidate,
} from "../bridge/nativeFeasibilityApi.js";

export type InstanceAction = "open" | "switch" | "setup" | "issue" | null;
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
  if (!observation) return { title: "Check the setup", text: "Select Check status to inspect this Windows session." };
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
  if (!observation) return { status: "Not checked", tone: "neutral", action: null, details: "Use Check status above.", canMove: false };

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
  if (busy === "check") return { ...base, status: "Checking…", tone: "neutral", action: null, canMove: false };
  if (busy === "open-" + id) return { ...base, status: "Opening…", tone: "neutral", action: null, canMove: false };
  if (busy === "switch" && id === "02") return { ...base, status: "Switching…", action: null, canMove: false };
  if (busy === "move" && id === "02") return { ...base, status: "Moving…", action: null, canMove: false };
  if (issue?.instance === id) return { ...base, status: issue.title, tone: "warning", action: "issue", canMove: false };
  if (notice?.instance === id) return { ...base, status: notice.text, tone: "neutral", action: null, canMove: false };
  return base;
}

// Technical text is never sent to logs or uploaded by this layer.
export function safeErrorDetails(value: unknown): string {
  const raw = value instanceof Error ? value.message : typeof value === "string" ? value : "No additional details available.";
  return raw
    .replace(/[A-Za-z]:\\Users\\[^\\\r\n]+/gi, "[user directory]")
    .replace(/[^\s@]+@[^\s@]+\.[A-Za-z]{2,}/g, "[account]")
    .replace(/(password|token|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .slice(0, 450);
}
