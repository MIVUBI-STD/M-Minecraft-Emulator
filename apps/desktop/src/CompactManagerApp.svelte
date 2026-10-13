<script lang="ts">
  import { tick } from "svelte";
  import {
    nativeFeasibility,
    isSandboxieBoxPrepared,
    type IsolatedClientObservation,
  } from "./app/bridge/nativeFeasibilityApi.js";
  import {
    client02Presentation,
    focusCandidate,
    rowPresentation,
    safeErrorDetails,
    setupInstruction,
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
  let issue: UiIssue | null = null;
  let notice: UiNotice | null = null;
  let moveSide: MoveSide = "LEFT";
  let checkStatusButton: HTMLButtonElement | undefined;
  let settingsBackButton: HTMLButtonElement | undefined;
  let client02DetailPanel: HTMLDivElement | undefined;
  let disclosureTrigger: HTMLButtonElement | null = null;

  $: base02 = client02Presentation(observation, selectedExecutable, licenseConfirmed);
  $: row01 = rowPresentation("01", observation !== undefined, base02, busy, issue, notice);
  $: row02 = rowPresentation("02", observation !== undefined, base02, busy, issue, notice);
  $: moveEligible = Boolean(observation && focusCandidate(observation) && base02.canMove);

  function closeDetails() {
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
    page = "settings";
    void tick().then(() => {
      if (page === "settings" && settingsBackButton?.isConnected) settingsBackButton.focus();
    });
  }

  function showInstances() {
    page = "instances";
    void tick().then(() => {
      if (page === "instances" && checkStatusButton?.isConnected && !checkStatusButton.disabled) checkStatusButton.focus();
    });
  }

  function openClient02DetailsFromSettings(mode: "setup" | "move") {
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

  function expandDetails(instance: InstanceId, mode: DetailMode, origin: HTMLButtonElement) {
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

  function reportIssue(instance: InstanceId, title: string, message: string, error?: unknown) {
    issue = { instance, title, message, details: error === undefined ? undefined : safeErrorDetails(error) };
    disclosureTrigger = null;
    notice = null;
    expanded = instance;
    detailMode = "issue";
  }

  async function checkStatus() {
    if (busy) return;
    busy = "check";
    issue = null;
    notice = null;
    invalidateCurrentInspection();
    try {
      const result = await nativeFeasibility.inspectIsolatedClient02();
      observation = result;
      lastCheck = new Date();
      lastCheckIsCurrent = true;
      if (detailMode === "issue") expanded = null;
    } catch (error) {
      reportIssue("02", "Couldn't check status",
        "The app couldn't confirm the instance status. Review Sandboxie Plus, then check again.", error);
    } finally {
      busy = "";
    }
  }

  async function openMinecraft01() {
    if (busy) return;
    busy = "open-01";
    issue = null;
    notice = null;
    invalidateCurrentInspection();
    try {
      await nativeFeasibility.openOfficialMinecraft();
      notice = { instance: "01", text: "Open requested" };
    } catch (error) {
      reportIssue("01", "Couldn't confirm if Minecraft opened",
        "Check for an existing Minecraft window before trying again.", error);
    } finally {
      busy = "";
    }
  }

  async function selectMinecraft() {
    if (busy) return;
    busy = "select";
    try {
      const selected = await nativeFeasibility.selectEducationExe();
      if (selected && selected !== selectedExecutable) {
        selectedExecutable = selected;
        licenseConfirmed = false;
      }
      issue = null;
      detailMode = "setup";
    } catch (error) {
      reportIssue("02", "Couldn't select Minecraft",
        "Choose the official Minecraft Education Desktop executable.", error);
    } finally {
      busy = "";
    }
  }

  async function openMinecraft02() {
    if (busy || !observation || !selectedExecutable || !licenseConfirmed || base02.action !== "open") return;
    busy = "open-02";
    issue = null;
    notice = null;
    invalidateCurrentInspection();
    try {
      await nativeFeasibility.requestSandboxClient02(selectedExecutable, licenseConfirmed);
      notice = { instance: "02", text: "Open requested" };
      closeDetails();
    } catch (error) {
      reportIssue("02", "Couldn't confirm if Minecraft opened",
        "Check status before trying to open another copy.", error);
    } finally {
      busy = "";
    }
  }

  async function switchMinecraft02() {
    const target = focusCandidate(observation);
    if (busy || !target || base02.action !== "switch") return;
    busy = "switch";
    issue = null;
    notice = null;
    try {
      await nativeFeasibility.focusObservedClient02(target);
      // A focus request does not invalidate the observed target or disable further switching.
      // The backend revalidates process and window identity on every attempt.
      notice = null;
    } catch (error) {
      invalidateCurrentInspection();
      reportIssue("02", "Couldn't switch to Minecraft",
        "The window may have changed. Check status or select it with Alt+Tab.", error);
    } finally {
      busy = "";
    }
  }

  async function moveMinecraft02() {
    const target = focusCandidate(observation);
    if (busy || !target || !base02.canMove) return;
    busy = "move";
    issue = null;
    notice = null;
    try {
      await nativeFeasibility.placeObservedClient02(target, moveSide);
      notice = { instance: "02", text: "Move requested" };
      closeDetails();
    } catch (error) {
      invalidateCurrentInspection();
      reportIssue("02", "Couldn't move window",
        "Restore Minecraft to a normal window, then check status and try again.", error);
    } finally {
      busy = "";
    }
  }

  function choosePrimary(id: InstanceId, origin: HTMLButtonElement) {
    const action = id === "01" ? row01.action : row02.action;
    if (busy) return;
    if (id === "01" && action === "open") { void openMinecraft01(); return; }
    if (id === "02" && action === "open") { void openMinecraft02(); return; }
    if (id === "02" && action === "switch") { void switchMinecraft02(); return; }
    // "View issue" must never close the issue when it is already visible.
    if (action === "issue") { expandDetails(id, "issue", origin); return; }
    if (action === "setup") toggleDetails(id, "setup", origin);
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
        <h1>Instances</h1>
        <div class="cm-toolbar-actions">
          <button class="cm-button cm-secondary" type="button" bind:this={checkStatusButton} disabled={Boolean(busy)} on:click={checkStatus}>
            <span class="cm-refresh-icon" aria-hidden="true">↻</span>
            {busy === "check" ? "Checking…" : "Check status"}
          </button>
          <button class="cm-button cm-quiet" type="button" on:click={showSettings}>Settings</button>
        </div>
      </header>

      <section class="cm-list" aria-label="Minecraft instances">
        <div class="cm-instance">
          <div class="cm-row">
            <span class="cm-monitor" aria-hidden="true"></span>
            <div class="cm-row-copy">
              <h2>Minecraft 01</h2>
              <p class={row01.tone === "warning" ? "cm-warning" : ""} aria-live="polite">{row01.status}</p>
            </div>
            <div class="cm-row-actions">
              {#if row01.action}
                <button class="cm-button cm-primary" type="button" disabled={Boolean(busy)}
                  on:click={(event) => choosePrimary("01", event.currentTarget)} aria-expanded={row01.action === "issue" ? expanded === "01" : undefined} aria-controls={row01.action === "issue" ? "cm-details-01" : undefined}>{primaryLabel(row01.action)}</button>
              {/if}
              {#if issue?.instance === "01"}
                <button class="cm-link" type="button" aria-expanded={expanded === "01"} aria-controls="cm-details-01" on:click={(event) => toggleDetails("01", "issue", event.currentTarget)}>Details</button>
              {/if}
            </div>
          </div>
          {#if expanded === "01"}
            <div id="cm-details-01" class="cm-detail" role="region" aria-label="Minecraft 01 details">
              {#if issue?.instance === "01"}
                <h3>{issue.title}</h3>
                <p>{issue.message}</p>
                {#if issue.details}<details><summary>Advanced details</summary><p class="cm-technical">{issue.details}</p></details>{/if}
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
              <h2>Minecraft 02</h2>
              <p class={row02.tone === "warning" ? "cm-warning" : ""} aria-live="polite">{row02.status}</p>
            </div>
            <div class="cm-row-actions">
              {#if row02.action}
                <button type="button" class="cm-button cm-primary" disabled={Boolean(busy)}
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
              {#if detailMode === "issue" || issue?.instance === "02"}
                <h3>{issue?.instance === "02" ? issue.title : base02.status}</h3>
                <p>{issue?.instance === "02" ? issue.message : base02.details}</p>
                <p class="cm-assist">Use Check status in the toolbar to inspect the current Windows session.</p>
                {#if issue?.details}
                  <details><summary>Advanced details</summary><p class="cm-technical">{issue.details}</p></details>
                {:else if observation}
                  <details><summary>Advanced details</summary>
                    <p class="cm-technical">Box: {observation.boxConfigured}; membership: {observation.membershipStatus}; settings: {observation.boxSettingsSource}.</p>
                  </details>
                {/if}
              {:else if detailMode === "setup"}
                <h3>{setupInstruction(observation).title}</h3>
                <p>{setupInstruction(observation).text}</p>
                {#if !observation || !isSandboxieBoxPrepared(observation)}
                  <p class="cm-assist">Complete this step in Windows or Sandboxie Plus, then use Check status in the toolbar.</p>
                  <details><summary>Sandboxie Plus settings</summary>
                    <p>Create and enable the persistent MinecraftClient02 box. Keep AutoDelete, AutoRemove and credential-bypass/protected-storage settings off. Never copy another Minecraft account profile.</p>
                  </details>
                {:else}
                  <div class="cm-field">
                    <span class="cm-field-label">Installed Minecraft Education</span>
                    <div class="cm-field-row">
                      <span class="cm-file-state">{selectedExecutable ? "Minecraft selected" : "No installation selected"}</span>
                      <button class="cm-button cm-secondary" type="button" disabled={Boolean(busy)} on:click={selectMinecraft}>Browse…</button>
                    </div>
                  </div>
                  <label class="cm-checkbox">
                    <input type="checkbox" bind:checked={licenseConfirmed} disabled={Boolean(busy)}/>
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
                <button class="cm-button cm-primary" type="button" disabled={Boolean(busy)} on:click={moveMinecraft02}>Apply</button>
                <p class="cm-assist">Only Minecraft 02 is moved. Restore a maximized or minimized window before applying.</p>
              {:else}
                <h3>About Minecraft 02</h3>
                <p>{base02.details}</p>
                <p class="cm-assist">Environment: Isolated · Sandboxie Plus.</p>
                {#if moveEligible}<button class="cm-button cm-secondary" type="button" on:click={() => (detailMode = "move")}>Move window</button>{/if}
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
        <button class="cm-button cm-secondary" type="button" bind:this={settingsBackButton} on:click={showInstances}>Back to Instances</button>
      </header>
      <section class="cm-settings" aria-label="Application settings">
        <div class="cm-setting-group">
          <h2>Minecraft setup</h2>
          <p>Choose the official Minecraft Education Desktop installation for Minecraft 02.</p>
          <button type="button" class="cm-button cm-secondary" on:click={() => openClient02DetailsFromSettings("setup")}>Set up Minecraft 02</button>
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
            <p>Instance 01: Windows installation. Instance 02: persistent Sandboxie Plus box MinecraftClient02.</p>
            <p>Process observations do not confirm accounts or playable worlds. The manager never copies credentials or game worlds.</p>
          </details>
        </div>
      </section>
    {/if}
  </main>
</div>
