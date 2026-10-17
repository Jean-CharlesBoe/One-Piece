import { describe, expect, it } from 'vitest'
import { changedSince, decideRelay, historyName, historyToPrune } from './relay'

describe('relais entre appareils', () => {
  const base = { folderId: 'A', syncId: 'A', changed: false, empty: false }

  it('dossier vide : écrire si la base a des fiches', () => {
    expect(decideRelay({ ...base, folderId: null })).toBe('ecrire')
    expect(decideRelay({ ...base, folderId: null, empty: true })).toBe('a-jour')
  })

  it('le dossier contient ce que cet appareil a écrit ou repris', () => {
    expect(decideRelay(base)).toBe('a-jour')
    expect(decideRelay({ ...base, changed: true })).toBe('ecrire')
  })

  it("l'autre appareil a écrit depuis", () => {
    expect(decideRelay({ ...base, folderId: 'B' })).toBe('reprendre')
    expect(decideRelay({ ...base, folderId: 'B', changed: true })).toBe('conflit')
  })

  it('premier lancement sur un appareil : base vide → reprendre, base non vide → choisir', () => {
    expect(decideRelay({ folderId: 'B', syncId: null, changed: false, empty: true })).toBe('reprendre')
    expect(decideRelay({ folderId: 'B', syncId: null, changed: true, empty: false })).toBe('conflit')
    expect(decideRelay({ folderId: 'B', syncId: null, changed: false, empty: false })).toBe('conflit')
  })

  it('modifié depuis la dernière sauvegarde', () => {
    expect(changedSince(null, null)).toBe(false)
    expect(changedSince('2026-10-17T10:00:00Z', null)).toBe(true)
    expect(changedSince('2026-10-17T10:00:00Z', '2026-10-17T10:05:00Z')).toBe(false)
    expect(changedSince('2026-10-17T10:06:00Z', '2026-10-17T10:05:00Z')).toBe(true)
  })

  it('historique : un fichier par jour, les plus anciens supprimés', () => {
    expect(historyName(new Date(2026, 9, 7))).toBe('onepiece-mj-2026-10-07.opmj')
    const names = ['onepiece-mj-2026-10-01.opmj', 'onepiece-mj-2026-10-03.opmj', 'onepiece-mj-2026-10-02.opmj', 'autre.txt']
    expect(historyToPrune(names, 2)).toEqual(['onepiece-mj-2026-10-01.opmj'])
  })
})
