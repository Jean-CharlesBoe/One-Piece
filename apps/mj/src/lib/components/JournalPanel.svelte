<script lang="ts">
  import { tick } from 'svelte'
  import { catalog } from '../catalog.svelte'
  import { renderMarkdown } from '../markdown'
  import { INPUT_KINDS, kindLabel, timeLabel, type JournalKind } from '../model/journal'
  import { sessionLabel } from '../model/session'
  import { play } from '../play.svelte'
  import MarkdownEditor from './MarkdownEditor.svelte'

  // Journal de la session en cours (M8b, cahier §5.2, maquette A : colonne à gauche des onglets, D-M26, D-M27).
  // Saisie rapide en bas (Entrée, [[ pour lier une fiche), type d'entrée au choix ; entrées automatiques grisées
  // et masquables ; chaque entrée se supprime (deux clics). Un lien ouvre la fiche dans un nouvel onglet.
  let { onOpen, onFinish, onOpenSession }: { onOpen: (id: string) => void; onFinish: () => Promise<void>; onOpenSession: (id: string) => void } = $props()

  let kind = $state<JournalKind>('evenement')
  let hideAuto = $state(false)
  let confirmId = $state<string | null>(null)
  let confirmFinish = $state(false)
  let list: HTMLElement | undefined = $state()

  const shown = $derived(hideAuto ? play.entries.filter(e => e.kind !== 'auto') : play.entries)
  const autoCount = $derived(play.entries.filter(e => e.kind === 'auto').length)
  const exists = (id: string) => catalog.byId.has(id)

  // Nouvelle entrée : on descend en bas du journal.
  let count = 0
  $effect(() => {
    const n = shown.length
    if (n > count) void tick().then(() => list?.scrollTo({ top: list.scrollHeight }))
    count = n
  })

  async function submit(text: string) {
    await play.add(kind, text)
    kind = 'evenement'
  }

  function remove(id: string) {
    if (confirmId !== id) {
      confirmId = id
      setTimeout(() => confirmId === id && (confirmId = null), 4000)
      return
    }
    confirmId = null
    void play.remove(id)
  }

  function finish() {
    if (!confirmFinish) {
      confirmFinish = true
      setTimeout(() => (confirmFinish = false), 5000)
      return
    }
    confirmFinish = false
    void onFinish()
  }

  function onClick(ev: MouseEvent) {
    const a = (ev.target as HTMLElement).closest('a.wl') as HTMLAnchorElement | null
    if (!a) return
    ev.preventDefault()
    if (a.dataset.id) onOpen(a.dataset.id)
  }
</script>

{#if play.running}
  {@const s = play.running}
  <section class="journal" aria-labelledby="journal-titre">
    <header>
      <div class="head">
        <h2 id="journal-titre"><button class="link" onclick={() => onOpenSession(s.id)} title="Ouvrir la session">▶ {sessionLabel(s)}</button></h2>
        <button class="finish" class:confirm={confirmFinish} onclick={finish}>{confirmFinish ? 'Confirmer : terminer' : '■ Terminer'}</button>
      </div>
      {#if autoCount}
        <label class="check"><input type="checkbox" bind:checked={hideAuto} /> Masquer les entrées automatiques ({autoCount})</label>
      {/if}
    </header>

    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -- les liens du texte sont des <a> -->
    <ol class="entries" bind:this={list} onclick={onClick}>
      {#each shown as e (e.id)}
        <li class:auto={e.kind === 'auto'}>
          <span class="time">{timeLabel(e.at)}</span>
          <div class="text">
            {#if e.kind !== 'evenement' && e.kind !== 'auto'}<span class="kind k-{e.kind}">{kindLabel(e.kind)}</span>{/if}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML nettoyé par DOMPurify (markdown.ts) -->
            <div class="md">{@html renderMarkdown(e.textMd, exists)}</div>
          </div>
          <button class="del" class:confirm={confirmId === e.id} onclick={ev => (ev.stopPropagation(), remove(e.id))} aria-label="Supprimer l'entrée" title={confirmId === e.id ? 'Cliquer encore pour supprimer' : 'Supprimer'}
            >{confirmId === e.id ? 'Suppr. ?' : '✕'}</button
          >
        </li>
      {:else}
        <li class="empty">Le journal est vide : écris ce qui se passe ci-dessous (Entrée pour ajouter).</li>
      {/each}
    </ol>

    <div class="input">
      <div class="kinds" role="radiogroup" aria-label="Type d'entrée">
        {#each INPUT_KINDS as [k, l] (k)}
          <button role="radio" aria-checked={kind === k} class:on={kind === k} onclick={() => (kind = k)}>{l}</button>
        {/each}
      </div>
      {#key s.id}
        <MarkdownEditor value="" selfId="" compact onChange={() => {}} onSubmit={submit} hint="Ce qui se passe… [[ pour lier une fiche · Entrée pour ajouter" />
      {/key}
    </div>
  </section>
{/if}

<style>
  .journal {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--surface);
    border-left: 1px solid var(--line);
  }
  header {
    padding: 10px 12px 6px;
    border-bottom: 1px solid var(--line);
    display: grid;
    gap: 4px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font-size: 1rem;
    min-width: 0;
  }
  .link {
    min-height: 36px;
    padding: 0;
    border: none;
    background: none;
    font-weight: 700;
    text-align: left;
    color: var(--accent);
  }
  .finish {
    min-height: 36px;
    padding: 0 10px;
    font-size: 0.85rem;
    flex: none;
  }
  .finish.confirm,
  .del.confirm {
    border-color: var(--danger);
    color: var(--danger);
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .check input {
    width: 18px;
    height: 18px;
    min-height: 0;
  }
  .entries {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    list-style: none;
    margin: 0;
    padding: 6px 8px;
    display: grid;
    align-content: start;
    gap: 2px;
  }
  .entries li {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    gap: 6px;
    align-items: start;
    padding: 4px 4px;
    border-radius: 6px;
  }
  .entries li:hover {
    background: var(--bg);
  }
  .entries li.auto {
    color: var(--muted);
    font-size: 0.88rem;
  }
  .time {
    color: var(--muted);
    font-size: 0.82rem;
    padding-top: 2px;
    font-variant-numeric: tabular-nums;
  }
  .text {
    min-width: 0;
  }
  .md {
    overflow-wrap: anywhere;
    line-height: 1.45;
  }
  .md :global(p) {
    margin: 0;
  }
  .md :global(a.wl) {
    color: var(--accent);
  }
  .auto .md :global(a.wl) {
    color: inherit;
    text-decoration: underline dotted;
  }
  .md :global(a.wl.missing) {
    color: var(--danger);
  }
  .kind {
    display: inline-block;
    margin-bottom: 2px;
    padding: 0 6px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--bg);
    border: 1px solid var(--line);
  }
  .k-combat {
    border-color: var(--vitalite);
    color: var(--vitalite);
  }
  .k-decouverte {
    border-color: var(--reve);
    color: var(--reve);
  }
  .k-xp {
    border-color: var(--up);
    color: var(--up);
  }
  .k-note {
    border-color: var(--endurance);
    color: var(--endurance);
  }
  .del {
    min-height: 28px;
    min-width: 28px;
    padding: 0 4px;
    border: 1px solid transparent;
    background: none;
    color: var(--muted);
    font-size: 0.8rem;
    opacity: 0.6;
  }
  li:hover .del,
  .del:focus-visible,
  .del.confirm {
    opacity: 1;
  }
  .empty {
    display: block !important;
    color: var(--muted);
    padding: 12px 4px !important;
  }
  .input {
    border-top: 1px solid var(--line);
    padding: 8px;
    display: grid;
    gap: 6px;
  }
  .kinds {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .kinds button {
    min-height: 32px;
    padding: 0 8px;
    font-size: 0.8rem;
    border-radius: 999px;
  }
  .kinds button.on {
    border-color: var(--accent);
    color: var(--accent);
    font-weight: 600;
  }
</style>
