<script lang="ts">
  import { adjustXp, setXp, XP_COSTS } from '@onepiece/core'
  import NumberInput from '@onepiece/core/ui/NumberInput.svelte'
  import StatGrid from '@onepiece/core/ui/StatGrid.svelte'
  import TempBonuses from '@onepiece/core/ui/TempBonuses.svelte'
  import FruitBlock from '../components/FruitBlock.svelte'
  import IdentityBlock from '../components/IdentityBlock.svelte'
  import ResourcesBlock from '../components/ResourcesBlock.svelte'
  import type { Character } from '../model/character'

  // Onglet Fiche (cahier joueur §4.1 à §4.6).
  let {
    character,
    editing,
    onShowTechniques,
  }: { character: Character; editing: boolean; onShowTechniques: () => void } = $props()
</script>

<div class="tab">
  <IdentityBlock {character} {editing} />

  <FruitBlock {character} {editing} {onShowTechniques} />

  <section aria-label="Caractéristiques">
    <StatGrid owner={character} {editing} />
  </section>

  <TempBonuses owner={character} />

  <ResourcesBlock {character} {editing} />

  <section class="card xp" aria-labelledby="xp-title">
    <h2 class="label" id="xp-title">XP à dépenser</h2>
    <div class="xp-row">
      <button onclick={() => adjustXp(character, -1)} disabled={character.xp === 0} aria-label="Retirer 1 XP">−</button>
      <NumberInput value={character.xp} label="XP à dépenser" onCommit={n => setXp(character, n)} />
      <button onclick={() => adjustXp(character, 1)} aria-label="Ajouter 1 XP">+</button>
    </div>
    <ul class="rule">
      {#each XP_COSTS as [what, cost] (what)}
        <li>{what} : {cost} XP</li>
      {/each}
    </ul>
  </section>

  <section class="card">
    <label class="label" for="equipement">Équipement</label>
    <textarea id="equipement" bind:value={character.equipement} maxlength="20000"></textarea>
  </section>

  <section class="card">
    <label class="label" for="inventaire">Inventaire</label>
    <textarea id="inventaire" bind:value={character.inventaire} maxlength="20000"></textarea>
  </section>
</div>

<style>
  .tab {
    display: grid;
    gap: 20px;
  }
  h2 {
    margin: 0;
  }
  .xp-row {
    display: grid;
    grid-template-columns: 56px 1fr 56px;
    gap: 8px;
    margin-top: 8px;
  }
  .xp-row button {
    padding: 0;
    font-size: 1.2rem;
  }
  .rule {
    margin: 8px 0 0;
    padding-left: 18px;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .card label {
    display: block;
    margin-bottom: 6px;
  }
</style>
