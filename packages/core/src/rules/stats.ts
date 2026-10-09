import { newId } from '../model/ids'
import type { StatKey, Stats, TempBonus } from '../model/stats'
import { clampInt, LIMITS } from './numbers'

/** PJ, compagnon ou PNJ : tout ce qui a des caracs et des bonus temporaires. */
export interface HasStats {
  stats: Stats
  bonusTemporaires: TempBonus[]
}

export function setStatValue(owner: HasStats, key: StatKey, value: number): number {
  owner.stats[key].valeur = clampInt(value, 0, LIMITS.statMax)
  return owner.stats[key].valeur
}

/** Boutons + / − du mode édition. */
export function stepStat(owner: HasStats, key: StatKey, delta: number): number {
  return setStatValue(owner, key, owner.stats[key].valeur + delta)
}

/** Positif : avantages. Négatif : désavantages. */
export function setAvantages(owner: HasStats, key: StatKey, value: number): number {
  owner.stats[key].avantages = clampInt(value, LIMITS.avantagesMin, LIMITS.avantagesMax)
  return owner.stats[key].avantages
}

export function bonusTotal(owner: HasStats, key: StatKey): number {
  return owner.bonusTemporaires.filter(b => b.carac === key).reduce((sum, b) => sum + b.valeur, 0)
}

/** Valeur affichée dans le cercle : valeur + bonus temporaires, jamais négative. */
export function finalStat(owner: HasStats, key: StatKey): number {
  return Math.max(0, owner.stats[key].valeur + bonusTotal(owner, key))
}

/** Renvoie le bonus créé, ou null si la valeur est nulle. */
export function addTempBonus(owner: HasStats, carac: StatKey, valeur: number, origine: string): TempBonus | null {
  const v = clampInt(valeur, LIMITS.bonusMin, LIMITS.bonusMax)
  if (v === 0) return null
  const bonus: TempBonus = { id: newId(), carac, valeur: v, origine: origine.trim().slice(0, LIMITS.textShort) }
  owner.bonusTemporaires.push(bonus)
  return bonus
}

export function removeTempBonus(owner: HasStats, id: string): void {
  const i = owner.bonusTemporaires.findIndex(b => b.id === id)
  if (i >= 0) owner.bonusTemporaires.splice(i, 1)
}

export function clearTempBonuses(owner: HasStats): void {
  owner.bonusTemporaires.splice(0)
}
