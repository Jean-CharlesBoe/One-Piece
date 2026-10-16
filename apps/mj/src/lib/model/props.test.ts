import { describe, expect, it } from 'vitest'
import { createEntity } from './entity'
import { computeLinks, nameKey, resolveMissing, sameName, wikiLink, wikiLinks } from './links'
import { changeType, normalizeProps, ORPHANS, removeOrphan, subtitle } from './props'
import { ENTITY_TYPES, TYPE_DEFS } from './types'

describe('registre', () => {
  it('clés uniques par type, relations vers des types connus', () => {
    for (const t of ENTITY_TYPES) {
      const keys = TYPE_DEFS[t].fields.map(f => f.key)
      expect(new Set(keys).size).toBe(keys.length)
      for (const f of TYPE_DEFS[t].fields) {
        if (f.field.kind === 'relation') for (const to of f.field.to) expect(ENTITY_TYPES).toContain(to)
      }
    }
  })
})

describe('propriétés', () => {
  it('normalise chaque genre de champ et retire les vides', () => {
    const w: string[] = []
    const p = normalizeProps(
      'personnage',
      {
        role: 'PNJ',
        etat: '',
        prime: '30 000 000',
        race: ['id-race'],
        factions: 'id-marine',
        technique: 'Sabre',
        classes: [],
      },
      w,
    )
    expect(p).toEqual({ role: 'PNJ', prime: 30000000, race: 'id-race', factions: ['id-marine'], technique: 'Sabre' })
    expect(w).toEqual([])
  })

  it('garde une valeur hors liste en la signalant ; ignore un nombre illisible', () => {
    const w: string[] = []
    expect(normalizeProps('personnage', { etat: 'Disparu', prime: 'beaucoup' }, w)).toEqual({ etat: 'Disparu' })
    expect(w).toHaveLength(2)
  })

  it('clés inconnues rangées en orphelines, jamais perdues', () => {
    expect(normalizeProps('note', { couleur: 'rouge', vide: '' })).toEqual({ [ORPHANS]: { couleur: 'rouge' } })
  })

  it('changement de type aller-retour sans perte', () => {
    const e = createEntity('note', 'Loguetown')
    e.props = { mer: 'East Blue', couleur: 'gris' }
    changeType(e, 'lieu')
    expect(e.type).toBe('lieu')
    expect(e.props).toEqual({ mer: 'East Blue', [ORPHANS]: { couleur: 'gris' } })
    changeType(e, 'personnage')
    expect(e.props).toEqual({ mer: 'East Blue', [ORPHANS]: { couleur: 'gris' } })
    changeType(e, 'faction')
    expect(e.props).toEqual({ [ORPHANS]: { mer: 'East Blue', couleur: 'gris' } })
    changeType(e, 'lieu')
    expect(e.props).toEqual({ mer: 'East Blue', [ORPHANS]: { couleur: 'gris' } })
    removeOrphan(e, 'couleur')
    expect(e.props).toEqual({ mer: 'East Blue' })
  })

  it('sous-titre : champs marqués, relations par leur titre', () => {
    const e = createEntity('personnage', 'Drake')
    e.props = { role: 'PNJ', etat: 'En vie', factions: ['m'], grade: 'Capitaine' }
    expect(subtitle(e, id => (id === 'm' ? 'Marine' : '?'))).toBe('PNJ · En vie · Marine')
  })
})

describe('liens', () => {
  it('lit et écrit la forme stockée', () => {
    expect(wikiLinks('Vu à [[a1|Loguetown]] avec [[?|Smoker]].')).toEqual([
      { id: 'a1', label: 'Loguetown' },
      { id: '?', label: 'Smoker' },
    ])
    expect(wikiLink('a1', 'Île [du] Sud|x')).toBe('[[a1|Île du Sud x]]')
  })

  it('lien rouge résolu après création de la fiche', () => {
    expect(resolveMissing('[[?|Smoker]] et [[?|Tashigi]]', 'Smoker', 's1')).toBe('[[s1|Smoker]] et [[?|Tashigi]]')
  })

  it('liens sortants : relations et mentions, sans doublon ni lien rouge ni lien vers soi', () => {
    const e = createEntity('personnage', 'Drake')
    e.props = { race: 'r', factions: ['f1', 'f2'] }
    e.bodyMd = `Né à [[l|Loguetown]], ami de [[f1|Marine]] et de [[?|Inconnu]]. Voir [[${e.id}|Drake]], [[l|Loguetown]].`
    expect(computeLinks(e)).toEqual([
      { toId: 'r', kind: 'race' },
      { toId: 'f1', kind: 'factions' },
      { toId: 'f2', kind: 'factions' },
      { toId: 'l', kind: 'mention' },
      { toId: 'f1', kind: 'mention' },
    ])
  })

  it('noms identiques à la casse et aux accents près (D-M8)', () => {
    expect(nameKey('  Skypiéens  du  Ciel ')).toBe('skypieens du ciel')
    const entries = [
      { id: '1', title: 'Skypiéens', aliases: ['Anges'] },
      { id: '2', title: 'Marine', aliases: [] },
    ]
    expect(sameName('ANGES', entries).map(e => e.id)).toEqual(['1'])
    expect(sameName('skypieens', entries, '1')).toEqual([])
    expect(sameName('', entries)).toEqual([])
  })
})
