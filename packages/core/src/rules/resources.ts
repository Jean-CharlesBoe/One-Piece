import type { Resource } from '../model/resources'
import { clampInt, LIMITS } from './numbers'

/** Le max est saisi à la main ; l'actuel est ramené sous le nouveau max si besoin. */
export function setResourceMax(res: Resource, max: number): number {
  res.max = clampInt(max, 0, LIMITS.resourceMax)
  res.cur = Math.min(res.cur, res.max)
  return res.max
}

/** Une ressource reste toujours entre 0 et son max. */
export function setResourceCur(res: Resource, cur: number): number {
  res.cur = clampInt(cur, 0, res.max)
  return res.cur
}

/** Dépense (delta négatif) ou récupération (delta positif). */
export function adjustResource(res: Resource, delta: number): number {
  return setResourceCur(res, res.cur + delta)
}

export function setRegeneration(res: Resource, text: string): string {
  res.regeneration = text.trim().slice(0, LIMITS.textShort)
  return res.regeneration
}
