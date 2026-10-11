<script lang="ts">
  import type { SkillFilter } from '@onepiece/core'
  import SkillList from '@onepiece/core/ui/SkillList.svelte'
  import { tick } from 'svelte'
  import type { Compagnon } from '../model/character'
  import FicheTab from './FicheTab.svelte'

  // Fiche d'un compagnon (cahier joueur §4.8) : la même fiche qu'un PJ (D-J17), race libre comprise,
  // suivie de ses compétences sur la même page.
  let {
    compagnon,
    editing,
    onDelete,
  }: { compagnon: Compagnon; editing: boolean; onDelete: () => void } = $props()
  const uid = $props.id()

  let skillFilter = $state<SkillFilter>('toutes')
  let skillsEl: HTMLElement
  let confirmDelete = $state(false)
  let confirmTimer: ReturnType<typeof setTimeout> | undefined

  // Lien « Voir les techniques » du fruit : la liste est sur la même page, on la filtre et on y descend.
  async function showTechniques() {
    skillFilter = 'fruit'
    await tick()
    skillsEl.scrollIntoView({ block: 'start' })
  }

  // Suppression en deux temps : un premier tap arme le bouton, un second confirme.
  function remove() {
    if (!confirmDelete) {
      confirmDelete = true
      clearTimeout(confirmTimer)
      confirmTimer = setTimeout(() => (confirmDelete = false), 4000)
      return
    }
    onDelete()
  }
</script>

<div class="view">
  <FicheTab character={compagnon} {editing} freeRace onShowTechniques={showTechniques} />

  <section bind:this={skillsEl} aria-labelledby="{uid}-competences">
    <h2 class="label" id="{uid}-competences">Compétences</h2>
    <SkillList owner={compagnon} {editing} bind:filter={skillFilter} />
  </section>

  {#if editing}
    <button class="danger delete" onclick={remove}>
      {confirmDelete ? `Confirmer : supprimer ${compagnon.nom || 'ce compagnon'}` : 'Supprimer ce compagnon'}
    </button>
  {/if}
</div>

<style>
  .view {
    display: grid;
    gap: 20px;
  }
  section {
    scroll-margin-top: 64px;
  }
  h2 {
    margin: 0 0 8px;
  }
  .delete {
    width: 100%;
  }
</style>
