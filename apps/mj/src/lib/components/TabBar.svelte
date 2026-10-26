<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import { currentId } from '../model/navigation'
  import { sessionIdOfTab, sessionLabel } from '../model/session'
  import { TYPE_DEFS } from '../model/types'
  import { sessions } from '../sessions.svelte'
  import { tabs } from '../tabs.svelte'

  // Barre d'onglets (D-M14, D-M20, D-M21), comme dans un navigateur : un onglet par fiche ouverte, côte à côte ;
  // ils se partagent la largeur et rétrécissent ensemble (onglet étroit : début du titre seulement, ✕ sur
  // l'onglet actif), puis la barre défile (molette ou glisser) en gardant l'onglet actif visible. « + » ouvre la
  // recherche. Un onglet se déplace en le glissant, à la souris ou au doigt ; clic molette = fermer. En une
  // colonne (`compact`), les onglets se replient en liste déroulante.
  let {
    compact = false,
    onActivate,
    onClose,
    onMove,
    onNew,
  }: {
    compact?: boolean
    onActivate: (i: number) => void
    onClose: (i: number) => void
    onMove: (from: number, to: number) => void
    onNew: () => void
  } = $props()

  const items = $derived(
    tabs.nav.tabs.map((_, i) => {
      const id = currentId(tabs.nav, i)
      // Onglet de session (M8a) ou de fiche.
      const se = id ? sessions.byId.get(sessionIdOfTab(id) ?? '') : undefined
      if (se) return { i, title: sessionLabel(se), icon: '📖' }
      const e = id ? catalog.byId.get(id) : undefined
      return { i, title: e?.title ?? '…', icon: e ? TYPE_DEFS[e.type].icon : '' }
    }),
  )

  // Glisser un onglet : il suit le pointeur, les autres s'écartent ; l'ordre change au relâché.
  const DRAG_START = 6
  let strip = $state<HTMLElement | null>(null)
  let drag = $state<{
    from: number
    pointerId: number
    startX: number
    dx: number
    moved: boolean
    rects: { left: number; width: number }[]
  } | null>(null)
  // Le clic qui suit un glisser ne doit pas activer ni fermer d'onglet.
  let swallowClick = false

  const target = $derived.by(() => {
    if (!drag?.moved) return -1
    const r = drag.rects[drag.from]
    const center = r.left + r.width / 2 + drag.dx
    let t = 0
    drag.rects.forEach((o, j) => {
      if (j !== drag!.from && o.left + o.width / 2 < center) t++
    })
    return t
  })

  function shift(i: number): number {
    if (!drag?.moved) return 0
    const { from, rects, dx } = drag
    if (i === from) return dx
    const step = rects[from].width + (rects[1] ? Math.abs(rects[1].left - rects[0].left - rects[0].width) : 0)
    if (from < target && i > from && i <= target) return -step
    if (target < from && i >= target && i < from) return step
    return 0
  }

  function onPointerDown(e: PointerEvent, i: number) {
    if (e.button !== 0 || !strip) return
    const els = [...strip.querySelectorAll<HTMLElement>('.tab')]
    drag = {
      from: i,
      pointerId: e.pointerId,
      startX: e.clientX,
      dx: 0,
      moved: false,
      rects: els.map(el => {
        const r = el.getBoundingClientRect()
        return { left: r.left, width: r.width }
      }),
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return
    const dx = e.clientX - drag.startX
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_START) return
      drag.moved = true
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        // Pointeur déjà relâché : le glisser continue sans capture.
      }
    }
    // L'onglet reste dans la barre.
    const r = drag.rects[drag.from]
    const first = drag.rects[0].left
    const last = drag.rects[drag.rects.length - 1]
    drag.dx = Math.min(Math.max(dx, first - r.left), last.left + last.width - r.left - r.width)
  }

  function onPointerUp(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return
    const { from, moved } = drag
    const to = target
    drag = null
    if (!moved) return
    swallowClick = true
    setTimeout(() => (swallowClick = false), 0)
    if (to !== from) onMove(from, to)
    onActivate(to)
  }

  function onPointerCancel() {
    drag = null
  }

  function click(fn: () => void) {
    if (!swallowClick) fn()
  }

  // L'onglet actif reste visible quand la barre défile (nouvel onglet, Ctrl+Tab, liste déroulante…).
  $effect(() => {
    const i = tabs.nav.active
    void tabs.nav.tabs.length
    queueMicrotask(() => strip?.querySelectorAll<HTMLElement>('.tab')[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
  })

  /** Molette verticale sur la barre : défilement horizontal. */
  function onWheel(e: WheelEvent) {
    if (!strip || strip.scrollWidth <= strip.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
    e.preventDefault()
    strip.scrollLeft += e.deltaY
  }
</script>

{#if items.length}
  <div class="tabbar" class:compact role="toolbar" aria-label="Fiches ouvertes">
    {#if compact}
      <select
        value={tabs.nav.active}
        onchange={e => onActivate(Number(e.currentTarget.value))}
        aria-label="Fiches ouvertes"
      >
        {#each items as t (t.i)}<option value={t.i}>{t.icon} {t.title}</option>{/each}
      </select>
      <button class="nav" onclick={() => onClose(tabs.nav.active)} aria-label="Fermer l'onglet" title="Fermer l'onglet">✕</button>
    {:else}
      <div class="tabs" role="tablist" bind:this={strip} onwheel={onWheel}>
        {#each items as t (t.i)}
          <!-- Le glisser se fait sur tout l'onglet ; ses deux boutons restent les cibles du clavier. -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="tab"
            class:on={t.i === tabs.nav.active}
            class:dragging={drag?.moved && drag.from === t.i}
            class:shifting={drag?.moved && drag.from !== t.i}
            style:transform={shift(t.i) ? `translateX(${shift(t.i)}px)` : undefined}
            onpointerdown={e => onPointerDown(e, t.i)}
            onpointermove={onPointerMove}
            onpointerup={onPointerUp}
            onpointercancel={onPointerCancel}
            onauxclick={e => e.button === 1 && onClose(t.i)}
          >
            <button
              role="tab"
              aria-selected={t.i === tabs.nav.active}
              class="name"
              title={t.title}
              onclick={() => click(() => onActivate(t.i))}
            >
              <span class="icon" aria-hidden="true">{t.icon}</span>
              <span class="label-text">{t.title}</span>
            </button>
            <button class="close" onclick={() => click(() => onClose(t.i))} aria-label="Fermer {t.title}" title="Fermer">✕</button>
          </div>
        {/each}
        <button class="new" onclick={onNew} aria-label="Ouvrir une fiche dans un nouvel onglet" title="Nouvel onglet">+</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .tabbar {
    display: flex;
    align-items: stretch;
    gap: 2px;
    min-height: 44px;
    padding: 4px 6px 0 8px;
    border-bottom: 1px solid var(--line);
    background: var(--bg);
  }
  .nav {
    min-height: 40px;
    min-width: 40px;
    padding: 0;
    border: none;
    background: none;
    font-size: 1.3rem;
    align-self: center;
  }
  .compact select {
    flex: 1;
    min-height: 40px;
    align-self: center;
  }
  .tabs {
    flex: 1;
    display: flex;
    align-items: stretch;
    gap: 2px;
    min-width: 0;
    /* Au-delà de la largeur minimale des onglets : défilement horizontal, sans barre visible. */
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }
  .tab {
    /* Comme un navigateur : 200 px au plus, tous les onglets rétrécissent ensemble. */
    flex: 0 1 200px;
    min-width: 64px;
    position: relative;
    display: flex;
    align-items: center;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    container-type: inline-size;
    touch-action: none;
    user-select: none;
  }
  .tab:not(.on):hover {
    background: color-mix(in srgb, var(--surface) 55%, var(--bg));
  }
  /* Séparateur fin entre deux onglets inactifs. */
  .tab:not(.on) + .tab:not(.on)::before {
    content: '';
    position: absolute;
    left: -2px;
    top: 25%;
    height: 50%;
    border-left: 1px solid var(--line);
  }
  .tab.on {
    min-width: min(110px, 40%);
    background: var(--surface);
    border-color: var(--line);
    margin-bottom: -1px;
    z-index: 1;
  }
  .tab.shifting {
    transition: transform 0.15s ease;
  }
  .tab.dragging {
    z-index: 2;
    cursor: grabbing;
    box-shadow: 0 2px 10px rgb(0 0 0 / 25%);
  }
  .tab.dragging::before,
  .tab.dragging + .tab::before {
    display: none;
  }
  .name {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    min-height: 40px;
    padding: 0 2px 0 10px;
    border: none;
    background: none;
    text-align: left;
  }
  .icon {
    flex: none;
  }
  .label-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tab.on .name {
    font-weight: 600;
  }
  .close {
    flex: none;
    min-height: 40px;
    min-width: 30px;
    padding: 0;
    border: none;
    background: none;
    color: var(--muted);
  }
  .close:hover {
    color: var(--text);
  }
  /* Onglet étroit, comme dans Chrome : le début du titre reste lisible (les icônes d'un même type se
     ressemblent toutes) ; ✕ seulement sur l'onglet actif, les autres se ferment au clic molette ou une fois
     choisis. */
  @container (max-width: 120px) {
    .icon {
      display: none;
    }
    .name {
      padding: 0 2px 0 8px;
    }
    .tab:not(.on) .close {
      display: none;
    }
    .close {
      min-width: 26px;
    }
  }
  .new {
    /* Toujours visible, même quand la barre défile. */
    position: sticky;
    right: 0;
    z-index: 3;
    background: var(--bg);
    flex: none;
    align-self: center;
    min-height: 36px;
    min-width: 40px;
    margin-left: 2px;
    padding: 0;
    border: none;
    background: none;
    border-radius: 50%;
    font-size: 1.3rem;
    color: var(--muted);
  }
  .new:hover {
    color: var(--text);
  }
</style>
