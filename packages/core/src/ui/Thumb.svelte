<script lang="ts">
  // Miniature ronde : la photo, ou à défaut l'initiale du nom.
  let { src, nom, size = 46 }: { src: string | null | undefined; nom: string; size?: number } = $props()

  const initial = $derived((nom.trim()[0] ?? '?').toLocaleUpperCase('fr'))
</script>

<span class="thumb" style="--s: {size}px" aria-hidden="true">
  {#if src}
    <img {src} alt="" />
  {:else}
    {initial}
  {/if}
</span>

<style>
  .thumb {
    flex: none;
    width: var(--s);
    height: var(--s);
    border-radius: 50%;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    color: var(--accent);
    font-weight: 700;
    font-size: calc(var(--s) * 0.4);
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
</style>
