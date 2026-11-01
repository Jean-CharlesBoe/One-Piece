import { describe, expect, it } from 'vitest'
import { hakiEffect, hakiTally } from './haki'

describe('haki', () => {
  it('applique la table du D100 de chaque type', () => {
    expect(hakiEffect('observation', 1)).toEqual({ effet: '+10 Perception, 3 tours', range: '1–20', best: true })
    expect(hakiEffect('observation', 21)).toMatchObject({ effet: '+5 Perception, 1 tour', range: '21–50', best: false })
    expect(hakiEffect('armement', 15).best).toBe(true)
    expect(hakiEffect('armement', 16)).toMatchObject({ effet: '+5 Robustesse, 1 tour', best: false })
    expect(hakiEffect('armement', 71).effet).toBe('rien')
    expect(hakiEffect('rois', 2).effet).toMatch(/^activation/)
    expect(hakiEffect('rois', 5)).toMatchObject({ effet: 'réveil latent', range: '3–5', best: true })
    expect(hakiEffect('rois', 6)).toMatchObject({ effet: 'rien', range: '6–100', best: false })
  })

  it('ramène un résultat hors bornes à 1..100', () => {
    expect(hakiEffect('observation', 0).range).toBe('1–20')
    expect(hakiEffect('observation', 250).range).toBe('76–100')
  })

  it('récapitule les jets : meilleurs résultats et maîtrise', () => {
    const t = hakiTally([
      { type: 'observation', resultat: 12, session: 1 },
      { type: 'observation', resultat: 60, session: 2 },
      { type: 'rois', resultat: 4, session: 4 },
    ])
    expect(t).toEqual([
      { type: 'observation', jets: 2, meilleurs: 1, objectif: 5, maitrise: false, sessions: [1] },
      { type: 'rois', jets: 1, meilleurs: 1, objectif: 1, maitrise: true, sessions: [4] },
    ])
    const five = Array.from({ length: 5 }, (_, i) => ({ type: 'armement' as const, resultat: 3, session: i + 1 }))
    expect(hakiTally(five)[0].maitrise).toBe(true)
  })
})
