<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import { renderMarkdown } from '../markdown'
  import type { Entity } from '../model/entity'
  import { sameName } from '../model/links'
  import { changeType, displayValue, ORPHANS, relationIds, removeOrphan, subtitle } from '../model/props'
  import { ENTITY_TYPES, TYPE_DEFS, type EntityType } from '../model/types'
  import { opened } from '../opened.svelte'
  import ChipsInput from './ChipsInput.svelte'
  import MarkdownEditor from './MarkdownEditor.svelte'
  import PropsForm from './PropsForm.svelte'

  // Fiche ouverte (cahier MJ §4.2 et §4.3) : lecture (propriétés, texte rendu, liens cliquables) ou édition
  // (Ctrl+E). Toute modification passe par `opened.changed()` (sauvegarde automatique).
  let {
    onOpen,
    onCreateFromLink,
    onCreate,
    onAddChild,
    onDelete,
  }: {
    onOpen: (id: string) => void
    /** Lien rouge cliqué : créer la fiche nommée `label` puis réécrire le lien. */
    onCreateFromLink: (label: string) => void
    /** Création depuis un champ relation : renvoie l'identifiant de la fiche créée. */
    onCreate: (type: EntityType, title: string) => Promise<string | null>
    onAddChild: () => void
    onDelete: () => void
  } = $props()

  const entity = $derived(opened.entity)
  const def = $derived(entity ? TYPE_DEFS[entity.type] : null)
  const html = $derived(entity && !opened.editing ? renderMarkdown(entity.bodyMd, id => catalog.byId.has(id)) : '')
  const orphans = $derived(entity ? Object.entries((entity.props[ORPHANS] as Record<string, unknown>) ?? {}) : [])

  /** Chaîne des pages parentes, de la racine à la fiche (au plus 10 niveaux). */
  const ancestors = $derived.by(() => {
    const out = []
    let p = entity?.parentId
    while (p && out.length < 10) {
      const e = catalog.byId.get(p)
      if (!e) break
      out.unshift(e)
      p = e.parentId
    }
    return out
  })

  const sameNames = $derived(entity && opened.editing ? sameName(entity.title, catalog.active, entity.id) : [])
  let confirmDelete = $state(false)
  $effect(() => {
    void entity?.id
    confirmDelete = false
  })

  function changed() {
    opened.changed()
  }

  function onBodyClick(ev: MouseEvent) {
    const a = (ev.target as HTMLElement).closest('a.wl') as HTMLAnchorElement | null
    if (!a) return
    ev.preventDefault()
    if (a.dataset.id) onOpen(a.dataset.id)
    else if (a.dataset.create) onCreateFromLink(a.dataset.create)
  }

  function setType(t: EntityType) {
    if (!entity) return
    changeType(entity, t)
    changed()
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
  const SAVE_LABEL = { enregistre: 'Enregistré', 'en-attente': 'Enregistrement…', erreur: 'Non enregistré' }
</script>

<article class="view">
  {#if entity && def}
    {#if ancestors.length}
      <nav class="crumbs" aria-label="Pages parentes">
        {#each ancestors as a (a.id)}
          <a href="#{a.id}" onclick={e => (e.preventDefault(), onOpen(a.id))}>{a.title}</a> ›
        {/each}
      </nav>
    {/if}

    <header>
      <p class="label">{def.icon} {def.label}</p>
      <div class="actions">
        {#if opened.editing}
          <span class="save" class:err={opened.save === 'erreur'}>{SAVE_LABEL[opened.save]}</span>
          <button class="primary" onclick={() => opened.setEditing(false)} title="Terminer (Ctrl+E)">✓ Terminer</button>
        {:else}
          <button
            class="icon"
            class:on={entity.pinned}
            aria-pressed={entity.pinned}
            title={entity.pinned ? 'Désépingler' : 'Épingler dans la barre latérale'}
            onclick={() => opened.apply(e => (e.pinned = !e.pinned))}>📌</button
          >
          {#if !entity.archived}
            <button onclick={onAddChild} title="Nouvelle page rattachée à celle-ci">+ Page enfant</button>
            <button onclick={() => opened.setEditing(true)} title="Modifier (Ctrl+E)">✎ Modifier</button>
            <button
              onclick={() => opened.apply(e => (e.archived = true))}
              title="Retirer des listes et de la recherche (réversible)">Archiver</button
            >
          {/if}
        {/if}
      </div>
    </header>

    {#if entity.archived}
      <div class="archived card" role="status">
        <p>Fiche archivée : absente des listes et de la recherche.</p>
        <div class="row">
          <button onclick={() => opened.apply(e => (e.archived = false))}>Restaurer</button>
          {#if confirmDelete}
            <button class="danger" onclick={onDelete}>Confirmer la suppression définitive</button>
            <button onclick={() => (confirmDelete = false)}>Annuler</button>
          {:else}
            <button class="danger" onclick={() => (confirmDelete = true)}>Supprimer définitivement…</button>
          {/if}
        </div>
        {#if confirmDelete}<p class="warn">Les liens vers cette fiche deviendront des liens rouges. Impossible à annuler.</p>{/if}
      </div>
    {/if}

    {#if opened.editing}
      <!-- ÉDITION -->
      <div class="edit">
        <label class="title-field">
          <span class="label">Titre (nom de référence)</span>
          <input class="title-input" bind:value={entity.title} oninput={changed} maxlength="120" />
        </label>
        {#if sameNames.length}
          <p class="warn" role="status">
            Même nom que :
            {#each sameNames as s, i (s.id)}{i ? ', ' : ''}<a href="#{s.id}" onclick={e => (e.preventDefault(), onOpen(s.id))}
                >{s.title}</a
              > ({TYPE_DEFS[s.type].label}){/each}. Un nom de référence par chose : envisager un alias.
          </p>
        {/if}
        {#if !entity.title.trim()}<p class="warn">Un titre est nécessaire pour enregistrer.</p>{/if}

        <div class="two">
          <label>
            <span class="label">Type</span>
            <select value={entity.type} onchange={e => setType(e.currentTarget.value as EntityType)}>
              {#each ENTITY_TYPES as t (t)}<option value={t}>{TYPE_DEFS[t].label}</option>{/each}
            </select>
          </label>
          <ChipsInput
            label="Alias (autres noms)"
            values={entity.aliases}
            placeholder="Entrée pour ajouter"
            onChange={v => {
              entity.aliases = v
              changed()
            }}
          />
        </div>
        <ChipsInput
          label="Étiquettes"
          values={entity.tags}
          placeholder="Entrée pour ajouter"
          onChange={v => {
            entity.tags = v
            changed()
          }}
        />

        <PropsForm {entity} onChange={changed} {onCreate} />

        {#if orphans.length}
          <section class="orphans">
            <h3 class="label">Propriétés orphelines (ancien type ou import)</h3>
            {#each orphans as [k, v] (k)}
              <p>
                <b>{k}</b> : {typeof v === 'string' ? v : JSON.stringify(v)}
                <button
                  class="small"
                  onclick={() => {
                    removeOrphan(entity, k)
                    changed()
                  }}>Supprimer</button
                >
              </p>
            {/each}
          </section>
        {/if}

        {#key entity.id}
          <MarkdownEditor
            value={entity.bodyMd}
            selfId={entity.id}
            onChange={v => {
              entity.bodyMd = v
              changed()
            }}
          />
        {/key}
        {#if opened.error}<p class="err" role="alert">{opened.error}</p>{/if}
      </div>
    {:else}
      <!-- LECTURE -->
      <h2>{entity.title}</h2>
      {#if subtitle(entity, id => catalog.title(id))}<p class="sub">{subtitle(entity, id => catalog.title(id))}</p>{/if}
      {#if entity.aliases.length}<p class="muted">Aussi appelé : {entity.aliases.join(', ')}</p>{/if}
      {#if entity.tags.length}
        <p class="tags">{#each entity.tags as t (t)}<span class="tag">{t}</span>{/each}</p>
      {/if}

      {#if def.fields.some(f => entity.props[f.key] !== undefined)}
        <table class="props">
          <tbody>
            {#each def.fields.filter(f => entity.props[f.key] !== undefined) as f (f.key)}
              <tr>
                <th>{f.label}</th>
                <td>
                  {#if f.field.kind === 'relation'}
                    {#each relationIds(entity.props[f.key]) as id, i (id)}
                      {i ? ', ' : ''}{#if catalog.byId.has(id)}<a href="#{id}" class="wl" onclick={e => (e.preventDefault(), onOpen(id))}
                          >{catalog.title(id)}</a
                        >{:else}<span class="gone">fiche supprimée</span>{/if}
                    {/each}
                  {:else if f.field.kind === 'longtext'}
                    <span class="pre">{entity.props[f.key]}</span>
                  {:else}
                    {displayValue(f, entity.props[f.key], id => catalog.title(id))}
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}

      {#if orphans.length}
        <p class="muted small-text">
          Propriétés orphelines : {orphans.map(([k]) => k).join(', ')} (visibles et supprimables en édition).
        </p>
      {/if}

      {#if entity.bodyMd.trim()}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML nettoyé par DOMPurify (markdown.ts) -->
        <div class="md" role="presentation" onclick={onBodyClick}>{@html html}</div>
      {:else if !entity.archived && !def.fields.some(f => entity.props[f.key] !== undefined)}
        <p class="empty-body">Fiche vide. <button class="link" onclick={() => opened.setEditing(true)}>La compléter</button> (Ctrl+E).</p>
      {/if}

      <p class="dates">Créée le {fmt(entity.createdAt)} · modifiée le {fmt(entity.updatedAt)}</p>
    {/if}
  {:else}
    <p class="empty">Choisis une fiche dans la liste, ou crée-en une (Ctrl+N).</p>
  {/if}
</article>

<style>
  .view {
    height: 100%;
    overflow-y: auto;
    padding: 16px 28px 40px;
  }
  .crumbs {
    font-size: 0.9rem;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .crumbs a,
  a.wl,
  .warn a {
    color: var(--accent);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
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
    min-height: 34px;
    padding: 0 10px;
  }
  .icon {
    filter: grayscale(1);
    opacity: 0.55;
  }
  .icon.on {
    filter: none;
    opacity: 1;
  }
  .save {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .save.err,
  .err {
    color: var(--danger);
  }
  h2 {
    margin: 4px 0 2px;
    font-size: 1.8rem;
  }
  .sub {
    margin: 0 0 6px;
    font-weight: 600;
  }
  .muted {
    margin: 4px 0;
    color: var(--muted);
  }
  .small-text {
    font-size: 0.85rem;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 6px 0;
  }
  .tag {
    padding: 1px 10px;
    border-radius: 999px;
    background: var(--bg);
    border: 1px solid var(--line);
    font-size: 0.85rem;
  }
  .props {
    margin: 12px 0;
    border-collapse: collapse;
    width: 100%;
  }
  .props th,
  .props td {
    padding: 5px 8px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
  }
  .props th {
    width: 32%;
    color: var(--muted);
    font-weight: 600;
    font-size: 0.9rem;
  }
  .pre {
    white-space: pre-wrap;
  }
  .gone {
    color: var(--danger);
  }
  .md {
    margin-top: 12px;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }
  .md :global(a.wl) {
    color: var(--accent);
  }
  .md :global(a.wl.missing) {
    color: var(--danger);
    text-decoration-style: dashed;
  }
  .md :global(table) {
    border-collapse: collapse;
    margin: 8px 0;
  }
  .md :global(th),
  .md :global(td) {
    border: 1px solid var(--line);
    padding: 4px 8px;
  }
  .md :global(blockquote) {
    margin: 8px 0;
    padding-left: 12px;
    border-left: 3px solid var(--line);
    color: var(--muted);
  }
  .md :global(img) {
    max-width: 100%;
  }
  .md :global(.asset) {
    color: var(--muted);
    font-style: italic;
  }
  .dates {
    margin-top: 28px;
    color: var(--muted);
    font-size: 0.85rem;
  }
  .empty-body {
    margin-top: 16px;
    color: var(--muted);
  }
  button.link {
    min-height: 0;
    padding: 0;
    border: none;
    background: none;
    color: var(--accent);
    text-decoration: underline;
  }
  .edit {
    display: grid;
    gap: 12px;
    margin-top: 8px;
  }
  .title-field,
  .two label {
    display: grid;
    gap: 4px;
  }
  .title-input {
    font-size: 1.4rem;
    font-weight: 700;
  }
  .two {
    display: grid;
    grid-template-columns: minmax(150px, 1fr) 2fr;
    gap: 12px;
    align-items: start;
  }
  .warn {
    margin: -4px 0 0;
    color: var(--reve);
    font-size: 0.9rem;
  }
  .orphans p {
    margin: 4px 0;
  }
  .small {
    min-height: 28px;
    padding: 0 8px;
    font-size: 0.85rem;
  }
  .archived {
    margin: 10px 0;
    border-color: var(--reve);
  }
  .archived p {
    margin: 0 0 8px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .empty {
    margin-top: 30vh;
    text-align: center;
    color: var(--muted);
  }
</style>
