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

/** Ressource propre à un personnage (ex. Chance d'Osmo : max 5, « 1 pt = +1 à un jet »). */
export interface CustomResource extends Resource {
  id: string
  nom: string
  /** Texte libre : à quoi elle sert, comment elle se dépense. */
  regle: string
}
