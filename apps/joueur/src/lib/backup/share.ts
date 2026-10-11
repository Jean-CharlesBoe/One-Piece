import { Capacitor } from '@capacitor/core'

/**
 * Propose un fichier texte à l'utilisateur : feuille de partage Android (Drive, mail, WhatsApp…)
 * ou téléchargement dans le navigateur. Renvoie false si l'utilisateur a annulé le partage.
 */
export async function offerFile(fileName: string, content: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  }
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  const { uri } = await Filesystem.writeFile({
    path: fileName,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  try {
    await Share.share({ title: 'Sauvegarde Vivre Card', files: [uri] })
    return true
  } catch (e) {
    // Le plugin rejette quand l'utilisateur ferme la feuille de partage sans choisir.
    if (e instanceof Error && /cancel/i.test(e.message)) return false
    throw e
  }
}
