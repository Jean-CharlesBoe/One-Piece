<script lang="ts">
  import { App as CapApp } from '@capacitor/app'
  import { Capacitor } from '@capacitor/core'
  import type { SkillFilter } from '@onepiece/core'
  import SkillList from '@onepiece/core/ui/SkillList.svelte'
  import { onDestroy, onMount } from 'svelte'
  import type { Character } from '../model/character'
  import { getRepository } from '../storage/repository'
  import CompagnonsTab from './CompagnonsTab.svelte'
  import FicheTab from './FicheTab.svelte'

  let { id, onBack }: { id: string; onBack: () => void } = $props()

  const TABS = [
    ['fiche', 'Fiche'],
    ['competences', 'Compétences'],
    ['compagnons', 'Compagnons'],
  ] as const
  type Tab = (typeof TABS)[number][0]

  let character = $state<Character | null>(null)
  let error = $state('')
  let tab = $state<Tab>('fiche')
  let editing = $state(false)
  let skillFilter = $state<SkillFilter>('toutes')
  let saveState = $state<'saved' | 'pending' | 'error'>('saved')

  /* ---------- Sauvegarde automatique ---------- */
  // Toute modification du personnage déclenche un enregistrement 400 ms plus tard ;
  // immédiat au retour à la liste et quand l'app passe en arrière-plan.
  let lastSaved = ''
  let timer: ReturnType<typeof setTimeout> | undefined

  $effect(() => {
    if (!character) return
    const json = JSON.stringify($state.snapshot(character))
    if (json === lastSaved) return
    saveState = 'pending'
    clearTimeout(timer)
    timer = setTimeout(flush, 400)
  })

  async function flush(): Promise<void> {
    clearTimeout(timer)
    if (!character) return
    const snap = $state.snapshot(character)
    const json = JSON.stringify(snap)
    if (json === lastSaved) return
    try {
      await (await getRepository()).save({ ...snap, updatedAt: new Date().toISOString() })
      lastSaved = json
      saveState = 'saved'
    } catch (e) {
      saveState = 'error'
      console.error('[vivrecard] enregistrement impossible', e)
    }
  }

  async function back() {
    await flush()
    onBack()
  }

  onMount(() => {
    load()
    if (!Capacitor.isNativePlatform()) return
    const handle = CapApp.addListener('pause', () => void flush())
    return () => {
      handle.then(h => h.remove())
    }
  })

  onDestroy(() => void flush())

  async function load() {
    try {
      const c = await (await getRepository()).get(id)
      if (!c) {
        error = 'Personnage introuvable.'
        return
      }
      lastSaved = JSON.stringify(c)
      character = c
    } catch (e) {
      error = 'Lecture impossible : ' + (e instanceof Error ? e.message : String(e))
    }
  }
</script>

<header>
  <button class="icon" onclick={back} aria-label="Retour à la liste">←</button>
  <h1>{character?.nom || 'Sans nom'}</h1>
  <span class="save" class:err={saveState === 'error'} aria-live="polite">
    {saveState === 'error' ? 'Non enregistré' : saveState === 'pending' ? '…' : ''}
  </span>
  {#if character}
    <button
      class="icon edit"
      class:on={editing}
      onclick={() => (editing = !editing)}
      aria-pressed={editing}
      aria-label={editing ? 'Terminer la modification' : 'Modifier la fiche'}
    >
      {editing ? '✓' : '✎'}
    </button>
  {/if}
</header>

<div class="tabs" role="tablist" aria-label="Sections de la fiche">
  {#each TABS as [key, label] (key)}
    <button role="tab" aria-selected={tab === key} class:active={tab === key} onclick={() => (tab = key)}>
      {label}
    </button>
  {/each}
</div>

{#if editing}
  <p class="edit-banner">Mode édition</p>
{/if}

<main>
  {#if error}
    <p class="error" role="alert">{error}</p>
  {:else if character}
    {#if tab === 'fiche'}
      <FicheTab
        {character}
        {editing}
        onShowTechniques={() => {
          skillFilter = 'fruit'
          tab = 'competences'
        }}
      />
    {:else if tab === 'competences'}
      <SkillList owner={character} {editing} bind:filter={skillFilter} />
    {:else}
      <CompagnonsTab {character} {editing} />
    {/if}
  {/if}
</main>

<style>
  header {
    position: sticky;
    top: env(safe-area-inset-top);
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--bg);
  }
  .icon {
    border: none;
    background: none;
    font-size: 1.4rem;
    min-width: 44px;
    padding: 0 8px;
  }
  .edit.on {
    background: var(--accent);
    color: var(--accent-text);
  }
  h1 {
    flex: 1;
    margin: 0;
    font-size: 1.3rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .save {
    font-size: 0.8rem;
    color: var(--muted);
  }
  .save.err {
    color: var(--danger);
  }
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--line);
    padding: 0 8px;
  }
  .tabs button {
    flex: 1;
    border: none;
    border-bottom: 3px solid transparent;
    border-radius: 0;
    background: none;
    color: var(--muted);
    padding: 0 4px;
  }
  .tabs button.active {
    color: var(--text);
    border-bottom-color: var(--accent);
    font-weight: 600;
  }
  .edit-banner {
    margin: 0;
    padding: 4px;
    text-align: center;
    font-size: 0.8rem;
    font-weight: 600;
    background: var(--accent);
    color: var(--accent-text);
  }
  main {
    max-width: 560px;
    margin: 0 auto;
    padding: 16px 16px 48px;
  }
  .error {
    color: var(--danger);
  }
</style>
