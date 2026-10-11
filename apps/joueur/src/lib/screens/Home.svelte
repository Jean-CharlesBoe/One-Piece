<script lang="ts">
  import { onMount } from 'svelte'
  import BackupPanel from '../components/BackupPanel.svelte'
  import { createCharacter, type CharacterSummary } from '../model/character'
  import { getRepository } from '../storage/repository'

  let { onOpen }: { onOpen: (id: string) => void } = $props()

  let characters = $state<CharacterSummary[]>([])
  let loading = $state(true)
  let error = $state('')
  let newName = $state('')
  let confirmDelete = $state<string | null>(null)
  let confirmTimer: ReturnType<typeof setTimeout> | undefined

  const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

  async function refresh() {
    try {
      characters = await (await getRepository()).list()
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
  <h1>Vivre Card</h1>
  <p class="subtitle">Fiches de personnage · JDR One Piece</p>

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

  {#if !loading}
    <div class="backup">
      <BackupPanel {characters} onImported={refresh} />
    </div>
  {/if}

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
  .subtitle {
    margin: 0 0 20px;
    color: var(--muted);
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
  .backup {
    margin-top: 28px;
  }
  .version {
    margin-top: 24px;
    text-align: center;
    font-size: 0.8rem;
    color: var(--muted);
  }
</style>
