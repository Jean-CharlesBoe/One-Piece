<script lang="ts">
  import { STATS, statLabel, type StatKey } from '../model/stats'
  import { bonusTotal, finalStat, setAvantages, stepStat, type HasStats } from '../rules/stats'
  import Sheet from './Sheet.svelte'

  // Grille des 8 caracs (croquis : 3 + 3 + 2). Sert aux PJ, aux compagnons et aux PNJ.
  let { owner, editing }: { owner: HasStats; editing: boolean } = $props()

  let detail = $state<StatKey | null>(null)
  let detailOpen = $state(false)

  const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

  function openDetail(k: StatKey) {
    detail = k
    detailOpen = true
  }
</script>

<div class="grid">
  {#each STATS as [key, label] (key)}
    {@const bonus = bonusTotal(owner, key)}
    {@const av = owner.stats[key].avantages}
    <div class="cell">
      <span class="label name">{label}</span>
      {#if editing}
        <div class="circle edit" aria-label="{label} : valeur {owner.stats[key].valeur}">
          {owner.stats[key].valeur}
        </div>
        <div class="row">
          <button class="step" onclick={() => stepStat(owner, key, -1)} aria-label="Diminuer {label}">−</button>
          <button class="step" onclick={() => stepStat(owner, key, 1)} aria-label="Augmenter {label}">+</button>
        </div>
        <div class="row av-edit">
          <span class="av-label">Av.</span>
          <button class="mini" onclick={() => setAvantages(owner, key, av - 1)} aria-label="Retirer un avantage en {label}">−</button>
          <span class="av-value" class:up={av > 0} class:down={av < 0}>{signed(av)}</span>
          <button class="mini" onclick={() => setAvantages(owner, key, av + 1)} aria-label="Ajouter un avantage en {label}">+</button>
        </div>
      {:else}
        <button
          class="circle"
          class:up={bonus > 0}
          class:down={bonus < 0}
          onclick={() => openDetail(key)}
          aria-label="{label} : {finalStat(owner, key)}{av ? `, ${signed(av)} avantage` : ''}"
        >
          {finalStat(owner, key)}
          {#if av !== 0}
            <span class="badge" class:neg={av < 0}>{signed(av)}</span>
          {/if}
        </button>
      {/if}
    </div>
  {/each}
</div>

<Sheet bind:open={detailOpen} title={detail ? statLabel(detail) : ''}>
  {#if detail}
    {@const st = owner.stats[detail]}
    {@const list = owner.bonusTemporaires.filter(b => b.carac === detail)}
    <dl>
      <dt>Valeur</dt>
      <dd>{st.valeur}</dd>
      {#each list as b (b.id)}
        <dt>{b.origine || 'Bonus temporaire'}</dt>
        <dd class:up={b.valeur > 0} class:down={b.valeur < 0}>{signed(b.valeur)}</dd>
      {/each}
      <dt class="total">Total</dt>
      <dd class="total">{finalStat(owner, detail)}</dd>
      <dt>{st.avantages < 0 ? 'Désavantages' : 'Avantages'}</dt>
      <dd>{Math.abs(st.avantages)}</dd>
    </dl>
  {/if}
</Sheet>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px 8px;
  }
  .cell:nth-child(7) {
    grid-column: 1;
  }
  .cell:nth-child(8) {
    grid-column: 3;
  }
  .cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .name {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.68rem;
  }
  .circle {
    position: relative;
    width: 60px;
    height: 60px;
    min-height: 0;
    padding: 0;
    border-radius: 50%;
    border: 2px solid var(--text);
    background: var(--surface);
    display: grid;
    place-items: center;
    font-size: 1.35rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .circle.edit {
    border-style: dashed;
  }
  .circle.up {
    color: var(--up);
    border-color: var(--up);
  }
  .circle.down {
    color: var(--down);
    border-color: var(--down);
  }
  .badge {
    position: absolute;
    right: -8px;
    bottom: -4px;
    min-width: 24px;
    padding: 0 5px;
    border-radius: 12px;
    background: var(--up);
    color: var(--surface);
    font-size: 0.75rem;
    line-height: 22px;
  }
  .badge.neg {
    background: var(--down);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .step {
    width: 44px;
    padding: 0;
    font-size: 1.2rem;
  }
  .mini {
    width: 30px;
    min-height: 30px;
    padding: 0;
  }
  .av-label {
    font-size: 0.7rem;
    color: var(--muted);
  }
  .av-value {
    min-width: 22px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .up {
    color: var(--up);
  }
  .down {
    color: var(--down);
  }
  dl {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px 16px;
    margin: 16px 0 4px;
  }
  dt {
    color: var(--muted);
  }
  dd {
    margin: 0;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .total {
    font-weight: 700;
    color: var(--text);
    border-top: 1px solid var(--line);
    padding-top: 8px;
  }
</style>
