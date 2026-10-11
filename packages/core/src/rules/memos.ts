import { PALIER_INFO, PALIERS } from '../model/identity'
import { STATS, type StatKey } from '../model/stats'
import { FRUIT_RAPPEL } from './fruit'
import { XP_COSTS } from './xp'

// Textes des mémos « i » (D-J7, Q-J5 validée) : source unique, rédigée d'après docs/REGLES_ONE_PIECE.md.
// Aucun texte de règle en dur dans un composant.

export interface Memo {
  titre: string
  /** Paragraphes courts. */
  texte: string[]
  /** Lignes « libellé : explication ». */
  liste?: (readonly [string, string])[]
}

/** Description de chaque carac (REGLES §2). */
export const STAT_DESCRIPTIONS: Record<StatKey, string> = {
  robustesse: 'Force physique et endurance brute.',
  adresse: 'Habileté physique et agilité.',
  finesse: 'Dextérité et précision.',
  intellect: 'Capacité à réfléchir, résoudre des problèmes.',
  volonte: 'Résistance mentale et ténacité.',
  savoirfaire: 'Compétence technique et artisanale.',
  expression: 'Charisme et communication.',
  perception: 'Sens aiguisés et observation.',
}

/** Règle des avantages (Q-R1, comme Sans Nom). */
export const REGLE_AVANTAGES =
  'Avantages : +N = N relances du jet sur cette carac (double avantage = 2 relances). Une valeur négative indique des désavantages, dont le MJ gère l’effet.'

/** Mémo du bloc « Caractéristiques » (REGLES §1 et §2 ; avantages : Q-R1, comme Sans Nom). */
export const MEMO_CARACS: Memo = {
  titre: 'Caractéristiques',
  texte: [
    'Jet = dé + carac, comparé au seuil de difficulté fixé par le MJ.',
    REGLE_AVANTAGES,
    'Bonus temporaires : ajoutés à la valeur affichée dans le cercle, jusqu’à ce que tu les retires.',
  ],
  liste: STATS.map(([k, label]) => [label, STAT_DESCRIPTIONS[k]] as const),
}

/** Mémo du bloc « Ressources » (REGLES §3, rappels du MJ du 2026-10-11). Dépenses et transferts : à la main (Q-J3). */
export const MEMO_RESSOURCES: Memo = {
  titre: 'Ressources',
  texte: [
    'Touche un losange pour dépenser ou récupérer ; maximum et régénération se règlent en mode édition.',
    'Régénération : possible en dehors des combats et des phases de stress.',
  ],
  liste: [
    ['Vitalité', 'Points de vie.'],
    ['Endurance', 'Sert aux techniques, au fruit, au Haki. À 0, le personnage s’évanouit.'],
    ['Rêve', '1 point = 1 relance de dé, ou récupération de 2D6 + 4 (Vitalité ou Endurance) + le nombre de points dépensés.'],
    ['Ambition', 'Humains seulement. 1 point = +2 au résultat d’un jet ; ne peut ni annuler un échec critique ni créer une réussite critique. Rechargée chaque jour.'],
    ['Transfert', '1 fois par jour, toutes races : jusqu’à 25 % du total de Vitalité passé en Endurance, ou l’inverse, sans dépasser le max.'],
    ['Ressources perso', 'Propres à ton personnage : leur règle s’affiche dans leur fenêtre.'],
  ],
}

/* ---------- Tables de règles ---------- */

/** Seuils de difficulté : fixes, quel que soit le dé (REGLES §1). MJ seulement (D-J18). */
export const DIFFICULTES = [
  ['Facile', 8],
  ['Standard', 12],
  ['Difficile', 18],
  ['Très difficile', 25],
  ['Héroïque', 40],
  ['Légendaire (quasi impossible)', 70],
] as const

// Tables réservées au MJ (D-J18) : jamais affichées dans Vivre Card, gardées ici pour l'appli MJ.

/** Coût en Endurance selon l'ampleur de l'action : fruit, arme ou style de combat (REGLES §8). MJ seulement. */
export const ENDURANCE_COSTS = [
  ['Petite action, coup classique', '2 à 5'],
  ['Action moyenne, technique simple', '6 à 10'],
  ['Grande action, technique spectaculaire', '11 à 15'],
] as const

/** XP par adversaire, partagée entre les participants au combat (REGLES §4). MJ seulement. */
export const XP_PAR_ADVERSAIRE = [
  ['Ennemi mineur', 1],
  ['Ennemi standard', 3],
  ['Second d’équipage', 5],
  ['Capitaine pirate', 10],
  ['Commodore', 15],
  ['Shichibukai', 20],
  ['Vice-amiral', 25],
  ['Supernova', 30],
  ['Amiral', 40],
  ['Empereur (Yonko)', 50],
] as const

/** Attaque de base, sans compétence créée derrière (Q-R5, formulation du MJ). MJ seulement. */
export const ATTAQUE_DE_BASE = '1D6 + modificateur de caractéristique (généralement Robustesse, Adresse ou Finesse).'

const plage = ([a, b]: readonly [number, number]) => (a === b ? String(a) : `${a} à ${b}`)

/* ---------- Mémos des blocs (appli joueur) ---------- */

export const MEMO_COMPETENCES: Memo = {
  titre: 'Compétences',
  texte: ['Le coût en Endurance s’affiche sur la compétence : retire-le toi-même dans le losange Endurance.'],
}

export const MEMO_FRUIT: Memo = {
  titre: 'Fruit du démon',
  texte: [
    FRUIT_RAPPEL,
    'Ses techniques sont tes compétences d’origine « Fruit » ; leur coût en Endurance s’affiche sur chacune.',
  ],
}

/* ---------- Aide-mémoire (menu ⋮ de la fiche) ---------- */

export interface AideSection {
  titre: string
  texte?: string[]
  /** Tableau à deux colonnes. */
  tableau?: { colonnes: readonly [string, string]; lignes: (readonly [string, string])[] }
}

export const AIDE_MEMOIRE: AideSection[] = [
  {
    titre: 'Jets',
    texte: ['Jet = dé + carac, comparé au seuil fixé par le MJ.', REGLE_AVANTAGES],
  },
  {
    titre: 'Critiques',
    texte: [
      'Réussite critique : on ajoute le dé à la carac, on relance et on ajoute le nouveau résultat.',
      'Échec critique : on ajoute le dé à la carac, on relance et on soustrait le nouveau résultat.',
    ],
    tableau: {
      colonnes: ['Dé', 'Échec · Réussite'],
      lignes: PALIERS.map(p => [p, `${plage(PALIER_INFO[p].echecCritique)} · ${plage(PALIER_INFO[p].reussiteCritique)}`] as const),
    },
  },
  { titre: 'Ressources', texte: MEMO_RESSOURCES.texte.slice(1), tableau: { colonnes: ['Ressource', 'Règle'], lignes: MEMO_RESSOURCES.liste!.slice(0, 5) } },
  {
    titre: 'XP',
    tableau: { colonnes: ['Dépense', 'Coût'], lignes: XP_COSTS.map(([w, c]) => [w, `${c} XP`] as const) },
  },
]
