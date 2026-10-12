import { clampInt, LIMITS } from './numbers'

// XP à dépenser. La dépense reste manuelle (comme Sans Nom) : le joueur ajuste lui-même caracs et maximums.

/** Coûts d'XP (REGLES §4), rappelés sous le compteur. */
export const XP_COSTS = [
  ['+1 dans une caractéristique', 1],
  ['+2 au maximum de Vitalité ou d’Endurance', 1],
  ['+1 au maximum de Rêve ou d’Ambition', 10],
] as const

export function setXp(owner: { xp: number }, value: number): number {
  owner.xp = clampInt(value, 0, LIMITS.xpMax)
  return owner.xp
}

export function adjustXp(owner: { xp: number }, delta: number): number {
  return setXp(owner, owner.xp + delta)
}
