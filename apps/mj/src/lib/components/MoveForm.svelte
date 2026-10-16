<script lang="ts">
  import { catalog } from '../catalog.svelte'
  import { nameKey } from '../model/links'
  import { canMoveUnder } from '../model/tree'
  import { TYPE_DEFS } from '../model/types'

  // Contenu de la fenêtre « Déplacer vers… » (cahier MJ §4.3) : choisir la page parente d'une fiche,
  // ou la racine. Ni la fiche elle-même ni ses sous-pages ne sont proposées (pas de boucle).
  let { id, parentId, onMove }: { id: string; parentId: string | null; onMove: (target: string | null) => void } =
    $props()

  let query = $state('')

  const candidates = $derived.by(() => {
    const k = nameKey(query)
    return catalog.active
      .filter(e => e.id !== parentId && canMoveUnder(id, e.id, catalog.entries))
      .filter(e => !k || [e.title, ...e.aliases].some(n => nameKey(n).includes(k)))
      .slice(0, 30)
  })
</script>

<div class="move">
  <!-- svelte-ignore a11y_autofocus -->
  <input type="search" bind:value={query} placeholder="Chercher la page parente…" autofocus aria-label="Chercher la page parente" />
  <ul>
    {#if parentId}
      <li><button onclick={() => onMove(null)}>↥ Aucune (page à la racine)</button></li>
    {/if}
    {#each candidates as e (e.id)}
      <li>
        <button onclick={() => onMove(e.id)}>
          <span aria-hidden="true">{TYPE_DEFS[e.type].icon}</span>
          {e.title}
          <span class="muted">{TYPE_DEFS[e.type].label}</span>
        </button>
      </li>
    {:else}
      <li class="muted empty">Aucune fiche ne correspond.</li>
    {/each}
  </ul>
</div>

<style>
  .move {
    display: grid;
    gap: 8px;
    margin-top: 16px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 50dvh;
    overflow-y: auto;
  }
  li button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    border: none;
    background: none;
    text-align: left;
  }
  li button:hover {
    background: var(--bg);
  }
  .muted {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .empty {
    padding: 8px;
  }
</style>
