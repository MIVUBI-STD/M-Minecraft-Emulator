import { invokeRuntime } from "./invokeRuntime.js";

export interface NativeProcessCandidate {
  pid: number;
  windowHandle: string | null;
}

export interface NativeProcessObservation {
  schema: 1;
  evidenceClass: "NAME_MATCH_CANDIDATE_ONLY";
  interactiveSession: boolean;
  candidates: NativeProcessCandidate[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOnly = (value: Record<string, unknown>, fields: readonly string[]) =>
  Object.keys(value).length === fields.length &&
  fields.every((field) => Object.prototype.hasOwnProperty.call(value, field));

export function parseNativeObservation(value: unknown): NativeProcessObservation {
  if (!isRecord(value) || !hasOnly(value, [
    "schema", "evidenceClass", "interactiveSession", "candidates",
  ]) ||
    value.schema !== 1 ||
    value.evidenceClass !== "NAME_MATCH_CANDIDATE_ONLY" ||
    typeof value.interactiveSession !== "boolean" ||
    !Array.isArray(value.candidates) ||
    value.candidates.length > 16
  ) {
    throw new TypeError("Untrusted native process observation.");
  }

  const pids = new Set<number>();
  const handles = new Set<bigint>();
  const candidates: NativeProcessCandidate[] = [];

  for (const candidate of value.candidates) {
    if (!isRecord(candidate) || !hasOnly(candidate, ["pid", "windowHandle"])) {
      throw new TypeError("Invalid or duplicate native PID candidate.");
    }
    const pid = candidate.pid;
    if (typeof pid !== "number" || !Number.isSafeInteger(pid) ||
      pid <= 0 || pid > 0xffffffff || pids.has(pid)) {
      throw new TypeError("Invalid or duplicate native PID candidate.");
    }
    pids.add(pid);

    let windowHandle: string | null = null;
    if (candidate.windowHandle !== null) {
      if (typeof candidate.windowHandle !== "string" ||
        !/^0x[0-9a-f]{1,16}$/i.test(candidate.windowHandle) ||
        !/[1-9a-f]/i.test(candidate.windowHandle.slice(2))) {
        throw new TypeError("Invalid native window handle.");
      }
      const key = BigInt(candidate.windowHandle);
      if (handles.has(key)) throw new TypeError("Duplicate native window handle.");
      handles.add(key);
      windowHandle = candidate.windowHandle;
    }
    candidates.push({ pid, windowHandle });
  }

  return {
    schema: 1,
    evidenceClass: "NAME_MATCH_CANDIDATE_ONLY",
    interactiveSession: value.interactiveSession,
    candidates,
  };
}

export const nativeFeasibility = {
  // Only the official registered Start app is requested, never a copied EXE.
  openOfficialMinecraft: () => invokeRuntime<void>("desktop_open_native_minecraft"),
  selectEducationExe: () => invokeRuntime<string | null>("desktop_select_education_exe"),
  requestSandboxClient02: (executable: string, licensed: boolean) =>
    invokeRuntime<void>("desktop_request_sandbox_client_02", { executable, licensed }),
  inspectCandidates: async (): Promise<NativeProcessObservation> =>
    parseNativeObservation(await invokeRuntime<unknown>("desktop_inspect_native_candidates")),
};
