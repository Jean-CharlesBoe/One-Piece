<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import { sameName } from '../model/links'
  import { ENTITY_TYPES, TYPE_DEFS, type EntityType } from '../model/types'

  // Contenu de la fenêtre « Nouvelle fiche » (cahier MJ §4.3) : type et titre, avec l'avertissement de
  // doublon de D-M8 : « Existe déjà : Skypiéens (race). L'ouvrir / Créer quand même ». La comparaison est exacte
  // (casse et accents près) : « Ajouter comme alias » viendra avec la détection approchée des doublons (M2c).
  let {
    type,
    title: initialTitle = '',
    parentTitle = '',
    onCreate,
    onOpen,
  }: {
    type: EntityType
    title?: string
    /** Page enfant : titre de la page parente, pour mémoire. */
    parentTitle?: string
    onCreate: (type: EntityType, title: string) => void
    onOpen: (id: string) => void
  } = $props()

  // svelte-ignore state_referenced_locally
  let chosen = $state<EntityType>(type)
  // svelte-ignore state_referenced_locally
  let title = $state(initialTitle)

  const doublons = $derived(sameName(title, catalog.active))

  function submit(e: SubmitEvent) {
    e.preventDefault()
    if (title.trim()) onCreate(chosen, title)
  }
</script>

<form onsubmit={submit}>
  {#if parentTitle}<p class="muted">Page enfant de « {parentTitle} »</p>{/if}
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

  {#if doublons.length}
    <div class="dup card" role="status">
      {#each doublons as d (d.id)}
        <p>Existe déjà : <b>{d.title}</b> ({TYPE_DEFS[d.type].label.toLowerCase()})</p>
        <div class="row">
          <button type="button" onclick={() => onOpen(d.id)}>L'ouvrir</button>
        </div>
      {/each}
    </div>
  {/if}

  <button class="primary" type="submit" disabled={!title.trim()}>
    {doublons.length ? 'Créer quand même' : 'Créer la fiche'}
  </button>
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
  .muted {
    margin: 0;
    color: var(--muted);
  }
  .dup {
    border-color: var(--reve);
  }
  .dup p {
    margin: 0 0 6px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 6px;
  }
</style>
