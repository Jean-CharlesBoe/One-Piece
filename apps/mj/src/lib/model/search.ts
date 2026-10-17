import { nameKey } from './links'

// Recherche globale (cahier §4.5) : requête plein texte (index search_index, D-M11) et classement.
// Insensible à la casse et aux accents (tokenizer unicode61 « remove_diacritics »), chaque mot cherché en début
// de mot (« sky » trouve « Skypiéens »).

/** Mots de la recherche, réduits aux lettres et chiffres (la syntaxe de MATCH n'est jamais exposée). */
export function searchWords(q: string): string[] {
  return nameKey(q)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 8)
}

/** Expression MATCH (FTS4 ou FTS5) : tous les mots, chacun en préfixe. Vide si rien à chercher. */
export function ftsQuery(q: string): string {
  return searchWords(q)
    .map(w => `${w}*`)
    .join(' ')
}

/** Marqueurs de surlignage dans les extraits de l'index, remplacés par <mark> après échappement. */
export const MARK_START = '\u0001'
export const MARK_END = '\u0002'

const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Extrait de l'index → HTML sûr, mots trouvés en <mark>. */
export function snippetHtml(snippet: string): string {
  return esc(snippet).replaceAll(MARK_START, '<mark>').replaceAll(MARK_END, '</mark>')
}

export interface SearchHit {
  id: string
  /** Extrait HTML surligné (texte, propriétés ou alias), vide si seul le titre correspond. */
  snippet: string
}

export interface Ranked {
  id: string
  title: string
  aliases: string[]
}

/**
 * Ordre d'affichage : titre ou alias qui commence par la recherche, puis qui la contient, puis le reste
 * (trouvé dans le texte ou les propriétés) ; à égalité, par titre.
 */
export function rankScore(q: string, e: Ranked): number {
  const k = nameKey(q)
  const names = [e.title, ...e.aliases].map(nameKey)
  if (names.some(n => n === k)) return 0
  if (names.some(n => n.startsWith(k))) return 1
  if (names.some(n => n.includes(k))) return 2
  const words = searchWords(q)
  if (words.length && names.some(n => words.every(w => n.includes(w)))) return 3
  return 4
}
