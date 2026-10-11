<script lang="ts">
  import ResourceDiamond from '@onepiece/core/ui/ResourceDiamond.svelte'
  import SkillList from '@onepiece/core/ui/SkillList.svelte'
  import StatGrid from '@onepiece/core/ui/StatGrid.svelte'
  import TempBonuses from '@onepiece/core/ui/TempBonuses.svelte'
  import { COMPAGNON_TYPES, type Compagnon } from '../model/character'

  // Fiche d'un compagnon (cahier joueur §4.8), reprise de la fiche de créature de Sans Nom.
  let {
    compagnon,
    editing,
    onDelete,
  }: { compagnon: Compagnon; editing: boolean; onDelete: () => void } = $props()
  const uid = $props.id()

  let confirmDelete = $state(false)
  let confirmTimer: ReturnType<typeof setTimeout> | undefined

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

  const summary = $derived([compagnon.type, compagnon.race].filter(Boolean).join(' · '))
</script>

<div class="view">
  {#if editing}
    <div class="form">
      <label class="wide">
        <span class="label">Nom</span>
        <input bind:value={compagnon.nom} maxlength="120" autocomplete="off" />
      </label>
      <label>
        <span class="label">Type</span>
        <input
          bind:value={compagnon.type}
          list="{uid}-types"
          maxlength="120"
          placeholder="ex. Monture"
          autocomplete="off"
        />
        <datalist id="{uid}-types">
          {#each COMPAGNON_TYPES as t (t)}
            <option value={t}></option>
          {/each}
        </datalist>
      </label>
      <label>
        <span class="label">Race</span>
        <input bind:value={compagnon.race} maxlength="120" placeholder="ex. Canard" autocomplete="off" />
      </label>
    </div>
  {:else}
    <p class="summary">{summary || 'Type et race : touche le crayon pour remplir.'}</p>
  {/if}

  <section aria-label="Caractéristiques de {compagnon.nom}">
    <StatGrid owner={compagnon} {editing} />
  </section>

  <TempBonuses owner={compagnon} />

  <section aria-labelledby="{uid}-ressources">
    <h2 class="label" id="{uid}-ressources">Ressources</h2>
    <div class="diamonds">
      <ResourceDiamond label="Vitalité" res={compagnon.ressources.vitalite} color="--vitalite" {editing} />
      <ResourceDiamond label="Endurance" res={compagnon.ressources.endurance} color="--endurance" {editing} />
    </div>
  </section>

  <section class="card">
    <label class="label" for="{uid}-equipement">Équipement</label>
    <textarea id="{uid}-equipement" bind:value={compagnon.equipement} maxlength="20000"></textarea>
  </section>

  <section class="card">
    <label class="label" for="{uid}-inventaire">Inventaire</label>
    <textarea id="{uid}-inventaire" bind:value={compagnon.inventaire} maxlength="20000"></textarea>
  </section>

  <section aria-label="Compétences de {compagnon.nom}">
    <SkillList owner={compagnon} {editing} />
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
  .form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .form label {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .wide {
    grid-column: 1 / -1;
  }
  .summary {
    margin: 0;
    color: var(--muted);
  }
  h2 {
    margin: 0;
  }
  /* Même disposition que les ressources du personnage : deux losanges par ligne (D-J11). */
  .diamonds {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    justify-items: center;
    margin-top: 8px;
  }
  .card label {
    display: block;
    margin-bottom: 6px;
  }
  .delete {
    width: 100%;
  }
</style>
