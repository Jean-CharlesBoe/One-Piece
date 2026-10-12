import { describe, expect, it } from 'vitest'
import type { LoreSection, SessionEntry } from '../model/notebook'
import { moveItem, removeById } from './lists'
import { normalizeLore, normalizePhoto, normalizeSessions } from './normalize'
import {
  addLoreSection,
  addSession,
  formatSessionDate,
  isIsoDate,
  sessionsByDate,
  todayIso,
  updateLoreSection,
  updateSession,
} from './notebook'

const PNG = 'data:image/png;base64,iVBORw0KGgo='
const JPG = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

describe('Lore', () => {
  it('ajoute, modifie, réordonne et supprime des sections', () => {
    const c: { lore: LoreSection[] } = { lore: [] }
    const a = addLoreSection(c, 'Origines')
    const b = addLoreSection(c, 'Famille')
    updateLoreSection(a, { texte: 'Né sur une île de East Blue.\nA vu son premier Roi des mers à 6 ans.' })
    expect(a.texte).toContain('\n')
    expect(moveItem(c.lore, 1, -1)).toBe(true)
    expect(c.lore.map(s => s.titre)).toEqual(['Famille', 'Origines'])
    removeById(c.lore, b.id)
    expect(c.lore.map(s => s.titre)).toEqual(['Origines'])
  })
})

describe('Histoire', () => {
  it('crée une séance datée du jour', () => {
    const c: { histoire: SessionEntry[] } = { histoire: [] }
    expect(addSession(c).date).toBe(todayIso())
  })

  it('trie les séances de la plus récente à la plus ancienne, sans changer l’ordre stocké', () => {
    const c: { histoire: SessionEntry[] } = { histoire: [] }
    const s1 = addSession(c, '2026-08-31')
    const s2 = addSession(c, '2026-10-12')
    const s3 = addSession(c, '2026-09-14')
    const s4 = addSession(c, '2026-10-12')
    expect(sessionsByDate(c.histoire).map(s => s.id)).toEqual([s4.id, s2.id, s3.id, s1.id])
    expect(c.histoire[0]).toBe(s1)
  })

  it('refuse une date invalide', () => {
    const c: { histoire: SessionEntry[] } = { histoire: [] }
    const s = addSession(c, '2026-10-12')
    updateSession(s, { date: '2026-02-30' })
    expect(s.date).toBe('2026-10-12')
    updateSession(s, { date: '2026-11-02', titre: 'Arrivée à Loguetown' })
    expect(s).toMatchObject({ date: '2026-11-02', titre: 'Arrivée à Loguetown' })
    expect(isIsoDate('12/10/2026')).toBe(false)
  })

  it('affiche la date en français', () => {
    expect(formatSessionDate('2026-10-12')).toBe('12 oct. 2026')
  })
})

describe('normalisation de la photo et du carnet', () => {
  it('garde une photo valide, ignore une photo invalide en le signalant', () => {
    const w: string[] = []
    expect(normalizePhoto({ image: JPG, miniature: PNG }, w)).toEqual({ image: JPG, miniature: PNG })
    expect(normalizePhoto(undefined, w)).toBeNull()
    expect(w).toEqual([])
    expect(normalizePhoto({ image: 'javascript:alert(1)', miniature: PNG }, w, 'Karoo : ')).toBeNull()
    expect(w[0]).toMatch(/^Karoo : photo/)
  })

  it('complète les sections et remplace une date de séance invalide', () => {
    const w: string[] = []
    expect(normalizeLore([{ titre: 'Origines' }])[0]).toMatchObject({ titre: 'Origines', texte: '' })
    const [s] = normalizeSessions([{ date: 'hier', titre: 'Embuscade', texte: '…' }], w)
    expect(s.date).toBe(todayIso())
    expect(w[0]).toMatch(/Embuscade/)
  })
})
