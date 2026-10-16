<script lang="ts">
  import { theme, THEMES, type Theme } from '@onepiece/core'
  import {
    chooseFolder,
    deviceName,
    folderPermission,
    folderSupported,
    savedFolder,
    testFolder,
    type FolderTest,
  } from '../backupFolder'
  import { pwa } from '../pwa.svelte'
  import { getRepository, META_SCHEMA_VERSION, META_THEME } from '../storage/repository'

  // Contenu de la fenêtre « Réglages » (roue dentée de la barre latérale) : thème, application (installation,
  // stockage persistant), dossier de sauvegarde (M1 : test d'écriture dans Google Drive), état de la base.
  // Le thème est chargé au démarrage (App.svelte) et enregistré ici.
  let error = $state('')
  let base = $state('')

  let folderName = $state<string | null>(null)
  let folderState = $state('')
  let test = $state<FolderTest | null>(null)
  let busy = $state(false)

  $effect(() => {
    if (!folderSupported()) return
    savedFolder()
      .then(async dir => {
        folderName = dir?.name ?? null
        if (dir) folderState = (await folderPermission(dir)) === 'granted' ? 'autorisé' : 'à réautoriser (un clic)'
      })
      .catch(e => (error = 'Dossier illisible : ' + (e instanceof Error ? e.message : String(e))))
  })

  async function pickFolder() {
    try {
      const dir = await chooseFolder()
      if (dir) {
        folderName = dir.name
        folderState = 'autorisé'
        test = null
      }
    } catch (e) {
      error = 'Dossier non choisi : ' + (e instanceof Error ? e.message : String(e))
    }
  }

  async function runTest() {
    busy = true
    error = ''
    try {
      const dir = await savedFolder()
      if (!dir) return
      if ((await folderPermission(dir, true)) !== 'granted') {
        folderState = 'refusé'
        return
      }
      folderState = 'autorisé'
      test = await testFolder(dir)
    } catch (e) {
      error = "Écriture impossible : " + (e instanceof Error ? e.message : String(e))
    } finally {
      busy = false
    }
  }

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

  <section class="card" aria-labelledby="dossier-titre">
    <h2 class="label" id="dossier-titre">Dossier de sauvegarde</h2>
    {#if !folderSupported()}
      <p class="warn">Ce navigateur ne permet pas d'écrire dans un dossier : il faudra sauvegarder à la main.</p>
    {:else}
      <p class="muted">
        Choisir un dossier dans Google Drive (le même sur le PC et le Chromebook). Les sauvegardes et le passage
        de relais entre appareils y passeront (étape M4). Pour l'instant : un test d'écriture.
      </p>
      <p>Dossier : <b>{folderName ?? 'aucun'}</b>{#if folderName} · {folderState}{/if}</p>
      <div class="row">
        <button onclick={pickFolder}>{folderName ? 'Changer de dossier…' : 'Choisir le dossier…'}</button>
        {#if folderName}<button class="primary" disabled={busy} onclick={runTest}>Tester l'écriture</button>{/if}
      </div>
      {#if test}
        <div class="test" role="status">
          <p>{test.readBack === test.written ? '✓ Écrit et relu :' : '⚠ Relu différent de ce qui a été écrit :'} {test.readBack}</p>
          <p class="muted">
            {test.previous ? `Contenu précédent : ${test.previous}` : 'Aucun test précédent dans ce dossier.'}
          </p>
        </div>
      {/if}
    {/if}
  </section>

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
  .warn {
    color: var(--reve);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  .test {
    margin-top: 8px;
  }
  .test p {
    margin: 4px 0 0;
  }
</style>
