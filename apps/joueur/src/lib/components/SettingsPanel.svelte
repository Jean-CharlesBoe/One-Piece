<script lang="ts">
  import { showInfo } from '@onepiece/core'
  import { getRepository, META_SHOW_INFO } from '../storage/repository'

  // Réglages de l'app (accueil). La valeur est chargée au démarrage (App.svelte) et enregistrée ici.
  let error = $state('')

  async function toggle(checked: boolean) {
    showInfo.set(checked)
    try {
      await (await getRepository()).setMeta(META_SHOW_INFO, String(checked))
      error = ''
    } catch (e) {
      error = 'Réglage non enregistré : ' + (e instanceof Error ? e.message : String(e))
    }
  }
</script>

<section class="card" aria-labelledby="reglages-titre">
  <h2 class="label" id="reglages-titre">Réglages</h2>
  <label class="option">
    <input type="checkbox" checked={$showInfo} onchange={e => toggle(e.currentTarget.checked)} />
    <span>Afficher les boutons « i » (rappels des règles)</span>
  </label>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</section>

<style>
  h2 {
    margin: 0;
  }
  .option {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    margin-top: 4px;
  }
  .option input {
    width: 22px;
    min-height: 0;
    height: 22px;
    margin: 0;
    accent-color: var(--accent);
  }
  .error {
    margin: 6px 0 0;
    color: var(--danger);
  }
</style>
