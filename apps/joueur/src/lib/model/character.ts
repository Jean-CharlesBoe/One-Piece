// Modèle d'un personnage de Vivre Card (docs/joueur/CAHIER_DES_CHARGES.md §6).
// Un personnage, avec ses compagnons, est stocké comme un seul document JSON.
// Berries (Q-J2) et Transfert (Q-J3) attendent la réponse du MJ. Tant qu'aucune version n'est publiée, un champ
// ajouté ne demande pas de migration : `normalizeCharacter` complète les champs manquants.

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

export interface Compagnon {
  id: string
  nom: string
  type: string
  race: string
  stats: Stats
  bonusTemporaires: TempBonus[]
  ressources: { vitalite: Resource; endurance: Resource }
  equipement: string
  inventaire: string
  competences: Skill[]
}

export interface Character {
  id: string
  schemaVersion: number
  createdAt: string
  updatedAt: string
  nom: string
  titre: string
  age: string
  race: Race | ''
  /** Humains seulement ; valeur conservée si la race change. */
  tribu: Tribu
  /** L'écran n'en propose qu'une (D-J9). */
  classes: Classe[]
  /** Le rêve du personnage (texte). */
  reve: string
  /** Prime sur sa tête, en berries ; null = pas (encore) de prime. */
  prime: number | null
  stats: Stats
  bonusTemporaires: TempBonus[]
  ressources: { vitalite: Resource; endurance: Resource; reve: Resource; ambition: Resource }
  ressourcesPerso: CustomResource[]
  fruit: Fruit | null
  xp: number
  equipement: string
  inventaire: string
  competences: Skill[]
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

export function createCharacter(nom: string): Character {
  const now = new Date().toISOString()
  return {
    id: newId(),
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    nom,
    titre: '',
    age: '',
    race: '',
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
    },
    ressourcesPerso: [],
    fruit: null,
    xp: 0,
    equipement: '',
    inventaire: '',
    competences: [],
    compagnons: [],
  }
}

export function createCompagnon(nom: string): Compagnon {
  return {
    id: newId(),
    nom,
    type: '',
    race: '',
    stats: emptyStats(),
    bonusTemporaires: [],
    ressources: { vitalite: createResource(), endurance: createResource() },
    equipement: '',
    inventaire: '',
    competences: [],
  }
}

/** Suggestions du champ « Type » d'un compagnon (saisie libre, cahier joueur §4.8). */
export const COMPAGNON_TYPES = ['Animal', 'Monture', 'Den Den Mushi', 'Autre'] as const

/** Ajoute un compagnon (pas de limite de nombre) et le renvoie. */
export function addCompagnon(c: Pick<Character, 'compagnons'>, nom: string): Compagnon {
  const compagnon = createCompagnon(nom.trim().slice(0, LIMITS.textShort))
  c.compagnons.push(compagnon)
  return compagnon
}

export function summarize(c: Pick<Character, 'id' | 'nom' | 'race' | 'classes' | 'updatedAt'>): CharacterSummary {
  return {
    id: c.id,
    nom: c.nom,
    sousTitre: [c.race, c.classes.join(', ')].filter(Boolean).join(' · '),
    updatedAt: c.updatedAt,
  }
}
