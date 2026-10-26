import initSqlJs, { type Database } from 'sql.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { createAsset } from '../model/asset'
import { createEntity } from '../model/entity'
import { createSession } from '../model/session'
import type { Db } from './db'
import { META_SCHEMA_VERSION, META_SEARCH_ENGINE } from './repository'
import { MIGRATIONS } from './schema'
import { createSqliteRepository, migrate } from './sqliteRepository'
import { sqlJsDb } from './sqlJsDb'

// Même SQL que sur l'appareil, exécuté par sql.js (le moteur du repli web : FTS4 sans FTS5).
// persist() ne fait rien : la base reste en mémoire.
const SQL = await initSqlJs()

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
    expect(await again.listCatalog()).toHaveLength(1)
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

  it('fiches : aller-retour, catalogue trié par titre, archivées signalées', async () => {
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

    expect(await repo.getEntity(drake.id)).toEqual(drake)
    expect(await repo.getEntity('inconnue')).toBeNull()
    const cat = await repo.listCatalog()
    expect(cat.map(e => e.title)).toEqual(['alvida', 'Drake', 'Oublié'])
    expect(cat[1]).toMatchObject({ aliases: ['Capitaine Drake'], pinned: true, archived: false })
    expect(cat[2].archived).toBe(true)

    drake.title = 'Drake le Rouge'
    await repo.saveEntity(drake)
    expect((await repo.getEntity(drake.id))?.title).toBe('Drake le Rouge')
  })

  it('liens : relations et mentions vers des fiches existantes, recalculés à chaque enregistrement', async () => {
    const repo = await createSqliteRepository(db)
    const marine = createEntity('faction', 'Marine')
    const ile = createEntity('lieu', 'Loguetown')
    await repo.saveEntity(marine)
    await repo.saveEntity(ile)
    const smoker = createEntity('personnage', 'Smoker')
    smoker.props = { factions: [marine.id, 'disparue'] }
    smoker.bodyMd = `Chasseur basé à [[${ile.id}|Loguetown]], cherche [[?|Luffy]].`
    await repo.saveEntity(smoker)

    expect(await repo.backlinks(marine.id)).toEqual([{ fromId: smoker.id, kind: 'factions' }])
    expect(await repo.backlinks(ile.id)).toEqual([{ fromId: smoker.id, kind: 'mention' }])

    smoker.bodyMd = 'Plus de mention.'
    await repo.saveEntity(smoker)
    expect(await repo.backlinks(ile.id)).toEqual([])
  })

  it('recherche : propriétés lisibles (relations par leur titre) et texte sans balisage', async () => {
    const repo = await createSqliteRepository(db)
    const marine = createEntity('faction', 'Marine')
    await repo.saveEntity(marine)
    const smoker = createEntity('personnage', 'Smoker')
    smoker.props = { factions: [marine.id], etat: 'En vie' }
    smoker.bodyMd = '## Fumée\n\n**Logia** de la *fumée*.'
    await repo.saveEntity(smoker)
    const r = await db.query(`SELECT props_text, body_text FROM search_index WHERE entity_id = ?`, [smoker.id])
    expect(r).toEqual([{ props_text: 'En vie · Marine', body_text: 'Fumée Logia de la fumée .' }])
  })

  it('suppression définitive : liens entrants retirés, pages enfants rattachées à la racine', async () => {
    const repo = await createSqliteRepository(db)
    const parent = createEntity('scenario', 'Scénario 1')
    await repo.saveEntity(parent)
    const enfant = createEntity('note', 'Énigme')
    enfant.parentId = parent.id
    enfant.bodyMd = `Voir [[${parent.id}|Scénario 1]]`
    await repo.saveEntity(enfant)
    await repo.deleteEntity(parent.id)

    expect(await repo.getEntity(parent.id)).toBeNull()
    expect((await repo.getEntity(enfant.id))?.parentId).toBeNull()
    expect(await db.query(`SELECT * FROM links`)).toEqual([])
    expect(await db.query(`SELECT * FROM search_index WHERE entity_id = ?`, [parent.id])).toEqual([])
  })

  it('paires « pas des doublons » : ordre normalisé, sans doublon, supprimées avec la fiche', async () => {
    const repo = await createSqliteRepository(db)
    const a = createEntity('race', 'Skypiéens')
    const b = createEntity('note', 'Skypieen')
    await repo.saveEntity(a)
    await repo.saveEntity(b)
    await repo.markNotDuplicate(b.id, a.id)
    await repo.markNotDuplicate(a.id, b.id)
    const [x, y] = [a.id, b.id].sort()
    expect(await repo.listNotDuplicates()).toEqual([`${x}|${y}`])
    await repo.deleteEntity(a.id)
    expect(await repo.listNotDuplicates()).toEqual([])
  })

  it('recherche : préfixes, accents, propriétés, extrait surligné, archives exclues', async () => {
    const repo = await createSqliteRepository(db)
    const marine = createEntity('faction', 'Marine')
    await repo.saveEntity(marine)
    const smoker = createEntity('personnage', 'Smoker')
    smoker.aliases = ['Chasseur blanc']
    smoker.props = { factions: [marine.id] }
    smoker.bodyMd = 'Il fume deux **cigares** en permanence.'
    await repo.saveEntity(smoker)
    const vieux = createEntity('note', 'Cigares oubliés')
    vieux.archived = true
    await repo.saveEntity(vieux)

    expect((await repo.search('smo')).map(h => h.id)).toEqual([smoker.id])
    expect((await repo.search('chasseur')).map(h => h.id)).toEqual([smoker.id])
    expect((await repo.search('marine')).map(h => h.id).sort()).toEqual([marine.id, smoker.id].sort())
    const [hit] = await repo.search('CIGARE')
    expect(hit.id).toBe(smoker.id)
    expect(hit.snippet).toContain('<mark>cigares</mark>')
    expect(await repo.search('  ')).toEqual([])
    expect(await repo.search('"OR* (')).toEqual([])
  })

  it('export puis import dans une autre base : identique, liens et recherche reconstruits', async () => {
    const repo = await createSqliteRepository(db)
    const marine = createEntity('faction', 'Marine')
    const smoker = createEntity('personnage', 'Smoker')
    smoker.props = { factions: [marine.id] }
    smoker.bodyMd = 'Cigares.'
    const enfant = createEntity('note', 'QG')
    enfant.parentId = marine.id
    // La page enfant est enregistrée avant sa page parente dans l'export (ordre de création).
    enfant.createdAt = '2000-01-01T00:00:00.000Z'
    await repo.saveEntity(marine)
    await repo.saveEntity(smoker)
    await repo.saveEntity(enfant)
    await repo.markNotDuplicate(marine.id, smoker.id)
    const data = await repo.exportData()
    expect(data.entities.map(e => e.title)).toEqual(['QG', 'Marine', 'Smoker'])

    const other = await createSqliteRepository(sqlJsDb(new SQL.Database()))
    await other.saveEntity(createEntity('note', 'À remplacer'))
    await other.importData(data)
    expect((await other.listCatalog()).map(e => e.title).sort()).toEqual(['Marine', 'QG', 'Smoker'])
    expect(await other.getEntity(smoker.id)).toEqual(smoker)
    expect(await other.backlinks(marine.id)).toEqual([{ fromId: smoker.id, kind: 'factions' }])
    expect((await other.search('cigare')).map(h => h.id)).toEqual([smoker.id])
    expect(await other.listNotDuplicates()).toHaveLength(1)
    expect(await other.exportData()).toEqual(data)
  })

  it('import : références manquantes retirées ; erreur → base inchangée', async () => {
    const repo = await createSqliteRepository(db)
    const garde = createEntity('note', 'Gardée')
    await repo.saveEntity(garde)
    const orpheline = createEntity('note', 'Orpheline')
    orpheline.parentId = 'absente'
    await repo.importData({ ...(await repo.exportData()), entities: [orpheline], not_duplicates: [{ a_id: 'x', b_id: 'y' }] })
    expect((await repo.getEntity(orpheline.id))?.parentId).toBeNull()
    expect(await repo.listNotDuplicates()).toEqual([])

    const avant = await repo.exportData()
    const casse = createEntity('note', 'Cassée')
    ;(casse as unknown as { type: null }).type = null
    await expect(repo.importData({ ...avant, entities: [casse] })).rejects.toThrow()
    expect(await repo.exportData()).toEqual(avant)
  })

  it('signal de modification après chaque écriture', async () => {
    let n = 0
    const repo = await createSqliteRepository(db, () => n++)
    const e = createEntity('note', 'Une')
    const f = createEntity('note', 'Autre')
    await repo.saveEntity(e)
    await repo.saveEntity(f)
    await repo.markNotDuplicate(e.id, f.id)
    await repo.deleteEntity(e.id)
    expect(n).toBe(4)
  })

  it('médias : enregistrés, remplacés, sauvegardés avec la base, signal de modification', async () => {
    let n = 0
    const repo = await createSqliteRepository(db, () => n++)
    const a = createAsset({ name: 'carte.png', size: 12 }, 'image/png', { width: 2, height: 3 })
    await repo.saveAsset(a)
    await repo.saveAsset({ ...a, originalName: 'carte-2.png' })
    expect(await repo.listAssets()).toEqual([{ ...a, originalName: 'carte-2.png' }])
    expect(n).toBe(2)
    const data = await repo.exportData()
    const other = await createSqliteRepository(sqlJsDb(new SQL.Database()))
    await other.importData(data)
    expect(await other.listAssets()).toEqual(await repo.listAssets())
  })

  it('campagne unique, sessions : enregistrées, triées, sauvegardées avec la base, supprimées', async () => {
    const repo = await createSqliteRepository(db)
    const c = await repo.campaignId()
    expect(await repo.campaignId()).toBe(c)
    const s2 = { ...createSession(c, 2), title: 'Le retour', pinnedIds: ['x'] }
    const s1 = { ...createSession(c, 1), status: 'terminee' as const, summaryMd: 'Rencontre.' }
    await repo.saveSession(s2)
    await repo.saveSession(s1)
    await repo.saveSession({ ...s2, title: 'Le grand retour' })
    expect((await repo.listSessions()).map(s => [s.number, s.title])).toEqual([[1, ''], [2, 'Le grand retour']])
    const other = await createSqliteRepository(sqlJsDb(new SQL.Database()))
    await other.importData(await repo.exportData())
    expect(await other.listSessions()).toEqual(await repo.listSessions())
    expect(await other.campaignId()).toBe(c)
    await repo.deleteSession(s1.id)
    expect((await repo.listSessions()).map(s => s.number)).toEqual([2])
  })

  it('réglages (meta)', async () => {
    const repo = await createSqliteRepository(db)
    expect(await repo.getMeta('theme')).toBeNull()
    await repo.setMeta('theme', 'sombre')
    await repo.setMeta('theme', 'clair')
    expect(await repo.getMeta('theme')).toBe('clair')
  })
})
