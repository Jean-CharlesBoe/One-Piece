<script lang="ts">
  import { onBack } from '@onepiece/core'

  // Menu contextuel des liens vers une fiche (D-M14) : clic droit à la souris, appui long au doigt.
  // Tout élément portant `data-open-id` (lignes de liste, liens du panneau, résultats) ou un lien interne du
  // texte (`a.wl[data-id]`) le déclenche.
  let { onOpen }: { onOpen: (id: string, newTab: boolean) => void } = $props()

  let menu = $state<{ id: string; x: number; y: number } | null>(null)

  $effect(() => {
    const onContext = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-open-id], a.wl[data-id]')
      const id = el?.dataset.openId ?? el?.dataset.id
      if (!id) return
      e.preventDefault()
      menu = { id, x: Math.min(e.clientX, innerWidth - 260), y: Math.min(e.clientY, innerHeight - 110) }
    }
    window.addEventListener('contextmenu', onContext)
    return () => window.removeEventListener('contextmenu', onContext)
  })

  $effect(() => {
    if (!menu) return
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      if (e.type === 'pointerdown' && (e.target as HTMLElement).closest('.ctx')) return
      menu = null
    }
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', close)
    window.addEventListener('scroll', close, true)
    const off = onBack(() => (menu = null))
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', close)
      window.removeEventListener('scroll', close, true)
      off()
    }
  })

  function choose(newTab: boolean) {
    if (!menu) return
    const id = menu.id
    menu = null
    onOpen(id, newTab)
  }
</script>

{#if menu}
  <div class="ctx" role="menu" style="left: {menu.x}px; top: {menu.y}px">
    <button role="menuitem" onclick={() => choose(false)}>Ouvrir</button>
    <button role="menuitem" onclick={() => choose(true)}>Ouvrir dans un nouvel onglet</button>
  </div>
{/if}

<style>
  .ctx {
    position: fixed;
    z-index: 50;
    display: grid;
    min-width: 240px;
    padding: 4px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.25);
  }
  button {
    border: none;
    background: none;
    text-align: left;
  }
  button:hover {
    background: var(--bg);
  }
</style>
