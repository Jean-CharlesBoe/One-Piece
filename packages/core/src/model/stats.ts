// Les 8 caracs, communes aux PJ (Vivre Card), aux compagnons et aux PNJ (appli MJ).
// Ordre d'affichage repris de Sans Nom (grille 3 + 3 + 2). Voir REGLES_ONE_PIECE.md §2.

export const STATS = [
  ['robustesse', 'Robustesse'],
  ['adresse', 'Adresse'],
  ['finesse', 'Finesse'],
  ['intellect', 'Intellect'],
  ['volonte', 'Volonté'],
  ['savoirfaire', 'Savoir-faire'],
  ['expression', 'Expression'],
  ['perception', 'Perception'],
] as const

export type StatKey = (typeof STATS)[number][0]

export const STAT_KEYS: readonly StatKey[] = STATS.map(([k]) => k)

export function statLabel(key: StatKey): string {
  return STATS.find(([k]) => k === key)![1]
}

export function isStatKey(v: unknown): v is StatKey {
  return typeof v === 'string' && (STAT_KEYS as readonly string[]).includes(v)
}

export interface Stat {
  valeur: number
  /** Positif : avantages. Négatif : désavantages. Effet exact : voir Q-R1. */
  avantages: number
}

export type Stats = Record<StatKey, Stat>

/** Bonus ou malus temporaire sur une carac, sans durée : retiré à la main. */
export interface TempBonus {
  id: string
  carac: StatKey
  valeur: number
  origine: string
}

/** Caracs à 0 : à la création, les 40 points se répartissent à partir de zéro (REGLES §4). */
export function emptyStats(valeur = 0): Stats {
  return Object.fromEntries(STAT_KEYS.map(k => [k, { valeur, avantages: 0 }])) as Stats
}
