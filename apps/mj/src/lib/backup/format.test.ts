import { strToU8, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { createEntity } from '../model/entity'
import {
  BACKUP_FORMAT,
  BackupError,
  emptyBackupData,
  makeManifest,
  packBackup,
  readBackup,
  readManifest,
} from './format'

const info = { lastChangeAt: '2026-10-17T10:00:00.000Z', appVersion: '0.3.0', device: 'PC Windows' }

function sample() {
  const data = emptyBackupData()
  const drake = createEntity('personnage', 'Drake')
  drake.props = { role: 'PNJ' }
  data.entities.push(drake, createEntity('lieu', 'Loguetown'))
  data.not_duplicates.push({ a_id: 'a', b_id: 'b' })
  return data
}

const zip = (manifest: unknown, data: unknown) =>
  zipSync({ 'manifest.json': strToU8(JSON.stringify(manifest)), 'data.json': strToU8(JSON.stringify(data)) })

describe('sauvegarde .opmj', () => {
  it('aller-retour sans perte, manifeste complet', () => {
    const data = sample()
    const manifest = makeManifest(data, info)
    expect(manifest).toMatchObject({ format: BACKUP_FORMAT, device: 'PC Windows', counts: { entities: 2, not_duplicates: 1 } })
    const back = readBackup(packBackup(manifest, data))
    expect(back.data).toEqual(data)
    expect(back.manifest).toEqual(manifest)
    expect(back.warnings).toEqual([])
    expect(readManifest(packBackup(manifest, data)).id).toBe(manifest.id)
  })

  it('relecture prudente : fiche en double, colonnes inconnues, valeurs non simples', () => {
    const data = sample()
    const m = makeManifest(data, info)
    const raw = {
      entities: [...data.entities, data.entities[0], { type: 'inconnu', title: 'X' }],
      not_duplicates: [{ a_id: 'a', b_id: 'b', pirate: 'oui' }, { a_id: 'a', b_id: 'b' }],
      sessions: [{ id: 's1', number: 1, title: { pas: 'une chaîne' } }],
    }
    const back = readBackup(zip(m, raw))
    expect(back.data.entities.map(e => e.title)).toEqual(['Drake', 'Loguetown', 'X'])
    expect(back.data.entities[2].type).toBe('note')
    expect(back.data.not_duplicates).toEqual([{ a_id: 'a', b_id: 'b' }])
    expect(back.data.sessions[0]).toMatchObject({ id: 's1', number: 1, title: null })
    expect(back.warnings.length).toBeGreaterThanOrEqual(2)
  })

  it('refuse un fichier étranger, abîmé ou d’une version plus récente', () => {
    expect(() => readBackup(strToU8('pas un zip'))).toThrow(BackupError)
    expect(() => readBackup(zip({ format: 'autre' }, {}))).toThrow(/pas une sauvegarde/)
    expect(() => readBackup(zipSync({ 'manifest.json': strToU8('{oups') }))).toThrow(/illisible/)
    const m = makeManifest(emptyBackupData(), info)
    expect(() => readBackup(zip({ ...m, schemaVersion: 99 }, {}))).toThrow(/plus récente/)
    expect(() => readBackup(zip({ ...m, version: 2 }, {}))).toThrow(/plus récente/)
    expect(() => readBackup(zipSync({ 'manifest.json': strToU8(JSON.stringify(m)) }))).toThrow(/data.json manquant/)
  })
})
