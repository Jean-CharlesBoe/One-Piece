<script lang="ts">
  import { onMount } from 'svelte'
  import { summarize, type Character } from '../model/character'
  import { getRepository } from '../storage/repository'

  // Écran provisoire (J0) : il prouve l'aller-retour liste → personnage → liste et la lecture en base.
  // Les onglets Fiche / Compétences / Compagnons et la sauvegarde automatique arrivent à l'étape J1.
  let { id, onBack }: { id: string; onBack: () => void } = $props()

  let character = $state<Character | null>(null)
  let error = $state('')

  onMount(async () => {
    try {
      character = await (await getRepository()).get(id)
      if (!character) error = 'Personnage introuvable.'
    } catch (e) {
      error = 'Lecture impossible : ' + (e instanceof Error ? e.message : String(e))
    }
  })
</script>

<main>
  <header>
    <button class="back" onclick={onBack} aria-label="Retour à la liste">←</button>
    <h1>{character?.nom || 'Personnage'}</h1>
  </header>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {:else if character}
    {@const sub = summarize(character).sousTitre}
    {#if sub}<p class="muted">{sub}</p>{/if}
    <p class="card">La fiche (caracs, ressources, compétences, compagnons) arrive à l'étape J1.</p>
  {/if}
</main>

<style>
  main {
    max-width: 560px;
    margin: 0 auto;
    padding: 12px 16px;
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h1 {
    margin: 0;
    font-size: 1.4rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .back {
    border: none;
    background: none;
    font-size: 1.4rem;
    padding: 0 8px;
  }
  .muted {
    color: var(--muted);
  }
  .error {
    color: var(--danger);
  }
</style>
