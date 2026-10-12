<script lang="ts">
  import { desktop } from "./app/bridge/virtualClientsApi.js";

  let opening = false;
  let launchMessage = "";
  let launchError = "";

  const slots = [
    { title: "Client 01", description: "Official native Minecraft Education", available: true },
    { title: "Client 02", description: "Independent account unverified", available: false },
    { title: "Client 03", description: "Independent account unverified", available: false },
    { title: "Client 04", description: "Independent account unverified", available: false },
  ] as const;

  async function launchOfficialMinecraft() {
    if (opening) return;
    opening = true;
    launchMessage = "";
    launchError = "";
    try {
      await desktop.openNativeMinecraft();
      launchMessage = "Windows accepted the official launch request. A separate game process, signed-in account and playable world have NOT been verified.";
    } catch (error) {
      launchError = error instanceof Error ? error.message : "Official Minecraft launch could not be requested.";
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
      <p>Legacy VM controls are paused. Existing guest disks and account data are preserved.</p>
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
        <h2>One Windows PC. Four distinct accounts.</h2>
        <p>We are testing whether one official Minecraft Education Desktop installation can support independent accounts without additional Windows virtual machines. Four concurrent clients are a target, not a working feature.</p>
        <button class="pilot-primary" disabled={opening} on:click={launchOfficialMinecraft}>
          {opening ? "Requesting launch…" : "Open official Minecraft Education"}
        </button>
        {#if launchMessage}<p class="pilot-info" role="status">{launchMessage}</p>{/if}
        {#if launchError}<p class="pilot-error" role="alert">{launchError}</p>{/if}
      </section>

      <section class="pilot-section">
        <span class="eyebrow">FOUR CLIENT TARGET</span>
        <div class="pilot-grid">
          {#each slots as slot}
            <article class="pilot-slot">
              <strong>{slot.title}</strong>
              <p>{slot.description}</p>
              <span>{slot.available ? "Official launch request only" : "Disabled · waiting for compatibility evidence"}</span>
            </article>
          {/each}
        </div>
      </section>

      <section class="pilot-section pilot-boundary">
        <span class="eyebrow">CURRENT DEVELOPMENT BOUNDARY</span>
        <h3>Native feasibility first, application isolation second</h3>
        <p>The native and Sandboxie experiments remain explicit, separately collected Windows tests. This screen does not launch Sandboxie, manage Microsoft credentials, start VMs, change account profiles or operate legacy recovery.</p>
        <p>Previous VMware and App Sandbox source remains in the repository as protected legacy material. Do not remove any virtual disk or account-bearing snapshot while compatibility is unproven.</p>
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
  .pilot-primary { display:inline-block; border:none; padding:12px 18px; border-radius:9px; background:#949eff; color:#10121b; font-weight:750; cursor:pointer; margin-top:16px; }
  .pilot-primary:disabled { opacity:.5; cursor:not-allowed; }
  .pilot-primary:focus-visible { outline:2px solid white; outline-offset:2px; }
  .pilot-info { color:#a4dabc !important; }
  .pilot-error { color:#f3aaa5 !important; }
  .pilot-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:15px; }
  .pilot-slot { padding:18px; border-radius:12px; background:#191e28; border:1px solid rgba(255,255,255,.06); }
  .pilot-slot strong { font-size:14px; }
  .pilot-slot p { color:#a0acbb; font-size:12px; }
  .pilot-slot span { color:#7f8c9a; font-size:11px; }
  .pilot-boundary h3 { margin:12px 0; }
  @media(max-width:740px) { .pilot-grid { grid-template-columns:1fr; } .pilot-main { padding:16px; } }
</style>
