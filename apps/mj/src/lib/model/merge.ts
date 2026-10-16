import type { Entity } from './entity'
import { WIKI_LINK, wikiLink } from './links'
import { ORPHANS, relationIds } from './props'
import { TYPE_DEFS, type FieldDef } from './types'

// Fusion de deux fiches (cahier §4.7, D-M8) : la fiche gardée reçoit le nom de l'autre en alias, son texte
// sous « Repris de … », ses propriétés là où elle n'en a pas ; les valeurs contradictoires sont choisies par
// le MJ. Les liens vers la fiche absorbée sont redirigés vers la fiche gardée, puis l'absorbée est archivée.

export interface MergeConflict {
  key: string
  label: string
  keep: unknown
  other: unknown
}

const empty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
/** Champs dont les valeurs s'additionnent au lieu de s'opposer. */
const isList = (f: FieldDef) => f.field.kind === 'multiselect' || (f.field.kind === 'relation' && f.field.multiple)

/** Propriétés présentes des deux côtés avec des valeurs différentes (hors listes, qui s'additionnent). */
export function mergeConflicts(keep: Entity, other: Entity): MergeConflict[] {
  return TYPE_DEFS[keep.type].fields
    .filter(f => !isList(f) && !empty(keep.props[f.key]) && !empty(other.props[f.key]))
    .filter(f => !same(keep.props[f.key], other.props[f.key]))
    .map(f => ({ key: f.key, label: f.label, keep: keep.props[f.key], other: other.props[f.key] }))
}

/**
 * Fusionne `other` dans `keep` (modifie les deux fiches). `takeOther` : clés des conflits pour lesquelles le MJ
 * garde la valeur de `other`. Les propriétés de `other` inconnues du type de `keep` rejoignent ses orphelines.
 */
export function mergeInto(keep: Entity, other: Entity, takeOther: ReadonlySet<string> = new Set()): void {
  const names = [other.title, ...other.aliases, ...keep.aliases].filter(n => n.trim() && n !== keep.title)
  keep.aliases = [...new Set(names)]
  keep.tags = [...new Set([...keep.tags, ...other.tags])]
  keep.pinned ||= other.pinned

  const fields = TYPE_DEFS[keep.type].fields
  for (const f of fields) {
    const a = keep.props[f.key]
    const b = other.props[f.key]
    if (empty(b)) continue
    if (isList(f)) keep.props[f.key] = [...new Set([...relationIds(a), ...relationIds(b)])]
    else if (empty(a) || takeOther.has(f.key)) keep.props[f.key] = b
  }
  const known = new Set(fields.map(f => f.key))
  const orphans = { ...((other.props[ORPHANS] as Record<string, unknown>) ?? {}) }
  for (const [k, v] of Object.entries(other.props)) if (k !== ORPHANS && !known.has(k) && !empty(v)) orphans[k] = v
  if (Object.keys(orphans).length) {
    keep.props[ORPHANS] = { ...orphans, ...((keep.props[ORPHANS] as Record<string, unknown>) ?? {}) }
  }

  if (other.bodyMd.trim()) {
    const sep = keep.bodyMd.trim() ? '\n\n' : ''
    keep.bodyMd = `${keep.bodyMd.trimEnd()}${sep}## Repris de ${other.title}\n\n${other.bodyMd.trim()}\n`
  }
  // La fiche gardée ne se cite pas elle-même.
  redirectLinks(keep, other.id, keep.id)

  other.archived = true
  other.pinned = false
  const note = `Fiche fusionnée dans ${wikiLink(keep.id, keep.title)}.`
  other.bodyMd = other.bodyMd.trim() ? `${note}\n\n${other.bodyMd}` : note
}

/**
 * Redirige les liens d'une fiche de `fromId` vers `toId` (relations et mentions) ; un lien qui viserait la
 * fiche elle-même est retiré des relations. Renvoie true si la fiche a changé.
 */
export function redirectLinks(e: Entity, fromId: string, toId: string): boolean {
  let changed = false
  for (const f of TYPE_DEFS[e.type].fields) {
    if (f.field.kind !== 'relation') continue
    const ids = relationIds(e.props[f.key])
    if (!ids.includes(fromId)) continue
    const next = [...new Set(ids.map(id => (id === fromId ? toId : id)))].filter(id => id !== e.id)
    if (!next.length) delete e.props[f.key]
    else e.props[f.key] = f.field.multiple ? next : next[0]
    changed = true
  }
  const body = e.bodyMd.replace(WIKI_LINK, (all, target: string, label: string) =>
    target.trim() === fromId ? wikiLink(toId, label) : all,
  )
  if (body !== e.bodyMd) {
    e.bodyMd = body
    changed = true
  }
  if (e.parentId === fromId) {
    e.parentId = toId === e.id ? null : toId
    changed = true
  }
  return changed
}
