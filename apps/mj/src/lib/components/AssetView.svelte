<script lang="ts">
  import { isImage, isPdf, sizeLabel } from '../model/asset'
  import { media } from '../media.svelte'

  // Aperçu d'un média dans une fiche Document (cahier §4.6) : l'image, ou le PDF dans le lecteur du navigateur
  // (zoom, pages). « Plein écran » ouvre la visionneuse ; « Télécharger » ressort le fichier tel quel (D-M16).
  let { id }: { id: string } = $props()

  const asset = $derived(media.byId.get(id))
  let url = $state<string | null>(null)
  let loaded = $state(false)

  $effect(() => {
    void media.version
    const current = id
    loaded = false
    void media.url(current).then(u => {
      if (current !== id) return
      url = u
      loaded = true
    })
  })
</script>

{#if !asset}
  <p class="missing">Fichier introuvable.</p>
{:else}
  <div class="asset">
    <div class="bar">
      <span class="name" title={asset.originalName}>{isPdf(asset) ? '📄' : '🖼'} {asset.originalName}</span>
      <span class="size">{sizeLabel(asset.size)}{asset.width ? ` · ${asset.width} × ${asset.height}` : ''}</span>
      <span class="spacer"></span>
      {#if url}
        <button onclick={() => (media.viewing = id)}>⛶ Plein écran</button>
        <button onclick={() => media.download(id)}>⬇ Télécharger</button>
      {/if}
    </div>
    {#if loaded && !url}
      <p class="missing">
        Ce fichier n'est pas encore sur cet appareil. Il arrive avec la sauvegarde du dossier Drive (quand l'autre
        appareil l'y a écrit).
      </p>
    {:else if url && isImage(asset)}
      <button class="frame" onclick={() => (media.viewing = id)} title="Plein écran">
        <img src={url} alt={asset.originalName} />
      </button>
    {:else if url && isPdf(asset)}
      <iframe src={url} title={asset.originalName}></iframe>
    {/if}
  </div>
{/if}

<style>
  .asset {
    display: grid;
    gap: 8px;
    margin: 12px 0;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .name {
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .size {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .spacer {
    flex: 1;
  }
  .bar button {
    min-height: 40px;
    padding: 0 12px;
  }
  .frame {
    padding: 0;
    border: 1px solid var(--line);
    background: var(--bg);
    min-height: 0;
    cursor: zoom-in;
    justify-self: start;
    max-width: 100%;
  }
  img {
    display: block;
    max-width: 100%;
    max-height: 70dvh;
  }
  iframe {
    width: 100%;
    height: 75dvh;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg);
  }
  .missing {
    color: var(--muted);
    font-style: italic;
  }
</style>
