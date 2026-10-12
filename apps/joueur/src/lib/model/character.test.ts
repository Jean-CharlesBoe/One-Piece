import { describe, expect, it } from 'vitest'
import { addCompagnon, createCharacter, createCompagnon, summarize } from './character'
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

describe('compagnons', () => {
  it('ajout sans limite de nombre, nom nettoyé, Vitalité et Endurance vides', () => {
    const c = createCharacter('Osmo')
    const karoo = addCompagnon(c, '  Karoo ')
    addCompagnon(c, 'Den Den Mushi')
    expect(c.compagnons.map(x => x.nom)).toEqual(['Karoo', 'Den Den Mushi'])
    expect(karoo.ressources.vitalite).toMatchObject({ cur: 0, max: 0 })
    expect(karoo.competences).toEqual([])
  })
})

describe('compagnon = fiche PJ complète (D-J17)', () => {
  it('démarre comme un PJ : Rêve et Ambition à 10 / 10, rien d’autre', () => {
    const c = createCharacter('Osmo')
    const karoo = addCompagnon(c, 'Karoo')
    expect(karoo.ressources.reve).toMatchObject({ cur: 10, max: 10 })
    expect(karoo.ressources.ambition).toMatchObject({ cur: 10, max: 10 })
    expect(karoo).toMatchObject({ race: '', xp: 0, prime: null, fruit: null, classes: [], ressourcesPerso: [] })
  })

  it('aller-retour complet, race libre comprise', () => {
    const c = createCharacter('Osmo')
    const karoo = addCompagnon(c, 'Karoo')
    Object.assign(karoo, { race: 'Canard', titre: 'le Rapide', age: '4', reve: 'Courir le désert', prime: 50, xp: 3 })
    karoo.classes = ['Timonier']
    karoo.fruit = { nom: 'Fruit du vent', type: 'Logia', description: '', eveil: '' }
    karoo.ressourcesPerso.push({ id: 'v', nom: 'Vitesse', cur: 2, max: 3, regeneration: '', regle: '' })
    const humain = addCompagnon(c, 'Mousse')
    Object.assign(humain, { race: 'Humain', tribu: 'long-cou' })
    const { character, warnings } = normalizeCharacter(JSON.parse(JSON.stringify(c)))
    expect(warnings).toEqual([])
    expect(character.compagnons).toEqual(c.compagnons)
  })

  it('relit un ancien compagnon (champ « type », sans XP ni fruit) sans erreur', () => {
    const { character, warnings } = normalizeCharacter({
      nom: 'Osmo',
      compagnons: [{ id: 'k', nom: 'Karoo', type: 'Monture', race: 'Canard', ressources: { vitalite: { cur: 30, max: 30 } } }],
    })
    const karoo = character.compagnons[0]
    expect(warnings).toEqual([])
    expect(karoo).not.toHaveProperty('type')
    expect(karoo).toMatchObject({ id: 'k', nom: 'Karoo', race: 'Canard', xp: 0, fruit: null, prime: null })
    expect(karoo.ressources.vitalite).toMatchObject({ cur: 30, max: 30 })
    expect(karoo.ressources.reve).toMatchObject({ cur: 10, max: 10 })
  })
})

describe('Transfert', () => {
  it('1 utilisation par jour, pour un PJ comme pour un compagnon', () => {
    const c = createCharacter('Osmo')
    expect(c.ressources.transfert).toEqual({ cur: 1, max: 1, regeneration: 'chaque jour' })
    expect(addCompagnon(c, 'Karoo').ressources.transfert).toMatchObject({ cur: 1, max: 1 })
  })

  it('ajouté aux fiches enregistrées avant son apparition', () => {
    const { character, warnings } = normalizeCharacter({ nom: 'Osmo', ressources: { vitalite: { cur: 20, max: 30 } } })
    expect(warnings).toEqual([])
    expect(character.ressources.transfert).toMatchObject({ cur: 1, max: 1 })
  })
})

describe('photo et carnet (D-J22)', () => {
  const PNG = 'data:image/png;base64,iVBORw0KGgo='
  const JPG = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

  it('une fiche enregistrée avant reçoit photo nulle, Lore et Histoire vides', () => {
    const old = JSON.parse(JSON.stringify(createCharacter('Osmo')))
    delete old.photo
    delete old.lore
    delete old.histoire
    const { character, warnings } = normalizeCharacter(old)
    expect(warnings).toEqual([])
    expect(character).toMatchObject({ photo: null, lore: [], histoire: [] })
  })

  it('aller-retour avec photo du PJ et du compagnon, Lore et Histoire ; miniature dans le résumé', () => {
    const c = createCharacter('Osmo')
    c.photo = { image: JPG, miniature: PNG }
    addCompagnon(c, 'Karoo').photo = { image: JPG, miniature: PNG }
    c.lore.push({ id: 'l1', titre: 'Origines', texte: 'Né à Loguetown.' })
    c.histoire.push({ id: 'h1', date: '2026-10-12', titre: 'Départ', texte: '…' })
    const { character, warnings } = normalizeCharacter(JSON.parse(JSON.stringify(c)))
    expect(warnings).toEqual([])
    expect(character).toEqual(c)
    expect(summarize(character).thumb).toBe(PNG)
  })
})
