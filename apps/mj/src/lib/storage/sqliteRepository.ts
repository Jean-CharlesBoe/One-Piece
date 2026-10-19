import { RAW_TABLES, TABLE_COLUMNS, type BackupData, type RawRow } from '../backup/format'
import { assetRow, normalizeAsset } from '../model/asset'
import { toCatalogEntry, type CatalogEntry, type Entity } from '../model/entity'
import { computeLinks, plainText } from '../model/links'
import { normalizeEntity } from '../model/normalize'
import { displayValue, relationIds } from '../model/props'
import { ftsQuery, MARK_END, MARK_START, searchWords, snippetHtml, type SearchHit } from '../model/search'
import { TYPE_DEFS } from '../model/types'
import type { Db, Row } from './db'
import {
  META_LAST_CHANGE,
  META_SCHEMA_VERSION,
  META_SEARCH_ENGINE,
  type Backlink,
  type MjRepository,
} from './repository'
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

/** Valeurs lisibles des propriétés, pour la recherche : relations par le titre des fiches liées. */
async function propsText(db: Db, e: Entity): Promise<string> {
  const ids = TYPE_DEFS[e.type].fields.flatMap(f => (f.field.kind === 'relation' ? relationIds(e.props[f.key]) : []))
  const titles = new Map<string, string>()
  if (ids.length) {
    const r = await db.query(`SELECT id, title FROM entities WHERE id IN (${ids.map(() => '?').join(', ')})`, ids)
    for (const row of r) titles.set(String(row.id), String(row.title))
  }
  return TYPE_DEFS[e.type].fields
    .filter(f => f.field.kind !== 'gameBlock' && f.field.kind !== 'asset')
    .map(f => displayValue(f, e.props[f.key], id => titles.get(id) ?? ''))
    .filter(Boolean)
    .join(' · ')
}

async function indexEntity(db: Db, engine: SearchEngine, e: Entity): Promise<void> {
  if (engine === 'aucun') return
  await db.run(`DELETE FROM search_index WHERE entity_id = ?`, [e.id])
  if (e.archived) return
  await db.run(
    `INSERT INTO search_index (entity_id, title, aliases, props_text, body_text) VALUES (?, ?, ?, ?, ?)`,
    [e.id, e.title, e.aliases.join(' · '), await propsText(db, e), plainText(e.bodyMd)],
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

/**
 * Ouvre la base (clés étrangères, migrations, index de recherche) et renvoie le repository.
 * `onChange` est appelé après chaque modification des données (sauvegarde automatique, D-M18).
 */
export async function createSqliteRepository(db: Db, onChange: () => void = () => {}): Promise<MjRepository> {
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

  /** Note la date de la modification, l'enregistre et prévient (sauvegarde automatique). */
  async function touch() {
    await setMeta(META_LAST_CHANGE, new Date().toISOString())
    await db.persist()
    onChange()
  }

  async function upsertEntity(e: Entity) {
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
  }

  async function insertRow(table: string, cols: readonly string[], row: RawRow) {
    await db.run(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      cols.map(c => row[c] ?? null),
    )
  }

  /** Table links dérivée de la fiche : relations et mentions vers des fiches existantes. */
  async function writeLinks(e: Entity) {
    await db.run(`DELETE FROM links WHERE from_kind = 'entity' AND from_id = ?`, [e.id])
    for (const l of computeLinks(e)) {
      await db.run(
        `INSERT INTO links (from_kind, from_id, to_id, kind)
           SELECT 'entity', ?, ?, ? WHERE EXISTS (SELECT 1 FROM entities WHERE id = ?)`,
        [e.id, l.toId, l.kind, l.toId],
      )
    }
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
    async listCatalog(): Promise<CatalogEntry[]> {
      const r = await db.query(
        `SELECT id, type, title, aliases, parent_id, props, pinned, archived, updated_at FROM entities
          ORDER BY title COLLATE NOCASE`,
      )
      return r.map(row => toCatalogEntry(parse(row)))
    },
    async getEntity(id) {
      const r = await db.query(`SELECT * FROM entities WHERE id = ?`, [id])
      return r.length ? parse(r[0]) : null
    },
    async saveEntity(e) {
      await upsertEntity(e)
      await writeLinks(e)
      await indexEntity(db, engine, e)
      await touch()
    },
    async search(query, limit = 60): Promise<SearchHit[]> {
      const match = ftsQuery(query)
      if (!match) return []
      if (engine === 'aucun') {
        // Sans index plein texte : titre ou texte qui contient chaque mot (sans tenir compte des accents).
        const words = searchWords(query)
        const r = await db.query(`SELECT id, title, aliases, body_md FROM entities WHERE archived = 0`)
        return r
          .filter(row => {
            const text = plainText(`${String(row.title)} ${String(row.aliases)} ${String(row.body_md)}`)
              .normalize('NFD')
              .replace(/\p{M}/gu, '')
              .toLowerCase()
            return words.every(w => text.includes(w))
          })
          .slice(0, limit)
          .map(row => ({ id: String(row.id), snippet: '' }))
      }
      // Extrait du texte de la fiche (colonne 4, body_text) autour des mots trouvés ; un mot trouvé seulement dans
      // le titre, un alias ou une propriété se voit déjà dans la ligne du résultat (pas d'extrait).
      // FTS4 : snippet(table, début, fin, ellipse, colonne, mots) ; FTS5 : snippet(table, colonne, début, fin, ellipse, mots).
      const snippet =
        engine === 'fts5'
          ? `snippet(search_index, 4, char(1), char(2), '…', 12)`
          : `snippet(search_index, char(1), char(2), '…', 4, 12)`
      const r = await db.query(
        `SELECT entity_id, ${snippet} AS snip FROM search_index WHERE search_index MATCH ? LIMIT ?`,
        [match, limit],
      )
      return r.map(row => {
        const snip = String(row.snip ?? '')
        return { id: String(row.entity_id), snippet: snip.includes(MARK_START) || snip.includes(MARK_END) ? snippetHtml(snip) : '' }
      })
    },
    async backlinks(id): Promise<Backlink[]> {
      const r = await db.query(
        `SELECT from_id, kind FROM links WHERE to_id = ? AND from_kind = 'entity' ORDER BY kind`,
        [id],
      )
      return r.map(row => ({ fromId: String(row.from_id), kind: String(row.kind) }))
    },
    async deleteEntity(id) {
      // Liens entrants, paires « pas des doublons » : supprimés par les clés étrangères (ON DELETE CASCADE) ;
      // pages enfants : rattachées à la racine (ON DELETE SET NULL).
      await db.run(`DELETE FROM links WHERE from_kind = 'entity' AND from_id = ?`, [id])
      if (engine !== 'aucun') await db.run(`DELETE FROM search_index WHERE entity_id = ?`, [id])
      await db.run(`DELETE FROM entities WHERE id = ?`, [id])
      await touch()
    },
    async listNotDuplicates() {
      const r = await db.query(`SELECT a_id, b_id FROM not_duplicates`)
      return r.map(row => `${String(row.a_id)}|${String(row.b_id)}`)
    },
    async markNotDuplicate(a, b) {
      const [x, y] = a < b ? [a, b] : [b, a]
      await db.run(`INSERT OR IGNORE INTO not_duplicates (a_id, b_id) VALUES (?, ?)`, [x, y])
      await touch()
    },
    async listAssets() {
      return (await db.query(`SELECT * FROM assets ORDER BY created_at`)).flatMap(r => normalizeAsset(r) ?? [])
    },
    async saveAsset(a) {
      const row = assetRow(a)
      const cols = TABLE_COLUMNS.assets
      await db.run(
        `INSERT INTO assets (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})
           ON CONFLICT(id) DO UPDATE SET ${cols.filter(c => c !== 'id').map(c => `${c} = excluded.${c}`).join(', ')}`,
        cols.map(c => row[c] ?? null),
      )
      await touch()
    },
    async exportData(): Promise<BackupData> {
      const entities = (await db.query(`SELECT * FROM entities ORDER BY created_at`)).map(parse)
      const data = { entities } as BackupData
      for (const t of RAW_TABLES) {
        const cols = TABLE_COLUMNS[t]
        data[t] = (await db.query(`SELECT ${cols.join(', ')} FROM ${t}`)) as RawRow[]
      }
      return data
    },
    async importData(input) {
      // Références vers des lignes absentes de la sauvegarde : retirées plutôt que refuser toute la restauration.
      const entityIds = new Set(input.entities.map(e => e.id))
      const assetIds = new Set(input.assets.map(a => String(a.id)))
      const campaignIds = new Set(input.campaigns.map(c => String(c.id)))
      const sessions = input.sessions.filter(s => campaignIds.has(String(s.campaign_id)))
      const sessionIds = new Set(sessions.map(s => String(s.id)))
      const data: BackupData = {
        entities: input.entities.map(e => ({
          ...e,
          parentId: e.parentId && entityIds.has(e.parentId) ? e.parentId : null,
          coverAsset: e.coverAsset && assetIds.has(e.coverAsset) ? e.coverAsset : null,
        })),
        assets: input.assets,
        campaigns: input.campaigns,
        sessions: sessions.map(s => ({ ...s, scenario_id: entityIds.has(String(s.scenario_id)) ? s.scenario_id : null })),
        journal_entries: input.journal_entries.filter(j => sessionIds.has(String(j.session_id))),
        not_duplicates: input.not_duplicates.filter(n => entityIds.has(String(n.a_id)) && entityIds.has(String(n.b_id))),
      }
      await db.run('BEGIN')
      try {
        // Les fiches peuvent citer une page parente insérée après elles : contrôle à la fin de la transaction.
        await db.pragma('PRAGMA defer_foreign_keys = ON')
        await db.run(`DELETE FROM links`)
        if (engine !== 'aucun') await db.run(`DELETE FROM search_index`)
        for (const t of ['not_duplicates', 'journal_entries', 'sessions', 'campaigns', 'entities', 'assets']) {
          await db.run(`DELETE FROM ${t}`)
        }
        for (const a of data.assets) await insertRow('assets', TABLE_COLUMNS.assets, a)
        for (const e of data.entities) await upsertEntity(e)
        for (const t of ['campaigns', 'sessions', 'journal_entries', 'not_duplicates'] as const) {
          for (const row of data[t]) await insertRow(t, TABLE_COLUMNS[t], row)
        }
        for (const e of data.entities) {
          await writeLinks(e)
          await indexEntity(db, engine, e)
        }
        await db.run('COMMIT')
      } catch (e) {
        await db.run('ROLLBACK')
        throw e
      }
      await db.persist()
    },
  }

}
