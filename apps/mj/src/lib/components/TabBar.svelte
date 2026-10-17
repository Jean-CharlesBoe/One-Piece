<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import { currentId } from '../model/navigation'
  import { TYPE_DEFS } from '../model/types'
  import { tabs } from '../tabs.svelte'

  // Barre d'onglets (D-M14) : Précédent / Suivant de l'onglet actif, un onglet par fiche ouverte (✕ toujours
  // visible, clic molette pour fermer). En une colonne (`compact`), les onglets se replient en liste déroulante.
  let {
    compact = false,
    onActivate,
    onClose,
    onBack,
    onForward,
  }: {
    compact?: boolean
    onActivate: (i: number) => void
    onClose: (i: number) => void
    onBack: () => void
    onForward: () => void
  } = $props()

  const items = $derived(
    tabs.nav.tabs.map((_, i) => {
      const id = currentId(tabs.nav, i)
      const e = id ? catalog.byId.get(id) : undefined
      return { i, title: e?.title ?? '…', icon: e ? TYPE_DEFS[e.type].icon : '' }
    }),
  )
</script>

{#if items.length}
  <div class="tabbar" class:compact role="toolbar" aria-label="Fiches ouvertes">
    <button class="nav" disabled={!tabs.canBack} onclick={onBack} aria-label="Précédent" title="Précédent (Alt+←)">‹</button>
    <button class="nav" disabled={!tabs.canForward} onclick={onForward} aria-label="Suivant" title="Suivant (Alt+→)">›</button>
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
      <div class="tabs" role="tablist">
        {#each items as t (t.i)}
          <div class="tab" class:on={t.i === tabs.nav.active}>
            <button
              role="tab"
              aria-selected={t.i === tabs.nav.active}
              class="name"
              title={t.title}
              onclick={() => onActivate(t.i)}
              onauxclick={e => e.button === 1 && onClose(t.i)}
            >
              <span aria-hidden="true">{t.icon}</span>
              <span class="label-text">{t.title}</span>
            </button>
            <button class="close" onclick={() => onClose(t.i)} aria-label="Fermer {t.title}" title="Fermer">✕</button>
          </div>
        {/each}
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
    padding: 2px 6px 0;
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
    display: flex;
    gap: 2px;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: thin;
  }
  .tab {
    display: flex;
    align-items: center;
    min-width: 90px;
    max-width: 200px;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 8px 8px 0 0;
  }
  .tab.on {
    background: var(--surface);
    border-color: var(--line);
    margin-bottom: -1px;
  }
  .name {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    min-height: 40px;
    padding: 0 4px 0 10px;
    border: none;
    background: none;
    text-align: left;
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
    min-height: 40px;
    min-width: 32px;
    padding: 0;
    border: none;
    background: none;
    color: var(--muted);
  }
</style>
