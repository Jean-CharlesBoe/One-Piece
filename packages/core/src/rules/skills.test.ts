import { describe, expect, it } from 'vitest'
import { skillOriginLabel } from '../model/identity'
import type { Skill } from '../model/skills'
import { moveItem, removeById } from './lists'
import { addSkill, filterSkills, updateSkill, usedOrigins } from './skills'

describe('compétences', () => {
  it('ajout, coût facultatif borné, origine, ordre, suppression', () => {
    const c: { competences: Skill[] } = { competences: [] }
    const a = addSkill(c, 'Gomu Gomu no Pistol', 'fruit')
    const b = addSkill(c, 'Karaté des hommes-poissons')
    updateSkill(b, { cout: 6, origine: 'race', description: 'Dégâts doublés sous l’eau' })
    expect(b).toMatchObject({ cout: 6, origine: 'race' })
    updateSkill(a, { cout: -3 })
    expect(a.cout).toBe(0)
    updateSkill(a, { cout: null })
    expect(a.cout).toBeNull()
    expect(a.origine).toBe('fruit')
    expect(moveItem(c.competences, 1, -1)).toBe(true)
    expect(c.competences.map(s => s.titre)).toEqual(['Karaté des hommes-poissons', 'Gomu Gomu no Pistol'])
    removeById(c.competences, a.id)
    expect(c.competences).toEqual([b])
  })

  it('filtre par origine ; seules les origines utilisées sont proposées, dans l’ordre fixe', () => {
    const c: { competences: Skill[] } = { competences: [] }
    addSkill(c, 'Haki de l’Armement', 'haki')
    addSkill(c, 'Coup de chance', 'fruit')
    addSkill(c, 'Sans origine')
    addSkill(c, 'Veine', 'fruit')
    expect(filterSkills(c.competences, 'toutes')).toHaveLength(4)
    expect(filterSkills(c.competences, 'fruit').map(s => s.titre)).toEqual(['Coup de chance', 'Veine'])
    expect(filterSkills(c.competences, 'combat')).toEqual([])
    expect(usedOrigins(c.competences)).toEqual(['fruit', 'haki'])
  })

  it('libellés des origines', () => {
    expect(skillOriginLabel('combat')).toBe('Style de combat')
    expect(skillOriginLabel('combat', true)).toBe('Combat')
    expect(skillOriginLabel('')).toBe('')
  })
})
