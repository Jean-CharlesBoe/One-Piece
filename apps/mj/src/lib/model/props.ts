import { LIMITS, read } from '@onepiece/core'
import type { Entity } from './entity'
import { TYPE_DEFS, type EntityType, type FieldDef } from './types'

// Propriétés d'une fiche (`props`), décrites par le registre des types.
// Forme normalisée : seules les valeurs non vides sont gardées ; une relation simple est un identifiant,
// une relation multiple une liste d'identifiants. Une clé que le type ne connaît pas (après un changement
// de type, ou venue de l'import) n'est jamais perdue : elle est rangée dans `_orphelines` (MODELE_DONNEES §3).

export const ORPHANS = '_orphelines'

export type Props = Record<string, unknown>

const isEmpty = (v: unknown) =>
  v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)

const cleanStrings = (v: unknown, max: number): string[] => {
  const list = Array.isArray(v) ? v : typeof v === 'string' ? [v] : []
  return [...new Set(list.filter((s): s is string => typeof s === 'string').map(s => s.trim().slice(0, max)).filter(Boolean))]
}

/** Valeur d'un champ ramenée à sa forme normalisée ; `undefined` si vide ou inutilisable. */
export function normalizeValue(def: FieldDef, raw: unknown, w: string[], who: string): unknown {
  if (isEmpty(raw)) return undefined
  const f = def.field
  switch (f.kind) {
    case 'text':
      return typeof raw === 'string' || typeof raw === 'number' ? String(raw).trim().slice(0, LIMITS.textMedium) || undefined : undefined
    case 'longtext':
      return typeof raw === 'string' ? raw.slice(0, LIMITS.textLong) || undefined : undefined
    case 'number': {
      const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw.replace(/[\s  ]/g, '').replace(',', '.')) : NaN
      if (Number.isFinite(n)) return n
      w.push(`${who}${def.label} « ${String(raw)} » n'est pas un nombre : ignoré`)
      return undefined
    }
    case 'select': {
      const s = typeof raw === 'string' ? raw.trim() : Array.isArray(raw) && typeof raw[0] === 'string' ? raw[0].trim() : ''
      if (!s) return undefined
      // Une valeur hors liste (import, ancienne liste) est gardée et signalée plutôt que perdue.
      if (!f.options.includes(s)) w.push(`${who}${def.label} « ${s} » ne fait pas partie de la liste`)
      return s.slice(0, LIMITS.textShort)
    }
    case 'multiselect': {
      const list = cleanStrings(raw, LIMITS.textShort)
      return list.length ? list : undefined
    }
    case 'relation': {
      const ids = cleanStrings(raw, LIMITS.textShort)
      if (!ids.length) return undefined
      return f.multiple ? ids : ids[0]
    }
    case 'gameBlock':
      return read.obj(raw) === raw ? raw : undefined
    case 'asset':
      return typeof raw === 'string' ? raw : undefined
  }
}

/**
 * Normalise les propriétés pour un type : valeurs de chaque champ, clés inconnues → `_orphelines`.
 * Une orpheline redevient une propriété si le type la connaît de nouveau (retour à l'ancien type).
 */
export function normalizeProps(type: EntityType, raw: unknown, w: string[] = [], who = ''): Props {
  const r = read.obj(raw)
  const orphansIn = read.obj(r[ORPHANS])
  const out: Props = {}
  const orphans: Props = {}
  const defs = TYPE_DEFS[type].fields
  for (const def of defs) {
    const v = normalizeValue(def, r[def.key] ?? orphansIn[def.key], w, who)
    if (v !== undefined) out[def.key] = v
  }
  const known = new Set(defs.map(d => d.key))
  for (const [k, v] of [...Object.entries(orphansIn), ...Object.entries(r)]) {
    if (k === ORPHANS || known.has(k) || isEmpty(v)) continue
    orphans[k] = v
  }
  if (Object.keys(orphans).length) out[ORPHANS] = orphans
  return out
}

/** Change le type d'une fiche : propriétés communes gardées, les autres en orphelines. Modifie la fiche reçue. */
export function changeType(e: Entity, type: EntityType): Entity {
  e.props = normalizeProps(type, e.props)
  e.type = type
  return e
}

/** Supprime une propriété orpheline. */
export function removeOrphan(e: Entity, key: string): void {
  const o = read.obj(e.props[ORPHANS])
  delete o[key]
  if (!Object.keys(o).length) delete e.props[ORPHANS]
}

/** Identifiants des fiches liées par un champ relation (0, 1 ou plusieurs). */
export function relationIds(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : typeof v === 'string' ? [v] : []
}

/** Texte lisible d'une valeur ; `titleOf` donne le titre d'une fiche liée. */
export function displayValue(def: FieldDef, v: unknown, titleOf: (id: string) => string): string {
  if (isEmpty(v)) return ''
  switch (def.field.kind) {
    case 'relation':
      return relationIds(v).map(titleOf).join(', ')
    case 'multiselect':
      return (v as string[]).join(', ')
    case 'number':
      return (v as number).toLocaleString('fr-FR')
    case 'gameBlock':
      return 'oui'
    default:
      return String(v)
  }
}

/** Sous-titre de la fiche : les champs marqués `inSubtitle` (ex. « PNJ · En vie · Marine »). */
export function subtitle(e: Pick<Entity, 'type' | 'props'>, titleOf: (id: string) => string): string {
  return TYPE_DEFS[e.type].fields
    .filter(f => f.inSubtitle)
    .map(f => displayValue(f, e.props[f.key], titleOf))
    .filter(Boolean)
    .join(' · ')
}
