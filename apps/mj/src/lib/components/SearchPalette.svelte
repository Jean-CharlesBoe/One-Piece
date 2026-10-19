<script lang="ts">
  import { onBack } from '@onepiece/core'
  import { catalog } from '../catalog.svelte'
  import type { CatalogEntry } from '../model/entity'
  import { subtitle } from '../model/props'
  import { rankScore } from '../model/search'
  import { ENTITY_TYPES, TYPE_DEFS } from '../model/types'
  import { recents } from '../recents.svelte'
  import { getRepository } from '../storage/repository'

  // Recherche globale (cahier §4.5, Ctrl+K ou « / ») : titres, alias, propriétés et texte, résultats groupés
  // par type avec un extrait surligné ; sans recherche, les fiches récentes. Clavier : ↑ ↓, Entrée ; Échap ferme.
  let {
    open = $bindable(false),
    newTab = $bindable(false),
    onOpen,
  }: {
    open: boolean
    /** Ouverte par « + » de la barre d'onglets : la fiche choisie s'ouvre toujours dans un nouvel onglet. */
    newTab?: boolean
    /** `newTab` : Ctrl + Entrée ou Ctrl + clic (onglets, M3b). */
    onOpen: (id: string, newTab: boolean) => void
  } = $props()

  interface Row {
    entry: CatalogEntry
    snippet: string
  }

  let dlg: HTMLDialogElement
  let input = $state<HTMLInputElement | null>(null)
  let query = $state('')
  let rows = $state<Row[]>([])
  let active = $state(0)
  let searching = $state(false)
  let seq = 0

  $effect(() => {
    if (open && !dlg.open) {
      dlg.showModal()
      query = ''
      active = 0
      queueMicrotask(() => input?.focus())
    } else if (!open && dlg.open) dlg.close()
    if (!open) newTab = false
  })

  $effect(() => {
    if (!open) return
    return onBack(() => (open = false))
  })

  // Sans recherche : les récentes. Sinon : l'index, 120 ms après la dernière frappe.
  $effect(() => {
    const q = query.trim()
    const n = ++seq
    if (!q) {
      rows = recents.ids.flatMap(id => {
        const e = catalog.byId.get(id)
        return e && !e.archived ? [{ entry: e, snippet: '' }] : []
      })
      active = 0
      return
    }
    searching = true
    const t = setTimeout(async () => {
      try {
        const hits = await (await getRepository()).search(q)
        if (n !== seq) return
        rows = hits
          .flatMap(h => {
            const e = catalog.byId.get(h.id)
            return e && !e.archived ? [{ entry: e, snippet: h.snippet }] : []
          })
          .sort((a, b) => rankScore(q, a.entry) - rankScore(q, b.entry) || a.entry.title.localeCompare(b.entry.title, 'fr'))
        active = 0
      } finally {
        if (n === seq) searching = false
      }
    }, 120)
    return () => clearTimeout(t)
  })

  /** Groupes par type, dans l'ordre du registre ; le meilleur résultat d'abord si la recherche est saisie. */
  const groups = $derived.by(() => {
    if (!query.trim()) return rows.length ? [{ title: 'Récentes', rows }] : []
    return ENTITY_TYPES.map(t => ({ title: TYPE_DEFS[t].plural, rows: rows.filter(r => r.entry.type === t) }))
      .filter(g => g.rows.length)
      .sort((a, b) => rows.indexOf(a.rows[0]) - rows.indexOf(b.rows[0]))
  })
  /** Ordre de navigation au clavier = ordre affiché. */
  const flat = $derived(groups.flatMap(g => g.rows))

  function pick(r: Row, inNewTab = false) {
    const t = inNewTab || newTab
    open = false
    onOpen(r.entry.id, t)
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') active = Math.min(active + 1, flat.length - 1)
    else if (e.key === 'ArrowUp') active = Math.max(active - 1, 0)
    else if (e.key === 'Enter' && flat[active]) pick(flat[active], e.ctrlKey || e.metaKey)
    else return
    e.preventDefault()
    document.getElementById(`res-${active}`)?.scrollIntoView({ block: 'nearest' })
  }
</script>

<dialog
  bind:this={dlg}
  aria-label="Recherche"
  onclose={() => (open = false)}
  onclick={e => {
    if (e.target === dlg) open = false
  }}
>
  {#if open}
    <div class="palette">
      <input
        bind:this={input}
        bind:value={query}
        onkeydown={onKey}
        type="search"
        placeholder={newTab ? 'Ouvrir dans un nouvel onglet…' : 'Rechercher une fiche (titre, alias, propriétés, texte)…'}
        aria-label="Rechercher"
        aria-controls="resultats"
        autocomplete="off"
      />
      <div class="results" id="resultats" role="listbox" aria-label="Résultats">
        {#each groups as g (g.title)}
          <h3 class="label">{g.title}</h3>
          {#each g.rows as r (r.entry.id)}
            {@const i = flat.indexOf(r)}
            {@const sub = subtitle(r.entry, id => catalog.title(id))}
            <button
              id="res-{i}"
              role="option"
              aria-selected={i === active}
              class:on={i === active}
              data-open-id={r.entry.id}
              onmouseenter={() => (active = i)}
              onclick={e => pick(r, e.ctrlKey || e.metaKey)}
              onauxclick={e => e.button === 1 && pick(r, true)}
            >
              <span class="icon" aria-hidden="true">{TYPE_DEFS[r.entry.type].icon}</span>
              <span class="text">
                <span class="title">{r.entry.title}</span>
                {#if sub}<span class="sub">{sub}</span>{/if}
                <!-- Extrait échappé puis surligné par snippetHtml (model/search.ts). -->
                {#if r.snippet}<span class="snip">{@html r.snippet}</span>{/if}
              </span>
            </button>
          {/each}
        {:else}
          <p class="empty">
            {#if !query.trim()}Tape un nom, un mot du texte, une propriété…
            {:else if searching}Recherche…
            {:else}Aucune fiche ne correspond à « {query.trim()} ».{/if}
          </p>
        {/each}
      </div>
      <p class="hint">↑ ↓ pour choisir · Entrée pour ouvrir · Ctrl + Entrée dans un nouvel onglet · Échap pour fermer</p>
    </div>
  {/if}
</dialog>

<style>
  dialog {
    margin: 10vh auto auto;
    width: min(640px, 94vw);
    max-height: 76dvh;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--surface);
    color: var(--text);
    box-shadow: 0 20px 50px rgb(0 0 0 / 0.35);
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.45);
  }
  .palette {
    display: flex;
    flex-direction: column;
    max-height: 76dvh;
  }
  input {
    border: none;
    border-bottom: 1px solid var(--line);
    border-radius: 14px 14px 0 0;
    min-height: 56px;
    padding: 0 18px;
    font-size: 1.1rem;
  }
  input:focus-visible {
    outline: none;
  }
  .results {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 6px;
  }
  h3 {
    margin: 10px 8px 4px;
  }
  button {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    padding: 8px 10px;
    border: none;
    background: none;
    text-align: left;
  }
  button.on {
    background: var(--bg);
    box-shadow: inset 3px 0 0 var(--accent);
  }
  .icon {
    width: 1.4em;
    text-align: center;
    padding-top: 1px;
  }
  .text {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .title {
    font-weight: 600;
  }
  .sub,
  .snip {
    color: var(--muted);
    font-size: 0.85rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .snip :global(mark) {
    background: color-mix(in srgb, var(--accent) 35%, transparent);
    color: inherit;
    border-radius: 3px;
  }
  .empty {
    margin: 16px 12px;
    color: var(--muted);
  }
  .hint {
    margin: 0;
    padding: 8px 14px;
    border-top: 1px solid var(--line);
    color: var(--muted);
    font-size: 0.8rem;
  }
</style>
