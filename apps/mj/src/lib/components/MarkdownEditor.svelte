<script lang="ts">
  import { autocompletion, startCompletion, type Completion, type CompletionContext } from '@codemirror/autocomplete'
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
  import { markdown } from '@codemirror/lang-markdown'
  import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
  import { EditorSelection, EditorState } from '@codemirror/state'
  import { EditorView, keymap, placeholder } from '@codemirror/view'
  import { tags } from '@lezer/highlight'
  import { onMount } from 'svelte'
  import { catalog } from '../catalog.svelte'
  import { nameKey, wikiLink } from '../model/links'
  import { TYPE_DEFS } from '../model/types'

  // Éditeur du texte d'une fiche (D-M3) : Markdown source avec CodeMirror 6, barre d'outils,
  // autocomplétion `[[` sur les titres et alias, qui insère la forme stockée `[[id|Titre]]`.
  let { value, selfId, onChange }: { value: string; selfId: string; onChange: (value: string) => void } = $props()

  let host: HTMLDivElement
  let view: EditorView

  /** Propositions après `[[` : fiches (titre ou alias), puis « lien vers une fiche à créer ». */
  function linkCompletions(ctx: CompletionContext) {
    const m = ctx.matchBefore(/\[\[[^\]|\n]*/)
    if (!m) return null
    const q = m.text.slice(2)
    const k = nameKey(q)
    const options: Completion[] = []
    for (const e of catalog.active) {
      if (options.length >= 40) break
      if (e.id === selfId) continue
      const via = [e.title, ...e.aliases].find(n => nameKey(n).includes(k))
      if (via === undefined) continue
      options.push({
        label: via,
        detail: via === e.title ? TYPE_DEFS[e.type].label : `alias de ${e.title}`,
        apply: wikiLink(e.id, e.title),
      })
    }
    if (q.trim()) {
      options.push({ label: `Fiche à créer : ${q.trim()}`, detail: 'lien rouge', apply: wikiLink('?', q) })
    }
    return { from: m.from, options, filter: false }
  }

  const highlight = HighlightStyle.define([
    { tag: tags.heading, fontWeight: '700', color: 'var(--accent)' },
    { tag: tags.strong, fontWeight: '700' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
    { tag: [tags.link, tags.url], color: 'var(--endurance)' },
    { tag: tags.quote, color: 'var(--muted)' },
    { tag: tags.monospace, fontFamily: 'monospace' },
    { tag: [tags.processingInstruction, tags.meta], color: 'var(--muted)' },
  ])

  const theme = EditorView.theme({
    '&': {
      background: 'var(--surface)',
      color: 'var(--text)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius)',
      minHeight: '240px',
    },
    '&.cm-focused': { outline: '2px solid var(--accent)', outlineOffset: '2px' },
    '.cm-scroller': { fontFamily: 'inherit', lineHeight: '1.5' },
    '.cm-content': { padding: '10px 12px', caretColor: 'var(--text)' },
    '.cm-cursor': { borderLeftColor: 'var(--text)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { background: 'color-mix(in srgb, var(--accent) 30%, transparent)' },
    '.cm-placeholder': { color: 'var(--muted)' },
    '.cm-tooltip': { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px' },
    '.cm-tooltip.cm-tooltip-autocomplete > ul': { fontFamily: 'inherit' },
    '.cm-tooltip-autocomplete ul li': { padding: '4px 8px' },
    '.cm-tooltip-autocomplete ul li[aria-selected]': { background: 'var(--accent)', color: 'var(--accent-text)' },
    '.cm-completionDetail': { marginLeft: '8px', opacity: '0.7', fontStyle: 'normal' },
  })

  onMount(() => {
    view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown(),
          syntaxHighlighting(highlight),
          autocompletion({ override: [linkCompletions], icons: false }),
          EditorView.lineWrapping,
          placeholder('Texte de la fiche (Markdown). [[ pour lier une autre fiche.'),
          theme,
          EditorView.updateListener.of(u => {
            if (u.docChanged) onChange(u.state.doc.toString())
          }),
        ],
      }),
    })
    return () => view.destroy()
  })

  /** Entoure la sélection (ou insère le marqueur au curseur). */
  function wrap(mark: string) {
    view.dispatch(
      view.state.changeByRange(r => ({
        changes: [
          { from: r.from, insert: mark },
          { from: r.to, insert: mark },
        ],
        range: EditorSelection.range(r.from + mark.length, r.to + mark.length),
      })),
    )
    view.focus()
  }

  /** Ajoute un préfixe au début de chaque ligne sélectionnée (titre, liste, citation). */
  function prefix(p: string) {
    const lines = new Set<number>()
    for (const r of view.state.selection.ranges) {
      for (let n = view.state.doc.lineAt(r.from).number; n <= view.state.doc.lineAt(r.to).number; n++) lines.add(n)
    }
    view.dispatch({ changes: [...lines].map(n => ({ from: view.state.doc.line(n).from, insert: p })) })
    view.focus()
  }

  function insertLink() {
    const { from, to } = view.state.selection.main
    view.dispatch({ changes: { from, to, insert: '[[' }, selection: { anchor: from + 2 } })
    view.focus()
    startCompletion(view)
  }

  function insertTable() {
    const { from } = view.state.selection.main
    const line = view.state.doc.lineAt(from)
    const table = '| Colonne | Colonne |\n| --- | --- |\n|  |  |\n'
    const at = line.length ? line.to : line.from
    view.dispatch({ changes: { from: at, insert: (line.length ? '\n\n' : '') + table } })
    view.focus()
  }
</script>

<div class="editor">
  <div class="toolbar" role="toolbar" aria-label="Mise en forme">
    <button type="button" title="Gras (entoure la sélection)" onclick={() => wrap('**')}><b>G</b></button>
    <button type="button" title="Italique" onclick={() => wrap('*')}><i>I</i></button>
    <button type="button" title="Titre" onclick={() => prefix('## ')}>Titre</button>
    <button type="button" title="Liste à puces" onclick={() => prefix('- ')}>• Liste</button>
    <button type="button" title="Citation" onclick={() => prefix('> ')}>❝</button>
    <button type="button" title="Tableau" onclick={insertTable}>Tableau</button>
    <button type="button" title="Lien vers une fiche ([[)" onclick={insertLink}>[[ Lien</button>
  </div>
  <div bind:this={host}></div>
</div>

<style>
  .editor {
    display: grid;
    gap: 6px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .toolbar button {
    min-height: 32px;
    padding: 0 10px;
    font-size: 0.9rem;
  }
</style>
