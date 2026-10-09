import { createFruit, type Fruit } from '../model/fruit'
import type { Skill } from '../model/skills'

/** Rappel affiché sous le bloc fruit (cahier joueur §4.3). */
export const FRUIT_RAPPEL = 'Un utilisateur de fruit du démon ne sait pas nager.'

interface HasFruit {
  fruit: Fruit | null
}

/** Fruit absent ou entièrement vide : rien à afficher en mode jeu. */
export function isFruitEmpty(fruit: Fruit | null): boolean {
  return !fruit || ![fruit.nom, fruit.type, fruit.description, fruit.eveil].some(v => v.trim())
}

/** Ajoute un fruit vide s'il n'y en a pas ; renvoie le fruit du personnage. */
export function addFruit(owner: HasFruit): Fruit {
  owner.fruit ??= createFruit()
  return owner.fruit
}

export function removeFruit(owner: HasFruit): void {
  owner.fruit = null
}

/** Techniques du fruit : compétences d'origine « fruit » (§4.7). */
export function fruitTechniques(owner: { competences: Skill[] }): Skill[] {
  return owner.competences.filter(s => s.origine === 'fruit')
}
