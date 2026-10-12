<script lang="ts">
  import Sheet from '@onepiece/core/ui/Sheet.svelte'
  import { onMount } from 'svelte'
  import { backupStatus } from '../backup/format'
  import SettingsPanel from '../components/SettingsPanel.svelte'
  import { createCharacter, type CharacterSummary } from '../model/character'
  import { getRepository, META_LAST_BACKUP } from '../storage/repository'

  let { onOpen }: { onOpen: (id: string) => void } = $props()

  let characters = $state<CharacterSummary[]>([])
  let loading = $state(true)
  let error = $state('')
  let newName = $state('')
  let confirmDelete = $state<string | null>(null)
  let confirmTimer: ReturnType<typeof setTimeout> | undefined
  let settingsOpen = $state(false)
  let lastBackup = $state<string | null>(null)

  // Rappel de sauvegarde : la sauvegarde elle-même est dans les réglages (roue dentée, D-J19).
  const backup = $derived(backupStatus(lastBackup, characters))

  const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

  async function refresh() {
    try {
      const repo = await getRepository()
      characters = await repo.list()
      lastBackup = await repo.getMeta(META_LAST_BACKUP)
      error = ''
    } catch (e) {
      error = 'Impossible de lire les personnages : ' + message(e)
    } finally {
      loading = false
    }
  }

  async function create(event: SubmitEvent) {
    event.preventDefault()
    const nom = newName.trim()
    if (!nom) return
    const c = createCharacter(nom)
    try {
      await (await getRepository()).save(c)
      newName = ''
      onOpen(c.id)
    } catch (e) {
      error = 'Création impossible : ' + message(e)
    }
  }

  // Suppression en deux temps : un premier tap arme le bouton, un second confirme.
  async function remove(id: string) {
    if (confirmDelete !== id) {
      confirmDelete = id
      clearTimeout(confirmTimer)
      confirmTimer = setTimeout(() => (confirmDelete = null), 4000)
      return
    }
    confirmDelete = null
    try {
      await (await getRepository()).remove(id)
      await refresh()
    } catch (e) {
      error = 'Suppression impossible : ' + message(e)
    }
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  onMount(refresh)
</script>

<main>
  <header>
    <div>
      <h1>Vivre Card</h1>
      <p class="subtitle">Fiches de personnage · JDR One Piece</p>
    </div>
    <button class="gear" onclick={() => (settingsOpen = true)} aria-label="Réglages et sauvegarde">⚙</button>
  </header>

  {#if !loading && backup.warn}
    <button class="backup-warn" onclick={() => (settingsOpen = true)}>
      <strong>{backup.text}</strong> Pense à sauvegarder tes personnages (⚙ Réglages).
    </button>
  {/if}

  <form onsubmit={create}>
    <label class="visually-hidden" for="new-name">Nom du nouveau personnage</label>
    <input id="new-name" bind:value={newName} placeholder="Nom du nouveau personnage" maxlength="120" autocomplete="off" />
    <button class="primary" type="submit" disabled={!newName.trim()}>Créer</button>
  </form>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  {#if loading}
    <p class="muted">Chargement…</p>
  {:else if characters.length === 0}
    <p class="muted">Aucun personnage pour l'instant. Crée le premier ci-dessus.</p>
  {:else}
    <ul>
      {#each characters as c (c.id)}
        <li>
          <button class="open" onclick={() => onOpen(c.id)}>
            <span class="name">{c.nom || 'Sans nom'}</span>
            {#if c.sousTitre}
              <span class="small">{c.sousTitre}</span>
            {/if}
            <span class="muted small">Modifié le {fmtDate(c.updatedAt)}</span>
          </button>
          <button class="danger" onclick={() => remove(c.id)} aria-label="Supprimer {c.nom}">
            {confirmDelete === c.id ? 'Confirmer' : 'Supprimer'}
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <Sheet bind:open={settingsOpen} title="Réglages">
    <SettingsPanel {characters} onChanged={refresh} />
  </Sheet>

  <p class="version">Vivre Card v{__APP_VERSION__}</p>
</main>

<style>
  main {
    max-width: 560px;
    margin: 0 auto;
    padding: 24px 16px;
  }
  h1 {
    margin: 0;
    font-size: 1.8rem;
    letter-spacing: 0.02em;
  }
  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 20px;
  }
  .subtitle {
    margin: 0;
    color: var(--muted);
  }
  .gear {
    min-width: 44px;
    padding: 0 8px;
    border: none;
    background: none;
    font-size: 1.6rem;
    line-height: 1;
    color: var(--muted);
  }
  .backup-warn {
    display: block;
    width: 100%;
    margin-bottom: 16px;
    padding: 10px 14px;
    border-color: var(--danger);
    color: var(--danger);
    text-align: left;
  }
  form {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  li {
    display: flex;
    gap: 8px;
  }
  .open {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 14px;
    text-align: left;
  }
  .name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  .muted {
    color: var(--muted);
  }
  .small {
    font-size: 0.85rem;
  }
  .error {
    color: var(--danger);
  }
  .version {
    margin-top: 24px;
    text-align: center;
    font-size: 0.8rem;
    color: var(--muted);
  }
</style>
