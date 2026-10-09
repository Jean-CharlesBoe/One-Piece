<script lang="ts">
  import type { Snippet } from 'svelte'
  import { onBack } from './back'

  // Fenêtre qui monte du bas de l'écran. Se ferme par ✕, tap à côté, Échap ou bouton retour Android.
  let { open = $bindable(false), title, children }: { open: boolean; title: string; children: Snippet } = $props()

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
  onclose={() => (open = false)}
  onclick={e => {
    if (e.target === dlg) open = false
  }}
>
  <div class="sheet">
    <header>
      <h2>{title}</h2>
      <button class="close" onclick={() => (open = false)} aria-label="Fermer">✕</button>
    </header>
    {#if open}
      {@render children()}
    {/if}
  </div>
</dialog>

<style>
  dialog {
    margin: auto auto 0;
    width: 100%;
    max-width: 560px;
    max-height: 90dvh;
    padding: 0;
    border: none;
    border-radius: 16px 16px 0 0;
    background: var(--surface);
    color: var(--text);
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.45);
  }
  .sheet {
    padding: 8px 16px calc(16px + env(safe-area-inset-bottom));
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font-size: 1.15rem;
  }
  .close {
    border: none;
    background: none;
    font-size: 1.2rem;
    padding: 0 8px;
  }
</style>
