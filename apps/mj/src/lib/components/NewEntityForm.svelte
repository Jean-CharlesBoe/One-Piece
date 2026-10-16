<script lang="ts">
  import { ENTITY_TYPES, TYPE_DEFS, type EntityType } from '../model/types'

  // Contenu de la fenêtre « Nouvelle fiche » : type et titre (cahier MJ §4.3).
  // L'avertissement de doublon (D-M8) arrive avec les fiches (M2).
  let { type, onCreate }: { type: EntityType; onCreate: (type: EntityType, title: string) => void } = $props()

  // svelte-ignore state_referenced_locally
  let chosen = $state<EntityType>(type)
  let title = $state('')
</script>

<form
  onsubmit={e => {
    e.preventDefault()
    if (title.trim()) onCreate(chosen, title)
  }}
>
  <label>
    <span class="label">Type</span>
    <select bind:value={chosen}>
      {#each ENTITY_TYPES as t (t)}
        <option value={t}>{TYPE_DEFS[t].label}</option>
      {/each}
    </select>
  </label>
  <label>
    <span class="label">Titre</span>
    <!-- svelte-ignore a11y_autofocus -->
    <input bind:value={title} maxlength="120" autofocus placeholder="Nom de référence" />
  </label>
  <button class="primary" type="submit" disabled={!title.trim()}>Créer la fiche</button>
</form>

<style>
  form {
    display: grid;
    gap: 12px;
    margin-top: 16px;
  }
  label {
    display: grid;
    gap: 4px;
  }
</style>
