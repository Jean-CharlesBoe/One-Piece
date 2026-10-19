import { describe, expect, it } from 'vitest'
import { createGameBlock, categoryXp, isHumanRace, masteredHaki, normalizeGameBlock } from './gameBlock'
import { normalizeProps } from './props'

describe('bloc de jeu des PNJ', () => {
  it('nouveau bloc : rien de prérempli (D-M24)', () => {
    const b = createGameBlock()
    expect(Object.values(b.stats).every(s => s.valeur === 0 && s.avantages === 0)).toBe(true)
    expect(b.ressources).toEqual({
      vitalite: { cur: 0, max: 0, regeneration: '' },
      endurance: { cur: 0, max: 0, regeneration: '' },
      // Valeurs des règles, comme Vivre Card (D-M25).
      reve: { cur: 10, max: 10, regeneration: '' },
      ambition: { cur: 10, max: 10, regeneration: '' },
      transfert: { cur: 1, max: 1, regeneration: 'chaque jour' },
    })
    expect(b).toMatchObject({ tribu: '', reve: '', equipement: '', inventaire: '' })
    expect(b.categorie).toBe('')
    expect(b.competences).toEqual([])
    expect(masteredHaki(b)).toEqual([])
  })

  it('catégorie d’adversaire et XP (table des règles)', () => {
    expect(categoryXp('Vice-amiral')).toBe(25)
    expect(categoryXp('Empereur (Yonko)')).toBe(50)
    expect(categoryXp('')).toBeNull()
  })

  it('relecture prudente : valeurs bornées, ancien nom « techniques », Haki, catégorie inconnue signalée', () => {
    const w: string[] = []
    const b = normalizeGameBlock(
      {
        stats: { robustesse: { valeur: 12, avantages: 1 } },
        ressources: { vitalite: { cur: 80, max: 60 }, endurance: { max: 30 } },
        techniques: [{ titre: 'Poing de feu', cout: 8, origine: 'fruit' }],
        haki: { armement: { maitrise: true, notes: 'depuis Loguetown' }, rois: 'oui' },
        categorie: 'Dieu',
        bonusTemporaires: [{ carac: 'adresse', valeur: 2, origine: 'potion' }, { carac: 'xyz', valeur: 1 }],
      },
      w,
      'Drake : ',
    )!
    expect(b.stats.robustesse).toEqual({ valeur: 12, avantages: 1 })
    expect(b.stats.adresse.valeur).toBe(0)
    expect(b.ressources.vitalite).toEqual({ cur: 60, max: 60, regeneration: '' })
    expect(b.ressources.endurance).toEqual({ cur: 30, max: 30, regeneration: '' })
    expect(b.competences).toMatchObject([{ titre: 'Poing de feu', cout: 8, origine: 'fruit' }])
    expect(b.haki.armement).toEqual({ maitrise: true, notes: 'depuis Loguetown' })
    expect(b.haki.rois).toEqual({ maitrise: false, notes: '' })
    expect(masteredHaki(b)).toEqual(['Armement'])
    expect(b.bonusTemporaires).toHaveLength(1)
    expect(w).toEqual(expect.arrayContaining([expect.stringContaining('Vitalité actuelle'), expect.stringContaining('« Dieu »')]))
    expect(normalizeGameBlock('oui')).toBeUndefined()
  })

  it('bloc créé en 0.5.0 : Rêve, Ambition et Transfert ajoutés ; tribu inconnue écartée', () => {
    const b = normalizeGameBlock({ ressources: { vitalite: { cur: 5, max: 9 } }, tribu: 'trois-bras', reve: 'Trouver le One Piece' })!
    expect(b.ressources.vitalite).toEqual({ cur: 5, max: 9, regeneration: '' })
    expect(b.ressources.transfert).toEqual({ cur: 1, max: 1, regeneration: 'chaque jour' })
    expect(b.tribu).toBe('')
    expect(b.reve).toBe('Trouver le One Piece')
    expect(normalizeGameBlock({ tribu: 'long-cou' })!.tribu).toBe('long-cou')
  })

  it('Humain d’après la fiche de race liée (titre ou alias)', () => {
    expect(isHumanRace({ title: 'Humains', aliases: [] })).toBe(true)
    expect(isHumanRace({ title: 'Peuple des mers', aliases: ['humain'] })).toBe(true)
    expect(isHumanRace({ title: 'Minks', aliases: ['Mink'] })).toBe(false)
    expect(isHumanRace(undefined)).toBe(false)
  })

  it('propriété « jeu » d’un personnage normalisée avec la fiche', () => {
    const props = normalizeProps('personnage', { role: 'PNJ', jeu: { categorie: 'Amiral' } })
    expect(props.jeu).toMatchObject({ categorie: 'Amiral', competences: [], ressources: { vitalite: { max: 0 } } })
    expect(normalizeProps('personnage', { jeu: 'cassé' }).jeu).toBeUndefined()
  })
})
