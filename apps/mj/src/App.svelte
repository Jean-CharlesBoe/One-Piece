<script lang="ts">
  import { isTheme, theme } from '@onepiece/core'
  import Sheet from '@onepiece/core/ui/Sheet.svelte'
  import { onMount } from 'svelte'
  import { backup } from './lib/backup/sync.svelte'
  import { catalog } from './lib/catalog.svelte'
  import BackupBanner from './lib/components/BackupBanner.svelte'
  import ContextMenu from './lib/components/ContextMenu.svelte'
  import Drawer from './lib/components/Drawer.svelte'
  import EntityList, { type ListMode } from './lib/components/EntityList.svelte'
  import EntityView from './lib/components/EntityView.svelte'
  import LinksPanel from './lib/components/LinksPanel.svelte'
  import MergeForm from './lib/components/MergeForm.svelte'
  import NewEntityForm from './lib/components/NewEntityForm.svelte'
  import SearchPalette from './lib/components/SearchPalette.svelte'
  import SettingsPanel from './lib/components/SettingsPanel.svelte'
  import Sidebar from './lib/components/Sidebar.svelte'
  import TabBar from './lib/components/TabBar.svelte'
  import { mergeEntities } from './lib/mergeOps'
  import { createEntity, toCatalogEntry, type CatalogEntry } from './lib/model/entity'
  import { resolveMissing } from './lib/model/links'
  import type { EntityType } from './lib/model/types'
  import { opened } from './lib/opened.svelte'
  import { recents } from './lib/recents.svelte'
  import { getRepository, META_THEME } from './lib/storage/repository'
  import { tabs } from './lib/tabs.svelte'

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
  /** Une colonne : la liste est affichée à la place de la fiche (« ← Liste »), les onglets restent ouverts. */
  let listView = $state(false)

  let navOpen = $state(false)
  let listOpen = $state(false)
  let linksOpen = $state(false)
  let settingsOpen = $state(false)
  let newOpen = $state(false)
  let searchOpen = $state(false)
  let searchNewTab = $state(false)
  let mergeOpen = $state(false)
  /** Fusion : première fiche (proposée comme gardée) et, depuis la vue Doublons, la seconde. */
  let mergePair = $state<{ first: string; second: string | null }>({ first: '', second: null })

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

  /** Affiche la fiche de l'onglet actif (D-M14) ; une fiche disparue entre-temps est retirée des onglets. */
  async function show() {
    try {
      for (;;) {
        const id = tabs.current
        if (!id) {
          await opened.close()
          break
        }
        if (opened.entity?.id !== id) await opened.open(id)
        if (opened.entity) {
          recents.push(id)
          break
        }
        tabs.forget(id)
      }
      error = ''
    } catch (e) {
      fail(e)
    }
  }

  /** `newTab` : Ctrl + clic, clic molette, Ctrl + Entrée, menu contextuel « nouvel onglet ». */
  async function openEntity(id: string, newTab = false) {
    tabs.open(id, newTab)
    navOpen = listOpen = false
    listView = false
    await show()
  }

  async function goBack() {
    tabs.back()
    await show()
  }

  async function goForward() {
    tabs.forward()
    await show()
  }

  async function activateTab(i: number) {
    tabs.activate(i)
    listView = false
    await show()
  }

  function moveTab(from: number, to: number) {
    tabs.move(from, to)
  }

  async function cycleTab(delta: number) {
    tabs.cycle(delta)
    listView = false
    await show()
  }

  async function closeTab(i: number) {
    tabs.close(i)
    await show()
  }

  function selectMode(m: ListMode) {
    mode = m
    navOpen = false
    if (layout === 'deux') listOpen = true
    if (layout === 'une') listView = true
  }

  function newEntity(d: Partial<Draft> = {}) {
    draft = {
      type: d.type ?? (mode === 'archives' || mode === 'doublons' ? 'note' : mode),
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
      if (mode !== 'archives' && mode !== 'doublons') mode = type
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

  function startMerge(first: string, second: string | null = null) {
    mergePair = { first, second }
    mergeOpen = true
  }

  async function merge(keepId: string, otherId: string, takeOther: Set<string>) {
    mergeOpen = false
    try {
      await opened.flush()
      await mergeEntities(keepId, otherId, takeOther)
      // Recharge la fiche gardée si elle était ouverte (son texte et ses alias ont changé).
      await opened.close()
      await openEntity(keepId)
    } catch (e) {
      fail(e)
    }
  }

  /** « Ajouter comme alias » (nom proche à la création) : l'autre nom rejoint la fiche existante, qui s'ouvre. */
  async function addAlias(entry: CatalogEntry, alias: string) {
    newOpen = false
    try {
      await opened.flush()
      const r = await getRepository()
      const e = await r.getEntity(entry.id)
      if (!e) return
      if (!e.aliases.includes(alias)) e.aliases.push(alias)
      e.updatedAt = new Date().toISOString()
      await r.saveEntity(e)
      catalog.upsert(toCatalogEntry(e))
      await opened.close()
      await openEntity(e.id)
    } catch (err) {
      fail(err)
    }
  }

  async function deleteOpened() {
    const id = opened.entity?.id
    if (!id) return
    try {
      await (await getRepository()).deleteEntity(id)
      catalog.remove(id)
      await opened.close()
      tabs.forget(id)
      await show()
    } catch (e) {
      fail(e)
    }
  }

  // Les volets n'ont plus lieu d'être quand la fenêtre s'élargit.
  $effect(() => {
    if (layout === 'trois') navOpen = listOpen = linksOpen = false
    if (layout === 'deux') navOpen = false
  })

  /** Champ de saisie, liste déroulante ou éditeur de texte : « / » y reste une lettre. */
  const typing = (t: EventTarget | null) =>
    t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

  function onKey(e: KeyboardEvent) {
    // Alt + ← / → : précédent / suivant dans l'onglet actif.
    if (e.altKey && !e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !typing(e.target)) {
      e.preventDefault()
      void (e.key === 'ArrowLeft' ? goBack() : goForward())
      return
    }
    if (e.key === '/' && !e.ctrlKey && !e.altKey && !e.metaKey && !typing(e.target) && !document.querySelector('dialog[open]')) {
      e.preventDefault()
      searchOpen = true
      return
    }
    if (!e.ctrlKey || e.altKey) return
    // Comme un navigateur : Ctrl+Tab / Ctrl+Maj+Tab, Ctrl+1…8 (onglet n), Ctrl+9 (dernier onglet).
    if (e.key === 'Tab' && tabs.nav.tabs.length) {
      e.preventDefault()
      void cycleTab(e.shiftKey ? -1 : 1)
      return
    }
    if (/^Digit[1-9]$/.test(e.code) && !e.shiftKey && tabs.nav.tabs.length) {
      e.preventDefault()
      const n = Number(e.code.slice(5))
      const i = n === 9 ? tabs.nav.tabs.length - 1 : n - 1
      if (i < tabs.nav.tabs.length && i !== tabs.nav.active) void activateTab(i)
      return
    }
    const k = e.key.toLowerCase()
    if (k === 'k') {
      e.preventDefault()
      searchOpen = true
    } else if (k === 'n') {
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
    // Boutons « précédent / suivant » de la souris.
    const onMouse = (e: MouseEvent) => {
      if (e.button !== 3 && e.button !== 4) return
      e.preventDefault()
      void (e.button === 3 ? goBack() : goForward())
    }
    window.addEventListener('mouseup', onMouse)

    // Thème enregistré (table meta), automatique par défaut ; puis le catalogue des fiches.
    getRepository()
      .then(async r => {
        const t = await r.getMeta(META_THEME)
        theme.set(isTheme(t) ? t : 'auto')
      })
      .catch(fail)
    // Catalogue, puis les onglets de la dernière fois (sans les fiches disparues), puis les récentes.
    catalog
      .load()
      .then(() => tabs.load(id => catalog.byId.has(id)))
      .then(show)
      .catch(fail)
    recents.load().catch(fail)
    // Sauvegarde automatique et relais entre appareils (M4, D-M18).
    backup.start().catch(fail)

    return () => {
      wide.removeEventListener('change', onResize)
      medium.removeEventListener('change', onResize)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('mouseup', onMouse)
    }
  })

  const addChild = () => {
    if (entity) newEntity({ type: 'note', parentId: entity.id })
  }
</script>

<svelte:window onkeydown={onKey} />

{#snippet sidebar()}
  <Sidebar
    selected={mode}
    onSelect={selectMode}
    onOpen={openEntity}
    onSettings={() => (settingsOpen = true)}
    onSearch={() => ((navOpen = false), (searchOpen = true))}
  />
{/snippet}

{#snippet list()}
  <EntityList
    {mode}
    selectedId={entity?.id ?? null}
    onOpen={openEntity}
    onCreate={() => newEntity()}
    onMerge={(a, b) => startMerge(a, b)}
  />
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
          {#if entity && !listView}<button onclick={() => (listView = true)}>← Liste</button>{/if}
        {:else}
          <button onclick={() => (listOpen = true)}>☰ Liste</button>
        {/if}
        <span class="spacer"></span>
        {#if layout === 'une' && entity && !listView}<button onclick={() => (linksOpen = true)}>Liens</button>{/if}
      </div>
    {/if}
    <BackupBanner onSettings={() => (settingsOpen = true)} />
    {#if !(layout === 'une' && listView)}
      <TabBar
        compact={layout === 'une'}
        onActivate={activateTab}
        onClose={closeTab}
        onMove={moveTab}
        onNew={() => ((searchNewTab = true), (searchOpen = true))}
        onBack={goBack}
        onForward={goForward}
      />
    {/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <div class="content">
      {#if layout === 'une' && (listView || !entity)}
        {@render list()}
      {:else}
        <EntityView
          onOpen={openEntity}
          onCreateFromLink={label => newEntity({ title: label, type: 'note', fromLink: label })}
          onCreate={createForRelation}
          onAddChild={addChild}
          onDelete={deleteOpened}
          onMerge={id => startMerge(id)}
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

<SearchPalette bind:open={searchOpen} bind:newTab={searchNewTab} onOpen={openEntity} />
<ContextMenu onOpen={openEntity} />
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
    onAddAlias={addAlias}
  />
</Sheet>
<Sheet bind:open={mergeOpen} title="Fusionner deux fiches">
  <MergeForm first={mergePair.first} second={mergePair.second} onMerge={merge} />
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
