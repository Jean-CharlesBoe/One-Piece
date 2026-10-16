import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
import type { Db } from './db'

/**
 * Ouvre la base par le plugin @capacitor-community/sqlite.
 * `web` : implémentation navigateur du plugin (jeep-sqlite, moteur sql.js, base gardée dans IndexedDB),
 * réservée au développement (`npm run dev:mj`, D-T3). Le fichier sql-wasm.wasm est servi par le serveur
 * de dev (vite.config.ts).
 */
export async function openCapacitorDb(name: string, web: boolean): Promise<Db> {
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  if (web) {
    const { defineCustomElements } = await import('jeep-sqlite/loader')
    await defineCustomElements(window)
    if (!document.querySelector('jeep-sqlite')) document.body.appendChild(document.createElement('jeep-sqlite'))
    await customElements.whenDefined('jeep-sqlite')
    await sqlite.initWebStore()
  }
  await sqlite.checkConnectionsConsistency()
  const existing = (await sqlite.isConnection(name, false)).result
  const conn = existing
    ? await sqlite.retrieveConnection(name, false)
    : await sqlite.createConnection(name, false, 'no-encryption', 1, false)
  await conn.open()

  return {
    async query(sql, params = []) {
      return (await conn.query(sql, params)).values ?? []
    },
    async run(sql, params = []) {
      await conn.run(sql, params, false)
    },
    async execute(sql) {
      await conn.execute(sql, true)
    },
    async pragma(sql) {
      await conn.execute(sql, false)
    },
    async persist() {
      if (web) await sqlite.saveToStore(name)
    },
  }
}
