<script lang="ts" module>
  import type { ListMode } from '../model/listTab'

  type SortKey = 'titre' | 'modif' | 'type' | string
  interface ListState {
    text: string
    filters: Record<string, string>
    sort: SortKey
    desc: boolean
    asTree: boolean
    expanded: Record<string, boolean>
  }
  /** État de chaque onglet de liste (filtres, tri, arbre), gardé quand on passe à un autre onglet. */
  const states = new Map<ListMode, ListState>()
  const freshState = (): ListState => ({ text: '', filters: {}, sort: 'titre', desc: false, asTree: false, expanded: {} })
</script>

<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import { ACCEPTED } from '../model/asset'
  import type { CatalogEntry } from '../model/entity'
  import { nameKey } from '../model/links'
  import { displayValue, relationIds } from '../model/props'
  import { buildTree, type TreeItem } from '../model/tree'
  import { TYPE_DEFS, type FieldDef } from '../model/types'
  import DuplicatesList from './DuplicatesList.svelte'

  // Onglet de liste (D-M27, cahier MJ §4.3, §4.5) : les fiches d'un type (ou les archives) en tableau pleine
  // largeur. Colonnes = propriétés du sous-titre et des filtres du registre ; tri en cliquant un en-tête ; filtres
  // par nom et par propriété. Lieux et scénarios ont aussi une vue « Arbre ». Un clic ouvre la fiche dans un
  // nouvel onglet (D-M21).
  let {
    mode,
    onOpen,
    onCreate,
    onMerge,
    onImport,
  }: {
    mode: ListMode
    onOpen: (id: string) => void
    onCreate: () => void
    onMerge: (a: string, b: string) => void
    /** Documents : importer des fichiers (une fiche Document par fichier). */
    onImport: (files: File[]) => void
  } = $props()

  let fileInput: HTMLInputElement | undefined = $state()

  // svelte-ignore state_referenced_locally
  const st = $state<ListState>(states.get(mode) ?? freshState())
  $effect(() => {
    states.set(mode, $state.snapshot(st) as ListState)
  })

  const treeable = $derived(mode === 'lieu' || mode === 'scenario')

  const base = $derived(
    mode === 'doublons'
      ? []
      : mode === 'archives'
        ? catalog.entries.filter(e => e.archived)
        : catalog.active.filter(e => e.type === mode),
  )
  const title = $derived(mode === 'archives' ? 'Archives' : mode === 'doublons' ? '' : TYPE_DEFS[mode].plural)
  const filterDefs = $derived<FieldDef[]>(
    mode === 'archives' || mode === 'doublons' ? [] : TYPE_DEFS[mode].fields.filter(f => f.filterable),
  )
  /** Colonnes : propriétés du sous-titre puis des filtres (sans doublon), 5 au plus. */
  const columns = $derived<FieldDef[]>(
    mode === 'archives' || mode === 'doublons'
      ? []
      : TYPE_DEFS[mode].fields.filter(f => (f.inSubtitle || f.filterable) && f.field.kind !== 'gameBlock').slice(0, 5),
  )

  /** Valeurs d'un champ pour une fiche, sous forme de chaînes (identifiants pour les relations). */
  function valuesOf(e: CatalogEntry, f: FieldDef): string[] {
    const v = e.props[f.key]
    if (f.field.kind === 'relation') return relationIds(v)
    if (Array.isArray(v)) return v.map(String)
    return v === undefined || v === null || v === '' ? [] : [String(v)]
  }

  const cell = (e: CatalogEntry, f: FieldDef) =>
    e.props[f.key] === undefined ? '' : displayValue(f, e.props[f.key], id => catalog.title(id))

  /** Choix proposés pour un filtre : valeurs présentes dans la liste, avec leur nombre. */
  function choices(f: FieldDef): { value: string; label: string; n: number }[] {
    const counts = new Map<string, number>()
    for (const e of base) for (const v of valuesOf(e, f)) counts.set(v, (counts.get(v) ?? 0) + 1)
    const label = (v: string) => (f.field.kind === 'relation' ? catalog.title(v) : v)
    return [...counts]
      .map(([value, n]) => ({ value, label: label(value), n }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
  }

  const active = $derived(Object.values(st.filters).filter(Boolean).length + (st.text.trim() ? 1 : 0))

  const items = $derived.by(() => {
    const k = nameKey(st.text)
    const list = base.filter(
      e =>
        (!k || [e.title, ...e.aliases].some(n => nameKey(n).includes(k))) &&
        filterDefs.every(f => !st.filters[f.key] || valuesOf(e, f).includes(st.filters[f.key])),
    )
    const col = columns.find(c => c.key === st.sort)
    const key = (e: CatalogEntry): string =>
      st.sort === 'modif' ? e.updatedAt : st.sort === 'type' ? TYPE_DEFS[e.type].label : col ? cell(e, col) : e.title
    const sorted = [...list].sort((a, b) => {
      const x = key(a)
      const y = key(b)
      // Valeurs vides en bas, quel que soit le sens.
      if (!x !== !y) return x ? -1 : 1
      return x.localeCompare(y, 'fr', { numeric: true }) || a.title.localeCompare(b.title, 'fr')
    })
    return st.desc ? sorted.reverse() : sorted
  })

  function sortBy(k: SortKey) {
    if (st.sort === k) st.desc = !st.desc
    else {
      st.sort = k
      st.desc = k === 'modif'
    }
  }
  const arrow = (k: SortKey) => (st.sort === k ? (st.desc ? ' ▾' : ' ▴') : '')
  const ariaSort = (k: SortKey) => (st.sort === k ? (st.desc ? 'descending' : 'ascending') : 'none')

  const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  /** Arbre des lieux (par « Fait partie de ») ou des scénarios (par pages enfants, de tout type). */
  const tree = $derived.by((): TreeItem<CatalogEntry>[] => {
    if (!st.asTree) return []
    if (mode === 'lieu') {
      const ids = new Set(base.map(e => e.id))
      const parentOf = (e: CatalogEntry) => {
        const p = relationIds(e.props.partieDe)[0]
        return p && ids.has(p) && p !== e.id ? p : null
      }
      return buildTree(
        base.filter(e => !parentOf(e)),
        id => base.filter(e => parentOf(e) === id),
      )
    }
    return buildTree(
      base.filter(e => !e.parentId || !catalog.byId.get(e.parentId) || catalog.byId.get(e.parentId)!.archived),
      id => catalog.active.filter(e => e.parentId === id),
    )
  })
</script>

{#if mode === 'doublons'}
  <DuplicatesList {onOpen} {onMerge} />
{:else}
  <section class="list" aria-labelledby="liste-titre">
    <header>
      <h2 id="liste-titre">
        {mode === 'archives' ? '🗄' : TYPE_DEFS[mode].icon}
        {title} <span class="count">{items.length}{items.length !== base.length ? ` / ${base.length}` : ''}</span>
      </h2>
      {#if mode === 'document'}
        <button class="primary" onclick={() => fileInput?.click()} title="Importer des images ou des PDF (ou les glisser sur l'app)"
          >+ Importer…</button
        >
        <input
          bind:this={fileInput}
          type="file"
          multiple
          accept={Object.keys(ACCEPTED).join(',')}
          hidden
          onchange={e => {
            const files = [...(e.currentTarget.files ?? [])]
            e.currentTarget.value = ''
            if (files.length) onImport(files)
          }}
        />
      {:else if mode !== 'archives'}
        <button class="primary" onclick={onCreate} title="Nouvelle fiche (Ctrl+N)">+ Nouvelle</button>
      {/if}
    </header>

    {#if base.length}
      <div class="tools">
        <input type="search" bind:value={st.text} placeholder="Filtrer par nom…" aria-label="Filtrer par nom" />
        {#each filterDefs as f (f.key)}
          {@const opts = choices(f)}
          {#if opts.length}
            <label class="filter">
              <span class="label">{f.label}</span>
              <select bind:value={st.filters[f.key]}>
                <option value="">Tous</option>
                {#each opts as o (o.value)}<option value={o.value}>{o.label} ({o.n})</option>{/each}
              </select>
            </label>
          {/if}
        {/each}
        {#if active}
          <button class="reset" onclick={() => ((st.filters = {}), (st.text = ''))}>Effacer les filtres</button>
        {/if}
        {#if treeable}
          <button
            class="toggle"
            class:on={st.asTree}
            aria-pressed={st.asTree}
            onclick={() => (st.asTree = !st.asTree)}
            title={st.asTree ? 'Afficher en tableau' : 'Afficher en arbre'}>{st.asTree ? '≡ Tableau' : '🌳 Arbre'}</button
          >
        {/if}
      </div>
    {/if}

    {#snippet branch(list: TreeItem<CatalogEntry>[], depth: number)}
      {#each list as t (t.node.id)}
        {@const open = st.expanded[t.node.id] ?? depth === 0}
        <li style="--depth: {depth}">
          <div class="tree-row">
            {#if t.children.length}
              <button
                class="twisty"
                aria-expanded={open}
                aria-label={open ? 'Replier' : 'Déplier'}
                onclick={() => (st.expanded[t.node.id] = !open)}>{open ? '▾' : '▸'}</button
              >
            {:else}
              <span class="twisty"></span>
            {/if}
            <button class="row" onclick={() => onOpen(t.node.id)} onauxclick={ev => ev.button === 1 && onOpen(t.node.id)}>
              <span class="icon" aria-hidden="true">{TYPE_DEFS[t.node.type].icon}</span>
              <span class="title">{t.node.title}</span>
              {#if t.children.length}<span class="n">{t.children.length}</span>{/if}
            </button>
          </div>
        </li>
        {#if open && t.children.length}{@render branch(t.children, depth + 1)}{/if}
      {/each}
    {/snippet}

    <div class="body">
      {#if st.asTree && tree.length}
        <ul class="tree">{@render branch(tree, 0)}</ul>
      {:else if items.length}
        <table>
          <thead>
            <tr>
              <th aria-sort={ariaSort('titre')}><button onclick={() => sortBy('titre')}>Nom{arrow('titre')}</button></th>
              {#if mode === 'archives'}
                <th aria-sort={ariaSort('type')}><button onclick={() => sortBy('type')}>Type{arrow('type')}</button></th>
              {/if}
              {#each columns as c (c.key)}
                <th aria-sort={ariaSort(c.key)}><button onclick={() => sortBy(c.key)}>{c.label}{arrow(c.key)}</button></th>
              {/each}
              <th class="date" aria-sort={ariaSort('modif')}><button onclick={() => sortBy('modif')}>Modifiée{arrow('modif')}</button></th>
            </tr>
          </thead>
          <tbody>
            {#each items as e (e.id)}
              <tr onclick={() => onOpen(e.id)} onauxclick={ev => ev.button === 1 && onOpen(e.id)}>
                <td class="name">
                  <button onclick={ev => (ev.stopPropagation(), onOpen(e.id))}>
                    <span class="icon" aria-hidden="true">{TYPE_DEFS[e.type].icon}</span>
                    <span class="title">{e.title}</span>
                    {#if e.pinned}<span class="pin" title="Épinglée">📌</span>{/if}
                  </button>
                  {#if e.aliases.length}<span class="alias">{e.aliases.join(' · ')}</span>{/if}
                </td>
                {#if mode === 'archives'}<td>{TYPE_DEFS[e.type].label}</td>{/if}
                {#each columns as c (c.key)}<td>{cell(e, c)}</td>{/each}
                <td class="date">{dateFmt.format(new Date(e.updatedAt))}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p class="empty">
          {#if base.length}Aucune fiche ne correspond aux filtres.
          {:else if mode === 'archives'}Aucune fiche archivée.
          {:else}Aucune fiche de ce type pour l'instant.{/if}
        </p>
      {/if}
    </div>
  </section>
{/if}

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
    padding: 14px 20px 8px;
  }
  h2 {
    margin: 0;
    font-size: 1.4rem;
  }
  .count {
    color: var(--muted);
    font-weight: normal;
    font-size: 1rem;
  }
  header button {
    min-height: 40px;
    padding: 0 14px;
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px;
    padding: 4px 20px 12px;
    border-bottom: 1px solid var(--line);
  }
  .tools input[type='search'] {
    flex: 1 1 220px;
    max-width: 320px;
    min-height: 40px;
  }
  .filter {
    display: grid;
    gap: 2px;
  }
  .filter select {
    min-height: 40px;
    width: auto;
    max-width: 220px;
  }
  .reset,
  .toggle {
    min-height: 40px;
    padding: 0 12px;
  }
  .toggle.on {
    border-color: var(--accent);
    color: var(--accent);
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--surface);
    border-bottom: 1px solid var(--line);
    text-align: left;
    padding: 0;
  }
  th button {
    width: 100%;
    min-height: 40px;
    padding: 0 12px;
    border: none;
    background: none;
    text-align: left;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
    white-space: nowrap;
  }
  th button:hover {
    color: var(--text);
  }
  tbody tr {
    cursor: pointer;
    border-bottom: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
  }
  tbody tr:hover {
    background: var(--bg);
  }
  td {
    padding: 6px 12px;
    vertical-align: middle;
    font-size: 0.92rem;
  }
  /* Une ligne par cellule ; un texte long (plusieurs factions) est coupé, la ligne garde sa hauteur. */
  td:not(.name) {
    white-space: nowrap;
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  td.name {
    min-width: 200px;
  }
  td.name button {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    padding: 0;
    border: none;
    background: none;
    text-align: left;
    font-weight: 600;
  }
  .alias {
    display: block;
    margin-left: calc(1.4em + 8px);
    color: var(--muted);
    font-size: 0.8rem;
  }
  .date {
    white-space: nowrap;
    color: var(--muted);
  }
  .icon {
    width: 1.4em;
    text-align: center;
    flex: none;
  }
  .pin {
    font-size: 0.8rem;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 6px 14px;
  }
  .tree-row {
    display: flex;
    align-items: center;
    padding-left: calc(var(--depth) * 18px);
  }
  .twisty {
    flex: none;
    width: 32px;
    min-height: 40px;
    padding: 0;
    border: none;
    background: none;
    color: var(--muted);
  }
  .tree-row .row {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    min-height: 40px;
    padding: 4px 8px;
    border: none;
    background: none;
    text-align: left;
  }
  .tree-row .row:hover {
    background: var(--bg);
  }
  .n {
    color: var(--muted);
    font-size: 0.8rem;
  }
  .empty {
    margin: 16px 20px;
    color: var(--muted);
  }
</style>
