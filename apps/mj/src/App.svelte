<script lang="ts">
  import { isTheme, theme } from '@onepiece/core'
  import Sheet from '@onepiece/core/ui/Sheet.svelte'
  import { onMount, tick } from 'svelte'
  import { backup } from './lib/backup/sync.svelte'
  import { catalog } from './lib/catalog.svelte'
  import BackupBanner from './lib/components/BackupBanner.svelte'
  import Drawer from './lib/components/Drawer.svelte'
  import EntityList from './lib/components/EntityList.svelte'
  import { listModeOfTab, listTab, type ListMode } from './lib/model/listTab'
  import EntityView from './lib/components/EntityView.svelte'
  import LinksPanel from './lib/components/LinksPanel.svelte'
  import MergeForm from './lib/components/MergeForm.svelte'
  import NewEntityForm from './lib/components/NewEntityForm.svelte'
  import SearchPalette from './lib/components/SearchPalette.svelte'
  import SettingsPanel from './lib/components/SettingsPanel.svelte'
  import Sidebar from './lib/components/Sidebar.svelte'
  import TabBar from './lib/components/TabBar.svelte'
  import MediaViewer from './lib/components/MediaViewer.svelte'
  import SessionView from './lib/components/SessionView.svelte'
  import JournalPanel from './lib/components/JournalPanel.svelte'
  import { play } from './lib/play.svelte'
  import { relationIds } from './lib/model/props'
  import type { Session } from './lib/model/session'
  import { media } from './lib/media.svelte'
  import { mergeEntities } from './lib/mergeOps'
  import { titleFromFileName } from './lib/model/asset'
  import { createEntity, toCatalogEntry, type CatalogEntry } from './lib/model/entity'
  import { resolveMissing } from './lib/model/links'
  import type { EntityType } from './lib/model/types'
  import { opened } from './lib/opened.svelte'
  import { recents } from './lib/recents.svelte'
  import { getRepository, META_THEME } from './lib/storage/repository'
  import { tabs } from './lib/tabs.svelte'
  import { parseSessionNoteTitle, planImportedNotes, sessionIdOfTab, sessionTab, type ImportedNote } from './lib/model/session'
  import { sessions } from './lib/sessions.svelte'
  import { clampWidth, disposition, SIDEBAR_DEFAULT } from './lib/disposition.svelte'

  // Disposition (D-M10, D-M27) : plus de colonne de liste, les listes s'ouvrent dans un onglet.
  // ≥ 900 px : barre latérale (largeur réglable, repliable), onglets, panneau Liens (repliable) ;
  // < 900 px : les onglets seuls, barre latérale et Liens en volets.
  type Layout = 'large' | 'une'
  const medium = matchMedia('(min-width: 900px)')
  const computeLayout = (): Layout => (medium.matches ? 'large' : 'une')
  let layout = $state<Layout>(computeLayout())

  /** Colonnes : barre latérale + poignée (ou rail), onglets, Liens (ou rail) ; une seule en disposition étroite. */
  const gridColumns = $derived(
    layout === 'une'
      ? 'minmax(0, 1fr)'
      : [
          disposition.sidebarOpen ? `${disposition.sidebarWidth}px 6px` : '40px',
          // Journal de la session en cours (M8b, maquette A).
          ...(play.running ? ['340px'] : []),
          'minmax(0, 1fr)',
          disposition.linksOpen ? '280px' : '40px',
        ].join(' '),
  )

  /** Liste affichée par l'onglet actif, ou null. Sert aussi au type proposé pour une nouvelle fiche. */
  const currentList = $derived(listModeOfTab(tabs.current ?? ''))
  /** Dernière liste ouverte (type proposé par « Nouvelle fiche »). */
  let mode = $state<ListMode>('personnage')
  $effect(() => {
    if (currentList) mode = currentList
  })
  let error = $state('')

  let navOpen = $state(false)
  let linksOpen = $state(false)
  let journalOpen = $state(false)
  let settingsOpen = $state(false)
  let newOpen = $state(false)
  let searchOpen = $state(false)
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

  /** Session affichée par l'onglet actif (M8a), ou null : l'onglet montre une fiche. */
  const currentSession = $derived(sessionIdOfTab(tabs.current ?? ''))
  let sessionView = $state<SessionView | undefined>()

  /** Affiche la fiche (ou la session) de l'onglet actif (D-M14) ; une fiche disparue est retirée des onglets. */
  async function show() {
    try {
      for (;;) {
        const id = tabs.current
        if (!id) {
          await opened.close()
          break
        }
        if (listModeOfTab(id)) {
          await opened.close()
          break
        }
        const sid = sessionIdOfTab(id)
        if (sid) {
          if (sessions.byId.has(sid)) {
            await opened.close()
            break
          }
          tabs.forget(id)
          continue
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

  /** Ouvre la fiche dans un nouvel onglet, ou revient sur son onglet si elle est déjà ouverte (D-M21). */
  async function openEntity(id: string) {
    tabs.open(id)
    navOpen = false
    await show()
  }

  async function activateTab(i: number) {
    tabs.activate(i)
    await show()
  }

  function moveTab(from: number, to: number) {
    tabs.move(from, to)
  }

  async function cycleTab(delta: number) {
    tabs.cycle(delta)
    await show()
  }

  async function closeTab(i: number) {
    const id = tabs.nav.tabs[i]
    tabs.close(i)
    await show()
    // Une fiche en édition dont on ferme l'onglet se rouvrira en lecture.
    if (id && opened.entity?.id !== id) opened.forgetEditing(id)
  }

  /** Glisser la poignée de la barre latérale : nouvelle largeur (bornée), retenue pour cet appareil. */
  function startResize(e: PointerEvent) {
    const handle = e.currentTarget as HTMLElement
    try {
      handle.setPointerCapture(e.pointerId)
    } catch {
      // Pointeur déjà relâché : le glisser continue sans capture.
    }
    const left = handle.parentElement!.getBoundingClientRect().left
    const move = (ev: PointerEvent) => (disposition.sidebarWidth = clampWidth(ev.clientX - left))
    const up = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      disposition.setWidth(disposition.sidebarWidth)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
  }

  /** Clic sur un type, les archives ou les doublons : son onglet de liste (ouvert ou retrouvé, D-M27). */
  function selectMode(m: ListMode) {
    mode = m
    void openEntity(listTab(m))
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
      await openEntity(e.id)
    } catch (err) {
      fail(err)
    }
  }

  // Sessions (M8a) : ouvertes dans un onglet comme une fiche.
  async function openSession(id: string) {
    await openEntity(sessionTab(id))
  }

  /**
   * Entrée du journal demandée (chronologie d'une fiche, recherche, M8c) : session en cours → sa colonne (volet en
   * disposition étroite) ; sinon la fiche de la session, dont la section Journal descend sur l'entrée.
   */
  async function openJournalEntry(sessionId: string, entryId: string) {
    try {
      play.reveal(sessionId, entryId)
      linksOpen = false
      if (play.running?.id === sessionId) {
        if (layout !== 'large') journalOpen = true
        return
      }
      await openSession(sessionId)
    } catch (e) {
      fail(e)
    }
  }

  async function newSession() {
    try {
      const s = await sessions.create()
      sessions.setEditing(s.id, true)
      await openSession(s.id)
    } catch (e) {
      fail(e)
    }
  }

  // Session en cours (M8b) : journal rechargé quand elle change.
  $effect(() => {
    void play.running?.id
    play.sync().catch(fail)
  })

  /** Démarrer : instantané, journal, et les PNJ et lieux du scénario ouverts dans des onglets (cahier §5.2). */
  async function startSession(s: Session) {
    await play.start(s)
    const sc = s.scenarioId ? catalog.byId.get(s.scenarioId) : undefined
    const ids = sc ? [...relationIds(sc.props.pnj), ...relationIds(sc.props.lieux)].filter(id => catalog.byId.has(id)) : []
    for (const id of ids) tabs.open(id)
    tabs.open(sessionTab(s.id))
    await show()
  }

  /** Terminer : la session s'ouvre en édition, résumé pré-rempli avec le journal s'il était vide. */
  async function finishSession() {
    const id = await play.finish()
    journalOpen = false
    if (!id) return
    sessions.setEditing(id, true)
    await openSession(id)
  }

  /** Remettre des PNJ à l'état du début de la session ; la fiche ouverte est relue si elle en fait partie. */
  async function resetSession(s: Session, ids: string[]) {
    await opened.flush()
    const done = await play.reset(s, ids)
    if (opened.entity && done.includes(opened.entity.id)) await opened.open(opened.entity.id)
  }

  /** Session supprimée : son onglet se ferme. */
  async function closeSessionTab(id: string) {
    tabs.forget(sessionTab(id))
    await show()
  }

  /** Notes de session importées de Notion encore à reprendre (D-M26). */
  const sessionNotes = $derived(catalog.active.filter(e => e.type === 'note' && parseSessionNoteTitle(e.title)))

  /**
   * Reprise des notes de session importées (D-M26) : résumé de la session N, « Idée pour la suite » dans la
   * préparation de N+1 ; sessions existantes complétées ; notes archivées ensuite.
   */
  async function importSessionNotes() {
    try {
      const r = await getRepository()
      const notes: ImportedNote[] = []
      for (const c of sessionNotes) {
        const e = await r.getEntity(c.id)
        if (e && e.tags.includes('session')) notes.push({ id: e.id, title: e.title, bodyMd: e.bodyMd })
      }
      const plan = planImportedNotes(notes)
      const join = (a: string, b: string) => [a.trim(), b.trim()].filter(Boolean).join('\n\n')
      for (const p of plan.sessions) {
        const existing = sessions.list.find(x => x.number === p.number)
        const base = existing ?? (await sessions.create())
        await sessions.save({
          ...base,
          number: p.number,
          playedOn: base.playedOn ?? p.playedOn,
          status: p.done ? 'terminee' : base.status,
          summaryMd: join(base.summaryMd, p.summaryMd),
          prepMd: join(base.prepMd, p.prepMd),
        })
      }
      for (const id of plan.noteIds) {
        const e = await r.getEntity(id)
        if (!e) continue
        e.archived = true
        e.updatedAt = new Date().toISOString()
        await r.saveEntity(e)
        catalog.upsert(toCatalogEntry(e))
        if (opened.entity?.id === id) await opened.open(id)
      }
    } catch (e) {
      fail(e)
    }
  }

  /** Import d'images ou de PDF (cahier §4.6) : une fiche Document par fichier, la dernière est ouverte. */
  async function importFiles(files: File[]) {
    const errors: string[] = []
    let last: string | null = null
    for (const f of files) {
      try {
        const asset = await media.importFile(f)
        const e = createEntity('document', titleFromFileName(f.name))
        e.props = { fichier: asset.id }
        await (await getRepository()).saveEntity(e)
        catalog.upsert(toCatalogEntry(e))
        last = e.id
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err))
      }
    }
    if (last) await openEntity(last)
    // Après l'ouverture (qui efface le message d'erreur précédent).
    error = errors.join(' ')
  }

  // Fichiers glissés sur l'app (hors éditeur de texte, qui les insère lui-même dans le texte).
  let dragging = $state(false)
  const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files')
  const inEditor = (e: DragEvent) => !!(e.target as HTMLElement | null)?.closest?.('.cm-editor')
  function onDragOver(e: DragEvent) {
    if (!hasFiles(e) || inEditor(e)) return
    e.preventDefault()
    dragging = true
  }
  function onDrop(e: DragEvent) {
    dragging = false
    if (!hasFiles(e) || inEditor(e)) return
    e.preventDefault()
    const files = [...(e.dataTransfer?.files ?? [])]
    if (files.length) void importFiles(files)
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

  // Impression (Imprimer / PDF ou Ctrl+P, D-M30) : toujours en couleurs claires, thème rétabli ensuite.
  $effect(() => {
    const root = document.documentElement
    let prev: string | null = null
    const before = () => {
      prev = root.getAttribute('data-theme')
      root.setAttribute('data-theme', 'light')
    }
    const after = () => (prev === null ? root.removeAttribute('data-theme') : root.setAttribute('data-theme', prev))
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  })

  // Les volets n'ont plus lieu d'être quand la fenêtre s'élargit.
  $effect(() => {
    if (layout === 'large') navOpen = linksOpen = false
  })

  /** Champ de saisie, liste déroulante ou éditeur de texte : « / » y reste une lettre. */
  const typing = (t: EventTarget | null) =>
    t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

  function onKey(e: KeyboardEvent) {
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
    } else if (k === 'e' && currentSession) {
      e.preventDefault()
      sessionView?.toggle()
    } else if (k === 'e' && entity && !entity.archived) {
      e.preventDefault()
      void opened.setEditing(!opened.editing)
    } else if (k === 'j' && play.running) {
      e.preventDefault()
      void focusJournal()
    }
  }

  /** Ctrl+J (cahier §7) : curseur dans la saisie du journal (volet ouvert en disposition étroite). */
  async function focusJournal() {
    if (layout !== 'large') journalOpen = true
    await tick()
    const target = document.querySelector<HTMLElement>('section.journal .cm-content, section.journal form.haki input, section.journal form.haki select')
    target?.focus()
  }

  onMount(() => {
    const onResize = () => (layout = computeLayout())
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
    // Catalogue, puis les onglets de la dernière fois (sans les fiches disparues), puis les récentes.
    catalog
      .load()
      .then(() => sessions.load())
      .then(() =>
        tabs.load(id =>
          listModeOfTab(id) ? true : sessionIdOfTab(id) ? sessions.byId.has(sessionIdOfTab(id)!) : catalog.byId.has(id),
        ),
      )
      .then(show)
      .catch(fail)
    recents.load().catch(fail)
    media.load().catch(fail)
    disposition.load().catch(fail)
    // Changements du bloc de jeu ou de l'état d'un PNJ pendant la session : entrées automatiques (D-M15).
    opened.onSaved = (before, after) => void play.noteChanges(before, after).catch(fail)
    // Sauvegarde automatique et relais entre appareils (M4, D-M18).
    backup.start().catch(fail)

    return () => {
      medium.removeEventListener('change', onResize)
      document.removeEventListener('visibilitychange', onHide)
    }
  })

  const addChild = () => {
    if (entity) newEntity({ type: 'note', parentId: entity.id })
  }
</script>

<svelte:window onkeydown={onKey} ondragover={onDragOver} ondragleave={e => { if (!e.relatedTarget) dragging = false }} ondrop={onDrop} />

{#snippet sidebar()}
  <Sidebar
    selected={currentList}
    onSelect={selectMode}
    onOpen={openEntity}
    onOpenSession={openSession}
    onNewSession={newSession}
    importableNotes={sessionNotes.length}
    onImportNotes={importSessionNotes}
    onSettings={() => (settingsOpen = true)}
    onSearch={() => ((navOpen = false), (searchOpen = true))}
    onCollapse={layout === 'large' ? () => disposition.toggleSidebar() : undefined}
  />
{/snippet}

{#snippet journal()}
  <JournalPanel
    onOpen={id => ((journalOpen = false), void openEntity(id))}
    onFinish={finishSession}
    onOpenSession={id => ((journalOpen = false), void openSession(id))}
  />
{/snippet}

{#snippet links()}
  <LinksPanel onOpen={openEntity} onAddChild={addChild} onOpenEntry={openJournalEntry} />
{/snippet}

<div class="app {layout}" style:grid-template-columns={gridColumns}>
  {#if layout === 'large'}
    {#if disposition.sidebarOpen}
      <div class="col sidebar">{@render sidebar()}</div>
      <!-- Poignée : glisser pour régler la largeur (double-clic : largeur par défaut ; flèches au clavier).
           Séparateur focalisable avec valeur : motif ARIA « window splitter », que Svelte ne reconnaît pas. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <div
        class="resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Largeur de la barre latérale"
        aria-valuemin={180}
        aria-valuemax={420}
        aria-valuenow={disposition.sidebarWidth}
        tabindex="0"
        onpointerdown={startResize}
        ondblclick={() => disposition.setWidth(SIDEBAR_DEFAULT)}
        onkeydown={e => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            disposition.setWidth(disposition.sidebarWidth + (e.key === 'ArrowLeft' ? -10 : 10))
          }
        }}
      ></div>
    {:else}
      <div class="rail">
        <button onclick={() => disposition.toggleSidebar()} aria-label="Ouvrir la barre latérale" title="Ouvrir la barre latérale">»</button>
        <button onclick={() => (searchOpen = true)} aria-label="Rechercher" title="Rechercher (Ctrl+K)">⌕</button>
      </div>
    {/if}
  {/if}

  {#if layout === 'large' && play.running}
    <div class="col">{@render journal()}</div>
  {/if}

  <main class="col main">
    {#if layout === 'une'}
      <div class="bar">
        <button onclick={() => (navOpen = true)} aria-label="Menu">☰</button>
        {#if play.running}<button onclick={() => (journalOpen = true)}>Journal</button>{/if}
        <span class="spacer"></span>
        {#if entity}<button onclick={() => (linksOpen = true)}>Liens</button>{/if}
      </div>
    {/if}
    <BackupBanner onSettings={() => (settingsOpen = true)} />
    <TabBar
      compact={layout === 'une'}
      onActivate={activateTab}
      onClose={closeTab}
      onMove={moveTab}
      onNew={() => (searchOpen = true)}
    />
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <div class="content">
      {#if currentList}
        {#key currentList}
          <EntityList
            mode={currentList}
            onOpen={openEntity}
            onCreate={() => newEntity()}
            onMerge={(a, b) => startMerge(a, b)}
            onImport={importFiles}
          />
        {/key}
      {:else if currentSession}
        {#key currentSession}
          <SessionView
            bind:this={sessionView}
            id={currentSession}
            onOpen={openEntity}
            onDeleted={closeSessionTab}
            onStart={startSession}
            onFinish={finishSession}
            onReset={resetSession}
          />
        {/key}
      {:else if entity || layout === 'large'}
        <EntityView
          onOpen={openEntity}
          onCreateFromLink={label => newEntity({ title: label, type: 'note', fromLink: label })}
          onCreate={createForRelation}
          onAddChild={addChild}
          onDelete={deleteOpened}
          onMerge={id => startMerge(id)}
        />
      {:else}
        <p class="hello">Ouvre le menu ☰ pour choisir un type de fiches, ou cherche une fiche (Ctrl+K).</p>
      {/if}
    </div>
  </main>

  {#if layout === 'large'}
    {#if disposition.linksOpen}
      <div class="col links">
        <button class="collapse-links" onclick={() => disposition.toggleLinks()} aria-label="Replier le panneau Liens" title="Replier le panneau Liens">»</button>
        {@render links()}
      </div>
    {:else}
      <div class="rail right">
        <button onclick={() => disposition.toggleLinks()} aria-label="Ouvrir le panneau Liens" title="Ouvrir le panneau Liens">«</button>
        <span class="rail-label">Liens</span>
      </div>
    {/if}
  {/if}
</div>

<Drawer bind:open={navOpen} label="Navigation">{@render sidebar()}</Drawer>
<Drawer bind:open={linksOpen} side="right" label="Liens">{@render links()}</Drawer>
<Drawer bind:open={journalOpen} label="Journal de la session">{@render journal()}</Drawer>

<SearchPalette bind:open={searchOpen} onOpen={openEntity} onOpenEntry={openJournalEntry} />
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
<MediaViewer />
{#if dragging}<div class="drop" aria-hidden="true">Déposer pour importer (une fiche Document par fichier)</div>{/if}

<style>
  .drop {
    position: fixed;
    inset: 12px;
    z-index: 60;
    display: grid;
    place-items: center;
    border: 3px dashed var(--accent);
    border-radius: 16px;
    background: color-mix(in srgb, var(--bg) 80%, transparent);
    font-size: 1.2rem;
    font-weight: 600;
    pointer-events: none;
  }
  .app {
    display: grid;
    height: 100dvh;
    overflow: hidden;
  }
  /* Impression : seul le contenu de l'onglet actif (la fiche), sur toute la largeur et toute sa hauteur. */
  @media print {
    .app {
      display: block;
      height: auto;
      overflow: visible;
    }
    /* Composants (bandeau, onglets) : hors de la portée des styles d'App, d'où :global. */
    .app > :global(:not(main)),
    .main > :global(:not(.content)) {
      display: none !important;
    }
    .main,
    .content {
      display: block;
      border: none;
      background: none;
    }
  }
  /* Barre latérale (ou rail), poignée, onglets, Liens (ou rail). */
  .resizer {
    position: relative;
    z-index: 2;
    cursor: col-resize;
    touch-action: none;
  }
  .resizer:hover,
  .resizer:focus-visible {
    background: color-mix(in srgb, var(--accent) 40%, transparent);
  }
  .rail {
    width: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding-top: 8px;
    border-right: 1px solid var(--line);
  }
  .rail.right {
    border-right: none;
    border-left: 1px solid var(--line);
  }
  .rail button {
    min-height: 40px;
    min-width: 34px;
    padding: 0;
    border: none;
    background: none;
    font-size: 1.1rem;
  }
  .rail-label {
    writing-mode: vertical-rl;
    color: var(--muted);
    font-size: 0.85rem;
    letter-spacing: 0.08em;
  }
  .links {
    position: relative;
  }
  .collapse-links {
    position: absolute;
    top: 8px;
    right: 8px;
    min-height: 32px;
    min-width: 32px;
    padding: 0;
    border: none;
    background: none;
    color: var(--muted);
    z-index: 1;
  }
  .hello {
    margin: 20px;
    color: var(--muted);
  }
  .app.une {
    grid-template-columns: minmax(0, 1fr);
  }
  .col {
    min-height: 0;
    min-width: 0;
  }
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
