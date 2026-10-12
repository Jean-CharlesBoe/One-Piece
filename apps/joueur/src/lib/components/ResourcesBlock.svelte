<script lang="ts">
  import {
    addCustomResource,
    hasAmbition,
    isEvanoui,
    MEMO_RESSOURCES,
    moveItem,
    removeById,
    renameCustomResource,
    setCustomResourceRule,
    type CustomResource,
  } from '@onepiece/core'
  import InfoButton from '@onepiece/core/ui/InfoButton.svelte'
  import ResourceDiamond from '@onepiece/core/ui/ResourceDiamond.svelte'
  import type { Character, Compagnon } from '../model/character'

  // Ressources (cahier joueur §4.4) : Vitalité, Endurance, Rêve, Ambition (Humain), Transfert puis les ressources
  // personnelles, toutes en losanges, deux par ligne. Nom, règle, ordre et suppression d'une ressource
  // personnelle se règlent dans sa fenêtre, en mode édition.
  let { character, editing }: { character: Character | Compagnon; editing: boolean } = $props()

  const r = $derived(character.ressources)
  const perso = $derived(character.ressourcesPerso)

  let openId = $state<string | null>(null)
  let confirmDelete = $state<string | null>(null)
  let confirmTimer: ReturnType<typeof setTimeout> | undefined

  function add() {
    openId = addCustomResource(perso, 'Nouvelle ressource').id
  }

  // Suppression en deux temps, comme ailleurs dans l'app.
  function remove(res: CustomResource) {
    if (confirmDelete !== res.id) {
      confirmDelete = res.id
      clearTimeout(confirmTimer)
      confirmTimer = setTimeout(() => (confirmDelete = null), 4000)
      return
    }
    confirmDelete = null
    openId = null
    removeById(perso, res.id)
  }
</script>

<section aria-labelledby="ressources-titre">
  <div class="head">
    <div class="title">
      <h2 class="label" id="ressources-titre">Ressources</h2>
      <InfoButton memo={MEMO_RESSOURCES} />
    </div>
    {#if editing}
      <button class="add" onclick={add}>+ Ressource</button>
    {/if}
  </div>

  {#if isEvanoui(r.endurance)}
    <p class="evanoui" role="status">Évanoui : Endurance à 0</p>
  {/if}

  <div class="grid">
    <ResourceDiamond label="Vitalité" res={r.vitalite} color="--vitalite" {editing} />
    <ResourceDiamond label="Endurance" res={r.endurance} color="--endurance" {editing} />
    <ResourceDiamond label="Rêve" res={r.reve} color="--reve" {editing} />
    {#if hasAmbition(character)}
      <ResourceDiamond label="Ambition" res={r.ambition} color="--ambition" {editing} />
    {/if}
    <ResourceDiamond label="Transfert" res={r.transfert} color="--transfert" {editing} />
    {#each perso as res, i (res.id)}
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
              <input
                value={res.nom}
                maxlength="120"
                autocomplete="off"
                onchange={e => renameCustomResource(res, e.currentTarget.value)}
              />
            </label>
            <label>
              <span class="label">Règle</span>
              <textarea
                value={res.regle}
                maxlength="2000"
                placeholder="ex. 1 pt = +1 à un jet ; 10 pts = créer ou annuler un critique"
                onchange={e => setCustomResourceRule(res, e.currentTarget.value)}
              ></textarea>
            </label>
            <div class="tools">
              <button onclick={() => moveItem(perso, i, -1)} disabled={i === 0}>↑ Avant</button>
              <button onclick={() => moveItem(perso, i, 1)} disabled={i === perso.length - 1}>↓ Après</button>
              <button class="danger" onclick={() => remove(res)}>
                {confirmDelete === res.id ? 'Confirmer' : 'Supprimer'}
              </button>
            </div>
          </div>
        {/snippet}
      </ResourceDiamond>
    {/each}
  </div>
</section>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 36px;
  }
  .title {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2 {
    margin: 0;
  }
  .add {
    min-height: 36px;
  }
  .evanoui {
    margin: 8px 0 0;
    padding: 6px 12px;
    border-radius: var(--radius);
    background: var(--endurance);
    color: var(--surface);
    font-weight: 700;
    text-align: center;
  }
  /* Deux losanges par ligne ; l'écart vertical tient compte de la rotation des losanges. */
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    justify-items: center;
    row-gap: 28px;
    margin-top: 8px;
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
  .tools button {
    padding: 0 6px;
  }
</style>
