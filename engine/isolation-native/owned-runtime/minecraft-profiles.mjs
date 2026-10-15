// MIVUBI-owned Minecraft Education multi-client core control contract.
// This is functional configuration/launch planning for the PRIVATE fork,
// not an installer, signed driver, official Sandboxie adapter, or game proof.
// Real execution may be enabled only by a separately verified Windows lab.
const PROFILES = Object.freeze({
  "02": "MivubiEdu02",
  "03": "MivubiEdu03",
  "04": "MivubiEdu04",
});
// Exact Minecraft Education compatibility profile observed as usable in
// the authorized official Sandboxie 1.18.5 two-account Windows local test.
// App Compartment / OpenCOM reduces containment; this is NOT a hardened box.
const SETTINGS = Object.freeze([
  Object.freeze(["AutoDelete", "n"]),
  Object.freeze(["AutoRemove", "n"]),
  Object.freeze(["NoSecurityIsolation", "y"]),
  Object.freeze(["DropAdminRights", "y"]),
  Object.freeze(["Template", "OpenCOM"]),
  Object.freeze(["OpenCredentials", "n"]),
  Object.freeze(["OpenProtectedStorage", "n"]),
  // Enable LAST: never present a partially configured box as ready.
  Object.freeze(["Enabled", "y"]),
]);
const GAME_BINARIES = new Set([
  "minecraft.windows.exe", "minecrafteducation.exe",
  "minecrafteducationedition.exe",
]);
function requireProfile(client) {
  if (typeof client !== "string" ||
      !Object.prototype.hasOwnProperty.call(PROFILES, client)) {
    throw new Error("MIVUBI private launch requires exact Client 02, 03 or 04");
  }
  return PROFILES[client];
}
function requireGameExe(executable) {
  if (typeof executable !== "string" || executable.length > 1024 ||
      !/^[A-Za-z]:\\/.test(executable) ||
      /[\u0000-\u001f\u007f"'<>|*?]/.test(executable) ||
      executable.split("\\").some(part => part === ".." || part === "." || part.length === 0)) {
    throw new Error("MIVUBI private launch requires a canonical absolute Windows Education EXE");
  }
  const name = executable.split("\\").at(-1)?.toLowerCase();
  if (!GAME_BINARIES.has(name)) {
    throw new Error("MIVUBI private launch refuses non-Education executable");
  }
  return executable;
}

/** Deterministic, PRIVATE-only profile identity. Does not touch the host. */
export function ownedMinecraftProfiles() {
  return Object.entries(PROFILES).map(([client, box]) => ({
    client, box, persistent: true, accountAuthenticated: false,
    windowsDriverVerified: false,
  }));
}

/** Command arguments for creating three distinct persistent config sections.
 * An executor MUST first prove a disposable host with the owned SbieSvc/SbieDrv
 * namespace; an existing box must never be overwritten or mutated by this plan.
 * These settings reproduce the successful Education App Compartment pilot;
 * NoSecurityIsolation=y and Template=OpenCOM reduce process/COM containment.
 * OpenCredentials=n is NOT a guarantee that WAM/SSO state stays isolated.
 * An executor needs explicit operator approval for this compatibility mode
 * and must verify all settings via SbieIni query before any box is usable.
 */
export function planOwnedMinecraftProfiles(existingBoxes = []) {
  if (!Array.isArray(existingBoxes) || existingBoxes.some(name =>
      typeof name !== "string" || !/^[A-Za-z0-9_]{1,32}$/.test(name))) {
    throw new Error("A trustworthy existing box-name inventory is required");
  }
  const occupied = new Set(existingBoxes.map(name => name.toLowerCase()));
  if (occupied.size !== existingBoxes.length) {
    throw new Error("Ambiguous duplicate Sandboxie box identity");
  }
  const profiles = ownedMinecraftProfiles();
  if (profiles.some(p => occupied.has(p.box.toLowerCase()))) {
    throw new Error("MIVUBI-owned box already exists; refusing any overwrite");
  }
  return {
    state: "PRIVATE_BOX_CONFIGURATION_PLAN_NOT_EXECUTED",
    source: "MIVUBI_PRIVATE_START_PROFILE_V1",
    compatibilityProfile: "MINECRAFT_EDUCATION_APP_COMPARTMENT_OPENCOM",
    reducedSecurityIsolation: true,
    requiresExplicitOperatorApproval: true,
    settingsReadbackVerified: false,
    profiles,
    commands: profiles.flatMap(({client, box}) =>
      SETTINGS.map(([key, value]) => ({
        client, executable: "SbieIni.exe",
        arguments: ["set", box, key, value],
      }))),
    hostChanged: false,
    accountIsolationVerified: false,
    driverInstalled: false,
  };
}

/** Launch contract implemented by the MIVUBI-modified Start.exe parser.
 * Never replace this with /box:DefaultBox or the official installed Start.exe.
 * No shell, arguments, credentials, URL or auto-retry are supported.
 */
export function ownedMinecraftLaunch(client, executable) {
  const box = requireProfile(client);
  const game = requireGameExe(executable);
  return {
    state: "PRIVATE_START_LAUNCH_ARGUMENTS_NOT_EXECUTED",
    client, box,
    executable: "Start.exe",
    arguments: ["/mivubi_client:" + client, game],
    // For a future CreateProcessW adapter: the private Start parser requires
    // the target as one fully quoted path even if it has no spaces.
    rawCommandLine: "/mivubi_client:" + client + ' "' + game + '"',
    driverInstalled: false,
    gameplayVerified: false,
  };
}
