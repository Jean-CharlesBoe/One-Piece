import { describe, expect, it } from 'vitest'
import {
  back,
  canBack,
  canForward,
  closeTab,
  cycleTab,
  currentId,
  emptyNavigation,
  forget,
  forward,
  MAX_TABS,
  moveTab,
  normalizeNavigation,
  openIn,
} from './navigation'

describe('onglets et historique', () => {
  it('un clic remplace la fiche de l’onglet, avec historique ; « nouvel onglet » en ajoute un', () => {
    const n = emptyNavigation()
    openIn(n, 'a', false)
    openIn(n, 'b', false)
    openIn(n, 'b', false)
    expect(n.tabs).toHaveLength(1)
    expect(n.tabs[0].history).toEqual(['a', 'b'])
    openIn(n, 'c', true)
    expect(n.tabs).toHaveLength(2)
    expect(currentId(n)).toBe('c')
    expect(currentId(n, 0)).toBe('b')
  })

  it('précédent / suivant, et une nouvelle fiche efface la suite', () => {
    const n = emptyNavigation()
    for (const id of ['a', 'b', 'c']) openIn(n, id, false)
    back(n)
    back(n)
    expect(currentId(n)).toBe('a')
    expect(canBack(n)).toBe(false)
    forward(n)
    expect(currentId(n)).toBe('b')
    expect(canForward(n)).toBe(true)
    openIn(n, 'd', false)
    expect(n.tabs[0].history).toEqual(['a', 'b', 'd'])
    expect(canForward(n)).toBe(false)
  })

  it('8 onglets au plus : le plus ancien se ferme', () => {
    const n = emptyNavigation()
    for (let i = 0; i <= MAX_TABS; i++) openIn(n, `f${i}`, true)
    expect(n.tabs).toHaveLength(MAX_TABS)
    expect(currentId(n, 0)).toBe('f1')
    expect(currentId(n)).toBe(`f${MAX_TABS}`)
  })

  it('fermer un onglet : l’actif reste sur une fiche cohérente', () => {
    const n = emptyNavigation()
    for (const id of ['a', 'b', 'c']) openIn(n, id, true)
    n.active = 1
    closeTab(n, 0)
    expect(currentId(n)).toBe('b')
    closeTab(n, 1)
    expect(currentId(n)).toBe('b')
    closeTab(n, 0)
    expect(n.active).toBe(-1)
    expect(currentId(n)).toBeNull()
  })

  it('fiche supprimée : retirée des historiques, onglet vide fermé', () => {
    const n = emptyNavigation()
    for (const id of ['a', 'x', 'a', 'b']) openIn(n, id, false)
    openIn(n, 'x', true)
    forget(n, id => id !== 'x')
    expect(n.tabs).toHaveLength(1)
    expect(n.tabs[0].history).toEqual(['a', 'b'])
    expect(currentId(n)).toBe('b')
  })

  it('relecture prudente de l’état sauvegardé', () => {
    expect(normalizeNavigation(null)).toEqual(emptyNavigation())
    const n = normalizeNavigation({ tabs: [{ history: ['a', 3, 'b'], index: 9 }, { history: [] }, 'x'], active: 5 })
    expect(n).toEqual({ tabs: [{ history: ['a', 'b'], index: 1 }], active: 0 })
  })

  it('glisser un onglet : l’onglet actif reste actif', () => {
    const n = emptyNavigation()
    for (const id of ['a', 'b', 'c', 'd']) openIn(n, id, true)
    n.active = 1 // b
    moveTab(n, 0, 3) // a à la fin
    expect(n.tabs.map(t => t.history[0])).toEqual(['b', 'c', 'd', 'a'])
    expect(currentId(n)).toBe('b')
    moveTab(n, 0, 2) // l'actif lui-même
    expect(n.tabs.map(t => t.history[0])).toEqual(['c', 'd', 'b', 'a'])
    expect(n.active).toBe(2)
    moveTab(n, 3, 0)
    expect(currentId(n)).toBe('b')
    expect(n.active).toBe(3)
    moveTab(n, -1, 2)
    moveTab(n, 1, 9)
    expect(n.tabs.map(t => t.history[0])).toEqual(['a', 'c', 'd', 'b'])
  })

  it('onglet suivant / précédent en boucle', () => {
    const n = emptyNavigation()
    cycleTab(n, 1)
    expect(n.active).toBe(-1)
    openIn(n, 'a', true)
    cycleTab(n, 1)
    expect(n.active).toBe(0)
    openIn(n, 'b', true)
    openIn(n, 'c', true)
    cycleTab(n, 1)
    expect(n.active).toBe(0)
    cycleTab(n, -1)
    expect(n.active).toBe(2)
    cycleTab(n, -1)
    expect(n.active).toBe(1)
  })
})
