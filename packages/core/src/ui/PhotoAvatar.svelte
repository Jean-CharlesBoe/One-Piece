<script lang="ts">
  import type { Photo } from '../model/photo'
  import { loadImage, releaseImage } from '../photo/resize'
  import Sheet from './Sheet.svelte'
  import Thumb from './Thumb.svelte'
  import PhotoCropper from './PhotoCropper.svelte'

  // Portrait rond du personnage ou d'un compagnon (repris de Sans Nom v0.5.2). Voir en grand : toujours.
  // Ajouter / changer / recadrer / retirer : mode édition.
  let { owner, editing }: { owner: { nom: string; photo: Photo | null }; editing: boolean } = $props()

  let open = $state(false)
  let busy = $state(false)
  let error = $state('')
  let confirmRemove = $state(false)
  let cropOpen = $state(false)
  let cropImg = $state<HTMLImageElement | null>(null)
  let input: HTMLInputElement

  // Recadrage fermé (validé, annulé, retour) : libérer l'image chargée.
  $effect(() => {
    if (cropOpen || !cropImg) return
    releaseImage(cropImg)
    cropImg = null
  })

  async function startCrop(source: File | string) {
    busy = true
    error = ''
    try {
      releaseImage(cropImg)
      cropImg = await loadImage(source)
      open = false
      cropOpen = true
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
      open = true
    } finally {
      busy = false
    }
  }

  function pick() {
    const file = input.files?.[0]
    input.value = ''
    if (file) startCrop(file)
  }

  function cropped(p: Photo) {
    owner.photo = p
    cropOpen = false
  }

  function remove() {
    if (!confirmRemove) {
      confirmRemove = true
      setTimeout(() => (confirmRemove = false), 4000)
      return
    }
    confirmRemove = false
    owner.photo = null
    open = false
  }

  function tap() {
    if (owner.photo) open = true
    else if (editing) input.click()
  }
</script>

{#if owner.photo || editing}
  <button
    class="avatar"
    class:empty={!owner.photo}
    onclick={tap}
    disabled={busy}
    aria-label={owner.photo ? `Photo de ${owner.nom}` : `Ajouter une photo de ${owner.nom}`}
  >
    {#if busy}
      <span class="hint">…</span>
    {:else if owner.photo}
      <img src={owner.photo.miniature} alt="" />
    {:else}
      <span class="hint">+<br />Photo</span>
    {/if}
  </button>
{:else}
  <Thumb src={null} nom={owner.nom} size={76} />
{/if}

<input bind:this={input} type="file" accept="image/*" class="visually-hidden" tabindex="-1" aria-hidden="true" onchange={pick} />

<Sheet bind:open title={owner.nom || 'Photo'}>
  {#if owner.photo}
    <img class="big" src={owner.photo.image} alt="Photo de {owner.nom}" />
  {/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if editing}
    <div class="buttons">
      <button class="primary wide" onclick={() => input.click()} disabled={busy}>Changer la photo</button>
      {#if owner.photo}
        <button onclick={() => owner.photo && startCrop(owner.photo.image)} disabled={busy}>Recadrer</button>
        <button class="danger" onclick={remove}>{confirmRemove ? 'Confirmer' : 'Retirer'}</button>
      {/if}
    </div>
  {:else}
    <p class="note">Changer, recadrer ou retirer la photo : passer en mode édition (crayon).</p>
  {/if}
</Sheet>

<Sheet bind:open={cropOpen} title="Recadrer la photo">
  {#if cropImg}
    <PhotoCropper img={cropImg} onDone={cropped} onCancel={() => (cropOpen = false)} />
  {/if}
</Sheet>

<style>
  .avatar {
    flex: none;
    width: 76px;
    height: 76px;
    min-height: 0;
    padding: 0;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid var(--accent);
    background: var(--surface);
  }
  .avatar.empty {
    border: 2px dashed var(--muted);
    color: var(--muted);
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .hint {
    font-size: 0.8rem;
    line-height: 1.1;
  }
  .big {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 14px;
    margin-top: 12px;
  }
  .buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 12px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  .note {
    margin: 10px 0 0;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .error {
    color: var(--danger);
  }
</style>
