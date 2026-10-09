import { describe, expect, it } from 'vitest'
import {
  CLASSE_INFO,
  CLASSES,
  findRace,
  isClasse,
  isPalier,
  isRace,
  isSkillOrigin,
  isTribu,
  PALIER_INFO,
  PALIERS,
  RACE_INFO,
  RACES,
} from './identity'
import { isStatKey, statLabel, STAT_KEYS } from './stats'

describe('listes fermées', () => {
  it('5 races jouables, sans les Lunariens', () => {
    expect(RACES).toHaveLength(5)
    expect(isRace('Lunarien')).toBe(false)
    expect(isRace('Skypiéen')).toBe(true)
  })

  it('les races se retrouvent par pluriel ou alias (Anges = Skypiéens)', () => {
    expect(findRace('Anges')).toBe('Skypiéen')
    expect(findRace(' skypiéens ')).toBe('Skypiéen')
    expect(findRace('Hommes-Poissons')).toBe('Homme-Poisson')
    expect(findRace('Lunariens')).toBeNull()
  })

  it('11 classes, chacune décrite', () => {
    expect(CLASSES).toHaveLength(11)
    expect(Object.keys(CLASSE_INFO).sort()).toEqual([...CLASSES].sort())
    expect(CLASSE_INFO.Archéologue.avantages).toEqual(['intellect', 'intellect'])
    expect(isClasse('Pirate')).toBe(false)
  })

  it('avantages de race et de classe : uniquement des caracs connues', () => {
    const all = [...Object.values(RACE_INFO), ...Object.values(CLASSE_INFO)].flatMap(x => [
      ...x.avantages,
      ...x.desavantages,
    ])
    expect(all.every(isStatKey)).toBe(true)
  })

  it('paliers de dé : critiques aux extrémités du dé', () => {
    for (const p of PALIERS) {
      const { faces, echecCritique, reussiteCritique } = PALIER_INFO[p]
      expect(echecCritique[0]).toBe(1)
      expect(reussiteCritique[1]).toBe(faces)
    }
    expect(PALIER_INFO.D100.reussiteCritique).toEqual([96, 100])
    expect(isPalier('D12')).toBe(false)
  })

  it('tribus et origines de compétence', () => {
    expect(isTribu('')).toBe(true)
    expect(isTribu('long-cou')).toBe(true)
    expect(isTribu('long-nez')).toBe(false)
    expect(isSkillOrigin('')).toBe(true)
    expect(isSkillOrigin('haki')).toBe(true)
    expect(isSkillOrigin('magie')).toBe(false)
  })

  it('libellés des caracs', () => {
    expect(STAT_KEYS).toHaveLength(8)
    expect(statLabel('savoirfaire')).toBe('Savoir-faire')
  })
})
