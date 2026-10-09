/** Ressource en losange « actuel / max » (Vitalité, Endurance, Rêve, Ambition, ressources perso). */
export interface Resource {
  cur: number
  max: number
  /** Texte libre : « 2D6 + 4 », « chaque jour »… */
  regeneration: string
}

export function createResource(max = 0, regeneration = ''): Resource {
  return { cur: max, max, regeneration }
}
