<script lang="ts">
  import { App as CapApp } from '@capacitor/app'
  import { Capacitor } from '@capacitor/core'
  import { handleBack, isTheme, theme } from '@onepiece/core'
  import Sheet from '@onepiece/core/ui/Sheet.svelte'
  import { onMount } from 'svelte'
  import { catalog } from './lib/catalog.svelte'
  import Drawer from './lib/components/Drawer.svelte'
  import EntityList, { type ListMode } from './lib/components/EntityList.svelte'
  import EntityView from './lib/components/EntityView.svelte'
  import LinksPanel from './lib/components/LinksPanel.svelte'
  import NewEntityForm from './lib/components/NewEntityForm.svelte'
  import SettingsPanel from './lib/components/SettingsPanel.svelte'
  import Sidebar from './lib/components/Sidebar.svelte'
  import { createEntity, toCatalogEntry } from './lib/model/entity'
  import { resolveMissing } from './lib/model/links'
  import type { EntityType } from './lib/model/types'
  import { opened } from './lib/opened.svelte'
  import { getRepository, META_THEME } from './lib/storage/repository'

  // Disposition selon la largeur de la fenêtre (D-M10) :
  // ≥ 1280 px : barre latérale + liste, fiche, Liens ; 900 à 1279 px : la liste passe en volet ;
  // < 900 px : la fiche seule (ou la liste), barre latérale et Liens en volets.
  type Layout = 'trois' | 'deux' | 'une'
  const wide = matchMedia('(min-width: 1280px)')
  const medium = matchMedia('(min-width: 900px)')
  const computeLayout = (): Layout => (wide.matches ? 'trois' : medium.matches ? 'deux' : 'une')
  let layout = $state<Layout>(computeLayout())

  let mode = $state<ListMode>('personnage')
  let error = $state('')

  let navOpen = $state(false)
  let listOpen = $state(false)
  let linksOpen = $state(false)
  let settingsOpen = $state(false)
  let newOpen = $state(false)

  /** Fiche à créer : type proposé, titre prérempli, page parente, lien rouge d'origine à réécrire. */
  interface Draft {
    type: EntityType
    title: string
    parentId: string | null
    fromLink: string | null
  }
  let draft = $state<Draft>({ type: 'personnage', title: '', parentId: null, fromLink: null })

  const entity = $derived(opened.entity)

  function fail(e: unknown) {
    error = e instanceof Error ? e.message : String(e)
    console.error('[onepiece-mj]', e)
  }

  async function openEntity(id: string) {
    try {
      await opened.open(id)
      navOpen = listOpen = false
      error = ''
    } catch (e) {
      fail(e)
    }
  }

  function selectMode(m: ListMode) {
    mode = m
    navOpen = false
    if (layout === 'deux') listOpen = true
    if (layout === 'une') void opened.close()
  }

  function newEntity(d: Partial<Draft> = {}) {
    draft = {
      type: d.type ?? (mode === 'archives' ? 'note' : mode),
      title: d.title ?? '',
      parentId: d.parentId ?? null,
      fromLink: d.fromLink ?? null,
    }
    newOpen = true
  }

  /** Crée et enregistre une fiche, sans l'ouvrir. */
  async function insert(type: EntityType, title: string, parentId: string | null = null) {
    const e = createEntity(type, title)
    e.parentId = parentId
    await (await getRepository()).saveEntity(e)
    catalog.upsert(toCatalogEntry(e))
    return e
  }

  async function submitNew(type: EntityType, title: string) {
    const d = draft
    newOpen = false
    try {
      const e = await insert(type, title, d.parentId)
      // Lien rouge cliqué dans la fiche ouverte : il pointe désormais vers la nouvelle fiche.
      if (d.fromLink && opened.entity) {
        const label = d.fromLink
        await opened.apply(src => (src.bodyMd = resolveMissing(src.bodyMd, label, e.id)))
      }
      if (mode !== 'archives') mode = type
      await openEntity(e.id)
    } catch (err) {
      fail(err)
    }
  }

  /** Création depuis un champ relation : la fiche est créée, la fiche en cours reste ouverte. */
  async function createForRelation(type: EntityType, title: string): Promise<string | null> {
    try {
      return (await insert(type, title)).id
    } catch (e) {
      fail(e)
      return null
    }
  }

  async function deleteOpened() {
    const id = opened.entity?.id
    if (!id) return
    try {
      await (await getRepository()).deleteEntity(id)
      catalog.remove(id)
      await opened.close()
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
    if (!e.ctrlKey || e.altKey) return
    const k = e.key.toLowerCase()
    if (k === 'n') {
      e.preventDefault()
      newEntity()
    } else if (k === 'e' && entity && !entity.archived) {
      e.preventDefault()
      void opened.setEditing(!opened.editing)
    }
  }

  onMount(() => {
    const onResize = () => (layout = computeLayout())
    wide.addEventListener('change', onResize)
    medium.addEventListener('change', onResize)
    // App en arrière-plan ou fermée : enregistrer sans attendre.
    const onHide = () => {
      if (document.visibilityState === 'hidden') void opened.flush()
    }
    document.addEventListener('visibilitychange', onHide)

    // Thème enregistré (table meta), automatique par défaut ; puis le catalogue des fiches.
    getRepository()
      .then(async r => {
        const t = await r.getMeta(META_THEME)
        theme.set(isTheme(t) ? t : 'auto')
      })
      .catch(fail)
    catalog.load().catch(fail)

    // Bouton retour Android : fermer la fenêtre ou le volet ouvert, sinon quitter l'édition, sinon revenir
    // à la liste (une colonne), sinon quitter. L'historique Précédent / Suivant arrive en M3.
    const handle = Capacitor.isNativePlatform()
      ? CapApp.addListener('backButton', () => {
          if (handleBack()) return
          if (opened.editing) void opened.setEditing(false)
          else if (layout === 'une' && opened.entity) void opened.close()
          else void opened.flush().then(() => CapApp.exitApp())
        })
      : null
    return () => {
      wide.removeEventListener('change', onResize)
      medium.removeEventListener('change', onResize)
      document.removeEventListener('visibilitychange', onHide)
      handle?.then(h => h.remove())
    }
  })

  const addChild = () => {
    if (entity) newEntity({ type: 'note', parentId: entity.id })
  }
</script>

<svelte:window onkeydown={onKey} />

{#snippet sidebar()}
  <Sidebar selected={mode} onSelect={selectMode} onOpen={openEntity} onSettings={() => (settingsOpen = true)} />
{/snippet}

{#snippet list()}
  <EntityList {mode} selectedId={entity?.id ?? null} onOpen={openEntity} onCreate={() => newEntity()} />
{/snippet}

{#snippet links()}
  <LinksPanel onOpen={openEntity} onAddChild={addChild} />
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
          {#if entity}<button onclick={() => opened.close()}>← Liste</button>{/if}
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
        <EntityView
          onOpen={openEntity}
          onCreateFromLink={label => newEntity({ title: label, type: 'note', fromLink: label })}
          onCreate={createForRelation}
          onAddChild={addChild}
          onDelete={deleteOpened}
        />
      {/if}
    </div>
  </main>

  {#if layout !== 'une'}
    <div class="col links">{@render links()}</div>
  {/if}
</div>

<Drawer bind:open={navOpen} label="Navigation">{@render sidebar()}</Drawer>
<Drawer bind:open={listOpen} label="Liste des fiches">{@render list()}</Drawer>
<Drawer bind:open={linksOpen} side="right" label="Liens">{@render links()}</Drawer>

<Sheet bind:open={settingsOpen} title="Réglages"><SettingsPanel /></Sheet>
<Sheet bind:open={newOpen} title={draft.fromLink ? 'Créer la fiche du lien' : 'Nouvelle fiche'}>
  <NewEntityForm
    type={draft.type}
    title={draft.title}
    parentTitle={draft.parentId ? catalog.title(draft.parentId) : ''}
    onCreate={submitNew}
    onOpen={id => {
      newOpen = false
      void openEntity(id)
    }}
  />
</Sheet>

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
