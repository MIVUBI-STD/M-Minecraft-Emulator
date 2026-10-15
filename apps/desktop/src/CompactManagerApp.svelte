<script lang="ts">
  import { tick } from "svelte";
  import {
    nativeFeasibility,
    isSandboxieBoxPrepared,
    type IsolatedClientObservation,
    type OwnedCandidateInspection,
    type OwnedHostInspection,
    type VirtualBoxInventory,
  } from "./app/bridge/nativeFeasibilityApi.js";
  import {
    client02Presentation,
    focusCandidate,
    isResourceOperationBusy,
    ownedVirtualCreationReason,
    rowPresentation,
    safeErrorDetails,
    setupInstruction,
    shouldClearPickerIssue,
    type InstanceId,
    type UiIssue,
    type UiNotice,
  } from "./app/presentation/compactManager.js";

  type Page = "instances" | "settings";
  type DetailMode = "setup" | "issue" | "info" | "move";
  type MoveSide = "LEFT" | "RIGHT";

  let page: Page = "instances";
  let expanded: InstanceId | null = null;
  let detailMode: DetailMode = "info";
  let busy = "";
  let observation: IsolatedClientObservation | undefined;
  let lastCheck: Date | null = null;
  let lastCheckIsCurrent = false;
  let selectedExecutable = "";
  let licenseConfirmed = false;
  // Development-only candidate inspection is independent of active Client 02.
  let ownedCandidate: OwnedCandidateInspection | null = null;
  let ownedInspectionError = "";
  let ownedInspectionBusy = false;
  let ownedHostInspection: OwnedHostInspection | null = null;
  let ownedHostBusy = false;
  let ownedHostError = "";
  let existingVirtuals: VirtualBoxInventory | null = null;
  let existingVirtualsError = "";
  // Temporary UI feedback, isolated by supported instance identity.
  let issues: Partial<Record<InstanceId, UiIssue>> = {};
  let notices: Partial<Record<InstanceId, UiNotice>> = {};
  let moveSide: MoveSide = "LEFT";
  let checkStatusButton: HTMLButtonElement | undefined;
  let settingsBackButton: HTMLButtonElement | undefined;
  let client02DetailPanel: HTMLDivElement | undefined;
  let disclosureTrigger: HTMLButtonElement | null = null;
  // UI-only revision: IPC completion must not undo later user navigation.
  let navigationRevision = 0;

  // Balanced policy is the current actual behavior, not a game FPS/RAM limit.
  // All expensive helpers are explicitly requested and serialized by the UI.
  $: resourceOperationBusy = isResourceOperationBusy(busy, ownedHostBusy, ownedInspectionBusy);
  $: base02 = client02Presentation(observation, selectedExecutable, licenseConfirmed);
  $: issue01 = issues["01"] ?? null;
  $: issue02 = issues["02"] ?? null;
  $: notice01 = notices["01"] ?? null;
  $: notice02 = notices["02"] ?? null;
  $: row01 = rowPresentation("01", observation !== undefined, base02, busy, issue01, notice01);
  $: row02 = rowPresentation("02", observation !== undefined, base02, busy, issue02, notice02);
  $: moveEligible = Boolean(observation && focusCandidate(observation) && base02.canMove);

  function closeDetails() {
    navigationRevision += 1;
    const origin = disclosureTrigger;
    expanded = null;
    disclosureTrigger = null;
    // Async operations may resolve after the user navigates to Settings.
    // Never steal focus from Settings or a different newly opened panel.
    void tick().then(() => {
      if (page !== "instances" || expanded !== null) return;
      if (origin?.isConnected && !origin.disabled) origin.focus();
      else if (checkStatusButton?.isConnected && !checkStatusButton.disabled) checkStatusButton.focus();
    });
  }

  function showSettings() {
    navigationRevision += 1;
    page = "settings";
    void tick().then(() => {
      if (page === "settings" && settingsBackButton?.isConnected) settingsBackButton.focus();
    });
  }

  function showInstances() {
    navigationRevision += 1;
    page = "instances";
    void tick().then(() => {
      if (page === "instances" && checkStatusButton?.isConnected && !checkStatusButton.disabled) checkStatusButton.focus();
    });
  }

  function openClient02DetailsFromSettings(mode: "setup" | "move") {
    navigationRevision += 1;
    page = "instances";
    expanded = "02";
    detailMode = mode;
    disclosureTrigger = null;
    // Settings' action is removed when the page changes. Focus the region
    // deliberately so Tab continues into the actual setup/move controls.
    void tick().then(() => {
      if (page === "instances" && expanded === "02" && detailMode === mode && client02DetailPanel?.isConnected) {
        client02DetailPanel.focus();
      }
    });
  }

  function showClient02MoveDetails() {
    if (page !== "instances" || expanded !== "02" || !moveEligible) return;
    // Inline mode changes are navigation too: late IPC results must not
    // override a Move panel selected after their request began.
    navigationRevision += 1;
    detailMode = "move";
  }

  function expandDetails(instance: InstanceId, mode: DetailMode, origin: HTMLButtonElement) {
    navigationRevision += 1;
    disclosureTrigger = origin;
    expanded = instance;
    detailMode = mode;
  }

  function toggleDetails(instance: InstanceId, mode: DetailMode, origin: HTMLButtonElement) {
    if (expanded === instance && detailMode === mode) closeDetails();
    else expandDetails(instance, mode, origin);
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape" || event.defaultPrevented || page !== "instances" || expanded === null) return;
    event.preventDefault();
    closeDetails();
  }

  function invalidateCurrentInspection() {
    observation = undefined;
    lastCheckIsCurrent = false;
  }

  function clearFeedback(instance: InstanceId) {
    issues = { ...issues, [instance]: undefined };
    notices = { ...notices, [instance]: undefined };
  }

  function reportIssue(instance: InstanceId, title: string, message: string, error: unknown, requestRevision: number, origin?: UiIssue["origin"]) {
    issues = { ...issues, [instance]: {
      instance, title, message,
      details: error === undefined ? undefined : safeErrorDetails(error),
      ...(origin ? { origin } : {}),
    } };
    notices = { ...notices, [instance]: undefined };
    // Do not replace a detail panel owned by the other client.
    if (page === "instances" && requestRevision === navigationRevision &&
        (expanded === null || expanded === instance)) {
      disclosureTrigger = null;
      expanded = instance;
      detailMode = "issue";
    }
  }

  async function checkStatus() {
    if (isResourceOperationBusy(busy, ownedHostBusy, ownedInspectionBusy)) return;
    const requestRevision = navigationRevision;
    busy = "check";
    clearFeedback("02");
    invalidateCurrentInspection();
    try {
      const result = await nativeFeasibility.inspectIsolatedClient02();
      observation = result;
      lastCheck = new Date();
      lastCheckIsCurrent = true;
      // Client 02 inspection cannot dismiss Client 01's expanded issue.
      if (page === "instances" && requestRevision === navigationRevision &&
          expanded === "02" && detailMode === "issue") expanded = null;
    } catch (error) {
      reportIssue("02", "Couldn't check status",
        "The app couldn't confirm the instance status. Review Sandboxie Plus, then check again.", error, requestRevision);
    } finally {
      busy = "";
    }
  }

  async function openMinecraft01() {
    if (isResourceOperationBusy(busy, ownedHostBusy, ownedInspectionBusy)) return;
    const requestRevision = navigationRevision;
    busy = "open-01";
    clearFeedback("01");
    invalidateCurrentInspection();
    try {
      await nativeFeasibility.openOfficialMinecraft();
      notices = { ...notices, "01": { instance: "01", text: "Open requested" } };
    } catch (error) {
      reportIssue("01", "Couldn't confirm if Minecraft opened",
        "Check for an existing Minecraft window before trying again.", error, requestRevision);
    } finally {
      busy = "";
    }
  }

  async function selectMinecraft() {
    if (isResourceOperationBusy(busy, ownedHostBusy, ownedInspectionBusy)) return;
    const requestRevision = navigationRevision;
    busy = "select";
    try {
      const selected = await nativeFeasibility.selectEducationExe();
      if (selected && selected !== selectedExecutable) {
        selectedExecutable = selected;
        licenseConfirmed = false;
      }
      // Only a prior picker failure is resolved by choosing a file; ambiguous
      // launch/inspection errors remain until a relevant recheck.
      if (shouldClearPickerIssue(issues["02"], selected)) {
        issues = { ...issues, "02": undefined };
      }
      // Cancelled picker is not evidence that a previous issue was resolved.
      // A completed picker must not redirect a different newly opened panel.
      if (selected && page === "instances" && requestRevision === navigationRevision && expanded === "02") {
        detailMode = "setup";
      }
    } catch (error) {
      reportIssue("02", "Couldn't select Minecraft",
        "Choose the official Minecraft Education Desktop executable.", error, requestRevision, "executable-picker");
    } finally {
      busy = "";
    }
  }

  async function openMinecraft02() {
    if (isResourceOperationBusy(busy, ownedHostBusy, ownedInspectionBusy) || !observation || !selectedExecutable || !licenseConfirmed || base02.action !== "open") return;
    const requestRevision = navigationRevision;
    const requestedPanel = expanded;
    const requestedMode = detailMode;
    busy = "open-02";
    clearFeedback("02");
    invalidateCurrentInspection();
    try {
      await nativeFeasibility.requestSandboxClient02(selectedExecutable, licenseConfirmed);
      notices = { ...notices, "02": { instance: "02", text: "Open requested" } };
      if (page === "instances" && requestRevision === navigationRevision &&
          requestedPanel === "02" && expanded === requestedPanel && detailMode === requestedMode) {
        closeDetails();
      }
    } catch (error) {
      reportIssue("02", "Couldn't confirm if Minecraft opened",
        "Check status before trying to open another copy.", error, requestRevision);
    } finally {
      busy = "";
    }
  }

  async function switchMinecraft02() {
    const target = focusCandidate(observation);
    if (isResourceOperationBusy(busy, ownedHostBusy, ownedInspectionBusy) || !target || base02.action !== "switch") return;
    const requestRevision = navigationRevision;
    busy = "switch";
    clearFeedback("02");
    try {
      await nativeFeasibility.focusObservedClient02(target);
      // A focus request does not invalidate the observed target or disable further switching.
      // The backend revalidates process and window identity on every attempt.
      // Only Client 02 feedback was reset when Focus started.
    } catch (error) {
      invalidateCurrentInspection();
      reportIssue("02", "Couldn't switch to Minecraft",
        "The window may have changed. Check status or select it with Alt+Tab.", error, requestRevision);
    } finally {
      busy = "";
    }
  }

  async function moveMinecraft02() {
    const target = focusCandidate(observation);
    if (isResourceOperationBusy(busy, ownedHostBusy, ownedInspectionBusy) || !target || !base02.canMove) return;
    const requestRevision = navigationRevision;
    const requestedPanel = expanded;
    const requestedMode = detailMode;
    busy = "move";
    clearFeedback("02");
    try {
      await nativeFeasibility.placeObservedClient02(target, moveSide);
      notices = { ...notices, "02": { instance: "02", text: "Move requested" } };
      if (page === "instances" && requestRevision === navigationRevision &&
          requestedPanel === "02" && expanded === requestedPanel && detailMode === requestedMode) {
        closeDetails();
      }
    } catch (error) {
      invalidateCurrentInspection();
      reportIssue("02", "Couldn't move window",
        "Check status before trying again. If Minecraft is maximized or minimized, restore it to a normal window.", error, requestRevision);
    } finally {
      busy = "";
    }
  }

  function choosePrimary(id: InstanceId, origin: HTMLButtonElement) {
    const action = id === "01" ? row01.action : row02.action;
    if (isResourceOperationBusy(busy, ownedHostBusy, ownedInspectionBusy)) return;
    if (id === "01" && action === "open") { void openMinecraft01(); return; }
    if (id === "02" && action === "open") { void openMinecraft02(); return; }
    if (id === "02" && action === "switch") { void switchMinecraft02(); return; }
    // "View issue" must never close the issue when it is already visible.
    if (action === "issue") { expandDetails(id, "issue", origin); return; }
    if (action === "setup") toggleDetails(id, "setup", origin);
  }

  async function discoverExistingVirtuals() {
    if (isResourceOperationBusy(busy, ownedHostBusy, ownedInspectionBusy) || ownedHostBusy || ownedInspectionBusy) return;
    busy = "discover-virtuals";
    existingVirtuals = null;
    existingVirtualsError = "";
    try {
      existingVirtuals = await nativeFeasibility.discoverExistingVirtuals();
    } catch {
      // No invented empty inventory: a failed query is unknown, not zero boxes.
      existingVirtualsError = "Could not verify existing sandbox names. No virtuals were changed.";
    } finally {
      busy = "";
    }
  }

  async function inspectOwnedServiceNames() {
    if (isResourceOperationBusy(busy, ownedHostBusy, ownedInspectionBusy) || ownedHostBusy || ownedInspectionBusy) return;
    ownedHostBusy = true;
    ownedHostInspection = null;
    ownedHostError = "";
    try {
      ownedHostInspection = await nativeFeasibility.inspectOwnedHost();
    } catch {
      ownedHostError = "Windows service name inspection was inconclusive; engine activation remains blocked.";
    } finally {
      ownedHostBusy = false;
    }
  }

  async function inspectStagedOwnedEngine() {
    if (isResourceOperationBusy(busy, ownedHostBusy, ownedInspectionBusy) || ownedInspectionBusy) return;
    ownedInspectionBusy = true;
    ownedCandidate = null;
    ownedInspectionError = "";
    try {
      const directory = await nativeFeasibility.selectOwnedCandidateDirectory();
      if (!directory) return;
      ownedCandidate = await nativeFeasibility.inspectOwnedCandidate(directory);
    } catch {
      // Keep sensitive local filesystem paths and error details out of UI.
      ownedInspectionError = "Candidate integrity could not be verified. No engine was activated.";
    } finally {
      ownedInspectionBusy = false;
    }
  }

  function primaryLabel(action: string | null) {
    if (action === "open") return "Open";
    if (action === "switch") return "Switch to";
    if (action === "setup") return "Set up";
    if (action === "issue") return "View issue";
    return "";
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />
<div class="cm-shell">
  <main class="cm-content">
    {#if page === "instances"}
      <header class="cm-toolbar">
        <h1>Virtual Manager</h1>
        <div class="cm-toolbar-actions">
          <button class="cm-button cm-secondary" type="button" bind:this={checkStatusButton} disabled={resourceOperationBusy} on:click={checkStatus}>
            <span class="cm-refresh-icon" aria-hidden="true">↻</span>
            {busy === "check" ? "Checking…" : "Check status"}
          </button>
          <button class="cm-button cm-quiet" type="button" on:click={showSettings}>Settings</button>
        </div>
      </header>

      <section class="cm-virtual-overview" aria-label="Create virtual availability">
        <div>
          <h2>Your virtuals</h2>
          <p>Use this app to manage Windows and isolated sessions. The internal Sandboxie-derived engine must pass Windows driver and service validation before new virtuals can be created.</p>
        </div>
        <div class="cm-virtual-actions">
          <button type="button" class="cm-button cm-secondary" disabled
            title="Internal isolation engine is not yet installed and verified">Create virtual</button>
          <button type="button" class="cm-button cm-secondary" disabled={resourceOperationBusy}
            on:click={discoverExistingVirtuals}>
            {busy === "discover-virtuals" ? "Checking…" : "Find existing virtuals"}
          </button>
          <button type="button" class="cm-button cm-secondary"
            disabled={resourceOperationBusy}
            on:click={inspectOwnedServiceNames}>
            {ownedHostBusy ? "Checking engine…" : "Check engine readiness"}
          </button>
        </div>
      </section>
      <section class="cm-create-readiness" aria-label="Create virtual requirements">
        <p aria-live="polite">{ownedHostError || ownedVirtualCreationReason(ownedHostInspection)}</p>
        <details>
          <summary>Supported owned virtuals</summary>
          <p>The current internal Minecraft preset supports three separate persistent boxes: MivubiEdu02, MivubiEdu03 and MivubiEdu04. General custom names are not yet supported by its kernel policy. These virtuals have not been created.</p>
          <p>Minecraft login compatibility uses reduced process/COM isolation and requires explicit approval once the engine is operational.</p>
        </details>
      </section>
      {#if existingVirtuals}
        <section class="cm-existing-virtuals" aria-label="Existing Sandboxie virtual names">
          <h3>Existing Sandboxie boxes (read-only)</h3>
          <p>These names come from the installed Sandboxie compatibility pilot, not the MIVUBI-owned engine. Detection does not mean a game is running.</p>
          {#if existingVirtuals.boxes.length === 0}
            <p>No enabled boxes were reported for the current Windows user.</p>
          {:else}
            <ul>
              {#each existingVirtuals.boxes as boxName (boxName)}
                <li>{boxName}</li>
              {/each}
            </ul>
          {/if}
        </section>
      {/if}
      {#if existingVirtualsError}
        <p class="cm-warning cm-existing-error" role="alert">{existingVirtualsError}</p>
      {/if}
      <section class="cm-list" aria-label="Virtual sessions">
        <div class="cm-instance">
          <div class="cm-row">
            <span class="cm-monitor" aria-hidden="true"></span>
            <div class="cm-row-copy">
              <h2>Host · Minecraft 01</h2>
              <p class={row01.tone === "warning" ? "cm-warning" : ""} aria-live="polite">{row01.status}</p>
            </div>
            <div class="cm-row-actions">
              {#if row01.action}
                <button class="cm-button cm-primary" type="button" disabled={resourceOperationBusy}
                  on:click={(event) => choosePrimary("01", event.currentTarget)} aria-expanded={row01.action === "issue" ? expanded === "01" : undefined} aria-controls={row01.action === "issue" ? "cm-details-01" : undefined}>{primaryLabel(row01.action)}</button>
              {/if}
              {#if issue01}
                <button class="cm-link" type="button" aria-expanded={expanded === "01"} aria-controls="cm-details-01" on:click={(event) => toggleDetails("01", "issue", event.currentTarget)}>Details</button>
              {/if}
            </div>
          </div>
          {#if expanded === "01"}
            <div id="cm-details-01" class="cm-detail" role="region" aria-label="Minecraft 01 details">
              {#if issue01}
                <h3>{issue01.title}</h3>
                <p>{issue01.message}</p>
                {#if issue01.details}<details><summary>Advanced details</summary><p class="cm-technical">{issue01.details}</p></details>{/if}
              {:else}
                <h3>About Minecraft 01</h3>
                <p>Opens the official Minecraft Education app on this PC. The manager does not check account sign-in or gameplay.</p>
              {/if}
              <button class="cm-link" type="button" on:click={closeDetails}>Close details</button>
            </div>
          {/if}
        </div>

        <div class="cm-instance">
          <div class="cm-row">
            <span class="cm-monitor" aria-hidden="true"></span>
            <div class="cm-row-copy">
              <h2>Virtual 02 · Minecraft Education</h2>
              <p class={row02.tone === "warning" ? "cm-warning" : ""} aria-live="polite">{row02.status}</p>
            </div>
            <div class="cm-row-actions">
              {#if row02.action}
                <button type="button" class="cm-button cm-primary" disabled={resourceOperationBusy}
                  on:click={(event) => choosePrimary("02", event.currentTarget)} aria-expanded={row02.action === "issue" || row02.action === "setup" ? expanded === "02" : undefined} aria-controls={row02.action === "issue" || row02.action === "setup" ? "cm-details-02" : undefined}>{primaryLabel(row02.action)}</button>
              {/if}
              {#if row02.action === "switch" || expanded === "02"}
                <button class="cm-link" type="button" aria-expanded={expanded === "02"}
                  aria-controls="cm-details-02" on:click={(event) => toggleDetails("02", row02.action === "switch" ? "move" : "info", event.currentTarget)}>Details</button>
              {/if}
            </div>
          </div>

          {#if expanded === "02"}
            <div id="cm-details-02" class="cm-detail" role="region" aria-label="Minecraft 02 details" tabindex="-1" bind:this={client02DetailPanel}>
              {#if detailMode === "issue"}
                <h3>{issue02 ? issue02.title : base02.status}</h3>
                <p>{issue02 ? issue02.message : base02.details}</p>
                <p class="cm-assist">Use Check status in the toolbar to inspect the current Windows session.</p>
                {#if issue02?.details}
                  <details><summary>Advanced details</summary><p class="cm-technical">{issue02.details}</p></details>
                {:else if observation}
                  <details><summary>Advanced details</summary>
                    <p class="cm-technical">Box: {observation.boxConfigured}; membership: {observation.membershipStatus}; settings: {observation.boxSettingsSource}.</p>
                  </details>
                {/if}
              {:else if detailMode === "setup"}
                <h3>{setupInstruction(observation).title}</h3>
                <p>{setupInstruction(observation).text}</p>
                {#if !observation || !isSandboxieBoxPrepared(observation)}
                  <p class="cm-assist">The current pilot uses an existing Sandboxie Plus box. MIVUBI-owned virtual creation requires a tested internal driver and service; this setup will not change an existing box.</p>
                  <details><summary>Sandboxie Plus settings</summary>
                    <p>Create and enable the persistent MinecraftClient02 box. Keep AutoDelete, AutoRemove and credential-bypass/protected-storage settings off. Never copy another Minecraft account profile.</p>
                  </details>
                {:else}
                  <div class="cm-field">
                    <span class="cm-field-label">Installed Minecraft Education</span>
                    <div class="cm-field-row">
                      <span class="cm-file-state">{selectedExecutable ? "Minecraft selected" : "No installation selected"}</span>
                      <button class="cm-button cm-secondary" type="button" disabled={resourceOperationBusy} on:click={selectMinecraft}>Browse…</button>
                    </div>
                  </div>
                  <label class="cm-checkbox">
                    <input type="checkbox" bind:checked={licenseConfirmed} disabled={resourceOperationBusy}/>
                    I confirm Sandboxie Plus is licensed for this use and MinecraftClient02 is a persistent box.
                  </label>
                  <p class="cm-assist">Sign in separately in each Minecraft window. This app never requests Microsoft credentials.</p>
                {/if}
              {:else if detailMode === "move" && moveEligible}
                <h3>Move window</h3>
                <p>Choose where Minecraft 02 should appear on its current monitor.</p>
                <div class="cm-side-choices" role="group" aria-label="Window position">
                  <button type="button" class:cm-selected={moveSide === "LEFT"} aria-pressed={moveSide === "LEFT"} on:click={() => (moveSide = "LEFT")}>Left</button>
                  <button type="button" class:cm-selected={moveSide === "RIGHT"} aria-pressed={moveSide === "RIGHT"} on:click={() => (moveSide = "RIGHT")}>Right</button>
                </div>
                <button class="cm-button cm-primary" type="button" disabled={resourceOperationBusy} on:click={moveMinecraft02}>Apply</button>
                <p class="cm-assist">Only Minecraft 02 is moved. Restore a maximized or minimized window before applying.</p>
              {:else}
                <h3>About Minecraft 02</h3>
                <p>{base02.details}</p>
                <p class="cm-assist">Runtime: existing Sandboxie Plus pilot. MIVUBI-owned engine is not active.</p>
                {#if moveEligible}<button class="cm-button cm-secondary" type="button" on:click={showClient02MoveDetails}>Move window</button>{/if}
              {/if}
              <div class="cm-detail-footer">
                <button class="cm-link" type="button" on:click={closeDetails}>Close details</button>
              </div>
            </div>
          {/if}
        </div>
      </section>
      <footer class="cm-footer">
        {#if lastCheck}
          {lastCheckIsCurrent ? "Last checked:" : "Previous check:"}
          {lastCheck.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          {#if !lastCheckIsCurrent} · Status may have changed{/if}
        {:else}
          Status not checked this session
        {/if}
      </footer>
    {:else}
      <header class="cm-toolbar">
        <h1>Settings</h1>
        <button class="cm-button cm-secondary" type="button" bind:this={settingsBackButton} on:click={showInstances}>Back to Virtuals</button>
      </header>
      <section class="cm-settings" aria-label="Application settings">
        <div class="cm-setting-group">
          <h2>Minecraft setup</h2>
          <p>Choose the official Minecraft Education Desktop installation for Minecraft 02.</p>
          <button type="button" class="cm-button cm-secondary" on:click={() => openClient02DetailsFromSettings("setup")}>Set up Minecraft 02</button>
        </div>
        <div class="cm-setting-group">
          <h2>M-Isolation-Engine · Internal runtime</h2>
          <p>The Sandboxie-derived C/C++ core belongs to MIVUBI. Inspecting its packaged files is diagnostic only; a compiled, signed and installed engine is required before Create virtual can become available.</p>
          <button type="button" class="cm-button cm-secondary"
            disabled={resourceOperationBusy}
            on:click={inspectStagedOwnedEngine}>
            {ownedInspectionBusy ? "Inspecting candidate…" : "Inspect engine candidate"}
          </button>
          {#if ownedCandidate}
            <p aria-live="polite">Engine package {ownedCandidate.upstreamCommit === "cdba7096240b93d79c5373aa81a75a1c5c71b883" ? "v1.18.6" : "v1.18.5"}: checksums match {ownedCandidate.verifiedArtifactCount} declared files and source paths, with no additional entries observed. Files could change after inspection. This does not authenticate the build or prove driver compatibility. Not installable; the official Sandboxie provider remains active.</p>
          {/if}
          {#if ownedInspectionError}
            <p class="cm-warning" role="alert">{ownedInspectionError}</p>
          {/if}
          <button type="button" class="cm-button cm-secondary"
            disabled={resourceOperationBusy}
            on:click={inspectOwnedServiceNames}>
            {ownedHostBusy ? "Inspecting Windows…" : "Check engine service names"}
          </button>
          {#if ownedHostInspection}
            <p aria-live="polite">Host: {ownedHostInspection.state.replaceAll("_", " ")}. Engine activation remains blocked.</p>
          {/if}
          {#if ownedHostError}<p class="cm-warning" role="alert">{ownedHostError}</p>{/if}
        </div>
        <div class="cm-setting-group">
          <h2>Window preferences</h2>
          <p>Move a detected Minecraft 02 window using its instance details. Other layouts are not available yet.</p>
          {#if moveEligible}<button type="button" class="cm-button cm-secondary" on:click={() => openClient02DetailsFromSettings("move")}>Move window</button>{/if}
        </div>
        <div class="cm-setting-group">
          <h2>Help</h2>
          <p>Use Check status to inspect your setup. Minecraft sign-in remains inside the official game.</p>
          <details>
            <summary>Advanced details</summary>
            <p>Host 01: Windows installation. Virtual 02: existing persistent Sandboxie Plus box MinecraftClient02. New virtual creation is not yet active.</p>
            <p>Process observations do not confirm accounts or playable worlds. The manager never copies credentials or game worlds.</p>
          </details>
        </div>
      </section>
    {/if}
  </main>
</div>
