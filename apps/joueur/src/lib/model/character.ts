// Modèle d'un personnage de Vivre Card (docs/joueur/CAHIER_DES_CHARGES.md §6).
// Un personnage, avec ses compagnons, est stocké comme un seul document JSON.
// Un compagnon a la même fiche qu'un PJ (D-J17) : seule sa race peut sortir des 5 races jouables.
// Tant qu'aucune version n'est publiée, un champ ajouté ne demande pas de migration :
// `normalizeCharacter` complète les champs manquants.

import {
  createResource,
  emptyStats,
  LIMITS,
  newId,
  type Classe,
  type CustomResource,
  type Fruit,
  type Race,
  type Resource,
  type Skill,
  type Stats,
  type TempBonus,
  type Tribu,
} from '@onepiece/core'

export const SCHEMA_VERSION = 1

/** Tout ce qu'une fiche contient, pour un PJ comme pour un compagnon. */
export interface Fiche {
  nom: string
  titre: string
  age: string
  /** Humains seulement ; valeur conservée si la race change. */
  tribu: Tribu
  /** L'écran n'en propose qu'une (D-J9). */
  classes: Classe[]
  /** Le rêve (texte). */
  reve: string
  /** Prime sur sa tête, en berries ; null = pas (encore) de prime. */
  prime: number | null
  stats: Stats
  bonusTemporaires: TempBonus[]
  /**
   * Ambition : affichée pour un Humain seulement, valeurs conservées sinon.
   * Transfert : 1 utilisation par jour (REGLES §3), losange affiché pour que le joueur n'oublie pas qu'il existe.
   */
  ressources: { vitalite: Resource; endurance: Resource; reve: Resource; ambition: Resource; transfert: Resource }
  ressourcesPerso: CustomResource[]
  fruit: Fruit | null
  xp: number
  equipement: string
  inventaire: string
  competences: Skill[]
}

export interface Compagnon extends Fiche {
  id: string
  /** Une des 5 races jouables, ou un nom libre (« Autre race… » : Canard, Den Den Mushi…). */
  race: string
}

export interface Character extends Fiche {
  id: string
  schemaVersion: number
  createdAt: string
  updatedAt: string
  race: Race | ''
  compagnons: Compagnon[]
}

/** Résumé affiché dans la liste d'accueil. */
export interface CharacterSummary {
  id: string
  nom: string
  /** « Race · Classe », vide si ni l'une ni l'autre. */
  sousTitre: string
  updatedAt: string
}

/** Fiche vierge : caracs à 0, Rêve et Ambition à 10 / 10, Transfert à 1 / 1, rien d'autre. */
export function createFiche(nom: string): Fiche {
  return {
    nom,
    titre: '',
    age: '',
    tribu: '',
    classes: [],
    reve: '',
    prime: null,
    stats: emptyStats(),
    bonusTemporaires: [],
    ressources: {
      vitalite: createResource(),
      endurance: createResource(),
      reve: createResource(10),
      ambition: createResource(10),
      transfert: createResource(1, 'chaque jour'),
    },
    ressourcesPerso: [],
    fruit: null,
    xp: 0,
    equipement: '',
    inventaire: '',
    competences: [],
  }
}

export function createCharacter(nom: string): Character {
  const now = new Date().toISOString()
  return {
    id: newId(),
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    race: '',
    ...createFiche(nom),
    compagnons: [],
  }
}

export function createCompagnon(nom: string): Compagnon {
  return { id: newId(), race: '', ...createFiche(nom) }
}

/** Ajoute un compagnon (pas de limite de nombre) et le renvoie. */
export function addCompagnon(c: Pick<Character, 'compagnons'>, nom: string): Compagnon {
  const compagnon = createCompagnon(nom.trim().slice(0, LIMITS.textShort))
  c.compagnons.push(compagnon)
  return compagnon
}

/** « Race · Classe » (accueil, liste des compagnons). */
export function sousTitre(c: { race: string; classes: Classe[] }): string {
  return [c.race, c.classes.join(', ')].filter(Boolean).join(' · ')
}

export function summarize(c: Pick<Character, 'id' | 'nom' | 'race' | 'classes' | 'updatedAt'>): CharacterSummary {
  return { id: c.id, nom: c.nom, sousTitre: sousTitre(c), updatedAt: c.updatedAt }
}
