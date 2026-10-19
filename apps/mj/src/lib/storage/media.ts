/**
 * Fichiers des médias sur l'appareil (D-M18, M6) : IndexedDB, à côté de la base mais hors d'elle (la base
 * sql.js est réécrite en entier à chaque modification ; des dizaines de Mo de PDF n'ont rien à y faire).
 * Clé : `assets.file_name`. Le stockage est « persistant » (pwa.svelte.ts).
 */
const IDB = 'onepiece-mj-medias'
const STORE = 'fichiers'

let opening: Promise<IDBDatabase> | null = null

function idb(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return opening
}

async function request<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = run(tx.objectStore(STORE))
    let result: T
    req.onsuccess = () => (result = req.result)
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

/** Prévient quand un fichier arrive sur l'appareil (l'interface réaffiche les images manquantes). */
export const mediaChanged = new EventTarget()

export async function putMedia(fileName: string, data: Blob): Promise<void> {
  await request('readwrite', s => s.put(data, fileName))
  mediaChanged.dispatchEvent(new Event('change'))
}

export async function getMedia(fileName: string): Promise<Blob | null> {
  const v = (await request('readonly', s => s.get(fileName))) as Blob | Uint8Array | undefined
  if (!v) return null
  return v instanceof Blob ? v : new Blob([v as Uint8Array<ArrayBuffer>])
}

/** Noms des fichiers présents sur l'appareil. */
export async function mediaNames(): Promise<Set<string>> {
  return new Set(((await request('readonly', s => s.getAllKeys())) as IDBValidKey[]).map(String))
}
