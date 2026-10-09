import type { SkillOrigin } from './identity'

/** Compétence ou technique (fruit, style de combat, race, Haki…). Sert aux PJ, compagnons et PNJ. */
export interface Skill {
  id: string
  titre: string
  /** Coût en Endurance. null = pas de coût. */
  cout: number | null
  origine: SkillOrigin
  description: string
}
