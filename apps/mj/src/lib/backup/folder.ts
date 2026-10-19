import { BACKUP_FILE } from './format'
import { historyName, historyToPrune } from './relay'

// Dossier de sauvegarde (D-M18) : un dossier choisi une fois (dans Google Drive), où l'app écrit ses sauvegardes
// (onepiece-mj.opmj, copies quotidiennes dans historique/) et qui sert de relais entre le PC et le Chromebook.
// API « File System Access » de Chrome (non typée en entier par TypeScript : déclarations minimales ci-dessous).

type Permission = 'granted' | 'denied' | 'prompt'

export interface DirHandle extends FileSystemDirectoryHandle {
  queryPermission(o: { mode: 'readwrite' }): Promise<Permission>
  requestPermission(o: { mode: 'readwrite' }): Promise<Permission>
}

declare global {
  interface Window {
    showDirectoryPicker?: (o?: { id?: string; mode?: 'read' | 'readwrite'; startIn?: string }) => Promise<DirHandle>
  }
}

export const folderSupported = (): boolean => typeof window.showDirectoryPicker === 'function'

// Le dossier choisi est gardé dans IndexedDB (l'objet « handle » n'est pas sérialisable autrement).
const IDB = 'onepiece-mj-dossier'
const STORE = 'dossiers'
const KEY = 'sauvegarde'

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function savedFolder(): Promise<DirHandle | null> {
  return ((await tx('readonly', s => s.get(KEY))) as DirHandle | undefined) ?? null
}

/** Ouvre le sélecteur de dossiers (à appeler depuis un clic). */
export async function chooseFolder(): Promise<DirHandle | null> {
  if (!window.showDirectoryPicker) return null
  try {
    const dir = await window.showDirectoryPicker({ id: 'onepiece-mj', mode: 'readwrite', startIn: 'documents' })
    await tx('readwrite', s => s.put(dir, KEY))
    return dir
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return null
    throw e
  }
}

/** Autorisation d'écrire ; `ask` (depuis un clic) la redemande si besoin. Chrome la redemande à chaque lancement. */
export async function folderPermission(dir: DirHandle, ask = false): Promise<Permission> {
  const p = await dir.queryPermission({ mode: 'readwrite' })
  return p === 'prompt' && ask ? dir.requestPermission({ mode: 'readwrite' }) : p
}

/** Nom lisible de l'appareil, écrit dans le fichier de test. */
export function deviceName(): string {
  const ua = navigator.userAgent
  return /CrOS/.test(ua) ? 'Chromebook' : /Windows/.test(ua) ? 'PC Windows' : /Mac OS/.test(ua) ? 'Mac' : /Android/.test(ua) ? 'Android' : 'autre appareil'
}

const HISTORY_DIR = 'historique'
/** Copies quotidiennes gardées dans historique/ (les copies « avant restauration » ne sont jamais supprimées). */
const HISTORY_KEEP = 10

async function readFile(dir: FileSystemDirectoryHandle, name: string): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await (await (await dir.getFileHandle(name)).getFile()).arrayBuffer())
  } catch (e) {
    if (e instanceof DOMException && e.name === 'NotFoundError') return null
    throw e
  }
}

async function writeFile(dir: FileSystemDirectoryHandle, name: string, bytes: Uint8Array): Promise<void> {
  // createWritable écrit dans un fichier temporaire et remplace l'ancien à la fermeture : jamais de fichier à moitié écrit.
  const w = await (await dir.getFileHandle(name, { create: true })).createWritable()
  await w.write(bytes as Uint8Array<ArrayBuffer>)
  await w.close()
}

/** Sauvegarde présente dans le dossier (null : aucune). */
export const readFolderBackup = (dir: FileSystemDirectoryHandle) => readFile(dir, BACKUP_FILE)

/** Écrit la sauvegarde dans le dossier, plus la copie du jour dans historique/ (les plus anciennes supprimées). */
export async function writeFolderBackup(dir: FileSystemDirectoryHandle, bytes: Uint8Array): Promise<void> {
  await writeFile(dir, BACKUP_FILE, bytes)
  const hist = await dir.getDirectoryHandle(HISTORY_DIR, { create: true })
  await writeFile(hist, historyName(new Date()), bytes)
  const names: string[] = []
  for await (const name of (hist as unknown as { keys(): AsyncIterable<string> }).keys()) names.push(name)
  for (const old of historyToPrune(names, HISTORY_KEEP)) await hist.removeEntry(old)
}

// Médias (D-M23) : un fichier par média dans medias/, écrit une fois (un média ne change jamais), jamais supprimé
// automatiquement. La sauvegarde onepiece-mj.opmj reste légère : seulement la base.
const MEDIA_DIR = 'medias'

async function mediaDir(dir: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle> {
  return dir.getDirectoryHandle(MEDIA_DIR, { create: true })
}

/** Noms des fichiers de medias/. */
export async function folderMediaNames(dir: FileSystemDirectoryHandle): Promise<Set<string>> {
  const names = new Set<string>()
  for await (const name of ((await mediaDir(dir)) as unknown as { keys(): AsyncIterable<string> }).keys()) names.add(name)
  return names
}

export async function readFolderMedia(dir: FileSystemDirectoryHandle, name: string): Promise<Uint8Array | null> {
  return readFile(await mediaDir(dir), name)
}

export async function writeFolderMedia(dir: FileSystemDirectoryHandle, name: string, data: Blob | Uint8Array): Promise<void> {
  await writeFile(await mediaDir(dir), name, data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data)
}

/**
 * Copie de sécurité dans historique/, jamais supprimée automatiquement, avant qu'une version soit remplacée :
 * la base de cet appareil avant une restauration (« avant-restauration-PC-Windows-2026-10-17-13h00.opmj »),
 * ou la sauvegarde de l'autre appareil quand le MJ garde celle-ci (« remplacee-Chromebook-…opmj »).
 */
export async function writeSafetyCopy(
  dir: FileSystemDirectoryHandle,
  bytes: Uint8Array,
  kind: 'avant-restauration' | 'remplacee',
  device: string,
): Promise<string> {
  const hist = await dir.getDirectoryHandle(HISTORY_DIR, { create: true })
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  // Heure locale.
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}h${p(d.getMinutes())}`
  const name = `${kind}-${device.replace(/[^\p{L}\p{N}]+/gu, '-')}-${stamp}.opmj`
  await writeFile(hist, name, bytes)
  return name
}
