import { describe, expect, it } from 'vitest'
import type { Classe, Race, Tribu } from '../model/identity'
import { createResource, type CustomResource } from '../model/resources'
import { hasAmbition, hasTribu, mainClasse, setClasse, setRace } from './identity'
import { moveItem, removeById } from './lists'
import { normalizeCustomResources } from './normalize'
import { addCustomResource, adjustResource, isEvanoui, renameCustomResource, setCustomResourceRule } from './resources'
import { adjustXp, setXp } from './xp'

const perso = () => ({
  race: '' as Race | '',
  tribu: '' as Tribu,
  classes: [] as Classe[],
})

describe('identité', () => {
  it("l'Ambition et les tribus sont réservées aux Humains, sans rien perdre au changement de race", () => {
    const c = perso()
    setRace(c, 'Humain')
    c.tribu = 'long-cou'
    expect(hasAmbition(c)).toBe(true)
    expect(hasTribu(c)).toBe(true)
    setRace(c, 'Mink')
    expect(hasAmbition(c)).toBe(false)
    expect(hasTribu(c)).toBe(false)
    expect(c.tribu).toBe('long-cou')
  })

  it("une seule classe à l'écran, stockée en liste", () => {
    const c = perso()
    expect(mainClasse(c)).toBe('')
    setClasse(c, 'Médecin')
    setClasse(c, 'Cuisinier')
    expect(c.classes).toEqual(['Cuisinier'])
    setClasse(c, '')
    expect(c.classes).toEqual([])
  })
})

describe('Endurance et évanouissement', () => {
  it('évanoui seulement si l’Endurance tombe à 0 alors que son max est renseigné', () => {
    const e = createResource(20)
    expect(isEvanoui(e)).toBe(false)
    adjustResource(e, -25)
    expect(isEvanoui(e)).toBe(true)
    expect(isEvanoui(createResource(0))).toBe(false)
  })
})

describe('ressources personnalisées', () => {
  it('ajout, renommage, règle, ordre, suppression', () => {
    const list: CustomResource[] = []
    const chance = addCustomResource(list, '  Chance ', 5)
    const autre = addCustomResource(list, 'Fureur')
    expect(chance).toMatchObject({ nom: 'Chance', cur: 5, max: 5, regle: '' })
    renameCustomResource(autre, ' Rage ')
    setCustomResourceRule(chance, ' 1 pt = +1 à un jet ')
    expect(chance.regle).toBe('1 pt = +1 à un jet')
    expect(moveItem(list, 1, -1)).toBe(true)
    expect(list.map(r => r.nom)).toEqual(['Rage', 'Chance'])
    removeById(list, autre.id)
    expect(list).toEqual([chance])
  })

  it('normalisation : bornes et champs manquants', () => {
    const w: string[] = []
    const [r] = normalizeCustomResources([{ nom: 'Chance', cur: 9, max: 5 }], w)
    expect(r).toMatchObject({ nom: 'Chance', cur: 5, max: 5, regle: '', regeneration: '' })
    expect(r.id).toBeTruthy()
    expect(w).toHaveLength(1)
  })
})

describe('XP', () => {
  it('reste positive', () => {
    const c = { xp: 0 }
    expect(setXp(c, 3)).toBe(3)
    expect(adjustXp(c, -5)).toBe(0)
    expect(adjustXp(c, 10)).toBe(10)
  })
})
