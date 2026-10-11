import { isRace, type Classe, type Tribu } from '../model/identity'

// Identité d'un personnage ou d'un compagnon (D-J17). Changer de race ne perd rien : les valeurs propres à
// l'ancienne race (tribu, Ambition) sont seulement masquées, pour qu'une erreur de sélection soit sans conséquence.
// La race d'un PJ est l'une des 5 races jouables ; celle d'un compagnon peut aussi être un nom libre.

interface HasIdentity {
  race: string
  tribu: Tribu
  classes: Classe[]
}

/** L'Ambition est propre aux Humains (REGLES §3, D-J3). */
export const hasAmbition = (c: { race: string }): boolean => c.race === 'Humain'

/** Les tribus (longs bras, longues jambes, long cou) sont humaines. */
export const hasTribu = (c: { race: string }): boolean => c.race === 'Humain'

/** Race hors des 5 races jouables (« Autre race… » d'un compagnon : Canard, Den Den Mushi…). */
export const isAutreRace = (race: string): boolean => race !== '' && !isRace(race)

export function setRace<T extends { race: string }>(c: T, race: T['race']): T['race'] {
  c.race = race
  return c.race
}

/** L'écran ne propose qu'une classe (D-J9) ; le modèle garde une liste. '' = aucune. */
export function setClasse(c: Pick<HasIdentity, 'classes'>, classe: Classe | ''): Classe[] {
  c.classes.splice(0, c.classes.length, ...(classe ? [classe] : []))
  return c.classes
}

export const mainClasse = (c: Pick<HasIdentity, 'classes'>): Classe | '' => c.classes[0] ?? ''
