import { describe, expect, it } from 'vitest'
import {
  closeTab,
  currentId,
  cycleTab,
  emptyNavigation,
  forget,
  moveTab,
  normalizeNavigation,
  openIn,
} from './navigation'

const open = (...ids: string[]) => {
  const n = emptyNavigation()
  for (const id of ids) openIn(n, id)
  return n
}

describe('onglets', () => {
  it('chaque fiche ouverte a son onglet, ajouté juste après l’onglet actif', () => {
    const n = open('a', 'b')
    expect(n.tabs).toEqual(['a', 'b'])
    expect(currentId(n)).toBe('b')
    n.active = 0
    openIn(n, 'c')
    expect(n.tabs).toEqual(['a', 'c', 'b'])
    expect(currentId(n)).toBe('c')
  })

  it('une fiche déjà ouverte : retour sur son onglet, pas de doublon', () => {
    const n = open('a', 'b', 'c')
    openIn(n, 'a')
    expect(n.tabs).toEqual(['a', 'b', 'c'])
    expect(n.active).toBe(0)
  })

  it('aucun onglet ne se ferme tout seul, même nombreux', () => {
    const n = emptyNavigation()
    for (let i = 0; i < 30; i++) openIn(n, `f${i}`)
    expect(n.tabs).toHaveLength(30)
    expect(currentId(n, 0)).toBe('f0')
    expect(currentId(n)).toBe('f29')
  })

  it('fermer un onglet : l’actif reste sur une fiche cohérente', () => {
    const n = open('a', 'b', 'c')
    n.active = 1
    closeTab(n, 0)
    expect(currentId(n)).toBe('b')
    closeTab(n, 1)
    expect(currentId(n)).toBe('b')
    closeTab(n, 0)
    expect(n.active).toBe(-1)
    expect(currentId(n)).toBeNull()
  })

  it('fiche supprimée : son onglet se ferme', () => {
    const n = open('a', 'x', 'b')
    forget(n, id => id !== 'x')
    expect(n.tabs).toEqual(['a', 'b'])
    expect(currentId(n)).toBe('b')
  })

  it('glisser un onglet : l’onglet actif reste actif', () => {
    const n = open('a', 'b', 'c', 'd')
    n.active = 1 // b
    moveTab(n, 0, 3) // a à la fin
    expect(n.tabs).toEqual(['b', 'c', 'd', 'a'])
    expect(currentId(n)).toBe('b')
    moveTab(n, 0, 2) // l'actif lui-même
    expect(n.tabs).toEqual(['c', 'd', 'b', 'a'])
    expect(n.active).toBe(2)
    moveTab(n, 3, 0)
    expect(currentId(n)).toBe('b')
    expect(n.active).toBe(3)
    moveTab(n, -1, 2)
    moveTab(n, 1, 9)
    expect(n.tabs).toEqual(['a', 'c', 'd', 'b'])
  })

  it('onglet suivant / précédent en boucle', () => {
    const n = emptyNavigation()
    cycleTab(n, 1)
    expect(n.active).toBe(-1)
    openIn(n, 'a')
    cycleTab(n, 1)
    expect(n.active).toBe(0)
    openIn(n, 'b')
    openIn(n, 'c')
    cycleTab(n, 1)
    expect(n.active).toBe(0)
    cycleTab(n, -1)
    expect(n.active).toBe(2)
    cycleTab(n, -1)
    expect(n.active).toBe(1)
  })

  it('relecture prudente de l’état sauvegardé', () => {
    expect(normalizeNavigation(null)).toEqual(emptyNavigation())
    expect(normalizeNavigation({ tabs: ['a', 3, 'b', 'a'], active: 9 })).toEqual({ tabs: ['a', 'b'], active: 1 })
  })

  it('relit l’ancien format (historique par onglet) : la fiche affichée de chaque onglet', () => {
    const n = normalizeNavigation({
      tabs: [{ history: ['x', 'a'], index: 1 }, { history: [] }, { history: ['a'] }, { history: ['b', 'c'], index: 0 }],
      active: 3,
    })
    expect(n).toEqual({ tabs: ['a', 'b'], active: 1 })
  })
})
