import { describe, expect, it } from 'vitest'
import {
  AIDE_MEMOIRE,
  DIFFICULTES,
  MEMO_CARACS,
  MEMO_COMPETENCES,
  MEMO_FRUIT,
  MEMO_RESSOURCES,
  REGLE_AVANTAGES,
  type Memo,
} from './memos'

const section = (titre: string) => AIDE_MEMOIRE.find(s => s.titre === titre)!

describe('aide-mémoire', () => {
  it('garde les seuils de difficulté pour l’appli MJ seulement', () => {
    expect(DIFFICULTES.map(([, s]) => s)).toEqual([8, 12, 18, 25, 40, 70])
    expect(section('Jets').tableau).toBeUndefined()
  })

  it('donne les critiques des trois paliers de dé', () => {
    expect(section('Critiques').tableau!.lignes).toEqual([
      ['D10', '1 · 10'],
      ['D20', '1 · 20'],
      ['D100', '1 à 5 · 96 à 100'],
    ])
  })

  it('rappelle les ressources et les coûts d’XP', () => {
    expect(section('XP').tableau!.lignes.map(([, c]) => c)).toEqual(['1 XP', '1 XP', '10 XP'])
    expect(section('Ressources').tableau!.lignes.map(([r]) => r)).toContain('Ambition')
  })
})

describe('mémos des blocs', () => {
  it('une seule formulation des avantages', () => {
    expect(MEMO_CARACS.texte).toContain(REGLE_AVANTAGES)
    expect(section('Jets').texte).toContain(REGLE_AVANTAGES)
  })

  it('fruit : rappel de la nage', () => {
    expect(MEMO_FRUIT.texte[0]).toMatch(/nager/)
  })
})

describe('pas d’info réservée au MJ côté joueur (D-J18)', () => {
  const memos: Memo[] = [MEMO_CARACS, MEMO_RESSOURCES, MEMO_COMPETENCES, MEMO_FRUIT]
  const texte = [
    ...memos.flatMap(m => [...m.texte, ...(m.liste ?? []).flat()]),
    ...AIDE_MEMOIRE.flatMap(s => [s.titre, ...(s.texte ?? []), ...(s.tableau?.lignes ?? []).flat()]),
  ].join('\n')

  it.each([
    ['XP par adversaire', /Yonko|Shichibukai|Ennemi mineur/],
    ['XP narratif', /narratif|Poneglyphe/],
    ['barème d’Endurance', /\b(2 à 5|6 à 10|11 à 15)\b/],
    ['règles de création', /création/i],
    ['attaque de base', /1D6/],
    ['dés de régénération', /2D6 de/],
    ['seuils de difficulté', /Héroïque|Légendaire|Très difficile/],
  ])('%s', (_, motif) => {
    expect(texte).not.toMatch(motif)
  })
})
