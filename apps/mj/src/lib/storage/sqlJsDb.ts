import type { Database } from 'sql.js'
import type { Db, Row } from './db'

/**
 * Accès SQL sur une base sql.js (SQLite compilé en WebAssembly, en mémoire) : repli web de développement
 * et tests. `persist` reçoit le contenu de la base après chaque écriture validée.
 */
export function sqlJsDb(db: Database, persist: (data: Uint8Array) => Promise<void> = async () => {}): Db {
  return {
    async query(sql, params = []) {
      const st = db.prepare(sql)
      try {
        st.bind(params)
        const rows: Row[] = []
        while (st.step()) rows.push(st.getAsObject())
        return rows
      } finally {
        st.free()
      }
    },
    async run(sql, params = []) {
      db.run(sql, params)
    },
    async execute(sql) {
      db.exec('BEGIN')
      try {
        db.exec(sql)
        db.exec('COMMIT')
      } catch (e) {
        db.exec('ROLLBACK')
        throw e
      }
    },
    async pragma(sql) {
      db.exec(sql)
    },
    async persist() {
      // export() ferme et rouvre la base : les PRAGMA reviennent à leur valeur par défaut.
      const data = db.export()
      db.exec('PRAGMA foreign_keys = ON')
      await persist(data)
    },
  }
}
