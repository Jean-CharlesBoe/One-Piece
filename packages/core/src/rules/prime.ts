import { clampInt, LIMITS } from './numbers'

// Prime sur la tête d'un personnage (Q-J2 : demandée par le MJ). En berries ; null = pas de prime.

/** Lit une prime saisie (« 30 000 000 », « 1.500.000 ») : chiffres seulement. null si vide ou illisible. */
export function parsePrime(text: string): number | null {
  const digits = text.replace(/[\s.,_'  ]/g, '')
  if (!/^\d+$/.test(digits)) return null
  return clampInt(Number(digits), 0, LIMITS.primeMax)
}

export function setPrime(owner: { prime: number | null }, value: number | null): number | null {
  owner.prime = value === null || !Number.isFinite(value) ? null : clampInt(value, 0, LIMITS.primeMax)
  return owner.prime
}

/** « 30 000 000 ฿ » (séparateurs français, symbole du berry). */
export function formatPrime(value: number): string {
  return `${value.toLocaleString('fr-FR')} ฿`
}
