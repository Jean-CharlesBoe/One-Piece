import type { Entity } from './entity'
import { relationIds } from './props'
import { TYPE_DEFS } from './types'

// Liens entre fiches (MODELE_DONNEES §1 et §4). Source de vérité : les relations des propriétés et les
// mentions `[[id|Titre]]` du texte. La table `links` en est dérivée à chaque enregistrement.

/** `[[id|Titre affiché]]` ; id `?` = lien vers une fiche qui n'existe pas encore (lien rouge). */
export const WIKI_LINK = /\[\[([^\]|\n]+)\|([^\]\n]*)\]\]/g
export const MISSING = '?'

export interface WikiLink {
  id: string
  label: string
}

export function wikiLinks(md: string): WikiLink[] {
  return [...md.matchAll(WIKI_LINK)].map(m => ({ id: m[1].trim(), label: m[2] }))
}

/** Forme stockée d'un lien (les crochets et la barre sont retirés du titre affiché). */
export function wikiLink(id: string, label: string): string {
  return `[[${id}|${label.replace(/[[\]|\n]/g, ' ').replace(/\s+/g, ' ').trim()}]]`
}

/** Remplace les liens rouges `[[?|label]]` portant ce titre par un lien vers la fiche créée. */
export function resolveMissing(md: string, label: string, id: string): string {
  return md.replace(WIKI_LINK, (all, target: string, l: string) =>
    target.trim() === MISSING && l.trim() === label.trim() ? wikiLink(id, l) : all,
  )
}

/** Texte brut d'un Markdown, pour la recherche : liens remplacés par leur titre, balisage retiré. */
export function plainText(md: string): string {
  return md
    .replace(WIKI_LINK, (_all, _id: string, label: string) => label)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_~`|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Renommage (cahier §4.3) : les liens vers la fiche `id` affichés sous l'ancien titre prennent le nouveau.
 * Un lien écrit avec un autre texte (« le capitaine ») est laissé tel quel.
 */
export function renameLinks(md: string, id: string, oldTitle: string, newTitle: string): string {
  return md.replace(WIKI_LINK, (all, target: string, label: string) =>
    target.trim() === id && label.trim() === oldTitle.trim() ? wikiLink(id, newTitle) : all,
  )
}

export interface LinkRow {
  toId: string
  /** 'mention' ou la clé de la propriété (« race », « factions »…). */
  kind: string
}

/** Liens sortants d'une fiche, sans doublon ni lien vers elle-même. */
export function computeLinks(e: Entity): LinkRow[] {
  const rows = new Map<string, LinkRow>()
  const add = (toId: string, kind: string) => {
    if (toId && toId !== MISSING && toId !== e.id) rows.set(`${toId}\u0000${kind}`, { toId, kind })
  }
  for (const def of TYPE_DEFS[e.type].fields) {
    if (def.field.kind === 'relation') for (const id of relationIds(e.props[def.key])) add(id, def.key)
  }
  for (const l of wikiLinks(e.bodyMd)) add(l.id, 'mention')
  return [...rows.values()]
}

/** Clé de comparaison des noms (D-M8) : sans casse, sans accents, espaces réduits. */
export function nameKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export interface NamedEntry {
  id: string
  title: string
  aliases: string[]
}

/** Fiches dont le titre ou un alias correspond à ce nom, à la casse et aux accents près. */
export function sameName<T extends NamedEntry>(name: string, entries: Iterable<T>, exceptId?: string): T[] {
  const k = nameKey(name)
  if (!k) return []
  const out: T[] = []
  for (const e of entries) {
    if (e.id !== exceptId && [e.title, ...e.aliases].some(n => nameKey(n) === k)) out.push(e)
  }
  return out
}
