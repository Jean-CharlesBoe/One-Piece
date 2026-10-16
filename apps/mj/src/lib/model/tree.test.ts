import { describe, expect, it } from 'vitest'
import { renameLinks } from './links'
import { canMoveUnder, descendants } from './tree'

const nodes = [
  { id: 'scenario', parentId: null },
  { id: 'ile', parentId: 'scenario' },
  { id: 'enigme', parentId: 'ile' },
  { id: 'autre', parentId: null },
]

describe('pages enfants', () => {
  it('descendants sur plusieurs niveaux', () => {
    expect([...descendants('scenario', nodes)].sort()).toEqual(['enigme', 'ile'])
    expect(descendants('enigme', nodes).size).toBe(0)
  })

  it('pas de déplacement sous soi-même ni sous une de ses sous-pages', () => {
    expect(canMoveUnder('scenario', 'enigme', nodes)).toBe(false)
    expect(canMoveUnder('scenario', 'scenario', nodes)).toBe(false)
    expect(canMoveUnder('ile', 'autre', nodes)).toBe(true)
    expect(canMoveUnder('ile', null, nodes)).toBe(true)
  })

  it('résiste à une boucle déjà présente dans les données', () => {
    expect([...descendants('a', [{ id: 'a', parentId: 'b' }, { id: 'b', parentId: 'a' }])].sort()).toEqual(['a', 'b'])
  })
})

describe('renommage', () => {
  it('met à jour les liens affichés sous l’ancien titre, laisse les autres textes', () => {
    const md = '[[s1|Smoker]], [[s1|le capitaine]], [[s2|Smoker]] et [[s1| Smoker ]].'
    expect(renameLinks(md, 's1', 'Smoker', 'Smoker le Chasseur blanc')).toBe(
      '[[s1|Smoker le Chasseur blanc]], [[s1|le capitaine]], [[s2|Smoker]] et [[s1|Smoker le Chasseur blanc]].',
    )
  })
})
