<script lang="ts">
  import type { EntitySummary } from '../model/entity'
  import { TYPE_DEFS, type EntityType } from '../model/types'

  // Liste des fiches d'un type (cahier MJ §4.5). Filtres et tri arrivent en M3.
  let {
    type,
    items,
    selectedId,
    onOpen,
    onCreate,
  }: {
    type: EntityType
    items: EntitySummary[]
    selectedId: string | null
    onOpen: (id: string) => void
    onCreate: () => void
  } = $props()

  const def = $derived(TYPE_DEFS[type])
</script>

<section class="list" aria-labelledby="liste-titre">
  <header>
    <h2 id="liste-titre">{def.plural} <span class="count">{items.length}</span></h2>
    <button class="primary" onclick={onCreate} title="Nouvelle fiche (Ctrl+N)">+ Nouvelle</button>
  </header>

  {#if items.length}
    <ul>
      {#each items as e (e.id)}
        <li>
          <button class:on={e.id === selectedId} aria-current={e.id === selectedId} onclick={() => onOpen(e.id)}>
            <span aria-hidden="true">{def.icon}</span>
            <span class="title">{e.title}</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="empty">Aucune fiche de ce type pour l'instant.</p>
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .empty {
    margin: 16px 12px;
    color: var(--muted);
  }
</style>
