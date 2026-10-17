import initSqlJs from 'sql.js'
// Moteur SQLite de sql.js : ressource du build (servie avec l'app, mise en cache pour le hors ligne).
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url'
import type { Db } from './db'
import { sqlJsDb } from './sqlJsDb'

/**
 * Base de l'appli MJ (D-M18) : SQLite en WebAssembly (sql.js), gardée dans IndexedDB après chaque écriture.
 * Le stockage est demandé « persistant » au démarrage (pwa.svelte.ts) pour que le navigateur ne le libère pas.
 * En développement, la base vit dans le stockage de localhost:5184, séparé de celui de l'app publiée.
 */
const IDB = 'onepiece-mj'
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
  const SQL = await initSqlJs({ locateFile: () => wasmUrl })
  const db = new SQL.Database(await load(name))
  return sqlJsDb(db, data => store(name, data))
}
