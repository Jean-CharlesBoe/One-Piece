<script lang="ts">
  import { AIDE_MEMOIRE } from '../rules/memos'

  // Aide-mémoire des règles (D-J7) : seuils, critiques des trois paliers de dé, combat, ressources, XP.
  // Contenu : packages/core/src/rules/memos.ts. À placer dans une fenêtre (Sheet) ou une page.
</script>

<div class="aide">
  {#each AIDE_MEMOIRE as section (section.titre)}
    <section>
      <h3 class="label">{section.titre}</h3>
      {#each section.texte ?? [] as p, i (i)}
        <p>{p}</p>
      {/each}
      {#if section.tableau}
        <table>
          <thead>
            <tr>
              <th>{section.tableau.colonnes[0]}</th>
              <th>{section.tableau.colonnes[1]}</th>
            </tr>
          </thead>
          <tbody>
            {#each section.tableau.lignes as [a, b] (a)}
              <tr>
                <td>{a}</td>
                <td>{b}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </section>
  {/each}
</div>

<style>
  .aide {
    display: grid;
    gap: 18px;
    margin-top: 12px;
  }
  section {
    display: grid;
    gap: 6px;
  }
  h3 {
    margin: 0;
    color: var(--accent);
  }
  p {
    margin: 0;
    font-size: 0.92rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  th {
    text-align: left;
    font-weight: 600;
    color: var(--muted);
    border-bottom: 1px solid var(--line);
    padding: 4px 6px 4px 0;
  }
  td {
    padding: 5px 6px 5px 0;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
  }
  td:last-child,
  th:last-child {
    font-variant-numeric: tabular-nums;
  }
</style>
