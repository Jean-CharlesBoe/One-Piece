<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { Resource } from '../model/resources'
  import ResourceSheet from './ResourceSheet.svelte'

  // Losange « actuel / max ». `color` : nom de la variable CSS (ex. "--vitalite").
  // Un tap ouvre la fenêtre de dépense / récupération ; `note` et `extra` y sont transmis (voir ResourceSheet).
  let {
    label,
    res,
    color,
    editing,
    open = $bindable(false),
    note = '',
    extra,
  }: {
    label: string
    res: Resource
    color: string
    editing: boolean
    open?: boolean
    note?: string
    extra?: Snippet
  } = $props()
  const fill = $derived(res.max > 0 ? Math.round((res.cur / res.max) * 100) : 0)
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

<ResourceSheet bind:open {label} {res} {editing} {note} {extra} />

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 0;
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
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--c);
  }
  .regen {
    max-width: 100%;
    font-size: 0.75rem;
    color: var(--muted);
    text-align: center;
  }
</style>
