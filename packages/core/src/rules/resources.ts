import { newId } from '../model/ids'
import { createResource, type CustomResource, type Resource } from '../model/resources'
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

/** À 0 d'Endurance, le personnage s'évanouit (REGLES §3) : simple information, aucun blocage. */
export function isEvanoui(endurance: Resource): boolean {
  return endurance.max > 0 && endurance.cur === 0
}

export function addCustomResource(list: CustomResource[], nom: string, max = 0): CustomResource {
  const res: CustomResource = {
    ...createResource(clampInt(max, 0, LIMITS.resourceMax)),
    id: newId(),
    nom: nom.trim().slice(0, LIMITS.textShort),
    regle: '',
  }
  list.push(res)
  return res
}

export function renameCustomResource(res: CustomResource, nom: string): string {
  res.nom = nom.trim().slice(0, LIMITS.textShort)
  return res.nom
}

export function setCustomResourceRule(res: CustomResource, regle: string): string {
  res.regle = regle.trim().slice(0, LIMITS.textMedium)
  return res.regle
}
