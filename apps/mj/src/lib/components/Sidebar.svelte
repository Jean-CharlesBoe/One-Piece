<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import { recents } from '../recents.svelte'
  import { ENTITY_TYPES, TYPE_DEFS } from '../model/types'
  import type { ListMode } from './EntityList.svelte'

  // Barre latérale (cahier MJ §3) : recherche (ouvre la palette, Ctrl+K), types de fiches, doublons, archives,
  // épinglés, récentes, sessions (M8), réglages.
  let {
    selected,
    onSelect,
    onOpen,
    onSettings,
    onSearch,
  }: {
    selected: ListMode
    onSelect: (mode: ListMode) => void
    onOpen: (id: string, newTab?: boolean) => void
    onSettings: () => void
    onSearch: () => void
  } = $props()

  const counts = $derived(
    catalog.active.reduce<Record<string, number>>((acc, e) => ((acc[e.type] = (acc[e.type] ?? 0) + 1), acc), {}),
  )
  const archived = $derived(catalog.entries.filter(e => e.archived).length)
  const pinned = $derived(catalog.active.filter(e => e.pinned))
  const recent = $derived(
    recents.ids
      .flatMap(id => catalog.byId.get(id) ?? [])
      .filter(e => !e.archived && !e.pinned)
      .slice(0, 6),
  )
</script>

<nav class="sidebar" aria-label="Navigation">
  <header>
    <h1>One Piece</h1>
    <button class="gear" onclick={onSettings} aria-label="Réglages">⚙</button>
  </header>

  <button class="search" onclick={onSearch} title="Recherche globale (Ctrl+K ou /)">
    <span aria-hidden="true">⌕</span> Rechercher… <kbd>Ctrl K</kbd>
  </button>

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
              <button
                class="type"
                data-open-id={e.id}
                onclick={ev => onOpen(e.id, ev.ctrlKey || ev.metaKey)}
                onauxclick={ev => ev.button === 1 && onOpen(e.id, true)}
              >
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

    {#if recent.length}
      <section aria-labelledby="recents-titre">
        <h2 class="label" id="recents-titre">Récentes</h2>
        <ul>
          {#each recent as e (e.id)}
            <li>
              <button
                class="type"
                data-open-id={e.id}
                onclick={ev => onOpen(e.id, ev.ctrlKey || ev.metaKey)}
                onauxclick={ev => ev.button === 1 && onOpen(e.id, true)}
              >
                <span class="icon" aria-hidden="true">{TYPE_DEFS[e.type].icon}</span>
                <span class="name">{e.title}</span>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

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
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 0 10px;
    color: var(--muted);
    text-align: left;
  }
  .search kbd {
    margin-left: auto;
    font: inherit;
    font-size: 0.75rem;
    padding: 1px 6px;
    border: 1px solid var(--line);
    border-radius: 6px;
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
    min-height: 40px;
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
