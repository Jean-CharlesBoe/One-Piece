<script lang="ts">
  import { showInfo, theme, THEMES, type Theme } from '@onepiece/core'
  import type { CharacterSummary } from '../model/character'
  import { getRepository, META_SHOW_INFO, META_THEME } from '../storage/repository'
  import BackupPanel from './BackupPanel.svelte'

  // Contenu de la fenêtre « Réglages » (roue dentée de l'accueil, D-J19) : sauvegarde, thème, boutons « i ».
  // Les valeurs sont chargées au démarrage (App.svelte) et enregistrées ici.
  let { characters, onChanged }: { characters: CharacterSummary[]; onChanged: () => void } = $props()

  let error = $state('')

  async function save(key: string, value: string) {
    try {
      await (await getRepository()).setMeta(key, value)
      error = ''
    } catch (e) {
      error = 'Réglage non enregistré : ' + (e instanceof Error ? e.message : String(e))
    }
  }

  function pickTheme(t: Theme) {
    theme.set(t)
    void save(META_THEME, t)
  }

  function toggleInfo(checked: boolean) {
    showInfo.set(checked)
    void save(META_SHOW_INFO, String(checked))
  }
</script>

<div class="settings">
  <BackupPanel {characters} onImported={onChanged} onSaved={onChanged} />

  <section class="card" aria-labelledby="theme-titre">
    <h2 class="label" id="theme-titre">Thème</h2>
    <div class="seg" role="radiogroup" aria-labelledby="theme-titre">
      {#each THEMES as [k, l] (k)}
        <button role="radio" aria-checked={$theme === k} class:on={$theme === k} onclick={() => pickTheme(k)}>{l}</button>
      {/each}
    </div>
  </section>

  <section class="card" aria-labelledby="affichage-titre">
    <h2 class="label" id="affichage-titre">Affichage</h2>
    <label class="option">
      <input type="checkbox" checked={$showInfo} onchange={e => toggleInfo(e.currentTarget.checked)} />
      <span>Afficher les boutons « i » (rappels des règles)</span>
    </label>
  </section>

  {#if error}<p class="error" role="alert">{error}</p>{/if}
</div>

<style>
  .settings {
    display: grid;
    gap: 12px;
    margin-top: 16px;
  }
  h2 {
    margin: 0;
  }
  .seg {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin-top: 8px;
  }
  .seg button {
    padding: 0 4px;
    border-radius: 0;
  }
  .seg button:first-child {
    border-radius: var(--radius) 0 0 var(--radius);
  }
  .seg button:last-child {
    border-radius: 0 var(--radius) var(--radius) 0;
  }
  .seg button.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-text);
    font-weight: 600;
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
    margin: 0;
    color: var(--danger);
  }
</style>
