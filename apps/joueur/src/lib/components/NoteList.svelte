<script lang="ts" generics="T extends { id: string; titre: string; texte: string; date?: string }">
  import { tick } from 'svelte'
  import { formatSessionDate, sessionsByDate } from '@onepiece/core'

  // Cartes de texte du Carnet : sections du Lore, ou séances de l'Histoire (`dated`).
  // Écrire et ajouter : à tout moment. Supprimer et réordonner : mode édition (crayon).
  let {
    items,
    dated = false,
    editing,
    unitLabel,
    addLabel,
    emptyText,
    onAdd,
    onUpdate,
    onRemove,
    onMove,
  }: {
    items: T[]
    dated?: boolean
    editing: boolean
    unitLabel: (n: number) => string
    addLabel: string
    emptyText: string
    onAdd: () => T
    onUpdate: (item: T, patch: Partial<Omit<T, 'id'>>) => void
    onRemove: (id: string) => void
    onMove?: (index: number, delta: number) => void
  } = $props()

  let expanded = $state<Record<string, boolean>>({})
  let writingId = $state<string | null>(null)
  let confirmDelete = $state<string | null>(null)
  let confirmTimer: ReturnType<typeof setTimeout> | undefined
  let listEl: HTMLElement

  const shown = $derived(dated ? sessionsByDate(items as never) as unknown as T[] : items)
  const allOpen = $derived(items.length > 0 && items.every(x => expanded[x.id]))
  const firstLine = (t: string) => t.split('\n').find(l => l.trim()) ?? ''

  async function startWriting(id: string) {
    writingId = id
    await tick()
    listEl.querySelector<HTMLInputElement>(`[data-id="${id}"] .title-input`)?.focus()
  }

  function add() {
    const item = onAdd()
    startWriting(item.id)
  }

  function done(id: string) {
    writingId = null
    expanded[id] = true
  }

  function remove(id: string) {
    if (confirmDelete !== id) {
      confirmDelete = id
      clearTimeout(confirmTimer)
      confirmTimer = setTimeout(() => (confirmDelete = null), 4000)
      return
    }
    confirmDelete = null
    if (writingId === id) writingId = null
    onRemove(id)
  }

  function toggleAll() {
    const open = !allOpen
    expanded = Object.fromEntries(items.map(x => [x.id, open]))
  }
</script>

<div class="head">
  <span class="label">{unitLabel(items.length)}</span>
  <span class="head-actions">
    {#if !editing && items.length > 1}
      <button class="small" onclick={toggleAll}>{allOpen ? 'Tout replier' : 'Tout déplier'}</button>
    {/if}
    <button class="small primary" onclick={add}>{addLabel}</button>
  </span>
</div>

{#if items.length === 0}
  <p class="empty">{emptyText}</p>
{/if}

<ul bind:this={listEl}>
  {#each shown as item, i (item.id)}
    <li class="card" data-id={item.id}>
      {#if writingId === item.id}
        <div class="write">
          <div class="top" class:dated>
            {#if dated}
              <input
                type="date"
                value={item.date}
                onchange={e => onUpdate(item, { date: e.currentTarget.value } as Partial<Omit<T, 'id'>>)}
                aria-label="Date de la séance"
              />
            {/if}
            <input
              class="title-input"
              value={item.titre}
              oninput={e => onUpdate(item, { titre: e.currentTarget.value } as Partial<Omit<T, 'id'>>)}
              maxlength="120"
              placeholder="Titre"
              aria-label="Titre"
              autocomplete="off"
            />
          </div>
          <textarea
            value={item.texte}
            oninput={e => onUpdate(item, { texte: e.currentTarget.value } as Partial<Omit<T, 'id'>>)}
            maxlength="50000"
            placeholder={dated ? 'Ce qui s’est passé pendant la séance…' : 'Texte'}
            aria-label="Texte"
          ></textarea>
          <div class="actions">
            <span class="spacer"></span>
            <button class="small primary" onclick={() => done(item.id)}>Terminé</button>
          </div>
        </div>
      {:else}
        <button class="summary" onclick={() => (expanded[item.id] = !expanded[item.id])} aria-expanded={!!expanded[item.id]}>
          {#if dated && item.date}
            <span class="date">{formatSessionDate(item.date)}</span>
          {/if}
          <span class="title">{item.titre || 'Sans titre'}</span>
          {#if !editing}<span class="chevron" aria-hidden="true">{expanded[item.id] ? '▴' : '▾'}</span>{/if}
        </button>
        {#if expanded[item.id]}
          <p class="full">{item.texte || 'Rien d’écrit pour l’instant.'}</p>
        {:else if item.texte && !editing}
          <p class="preview">{firstLine(item.texte)}</p>
        {/if}
        {#if editing}
          <div class="actions">
            <button class="small" onclick={() => startWriting(item.id)}>Modifier</button>
            {#if onMove}
              <button class="small" onclick={() => onMove(i, -1)} disabled={i === 0} aria-label="Monter {item.titre}">↑</button>
              <button class="small" onclick={() => onMove(i, 1)} disabled={i === shown.length - 1} aria-label="Descendre {item.titre}">↓</button>
            {/if}
            <span class="spacer"></span>
            <button class="small danger" onclick={() => remove(item.id)}>
              {confirmDelete === item.id ? 'Confirmer' : 'Supprimer'}
            </button>
          </div>
        {:else if expanded[item.id]}
          <div class="actions">
            <span class="spacer"></span>
            <button class="small" onclick={() => startWriting(item.id)}>✎ Écrire</button>
          </div>
        {/if}
      {/if}
    </li>
  {/each}
</ul>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }
  .head-actions {
    display: flex;
    gap: 6px;
  }
  .small {
    min-height: 36px;
    font-size: 0.9rem;
    padding: 0 12px;
  }
  .empty {
    color: var(--muted);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .card {
    padding: 0;
    overflow: hidden;
  }
  .summary {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    border: none;
    border-radius: 0;
    background: none;
    padding: 10px 12px;
    text-align: left;
  }
  .title {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }
  .date {
    flex: none;
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    color: var(--accent);
    font-size: 0.8rem;
    font-weight: 600;
  }
  .chevron {
    color: var(--muted);
  }
  .full,
  .preview {
    margin: 0;
    padding: 10px 12px 12px;
  }
  .full {
    border-top: 1px solid var(--line);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .preview {
    margin-top: -6px;
    padding-top: 0;
    color: var(--muted);
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .write {
    display: grid;
    gap: 8px;
    padding: 10px;
  }
  .top.dated {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 8px;
  }
  .title-input {
    font-weight: 600;
  }
  textarea {
    min-height: 140px;
  }
  .actions {
    display: flex;
    gap: 6px;
    padding: 0 10px 10px;
  }
  .write .actions {
    padding: 0;
  }
  .spacer {
    flex: 1;
  }
</style>
