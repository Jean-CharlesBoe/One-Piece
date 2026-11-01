import { describe, expect, it } from 'vitest'
import { createEntity, type Entity } from './entity'
import { createGameBlock } from './gameBlock'
import {
  autoText,
  createEntry,
  entryMentions,
  entryRow,
  gameChanges,
  mergeAuto,
  normalizeEntry,
  summaryFromJournal,
  type AutoChange,
} from './journal'

function pnj(): Entity {
  const e = createEntity('personnage', 'Fushia')
  e.props = { role: 'PNJ', etat: 'En vie', jeu: createGameBlock() }
  const b = e.props.jeu as ReturnType<typeof createGameBlock>
  b.ressources.vitalite = { cur: 45, max: 45, regeneration: '' }
  return e
}
const clone = (e: Entity) => structuredClone(e)

describe('journal de session', () => {
  it('aller-retour en ligne SQL, relecture prudente, fiches citées', () => {
    const e = createEntry('s1', 'combat', 'Contre [[a1|Drake]] et [[?|Inconnu]]', '2026-11-01T20:04:00.000Z')
    expect(normalizeEntry(entryRow(e))).toEqual(e)
    expect(entryMentions(e)).toEqual(['a1'])
    expect(normalizeEntry({ id: 'x', session_id: 's', at: 'pas une date' })).toBeNull()
    expect(normalizeEntry({ id: 'x', session_id: 's', at: '2026-11-01T20:00:00Z', kind: 'bizarre', auto: '{cassé' })).toMatchObject({ kind: 'evenement', auto: null })
  })

  it('changements notés : ressources actuelles, ressources perso, bonus, mort ; pas les maximums ni les caracs', () => {
    const a = pnj()
    const b = clone(a)
    const jb = b.props.jeu as ReturnType<typeof createGameBlock>
    jb.ressources.vitalite.cur = 33
    jb.ressources.vitalite.max = 50
    jb.stats.robustesse.valeur = 7
    jb.bonusTemporaires.push({ id: 'b1', carac: 'adresse', valeur: 2, origine: 'potion' })
    b.props.etat = 'Mort'
    const ch = gameChanges(a, b)
    expect(ch.map(c => [c.field, c.from, c.to])).toEqual([
      ['etat', 'En vie', 'Mort'],
      ['vitalite', '45', '33'],
      ['bonus', 'aucun', 'Adresse +2 (potion)'],
    ])
    expect(autoText(ch[0], 'Fushia')).toBe(`[[${a.id}|Fushia]] : mort`)
    expect(autoText(ch[1], 'Fushia')).toBe(`[[${a.id}|Fushia]] : Vitalité 45 → 33`)
    expect(gameChanges(a, clone(a))).toEqual([])
  })

  it('regroupement sur 10 s : « de » d’origine gardé ; retour au départ = entrée supprimée ; après 10 s, nouvelle entrée', () => {
    const c = (from: string, to: string): AutoChange => ({ entityId: 'p', field: 'vitalite', label: 'Vitalité', from, to })
    const t0 = new Date('2026-11-01T20:00:00Z')
    const first = mergeAuto([], c('45', '40'), 'Fushia', 's', t0).save!
    expect(first.textMd).toBe('[[p|Fushia]] : Vitalité 45 → 40')
    const second = mergeAuto([first], c('40', '33'), 'Fushia', 's', new Date(t0.getTime() + 5000))
    expect(second.save?.id).toBe(first.id)
    expect(second.save?.textMd).toBe('[[p|Fushia]] : Vitalité 45 → 33')
    const back = mergeAuto([second.save!], c('33', '45'), 'Fushia', 's', new Date(t0.getTime() + 9000))
    expect(back).toEqual({ save: null, remove: first.id })
    const later = mergeAuto([second.save!], c('33', '30'), 'Fushia', 's', new Date(t0.getTime() + 30000))
    expect(later.save?.id).not.toBe(first.id)
  })

  it('résumé pré-rempli depuis le journal (sans les entrées automatiques)', () => {
    const at = '2026-11-01T20:04:00.000Z'
    const auto = { ...createEntry('s', 'auto', 'x', at), auto: null }
    const text = summaryFromJournal([createEntry('s', 'evenement', 'Arrivée au port', at), createEntry('s', 'combat', 'Drake\nfuit', at), auto])
    expect(text.split('\n')).toHaveLength(2)
    expect(text).toContain('— Arrivée au port')
    expect(text).toContain('— Combat : Drake fuit')
  })
})
