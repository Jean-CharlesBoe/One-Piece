import { describe, expect, it } from 'vitest'
import { createResource } from '../model/resources'
import { normalizeCost, normalizeResource, normalizeSkills, normalizeStats, normalizeTempBonuses, read } from './normalize'

describe('normalisation partagée', () => {
  it('caracs : complétées, bornées, avec un message pour chaque correction', () => {
    const w: string[] = []
    const s = normalizeStats({ expression: { valeur: -4 }, adresse: { valeur: 12, avantages: 99 } }, w, 'Bob : ')
    expect(s.expression.valeur).toBe(0)
    expect(s.adresse).toEqual({ valeur: 12, avantages: 20 })
    expect(s.perception).toEqual({ valeur: 0, avantages: 0 })
    expect(w).toEqual(['Bob : Expression « -4 » ramenée à 0'])
  })

  it('bonus temporaires : carac inconnue ou valeur nulle écartées', () => {
    const b = normalizeTempBonuses([
      { carac: 'inconnue', valeur: 2 },
      { carac: 'adresse', valeur: 0 },
      { carac: 'adresse', valeur: 3, origine: 'Haki' },
    ])
    expect(b).toHaveLength(1)
    expect(b[0]).toMatchObject({ carac: 'adresse', valeur: 3, origine: 'Haki' })
    expect(b[0].id).toBeTruthy()
  })

  it("ressources : l'actuel est ramené sous le max ; valeur par défaut si absente", () => {
    const w: string[] = []
    expect(normalizeResource({ cur: 130, max: 110 }, 'Endurance', w)).toMatchObject({ cur: 110, max: 110 })
    expect(w).toHaveLength(1)
    expect(normalizeResource(undefined, 'Rêve', w, '', createResource(10))).toEqual(createResource(10))
    expect(normalizeResource(null, 'Rêve', w, '', createResource(10))).toEqual(createResource(0))
  })

  it('compétences : coût et origine validés', () => {
    const [a, b] = normalizeSkills([
      { titre: 'Gomu Gomu no Pistol', cout: 4, origine: 'fruit' },
      { titre: 'X', cout: 'cher', origine: 'magie' },
    ])
    expect(a).toMatchObject({ cout: 4, origine: 'fruit', description: '' })
    expect(b).toMatchObject({ cout: null, origine: '' })
    expect(normalizeCost(-3)).toBe(0)
  })

  it('lecteurs : tolèrent tout', () => {
    expect(read.obj([1])).toEqual({})
    expect(read.arr('x')).toEqual([])
    expect(read.str(42, 10)).toBe('')
    expect(read.num(Number.NaN, 7)).toBe(7)
    expect(read.date('pas une date')).toBeNull()
    expect(read.id('')).not.toBe('')
  })
})
