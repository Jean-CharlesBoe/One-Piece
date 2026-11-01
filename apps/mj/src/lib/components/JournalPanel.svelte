<script lang="ts">
  import { clampD100, HAKI_TYPES, hakiEffect, parseIntInput, type HakiType } from '@onepiece/core'
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
  // Type Haki (M8c, D-M9) : PJ, type, résultat du D100 et effet de la table au lieu du texte libre.
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

  // Entrée demandée (chronologie, recherche) : on y descend et on la surligne quelques secondes.
  let flash = $state<string | null>(null)
  $effect(() => {
    const t = play.target
    if (!t || t.sessionId !== play.running?.id) return
    if (play.entries.some(e => e.id === t.entryId && e.kind === 'auto')) hideAuto = false
    flash = t.entryId
    void tick().then(() => document.getElementById(`jp-${t.entryId}`)?.scrollIntoView({ block: 'center' }))
    // Demande servie : oubliée, pour ne pas resurligner l'entrée au prochain affichage.
    const timer = setTimeout(() => {
      flash = null
      if (play.target?.seq === t.seq) play.target = null
    }, 2500)
    return () => clearTimeout(timer)
  })

  // Jet de Haki : PJ (rôle PJ), type, D100 ; le PJ choisi reste proposé pour le jet suivant.
  const pjs = $derived(catalog.active.filter(e => e.type === 'personnage' && e.props.role === 'PJ'))
  let pjId = $state('')
  let hakiType = $state<HakiType>('observation')
  let d100 = $state('')
  let comment = $state('')
  const roll = $derived(parseIntInput(d100))
  const preview = $derived(roll !== null && roll >= 1 && roll <= 100 ? hakiEffect(hakiType, roll) : null)
  $effect(() => {
    if (!pjs.some(p => p.id === pjId)) pjId = pjs[0]?.id ?? ''
  })

  async function submitHaki() {
    if (!pjId || !preview || roll === null) return
    await play.addHaki({ pjId, type: hakiType, resultat: clampD100(roll) }, comment)
    d100 = ''
    comment = ''
    kind = 'evenement'
  }

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
        <li id="jp-{e.id}" class:auto={e.kind === 'auto'} class:flash={flash === e.id}>
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
      {#if kind === 'haki'}
        <form class="haki" onsubmit={ev => (ev.preventDefault(), void submitHaki())}>
          {#if pjs.length}
            <label><span class="label">PJ</span>
              <select bind:value={pjId}>{#each pjs as p (p.id)}<option value={p.id}>{p.title}</option>{/each}</select>
            </label>
            <div class="kinds" role="radiogroup" aria-label="Type de Haki">
              {#each HAKI_TYPES as [k, l] (k)}
                <button type="button" role="radio" aria-checked={hakiType === k} class:on={hakiType === k} onclick={() => (hakiType = k)}>{l}</button>
              {/each}
            </div>
            <div class="row">
              <label class="d100"><span class="label">D100</span><input bind:value={d100} inputmode="numeric" maxlength="3" placeholder="1–100" aria-label="Résultat du D100" /></label>
              <label class="comment"><span class="label">Commentaire</span><input bind:value={comment} maxlength="300" placeholder="facultatif" /></label>
            </div>
            <p class="effect" class:best={preview?.best} aria-live="polite">
              {#if preview}{preview.range} : {preview.effet}{preview.best ? ' · meilleur résultat' : ''}{:else if d100.trim()}Résultat de 1 à 100.{:else}Résultat du D100 lancé par le MJ.{/if}
            </p>
            <button class="primary" disabled={!preview}>Ajouter le jet</button>
          {:else}
            <p class="effect">Aucun personnage au rôle PJ : renseigne le rôle sur leur fiche.</p>
          {/if}
        </form>
      {:else}
        {#key s.id}
          <MarkdownEditor value="" selfId="" compact onChange={() => {}} onSubmit={submit} hint="Ce qui se passe… [[ pour lier une fiche · Entrée pour ajouter" />
        {/key}
      {/if}
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
  .entries li.flash {
    background: color-mix(in srgb, var(--accent) 22%, transparent);
    transition: background 0.3s;
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
  .k-haki {
    border-color: var(--accent);
    color: var(--accent);
  }
  .haki {
    display: grid;
    gap: 6px;
  }
  .haki label {
    display: grid;
    gap: 2px;
  }
  .haki .row {
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    gap: 6px;
  }
  .haki input,
  .haki select {
    min-height: 36px;
  }
  .effect {
    margin: 0;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .effect.best {
    color: var(--up);
    font-weight: 600;
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
