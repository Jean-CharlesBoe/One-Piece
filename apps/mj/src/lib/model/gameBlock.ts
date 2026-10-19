import {
  createResource,
  emptyStats,
  LIMITS,
  normalizeCustomResources,
  normalizeResource,
  normalizeSkills,
  normalizeStats,
  normalizeTempBonuses,
  read,
  XP_PAR_ADVERSAIRE,
  type CustomResource,
  type Resource,
  type Skill,
  type Stats,
  type TempBonus,
} from '@onepiece/core'

// Bloc de jeu d'un PNJ (M7, cahier §4.4, D-M24) : `props.jeu` d'un Personnage. Mêmes types et mêmes règles que
// les fiches de Vivre Card (packages/core) : caracs, bonus temporaires, ressources, techniques. Rien n'est
// prérempli : le MJ remplit lui-même.

export const HAKI_TYPES = [
  ['observation', 'Observation'],
  ['armement', 'Armement'],
  ['rois', 'Rois'],
] as const
export type HakiType = (typeof HAKI_TYPES)[number][0]

export interface HakiState {
  /** Maîtrisé ou non : le MJ décide (REGLES §7). */
  maitrise: boolean
  notes: string
}

export interface GameBlock {
  stats: Stats
  bonusTemporaires: TempBonus[]
  ressources: { vitalite: Resource; endurance: Resource }
  ressourcesPerso: CustomResource[]
  /** Catégorie d'adversaire (libellé de `XP_PAR_ADVERSAIRE`), '' = non précisée. */
  categorie: string
  /** Techniques : même forme que les compétences de Vivre Card (titre, coût en Endurance, origine, description). */
  competences: Skill[]
  haki: Record<HakiType, HakiState>
}

export const CATEGORIES = XP_PAR_ADVERSAIRE.map(([nom]) => nom as string)

/** XP gagnée contre ce PNJ (lecture seule, REGLES §4) ; `null` sans catégorie. */
export function categoryXp(categorie: string): number | null {
  return XP_PAR_ADVERSAIRE.find(([nom]) => nom === categorie)?.[1] ?? null
}

const emptyHaki = (): Record<HakiType, HakiState> =>
  Object.fromEntries(HAKI_TYPES.map(([k]) => [k, { maitrise: false, notes: '' }])) as Record<HakiType, HakiState>

export function createGameBlock(): GameBlock {
  return {
    stats: emptyStats(0),
    bonusTemporaires: [],
    ressources: { vitalite: createResource(0), endurance: createResource(0) },
    ressourcesPerso: [],
    categorie: '',
    competences: [],
    haki: emptyHaki(),
  }
}

/** Lit un bloc de jeu (base, sauvegarde, import) ; `undefined` si la valeur n'en est pas un. */
export function normalizeGameBlock(raw: unknown, w: string[] = [], who = ''): GameBlock | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const r = read.obj(raw)
  const res = read.obj(r.ressources)
  const categorie = read.str(r.categorie, LIMITS.textShort)
  if (categorie && !CATEGORIES.includes(categorie)) w.push(`${who}catégorie d'adversaire « ${categorie} » inconnue : gardée`)
  const hakiRaw = read.obj(r.haki)
  const haki = emptyHaki()
  for (const [k] of HAKI_TYPES) {
    const h = read.obj(hakiRaw[k])
    haki[k] = { maitrise: h.maitrise === true, notes: read.str(h.notes, LIMITS.textMedium) }
  }
  return {
    stats: normalizeStats(r.stats, w, who, 0),
    bonusTemporaires: normalizeTempBonuses(r.bonusTemporaires),
    ressources: {
      vitalite: normalizeResource(res.vitalite, 'Vitalité', w, who),
      endurance: normalizeResource(res.endurance, 'Endurance', w, who),
    },
    ressourcesPerso: normalizeCustomResources(r.ressourcesPerso, w, who),
    categorie,
    // `techniques` : nom prévu à l'origine (MODELE_DONNEES), accepté à la lecture.
    competences: normalizeSkills(r.competences ?? r.techniques),
    haki,
  }
}

/** Haki maîtrisés, pour l'affichage (« Observation, Armement »). */
export const masteredHaki = (b: GameBlock) => HAKI_TYPES.filter(([k]) => b.haki[k].maitrise).map(([, l]) => l)
