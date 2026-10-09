import { clampInt, LIMITS } from './numbers'

// XP à dépenser. La dépense reste manuelle (comme Sans Nom) : le joueur ajuste lui-même caracs et maximums.

/** Coûts d'XP (REGLES §4), rappelés sous le compteur. */
export const XP_COSTS = [
  ['+1 dans une carac', 1],
  ['+2 en Vitalité ou Endurance max', 1],
  ["+1 au max de Rêve ou d'Ambition", 10],
] as const

export function setXp(owner: { xp: number }, value: number): number {
  owner.xp = clampInt(value, 0, LIMITS.xpMax)
  return owner.xp
}

export function adjustXp(owner: { xp: number }, delta: number): number {
  return setXp(owner, owner.xp + delta)
}
