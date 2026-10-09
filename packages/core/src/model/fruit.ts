import type { FruitType } from './identity'

/** Fruit du démon d'un personnage (cahier joueur §4.3). Ses techniques sont des compétences d'origine « fruit ». */
export interface Fruit {
  nom: string
  type: FruitType | ''
  description: string
  /** Facultatif. */
  eveil: string
}

export function createFruit(nom = ''): Fruit {
  return { nom, type: '', description: '', eveil: '' }
}
