import { addCustomResource, addFruit, addSkill } from '@onepiece/core'
import { describe, expect, it } from 'vitest'
import { addCompagnon, createCharacter } from '../model/character'
import { asCopy, backupFileName, backupStatus, buildBackup, characterFileName, parseBackup } from './format'

describe('sauvegarde', () => {
  it('fait un aller-retour sans perte', () => {
    const osmo = createCharacter('Osmo')
    osmo.race = 'Humain'
    osmo.prime = 30_000_000
    addFruit(osmo).nom = 'Fruit de la chance'
    addSkill(osmo, 'Coup de chance', 'fruit')
    addCustomResource(osmo.ressourcesPerso, 'Chance', 5)
    const karoo = addCompagnon(osmo, 'Karoo')
    karoo.race = 'Canard'
    karoo.xp = 4
    addFruit(karoo).nom = 'Fruit du vent'
    const text = JSON.stringify(buildBackup([osmo, createCharacter('Djack')], '0.1.0'))
    const { characters, warnings } = parseBackup(text)
    expect(warnings).toEqual([])
    expect(characters[0]).toEqual(osmo)
    expect(characters).toHaveLength(2)
  })

  it('refuse un fichier qui n’est pas une sauvegarde', () => {
    expect(() => parseBackup('pas du json')).toThrow(/illisible/)
    expect(() => parseBackup('{"nom":"Osmo"}')).toThrow(/pas une sauvegarde/)
    expect(() => parseBackup(JSON.stringify({ format: 'sansnom-sauvegarde', characters: [] }))).toThrow(/pas une sauvegarde/)
    expect(() => parseBackup(JSON.stringify({ ...buildBackup([], '1'), characters: [] }))).toThrow(/aucun/)
    expect(() => parseBackup(JSON.stringify({ ...buildBackup([createCharacter('A')], '9'), version: 99 }))).toThrow(
      /plus récente/,
    )
  })

  it('répare les personnages abîmés et le signale', () => {
    const bad = { ...createCharacter('Osmo'), ressources: { endurance: { cur: 130, max: 110 } } }
    const { characters, warnings } = parseBackup(JSON.stringify(buildBackup([bad as never], '0.1.0')))
    expect(characters[0].ressources.endurance.cur).toBe(110)
    expect(warnings[0]).toMatch(/^Osmo : /)
  })

  it('crée une copie indépendante avec un nouvel identifiant', () => {
    const c = createCharacter('Osmo')
    addCompagnon(c, 'Karoo')
    const copy = asCopy(c, new Date('2026-10-12T10:00:00Z'))
    expect(copy.id).not.toBe(c.id)
    expect(copy.nom).toBe('Osmo (copie)')
    expect(copy.updatedAt).toBe('2026-10-12T10:00:00.000Z')
    copy.compagnons[0].nom = 'Autre'
    expect(c.compagnons[0].nom).toBe('Karoo')
  })

  it('nomme les fichiers avec la date', () => {
    expect(backupFileName(new Date(2026, 9, 8))).toBe('vivrecard-sauvegarde-2026-10-08.json')
    expect(characterFileName('Osmo « le Chanceux »', new Date(2026, 9, 8))).toBe('vivrecard-osmo-le-chanceux-2026-10-08.json')
    expect(characterFileName('???', new Date(2026, 9, 8))).toBe('vivrecard-personnage-2026-10-08.json')
  })
})

describe('rappel de sauvegarde', () => {
  const now = new Date(2026, 9, 20, 12)
  const summary = (updatedAt: string) => [{ updatedAt }]

  it('ne dit rien sans personnage', () => {
    expect(backupStatus(null, [], now)).toEqual({ warn: false, text: '' })
  })

  it('alerte si aucune sauvegarde', () => {
    expect(backupStatus(null, summary('2026-10-01T00:00:00Z'), now).warn).toBe(true)
  })

  it("alerte après 7 jours seulement s'il y a eu des modifications", () => {
    const last = new Date(2026, 9, 10).toISOString()
    expect(backupStatus(last, summary(new Date(2026, 9, 15).toISOString()), now)).toEqual({
      warn: true,
      text: 'Dernière sauvegarde : il y a 10 jours.',
    })
    expect(backupStatus(last, summary(new Date(2026, 9, 9).toISOString()), now).warn).toBe(false)
    const recent = new Date(2026, 9, 19).toISOString()
    expect(backupStatus(recent, summary(new Date(2026, 9, 20).toISOString()), now)).toEqual({
      warn: false,
      text: 'Dernière sauvegarde : hier.',
    })
  })
})

describe('copie', () => {
  it('accepte un objet non clonable par structuredClone (proxy de Svelte)', () => {
    const c = createCharacter('Osmo')
    const proxy = new Proxy(c, {})
    expect(asCopy(proxy).nom).toBe('Osmo (copie)')
  })
})
