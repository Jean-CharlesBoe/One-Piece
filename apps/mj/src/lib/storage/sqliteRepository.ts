import type { Entity, EntitySummary } from '../model/entity'
import { normalizeEntity } from '../model/normalize'
import { isEntityType, type EntityType } from '../model/types'
import type { Db, Row } from './db'
import { META_LAST_CHANGE, META_SCHEMA_VERSION, META_SEARCH_ENGINE, type MjRepository } from './repository'
import { MIGRATIONS, SEARCH_INDEX_DDL, type SearchEngine } from './schema'

async function schemaVersion(db: Db): Promise<number> {
  const t = await db.query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'meta'`)
  if (!t.length) return 0
  const r = await db.query(`SELECT value FROM meta WHERE key = ?`, [META_SCHEMA_VERSION])
  return r.length ? Number(r[0].value) : 0
}

/** Applique les migrations manquantes ; chacune enregistre son numéro dans la même transaction. */
export async function migrate(db: Db): Promise<void> {
  const from = await schemaVersion(db)
  if (from > MIGRATIONS.length) {
    throw new Error(`Base créée par une version plus récente de l'app (schéma ${from}) : mettre l'app à jour.`)
  }
  for (let v = from; v < MIGRATIONS.length; v++) {
    await db.execute(
      `${MIGRATIONS[v]}
       INSERT INTO meta (key, value) VALUES ('${META_SCHEMA_VERSION}', '${v + 1}')
         ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    )
  }
}

async function tableExists(db: Db, name: string): Promise<boolean> {
  return (await db.query(`SELECT name FROM sqlite_master WHERE name = ?`, [name])).length > 0
}

async function indexEntity(db: Db, engine: SearchEngine, e: Entity): Promise<void> {
  if (engine === 'aucun') return
  await db.run(`DELETE FROM search_index WHERE entity_id = ?`, [e.id])
  if (e.archived) return
  // M2 rendra lisibles les propriétés (relations par leur titre) et dépouillera le Markdown.
  await db.run(
    `INSERT INTO search_index (entity_id, title, aliases, props_text, body_text) VALUES (?, ?, ?, ?, ?)`,
    [e.id, e.title, e.aliases.join(' '), '', e.bodyMd],
  )
}

/**
 * Crée l'index plein texte s'il manque, avec le premier moteur accepté par cette version de SQLite (D-M11),
 * puis le remplit depuis les fiches. Le moteur retenu est noté dans `meta`.
 */
export async function ensureSearchIndex(db: Db): Promise<SearchEngine> {
  if (await tableExists(db, 'search_index')) {
    const r = await db.query(`SELECT value FROM meta WHERE key = ?`, [META_SEARCH_ENGINE])
    return r[0]?.value === 'fts5' ? 'fts5' : 'fts4'
  }
  let engine: SearchEngine = 'aucun'
  for (const e of ['fts5', 'fts4'] as const) {
    try {
      await db.execute(SEARCH_INDEX_DDL[e])
      engine = e
      break
    } catch {
      // moteur absent de cette version de SQLite : essayer le suivant
    }
  }
  await db.run(`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [
    META_SEARCH_ENGINE,
    engine,
  ])
  if (engine !== 'aucun') {
    for (const row of await db.query(`SELECT * FROM entities WHERE archived = 0`)) {
      await indexEntity(db, engine, parse(row))
    }
  }
  return engine
}

function parse(row: Row): Entity {
  const { entity, warnings } = normalizeEntity(row)
  if (warnings.length) console.warn('[onepiece-mj] corrections au chargement', warnings)
  return entity
}

/** Ouvre la base (clés étrangères, migrations, index de recherche) et renvoie le repository. */
export async function createSqliteRepository(db: Db): Promise<MjRepository> {
  await db.pragma(`PRAGMA foreign_keys = ON`)
  await migrate(db)
  const engine = await ensureSearchIndex(db)
  await db.persist()

  async function setMeta(key: string, value: string) {
    await db.run(`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [
      key,
      value,
    ])
  }

  return {
    searchEngine: engine,
    async getMeta(key) {
      const r = await db.query(`SELECT value FROM meta WHERE key = ?`, [key])
      return r.length ? String(r[0].value) : null
    },
    async setMeta(key, value) {
      await setMeta(key, value)
      await db.persist()
    },
    async countByType() {
      const r = await db.query(`SELECT type, COUNT(*) AS n FROM entities WHERE archived = 0 GROUP BY type`)
      const counts: Partial<Record<EntityType, number>> = {}
      for (const row of r) if (isEntityType(row.type)) counts[row.type] = Number(row.n)
      return counts
    },
    async listEntities(type): Promise<EntitySummary[]> {
      const r = await db.query(
        `SELECT id, type, title, pinned, updated_at FROM entities
          WHERE type = ? AND archived = 0 ORDER BY title COLLATE NOCASE`,
        [type],
      )
      return r.map(row => {
        const e = parse(row)
        return { id: e.id, type: e.type, title: e.title, pinned: e.pinned, updatedAt: e.updatedAt }
      })
    },
    async getEntity(id) {
      const r = await db.query(`SELECT * FROM entities WHERE id = ?`, [id])
      return r.length ? parse(r[0]) : null
    },
    async saveEntity(e) {
      await db.run(
        `INSERT INTO entities (id, type, title, aliases, parent_id, sort_order, props, body_md, tags, cover_asset,
                               pinned, archived, notion_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             type = excluded.type, title = excluded.title, aliases = excluded.aliases,
             parent_id = excluded.parent_id, sort_order = excluded.sort_order, props = excluded.props,
             body_md = excluded.body_md, tags = excluded.tags, cover_asset = excluded.cover_asset,
             pinned = excluded.pinned, archived = excluded.archived, notion_id = excluded.notion_id,
             updated_at = excluded.updated_at`,
        [
          e.id,
          e.type,
          e.title,
          JSON.stringify(e.aliases),
          e.parentId,
          e.sortOrder,
          JSON.stringify(e.props),
          e.bodyMd,
          JSON.stringify(e.tags),
          e.coverAsset,
          e.pinned ? 1 : 0,
          e.archived ? 1 : 0,
          e.notionId,
          e.createdAt,
          e.updatedAt,
        ],
      )
      await indexEntity(db, engine, e)
      await setMeta(META_LAST_CHANGE, new Date().toISOString())
      await db.persist()
    },
  }
}
