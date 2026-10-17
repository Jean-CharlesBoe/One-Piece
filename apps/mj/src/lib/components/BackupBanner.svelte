<script lang="ts">
  import { backup } from '../backup/sync.svelte'

  // Bandeau au-dessus de la fiche quand la sauvegarde demande une action (M4, D-M18) : réautoriser le dossier,
  // reprendre la version de l'autre appareil, départager deux versions, choisir un dossier, erreur.
  let { onSettings }: { onSettings: () => void } = $props()

  let confirmLocal = $state(false)
  const fmt = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : '?'
</script>

{#if backup.status === 'autorisation'}
  <div class="banner" role="status">
    <span>Sauvegarde en pause : Chrome demande de réautoriser le dossier « {backup.folderName} ».</span>
    <button class="primary" onclick={() => backup.authorize()}>Autoriser</button>
  </div>
{:else if backup.status === 'reprendre' && backup.other}
  <div class="banner" role="alert">
    <span>
      Version plus récente dans le dossier : enregistrée le {fmt(backup.other.exportedAt)} sur
      <b>{backup.other.device}</b> ({backup.other.counts.entities ?? 0} fiches). Sauvegarde automatique en pause.
    </span>
    <button class="primary" onclick={() => backup.takeFolder()}>Reprendre cette version</button>
  </div>
{:else if backup.status === 'conflit' && backup.other}
  <div class="banner danger" role="alert">
    <span>
      Les deux appareils ont modifié la base. Dossier : le {fmt(backup.other.exportedAt)} sur
      <b>{backup.other.device}</b> ({backup.other.counts.entities ?? 0} fiches). Laquelle garder ? L'autre reste dans
      « historique ».
    </span>
    <button onclick={() => backup.takeFolder()}>Garder celle du dossier</button>
    {#if confirmLocal}
      <button class="danger" onclick={() => backup.keepLocal()}>Confirmer : garder celle de cet appareil</button>
    {:else}
      <button onclick={() => (confirmLocal = true)}>Garder celle de cet appareil…</button>
    {/if}
  </div>
{:else if backup.status === 'sans-dossier'}
  <div class="banner" role="status">
    <span>Aucune sauvegarde : choisis un dossier dans Google Drive pour protéger la base.</span>
    <button class="primary" onclick={() => backup.choose()}>Choisir le dossier…</button>
  </div>
{:else if backup.status === 'erreur'}
  <div class="banner danger" role="alert">
    <span>Erreur de sauvegarde : {backup.error}</span>
    <button onclick={() => backup.check()}>Réessayer</button>
    <button onclick={onSettings}>Réglages</button>
  </div>
{:else if backup.status === 'non-supporte' && backup.needsAttention}
  <div class="banner" role="status">
    <span>Pense à télécharger une sauvegarde de la base.</span>
    <button onclick={() => backup.download()}>Télécharger</button>
  </div>
{/if}

<style>
  .banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--reve);
    background: color-mix(in srgb, var(--reve) 14%, var(--surface));
  }
  .banner.danger {
    border-color: var(--danger);
    background: color-mix(in srgb, var(--danger) 12%, var(--surface));
  }
  span {
    flex: 1 1 320px;
  }
  button {
    min-height: 40px;
  }
</style>
