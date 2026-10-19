<script lang="ts">
  import { onBack } from '@onepiece/core'
  import { isPdf } from '../model/asset'
  import { media } from '../media.svelte'

  // Visionneuse plein écran (cahier §4.6) : image avec zoom (boutons, Ctrl + molette, pincement du pavé
  // tactile) et défilement ; PDF dans le lecteur du navigateur (son propre zoom et ses pages). Échap ferme.
  let dlg: HTMLDialogElement
  let url = $state<string | null>(null)
  let zoom = $state(0) // 0 = ajusté à l'écran
  const asset = $derived(media.viewing ? media.byId.get(media.viewing) : undefined)

  $effect(() => {
    const id = media.viewing
    if (id && !dlg.open) {
      zoom = 0
      url = null
      void media.url(id).then(u => (url = u))
      dlg.showModal()
    } else if (!id && dlg.open) dlg.close()
  })

  $effect(() => {
    if (!media.viewing) return
    return onBack(() => (media.viewing = null))
  })

  const STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]
  function step(dir: 1 | -1) {
    if (zoom === 0) {
      zoom = dir > 0 ? 1 : 0.5
      return
    }
    const i = STEPS.indexOf(zoom)
    zoom = STEPS[Math.min(STEPS.length - 1, Math.max(0, (i < 0 ? 3 : i) + dir))]
  }

  function onWheel(e: WheelEvent) {
    if (!e.ctrlKey) return
    e.preventDefault()
    step(e.deltaY < 0 ? 1 : -1)
  }
</script>

<dialog bind:this={dlg} onclose={() => (media.viewing = null)} aria-label="Visionneuse">
  {#if asset}
    <div class="viewer">
      <header>
        <span class="name">{asset.originalName}</span>
        {#if !isPdf(asset)}
          <button onclick={() => step(-1)} aria-label="Dézoomer" title="Dézoomer (Ctrl + molette)">−</button>
          <button class="fit" onclick={() => (zoom = zoom ? 0 : 1)} title="Ajuster à l'écran / taille réelle"
            >{zoom ? `${Math.round(zoom * 100)} %` : 'Ajusté'}</button
          >
          <button onclick={() => step(1)} aria-label="Zoomer" title="Zoomer (Ctrl + molette)">+</button>
        {/if}
        <button onclick={() => media.download(asset.id)}>⬇ Télécharger</button>
        <button onclick={() => (media.viewing = null)} aria-label="Fermer" title="Fermer (Échap)">✕</button>
      </header>
      {#if url && isPdf(asset)}
        <iframe src={url} title={asset.originalName}></iframe>
      {:else if url}
        <div class="stage" class:fit={!zoom} onwheel={onWheel} role="presentation">
          <img
            src={url}
            alt={asset.originalName}
            style:width={zoom && asset.width ? `${asset.width * zoom}px` : undefined}
            ondblclick={() => (zoom = zoom ? 0 : 1)}
          />
        </div>
      {:else}
        <p class="missing">Fichier absent de cet appareil.</p>
      {/if}
    </div>
  {/if}
</dialog>

<style>
  dialog {
    width: 100vw;
    height: 100dvh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: none;
    background: #0b0b0d;
    color: #eee;
  }
  dialog::backdrop {
    background: #000;
  }
  .viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: #16171a;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  header button {
    min-height: 40px;
    min-width: 40px;
    padding: 0 12px;
    background: #24262b;
    border-color: #34363d;
    color: #eee;
  }
  .fit {
    min-width: 80px;
  }
  .stage {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: flex;
  }
  .stage img {
    display: block;
    flex: none;
    margin: auto;
    max-width: none;
  }
  .stage.fit img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  iframe {
    flex: 1;
    width: 100%;
    border: none;
    background: #fff;
  }
  .missing {
    margin: auto;
    color: #aaa;
  }
</style>
