import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite'
import { summarize, type CharacterSummary } from '../model/character'
import { normalizeCharacter } from '../model/normalize'
import type { CharacterRepository } from './repository'

const DB_NAME = 'vivrecard'

/**
 * Migrations du schéma SQLite, appliquées dans l'ordre. Ne jamais modifier une migration publiée :
 * en ajouter une nouvelle à la fin.
 */
const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS characters (
     id TEXT PRIMARY KEY NOT NULL,
     nom TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     data TEXT NOT NULL
   );`,
]

async function schemaVersion(db: SQLiteDBConnection): Promise<number> {
  const t = await db.query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'meta'`)
  if (!t.values?.length) return 0
  const r = await db.query(`SELECT value FROM meta WHERE key = 'schema_version'`)
  return r.values?.length ? Number(r.values[0].value) : 0
}

async function migrate(db: SQLiteDBConnection): Promise<void> {
  const from = await schemaVersion(db)
  for (let v = from; v < MIGRATIONS.length; v++) {
    await db.execute(
      `${MIGRATIONS[v]}
       INSERT INTO meta (key, value) VALUES ('schema_version', '${v + 1}')
         ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    )
  }
}

function parse(data: string) {
  const { character, warnings } = normalizeCharacter(JSON.parse(data))
  if (warnings.length) console.warn('[vivrecard] corrections au chargement', warnings)
  return character
}

export async function openSqliteRepository(): Promise<CharacterRepository> {
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  await sqlite.checkConnectionsConsistency()
  const existing = (await sqlite.isConnection(DB_NAME, false)).result
  const db = existing
    ? await sqlite.retrieveConnection(DB_NAME, false)
    : await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)
  await db.open()
  await migrate(db)

  return {
    async list(): Promise<CharacterSummary[]> {
      // Le sous-titre (race · classe) vient du document : quelques fiches par téléphone, le coût est négligeable.
      const r = await db.query(`SELECT data FROM characters ORDER BY updated_at DESC`)
      return (r.values ?? []).map(row => summarize(parse(row.data)))
    },
    async get(id) {
      const r = await db.query(`SELECT data FROM characters WHERE id = ?`, [id])
      return r.values?.length ? parse(r.values[0].data) : null
    },
    async save(c) {
      await db.run(
        `INSERT INTO characters (id, nom, updated_at, data) VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET nom = excluded.nom, updated_at = excluded.updated_at, data = excluded.data`,
        [c.id, c.nom, c.updatedAt, JSON.stringify(c)],
      )
    },
    async remove(id) {
      await db.run(`DELETE FROM characters WHERE id = ?`, [id])
    },
    async getMeta(key) {
      const r = await db.query(`SELECT value FROM meta WHERE key = ?`, [key])
      return r.values?.length ? String(r.values[0].value) : null
    },
    async setMeta(key, value) {
      await db.run(
        `INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, value],
      )
    },
  }
}
