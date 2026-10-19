<script lang="ts">
  import { tick } from 'svelte'
  import { SKILL_ORIGINS, skillOriginLabel, type SkillOrigin } from '../model/identity'
  import type { Skill } from '../model/skills'
  import { moveItem, removeById } from '../rules/lists'
  import { parseIntInput } from '../rules/numbers'
  import { MEMO_COMPETENCES } from '../rules/memos'
  import { addSkill, filterSkills, updateSkill, usedOrigins, type SkillFilter } from '../rules/skills'
  import InfoButton from './InfoButton.svelte'

  // Liste de compétences (cahier joueur §4.7), reprise de Sans Nom. Sert au personnage, aux compagnons
  // et aux PNJ. Coût en Endurance affiché seulement : la dépense se fait dans le losange (D-J12).
  // Le filtre par origine ne s'applique qu'en mode jeu ; en édition, toute la liste reste visible.
  let {
    owner,
    editing,
    filter = $bindable<SkillFilter>('toutes'),
    unit = 'End.',
    color = '--endurance',
    noun = 'compétence',
    emptyHint = 'Touche le crayon pour en ajouter.',
  }: {
    owner: { competences: Skill[] }
    editing: boolean
    filter?: SkillFilter
    unit?: string
    color?: string
    /** Nom des éléments (féminin) : « compétence » (Vivre Card), « technique » (PNJ de l'appli MJ). */
    noun?: string
    /** Conseil affiché sous une liste vide, hors édition. */
    emptyHint?: string
  } = $props()

  let expanded = $state<Record<string, boolean>>({})
  let confirmDelete = $state<string | null>(null)
  let confirmTimer: ReturnType<typeof setTimeout> | undefined
  let listEl: HTMLElement

  const origins = $derived(usedOrigins(owner.competences))
  // Un filtre sur une origine qui n'existe plus revient à « Toutes ».
  const active = $derived<SkillFilter>(filter !== 'toutes' && origins.includes(filter) ? filter : 'toutes')
  const shown = $derived(editing ? owner.competences : filterSkills(owner.competences, active))
  const allOpen = $derived(shown.length > 0 && shown.every(s => expanded[s.id]))

  function toggleAll() {
    const open = !allOpen
    expanded = { ...expanded, ...Object.fromEntries(shown.map(s => [s.id, open])) }
  }

  async function add() {
    const s = addSkill(owner)
    await tick()
    listEl.querySelector<HTMLInputElement>(`[data-id="${s.id}"] input`)?.focus()
  }

  function commitCost(skill: Skill, input: HTMLInputElement) {
    const t = input.value.trim()
    if (t === '') updateSkill(skill, { cout: null })
    else {
      const n = parseIntInput(t)
      if (n !== null) updateSkill(skill, { cout: n })
    }
    input.value = skill.cout === null ? '' : String(skill.cout)
  }

  // Suppression en deux temps : un premier tap arme le bouton, un second confirme.
  function remove(id: string) {
    if (confirmDelete !== id) {
      confirmDelete = id
      clearTimeout(confirmTimer)
      confirmTimer = setTimeout(() => (confirmDelete = null), 4000)
      return
    }
    confirmDelete = null
    removeById(owner.competences, id)
  }

  const firstLine = (t: string) => t.split('\n').find(l => l.trim()) ?? ''
  const originColor = (o: SkillOrigin) => (o ? `var(--o-${o})` : 'var(--line)')
</script>

<div class="head">
  <span class="count">
    <span class="label">{shown.length} {noun}{shown.length > 1 ? 's' : ''}</span>
    <InfoButton memo={MEMO_COMPETENCES} />
  </span>
  {#if !editing && shown.length > 1}
    <button class="small" onclick={toggleAll}>{allOpen ? 'Tout replier' : 'Tout déplier'}</button>
  {/if}
</div>

{#if !editing && origins.length > 0}
  <div class="filters" role="radiogroup" aria-label="Filtrer par origine">
    <button role="radio" aria-checked={active === 'toutes'} class:on={active === 'toutes'} onclick={() => (filter = 'toutes')}>
      Toutes
    </button>
    {#each origins as o (o)}
      <button
        role="radio"
        aria-checked={active === o}
        class:on={active === o}
        style="--o: {originColor(o)}"
        onclick={() => (filter = o)}>{skillOriginLabel(o, true)}</button
      >
    {/each}
  </div>
{/if}

<ul bind:this={listEl} style="--cost: var({color})">
  {#each shown as skill, i (skill.id)}
    <li class="card" data-id={skill.id} style="--o: {originColor(skill.origine)}">
      {#if editing}
        <div class="edit-top">
          <input
            class="title-input"
            value={skill.titre}
            oninput={e => updateSkill(skill, { titre: e.currentTarget.value })}
            maxlength="120"
            placeholder="Titre"
            aria-label="Titre de la {noun} {i + 1}"
            autocomplete="off"
          />
          <input
            class="cost-input"
            value={skill.cout ?? ''}
            onchange={e => commitCost(skill, e.currentTarget)}
            inputmode="numeric"
            placeholder="Coût"
            aria-label="Coût en Endurance de la {noun} {i + 1}"
            autocomplete="off"
          />
        </div>
        <select
          class="origin-input"
          value={skill.origine}
          onchange={e => updateSkill(skill, { origine: e.currentTarget.value as SkillOrigin })}
          aria-label="Origine de la {noun} {i + 1}"
        >
          <option value="">Origine : non précisée</option>
          {#each SKILL_ORIGINS as [k, l] (k)}
            <option value={k}>Origine : {l}</option>
          {/each}
        </select>
        <textarea
          value={skill.description}
          oninput={e => updateSkill(skill, { description: e.currentTarget.value })}
          maxlength="20000"
          placeholder="Description"
          aria-label="Description de la {noun} {i + 1}"
        ></textarea>
        <div class="actions">
          <button class="small" onclick={() => moveItem(owner.competences, i, -1)} disabled={i === 0} aria-label="Monter {skill.titre || `la ${noun}`}">↑</button>
          <button class="small" onclick={() => moveItem(owner.competences, i, 1)} disabled={i === owner.competences.length - 1} aria-label="Descendre {skill.titre || `la ${noun}`}">↓</button>
          <span class="spacer"></span>
          <button class="small danger" onclick={() => remove(skill.id)}>
            {confirmDelete === skill.id ? 'Confirmer' : 'Supprimer'}
          </button>
        </div>
      {:else}
        <button
          class="summary"
          onclick={() => (expanded[skill.id] = !expanded[skill.id])}
          aria-expanded={!!expanded[skill.id]}
        >
          <span class="title">
            {skill.titre || 'Sans titre'}
            {#if skill.origine}<span class="origin">{skillOriginLabel(skill.origine, true)}</span>{/if}
          </span>
          {#if skill.cout !== null}
            <span class="cost">{skill.cout} {unit}</span>
          {/if}
          <span class="chevron" aria-hidden="true">{expanded[skill.id] ? '▴' : '▾'}</span>
        </button>
        {#if expanded[skill.id]}
          <p class="desc">{skill.description || 'Pas de description.'}</p>
        {:else if skill.description}
          <p class="preview">{firstLine(skill.description)}</p>
        {/if}
      {/if}
    </li>
  {/each}
</ul>

{#if owner.competences.length === 0}
  <p class="empty">
    Aucune {noun}.{#if !editing && emptyHint} {emptyHint}{/if}
  </p>
{/if}

{#if editing}
  <button class="primary add" onclick={add}>+ Ajouter une {noun}</button>
{/if}

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 36px;
    margin-bottom: 8px;
  }
  .count {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }
  .filters button {
    --o: var(--accent);
    min-height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    border-color: var(--o);
    color: var(--o);
    font-size: 0.9rem;
  }
  .filters button.on {
    background: var(--o);
    color: var(--surface);
    font-weight: 600;
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
    border-left: 4px solid var(--o);
  }
  .summary {
    display: flex;
    align-items: center;
    gap: 10px;
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
  .origin {
    display: inline-block;
    margin-left: 6px;
    padding: 0 8px;
    border: 1px solid var(--o);
    border-radius: 999px;
    color: var(--o);
    font-size: 0.75rem;
    font-weight: 500;
    vertical-align: 1px;
  }
  .cost {
    flex: none;
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--cost) 18%, transparent);
    color: var(--cost);
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
  }
  .chevron {
    color: var(--muted);
  }
  .desc,
  .preview {
    margin: 0;
    padding: 10px 12px 12px;
    border-top: 1px solid var(--line);
  }
  .desc {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .preview {
    padding-top: 0;
    border-top: none;
    margin-top: -4px;
    color: var(--muted);
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .edit-top {
    display: grid;
    grid-template-columns: 1fr 84px;
    gap: 8px;
    padding: 10px 10px 0;
  }
  .title-input {
    font-weight: 600;
  }
  .cost-input {
    text-align: center;
  }
  .origin-input {
    display: block;
    width: calc(100% - 20px);
    margin: 8px 10px 0;
  }
  textarea {
    display: block;
    width: calc(100% - 20px);
    margin: 8px 10px 0;
  }
  .actions {
    display: flex;
    gap: 6px;
    padding: 8px 10px 10px;
  }
  .spacer {
    flex: 1;
  }
  .small {
    min-height: 36px;
    font-size: 0.9rem;
  }
  .empty {
    color: var(--muted);
  }
  .add {
    width: 100%;
    margin-top: 12px;
  }
</style>
