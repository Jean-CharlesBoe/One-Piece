import { describe, expect, it } from 'vitest'
import { changedSince, parseSnapshot, restoreItem, takeSnapshot } from './snapshot'

const pnj = (id: string, cur: number, etat = 'En vie') => ({
  id,
  type: 'personnage',
  props: { etat, jeu: { ressources: { vitalite: { cur, max: 45 } } } } as Record<string, unknown>,
})

describe('instantané de début de session (D-M13)', () => {
  it('seulement les personnages avec un bloc de jeu ; copie indépendante', () => {
    const a = pnj('a', 45)
    const snap = takeSnapshot([a, { id: 'b', type: 'personnage', props: {} }, { id: 'l', type: 'lieu', props: { jeu: {} } }])
    expect(Object.keys(snap)).toEqual(['a'])
    ;(a.props.jeu as { ressources: { vitalite: { cur: number } } }).ressources.vitalite.cur = 10
    expect(snap.a.jeu).toEqual({ ressources: { vitalite: { cur: 45, max: 45 } } })
  })

  it('relecture JSON prudente', () => {
    const snap = takeSnapshot([pnj('a', 45)])
    expect(parseSnapshot(JSON.stringify(snap))).toEqual(snap)
    expect(parseSnapshot('{cassé')).toEqual({})
    expect(parseSnapshot(null)).toEqual({})
    expect(parseSnapshot('{"x":{"etat":"Mort"}}')).toEqual({})
  })

  it('PNJ changés depuis le début, puis remis à l’état de début', () => {
    const a = pnj('a', 45)
    const b = pnj('b', 30)
    const snap = takeSnapshot([a, b])
    const a2 = pnj('a', 12, 'Mort')
    const b2 = { ...pnj('b', 30), props: { jeu: { ressources: { vitalite: { max: 45, cur: 30 } } }, etat: 'En vie' } }
    expect(changedSince(snap, [a2, b2])).toEqual(['a'])
    restoreItem(a2.props, snap.a)
    expect(a2.props).toEqual(a.props)
    expect(changedSince(snap, [a2, b2])).toEqual([])
  })
})
