import { clampInt } from './numbers'

// Haki (REGLES §7, Q-R4, D-M9) : avant la maîtrise, le MJ lance un D100 et applique la table du type. Règle propre
// au MJ : relevée dans le journal de session de l'appli MJ, jamais dans Vivre Card.

export const HAKI_TYPES = [
  ['observation', 'Observation'],
  ['armement', 'Armement'],
  ['rois', 'Rois'],
] as const
export type HakiType = (typeof HAKI_TYPES)[number][0]

export const isHakiType = (v: unknown): v is HakiType => HAKI_TYPES.some(([k]) => k === v)
export const hakiLabel = (t: HakiType) => HAKI_TYPES.find(([k]) => k === t)?.[1] ?? t

interface Row {
  /** Borne haute du D100 (incluse). */
  max: number
  effet: string
}

/** Table du D100 par type, dans l'ordre des résultats. */
export const HAKI_TABLE: Record<HakiType, readonly Row[]> = {
  observation: [
    { max: 20, effet: '+10 Perception, 3 tours' },
    { max: 50, effet: '+5 Perception, 1 tour' },
    { max: 75, effet: 'affinité naissante' },
    { max: 100, effet: 'rien' },
  ],
  armement: [
    { max: 15, effet: '+10 armure et +10 Robustesse, 3 tours' },
    { max: 40, effet: '+5 Robustesse, 1 tour' },
    { max: 70, effet: 'sensibilité' },
    { max: 100, effet: 'rien' },
  ],
  rois: [
    { max: 2, effet: 'activation : les ennemis proches font un jet de Volonté ou tombent inconscients' },
    { max: 5, effet: 'réveil latent' },
    { max: 100, effet: 'rien' },
  ],
}

/** « Meilleur résultat » : borne haute (1–20, 1–15, 1–5). */
export const HAKI_BEST: Record<HakiType, number> = { observation: 20, armement: 15, rois: 5 }

/** Meilleurs résultats nécessaires pour la maîtrise par les jets du MJ (sinon : entraînement ou conditions narratives). */
export const HAKI_MASTERY: Record<HakiType, number> = { observation: 5, armement: 5, rois: 1 }

/** Résultat d'un D100 ramené à 1..100. */
export const clampD100 = (n: number) => clampInt(n, 1, 100)

export interface HakiResult {
  effet: string
  /** Fourchette de la ligne de la table (« 1–20 »). */
  range: string
  best: boolean
}

/** Effet de la table pour un résultat du D100, et s'il s'agit d'un meilleur résultat. */
export function hakiEffect(type: HakiType, d100: number): HakiResult {
  const n = clampD100(d100)
  const rows = HAKI_TABLE[type]
  const i = rows.findIndex(r => n <= r.max)
  const row = rows[i]
  const min = i ? rows[i - 1].max + 1 : 1
  return { effet: row.effet, range: `${min}–${row.max}`, best: n <= HAKI_BEST[type] }
}

export interface HakiRoll {
  type: HakiType
  resultat: number
  /** Numéro de la session du jet. */
  session: number
}

export interface HakiTally {
  type: HakiType
  jets: number
  meilleurs: number
  /** Meilleurs résultats nécessaires pour la maîtrise par les jets. */
  objectif: number
  /** Maîtrise atteinte par les jets du MJ (le MJ l'annonce au joueur). */
  maitrise: boolean
  /** Sessions des meilleurs résultats, dans l'ordre des jets. */
  sessions: number[]
}

/** Récapitulatif des jets d'un PJ par type (fiche du PJ, D-M9) ; seuls les types déjà lancés. */
export function hakiTally(rolls: readonly HakiRoll[]): HakiTally[] {
  return HAKI_TYPES.flatMap(([type]) => {
    const mine = rolls.filter(r => r.type === type)
    if (!mine.length) return []
    const best = mine.filter(r => hakiEffect(type, r.resultat).best)
    return [{ type, jets: mine.length, meilleurs: best.length, objectif: HAKI_MASTERY[type], maitrise: best.length >= HAKI_MASTERY[type], sessions: best.map(r => r.session) }]
  })
}
