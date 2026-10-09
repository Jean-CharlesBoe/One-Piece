import { describe, expect, it } from 'vitest'
import { createCharacter, createCompagnon, summarize } from './character'
import { normalizeCharacter } from './normalize'

describe('personnage', () => {
  it('démarre avec Rêve et Ambition à 10 / 10, Vitalité et Endurance à 0', () => {
    const c = createCharacter('Osmo')
    expect(c.ressources.reve).toMatchObject({ cur: 10, max: 10 })
    expect(c.ressources.ambition).toMatchObject({ cur: 10, max: 10 })
    expect(c.ressources.vitalite).toMatchObject({ cur: 0, max: 0 })
    expect(c.stats.robustesse.valeur).toBe(0)
  })

  it("résumé d'accueil : « Race · Classe »", () => {
    const c = createCharacter('Osmo')
    expect(summarize(c).sousTitre).toBe('')
    c.race = 'Humain'
    expect(summarize(c).sousTitre).toBe('Humain')
    c.classes = ['Navigateur']
    expect(summarize(c).sousTitre).toBe('Humain · Navigateur')
  })
})

describe('normalizeCharacter', () => {
  it("renvoie un personnage identique s'il est déjà valide", () => {
    const c = createCharacter('Osmo')
    c.race = 'Humain'
    c.tribu = 'long-cou'
    c.classes = ['Navigateur']
    c.fruit = { nom: 'Fruit de la chance', type: 'Paramecia', description: '', eveil: '' }
    c.ressourcesPerso.push({ id: 'chance', nom: 'Chance', cur: 3, max: 5, regeneration: 'en courant', regle: '' })
    c.competences.push({ id: 's1', titre: 'Coup de chance', cout: 5, origine: 'fruit', description: '' })
    c.compagnons.push(createCompagnon('Den Den Mushi'))
    const { character, warnings } = normalizeCharacter(JSON.parse(JSON.stringify(c)))
    expect(warnings).toEqual([])
    expect(character).toEqual(c)
  })

  it('corrige les données abîmées sans planter', () => {
    const { character, warnings } = normalizeCharacter({
      nom: 'X',
      race: 'Lunarien',
      tribu: 'long-nez',
      classes: ['Capitaine', 'Pirate', 'Capitaine'],
      palierDe: 'D20',
      stats: { expression: { valeur: -4 } },
      ressources: { endurance: { cur: 130, max: 110 } },
      ressourcesPerso: [{ nom: 'Chance', cur: 9, max: 5 }],
      fruit: 'oui',
      compagnons: [{ nom: 'Karoo', ressources: { vitalite: { cur: 5, max: 3 } } }],
    })
    expect(character.race).toBe('')
    expect(character.tribu).toBe('')
    expect(character.classes).toEqual(['Capitaine'])
    expect(character).not.toHaveProperty('palierDe')
    expect(character.stats.expression.valeur).toBe(0)
    expect(character.ressources.endurance).toMatchObject({ cur: 110, max: 110 })
    expect(character.ressources.reve).toMatchObject({ cur: 10, max: 10 })
    expect(character.ressourcesPerso[0]).toMatchObject({ nom: 'Chance', cur: 5, max: 5 })
    expect(character.fruit).toBeNull()
    expect(character.compagnons[0].ressources.vitalite).toMatchObject({ cur: 3, max: 3 })
    expect(warnings.length).toBeGreaterThanOrEqual(5)
  })

  it('accepte des données illisibles', () => {
    expect(normalizeCharacter(null).warnings).toHaveLength(1)
    expect(normalizeCharacter('texte').character.nom).toBe('')
  })

  it('signale une fiche venant d’une version plus récente', () => {
    expect(normalizeCharacter({ schemaVersion: 99 }).warnings[0]).toMatch(/plus récente/)
  })
})
