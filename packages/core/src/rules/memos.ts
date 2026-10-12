import { STATS, type StatKey } from '../model/stats'
import { FRUIT_RAPPEL } from './fruit'
import { XP_COSTS } from './xp'

// Textes des mémos « i » et de l'aide-mémoire (D-J7) : source unique, rédigée d'après docs/REGLES_ONE_PIECE.md.
// Aucun texte de règle en dur dans un composant. Phrases complètes, sans abréviation (retour du MJ, 2026-10-12).
// Les infos réservées au MJ n'apparaissent jamais côté joueur (D-J18) : leurs tables sont regroupées plus bas.

export interface Memo {
  titre: string
  /** Paragraphes courts. */
  texte: string[]
  /** Lignes « libellé : explication ». */
  liste?: (readonly [string, string])[]
}

/** Description de chaque caractéristique (REGLES §2). */
export const STAT_DESCRIPTIONS: Record<StatKey, string> = {
  robustesse: 'Force physique et endurance brute.',
  adresse: 'Habileté physique et agilité.',
  finesse: 'Dextérité et précision.',
  intellect: 'Capacité à réfléchir et à résoudre des problèmes.',
  volonte: 'Résistance mentale et ténacité.',
  savoirfaire: 'Compétence technique et artisanale.',
  expression: 'Charisme et communication.',
  perception: 'Sens aiguisés et observation.',
}

/** Calcul d'un jet (REGLES §1). */
export const REGLE_JET =
  'Un jet se calcule ainsi : résultat du dé + valeur de la caractéristique, comparé au seuil de difficulté fixé par le MJ.'

/** Règle des avantages (Q-R1, comme Sans Nom). */
export const REGLE_AVANTAGES =
  'Avantages : chaque avantage sur une caractéristique donne une relance du jet (un double avantage donne deux relances). Un nombre négatif indique des désavantages, dont le MJ fixe l’effet.'

/** Mémo du bloc « Caractéristiques » (REGLES §1 et §2). */
export const MEMO_CARACS: Memo = {
  titre: 'Caractéristiques',
  texte: [
    REGLE_JET,
    REGLE_AVANTAGES,
    'Bonus temporaires : ils s’ajoutent à la valeur affichée dans le cercle, jusqu’à ce que tu les retires.',
  ],
  liste: STATS.map(([k, label]) => [label, STAT_DESCRIPTIONS[k]] as const),
}

/** Régénération : la valeur (dés) est une règle MJ, susceptible d'évoluer (D-J18). */
export const REGLE_REGENERATION = 'Régénération : possible en dehors des combats et des phases de stress.'

/** Mémo du bloc « Ressources » (REGLES §3, rappels du MJ du 2026-10-11). Dépenses et transferts : à la main (Q-J3). */
export const MEMO_RESSOURCES: Memo = {
  titre: 'Ressources',
  texte: [
    'Touche un losange pour dépenser ou récupérer des points. Le maximum et la régénération se modifient en mode édition.',
    REGLE_REGENERATION,
  ],
  liste: [
    ['Vitalité', 'Tes points de vie.'],
    ['Endurance', 'Elle sert à utiliser tes techniques, ton fruit du démon et le Haki. À 0, ton personnage s’évanouit.'],
    [
      'Rêve',
      'Un point dépensé permet de relancer un dé, ou de récupérer 2D6 + 4 points de Vitalité ou d’Endurance, plus le nombre de points de Rêve dépensés.',
    ],
    [
      'Ambition',
      'Réservée aux Humains. Un point dépensé ajoute 2 au résultat d’un jet, sans pouvoir annuler un échec critique ni créer une réussite critique. La jauge se recharge chaque jour.',
    ],
    [
      'Transfert',
      'Une fois par jour, pour toutes les races : tu peux faire passer jusqu’à 25 % de ta Vitalité totale en Endurance, ou l’inverse, sans dépasser le maximum.',
    ],
    ['Ressources personnelles', 'Propres à ton personnage : leur règle s’affiche quand tu touches leur losange.'],
  ],
}

export const MEMO_COMPETENCES: Memo = {
  titre: 'Compétences',
  texte: [
    'Le coût en Endurance est indiqué sur chaque compétence : quand tu l’utilises, retire-le toi-même dans le losange Endurance.',
  ],
}

export const MEMO_FRUIT: Memo = {
  titre: 'Fruit du démon',
  texte: [
    FRUIT_RAPPEL,
    'Ses techniques sont tes compétences d’origine « Fruit » ; leur coût en Endurance est indiqué sur chacune.',
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
  { titre: 'Jets', texte: [REGLE_JET, REGLE_AVANTAGES] },
  {
    titre: 'Critiques',
    texte: [
      'Réussite critique : on ajoute le résultat du dé à la caractéristique, on relance le dé et on ajoute ce nouveau résultat.',
      'Échec critique : on ajoute le résultat du dé à la caractéristique, on relance le dé et on retire ce nouveau résultat.',
    ],
  },
  {
    titre: 'Ressources',
    texte: [REGLE_REGENERATION],
    tableau: { colonnes: ['Ressource', 'Règle'], lignes: MEMO_RESSOURCES.liste!.slice(0, 5) },
  },
  {
    titre: 'Expérience',
    texte: ['La dépense est manuelle : modifie toi-même la caractéristique ou le maximum, puis retire les points du compteur.'],
    tableau: { colonnes: ['Dépense', 'Coût'], lignes: XP_COSTS.map(([w, c]) => [w, `${c} point${c > 1 ? 's' : ''} d’expérience`] as const) },
  },
]

/* ---------- Tables réservées au MJ (D-J18) : jamais affichées dans Vivre Card, gardées pour l'appli MJ ---------- */

/** Seuils de difficulté : fixes, quel que soit le dé (REGLES §1). */
export const DIFFICULTES = [
  ['Facile', 8],
  ['Standard', 12],
  ['Difficile', 18],
  ['Très difficile', 25],
  ['Héroïque', 40],
  ['Légendaire (quasi impossible)', 70],
] as const

/** Coût en Endurance selon l'ampleur de l'action : fruit, arme ou style de combat (REGLES §8). */
export const ENDURANCE_COSTS = [
  ['Petite action, coup classique', '2 à 5'],
  ['Action moyenne, technique simple', '6 à 10'],
  ['Grande action, technique spectaculaire', '11 à 15'],
] as const

/** XP par adversaire, partagée entre les participants au combat (REGLES §4). */
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

/** Attaque de base, sans compétence créée derrière (Q-R5, formulation du MJ). */
export const ATTAQUE_DE_BASE = '1D6 + modificateur de caractéristique (généralement Robustesse, Adresse ou Finesse).'

/** Seuils des critiques par dé : voir PALIER_INFO (model/identity.ts), réservé au MJ (D-J18). */
