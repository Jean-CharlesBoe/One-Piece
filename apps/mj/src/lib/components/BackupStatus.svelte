<script lang="ts">
  import { backup } from '../backup/sync.svelte'

  // Une ligne d'état de la sauvegarde (barre latérale, réglages). `compact` : version courte.
  let { compact = false }: { compact?: boolean } = $props()

  const time = (iso: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    const today = d.toDateString() === new Date().toDateString()
    return today
      ? `à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      : `le ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
  }

  const text = $derived.by(() => {
    switch (backup.status) {
      case 'a-jour':
        return `✓ Sauvegardé ${time(backup.lastAt)}`
      case 'en-attente':
      case 'ecriture':
        return 'Sauvegarde en cours…'
      case 'autorisation':
        return compact ? '⚠ Sauvegarde à autoriser' : '⚠ Chrome demande de réautoriser le dossier.'
      case 'sans-dossier':
        return compact ? '⚠ Aucune sauvegarde' : '⚠ Aucun dossier de sauvegarde choisi.'
      case 'reprendre':
        return compact ? '⚠ Version plus récente à reprendre' : `⚠ Une version plus récente est dans le dossier (${backup.other?.device ?? 'autre appareil'}).`
      case 'conflit':
        return compact ? '⚠ Deux versions à départager' : '⚠ Les deux appareils ont modifié la base.'
      case 'erreur':
        return compact ? '⚠ Erreur de sauvegarde' : `⚠ Erreur de sauvegarde : ${backup.error}`
      case 'non-supporte':
        return backup.lastAt ? `Dernière copie téléchargée ${time(backup.lastAt)}` : '⚠ Aucune copie téléchargée'
    }
  })
</script>

<p class="status" class:warn={backup.needsAttention} class:compact role="status">{text}</p>

<style>
  .status {
    margin: 6px 0 0;
  }
  .status.compact {
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted);
  }
  .status.warn {
    color: var(--danger);
    font-weight: 600;
  }
</style>
