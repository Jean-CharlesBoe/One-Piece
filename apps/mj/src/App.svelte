<script lang="ts">
  import { CLASSES, RACES } from '@onepiece/core'

  // Coquille de l'étape C1 : vérifie seulement que l'appli MJ consomme le paquet partagé.
  // La disposition 3 colonnes arrive à l'étape M0.
</script>

<main>
  <h1>One Piece</h1>
  <p>Appli MJ — en construction (étape M0).</p>
  <p class="muted">{RACES.length} races jouables · {CLASSES.length} classes</p>
</main>

<style>
  main {
    padding: 24px;
  }
  .muted {
    color: var(--muted);
  }
</style>
