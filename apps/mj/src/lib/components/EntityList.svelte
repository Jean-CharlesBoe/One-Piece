<script lang="ts" module>
  import type { EntityType } from '../model/types'

  /** Contenu de la colonne liste : un type de fiches, ou les archives. */
  export type ListMode = EntityType | 'archives'
</script>

<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import { TYPE_DEFS } from '../model/types'

  // Liste des fiches d'un type, ou des fiches archivées (cahier MJ §4.3, §4.5). Filtres et tri : M3.
  let {
    mode,
    selectedId,
    onOpen,
    onCreate,
  }: {
    mode: ListMode
    selectedId: string | null
    onOpen: (id: string) => void
    onCreate: () => void
  } = $props()

  const items = $derived(
    mode === 'archives' ? catalog.entries.filter(e => e.archived) : catalog.active.filter(e => e.type === mode),
  )
  const title = $derived(mode === 'archives' ? 'Archives' : TYPE_DEFS[mode].plural)
</script>

<section class="list" aria-labelledby="liste-titre">
  <header>
    <h2 id="liste-titre">{title} <span class="count">{items.length}</span></h2>
    {#if mode !== 'archives'}
      <button class="primary" onclick={onCreate} title="Nouvelle fiche (Ctrl+N)">+ Nouvelle</button>
    {/if}
  </header>

  {#if items.length}
    <ul>
      {#each items as e (e.id)}
        <li>
          <button class:on={e.id === selectedId} aria-current={e.id === selectedId} onclick={() => onOpen(e.id)}>
            <span aria-hidden="true">{TYPE_DEFS[e.type].icon}</span>
            <span class="title">{e.title}</span>
            {#if e.pinned}<span class="pin" title="Épinglée">📌</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="empty">
      {mode === 'archives' ? 'Aucune fiche archivée.' : "Aucune fiche de ce type pour l'instant."}
    </p>
  {/if}
</section>

<style>
  .list {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 61px;
    padding: 12px;
    border-bottom: 1px solid var(--line);
  }
  h2 {
    margin: 0;
    font-size: 1.05rem;
  }
  .count {
    color: var(--muted);
    font-weight: normal;
    font-size: 0.9rem;
  }
  header button {
    min-height: 36px;
    padding: 0 12px;
  }
  ul {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    list-style: none;
    margin: 0;
    padding: 6px;
  }
  li button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 38px;
    padding: 0 10px;
    border: none;
    background: none;
    text-align: left;
  }
  li button:hover {
    background: var(--bg);
  }
  li button.on {
    background: var(--bg);
    box-shadow: inset 3px 0 0 var(--accent);
    font-weight: 600;
  }
  .title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pin {
    font-size: 0.8rem;
  }
  .empty {
    margin: 16px 12px;
    color: var(--muted);
  }
</style>
