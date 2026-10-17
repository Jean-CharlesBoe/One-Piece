<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import type { CatalogEntry } from '../model/entity'
  import { nameKey } from '../model/links'
  import { relationIds } from '../model/props'
  import { TYPE_DEFS, type EntityType, type FieldDef } from '../model/types'

  // Champ « → » : choisir une ou plusieurs fiches des types permis, par leur titre ou un alias ;
  // « Créer… » si la fiche n'existe pas encore (D-M8 : on cherche d'abord, on crée ensuite).
  let {
    def,
    value,
    selfId,
    onChange,
    onCreate,
  }: {
    def: FieldDef
    value: unknown
    selfId: string
    onChange: (value: string | string[] | undefined) => void
    onCreate: (type: EntityType, title: string) => Promise<string | null>
  } = $props()

  const rel = $derived(def.field.kind === 'relation' ? def.field : null)
  const ids = $derived(relationIds(value))
  const id = $props.id()

  let query = $state('')
  let active = $state(0)

  type Option = { entry: CatalogEntry; via: string } | { create: EntityType }

  const options = $derived.by((): Option[] => {
    if (!rel || !query.trim()) return []
    const k = nameKey(query)
    const found: Option[] = []
    for (const e of catalog.active) {
      if (found.length >= 8) break
      if (e.id === selfId || ids.includes(e.id) || !rel.to.includes(e.type)) continue
      const via = [e.title, ...e.aliases].find(n => nameKey(n).includes(k))
      if (via) found.push({ entry: e, via: via === e.title ? '' : via })
    }
    const exact = found.some(o => 'entry' in o && nameKey(o.entry.title) === k)
    if (!exact) for (const t of rel.to.slice(0, 3)) found.push({ create: t })
    return found
  })

  function set(next: string[]) {
    onChange(next.length ? (rel?.multiple ? next : next[0]) : undefined)
  }

  async function pick(o: Option) {
    let target: string | null
    if ('entry' in o) target = o.entry.id
    else target = await onCreate(o.create, query.trim())
    query = ''
    active = 0
    if (target) set(rel?.multiple ? [...ids, target] : [target])
  }

  function onKey(e: KeyboardEvent) {
    if (!options.length) return
    if (e.key === 'ArrowDown') active = (active + 1) % options.length
    else if (e.key === 'ArrowUp') active = (active - 1 + options.length) % options.length
    else if (e.key === 'Enter') void pick(options[active])
    else if (e.key === 'Escape') query = ''
    else return
    e.preventDefault()
    e.stopPropagation()
  }
</script>

<div class="rel">
  <label class="label" for={id}>{def.label}</label>
  <div class="box">
    {#each ids as target (target)}
      <span class="chip" class:gone={!catalog.byId.has(target)}>
        {catalog.title(target)}
        <button type="button" aria-label="Retirer {catalog.title(target)}" onclick={() => set(ids.filter(x => x !== target))}>✕</button>
      </span>
    {/each}
    {#if rel?.multiple || !ids.length}
      <input
        {id}
        bind:value={query}
        oninput={() => (active = 0)}
        onkeydown={onKey}
        placeholder={rel ? rel.to.map(t => TYPE_DEFS[t].label).slice(0, 3).join(', ') + '…' : ''}
        autocomplete="off"
        role="combobox"
        aria-expanded={options.length > 0}
        aria-controls="{id}-options"
      />
    {/if}
  </div>
  {#if options.length}
    <ul id="{id}-options" role="listbox">
      {#each options as o, i (i)}
        <li role="option" aria-selected={i === active}>
          <button type="button" class:on={i === active} onmousedown={e => e.preventDefault()} onclick={() => void pick(o)}>
            {#if 'entry' in o}
              {TYPE_DEFS[o.entry.type].icon} {o.entry.title}
              {#if o.via}<span class="muted">(alias : {o.via})</span>{/if}
            {:else}
              + Créer « {query.trim()} » ({TYPE_DEFS[o.create].label})
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .rel {
    position: relative;
    display: grid;
    gap: 4px;
  }
  .box {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 4px 6px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px 2px 10px;
    border-radius: 999px;
    background: var(--bg);
    font-size: 0.9rem;
  }
  .chip.gone {
    color: var(--danger);
  }
  .chip button {
    min-height: 36px;
    padding: 0 6px;
    border: none;
    background: none;
    color: var(--muted);
  }
  input {
    flex: 1;
    min-width: 140px;
    min-height: 30px;
    padding: 2px 4px;
    border: none;
    background: none;
  }
  input:focus-visible {
    outline: none;
  }
  ul {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 5;
    margin: 2px 0 0;
    padding: 4px;
    list-style: none;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    box-shadow: 0 6px 18px rgb(0 0 0 / 0.18);
  }
  li button {
    width: 100%;
    min-height: 40px;
    border: none;
    background: none;
    text-align: left;
    padding: 0 8px;
  }
  li button.on {
    background: var(--bg);
  }
  .muted {
    color: var(--muted);
  }
</style>
