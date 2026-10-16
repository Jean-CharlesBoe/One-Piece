<script lang="ts">
  import type { Entity } from '../model/entity'
  import { TYPE_DEFS, type EntityType, type FieldDef } from '../model/types'
  import ChipsInput from './ChipsInput.svelte'
  import RelationField from './RelationField.svelte'

  // Formulaire des propriétés, généré depuis le registre des types (MODELE_DONNEES §3).
  // Une valeur vidée est retirée de `props`.
  let {
    entity,
    onChange,
    onCreate,
  }: {
    entity: Entity
    onChange: () => void
    onCreate: (type: EntityType, title: string) => Promise<string | null>
  } = $props()

  const fields = $derived(TYPE_DEFS[entity.type].fields)
  const uid = $props.id()

  function set(key: string, v: unknown) {
    if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) delete entity.props[key]
    else entity.props[key] = v
    onChange()
  }

  function setNumber(def: FieldDef, text: string) {
    const t = text.replace(/[\s  ]/g, '').replace(',', '.')
    if (!t) return set(def.key, undefined)
    const n = Number(t)
    if (Number.isFinite(n)) set(def.key, n)
  }

  const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '')
</script>

{#if fields.length}
  <div class="form">
    {#each fields as def (def.key)}
      {@const f = def.field}
      {@const v = entity.props[def.key]}
      {@const fid = `${uid}-${def.key}`}
      <div class="field" class:wide={f.kind === 'longtext' || f.kind === 'relation' || f.kind === 'multiselect'}>
        {#if f.kind === 'relation'}
          <RelationField {def} value={v} selfId={entity.id} onChange={x => set(def.key, x)} {onCreate} />
        {:else if f.kind === 'multiselect'}
          <ChipsInput label={def.label} values={Array.isArray(v) ? (v as string[]) : []} onChange={x => set(def.key, x)} />
        {:else}
          <label class="label" for={fid}>{def.label}</label>
          {#if f.kind === 'text'}
            <input id={fid} value={str(v)} oninput={e => set(def.key, e.currentTarget.value)} />
          {:else if f.kind === 'longtext'}
            <textarea id={fid} value={str(v)} oninput={e => set(def.key, e.currentTarget.value)}></textarea>
          {:else if f.kind === 'number'}
            <input
              id={fid}
              inputmode="decimal"
              value={typeof v === 'number' ? v.toLocaleString('fr-FR') : ''}
              onchange={e => setNumber(def, e.currentTarget.value)}
            />
          {:else if f.kind === 'select'}
            <select id={fid} value={str(v)} onchange={e => set(def.key, e.currentTarget.value)}>
              <option value="">—</option>
              {#each f.options as o (o)}<option value={o}>{o}</option>{/each}
              {#if str(v) && !f.options.includes(str(v))}<option value={str(v)}>{str(v)} (hors liste)</option>{/if}
            </select>
          {:else if f.kind === 'gameBlock'}
            <p id={fid} class="later">{v ? 'Bloc de jeu présent.' : 'Aucun.'} Son édition arrive à l'étape M7.</p>
          {:else if f.kind === 'asset'}
            <p id={fid} class="later">Import de fichiers : étape M6.</p>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .form {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
  .field {
    display: grid;
    gap: 4px;
    align-content: start;
  }
  .field.wide {
    grid-column: 1 / -1;
  }
  input,
  select {
    min-height: 40px;
  }
  .later {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
  }
</style>
