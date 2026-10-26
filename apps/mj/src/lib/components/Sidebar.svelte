<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import { dayLabel, sessionLabel } from '../model/session'
  import { recents } from '../recents.svelte'
  import { sessions } from '../sessions.svelte'
  import { tabs } from '../tabs.svelte'
  import BackupStatus from './BackupStatus.svelte'
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
    onOpenSession,
    onNewSession,
    importableNotes,
    onImportNotes,
  }: {
    selected: ListMode
    onSelect: (mode: ListMode) => void
    onOpen: (id: string) => void
    onOpenSession: (id: string) => void
    onNewSession: () => void
    /** Notes de session importées de Notion encore à reprendre (D-M26). */
    importableNotes: number
    onImportNotes: () => Promise<void>
    onSettings: () => void
    onSearch: () => void
  } = $props()

  const counts = $derived(
    catalog.active.reduce<Record<string, number>>((acc, e) => ((acc[e.type] = (acc[e.type] ?? 0) + 1), acc), {}),
  )
  const archived = $derived(catalog.entries.filter(e => e.archived).length)
  const pinned = $derived(catalog.active.filter(e => e.pinned))
  /** Sessions, la plus récente en haut ; celle de l'onglet actif est marquée. */
  const sessionList = $derived([...sessions.list].reverse())
  let confirmImport = $state(false)
  let importing = $state(false)
  async function importNotes() {
    if (!confirmImport) {
      confirmImport = true
      setTimeout(() => (confirmImport = false), 5000)
      return
    }
    confirmImport = false
    importing = true
    try {
      await onImportNotes()
    } finally {
      importing = false
    }
  }

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
                onclick={ev => onOpen(e.id)}
                onauxclick={ev => ev.button === 1 && onOpen(e.id)}
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
                onclick={ev => onOpen(e.id)}
                onauxclick={ev => ev.button === 1 && onOpen(e.id)}
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
      <div class="sec-head">
        <h2 class="label" id="sessions-titre">Sessions</h2>
        <button class="add" onclick={onNewSession} title="Nouvelle session">+ Session</button>
      </div>
      {#if importableNotes}
        <button class="import" class:confirm={confirmImport} disabled={importing} onclick={importNotes}>
          {importing
            ? 'Reprise…'
            : confirmImport
              ? 'Confirmer : créer les sessions et archiver les notes'
              : `Reprendre les ${importableNotes} notes de session importées`}
        </button>
      {/if}
      {#if sessionList.length}
        <ul>
          {#each sessionList as se (se.id)}
            <li>
              <button
                class="type"
                class:on={tabs.current === `session:${se.id}`}
                onclick={() => onOpenSession(se.id)}
                title={se.playedOn ? dayLabel(se.playedOn) : ''}
              >
                <span class="icon" aria-hidden="true">{se.status === 'en_cours' ? '▶' : se.status === 'terminee' ? '✓' : '📖'}</span>
                <span class="name">{sessionLabel(se)}</span>
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="empty">Aucune session.</p>
      {/if}
    </section>
  </div>

  <footer>
    <button class="backup" onclick={onSettings} title="Sauvegarde : réglages"><BackupStatus compact /></button>
    <span class="label">Version {__APP_VERSION__}</span>
  </footer>
</nav>

<style>
  .sec-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .sec-head h2 {
    margin-bottom: 0;
  }
  .add {
    min-height: 32px;
    padding: 0 8px;
    font-size: 0.85rem;
    background: none;
  }
  .import {
    width: 100%;
    min-height: 40px;
    margin: 6px 0;
    padding: 4px 8px;
    font-size: 0.85rem;
    text-align: left;
    border-color: var(--reve);
  }
  .import.confirm {
    border-color: var(--danger);
    color: var(--danger);
  }
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
    display: grid;
    gap: 2px;
    padding-left: 6px;
  }
  .backup {
    min-height: 32px;
    padding: 0;
    border: none;
    background: none;
    text-align: left;
  }
</style>
