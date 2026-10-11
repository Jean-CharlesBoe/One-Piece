<script lang="ts">
  import { addFruit, FRUIT_RAPPEL, FRUIT_TYPES, fruitTechniques, isFruitEmpty, MEMO_FRUIT, removeFruit } from '@onepiece/core'
  import InfoButton from '@onepiece/core/ui/InfoButton.svelte'
  import type { Character, Compagnon } from '../model/character'

  // Fruit du démon (cahier joueur §4.3, D-J4). Mode jeu : bloc replié (nom, type), masqué si vide ;
  // mode édition : formulaire. Ses techniques sont les compétences d'origine « fruit ».
  let {
    character,
    editing,
    onShowTechniques,
  }: { character: Character | Compagnon; editing: boolean; onShowTechniques: () => void } = $props()

  let open = $state(false)
  let confirmRemove = $state(false)
  let confirmTimer: ReturnType<typeof setTimeout> | undefined

  const techniques = $derived(fruitTechniques(character).length)

  // Retrait en deux temps : un premier tap arme le bouton, un second confirme.
  function remove() {
    if (!confirmRemove) {
      confirmRemove = true
      clearTimeout(confirmTimer)
      confirmTimer = setTimeout(() => (confirmRemove = false), 4000)
      return
    }
    confirmRemove = false
    removeFruit(character)
  }
</script>

{#if editing}
  {#if character.fruit}
    {@const fruit = character.fruit}
    <section class="card fruit" aria-labelledby="fruit-titre">
      <div class="title-row">
        <h2 class="label" id="fruit-titre">Fruit du démon</h2>
        <InfoButton memo={MEMO_FRUIT} />
      </div>
      <div class="form">
        <label class="wide">
          <span class="label">Nom du fruit</span>
          <input bind:value={fruit.nom} maxlength="120" placeholder="ex. Fruit de la chance" autocomplete="off" />
        </label>
        <label class="wide">
          <span class="label">Type</span>
          <select bind:value={fruit.type}>
            <option value="">—</option>
            {#each FRUIT_TYPES as t (t)}
              <option value={t}>{t}</option>
            {/each}
          </select>
        </label>
        <label class="wide">
          <span class="label">Description</span>
          <textarea bind:value={fruit.description} maxlength="20000" placeholder="Pouvoirs, limites…"></textarea>
        </label>
        <label class="wide">
          <span class="label">Éveil (facultatif)</span>
          <textarea bind:value={fruit.eveil} maxlength="20000"></textarea>
        </label>
      </div>
      <button class="danger remove" onclick={remove}>{confirmRemove ? 'Confirmer : retirer le fruit' : 'Retirer le fruit'}</button>
    </section>
  {:else}
    <button class="add" onclick={() => addFruit(character)}>+ Fruit du démon</button>
  {/if}
{:else if character.fruit && !isFruitEmpty(character.fruit)}
  {@const fruit = character.fruit}
  <section class="card fruit" aria-label="Fruit du démon">
    <div class="head-row">
    <button class="head" onclick={() => (open = !open)} aria-expanded={open}>
      <span class="label">Fruit du démon</span>
      <span class="name">{fruit.nom || 'Sans nom'}</span>
      {#if fruit.type}<span class="pill">{fruit.type}</span>{/if}
      <span class="chevron" aria-hidden="true">{open ? '▴' : '▾'}</span>
    </button>
    <InfoButton memo={MEMO_FRUIT} />
    </div>
    {#if open}
      <div class="details">
        {#if fruit.description}<p class="text">{fruit.description}</p>{/if}
        {#if fruit.eveil}
          <p class="label">Éveil</p>
          <p class="text">{fruit.eveil}</p>
        {/if}
        <p class="rappel">{FRUIT_RAPPEL}</p>
      </div>
    {/if}
    {#if techniques > 0}
      <button class="link" onclick={onShowTechniques}>Voir les techniques ({techniques})</button>
    {/if}
  </section>
{/if}

<style>
  .fruit {
    border-left: 4px solid var(--fruit);
  }
  h2 {
    margin: 0;
  }
  .title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .head-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .form {
    display: grid;
    gap: 10px;
  }
  .form label {
    display: grid;
    gap: 4px;
  }
  .remove {
    width: 100%;
    margin-top: 12px;
  }
  .add {
    width: 100%;
    border-style: dashed;
    color: var(--muted);
  }
  .head {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 8px;
    width: 100%;
    min-height: 36px;
    padding: 0;
    border: none;
    background: none;
    text-align: left;
  }
  .head .label {
    flex-basis: 100%;
  }
  .name {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pill {
    padding: 1px 10px;
    border: 1px solid var(--fruit);
    border-radius: 999px;
    color: var(--fruit);
    font-size: 0.8rem;
  }
  .chevron {
    color: var(--muted);
  }
  .details {
    display: grid;
    gap: 6px;
    margin-top: 8px;
  }
  .details p {
    margin: 0;
  }
  .text {
    white-space: pre-wrap;
  }
  .rappel {
    font-size: 0.85rem;
    font-style: italic;
    color: var(--muted);
  }
  .link {
    min-height: 36px;
    margin-top: 8px;
    padding: 0;
    border: none;
    background: none;
    color: var(--accent);
    font-weight: 600;
  }
</style>
