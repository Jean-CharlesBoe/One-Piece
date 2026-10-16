import { LIMITS, read } from '@onepiece/core'
import type { Entity } from './entity'
import { isEntityType, TYPE_DEFS } from './types'

// Toute fiche lue (base, sauvegarde .opmj, import Notion) passe par ici : champs manquants complétés,
// colonnes JSON illisibles remplacées, rien n'est levé. `warnings` décrit en français ce qui a été corrigé.

/** Texte JSON stocké en colonne (aliases, tags, props) ou valeur déjà décodée. */
function json(v: unknown): unknown {
  if (typeof v !== 'string') return v
  try {
    return JSON.parse(v)
  } catch {
    return undefined
  }
}

const strings = (v: unknown): string[] =>
  read
    .arr(json(v))
    .filter((s): s is string => typeof s === 'string')
    .map(s => s.trim().slice(0, LIMITS.textShort))
    .filter(Boolean)

const bool = (v: unknown): boolean => v === true || v === 1 || v === '1'
const nullableStr = (v: unknown): string | null => (typeof v === 'string' && v ? v : null)

/** Accepte les noms de colonnes SQL (snake_case) ou ceux du modèle (camelCase). */
export function normalizeEntity(raw: unknown): { entity: Entity; warnings: string[] } {
  const r = read.obj(raw)
  const w: string[] = []
  const pick = (camel: string, snake: string) => (r[camel] !== undefined ? r[camel] : r[snake])

  const title = read.str(r.title, LIMITS.textShort).trim() || 'Sans titre'
  let type = r.type
  if (!isEntityType(type)) {
    w.push(`« ${title} » : type inconnu « ${String(type)} », fiche rangée en ${TYPE_DEFS.note.label}`)
    type = 'note'
  }
  const rawProps = json(r.props)
  if (r.props !== undefined && read.obj(rawProps) !== rawProps) w.push(`« ${title} » : propriétés illisibles ignorées`)
  const created = read.date(pick('createdAt', 'created_at')) ?? new Date().toISOString()

  return {
    entity: {
      id: read.id(r.id),
      type: type as Entity['type'],
      title,
      aliases: strings(r.aliases),
      parentId: nullableStr(pick('parentId', 'parent_id')),
      sortOrder: read.num(pick('sortOrder', 'sort_order'), 0),
      props: read.obj(rawProps),
      bodyMd: read.str(pick('bodyMd', 'body_md'), LIMITS.textChapter),
      tags: strings(r.tags),
      coverAsset: nullableStr(pick('coverAsset', 'cover_asset')),
      pinned: bool(r.pinned),
      archived: bool(r.archived),
      notionId: nullableStr(pick('notionId', 'notion_id')),
      createdAt: created,
      updatedAt: read.date(pick('updatedAt', 'updated_at')) ?? created,
    },
    warnings: w,
  }
}
