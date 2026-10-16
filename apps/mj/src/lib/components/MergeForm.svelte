<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import type { Entity } from '../model/entity'
  import { nameKey } from '../model/links'
  import { mergeConflicts, type MergeConflict } from '../model/merge'
  import { displayValue, ORPHANS } from '../model/props'
  import { fieldOf, TYPE_DEFS } from '../model/types'
  import { getRepository } from '../storage/repository'

  // Contenu de la fenêtre « Fusionner » (cahier §4.7) : choisir la seconde fiche si besoin, laquelle garder,
  // trancher les conflits de propriétés, puis fusionner. `onMerge` fait l'opération (mergeOps.ts).
  let {
    first,
    second = null,
    onMerge,
  }: {
    first: string
    second?: string | null
    onMerge: (keepId: string, otherId: string, takeOther: Set<string>) => void
  } = $props()

  // svelte-ignore state_referenced_locally
  let keepId = $state(first)
  // svelte-ignore state_referenced_locally
  let otherId = $state<string | null>(second)
  let keep = $state<Entity | null>(null)
  let other = $state<Entity | null>(null)
  let takeOther = $state<Record<string, boolean>>({})
  let query = $state('')

  $effect(() => {
    const [k, o] = [keepId, otherId]
    getRepository().then(async r => {
      keep = await r.getEntity(k)
      other = o ? await r.getEntity(o) : null
      takeOther = {}
    })
  })

  const conflicts = $derived<MergeConflict[]>(keep && other ? mergeConflicts(keep, other) : [])
  /** Propriétés de l'absorbée que le type de la fiche gardée ne connaît pas (elles deviendront orphelines). */
  const lost = $derived(
    keep && other ? Object.keys(other.props).filter(k => k !== ORPHANS && !fieldOf(keep!.type, k)) : [],
  )
  const candidates = $derived.by(() => {
    const k = nameKey(query)
    if (!k) return []
    return catalog.active
      .filter(e => e.id !== keepId && [e.title, ...e.aliases].some(n => nameKey(n).includes(k)))
      .slice(0, 12)
  })

  function swap() {
    if (!otherId) return
    ;[keepId, otherId] = [otherId, keepId]
  }

  const show = (c: MergeConflict, v: unknown) => {
    const f = keep && fieldOf(keep.type, c.key)
    return f ? displayValue(f, v, id => catalog.title(id)) : String(v)
  }
</script>

<div class="merge">
  {#if !otherId}
    <p>Fusionner « {catalog.title(keepId)} » avec :</p>
    <!-- svelte-ignore a11y_autofocus -->
    <input type="search" bind:value={query} placeholder="Chercher l'autre fiche…" autofocus aria-label="Chercher l'autre fiche" />
    <ul class="pick">
      {#each candidates as e (e.id)}
        <li>
          <button onclick={() => (otherId = e.id)}>{TYPE_DEFS[e.type].icon} {e.title} <span class="muted">{TYPE_DEFS[e.type].label}</span></button>
        </li>
      {/each}
    </ul>
  {:else if keep && other}
    <div class="sides">
      <div class="card keep">
        <span class="label">Gardée</span>
        <b>{keep.title}</b>
        <span class="muted">{TYPE_DEFS[keep.type].label}</span>
      </div>
      <button class="swap" onclick={swap} aria-label="Inverser" title="Garder l'autre fiche">⇄</button>
      <div class="card">
        <span class="label">Absorbée</span>
        <b>{other.title}</b>
        <span class="muted">{TYPE_DEFS[other.type].label}</span>
      </div>
    </div>

    <ul class="what">
      <li>« {other.title} »{other.aliases.length ? ` et ses alias` : ''} deviennent des alias de « {keep.title} ».</li>
      <li>Les liens vers « {other.title} » pointent désormais vers « {keep.title} ».</li>
      {#if other.bodyMd.trim()}<li>Son texte est ajouté à la fin, sous « Repris de {other.title} ».</li>{/if}
      <li>Les propriétés vides de « {keep.title} » sont comblées ; « {other.title} » est archivée.</li>
      {#if lost.length}
        <li class="warn">Propriétés gardées en orphelines (inconnues du type {TYPE_DEFS[keep.type].label}) : {lost.join(', ')}.</li>
      {/if}
    </ul>

    {#if conflicts.length}
      <h3 class="label">Valeurs à choisir</h3>
      {#each conflicts as c (c.key)}
        <fieldset>
          <legend>{c.label}</legend>
          <label><input type="radio" name={c.key} checked={!takeOther[c.key]} onchange={() => (takeOther[c.key] = false)} />
            {show(c, c.keep)}</label
          >
          <label><input type="radio" name={c.key} checked={!!takeOther[c.key]} onchange={() => (takeOther[c.key] = true)} />
            {show(c, c.other)}</label
          >
        </fieldset>
      {/each}
    {/if}

    <button
      class="primary"
      onclick={() => onMerge(keepId, otherId!, new Set(Object.keys(takeOther).filter(k => takeOther[k])))}
      >Fusionner</button
    >
  {/if}
</div>

<style>
  .merge {
    display: grid;
    gap: 10px;
    margin-top: 16px;
  }
  p {
    margin: 0;
  }
  ul {
    margin: 0;
  }
  .pick {
    list-style: none;
    padding: 0;
    max-height: 40dvh;
    overflow-y: auto;
  }
  .pick button {
    width: 100%;
    border: none;
    background: none;
    text-align: left;
  }
  .pick button:hover {
    background: var(--bg);
  }
  .sides {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 8px;
    align-items: center;
  }
  .sides .card {
    display: grid;
    gap: 2px;
  }
  .keep {
    border-color: var(--accent);
  }
  .swap {
    padding: 0 12px;
    font-size: 1.2rem;
  }
  .what {
    padding-left: 20px;
    display: grid;
    gap: 4px;
  }
  .muted {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .warn {
    color: var(--reve);
  }
  fieldset {
    display: grid;
    gap: 2px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 6px 10px;
  }
  fieldset label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
  }
  fieldset input {
    width: 20px;
    min-height: 0;
    height: 20px;
    accent-color: var(--accent);
  }
</style>
