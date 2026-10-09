/** Bornes de saisie. Le jeu n'impose pas de plafond aux caracs ; ces limites évitent seulement les fautes de frappe absurdes. */
export const LIMITS = {
  statMax: 999,
  avantagesMin: -20,
  avantagesMax: 20,
  bonusMin: -999,
  bonusMax: 999,
  resourceMax: 9999,
  xpMax: 99999,
  costMax: 9999,
  textShort: 120,
  textMedium: 2000,
  textLong: 20000,
} as const

export function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, Math.trunc(n)))
}

/**
 * Lit un entier saisi par l'utilisateur ("12", " -3 ", "+2"). Renvoie null si la saisie n'est pas un entier.
 */
export function parseIntInput(text: string): number | null {
  const t = text.trim()
  if (!/^[+-]?\d+$/.test(t)) return null
  return Number.parseInt(t, 10)
}
