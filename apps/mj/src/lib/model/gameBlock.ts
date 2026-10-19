import {
  createResource,
  emptyStats,
  LIMITS,
  normalizeCustomResources,
  normalizeResource,
  normalizeSkills,
  normalizeStats,
  normalizeTempBonuses,
  RACE_INFO,
  read,
  TRIBUS,
  XP_PAR_ADVERSAIRE,
  type CustomResource,
  type Resource,
  type Skill,
  type Stats,
  type TempBonus,
  type Tribu,
} from '@onepiece/core'

// Bloc de jeu d'un PNJ (M7, cahier §4.4, D-M24) : `props.jeu` d'un Personnage. Mêmes types et mêmes règles que
// les fiches de Vivre Card (packages/core, D-M25) : caracs, bonus temporaires, ressources (Rêve, Ambition pour un
// Humain, Transfert), tribu, rêve, techniques, équipement, inventaire. Rien n'est déduit de la race ou du grade
// (D-M24) ; Rêve, Ambition et Transfert partent des valeurs des règles, comme sur Vivre Card.

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
  /** Ambition : affichée pour un Humain seulement, valeurs conservées sinon (comme Vivre Card). */
  ressources: { vitalite: Resource; endurance: Resource; reve: Resource; ambition: Resource; transfert: Resource }
  ressourcesPerso: CustomResource[]
  /** Tribu (Humains seulement, valeur conservée sinon). */
  tribu: Tribu
  /** Le rêve du PNJ (texte). */
  reve: string
  equipement: string
  inventaire: string
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

/** Valeurs de départ, celles de Vivre Card (REGLES §3) : Rêve 10, Ambition 10, Transfert 1 par jour. */
const emptyResources = (): GameBlock['ressources'] => ({
  vitalite: createResource(0),
  endurance: createResource(0),
  reve: createResource(10),
  ambition: createResource(10),
  transfert: createResource(1, 'chaque jour'),
})

export function createGameBlock(): GameBlock {
  return {
    stats: emptyStats(0),
    bonusTemporaires: [],
    ressources: emptyResources(),
    ressourcesPerso: [],
    tribu: '',
    reve: '',
    equipement: '',
    inventaire: '',
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
  const def = emptyResources()
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
      // Absentes d'un bloc créé en 0.5.0 : valeurs de départ.
      reve: normalizeResource(res.reve, 'Rêve', w, who, def.reve),
      ambition: normalizeResource(res.ambition, 'Ambition', w, who, def.ambition),
      transfert: normalizeResource(res.transfert, 'Transfert', w, who, def.transfert),
    },
    ressourcesPerso: normalizeCustomResources(r.ressourcesPerso, w, who),
    tribu: TRIBUS.some(([k]) => k === r.tribu) ? (r.tribu as Tribu) : '',
    reve: read.str(r.reve, LIMITS.textMedium),
    equipement: read.str(r.equipement, LIMITS.textLong),
    inventaire: read.str(r.inventaire, LIMITS.textLong),
    categorie,
    // `techniques` : nom prévu à l'origine (MODELE_DONNEES), accepté à la lecture.
    competences: normalizeSkills(r.competences ?? r.techniques),
    haki,
  }
}

/** Haki maîtrisés, pour l'affichage (« Observation, Armement »). */
export const masteredHaki = (b: GameBlock) => HAKI_TYPES.filter(([k]) => b.haki[k].maitrise).map(([, l]) => l)

const HUMAN_NAMES = new Set(['Humain', RACE_INFO.Humain.pluriel, ...RACE_INFO.Humain.alias].map(n => n.toLowerCase()))

/** La race liée (titre ou alias de sa fiche) est-elle Humain ? Ambition et tribu n'existent que pour eux (REGLES). */
export const isHumanRace = (race: { title: string; aliases: string[] } | undefined): boolean =>
  !!race && [race.title, ...race.aliases].some(n => HUMAN_NAMES.has(n.trim().toLowerCase()))
