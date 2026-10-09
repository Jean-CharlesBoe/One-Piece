<script lang="ts">
  import { STATS, statLabel, type StatKey } from '../model/stats'
  import { addTempBonus, clearTempBonuses, removeTempBonus, type HasStats } from '../rules/stats'
  import Sheet from './Sheet.svelte'

  // Bonus temporaires (« +N sur une carac »), utilisables en mode jeu. Pas de durée : retrait à la main.
  let { owner }: { owner: HasStats } = $props()
  const uid = $props.id()

  let open = $state(false)
  let carac = $state<StatKey>('robustesse')
  let valeur = $state(1)
  let origine = $state('')
  let confirmClear = $state(false)

  const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

  function add(event: SubmitEvent) {
    event.preventDefault()
    if (addTempBonus(owner, carac, valeur, origine)) {
      open = false
      valeur = 1
      origine = ''
    }
  }

  function clearAll() {
    if (!confirmClear) {
      confirmClear = true
      setTimeout(() => (confirmClear = false), 4000)
      return
    }
    confirmClear = false
    clearTempBonuses(owner)
  }
</script>

<section aria-labelledby="{uid}-titre">
  <div class="head">
    <h2 class="label" id="{uid}-titre">Bonus temporaires</h2>
    <button class="add" onclick={() => (open = true)}>+ Bonus</button>
  </div>
  {#if owner.bonusTemporaires.length}
    <ul>
      {#each owner.bonusTemporaires as b (b.id)}
        <li class:up={b.valeur > 0} class:down={b.valeur < 0}>
          <span><strong>{statLabel(b.carac)} {signed(b.valeur)}</strong>{#if b.origine}<span class="origin">{` · ${b.origine}`}</span>{/if}</span>
          <button class="remove" onclick={() => removeTempBonus(owner, b.id)} aria-label="Retirer le bonus {statLabel(b.carac)} {signed(b.valeur)}">✕</button>
        </li>
      {/each}
    </ul>
    {#if owner.bonusTemporaires.length > 1}
      <button class="clear" onclick={clearAll}>{confirmClear ? 'Confirmer : tout retirer' : 'Tout retirer'}</button>
    {/if}
  {:else}
    <p class="empty">Aucun bonus en cours.</p>
  {/if}
</section>

<Sheet bind:open title="Ajouter un bonus temporaire">
  <form onsubmit={add}>
    <label>
      <span class="label">Carac</span>
      <select bind:value={carac}>
        {#each STATS as [k, l] (k)}
          <option value={k}>{l}</option>
        {/each}
      </select>
    </label>
    <div class="label">Valeur</div>
    <div class="value">
      <button type="button" onclick={() => (valeur -= 1)} aria-label="Diminuer">−</button>
      <output class:up={valeur > 0} class:down={valeur < 0}>{signed(valeur)}</output>
      <button type="button" onclick={() => (valeur += 1)} aria-label="Augmenter">+</button>
    </div>
    <label>
      <span class="label">Origine (facultatif)</span>
      <input bind:value={origine} maxlength="120" placeholder="ex. Haki de l'Observation" autocomplete="off" />
    </label>
    <button class="primary" type="submit" disabled={valeur === 0}>Ajouter</button>
  </form>
</Sheet>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    margin: 0;
  }
  .add {
    min-height: 36px;
  }
  ul {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 4px 4px 12px;
    border: 1px solid var(--line);
    border-left: 4px solid currentColor;
    border-radius: var(--radius);
    background: var(--surface);
  }
  li span {
    color: var(--text);
  }
  .origin {
    color: var(--muted) !important;
  }
  .remove {
    border: none;
    background: none;
    min-width: 44px;
    padding: 0;
  }
  .clear {
    margin-top: 6px;
    min-height: 36px;
    font-size: 0.85rem;
  }
  .empty {
    margin: 6px 0 0;
    color: var(--muted);
    font-size: 0.9rem;
  }
  .up {
    color: var(--up);
  }
  .down {
    color: var(--down);
  }
  form {
    display: grid;
    gap: 12px;
    margin-top: 16px;
  }
  form label {
    display: grid;
    gap: 4px;
  }
  .value {
    display: grid;
    grid-template-columns: 56px 1fr 56px;
    align-items: center;
    margin-top: -8px;
  }
  output {
    text-align: center;
    font-size: 1.5rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
</style>
