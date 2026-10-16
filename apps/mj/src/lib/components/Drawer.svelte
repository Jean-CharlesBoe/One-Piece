<script lang="ts">
  import { onBack } from '@onepiece/core'
  import type { Snippet } from 'svelte'

  // Volet latéral des dispositions repliées (D-M10) : barre latérale, liste ou panneau Liens par-dessus la fiche.
  // Se ferme par Échap, clic à côté ou bouton retour Android.
  let {
    open = $bindable(false),
    side = 'left',
    label,
    children,
  }: { open: boolean; side?: 'left' | 'right'; label: string; children: Snippet } = $props()

  let dlg: HTMLDialogElement

  $effect(() => {
    if (open && !dlg.open) dlg.showModal()
    else if (!open && dlg.open) dlg.close()
  })

  $effect(() => {
    if (!open) return
    return onBack(() => (open = false))
  })
</script>

<dialog
  bind:this={dlg}
  class={side}
  aria-label={label}
  onclose={() => (open = false)}
  onclick={e => {
    if (e.target === dlg) open = false
  }}
>
  {#if open}
    <div class="body">{@render children()}</div>
  {/if}
</dialog>

<style>
  dialog {
    margin: 0;
    width: min(340px, 88vw);
    max-width: none;
    height: 100dvh;
    max-height: none;
    padding: 0;
    border: none;
    background: var(--bg);
    color: var(--text);
  }
  dialog.right {
    margin-left: auto;
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.4);
  }
  .body {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
</style>
