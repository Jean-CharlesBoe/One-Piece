<script lang="ts">
  import type { BackupManifest } from '../backup/format'
  import { backup } from '../backup/sync.svelte'
  import BackupStatus from './BackupStatus.svelte'

  // Section « Sauvegarde » des réglages (M4, D-M18) : dossier Google Drive, sauvegarde à la demande,
  // copie téléchargée, restauration d'un fichier .opmj (sauvegarde ou import Notion) avec confirmation.
  let input = $state<HTMLInputElement | null>(null)
  let pending = $state<{ file: File; manifest: BackupManifest } | null>(null)
  let error = $state('')
  let busy = $state(false)

  async function pick(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0]
    ;(e.currentTarget as HTMLInputElement).value = ''
    if (!file) return
    error = ''
    try {
      pending = { file, manifest: await backup.inspectFile(file) }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    }
  }

  async function restore() {
    if (!pending) return
    busy = true
    try {
      await backup.restoreFile(pending.file)
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
      busy = false
    }
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<section class="card" aria-labelledby="sauvegarde-titre">
  <h2 class="label" id="sauvegarde-titre">Sauvegarde</h2>
  <BackupStatus />

  {#if backup.status !== 'non-supporte'}
    <p>Dossier : <b>{backup.folderName ?? 'aucun'}</b></p>
    <p class="muted">
      Un dossier dans Google Drive, le même sur le PC et le Chromebook : la base y est sauvegardée automatiquement
      (une copie par jour dans « historique ») et passe d'un appareil à l'autre.
    </p>
  {:else}
    <p class="muted">Ce navigateur ne permet pas d'écrire dans un dossier : télécharge une sauvegarde régulièrement.</p>
  {/if}

  <div class="row">
    {#if backup.status !== 'non-supporte'}
      <button onclick={() => backup.choose()}>{backup.folderName ? 'Changer de dossier…' : 'Choisir le dossier…'}</button>
    {/if}
    {#if backup.status === 'autorisation'}
      <button class="primary" onclick={() => backup.authorize()}>Autoriser l'écriture</button>
    {:else if backup.folderName}
      <button onclick={() => backup.saveNow()}>Sauvegarder maintenant</button>
    {/if}
    <button onclick={() => backup.download()}>Télécharger une copie</button>
    <button onclick={() => input?.click()}>Restaurer un fichier…</button>
    <input bind:this={input} type="file" accept=".opmj,application/zip" hidden onchange={pick} />
  </div>

  {#if pending}
    <div class="confirm" role="alertdialog" aria-labelledby="restaurer-titre">
      <p id="restaurer-titre">
        <b>Remplacer toute la base</b> par « {pending.file.name} » ?<br />
        {pending.manifest.counts.entities ?? 0} fiches · enregistrée le {fmt(pending.manifest.exportedAt)} sur {pending.manifest.device}.
      </p>
      <p class="muted">
        La base actuelle est d'abord copiée dans le dossier (historique) ou téléchargée. Le fichier restauré devient la
        référence pour les deux appareils.
      </p>
      <div class="row">
        <button class="danger" disabled={busy} onclick={restore}>Remplacer la base</button>
        <button disabled={busy} onclick={() => (pending = null)}>Annuler</button>
      </div>
    </div>
  {/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</section>

<style>
  h2 {
    margin: 0;
  }
  p {
    margin: 6px 0 0;
  }
  .muted {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
  .confirm {
    margin-top: 12px;
    padding: 10px;
    border: 1px solid var(--danger);
    border-radius: var(--radius);
  }
  .error {
    color: var(--danger);
  }
</style>
