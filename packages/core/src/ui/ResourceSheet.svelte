<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { Resource } from '../model/resources'
  import { parseIntInput } from '../rules/numbers'
  import { adjustResource, setRegeneration, setResourceCur, setResourceMax } from '../rules/resources'
  import NumberInput from './NumberInput.svelte'
  import Sheet from './Sheet.svelte'

  // Fenêtre de dépense / récupération d'une ressource (losange ou ressource perso).
  // `note` : règle affichée en haut (ex. ressource perso) ; `extra` : contenu ajouté en bas en mode édition.
  let {
    open = $bindable(false),
    label,
    res,
    editing,
    note = '',
    extra,
  }: { open: boolean; label: string; res: Resource; editing: boolean; note?: string; extra?: Snippet } = $props()
  const uid = $props.id()

  let amount = $state('')

  function apply(sign: 1 | -1) {
    const n = parseIntInput(amount)
    if (n === null) return
    adjustResource(res, sign * Math.abs(n))
    amount = ''
  }
</script>

<Sheet bind:open title="{label} : {res.cur} / {res.max}">
  {#if note}
    <p class="note">{note}</p>
  {/if}
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
          placeholder="ex. 2D6 + 4"
          maxlength="120"
          autocomplete="off"
          onchange={e => setRegeneration(res, e.currentTarget.value)}
        />
      </label>
      {#if extra}
        <div class="extra">{@render extra()}</div>
      {/if}
    </div>
  {:else}
    <p class="hint">Maximum et régénération : passer en mode édition (crayon).</p>
  {/if}
</Sheet>

<style>
  .note {
    margin: 8px 0 0;
    color: var(--muted);
    white-space: pre-wrap;
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
  .extra {
    grid-column: 1 / -1;
  }
  .hint {
    margin: 12px 0 0;
    font-size: 0.85rem;
    color: var(--muted);
  }
</style>
