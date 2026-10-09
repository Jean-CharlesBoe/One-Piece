import { describe, expect, it } from 'vitest'
import type { Fruit } from '../model/fruit'
import type { Skill } from '../model/skills'
import { addFruit, fruitTechniques, isFruitEmpty, removeFruit } from './fruit'
import { normalizeFruit } from './normalize'

const skill = (titre: string, origine: Skill['origine']): Skill => ({ id: titre, titre, cout: null, origine, description: '' })

describe('fruit du démon', () => {
  it('ajout (sans écraser un fruit existant) et retrait', () => {
    const c: { fruit: Fruit | null } = { fruit: null }
    const f = addFruit(c)
    f.nom = 'Fruit de la chance'
    expect(addFruit(c)).toBe(f)
    expect(c.fruit?.nom).toBe('Fruit de la chance')
    removeFruit(c)
    expect(c.fruit).toBeNull()
  })

  it('vide = absent ou sans aucun champ rempli', () => {
    expect(isFruitEmpty(null)).toBe(true)
    expect(isFruitEmpty({ nom: '  ', type: '', description: '', eveil: '' })).toBe(true)
    expect(isFruitEmpty({ nom: '', type: 'Logia', description: '', eveil: '' })).toBe(false)
  })

  it('ses techniques sont les compétences d’origine « fruit »', () => {
    const owner = { competences: [skill('Coup de chance', 'fruit'), skill('Karaté', 'combat'), skill('Veine', 'fruit')] }
    expect(fruitTechniques(owner).map(s => s.titre)).toEqual(['Coup de chance', 'Veine'])
  })

  it('normalisation : type inconnu écarté, données illisibles = pas de fruit', () => {
    expect(normalizeFruit({ nom: 'Gomu Gomu', type: 'Élastique' })).toEqual({
      nom: 'Gomu Gomu',
      type: '',
      description: '',
      eveil: '',
    })
    expect(normalizeFruit('oui')).toBeNull()
    expect(normalizeFruit([1])).toBeNull()
    expect(normalizeFruit(undefined)).toBeNull()
  })
})
