import type { StatKey } from './stats'

// Listes fermées de l'identité d'un personnage. Source : REGLES_ONE_PIECE.md §1, §5, §6, §8.

/** Races jouables (Q-R6 : les Lunariens ne le sont pas, ils n'existent que côté MJ). */
export const RACES = ['Humain', 'Homme-Poisson', 'Skypiéen', 'Tontata', 'Mink'] as const
export type Race = (typeof RACES)[number]

export interface RaceInfo {
  pluriel: string
  /** Autres noms rencontrés dans Notion (D-M8). */
  alias: string[]
  avantages: StatKey[]
  desavantages: StatKey[]
  vitaliteBase: number
  enduranceBase: number
}

/** Avantages et désavantages sur les caracs seulement ; les conditions (queue, sous l'eau…) vont dans les mémos. */
export const RACE_INFO: Record<Race, RaceInfo> = {
  Humain: {
    pluriel: 'Humains',
    alias: [],
    avantages: ['expression'],
    desavantages: [],
    vitaliteBase: 25,
    enduranceBase: 20,
  },
  'Homme-Poisson': {
    pluriel: 'Hommes-Poissons',
    alias: [],
    avantages: ['robustesse'],
    desavantages: ['expression'],
    vitaliteBase: 35,
    enduranceBase: 20,
  },
  Skypiéen: {
    pluriel: 'Skypiéens',
    alias: ['Ange', 'Anges'],
    avantages: ['expression'],
    desavantages: ['robustesse'],
    vitaliteBase: 20,
    enduranceBase: 25,
  },
  Tontata: {
    pluriel: 'Tontatas',
    alias: [],
    avantages: ['robustesse'],
    desavantages: ['perception'],
    vitaliteBase: 30,
    enduranceBase: 15,
  },
  Mink: {
    pluriel: 'Minks',
    alias: [],
    avantages: [],
    desavantages: [],
    vitaliteBase: 25,
    enduranceBase: 20,
  },
}

/** Tribus humaines : clé stockée, libellé, carac avantagée. '' = aucune. */
export const TRIBUS = [
  ['', 'Aucune', null],
  ['longs-bras', 'Longs bras', 'savoirfaire'],
  ['longues-jambes', 'Longues jambes', 'adresse'],
  ['long-cou', 'Long cou', 'perception'],
] as const satisfies readonly (readonly [string, string, StatKey | null])[]

export type Tribu = (typeof TRIBUS)[number][0]

export const CLASSES = [
  'Capitaine',
  'Combattant',
  'Médecin',
  'Cuisinier',
  'Navigateur',
  'Archéologue',
  'Charpentier',
  'Musicien',
  'Timonier',
  'Tireur',
  'Garde',
] as const
export type Classe = (typeof CLASSES)[number]

/** Une carac répétée = avantage double (ex. Archéologue : Intellect ×2). */
export const CLASSE_INFO: Record<Classe, { avantages: StatKey[]; desavantages: StatKey[] }> = {
  Capitaine: { avantages: ['volonte', 'expression'], desavantages: ['perception'] },
  Combattant: { avantages: ['robustesse'], desavantages: [] },
  Médecin: { avantages: ['savoirfaire', 'finesse'], desavantages: ['volonte'] },
  Cuisinier: { avantages: ['savoirfaire', 'adresse'], desavantages: ['expression'] },
  Navigateur: { avantages: ['perception'], desavantages: [] },
  Archéologue: { avantages: ['intellect', 'intellect'], desavantages: ['robustesse'] },
  Charpentier: { avantages: ['savoirfaire', 'robustesse'], desavantages: ['finesse'] },
  Musicien: { avantages: ['expression', 'finesse'], desavantages: ['robustesse'] },
  Timonier: { avantages: ['adresse'], desavantages: [] },
  Tireur: { avantages: ['perception', 'perception'], desavantages: ['expression'] },
  Garde: { avantages: ['robustesse', 'robustesse'], desavantages: ['intellect'] },
}

/** Paliers de dé : le dé grandit avec la progression, les seuils de difficulté restent fixes. */
export const PALIERS = ['D10', 'D20', 'D100'] as const
export type Palier = (typeof PALIERS)[number]

export interface PalierInfo {
  faces: number
  quand: string
  /** Bornes incluses. */
  echecCritique: [number, number]
  reussiteCritique: [number, number]
}

export const PALIER_INFO: Record<Palier, PalierInfo> = {
  D10: { faces: 10, quand: 'Départ, hors Grand Line', echecCritique: [1, 1], reussiteCritique: [10, 10] },
  D20: { faces: 20, quand: 'Arrivée sur Grand Line', echecCritique: [1, 1], reussiteCritique: [20, 20] },
  D100: { faces: 100, quand: 'Arrivée dans le Nouveau Monde', echecCritique: [1, 5], reussiteCritique: [96, 100] },
}

export const FRUIT_TYPES = ['Paramecia', 'Zoan', 'Logia', 'Inconnu'] as const
export type FruitType = (typeof FRUIT_TYPES)[number]

/** Origine facultative d'une compétence : clé stockée, libellé, libellé court (pastille et filtre). */
export const SKILL_ORIGINS = [
  ['fruit', 'Fruit', 'Fruit'],
  ['combat', 'Style de combat', 'Combat'],
  ['race', 'Race', 'Race'],
  ['haki', 'Haki', 'Haki'],
  ['autre', 'Autre', 'Autre'],
] as const

export function skillOriginLabel(origine: SkillOrigin, court = false): string {
  const o = SKILL_ORIGINS.find(([k]) => k === origine)
  return o ? o[court ? 2 : 1] : ''
}
/** '' = origine non précisée. */
export type SkillOrigin = '' | (typeof SKILL_ORIGINS)[number][0]

const among = (list: readonly string[], v: unknown): boolean => typeof v === 'string' && list.includes(v)

export const isRace = (v: unknown): v is Race => among(RACES, v)
export const isClasse = (v: unknown): v is Classe => among(CLASSES, v)
export const isPalier = (v: unknown): v is Palier => among(PALIERS, v)
export const isTribu = (v: unknown): v is Tribu => among(TRIBUS.map(([k]) => k), v)
export const isFruitType = (v: unknown): v is FruitType => among(FRUIT_TYPES, v)
export const isSkillOrigin = (v: unknown): v is SkillOrigin => v === '' || among(SKILL_ORIGINS.map(([k]) => k), v)

/** Retrouve une race par son nom de référence, son pluriel ou un alias (« Anges » → Skypiéen). */
export function findRace(name: string): Race | null {
  const n = name.trim().toLocaleLowerCase('fr')
  for (const race of RACES) {
    const info = RACE_INFO[race]
    if ([race, info.pluriel, ...info.alias].some(x => x.toLocaleLowerCase('fr') === n)) return race
  }
  return null
}
