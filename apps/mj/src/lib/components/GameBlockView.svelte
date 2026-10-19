<script lang="ts">
  import {
    addCustomResource,
    isEvanoui,
    MEMO_CARACS,
    MEMO_COMPETENCES,
    MEMO_RESSOURCES,
    moveItem,
    removeById,
    renameCustomResource,
    setCustomResourceRule,
    TRIBUS,
    type CustomResource,
  } from '@onepiece/core'
  import InfoButton from '@onepiece/core/ui/InfoButton.svelte'
  import ResourceDiamond from '@onepiece/core/ui/ResourceDiamond.svelte'
  import SkillList from '@onepiece/core/ui/SkillList.svelte'
  import StatGrid from '@onepiece/core/ui/StatGrid.svelte'
  import TempBonuses from '@onepiece/core/ui/TempBonuses.svelte'
  import { CATEGORIES, categoryXp, HAKI_TYPES, masteredHaki, type GameBlock } from '../model/gameBlock'

  // Bloc de jeu d'un PNJ (cahier §4.4, D-M24, D-M25), comme une fiche de Vivre Card : en lecture, « mode jeu »
  // (losanges cliquables, bonus temporaires, équipement et inventaire) ; en édition, caracs, maximums, ressources
  // supplémentaires, tribu, rêve, catégorie, techniques et Haki. Ambition et tribu : Humains seulement (`human`,
  // d'après la race liée). Les composants modifient le bloc ; toute modification prévient `onChange`.
  let { block, editing, human, onChange }: { block: GameBlock; editing: boolean; human: boolean; onChange: () => void } = $props()

  const uid = $props.id()
  let previous: string | undefined
  $effect(() => {
    const now = JSON.stringify(block)
    if (previous !== undefined && now !== previous) onChange()
    previous = now
  })

  const xp = $derived(categoryXp(block.categorie))
  const haki = $derived(masteredHaki(block))
  const tribuLabel = $derived(human && block.tribu ? (TRIBUS.find(([k]) => k === block.tribu)?.[1] ?? '') : '')

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

  {#if editing}
    <div class="ident">
      {#if human}
        <label>
          <span class="label">Tribu</span>
          <select bind:value={block.tribu}>
            {#each TRIBUS as [k, l] (k)}<option value={k}>{l}</option>{/each}
          </select>
        </label>
      {/if}
      <label class="wide">
        <span class="label">Rêve</span>
        <input bind:value={block.reve} maxlength="2000" placeholder="Le rêve du PNJ" />
      </label>
    </div>
  {:else if tribuLabel || block.reve}
    <p class="ident-read">
      {#if tribuLabel}<span>Tribu : <b>{tribuLabel}</b></span>{/if}
      {#if block.reve}<span>Rêve : <b>{block.reve}</b></span>{/if}
    </p>
  {/if}

  <div class="sec-head">
    <h4 class="label">Caractéristiques</h4>
    <InfoButton memo={MEMO_CARACS} />
  </div>
  <StatGrid owner={block} {editing} />
  <TempBonuses owner={block} />

  <div class="res-head">
    <div class="sec-head">
      <h4 class="label">Ressources</h4>
      <InfoButton memo={MEMO_RESSOURCES} />
    </div>
    {#if editing}<button class="small" onclick={addResource}>+ Ressource</button>{/if}
  </div>
  {#if isEvanoui(block.ressources.endurance) && block.ressources.endurance.max > 0}
    <p class="evanoui" role="status">Évanoui : Endurance à 0</p>
  {/if}
  <div class="diamonds">
    <ResourceDiamond label="Vitalité" res={block.ressources.vitalite} color="--vitalite" {editing} />
    <ResourceDiamond label="Endurance" res={block.ressources.endurance} color="--endurance" {editing} />
    <ResourceDiamond label="Rêve" res={block.ressources.reve} color="--reve" {editing} />
    {#if human}
      <ResourceDiamond label="Ambition" res={block.ressources.ambition} color="--ambition" {editing} />
    {/if}
    <ResourceDiamond label="Transfert" res={block.ressources.transfert} color="--transfert" {editing} />
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

  <div class="sec-head">
    <h4 class="label">Techniques</h4>
    <InfoButton memo={MEMO_COMPETENCES} />
  </div>
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

  <!-- Comme Vivre Card : modifiables aussi en mode jeu (objets pris, perdus, donnés pendant la session). -->
  <label class="label" for="{uid}-equipement">Équipement</label>
  <textarea id="{uid}-equipement" bind:value={block.equipement} maxlength="20000"></textarea>
  <label class="label" for="{uid}-inventaire">Inventaire</label>
  <textarea id="{uid}-inventaire" bind:value={block.inventaire} maxlength="20000"></textarea>
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
  .sec-head {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sec-head h4 {
    margin: 0;
  }
  .ident {
    display: grid;
    grid-template-columns: minmax(160px, 220px) 1fr;
    gap: 8px;
  }
  .ident label {
    display: grid;
    gap: 2px;
  }
  .ident .wide:only-child {
    grid-column: 1 / -1;
  }
  .ident select,
  .ident input {
    min-height: 40px;
  }
  .ident-read {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
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
