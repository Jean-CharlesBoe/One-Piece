import { describe, expect, it } from 'vitest'
import { createEntity } from './entity'
import { mergeConflicts, mergeInto, redirectLinks } from './merge'
import { ORPHANS } from './props'
import { compareNames, editDistance, nearNames, similarPairs } from './similar'

const entry = (id: string, type: string, title: string, aliases: string[] = []) => ({ id, type, title, aliases })

describe('doublons probables', () => {
  it('distance d’édition, arrêtée au-delà du maximum', () => {
    expect(editDistance('skypieen', 'skypieens')).toBe(1)
    expect(editDistance('drake', 'drake')).toBe(0)
    expect(editDistance('abcdef', 'uvwxyz', 2)).toBe(3)
  })

  it('critères : même nom, faute ou pluriel, mêmes mots, contenu (même type seulement)', () => {
    expect(compareNames('skypieens', 'skypieens', false)).toBe('meme-nom')
    expect(compareNames('skypieen', 'skypieens', false)).toBe('proche')
    expect(compareNames('dracule mihawk', 'mihawk dracule', false)).toBe('memes-mots')
    expect(compareNames('marine', 'qg de la marine', true)).toBe('contenu')
    expect(compareNames('marine', 'qg de la marine', false)).toBeNull()
    expect(compareNames('ace', 'axe', false)).toBeNull() // trop court pour une faute
    expect(compareNames('luffy', 'zoro', false)).toBeNull()
    // Nombres différents : des choses différentes.
    expect(compareNames('annee 1500', 'annee 1504', true)).toBeNull()
    expect(compareNames('session 1', 'session 12', true)).toBeNull()
    expect(compareNames('scenario 1', 'scenarios 1', true)).toBe('proche')
  })

  it('paires, triées par force, sans les paires écartées', () => {
    const entries = [
      entry('1', 'race', 'Skypiéens', ['Anges']),
      entry('2', 'note', 'Skypieen'),
      entry('3', 'race', 'anges'),
      entry('4', 'faction', 'Marine'),
    ]
    const pairs = similarPairs(entries)
    expect(pairs.map(p => [p.a.id, p.b.id, p.reason])).toEqual([
      ['1', '3', 'meme-nom'],
      ['1', '2', 'proche'],
    ])
    expect(pairs[0].names).toEqual(['Anges', 'anges'])
    expect(similarPairs(entries, new Set(['1|3'])).map(p => p.b.id)).toEqual(['2'])
  })

  it('noms proches d’un nom saisi, sans les noms identiques', () => {
    const entries = [entry('1', 'race', 'Skypiéens'), entry('2', 'race', 'Mink')]
    expect(nearNames('Skypiéen', entries).map(e => e.id)).toEqual(['1'])
    expect(nearNames('skypiéens', entries)).toEqual([])
  })
})

describe('fusion', () => {
  function pair() {
    const keep = createEntity('race', 'Skypiéens')
    keep.props = { avantage: 'Ailes', vitaliteBase: 10 }
    keep.bodyMd = 'Peuple du ciel.'
    keep.tags = ['ciel']
    const other = createEntity('race', 'Anges')
    other.aliases = ['Habitants du ciel']
    other.props = { vitaliteBase: 12, desavantage: 'Fragiles', couleur: 'blanc' }
    other.bodyMd = `Voir [[${keep.id}|Skypiéens]].`
    other.tags = ['ciel', 'import']
    return { keep, other }
  }

  it('conflits : valeurs différentes des deux côtés seulement', () => {
    const { keep, other } = pair()
    expect(mergeConflicts(keep, other)).toEqual([{ key: 'vitaliteBase', label: 'Vitalité de base', keep: 10, other: 12 }])
  })

  it('alias, étiquettes, propriétés comblées, choix des conflits, texte repris, absorbée archivée', () => {
    const { keep, other } = pair()
    mergeInto(keep, other, new Set(['vitaliteBase']))
    expect(keep.aliases).toEqual(['Anges', 'Habitants du ciel'])
    expect(keep.tags).toEqual(['ciel', 'import'])
    expect(keep.props).toEqual({ avantage: 'Ailes', desavantage: 'Fragiles', vitaliteBase: 12, [ORPHANS]: { couleur: 'blanc' } })
    expect(keep.bodyMd).toBe(`Peuple du ciel.\n\n## Repris de Anges\n\nVoir [[${keep.id}|Skypiéens]].\n`)
    expect(other.archived).toBe(true)
    expect(other.bodyMd.startsWith(`Fiche fusionnée dans [[${keep.id}|Skypiéens]].`)).toBe(true)
  })

  it('redirection des liens : relations sans doublon, mentions, page parente', () => {
    const smoker = createEntity('personnage', 'Smoker')
    smoker.props = { race: 'anges', factions: ['a', 'anges'] }
    smoker.bodyMd = '[[anges|Anges du ciel]] et [[autre|Autre]]'
    smoker.parentId = 'anges'
    expect(redirectLinks(smoker, 'anges', 'sky')).toBe(true)
    expect(smoker.props).toEqual({ race: 'sky', factions: ['a', 'sky'] })
    expect(smoker.bodyMd).toBe('[[sky|Anges du ciel]] et [[autre|Autre]]')
    expect(smoker.parentId).toBe('sky')
    expect(redirectLinks(smoker, 'anges', 'sky')).toBe(false)
  })
})
