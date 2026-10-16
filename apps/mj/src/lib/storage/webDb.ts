import initSqlJs from 'sql.js'
import type { Db } from './db'
import { sqlJsDb } from './sqlJsDb'

/**
 * Repli web de développement (`npm run dev:mj`, D-T3) : SQLite en WebAssembly (sql.js), même SQL que sur
 * l'appareil, base gardée dans IndexedDB après chaque écriture. Le fichier sql-wasm.wasm est servi par le
 * serveur de dev (vite.config.ts) : il n'entre jamais dans le build ni dans l'APK.
 */
const IDB = 'onepiece-mj-dev'
const STORE = 'bases'

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function load(name: string): Promise<Uint8Array | undefined> {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(name)
    req.onsuccess = () => resolve(req.result as Uint8Array | undefined)
    req.onerror = () => reject(req.error)
  })
}

async function store(name: string, data: Uint8Array): Promise<void> {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(data, name)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function openWebDb(name: string): Promise<Db> {
  const SQL = await initSqlJs({ locateFile: file => `/assets/${file}` })
  const db = new SQL.Database(await load(name))
  return sqlJsDb(db, data => store(name, data))
}
