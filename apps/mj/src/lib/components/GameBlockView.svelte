<script lang="ts">
  import { addCustomResource, isEvanoui, moveItem, removeById, renameCustomResource, setCustomResourceRule, type CustomResource } from '@onepiece/core'
  import ResourceDiamond from '@onepiece/core/ui/ResourceDiamond.svelte'
  import SkillList from '@onepiece/core/ui/SkillList.svelte'
  import StatGrid from '@onepiece/core/ui/StatGrid.svelte'
  import TempBonuses from '@onepiece/core/ui/TempBonuses.svelte'
  import { CATEGORIES, categoryXp, HAKI_TYPES, masteredHaki, type GameBlock } from '../model/gameBlock'

  // Bloc de jeu d'un PNJ (cahier §4.4, D-M24), avec les composants de Vivre Card : en lecture, « mode jeu »
  // (losanges Vitalité / Endurance cliquables, bonus temporaires) ; en édition, caracs, maximums, ressources
  // supplémentaires, catégorie, techniques et Haki. Les composants modifient le bloc ; toute modification
  // prévient `onChange` (sauvegarde automatique de la fiche).
  let { block, editing, onChange }: { block: GameBlock; editing: boolean; onChange: () => void } = $props()

  const uid = $props.id()
  let previous: string | undefined
  $effect(() => {
    const now = JSON.stringify(block)
    if (previous !== undefined && now !== previous) onChange()
    previous = now
  })

  const xp = $derived(categoryXp(block.categorie))
  const haki = $derived(masteredHaki(block))

  // Ressources supplémentaires : comme Vivre Card (fenêtre du losange en édition : nom, règle, ordre, suppression).
  let openId = $state<string | null>(null)
  let confirmDelete = $state<string | null>(null)
  let confirmTimer: ReturnType<typeof setTimeout> | undefined
  function addResource() {
    openId = addCustomResource(block.ressourcesPerso, 'Nouvelle ressource').id
  }
  function removeResource(res: CustomResource) {
    if (confirmDelete !== res.id) {
      confirmDelete = res.id
      clearTimeout(confirmTimer)
      confirmTimer = setTimeout(() => (confirmDelete = null), 4000)
      return
    }
    confirmDelete = null
    openId = null
    removeById(block.ressourcesPerso, res.id)
  }
</script>

<section class="game" aria-labelledby="{uid}-titre">
  <header>
    <h3 id="{uid}-titre">🎲 Bloc de jeu</h3>
    {#if editing}
      <label class="cat">
        <span class="label">Catégorie d'adversaire</span>
        <select bind:value={block.categorie}>
          <option value="">—</option>
          {#each CATEGORIES as c (c)}<option value={c}>{c} ({categoryXp(c)} XP)</option>{/each}
          {#if block.categorie && !CATEGORIES.includes(block.categorie)}<option value={block.categorie}>{block.categorie} (hors liste)</option>{/if}
        </select>
      </label>
    {:else if block.categorie}
      <p class="cat-read">{block.categorie}{xp !== null ? ` · ${xp} XP` : ''}</p>
    {/if}
  </header>

  <h4 class="label">Caractéristiques</h4>
  <StatGrid owner={block} {editing} />
  <TempBonuses owner={block} />

  <div class="res-head">
    <h4 class="label">Ressources</h4>
    {#if editing}<button class="small" onclick={addResource}>+ Ressource</button>{/if}
  </div>
  {#if isEvanoui(block.ressources.endurance) && block.ressources.endurance.max > 0}
    <p class="evanoui" role="status">Évanoui : Endurance à 0</p>
  {/if}
  <div class="diamonds">
    <ResourceDiamond label="Vitalité" res={block.ressources.vitalite} color="--vitalite" {editing} />
    <ResourceDiamond label="Endurance" res={block.ressources.endurance} color="--endurance" {editing} />
    {#each block.ressourcesPerso as res, i (res.id)}
      <ResourceDiamond
        label={res.nom || 'Sans nom'}
        {res}
        color="--perso"
        {editing}
        note={res.regle}
        bind:open={() => openId === res.id, v => (openId = v ? res.id : null)}
      >
        {#snippet extra()}
          <div class="extra">
            <label>
              <span class="label">Nom</span>
              <input value={res.nom} maxlength="120" autocomplete="off" onchange={e => renameCustomResource(res, e.currentTarget.value)} />
            </label>
            <label>
              <span class="label">Règle</span>
              <textarea value={res.regle} maxlength="2000" onchange={e => setCustomResourceRule(res, e.currentTarget.value)}></textarea>
            </label>
            <div class="tools">
              <button onclick={() => moveItem(block.ressourcesPerso, i, -1)} disabled={i === 0}>↑ Avant</button>
              <button onclick={() => moveItem(block.ressourcesPerso, i, 1)} disabled={i === block.ressourcesPerso.length - 1}>↓ Après</button>
              <button class="danger" onclick={() => removeResource(res)}>{confirmDelete === res.id ? 'Confirmer' : 'Supprimer'}</button>
            </div>
          </div>
        {/snippet}
      </ResourceDiamond>
    {/each}
  </div>

  <h4 class="label">Techniques</h4>
  <SkillList owner={block} {editing} noun="technique" emptyHint="Ctrl+E pour en ajouter." />

  <h4 class="label">Haki</h4>
  {#if editing}
    <div class="haki-edit">
      {#each HAKI_TYPES as [k, label] (k)}
        <div class="haki-row">
          <label class="check"><input type="checkbox" bind:checked={block.haki[k].maitrise} /> {label} maîtrisé</label>
          <input bind:value={block.haki[k].notes} maxlength="2000" placeholder="Notes ({label})" aria-label="Notes : Haki {label}" />
        </div>
      {/each}
    </div>
  {:else if haki.length || HAKI_TYPES.some(([k]) => block.haki[k].notes)}
    <ul class="haki">
      {#each HAKI_TYPES.filter(([k]) => block.haki[k].maitrise || block.haki[k].notes) as [k, label] (k)}
        <li><b>{label}</b> : {block.haki[k].maitrise ? 'maîtrisé' : 'non maîtrisé'}{block.haki[k].notes ? ` — ${block.haki[k].notes}` : ''}</li>
      {/each}
    </ul>
  {:else}
    <p class="muted">Aucun Haki maîtrisé.</p>
  {/if}
</section>

<style>
  .game {
    margin: 16px 0;
    padding: 12px 14px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--bg) 40%, var(--surface));
    display: grid;
    gap: 8px;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  h3 {
    margin: 0;
    font-size: 1.1rem;
  }
  h4 {
    margin: 10px 0 0;
  }
  .cat {
    display: grid;
    gap: 2px;
    min-width: 240px;
  }
  .cat select {
    min-height: 40px;
  }
  .cat-read {
    margin: 0;
    font-weight: 600;
  }
  .res-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .small {
    min-height: 36px;
    padding: 0 12px;
  }
  .evanoui {
    margin: 0;
    padding: 6px 12px;
    border-radius: var(--radius);
    background: var(--endurance);
    color: var(--surface);
    font-weight: 700;
    text-align: center;
  }
  /* Losanges : autant que la largeur le permet ; l'écart vertical tient compte de leur rotation. */
  .diamonds {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    justify-items: center;
    row-gap: 28px;
    margin: 8px 0;
  }
  .extra {
    display: grid;
    gap: 10px;
  }
  .extra label {
    display: grid;
    gap: 4px;
  }
  .tools {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
  }
  .haki-edit {
    display: grid;
    gap: 6px;
  }
  .haki-row {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 8px;
    align-items: center;
  }
  .haki-row input:not([type='checkbox']) {
    min-height: 40px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
  }
  .check input {
    width: 20px;
    height: 20px;
    min-height: 0;
    accent-color: var(--accent);
  }
  .haki {
    margin: 0;
    padding-left: 18px;
  }
  .muted {
    margin: 0;
    color: var(--muted);
  }
</style>
