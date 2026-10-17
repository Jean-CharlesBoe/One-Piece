import { getRepository, dataChanged, META_BACKUP_ID, META_LAST_BACKUP, META_LAST_CHANGE } from '../storage/repository'
import {
  chooseFolder,
  deviceName,
  folderPermission,
  folderSupported,
  readFolderBackup,
  savedFolder,
  writeFolderBackup,
  writeSafetyCopy,
  type DirHandle,
} from './folder'
import { BackupError, makeManifest, packBackup, readBackup, readManifest, type BackupManifest } from './format'
import { changedSince, decideRelay } from './relay'

// Sauvegarde automatique et passage de relais (D-M18, M4).
// La base est écrite dans le dossier choisi 5 s après la dernière modification (et tout de suite quand l'app
// passe en arrière-plan). Avant chaque écriture, l'app vérifie que le dossier contient bien sa propre
// sauvegarde : si l'autre appareil a écrit depuis, elle s'arrête et demande au MJ quelle version garder.

export type BackupStatus =
  /** Navigateur sans accès aux dossiers : sauvegarde par téléchargement seulement. */
  | 'non-supporte'
  | 'sans-dossier'
  /** Chrome demande de réautoriser l'écriture (un clic). */
  | 'autorisation'
  | 'a-jour'
  | 'en-attente'
  | 'ecriture'
  /** Une version plus récente, écrite par l'autre appareil, est dans le dossier. */
  | 'reprendre'
  /** Les deux appareils ont modifié la base : choisir. */
  | 'conflit'
  | 'erreur'

const DELAY = 5000
/** Rappel si la base a changé et n'a pas été sauvegardée depuis 7 jours (ou jamais). */
const REMINDER_DAYS = 7

type Dir = DirHandle

class Backup {
  status = $state<BackupStatus>('sans-dossier')
  folderName = $state<string | null>(null)
  /** Date de la dernière sauvegarde écrite ou reprise. */
  lastAt = $state<string | null>(null)
  /** Sauvegarde trouvée dans le dossier, quand elle n'est pas celle de cet appareil (reprendre, conflit). */
  other = $state<BackupManifest | null>(null)
  error = $state('')
  /** Modifications locales pas encore sauvegardées. */
  changed = $state(false)

  /** À signaler dans l'interface (rappel rouge, bandeau). */
  needsAttention = $derived(
    ['sans-dossier', 'autorisation', 'reprendre', 'conflit', 'erreur'].includes(this.status) ||
      (this.status === 'non-supporte' &&
        this.changed &&
        (!this.lastAt || Date.now() - Date.parse(this.lastAt) > REMINDER_DAYS * 86400000)),
  )

  #dir: Dir | null = null
  #timer: ReturnType<typeof setTimeout> | null = null
  #busy: Promise<void> = Promise.resolve()

  async start(): Promise<void> {
    dataChanged.addEventListener('change', () => this.#onChange())
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void this.flush()
      else void this.check()
    })
    await this.#loadMeta()
    if (!folderSupported()) {
      this.status = 'non-supporte'
      return
    }
    this.#dir = await savedFolder()
    this.folderName = this.#dir?.name ?? null
    if (!this.#dir) {
      this.status = 'sans-dossier'
      return
    }
    if ((await folderPermission(this.#dir)) !== 'granted') {
      this.status = 'autorisation'
      return
    }
    await this.check()
  }

  /** Réautorise l'écriture dans le dossier (depuis un clic). */
  async authorize(): Promise<void> {
    if (!this.#dir) return
    if ((await folderPermission(this.#dir, true)) !== 'granted') return
    this.status = 'en-attente'
    await this.check()
  }

  /** Choisit (ou change) le dossier de sauvegarde (depuis un clic). */
  async choose(): Promise<void> {
    try {
      const dir = await chooseFolder()
      if (!dir) return
      this.#dir = dir
      this.folderName = dir.name
      this.status = 'en-attente'
      await this.check()
    } catch (e) {
      this.#fail(e)
    }
  }

  /** Compare le dossier et la base locale, puis écrit, ne fait rien, ou demande au MJ (relais). */
  check(): Promise<void> {
    return this.#serial(async () => {
      const dir = this.#dir
      if (!dir || this.status === 'autorisation' || this.status === 'non-supporte') return
      try {
        const bytes = await readFolderBackup(dir)
        const folder = bytes ? readManifest(bytes) : null
        const r = await getRepository()
        const syncId = await r.getMeta(META_BACKUP_ID)
        const folderId = folder?.id ?? null
        // Compter les fiches seulement quand la réponse en dépend (dossier vide, ou écrit par un autre appareil).
        const empty = folderId !== null && folderId === syncId ? false : !(await r.listCatalog()).length
        const decision = decideRelay({ folderId, syncId, changed: await this.#changedLocally(), empty })
        this.other = decision === 'reprendre' || decision === 'conflit' ? folder : null
        if (decision === 'ecrire') await this.#write(dir)
        else this.status = decision
      } catch (e) {
        this.#fail(e)
      }
    })
  }

  /** Écrit tout de suite si une sauvegarde est en attente. */
  async flush(): Promise<void> {
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = null
    if (this.status === 'en-attente') await this.check()
  }

  /** « Sauvegarder maintenant » : dans le dossier, ou par téléchargement sans dossier. */
  async saveNow(): Promise<void> {
    if (this.#dir && this.status !== 'autorisation') await this.check()
    else await this.download()
  }

  /** Conflit : garder la base de cet appareil ; la sauvegarde de l'autre appareil est d'abord copiée dans historique/. */
  keepLocal(): Promise<void> {
    return this.#serial(async () => {
      const dir = this.#dir
      if (!dir) return
      try {
        const theirs = await readFolderBackup(dir)
        if (theirs) await writeSafetyCopy(dir, theirs, 'remplacee', readManifest(theirs).device)
      } catch (e) {
        this.#fail(e)
        return
      }
      await this.#write(dir)
    })
  }

  /** Reprendre la sauvegarde du dossier (écrite par l'autre appareil). Recharge l'app. */
  takeFolder(): Promise<void> {
    return this.#serial(async () => {
      const dir = this.#dir
      if (!dir) return
      try {
        const bytes = await readFolderBackup(dir)
        if (!bytes) throw new BackupError('La sauvegarde du dossier a disparu.')
        await this.#replaceLocal(readBackup(bytes), dir)
      } catch (e) {
        this.#fail(e)
      }
    })
  }

  /** Restaure un fichier .opmj choisi par le MJ ; il devient la référence (écrit aussi dans le dossier). Recharge l'app. */
  async restoreFile(file: File): Promise<void> {
    const backup = readBackup(new Uint8Array(await file.arrayBuffer()))
    await this.#serial(async () => {
      await this.#replaceLocal(backup, this.status === 'autorisation' ? null : this.#dir, true)
    })
  }

  /** Lit un fichier pour confirmation avant restauration (nombre de fiches, date, appareil). */
  async inspectFile(file: File): Promise<BackupManifest> {
    return readBackup(new Uint8Array(await file.arrayBuffer())).manifest
  }

  /** Télécharge une sauvegarde (navigateur sans dossier, ou à la demande). */
  async download(): Promise<void> {
    const { bytes } = await this.#pack()
    const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/zip' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `onepiece-mj-${new Date().toISOString().slice(0, 10)}.opmj`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
    if (this.status === 'non-supporte') {
      const r = await getRepository()
      const now = new Date().toISOString()
      await r.setMeta(META_LAST_BACKUP, now)
      this.lastAt = now
      this.changed = false
    }
  }

  #onChange(): void {
    this.changed = true
    if (!['a-jour', 'en-attente', 'erreur'].includes(this.status)) return
    this.status = 'en-attente'
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = setTimeout(() => void this.flush(), DELAY)
  }

  async #pack(): Promise<{ manifest: BackupManifest; bytes: Uint8Array }> {
    const r = await getRepository()
    const data = await r.exportData()
    const manifest = makeManifest(data, {
      lastChangeAt: await r.getMeta(META_LAST_CHANGE),
      appVersion: __APP_VERSION__,
      device: deviceName(),
    })
    return { manifest, bytes: packBackup(manifest, data) }
  }

  /** Écrit la base dans le dossier et retient l'identifiant de cette sauvegarde. */
  async #write(dir: Dir): Promise<void> {
    this.status = 'ecriture'
    try {
      const { manifest, bytes } = await this.#pack()
      await writeFolderBackup(dir, bytes)
      await this.#remember(manifest.id)
      this.other = null
      this.status = 'a-jour'
    } catch (e) {
      this.#fail(e)
    }
  }

  /** Remplace la base locale ; une copie de sécurité de l'ancienne va dans historique/ (ou est téléchargée). */
  async #replaceLocal(backup: ReturnType<typeof readBackup>, dir: Dir | null, writeBack = false): Promise<void> {
    const r = await getRepository()
    const current = await this.#pack()
    if (current.manifest.counts.entities) {
      if (dir) await writeSafetyCopy(dir, current.bytes, 'avant-restauration', deviceName())
      else await this.download()
    }
    await r.importData(backup.data)
    if (writeBack && dir) {
      const { manifest, bytes } = await this.#pack()
      await writeFolderBackup(dir, bytes)
      await this.#remember(manifest.id)
    } else {
      await this.#remember(backup.manifest.id)
    }
    location.reload()
  }

  async #remember(id: string): Promise<void> {
    const r = await getRepository()
    const now = new Date().toISOString()
    await r.setMeta(META_BACKUP_ID, id)
    await r.setMeta(META_LAST_BACKUP, now)
    this.lastAt = now
    this.changed = false
  }

  async #changedLocally(): Promise<boolean> {
    const r = await getRepository()
    return changedSince(await r.getMeta(META_LAST_CHANGE), await r.getMeta(META_LAST_BACKUP))
  }

  async #loadMeta(): Promise<void> {
    const r = await getRepository()
    this.lastAt = await r.getMeta(META_LAST_BACKUP)
    this.changed = await this.#changedLocally()
  }

  #fail(e: unknown): void {
    this.status = 'erreur'
    this.error = e instanceof Error ? e.message : String(e)
    console.error('[onepiece-mj] sauvegarde', e)
  }

  /** Une opération de sauvegarde à la fois. */
  #serial(run: () => Promise<void>): Promise<void> {
    this.#busy = this.#busy.then(run, run)
    return this.#busy
  }
}

export const backup = new Backup()
