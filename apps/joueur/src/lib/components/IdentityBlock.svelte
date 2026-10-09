<script lang="ts">
  import {
    CLASSES,
    hasTribu,
    mainClasse,
    RACES,
    setClasse,
    setRace,
    TRIBUS,
    type Classe,
    type Race,
    type Tribu,
  } from '@onepiece/core'
  import type { Character } from '../model/character'

  // Identité (cahier joueur §4.1). Mode jeu : bloc compact ; mode édition : formulaire.
  let { character, editing }: { character: Character; editing: boolean } = $props()

  let reveOpen = $state(false)

  const tribuLabel = $derived(hasTribu(character) ? (TRIBUS.find(([k]) => k === character.tribu)?.[1] ?? '') : '')
  const summary = $derived(
    [
      character.race,
      tribuLabel && character.tribu ? tribuLabel : '',
      character.classes.join(', '),
      character.age ? `${character.age} ans` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  )
</script>

{#if editing}
  <div class="form">
    <label class="wide">
      <span class="label">Nom</span>
      <input bind:value={character.nom} maxlength="120" autocomplete="off" />
    </label>
    <label class="wide">
      <span class="label">Surnom / titre</span>
      <input bind:value={character.titre} maxlength="120" placeholder="ex. le Démon rouge" autocomplete="off" />
    </label>
    <label>
      <span class="label">Race</span>
      <select value={character.race} onchange={e => setRace(character, e.currentTarget.value as Race | '')}>
        <option value="">—</option>
        {#each RACES as r (r)}
          <option value={r}>{r}</option>
        {/each}
      </select>
    </label>
    <label>
      <span class="label">Âge</span>
      <input bind:value={character.age} maxlength="40" inputmode="numeric" autocomplete="off" />
    </label>
    {#if hasTribu(character)}
      <label class="wide">
        <span class="label">Tribu</span>
        <select bind:value={character.tribu}>
          {#each TRIBUS as [k, l] (k)}
            <option value={k as Tribu}>{l}</option>
          {/each}
        </select>
      </label>
    {/if}
    <label class="wide">
      <span class="label">Classe</span>
      <select value={mainClasse(character)} onchange={e => setClasse(character, e.currentTarget.value as Classe | '')}>
        <option value="">—</option>
        {#each CLASSES as cl (cl)}
          <option value={cl}>{cl}</option>
        {/each}
      </select>
    </label>
    <label class="wide">
      <span class="label">Rêve</span>
      <textarea bind:value={character.reve} maxlength="2000" placeholder="La raison de prendre la mer"></textarea>
    </label>
  </div>
{:else}
  <div class="view">
    {#if character.titre}<p class="titre">{character.titre}</p>{/if}
    {#if summary}<p class="summary">{summary}</p>{/if}
    {#if character.reve}
      <button class="reve" class:open={reveOpen} onclick={() => (reveOpen = !reveOpen)} aria-expanded={reveOpen}>
        <span class="label">Rêve</span>
        <span class="text">{character.reve}</span>
      </button>
    {/if}
    {#if !character.titre && !summary && !character.reve}
      <p class="summary hint">Race, classe, rêve… : touche le crayon pour remplir.</p>
    {/if}
  </div>
{/if}

<style>
  .form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .form label {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .wide {
    grid-column: 1 / -1;
  }
  .view {
    display: grid;
    gap: 4px;
  }
  .view p {
    margin: 0;
  }
  .titre {
    font-style: italic;
    font-size: 1.05rem;
  }
  .summary {
    color: var(--muted);
  }
  .hint {
    font-size: 0.9rem;
  }
  .reve {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-height: 36px;
    padding: 6px 10px;
    text-align: left;
  }
  .reve .text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .reve.open .text {
    white-space: pre-wrap;
  }
</style>
