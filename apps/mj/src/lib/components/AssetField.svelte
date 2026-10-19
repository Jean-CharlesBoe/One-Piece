<script lang="ts">
  import { ACCEPTED, sizeLabel } from '../model/asset'
  import { media } from '../media.svelte'

  // Champ « fichier » d'une fiche (Document, cahier §4.6) : choisir une image ou un PDF, le remplacer, le retirer.
  // Le fichier remplacé reste dans les médias (il n'est jamais supprimé automatiquement, D-M23).
  let { id, label, value, onChange }: { id: string; label: string; value: unknown; onChange: (v: string | undefined) => void } = $props()

  const asset = $derived(typeof value === 'string' ? media.byId.get(value) : undefined)
  let input: HTMLInputElement
  let error = $state('')
  let busy = $state(false)

  async function pick() {
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    busy = true
    error = ''
    try {
      onChange((await media.importFile(file)).id)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      busy = false
    }
  }
</script>

<div class="asset-field">
  {#if asset}
    <p class="current">
      {asset.mime === 'application/pdf' ? '📄' : '🖼'} <b>{asset.originalName}</b> <span class="muted">{sizeLabel(asset.size)}</span>
    </p>
  {:else if typeof value === 'string'}
    <p class="muted">Fichier introuvable.</p>
  {/if}
  <div class="row">
    <button type="button" {id} onclick={() => input.click()} disabled={busy} aria-label="{label} : choisir un fichier">
      {busy ? 'Import…' : asset ? 'Remplacer…' : 'Choisir un fichier…'}
    </button>
    {#if typeof value === 'string'}<button type="button" onclick={() => onChange(undefined)}>Retirer</button>{/if}
  </div>
  <input bind:this={input} type="file" accept={Object.keys(ACCEPTED).join(',')} onchange={pick} hidden />
  {#if error}<p class="err" role="alert">{error}</p>{/if}
</div>

<style>
  .asset-field {
    display: grid;
    gap: 6px;
  }
  .current {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .row button {
    min-height: 40px;
    padding: 0 12px;
  }
  .muted {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .err {
    color: var(--danger);
    margin: 0;
  }
</style>
