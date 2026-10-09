<script lang="ts">
  import type { Resource } from '../model/resources'
  import { parseIntInput } from '../rules/numbers'
  import { adjustResource, setRegeneration, setResourceCur, setResourceMax } from '../rules/resources'
  import NumberInput from './NumberInput.svelte'
  import Sheet from './Sheet.svelte'

  // Losange « actuel / max ». `color` : nom de la variable CSS (ex. "--vitalite"). Un tap ouvre la fenêtre de dépense / récupération.
  let { label, res, color, editing }: { label: string; res: Resource; color: string; editing: boolean } = $props()
  const uid = $props.id()

  let open = $state(false)
  let amount = $state('')
  const fill = $derived(res.max > 0 ? Math.round((res.cur / res.max) * 100) : 0)

  function apply(sign: 1 | -1) {
    const n = parseIntInput(amount)
    if (n === null) return
    adjustResource(res, sign * Math.abs(n))
    amount = ''
  }
</script>

<div class="wrap" style="--c: var({color}); --fill: {fill}%">
  <button class="diamond" onclick={() => (open = true)} aria-label="{label} : {res.cur} sur {res.max}">
    <span class="inner">
      <span class="cur">{res.cur}</span>
      <span class="sep"></span>
      <span class="max">{res.max}</span>
    </span>
  </button>
  <span class="label">{label}</span>
  {#if res.regeneration}
    <span class="regen">Régén. {res.regeneration}</span>
  {/if}
</div>

<Sheet bind:open title="{label} : {res.cur} / {res.max}">
  <div class="quick">
    {#each [-10, -5, -1] as d (d)}
      <button onclick={() => adjustResource(res, d)} disabled={res.cur === 0}>{d}</button>
    {/each}
    {#each [1, 5, 10] as d (d)}
      <button onclick={() => adjustResource(res, d)} disabled={res.cur === res.max}>+{d}</button>
    {/each}
  </div>

  <div class="amount">
    <label class="visually-hidden" for="{uid}-montant">Montant</label>
    <input id="{uid}-montant" bind:value={amount} inputmode="numeric" placeholder="Montant" autocomplete="off" />
    <button class="danger" onclick={() => apply(-1)} disabled={parseIntInput(amount) === null}>Retirer</button>
    <button onclick={() => apply(1)} disabled={parseIntInput(amount) === null}>Ajouter</button>
  </div>

  <button class="full" onclick={() => setResourceCur(res, res.max)} disabled={res.cur === res.max}>Remettre au maximum</button>

  {#if editing}
    <div class="edit">
      <label>
        <span class="label">Maximum</span>
        <NumberInput value={res.max} label="Maximum de {label}" onCommit={n => setResourceMax(res, n)} />
      </label>
      <label>
        <span class="label">Régénération</span>
        <input
          value={res.regeneration}
          placeholder="ex. 2D6"
          maxlength="120"
          autocomplete="off"
          onchange={e => setRegeneration(res, e.currentTarget.value)}
        />
      </label>
    </div>
  {:else}
    <p class="hint">Maximum et régénération : passer en mode édition (crayon).</p>
  {/if}
</Sheet>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .diamond {
    width: 72px;
    height: 72px;
    min-height: 0;
    margin: 12px;
    padding: 0;
    transform: rotate(45deg);
    border: 2px solid var(--c);
    border-radius: 8px;
    background: linear-gradient(
      to top left,
      color-mix(in srgb, var(--c) 22%, transparent) var(--fill),
      var(--surface) var(--fill)
    );
  }
  .inner {
    transform: rotate(-45deg);
    display: flex;
    flex-direction: column;
    align-items: center;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }
  .cur {
    font-size: 1.3rem;
    font-weight: 700;
  }
  .sep {
    width: 34px;
    border-top: 1.5px solid var(--text);
    margin: 2px 0;
  }
  .max {
    font-size: 0.9rem;
    color: var(--muted);
  }
  .label {
    color: var(--c);
  }
  .regen {
    font-size: 0.75rem;
    color: var(--muted);
  }
  .quick {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    margin-top: 16px;
  }
  .quick button {
    padding: 0;
    font-variant-numeric: tabular-nums;
  }
  .amount {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 6px;
    margin-top: 10px;
  }
  .full {
    width: 100%;
    margin-top: 10px;
  }
  .edit {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .edit label {
    display: grid;
    gap: 4px;
  }
  .edit .label {
    color: var(--muted);
  }
  .hint {
    margin: 12px 0 0;
    font-size: 0.85rem;
    color: var(--muted);
  }
</style>
