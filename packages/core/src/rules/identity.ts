import type { Classe, Race, Tribu } from '../model/identity'

// Identité d'un personnage. Changer de race ne perd rien : les valeurs propres à l'ancienne race
// (tribu, Ambition) sont seulement masquées, pour qu'une erreur de sélection soit sans conséquence.

interface HasIdentity {
  race: Race | ''
  tribu: Tribu
  classes: Classe[]
}

/** L'Ambition est propre aux Humains (REGLES §3, D-J3). */
export const hasAmbition = (c: Pick<HasIdentity, 'race'>): boolean => c.race === 'Humain'

/** Les tribus (longs bras, longues jambes, long cou) sont humaines. */
export const hasTribu = (c: Pick<HasIdentity, 'race'>): boolean => c.race === 'Humain'

export function setRace(c: HasIdentity, race: Race | ''): Race | '' {
  c.race = race
  return c.race
}

/** L'écran ne propose qu'une classe (D-J9) ; le modèle garde une liste. '' = aucune. */
export function setClasse(c: HasIdentity, classe: Classe | ''): Classe[] {
  c.classes.splice(0, c.classes.length, ...(classe ? [classe] : []))
  return c.classes
}

export const mainClasse = (c: Pick<HasIdentity, 'classes'>): Classe | '' => c.classes[0] ?? ''
