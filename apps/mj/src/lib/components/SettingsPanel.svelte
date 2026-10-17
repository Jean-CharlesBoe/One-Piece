<script lang="ts">
  import { theme, THEMES, type Theme } from '@onepiece/core'
  import { deviceName } from '../backup/folder'
  import { pwa } from '../pwa.svelte'
  import { getRepository, META_SCHEMA_VERSION, META_THEME } from '../storage/repository'
  import BackupSection from './BackupSection.svelte'

  // Contenu de la fenêtre « Réglages » (roue dentée de la barre latérale) : thème, application (installation,
  // stockage persistant), sauvegarde (dossier Google Drive, restauration : BackupSection), état de la base.
  // Le thème est chargé au démarrage (App.svelte) et enregistré ici.
  let error = $state('')
  let base = $state('')

  const mo = (n: number) => (n / 1048576).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' Mo'

  $effect(() => {
    getRepository()
      .then(async r => {
        const engine = r.searchEngine === 'aucun' ? 'aucun index' : r.searchEngine.toUpperCase()
        base = `schéma ${await r.getMeta(META_SCHEMA_VERSION)} · recherche ${engine}`
      })
      .catch(e => (error = 'Base illisible : ' + (e instanceof Error ? e.message : String(e))))
  })

  async function pickTheme(t: Theme) {
    theme.set(t)
    try {
      await (await getRepository()).setMeta(META_THEME, t)
      error = ''
    } catch (e) {
      error = 'Réglage non enregistré : ' + (e instanceof Error ? e.message : String(e))
    }
  }
</script>

<div class="settings">
  <section class="card" aria-labelledby="theme-titre">
    <h2 class="label" id="theme-titre">Thème</h2>
    <div class="seg" role="radiogroup" aria-labelledby="theme-titre">
      {#each THEMES as [k, l] (k)}
        <button role="radio" aria-checked={$theme === k} class:on={$theme === k} onclick={() => pickTheme(k)}>{l}</button>
      {/each}
    </div>
  </section>

  <section class="card" aria-labelledby="app-titre">
    <h2 class="label" id="app-titre">Application</h2>
    {#if pwa.installed}
      <p>Installée sur cet appareil ({deviceName()}).</p>
    {:else if pwa.canInstall}
      <p>Installer l'app : icône dans le lanceur, fenêtre à elle, ouverture sans réseau.</p>
      <button class="primary" onclick={() => pwa.install()}>Installer l'application</button>
    {:else}
      <p class="muted">Pour l'installer : menu de Chrome (⋮) › « Installer One Piece… ».</p>
    {/if}
    <p>
      Stockage protégé :
      {pwa.persisted === null ? 'inconnu' : pwa.persisted ? 'oui' : 'non — le navigateur pourrait libérer la place'}
      {#if pwa.usage !== null}<span class="muted"> · {mo(pwa.usage)} utilisés</span>{/if}
    </p>
    {#if pwa.persisted === false}
      <button onclick={() => pwa.requestPersistence()}>Demander la protection</button>
    {/if}
  </section>

  <BackupSection />

  <section class="card" aria-labelledby="apropos-titre">
    <h2 class="label" id="apropos-titre">À propos</h2>
    <p>One Piece, version {__APP_VERSION__}</p>
    {#if base}<p class="muted">Base : {base}</p>{/if}
  </section>

  {#if error}<p class="error" role="alert">{error}</p>{/if}
</div>

<style>
  .settings {
    display: grid;
    gap: 12px;
    margin-top: 16px;
  }
  h2 {
    margin: 0;
  }
  p {
    margin: 6px 0 0;
  }
  .muted {
    color: var(--muted);
  }
  .seg {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin-top: 8px;
  }
  .seg button {
    padding: 0 4px;
    border-radius: 0;
  }
  .seg button:first-child {
    border-radius: var(--radius) 0 0 var(--radius);
  }
  .seg button:last-child {
    border-radius: 0 var(--radius) var(--radius) 0;
  }
  .seg button.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-text);
    font-weight: 600;
  }
  .error {
    margin: 0;
    color: var(--danger);
  }
</style>
