import initSqlJs, { type Database } from 'sql.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { createEntity } from '../model/entity'
import type { Db, Row } from './db'
import { META_SCHEMA_VERSION, META_SEARCH_ENGINE } from './repository'
import { MIGRATIONS } from './schema'
import { createSqliteRepository, migrate } from './sqliteRepository'

// Même SQL que sur l'appareil, exécuté par sql.js (le moteur du repli web : FTS4 sans FTS5).
const SQL = await initSqlJs()

function sqlJsDb(db: Database): Db {
  return {
    async query(sql, params = []) {
      const st = db.prepare(sql)
      st.bind(params)
      const rows: Row[] = []
      while (st.step()) rows.push(st.getAsObject())
      st.free()
      return rows
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
    async persist() {},
  }
}

let raw: Database
let db: Db
beforeEach(() => {
  raw = new SQL.Database()
  db = sqlJsDb(raw)
})

describe('base MJ', () => {
  it('migration 1 sur une base vide : toutes les tables, version notée', async () => {
    const repo = await createSqliteRepository(db)
    const tables = (await db.query(`SELECT name FROM sqlite_master WHERE type = 'table'`)).map(r => r.name)
    for (const t of ['meta', 'entities', 'links', 'assets', 'campaigns', 'sessions', 'journal_entries', 'not_duplicates']) {
      expect(tables).toContain(t)
    }
    expect(await repo.getMeta(META_SCHEMA_VERSION)).toBe(String(MIGRATIONS.length))
  })

  it('rouvrir ne rejoue rien et garde les données', async () => {
    const repo = await createSqliteRepository(db)
    await repo.saveEntity(createEntity('lieu', 'Île du Sud'))
    const again = await createSqliteRepository(db)
    expect(await again.listEntities('lieu')).toHaveLength(1)
  })

  it('refuse une base plus récente que l’app', async () => {
    await migrate(db)
    await db.run(`UPDATE meta SET value = '99' WHERE key = ?`, [META_SCHEMA_VERSION])
    await expect(migrate(db)).rejects.toThrow(/plus récente/)
  })

  it('clés étrangères actives', async () => {
    await createSqliteRepository(db)
    expect(() =>
      raw.run(`INSERT INTO links (from_kind, from_id, to_id, kind) VALUES ('entity', 'a', 'inexistante', 'mention')`),
    ).toThrow(/FOREIGN KEY/)
  })

  it('index de recherche : FTS4 retenu quand FTS5 manque, insensible aux accents', async () => {
    const repo = await createSqliteRepository(db)
    expect(repo.searchEngine).toBe('fts4')
    expect(await repo.getMeta(META_SEARCH_ENGINE)).toBe('fts4')
    const e = createEntity('race', 'Skypiéens')
    e.aliases = ['Anges']
    await repo.saveEntity(e)
    const hit = (q: string) => db.query(`SELECT entity_id FROM search_index WHERE search_index MATCH ?`, [q])
    expect(await hit('skypieens')).toEqual([{ entity_id: e.id }])
    expect(await hit('anges')).toHaveLength(1)
    e.archived = true
    await repo.saveEntity(e)
    expect(await hit('anges')).toHaveLength(0)
  })

  it('index reconstruit depuis les fiches s’il a disparu', async () => {
    const repo = await createSqliteRepository(db)
    await repo.saveEntity(createEntity('personnage', 'Drake'))
    raw.run(`DROP TABLE search_index`)
    await createSqliteRepository(db)
    expect(await db.query(`SELECT entity_id FROM search_index WHERE search_index MATCH 'drake'`)).toHaveLength(1)
  })

  it('fiches : aller-retour, liste par type, compteurs, archives exclues', async () => {
    const repo = await createSqliteRepository(db)
    const drake = createEntity('personnage', 'Drake')
    drake.aliases = ['Capitaine Drake']
    drake.props = { role: 'PNJ' }
    drake.pinned = true
    await repo.saveEntity(drake)
    await repo.saveEntity(createEntity('personnage', 'alvida'))
    const vieux = createEntity('personnage', 'Oublié')
    vieux.archived = true
    await repo.saveEntity(vieux)
    await repo.saveEntity(createEntity('lieu', 'Loguetown'))

    expect(await repo.getEntity(drake.id)).toEqual(drake)
    expect((await repo.listEntities('personnage')).map(e => e.title)).toEqual(['alvida', 'Drake'])
    expect(await repo.countByType()).toEqual({ personnage: 2, lieu: 1 })
    expect(await repo.getEntity('inconnue')).toBeNull()

    drake.title = 'Drake le Rouge'
    await repo.saveEntity(drake)
    expect((await repo.getEntity(drake.id))?.title).toBe('Drake le Rouge')
  })

  it('réglages (meta)', async () => {
    const repo = await createSqliteRepository(db)
    expect(await repo.getMeta('theme')).toBeNull()
    await repo.setMeta('theme', 'sombre')
    await repo.setMeta('theme', 'clair')
    expect(await repo.getMeta('theme')).toBe('clair')
  })
})
