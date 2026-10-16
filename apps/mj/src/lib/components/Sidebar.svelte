<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import { ENTITY_TYPES, TYPE_DEFS } from '../model/types'
  import type { ListMode } from './EntityList.svelte'

  // Barre latérale (cahier MJ §3) : recherche, types de fiches, archives, épinglés, sessions, réglages.
  // Recherche (M3) et sessions (M8) sont encore des emplacements vides.
  let {
    selected,
    onSelect,
    onOpen,
    onSettings,
  }: {
    selected: ListMode
    onSelect: (mode: ListMode) => void
    onOpen: (id: string) => void
    onSettings: () => void
  } = $props()

  const counts = $derived(
    catalog.active.reduce<Record<string, number>>((acc, e) => ((acc[e.type] = (acc[e.type] ?? 0) + 1), acc), {}),
  )
  const archived = $derived(catalog.entries.filter(e => e.archived).length)
  const pinned = $derived(catalog.active.filter(e => e.pinned))
</script>

<nav class="sidebar" aria-label="Navigation">
  <header>
    <h1>One Piece</h1>
    <button class="gear" onclick={onSettings} aria-label="Réglages">⚙</button>
  </header>

  <input class="search" type="search" placeholder="Rechercher (bientôt)" disabled aria-label="Rechercher" />

  <div class="scroll">
    <section aria-labelledby="types-titre">
      <h2 class="label" id="types-titre">Fiches</h2>
      <ul>
        {#each ENTITY_TYPES as t (t)}
          <li>
            <button class="type" class:on={t === selected} aria-current={t === selected} onclick={() => onSelect(t)}>
              <span class="icon" aria-hidden="true">{TYPE_DEFS[t].icon}</span>
              <span class="name">{TYPE_DEFS[t].plural}</span>
              <span class="count">{counts[t] ?? 0}</span>
            </button>
          </li>
        {/each}
        <li>
          <button class="type" class:on={selected === 'doublons'} aria-current={selected === 'doublons'} onclick={() => onSelect('doublons')}>
            <span class="icon" aria-hidden="true">🔀</span>
            <span class="name">Doublons probables</span>
          </button>
        </li>
        {#if archived}
          <li>
            <button class="type" class:on={selected === 'archives'} aria-current={selected === 'archives'} onclick={() => onSelect('archives')}>
              <span class="icon" aria-hidden="true">🗃</span>
              <span class="name">Archives</span>
              <span class="count">{archived}</span>
            </button>
          </li>
        {/if}
      </ul>
    </section>

    <section aria-labelledby="epingles-titre">
      <h2 class="label" id="epingles-titre">Épinglés</h2>
      {#if pinned.length}
        <ul>
          {#each pinned as e (e.id)}
            <li>
              <button class="type" onclick={() => onOpen(e.id)}>
                <span class="icon" aria-hidden="true">{TYPE_DEFS[e.type].icon}</span>
                <span class="name">{e.title}</span>
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="empty">Aucune fiche épinglée (📌 sur une fiche).</p>
      {/if}
    </section>

    <section aria-labelledby="sessions-titre">
      <h2 class="label" id="sessions-titre">Sessions</h2>
      <p class="empty">Les sessions de jeu arriveront plus tard.</p>
    </section>
  </div>

  <footer class="label">Version {__APP_VERSION__}</footer>
</nav>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    min-height: 0;
    padding: 12px 10px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-left: 6px;
  }
  h1 {
    margin: 0;
    font-size: 1.2rem;
  }
  .gear {
    border: none;
    background: none;
    font-size: 1.3rem;
    padding: 0 10px;
  }
  .search {
    min-height: 38px;
  }
  .scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: grid;
    align-content: start;
    gap: 16px;
  }
  h2 {
    margin: 0 0 4px 6px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .type {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 36px;
    padding: 0 8px;
    border: none;
    background: none;
    text-align: left;
  }
  .type:hover {
    background: var(--surface);
  }
  .type.on {
    background: var(--surface);
    box-shadow: inset 3px 0 0 var(--accent);
    font-weight: 600;
  }
  .icon {
    width: 1.4em;
    text-align: center;
  }
  .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .count {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .empty {
    margin: 0 6px;
    color: var(--muted);
    font-size: 0.9rem;
  }
  footer {
    padding-left: 6px;
  }
</style>
