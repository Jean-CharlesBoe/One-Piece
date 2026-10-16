<script lang="ts">
  import type { Entity } from '../model/entity'
  import { TYPE_DEFS } from '../model/types'

  // Fiche ouverte (cahier MJ §4.2). M0 : en-tête seulement ; propriétés, texte et édition arrivent en M2.
  let { entity }: { entity: Entity | null } = $props()

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
</script>

<article class="view">
  {#if entity}
    <p class="label">{TYPE_DEFS[entity.type].icon} {TYPE_DEFS[entity.type].label}</p>
    <h2>{entity.title}</h2>
    {#if entity.aliases.length}<p class="muted">Aussi appelé : {entity.aliases.join(', ')}</p>{/if}
    <p class="muted">Créée le {fmt(entity.createdAt)} · modifiée le {fmt(entity.updatedAt)}</p>
    <p class="todo card">Propriétés, texte et édition de la fiche : prochaine étape (M2).</p>
  {:else}
    <p class="empty">Choisis une fiche dans la liste, ou crée-en une.</p>
  {/if}
</article>

<style>
  .view {
    height: 100%;
    overflow-y: auto;
    padding: 20px 28px;
  }
  h2 {
    margin: 4px 0 8px;
    font-size: 1.8rem;
  }
  .label {
    margin: 0;
  }
  .muted {
    margin: 4px 0;
    color: var(--muted);
  }
  .todo {
    margin-top: 20px;
    color: var(--muted);
  }
  .empty {
    margin-top: 30vh;
    text-align: center;
    color: var(--muted);
  }
</style>
