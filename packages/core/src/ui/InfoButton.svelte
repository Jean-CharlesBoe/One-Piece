<script lang="ts">
  import type { Memo } from '../rules/memos'
  import Sheet from './Sheet.svelte'

  // Petit bouton « i » qui ouvre un mémo de règle dans une fenêtre du bas (D-J7).
  let { memo }: { memo: Memo } = $props()

  let open = $state(false)
</script>

<button class="info" onclick={() => (open = true)} aria-label="Règle : {memo.titre}">i</button>

<Sheet bind:open title={memo.titre}>
  <div class="memo">
    {#each memo.texte as p, i (i)}
      <p>{p}</p>
    {/each}
    {#if memo.liste?.length}
      <dl>
        {#each memo.liste as [label, text] (label)}
          <dt>{label}</dt>
          <dd>{text}</dd>
        {/each}
      </dl>
    {/if}
  </div>
</Sheet>

<style>
  .info {
    width: 24px;
    min-width: 24px;
    height: 24px;
    min-height: 0;
    padding: 0;
    border-radius: 50%;
    border-color: var(--muted);
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 700;
    font-style: italic;
    font-family: Georgia, serif;
    line-height: 1;
  }
  .memo {
    display: grid;
    gap: 8px;
    margin-top: 12px;
  }
  p {
    margin: 0;
  }
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 12px;
    margin: 4px 0 0;
  }
  dt {
    font-weight: 600;
  }
  dd {
    margin: 0;
    color: var(--muted);
  }
</style>
