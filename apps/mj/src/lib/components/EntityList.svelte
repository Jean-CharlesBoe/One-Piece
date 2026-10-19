<script lang="ts" module>
  import type { EntityType } from '../model/types'

  /** Contenu de la colonne liste : un type de fiches, les archives ou les doublons probables. */
  export type ListMode = EntityType | 'archives' | 'doublons'
</script>

<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import type { CatalogEntry } from '../model/entity'
  import { nameKey } from '../model/links'
  import { relationIds, subtitle } from '../model/props'
  import { buildTree, type TreeItem } from '../model/tree'
  import { TYPE_DEFS, type FieldDef } from '../model/types'
  import DuplicatesList from './DuplicatesList.svelte'

  // Liste des fiches d'un type ou des archives (cahier MJ §4.3, §4.5) : filtre par nom, filtres sur les
  // propriétés « filterable » du registre (rôle, état, faction…), tri par titre ou par date de modification.
  // Lieux et scénarios ont aussi une vue « Arbre » : lieux par « Fait partie de », scénarios par pages enfants.
  let {
    mode,
    selectedId,
    onOpen,
    onCreate,
    onMerge,
  }: {
    mode: ListMode
    selectedId: string | null
    onOpen: (id: string) => void
    onCreate: () => void
    onMerge: (a: string, b: string) => void
  } = $props()

  type Sort = 'titre' | 'modif'
  let text = $state('')
  let filters = $state<Record<string, string>>({})
  let sort = $state<Sort>('titre')
  let showFilters = $state(false)
  let asTree = $state(false)
  let expanded = $state<Record<string, boolean>>({})

  // Nouveau type affiché : filtres remis à zéro.
  $effect(() => {
    void mode
    text = ''
    filters = {}
    showFilters = false
    asTree = false
  })

  const treeable = $derived(mode === 'lieu' || mode === 'scenario')

  /** Arbre des lieux (par « Fait partie de ») ou des scénarios (par pages enfants, de tout type). */
  const tree = $derived.by((): TreeItem<CatalogEntry>[] => {
    if (!asTree) return []
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

  /** Valeurs d'un champ pour une fiche, sous forme de chaînes (identifiants pour les relations). */
  function valuesOf(e: CatalogEntry, f: FieldDef): string[] {
    const v = e.props[f.key]
    if (f.field.kind === 'relation') return relationIds(v)
    if (Array.isArray(v)) return v.map(String)
    return v === undefined || v === null || v === '' ? [] : [String(v)]
  }

  /** Choix proposés pour un filtre : valeurs présentes dans la liste, avec leur nombre. */
  function choices(f: FieldDef): { value: string; label: string; n: number }[] {
    const counts = new Map<string, number>()
    for (const e of base) for (const v of valuesOf(e, f)) counts.set(v, (counts.get(v) ?? 0) + 1)
    const label = (v: string) => (f.field.kind === 'relation' ? catalog.title(v) : v)
    return [...counts]
      .map(([value, n]) => ({ value, label: label(value), n }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
  }

  const active = $derived(Object.values(filters).filter(Boolean).length + (text.trim() ? 1 : 0))

  const items = $derived.by(() => {
    const k = nameKey(text)
    const list = base.filter(
      e =>
        (!k || [e.title, ...e.aliases].some(n => nameKey(n).includes(k))) &&
        filterDefs.every(f => !filters[f.key] || valuesOf(e, f).includes(filters[f.key])),
    )
    return sort === 'modif' ? [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : list
  })

  function open_(ev: MouseEvent, id: string) {
    onOpen(id)
  }
</script>

{#if mode === 'doublons'}
  <DuplicatesList {onOpen} {onMerge} />
{:else}
  <section class="list" aria-labelledby="liste-titre">
    <header>
      <h2 id="liste-titre">{title} <span class="count">{items.length}{items.length !== base.length ? ` / ${base.length}` : ''}</span></h2>
      {#if mode !== 'archives'}
        <button class="primary" onclick={onCreate} title="Nouvelle fiche (Ctrl+N)">+ Nouvelle</button>
      {/if}
    </header>

    {#if base.length}
      <div class="tools">
        <input type="search" bind:value={text} placeholder="Filtrer par nom…" aria-label="Filtrer par nom" />
        {#if treeable}
          <button
            class="toggle"
            class:on={asTree}
            aria-pressed={asTree}
            onclick={() => (asTree = !asTree)}
            title={asTree ? 'Afficher en liste' : 'Afficher en arbre'}>{asTree ? '≡' : '🌳'}</button
          >
        {/if}
        <button
          class="toggle"
          class:on={showFilters || active > 0}
          aria-expanded={showFilters}
          onclick={() => (showFilters = !showFilters)}
          title="Filtres et tri">⚲{active ? ` ${active}` : ''}</button
        >
      </div>
      {#if showFilters}
        <div class="filters">
          {#each filterDefs as f (f.key)}
            {@const opts = choices(f)}
            {#if opts.length}
              <label>
                <span class="label">{f.label}</span>
                <select bind:value={filters[f.key]}>
                  <option value="">Tous</option>
                  {#each opts as o (o.value)}<option value={o.value}>{o.label} ({o.n})</option>{/each}
                </select>
              </label>
            {/if}
          {/each}
          <label>
            <span class="label">Tri</span>
            <select bind:value={sort}>
              <option value="titre">Par titre</option>
              <option value="modif">Modifiées récemment</option>
            </select>
          </label>
          {#if active}
            <button class="reset" onclick={() => ((filters = {}), (text = ''))}>Effacer les filtres</button>
          {/if}
        </div>
      {/if}
    {/if}

    {#snippet branch(list: TreeItem<CatalogEntry>[], depth: number)}
      {#each list as t (t.node.id)}
        {@const open = expanded[t.node.id] ?? depth === 0}
        <li style="--depth: {depth}">
          <div class="tree-row">
            {#if t.children.length}
              <button
                class="twisty"
                aria-expanded={open}
                aria-label={open ? 'Replier' : 'Déplier'}
                onclick={() => (expanded[t.node.id] = !open)}>{open ? '▾' : '▸'}</button
              >
            {:else}
              <span class="twisty"></span>
            {/if}
            <button
              class="row"
              class:on={t.node.id === selectedId}
              aria-current={t.node.id === selectedId}
              onclick={ev => open_(ev, t.node.id)}
              onauxclick={ev => ev.button === 1 && onOpen(t.node.id)}
            >
              <span class="icon" aria-hidden="true">{TYPE_DEFS[t.node.type].icon}</span>
              <span class="text"><span class="title">{t.node.title}</span></span>
              {#if t.children.length}<span class="n">{t.children.length}</span>{/if}
            </button>
          </div>
        </li>
        {#if open && t.children.length}{@render branch(t.children, depth + 1)}{/if}
      {/each}
    {/snippet}

    {#if asTree && tree.length}
      <ul class="tree">{@render branch(tree, 0)}</ul>
    {:else if items.length}
      <ul>
        {#each items as e (e.id)}
          {@const sub = subtitle(e, id => catalog.title(id))}
          <li>
            <button
              class:on={e.id === selectedId}
              aria-current={e.id === selectedId}
              onclick={ev => open_(ev, e.id)}
              onauxclick={ev => ev.button === 1 && onOpen(e.id)}
            >
              <span class="icon" aria-hidden="true">{TYPE_DEFS[e.type].icon}</span>
              <span class="text">
                <span class="title">{e.title}</span>
                {#if sub}<span class="sub">{sub}</span>{/if}
              </span>
              {#if e.pinned}<span class="pin" title="Épinglée">📌</span>{/if}
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">
        {#if base.length}Aucune fiche ne correspond aux filtres.
        {:else if mode === 'archives'}Aucune fiche archivée.
        {:else}Aucune fiche de ce type pour l'instant.{/if}
      </p>
    {/if}
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
    min-height: 40px;
    padding: 0 12px;
  }
  .tools {
    display: flex;
    gap: 6px;
    padding: 8px 8px 0;
  }
  .tools input {
    min-height: 40px;
  }
  .toggle {
    min-height: 40px;
    padding: 0 12px;
  }
  .toggle.on {
    border-color: var(--accent);
    color: var(--accent);
  }
  .filters {
    display: grid;
    gap: 8px;
    padding: 8px;
    border-bottom: 1px solid var(--line);
  }
  .filters label {
    display: grid;
    gap: 2px;
  }
  .filters select {
    min-height: 40px;
  }
  .reset {
    min-height: 40px;
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
    min-height: 44px;
    padding: 4px 10px;
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
  }
  li button.on .title {
    font-weight: 600;
  }
  .icon {
    width: 1.4em;
    text-align: center;
  }
  .text {
    flex: 1;
    display: grid;
    min-width: 0;
  }
  .title,
  .sub {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    color: var(--muted);
    font-size: 0.8rem;
  }
  .pin {
    font-size: 0.8rem;
  }
  .tree-row {
    display: flex;
    align-items: center;
    padding-left: calc(var(--depth) * 16px);
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
  .tree-row .row.on {
    background: var(--bg);
    box-shadow: inset 3px 0 0 var(--accent);
    font-weight: 600;
  }
  .n {
    color: var(--muted);
    font-size: 0.8rem;
  }
  .empty {
    margin: 16px 12px;
    color: var(--muted);
  }
</style>
