<script lang="ts">
  import type { Entity } from '../model/entity'

  // Panneau Liens (cahier MJ §4.2) : relations, rétroliens, pages enfants, chronologie.
  // M0 : sections vides, remplies à partir de M2 (liens) et M8 (chronologie).
  let { entity }: { entity: Entity | null } = $props()

  const SECTIONS = ['Relations', 'Mentionné dans', 'Pages enfants', 'Chronologie']
</script>

<aside class="links" aria-label="Liens">
  <h2>Liens</h2>
  {#if entity}
    {#each SECTIONS as s (s)}
      <section>
        <h3 class="label">{s}</h3>
        <p class="empty">Rien pour l'instant.</p>
      </section>
    {/each}
  {:else}
    <p class="empty">Les liens de la fiche ouverte s'affichent ici.</p>
  {/if}
</aside>

<style>
  .links {
    height: 100%;
    overflow-y: auto;
    padding: 12px 14px;
  }
  h2 {
    margin: 0 0 12px;
    font-size: 1.05rem;
  }
  section {
    margin-bottom: 14px;
  }
  h3 {
    margin: 0 0 4px;
  }
  .empty {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
  }
</style>
