<script lang="ts">
  import { createResource, emptyStats, handleBack } from '@onepiece/core'
  import ResourceDiamond from '@onepiece/core/ui/ResourceDiamond.svelte'
  import StatGrid from '@onepiece/core/ui/StatGrid.svelte'
  import TempBonuses from '@onepiece/core/ui/TempBonuses.svelte'

  // Banc d'essai de l'étape C1 : affiche les composants partagés sur un personnage de démonstration,
  // non enregistré. Remplacé par l'accueil (liste des personnages) à l'étape J0.
  const demo = $state({
    stats: emptyStats(),
    bonusTemporaires: [],
    ressources: {
      vitalite: createResource(35),
      endurance: createResource(20),
      reve: createResource(10, '2D6 + 4 + points dépensés'),
      ambition: createResource(10, 'chaque jour'),
    },
  })

  let editing = $state(false)
</script>

<svelte:window onkeydown={e => e.key === 'Escape' && handleBack()} />

<main>
  <header>
    <h1>Vivre Card</h1>
    <button onclick={() => (editing = !editing)} aria-pressed={editing}>{editing ? 'Terminé' : 'Modifier'}</button>
  </header>
  <p class="note">Banc d'essai des composants partagés (étape C1). Rien n'est enregistré.</p>

  <section class="card">
    <StatGrid owner={demo} {editing} />
  </section>

  <section class="card">
    <TempBonuses owner={demo} />
  </section>

  <section class="card diamonds">
    <ResourceDiamond label="Vitalité" res={demo.ressources.vitalite} color="--vitalite" {editing} />
    <ResourceDiamond label="Endurance" res={demo.ressources.endurance} color="--endurance" {editing} />
    <ResourceDiamond label="Rêve" res={demo.ressources.reve} color="--reve" {editing} />
    <ResourceDiamond label="Ambition" res={demo.ressources.ambition} color="--ambition" {editing} />
  </section>
</main>

<style>
  main {
    max-width: 560px;
    margin: 0 auto;
    padding: 12px;
    display: grid;
    gap: 12px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h1 {
    margin: 0;
    font-size: 1.4rem;
  }
  .note {
    margin: 0;
    color: var(--muted);
    font-size: 0.85rem;
  }
  .diamonds {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    justify-items: center;
  }
</style>
