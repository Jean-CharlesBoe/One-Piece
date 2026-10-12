<script lang="ts">
  import type { Photo } from '../model/photo'
  import { initialView, MAX_ZOOM, pan, sourceRect, zoomAt, coverScale, type View } from '../photo/crop'
  import { cropToPhoto } from '../photo/resize'

  // Recadrage : glisser pour déplacer, pincer (ou le curseur) pour zoomer. Le cercle montre le portrait.
  let { img, onDone, onCancel }: { img: HTMLImageElement; onDone: (p: Photo) => void; onCancel: () => void } = $props()

  const w = $derived(img.naturalWidth)
  const h = $derived(img.naturalHeight)
  let F = $state(0)
  let view = $state<View>({ x: 0, y: 0, s: 1 })
  let ready = $state(false)
  let frame: HTMLDivElement

  $effect(() => {
    if (F > 0 && !ready) {
      view = initialView(w, h, F)
      ready = true
    }
  })

  const min = $derived(F > 0 ? coverScale(w, h, F) : 1)

  // Gestes : un doigt = déplacer, deux doigts = zoomer autour du milieu des doigts.
  const pointers = new Map<number, { x: number; y: number }>()
  const local = (e: PointerEvent) => {
    const r = frame.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const spread = () => {
    const [a, b] = [...pointers.values()]
    return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
  }

  function down(e: PointerEvent) {
    pointers.set(e.pointerId, local(e))
    try {
      frame.setPointerCapture(e.pointerId) // suivre le doigt même s'il sort du cadre
    } catch {
      /* capture impossible : le geste marche quand même tant que le doigt reste dans le cadre */
    }
  }

  function move(e: PointerEvent) {
    const prev = pointers.get(e.pointerId)
    if (!prev) return
    if (pointers.size === 1) {
      const p = local(e)
      view = pan(view, p.x - prev.x, p.y - prev.y, w, h, F)
      pointers.set(e.pointerId, p)
    } else if (pointers.size === 2) {
      const before = spread()
      pointers.set(e.pointerId, local(e))
      const after = spread()
      if (before.d > 0) view = zoomAt(view, view.s * (after.d / before.d), after.mx, after.my, w, h, F)
      view = pan(view, after.mx - before.mx, after.my - before.my, w, h, F)
    }
  }

  function up(e: PointerEvent) {
    pointers.delete(e.pointerId)
  }

  function wheel(e: WheelEvent) {
    e.preventDefault()
    const p = { x: e.offsetX, y: e.offsetY }
    view = zoomAt(view, view.s * (e.deltaY < 0 ? 1.1 : 1 / 1.1), p.x, p.y, w, h, F)
  }

  function validate() {
    onDone(cropToPhoto(img, sourceRect(view, F)))
  }
</script>

<p class="hint">Fais glisser la photo et zoome (deux doigts ou curseur) pour placer le visage dans le cercle.</p>

<div
  class="frame"
  bind:this={frame}
  bind:clientWidth={F}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
  onwheel={wheel}
  role="application"
  aria-label="Zone de recadrage"
>
  {#if ready}
    <img
      src={img.src}
      alt=""
      draggable="false"
      style="left: {view.x}px; top: {view.y}px; width: {w * view.s}px; height: {h * view.s}px"
    />
  {/if}
  <div class="mask" aria-hidden="true"></div>
</div>

<label class="zoom">
  <span aria-hidden="true">−</span>
  <input
    type="range"
    min={min}
    max={min * MAX_ZOOM}
    step="any"
    value={view.s}
    oninput={e => (view = zoomAt(view, Number(e.currentTarget.value), F / 2, F / 2, w, h, F))}
    aria-label="Zoom"
  />
  <span aria-hidden="true">+</span>
</label>

<div class="buttons">
  <button onclick={onCancel}>Annuler</button>
  <button class="primary" onclick={validate} disabled={!ready}>Valider</button>
</div>

<style>
  .hint {
    margin: 10px 0;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .frame {
    position: relative;
    width: 100%;
    max-width: 360px;
    aspect-ratio: 1;
    margin: 0 auto;
    overflow: hidden;
    border-radius: 12px;
    background: #000;
    touch-action: none;
    user-select: none;
    cursor: grab;
  }
  img {
    position: absolute;
    max-width: none;
    pointer-events: none;
  }
  /* Assombrit tout sauf le cercle du portrait */
  .mask {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    box-shadow: 0 0 0 999px rgb(0 0 0 / 0.55);
    outline: 2px solid rgb(255 255 255 / 0.85);
    pointer-events: none;
  }
  .zoom {
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 360px;
    margin: 12px auto 0;
    color: var(--muted);
    font-size: 1.2rem;
  }
  .zoom input {
    flex: 1;
    accent-color: var(--accent);
  }
  .buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 12px;
  }
</style>
