import { describe, expect, it } from 'vitest'
import { createEntity } from './entity'
import { normalizeEntity } from './normalize'
import { ENTITY_TYPES, TYPE_DEFS } from './types'

describe('fiches', () => {
  it('registre : un libellé par type', () => {
    expect(ENTITY_TYPES).toHaveLength(11)
    for (const t of ENTITY_TYPES) expect(TYPE_DEFS[t].type).toBe(t)
  })

  it('création : titre nettoyé, dates posées, ni épinglée ni archivée', () => {
    const e = createEntity('lieu', '  Île du Sud ')
    expect(e).toMatchObject({ type: 'lieu', title: 'Île du Sud', pinned: false, archived: false, props: {} })
    expect(e.createdAt).toBe(e.updatedAt)
  })

  it('aller-retour sans perte', () => {
    const e = createEntity('personnage', 'Drake')
    e.aliases = ['Capitaine Drake']
    e.props = { role: 'PNJ' }
    expect(normalizeEntity(JSON.parse(JSON.stringify(e)))).toEqual({ entity: e, warnings: [] })
  })

  it('lit une ligne SQL (snake_case, JSON en texte, booléens 0 / 1)', () => {
    const { entity, warnings } = normalizeEntity({
      id: 'a',
      type: 'race',
      title: 'Skypiéens',
      aliases: '["Anges"]',
      parent_id: null,
      sort_order: 2,
      props: '{"vitaliteBase":10}',
      body_md: 'Texte',
      tags: '[]',
      pinned: 1,
      archived: 0,
      created_at: '2026-10-12T10:00:00.000Z',
      updated_at: '2026-10-12T11:00:00.000Z',
    })
    expect(warnings).toEqual([])
    expect(entity).toMatchObject({
      aliases: ['Anges'],
      sortOrder: 2,
      props: { vitaliteBase: 10 },
      bodyMd: 'Texte',
      pinned: true,
      archived: false,
    })
    expect(entity.updatedAt).toBe('2026-10-12T11:00:00.000Z')
  })

  it('corrige sans lever : type inconnu, JSON illisible, titre vide', () => {
    const { entity, warnings } = normalizeEntity({ type: 'vaisseau', title: '', props: '{oups', aliases: 'x' })
    expect(entity.type).toBe('note')
    expect(entity.title).toBe('Sans titre')
    expect(entity.props).toEqual({})
    expect(entity.aliases).toEqual([])
    expect(warnings).toHaveLength(2)
  })
})
