import { nameKey, type NamedEntry } from './links'

// Doublons probables (D-M8, cahier §4.7) : deux fiches dont un nom (titre ou alias) est proche d'un nom de
// l'autre. Trois critères : même nom (casse et accents près), petite faute de frappe ou pluriel (distance
// d'édition), mêmes mots dans un autre ordre, ou un nom contenu dans l'autre (même type de fiche seulement :
// « Marine » est contenu dans « QG de la Marine » sans être la même chose).

export type SimilarReason = 'meme-nom' | 'proche' | 'memes-mots' | 'contenu'

export const REASON_LABEL: Record<SimilarReason, string> = {
  'meme-nom': 'même nom',
  proche: 'noms presque identiques',
  'memes-mots': 'mêmes mots',
  contenu: "un nom contient l'autre",
}

export interface SimilarEntry extends NamedEntry {
  type: string
}

export interface SimilarPair<T extends SimilarEntry> {
  a: T
  b: T
  reason: SimilarReason
  /** Les deux noms qui se ressemblent. */
  names: [string, string]
}

/** Distance d'édition (Levenshtein), arrêtée dès qu'elle dépasse `max`. */
export function editDistance(a: string, b: string, max = Infinity): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      best = Math.min(best, cur[j])
    }
    if (best > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

const words = (k: string) => k.split(/[^\p{L}\p{N}]+/u).filter(Boolean)

/** Distance tolérée selon la longueur : rien sous 5 lettres, 1 jusqu'à 8, 2 au-delà. */
const tolerance = (len: number) => (len < 5 ? 0 : len <= 8 ? 1 : 2)

/** Comment deux noms (déjà passés par `nameKey`) se ressemblent, ou `null`. */
export function compareNames(a: string, b: string, sameType: boolean): SimilarReason | null {
  if (!a || !b) return null
  if (a === b) return 'meme-nom'
  const tol = tolerance(Math.min(a.length, b.length))
  if (tol && editDistance(a, b, tol) <= tol) return 'proche'
  const wa = words(a)
  const wb = words(b)
  if (wa.length > 1 && wa.length === wb.length && [...wa].sort().join(' ') === [...wb].sort().join(' ')) return 'memes-mots'
  if (sameType) {
    const [short, long] = wa.length <= wb.length ? [wa, wb] : [wb, wa]
    const s = short.join(' ')
    if (s.length >= 4 && ` ${long.join(' ')} `.includes(` ${s} `)) return 'contenu'
  }
  return null
}

const ORDER: SimilarReason[] = ['meme-nom', 'proche', 'memes-mots', 'contenu']

/** Paires de doublons probables, hors paires écartées par le MJ (`ignored` : clés « idA|idB », idA < idB). */
export function similarPairs<T extends SimilarEntry>(entries: readonly T[], ignored: ReadonlySet<string> = new Set()): SimilarPair<T>[] {
  const named = entries.map(e => ({ e, keys: [e.title, ...e.aliases].map(n => [n, nameKey(n)] as const) }))
  const out: SimilarPair<T>[] = []
  for (let i = 0; i < named.length; i++) {
    for (let j = i + 1; j < named.length; j++) {
      const [x, y] = named[i].e.id < named[j].e.id ? [named[i], named[j]] : [named[j], named[i]]
      if (ignored.has(`${x.e.id}|${y.e.id}`)) continue
      let found: { reason: SimilarReason; names: [string, string] } | null = null
      for (const [nx, kx] of x.keys) {
        for (const [ny, ky] of y.keys) {
          const r = compareNames(kx, ky, x.e.type === y.e.type)
          if (r && (!found || ORDER.indexOf(r) < ORDER.indexOf(found.reason))) found = { reason: r, names: [nx, ny] }
        }
      }
      if (found) out.push({ a: x.e, b: y.e, ...found })
    }
  }
  return out.sort((p, q) => ORDER.indexOf(p.reason) - ORDER.indexOf(q.reason) || p.a.title.localeCompare(q.a.title, 'fr'))
}

/** Fiches dont un nom ressemble à `name` sans lui être identique (pour « Ajouter comme alias »). */
export function nearNames<T extends SimilarEntry>(name: string, entries: readonly T[], type?: string): T[] {
  const k = nameKey(name)
  if (k.length < 3) return []
  return entries.filter(e =>
    [e.title, ...e.aliases].some(n => {
      const r = compareNames(k, nameKey(n), e.type === type)
      return r !== null && r !== 'meme-nom'
    }) && ![e.title, ...e.aliases].some(n => nameKey(n) === k),
  )
}
