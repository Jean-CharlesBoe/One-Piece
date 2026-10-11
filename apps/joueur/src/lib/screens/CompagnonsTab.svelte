<script lang="ts">
  import { moveItem, onBack, removeById } from '@onepiece/core'
  import Sheet from '@onepiece/core/ui/Sheet.svelte'
  import { addCompagnon, type Character } from '../model/character'
  import CompagnonView from './CompagnonView.svelte'

  // Liste des compagnons (cahier joueur §4.8, D-J5) → tap = fiche, « + Ajouter » = nouveau compagnon.
  let { character, editing }: { character: Character; editing: boolean } = $props()

  let openId = $state<string | null>(null)
  let addOpen = $state(false)
  let newName = $state('')

  const current = $derived(character.compagnons.find(c => c.id === openId) ?? null)

  // Bouton retour Android : depuis une fiche de compagnon, revenir à la liste des compagnons.
  $effect(() => {
    if (!current) return
    return onBack(() => (openId = null))
  })

  function create(event: SubmitEvent) {
    event.preventDefault()
    const nom = newName.trim()
    if (!nom) return
    const c = addCompagnon(character, nom)
    newName = ''
    addOpen = false
    openId = c.id
  }

  function remove(id: string) {
    removeById(character.compagnons, id)
    openId = null
  }
</script>

{#if current}
  <div class="sub-head">
    <button class="back" onclick={() => (openId = null)}>← Compagnons</button>
    <h2>{current.nom || 'Sans nom'}</h2>
  </div>
  <CompagnonView compagnon={current} {editing} onDelete={() => remove(current.id)} />
{:else}
  <div class="head">
    <span class="label">{character.compagnons.length} compagnon{character.compagnons.length > 1 ? 's' : ''}</span>
    <button class="primary" onclick={() => (addOpen = true)}>+ Ajouter</button>
  </div>

  {#if character.compagnons.length === 0}
    <p class="empty">Aucun compagnon pour l'instant : animal, monture, Den Den Mushi…</p>
  {:else}
    <ul>
      {#each character.compagnons as cp, i (cp.id)}
        <li>
          <button class="card item" onclick={() => (openId = cp.id)}>
            <span class="name">{cp.nom || 'Sans nom'}</span>
            {#if cp.type || cp.race}
              <span class="meta">{[cp.type, cp.race].filter(Boolean).join(' · ')}</span>
            {/if}
            <span class="res">
              <span class="vitalite">Vitalité {cp.ressources.vitalite.cur}/{cp.ressources.vitalite.max}</span>
              <span class="endurance">Endurance {cp.ressources.endurance.cur}/{cp.ressources.endurance.max}</span>
            </span>
          </button>
          {#if editing}
            <div class="order">
              <button onclick={() => moveItem(character.compagnons, i, -1)} disabled={i === 0} aria-label="Monter {cp.nom}">↑</button>
              <button
                onclick={() => moveItem(character.compagnons, i, 1)}
                disabled={i === character.compagnons.length - 1}
                aria-label="Descendre {cp.nom}">↓</button
              >
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
{/if}

<Sheet bind:open={addOpen} title="Nouveau compagnon">
  <form onsubmit={create}>
    <label class="visually-hidden" for="new-compagnon">Nom du compagnon</label>
    <input id="new-compagnon" bind:value={newName} maxlength="120" placeholder="Nom (ex. Karoo)" autocomplete="off" />
    <button class="primary" type="submit" disabled={!newName.trim()}>Créer</button>
  </form>
</Sheet>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .empty {
    color: var(--muted);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  li {
    display: flex;
    gap: 8px;
  }
  .item {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
    text-align: left;
    padding: 10px 14px;
  }
  .name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .res {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
  }
  .vitalite {
    color: var(--vitalite);
  }
  .endurance {
    color: var(--endurance);
  }
  .order {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .order button {
    flex: 1;
    min-height: 36px;
    padding: 0 12px;
  }
  .sub-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: -4px 0 16px;
  }
  .back {
    min-height: 36px;
    font-size: 0.9rem;
  }
  h2 {
    margin: 0;
    font-size: 1.2rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  form {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    margin-top: 16px;
  }
</style>
