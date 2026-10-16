import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
import type { Db } from './db'

/** Ouvre la base SQLite native de l'appareil par le plugin @capacitor-community/sqlite. */
export async function openCapacitorDb(name: string): Promise<Db> {
  const sqlite = new SQLiteConnection(CapacitorSQLite)
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
      // Base native : chaque écriture est déjà sur disque.
    },
  }
}
