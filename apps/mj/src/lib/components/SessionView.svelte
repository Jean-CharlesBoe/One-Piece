<script lang="ts">
  import { onDestroy } from 'svelte'
  import { catalog } from '../catalog.svelte'
  import { renderMarkdown } from '../markdown'
  import { dayLabel, SESSION_STATUSES, sessionLabel, statusLabel, type Session } from '../model/session'
  import { sessions } from '../sessions.svelte'
  import MarkdownEditor from './MarkdownEditor.svelte'

  // Fiche d'une session de jeu (M8a, cahier §5.1) : numéro, titre, date, scénario, statut, préparation et résumé.
  // Lecture ou édition (Ctrl+E ou « Modifier »), comme une fiche ; enregistrement 400 ms après la dernière
  // modification. Une session laissée en édition pour un autre onglet s'y retrouve à son retour.
  let { id, onOpen, onDeleted }: { id: string; onOpen: (entityId: string) => void; onDeleted: (id: string) => void } = $props()

  // svelte-ignore state_referenced_locally
  const initial = sessions.byId.get(id)
  let s = $state<Session | null>(initial ? structuredClone(initial) : null)
  const editing = $derived(sessions.editing.has(id))
  let confirmDelete = $state(false)
  let saveState = $state<'enregistre' | 'en-attente' | 'erreur'>('enregistre')

  let timer: ReturnType<typeof setTimeout> | null = null
  let last = JSON.stringify(s)
  $effect(() => {
    const now = JSON.stringify(s)
    if (now === last) return
    last = now
    saveState = 'en-attente'
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => void flush(), 400)
  })

  async function flush() {
    if (timer) clearTimeout(timer)
    timer = null
    if (!s || saveState !== 'en-attente') return
    try {
      await sessions.save($state.snapshot(s) as Session)
      saveState = 'enregistre'
    } catch (e) {
      saveState = 'erreur'
      console.error('[onepiece-mj] session', e)
    }
  }
  onDestroy(() => void flush())

  const scenarios = $derived(catalog.active.filter(e => e.type === 'scenario'))
  const exists = (eid: string) => catalog.byId.has(eid)
  const prepHtml = $derived(s && !editing ? renderMarkdown(s.prepMd, exists) : '')
  const summaryHtml = $derived(s && !editing ? renderMarkdown(s.summaryMd, exists) : '')

  function toggleEditing() {
    if (editing) void flush()
    sessions.setEditing(id, !editing)
  }

  async function remove() {
    if (!confirmDelete) {
      confirmDelete = true
      setTimeout(() => (confirmDelete = false), 4000)
      return
    }
    if (timer) clearTimeout(timer)
    saveState = 'enregistre'
    await sessions.remove(id)
    onDeleted(id)
  }

  /** Lien [[ ]] du texte rendu : ouvre la fiche. */
  function onBodyClick(ev: MouseEvent) {
    const a = (ev.target as HTMLElement).closest('a.wl') as HTMLAnchorElement | null
    if (!a) return
    ev.preventDefault()
    if (a.dataset.id) onOpen(a.dataset.id)
  }

  /** Ctrl+E (App.svelte) : bascule lecture / édition de la session affichée. */
  export function toggle() {
    toggleEditing()
  }
</script>

<article class="view">
  {#if !s}
    <p class="empty">Session introuvable.</p>
  {:else}
    <header>
      <p class="label">📖 Session</p>
      <div class="actions">
        <span class="save" class:err={saveState === 'erreur'}>{saveState === 'en-attente' ? 'Enregistrement…' : saveState === 'erreur' ? 'Non enregistrée' : ''}</span>
        <button onclick={toggleEditing} title="Ctrl+E">{editing ? '✓ Terminer' : '✎ Modifier'}</button>
        <button class:danger={confirmDelete} onclick={remove}>{confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}</button>
      </div>
    </header>

    {#if editing}
      <div class="edit">
        <div class="meta">
          <label><span class="label">Numéro</span><input type="number" min="1" bind:value={s.number} /></label>
          <label class="wide"><span class="label">Titre</span><input bind:value={s.title} maxlength="120" placeholder="L'île du Sud" /></label>
          <label><span class="label">Date</span><input type="date" value={s.playedOn ?? ''} oninput={e => s && (s.playedOn = e.currentTarget.value || null)} /></label>
          <label>
            <span class="label">Statut</span>
            <select bind:value={s.status}>
              {#each SESSION_STATUSES as [k, l] (k)}<option value={k}>{l}</option>{/each}
            </select>
          </label>
          <label class="wide">
            <span class="label">Scénario</span>
            <select value={s.scenarioId ?? ''} onchange={e => s && (s.scenarioId = e.currentTarget.value || null)}>
              <option value="">—</option>
              {#each scenarios as sc (sc.id)}<option value={sc.id}>{sc.title}</option>{/each}
            </select>
          </label>
        </div>
        <h3 class="label">Préparation</h3>
        {#key `${id}-prep`}<MarkdownEditor value={s.prepMd} selfId="" onChange={v => s && (s.prepMd = v)} />{/key}
        <h3 class="label">Résumé</h3>
        {#key `${id}-resume`}<MarkdownEditor value={s.summaryMd} selfId="" onChange={v => s && (s.summaryMd = v)} />{/key}
      </div>
    {:else}
      <h2>{sessionLabel(s)}</h2>
      <p class="sub">
        {statusLabel(s.status)}{s.playedOn ? ` · ${dayLabel(s.playedOn)}` : ''}
        {#if s.scenarioId && catalog.byId.has(s.scenarioId)}
          · <a href="#{s.scenarioId}" class="wl" onclick={e => (e.preventDefault(), onOpen(s!.scenarioId!))}>{catalog.title(s.scenarioId)}</a>
        {/if}
      </p>
      <section>
        <h3 class="label">Préparation</h3>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML nettoyé par DOMPurify (markdown.ts) -->
        {#if s.prepMd.trim()}<div class="md" role="presentation" onclick={onBodyClick}>{@html prepHtml}</div>{:else}<p class="muted">Rien de préparé.</p>{/if}
      </section>
      <section>
        <h3 class="label">Résumé</h3>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML nettoyé par DOMPurify (markdown.ts) -->
        {#if s.summaryMd.trim()}<div class="md" role="presentation" onclick={onBodyClick}>{@html summaryHtml}</div>{:else}<p class="muted">Pas encore de résumé.</p>{/if}
      </section>
    {/if}
  {/if}
</article>

<style>
  .view {
    height: 100%;
    overflow-y: auto;
    padding: 16px 28px 40px;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  header .label {
    margin: 0;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .actions button {
    min-height: 40px;
    padding: 0 10px;
  }
  .save {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .save.err {
    color: var(--danger);
  }
  h2 {
    margin: 4px 0 2px;
    font-size: 1.8rem;
  }
  .sub {
    margin: 0 0 10px;
    font-weight: 600;
  }
  .sub a,
  .md :global(a.wl) {
    color: var(--accent);
  }
  .md :global(a.wl.missing) {
    color: var(--danger);
  }
  h3 {
    margin: 18px 0 6px;
  }
  .md {
    line-height: 1.55;
    overflow-wrap: anywhere;
  }
  .muted,
  .empty {
    color: var(--muted);
  }
  .edit {
    display: grid;
    gap: 8px;
    margin-top: 8px;
  }
  .meta {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }
  .meta label {
    display: grid;
    gap: 4px;
  }
  .meta .wide {
    grid-column: span 2;
  }
  .meta input,
  .meta select {
    min-height: 40px;
  }
</style>
