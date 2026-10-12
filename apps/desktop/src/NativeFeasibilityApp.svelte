<script lang="ts">
  import {
    nativeFeasibility,
    type NativeProcessObservation,
  } from "./app/bridge/nativeFeasibilityApi.js";

  let opening = false;
  let inspecting = false;
  let launchMessage = "";
  let inspectError = "";
  let launchError = "";
  let observation: NativeProcessObservation | undefined;

  const slots = [
    { title: "Client 01", description: "Official Minecraft Education desktop launch" },
    { title: "Client 02", description: "Independent account not verified" },
    { title: "Client 03", description: "Independent account not verified" },
    { title: "Client 04", description: "Independent account not verified" },
  ] as const;

  $: processCandidates = observation?.candidates.length ?? null;
  $: visibleCandidates = observation
    ? observation.candidates.filter((item) => item.windowHandle !== null).length
    : null;

  function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Windows observation is unavailable.";
  }

  async function inspectWindows() {
    if (inspecting || opening) return;
    inspecting = true;
    inspectError = "";
    try {
      observation = await nativeFeasibility.inspectCandidates();
    } catch (error) {
      observation = undefined;
      inspectError = errorMessage(error);
    } finally {
      inspecting = false;
    }
  }

  async function launchOfficialMinecraft() {
    if (opening || inspecting) return;
    opening = true;
    launchMessage = "";
    launchError = "";
    // Old observations must never be reused as evidence after a launch.
    observation = undefined;
    try {
      await nativeFeasibility.openOfficialMinecraft();
      launchMessage = "Windows received an official launch request. It may reopen the existing game instead of creating another process. Inspect windows after the game has appeared.";
    } catch (error) {
      launchError = errorMessage(error);
    } finally {
      opening = false;
    }
  }
</script>

<div class="app-shell">
  <aside class="rail">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
      <div><strong>MIVUBI Launcher</strong><span>Native-first pilot</span></div>
    </div>
    <div class="pilot-sidebar">
      <strong>Development mode</strong>
      <p>Legacy VM controls are paused. Existing guest disks, worlds, and account data are preserved.</p>
    </div>
  </aside>

  <main>
    <header class="topbar">
      <h1>Minecraft Education · Multi-instance feasibility</h1>
      <span class="pilot-label">NOT GAMEPLAY VERIFIED</span>
    </header>
    <div class="pilot-main">
      <section class="pilot-intro">
        <span class="eyebrow">ACTIVE DEVELOPMENT ROUTE</span>
        <h2>One Windows PC. Four separate accounts.</h2>
        <p>The goal is four independently playable Minecraft Education sessions from one official installation. We must first confirm whether Windows can show two separate game processes, and whether two licensed Microsoft accounts stay independent.</p>
        <div class="pilot-actions">
          <button class="pilot-primary" disabled={opening || inspecting} on:click={launchOfficialMinecraft}>
            {opening ? "Requesting launch…" : "Request official Minecraft launch"}
          </button>
          <button class="pilot-secondary" disabled={opening || inspecting} on:click={inspectWindows}>
            {inspecting ? "Inspecting…" : "Inspect Windows (read-only)"}
          </button>
        </div>
        {#if launchMessage}<p class="pilot-info" role="status">{launchMessage}</p>{/if}
        {#if launchError}<p class="pilot-error" role="alert">{launchError}</p>{/if}
        {#if inspectError}<p class="pilot-error" role="alert">Inspection unavailable: {inspectError}</p>{/if}
      </section>

      <section class="pilot-section" aria-label="Native process observations">
        <span class="eyebrow">WINDOWS PROCESS OBSERVATION</span>
        {#if observation}
          <div class="pilot-counts" role="status">
            <div><strong>{processCandidates}</strong><span>Name-matched process candidates</span></div>
            <div><strong>{visibleCandidates}</strong><span>Candidates with visible windows</span></div>
          </div>
          <p class="pilot-caution">
            {observation.interactiveSession
              ? "Observed in the current interactive Windows session."
              : "The observation did not originate from an interactive Windows desktop."}
            {visibleCandidates !== null && visibleCandidates >= 2
              ? " Two window candidates exist, but account isolation and playable worlds are still UNKNOWN."
              : " Two independent game windows have NOT been established."}
          </p>
        {:else}
          <p class="pilot-caution">No current inspection. Use Inspect Windows after the game opens. Counts are never treated as evidence of signed-in Minecraft accounts.</p>
        {/if}
      </section>

      <section class="pilot-section">
        <span class="eyebrow">FOUR-CLIENT PRODUCT TARGET</span>
        <div class="pilot-grid">
          {#each slots as slot, index}
            <article class="pilot-slot">
              <strong>{slot.title}</strong>
              <p>{slot.description}</p>
              <span>{index === 0 ? "Official launch only · gameplay unverified" : "Disabled · independent session unverified"}</span>
            </article>
          {/each}
        </div>
      </section>

      <section class="pilot-section pilot-boundary">
        <span class="eyebrow">NEXT EVIDENCE GATE</span>
        <h3>Two signed-in games before a four-account launcher</h3>
        <p>Inspect is read-only and records no email addresses, passwords, Microsoft tokens, world names, process command lines or executable paths. Actual login, game rendering, input and persistence still require independently reviewed observations inside Minecraft.</p>
        <p>The Sandboxie feasibility experiment is a separate fallback; this screen does not install or launch Sandboxie, power on VMs, alter account profiles or perform recovery.</p>
      </section>
    </div>
  </main>
</div>

<style>
  .pilot-sidebar { border-top: 1px solid rgba(255,255,255,.09); padding: 20px 10px; font-size: 12px; color: #b4becb; }
  .pilot-sidebar p { font-size: 11px; color: #828c9d; line-height: 1.65; }
  .pilot-label { border:1px solid #605035; background:#2e2519; color:#e5c48d; padding:5px 10px; border-radius:20px; font-size:10px; font-weight:700; }
  .pilot-main { display:grid; gap:24px; padding:34px; max-width:1120px; }
  .pilot-intro,.pilot-section { border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:26px; background:#10141c; }
  .pilot-intro h2 { font-size:26px; margin:12px 0; }
  .pilot-intro p,.pilot-boundary p { color:#9ca9ba; max-width:760px; line-height:1.75; }
  .pilot-actions { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-top:16px; }
  .pilot-primary,.pilot-secondary { display:inline-block; padding:12px 18px; border-radius:9px; font-weight:750; cursor:pointer; }
  .pilot-primary { border:none; background:#949eff; color:#10121b; }
  .pilot-secondary { border:1px solid rgba(255,255,255,.25); background:#212938; color:#f3f5f9; }
  .pilot-primary:disabled,.pilot-secondary:disabled { opacity:.5; cursor:not-allowed; }
  .pilot-primary:focus-visible,.pilot-secondary:focus-visible { outline:2px solid white; outline-offset:2px; }
  .pilot-info { color:#a4dabc !important; }
  .pilot-error { color:#f3aaa5 !important; }
  .pilot-counts { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:16px; }
  .pilot-counts > div { display:flex; flex-direction:column; gap:4px; padding:16px; border-radius:12px; background:#191e28; }
  .pilot-counts strong { font-size:26px; }
  .pilot-counts span { color:#a0acbb; font-size:12px; }
  .pilot-caution { color:#b7a37e; font-size:12px; line-height:1.7; margin-top:16px; }
  .pilot-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:15px; }
  .pilot-slot { padding:18px; border-radius:12px; background:#191e28; border:1px solid rgba(255,255,255,.06); }
  .pilot-slot strong { font-size:14px; }
  .pilot-slot p { color:#a0acbb; font-size:12px; }
  .pilot-slot span { color:#7f8c9a; font-size:11px; }
  .pilot-boundary h3 { margin:12px 0; }
  @media(max-width:740px) { .pilot-grid,.pilot-counts { grid-template-columns:1fr; } .pilot-main { padding:16px; } }
</style>
