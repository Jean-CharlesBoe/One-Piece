import { describe, expect, it } from 'vitest'
import { createResource } from '../model/resources'
import { emptyStats, STATS } from '../model/stats'
import { parseIntInput } from './numbers'
import { adjustResource, setRegeneration, setResourceCur, setResourceMax } from './resources'
import {
  addTempBonus,
  bonusTotal,
  clearTempBonuses,
  finalStat,
  removeTempBonus,
  setAvantages,
  setStatValue,
  stepStat,
  type HasStats,
} from './stats'

const someone = (): HasStats => ({ stats: emptyStats(), bonusTemporaires: [] })

describe('caracs', () => {
  it('sont 8, à 0 par défaut', () => {
    const s = emptyStats()
    expect(Object.keys(s)).toEqual(STATS.map(([k]) => k))
    expect(s.perception).toEqual({ valeur: 0, avantages: 0 })
  })

  it("n'ont pas de plafond de jeu mais restent positives", () => {
    const p = someone()
    expect(setStatValue(p, 'expression', 40)).toBe(40)
    expect(setStatValue(p, 'robustesse', -3)).toBe(0)
    expect(stepStat(p, 'robustesse', -1)).toBe(0)
    expect(stepStat(p, 'robustesse', 1)).toBe(1)
    expect(setStatValue(p, 'finesse', 2.7)).toBe(2)
  })

  it('acceptent des avantages positifs et des désavantages négatifs, bornés', () => {
    const p = someone()
    expect(setAvantages(p, 'intellect', 2)).toBe(2)
    expect(setAvantages(p, 'intellect', -1)).toBe(-1)
    expect(setAvantages(p, 'intellect', 500)).toBe(20)
  })
})

describe('bonus temporaires', () => {
  it("s'ajoutent à la valeur finale et se retirent", () => {
    const p = someone()
    setStatValue(p, 'perception', 10)
    const b1 = addTempBonus(p, 'perception', 10, '  Haki de l’Observation ')!
    addTempBonus(p, 'perception', -5, 'Épuisement')
    expect(b1.origine).toBe('Haki de l’Observation')
    expect(bonusTotal(p, 'perception')).toBe(5)
    expect(finalStat(p, 'perception')).toBe(15)
    removeTempBonus(p, b1.id)
    expect(finalStat(p, 'perception')).toBe(5)
    clearTempBonuses(p)
    expect(p.bonusTemporaires).toEqual([])
  })

  it('ignorent un bonus nul et ne rendent jamais la valeur finale négative', () => {
    const p = someone()
    expect(addTempBonus(p, 'adresse', 0, 'rien')).toBeNull()
    setStatValue(p, 'adresse', 2)
    addTempBonus(p, 'adresse', -5, 'malus')
    expect(finalStat(p, 'adresse')).toBe(0)
  })
})

describe('ressources', () => {
  it("l'actuel ne dépasse jamais le max ni ne passe sous 0", () => {
    const r = createResource()
    setResourceMax(r, 30)
    expect(setResourceCur(r, 45)).toBe(30)
    expect(adjustResource(r, -200)).toBe(0)
    expect(adjustResource(r, 15)).toBe(15)
  })

  it("baisser le max ramène l'actuel", () => {
    const r = createResource(40)
    setResourceMax(r, 30)
    expect(r).toMatchObject({ cur: 30, max: 30 })
  })

  it('démarrent pleines', () => {
    expect(createResource(10)).toEqual({ cur: 10, max: 10, regeneration: '' })
  })

  it('régénération : texte nettoyé et tronqué', () => {
    const r = createResource()
    expect(setRegeneration(r, '  2D6 + 4  ')).toBe('2D6 + 4')
    expect(setRegeneration(r, 'x'.repeat(500))).toHaveLength(120)
  })
})

describe('parseIntInput', () => {
  it('lit les entiers saisis, refuse le reste', () => {
    expect(parseIntInput(' 12 ')).toBe(12)
    expect(parseIntInput('+2')).toBe(2)
    expect(parseIntInput('-3')).toBe(-3)
    expect(parseIntInput('')).toBeNull()
    expect(parseIntInput('1.5')).toBeNull()
    expect(parseIntInput('abc')).toBeNull()
  })
})
