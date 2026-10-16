<script lang="ts">
  import { App as CapApp } from '@capacitor/app'
  import { Capacitor } from '@capacitor/core'
  import { handleBack, isTheme, theme } from '@onepiece/core'
  import Sheet from '@onepiece/core/ui/Sheet.svelte'
  import { onMount } from 'svelte'
  import Drawer from './lib/components/Drawer.svelte'
  import EntityList from './lib/components/EntityList.svelte'
  import EntityView from './lib/components/EntityView.svelte'
  import LinksPanel from './lib/components/LinksPanel.svelte'
  import NewEntityForm from './lib/components/NewEntityForm.svelte'
  import SettingsPanel from './lib/components/SettingsPanel.svelte'
  import Sidebar from './lib/components/Sidebar.svelte'
  import { createEntity, type Entity, type EntitySummary } from './lib/model/entity'
  import type { EntityType } from './lib/model/types'
  import { getRepository, META_THEME } from './lib/storage/repository'

  // Disposition selon la largeur de la fenêtre (D-M10) :
  // ≥ 1280 px : barre latérale + liste, fiche, Liens ; 900 à 1279 px : la liste passe en volet ;
  // < 900 px : la fiche seule (ou la liste), barre latérale et Liens en volets.
  type Layout = 'trois' | 'deux' | 'une'
  const wide = matchMedia('(min-width: 1280px)')
  const medium = matchMedia('(min-width: 900px)')
  const computeLayout = (): Layout => (wide.matches ? 'trois' : medium.matches ? 'deux' : 'une')
  let layout = $state<Layout>(computeLayout())

  let type = $state<EntityType>('personnage')
  let counts = $state<Partial<Record<EntityType, number>>>({})
  let items = $state<EntitySummary[]>([])
  let entity = $state<Entity | null>(null)
  let error = $state('')

  let navOpen = $state(false)
  let listOpen = $state(false)
  let linksOpen = $state(false)
  let settingsOpen = $state(false)
  let newOpen = $state(false)

  function fail(e: unknown) {
    error = e instanceof Error ? e.message : String(e)
    console.error('[onepiece-mj]', e)
  }

  async function refresh() {
    try {
      const r = await getRepository()
      counts = await r.countByType()
      items = await r.listEntities(type)
    } catch (e) {
      fail(e)
    }
  }

  async function openEntity(id: string) {
    try {
      entity = await (await getRepository()).getEntity(id)
      navOpen = listOpen = false
    } catch (e) {
      fail(e)
    }
  }

  function selectType(t: EntityType) {
    type = t
    void refresh()
    navOpen = false
    if (layout === 'deux') listOpen = true
    if (layout === 'une') entity = null
  }

  async function create(t: EntityType, title: string) {
    try {
      const e = createEntity(t, title)
      await (await getRepository()).saveEntity(e)
      newOpen = false
      type = t
      await refresh()
      await openEntity(e.id)
    } catch (e) {
      fail(e)
    }
  }

  // Les volets n'ont plus lieu d'être quand la fenêtre s'élargit.
  $effect(() => {
    if (layout === 'trois') navOpen = listOpen = linksOpen = false
    if (layout === 'deux') navOpen = false
  })

  function onKey(e: KeyboardEvent) {
    if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault()
      newOpen = true
    }
  }

  onMount(() => {
    const onResize = () => (layout = computeLayout())
    wide.addEventListener('change', onResize)
    medium.addEventListener('change', onResize)

    // Thème enregistré (table meta), automatique par défaut ; puis la liste du type affiché.
    getRepository()
      .then(async r => {
        const t = await r.getMeta(META_THEME)
        theme.set(isTheme(t) ? t : 'auto')
      })
      .catch(fail)
    void refresh()

    // Bouton retour Android : fermer la fenêtre ou le volet ouvert, sinon revenir à la liste
    // (une colonne), sinon quitter. L'historique Précédent / Suivant arrive en M3.
    const handle = Capacitor.isNativePlatform()
      ? CapApp.addListener('backButton', () => {
          if (handleBack()) return
          if (layout === 'une' && entity) entity = null
          else CapApp.exitApp()
        })
      : null
    return () => {
      wide.removeEventListener('change', onResize)
      medium.removeEventListener('change', onResize)
      handle?.then(h => h.remove())
    }
  })
</script>

<svelte:window onkeydown={onKey} />

{#snippet sidebar()}
  <Sidebar {counts} selected={type} onSelect={selectType} onSettings={() => (settingsOpen = true)} />
{/snippet}

{#snippet list()}
  <EntityList {type} {items} selectedId={entity?.id ?? null} onOpen={openEntity} onCreate={() => (newOpen = true)} />
{/snippet}

<div class="app {layout}">
  {#if layout !== 'une'}
    <div class="col sidebar">{@render sidebar()}</div>
  {/if}
  {#if layout === 'trois'}
    <div class="col list">{@render list()}</div>
  {/if}

  <main class="col main">
    {#if layout !== 'trois'}
      <div class="bar">
        {#if layout === 'une'}
          <button onclick={() => (navOpen = true)} aria-label="Menu">☰</button>
          {#if entity}<button onclick={() => (entity = null)}>← Liste</button>{/if}
        {:else}
          <button onclick={() => (listOpen = true)}>☰ Liste</button>
        {/if}
        <span class="spacer"></span>
        {#if layout === 'une' && entity}<button onclick={() => (linksOpen = true)}>Liens</button>{/if}
      </div>
    {/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <div class="content">
      {#if layout === 'une' && !entity}
        {@render list()}
      {:else}
        <EntityView {entity} />
      {/if}
    </div>
  </main>

  {#if layout !== 'une'}
    <div class="col links"><LinksPanel {entity} /></div>
  {/if}
</div>

<Drawer bind:open={navOpen} label="Navigation">{@render sidebar()}</Drawer>
<Drawer bind:open={listOpen} label="Liste des fiches">{@render list()}</Drawer>
<Drawer bind:open={linksOpen} side="right" label="Liens"><LinksPanel {entity} /></Drawer>

<Sheet bind:open={settingsOpen} title="Réglages"><SettingsPanel /></Sheet>
<Sheet bind:open={newOpen} title="Nouvelle fiche"><NewEntityForm {type} onCreate={create} /></Sheet>

<style>
  .app {
    display: grid;
    height: 100dvh;
    overflow: hidden;
  }
  .app.trois {
    grid-template-columns: 230px 300px minmax(0, 1fr) 280px;
  }
  .app.deux {
    grid-template-columns: 230px minmax(0, 1fr) 260px;
  }
  .app.une {
    grid-template-columns: minmax(0, 1fr);
  }
  .col {
    min-height: 0;
    min-width: 0;
  }
  .list,
  .main {
    background: var(--surface);
    border-left: 1px solid var(--line);
  }
  .une .main {
    border-left: none;
  }
  .links {
    border-left: 1px solid var(--line);
  }
  .main {
    display: flex;
    flex-direction: column;
  }
  .content {
    flex: 1;
    min-height: 0;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--line);
  }
  .bar button {
    min-height: 36px;
    padding: 0 12px;
  }
  .spacer {
    flex: 1;
  }
  .error {
    margin: 8px 12px 0;
    color: var(--danger);
  }
</style>
