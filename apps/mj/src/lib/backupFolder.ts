// Dossier de sauvegarde (D-M18) : un dossier choisi une fois (dans Google Drive), où l'app écrit ses sauvegardes
// et qui sert de relais entre le PC et le Chromebook. M1 : choix du dossier et test d'écriture ; M4 : sauvegardes.
// API « File System Access » de Chrome (non typée en entier par TypeScript : déclarations minimales ci-dessous).

type Permission = 'granted' | 'denied' | 'prompt'

interface DirHandle extends FileSystemDirectoryHandle {
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

const TEST_FILE = 'onepiece-mj-test.txt'

export interface FolderTest {
  /** Contenu trouvé avant d'écrire (écrit par l'autre appareil lors de son test, ou null). */
  previous: string | null
  written: string
  /** Relu après écriture, identique à `written` si tout va bien. */
  readBack: string
}

/** Écrit un petit fichier dans le dossier, le relit, et rapporte ce qu'il contenait avant (relais entre appareils). */
export async function testFolder(dir: DirHandle): Promise<FolderTest> {
  let previous: string | null = null
  try {
    previous = await (await (await dir.getFileHandle(TEST_FILE)).getFile()).text()
  } catch {
    previous = null
  }
  const written = `Test d'écriture de l'appli One Piece (MJ) — ${deviceName()} — ${new Date().toLocaleString('fr-FR')}`
  const file = await dir.getFileHandle(TEST_FILE, { create: true })
  const w = await file.createWritable()
  await w.write(written)
  await w.close()
  const readBack = await (await file.getFile()).text()
  return { previous, written, readBack }
}
