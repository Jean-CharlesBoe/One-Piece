import { STATS, type StatKey } from '../model/stats'

// Textes des mémos « i » (D-J7, Q-J5 validée) : source unique, rédigée d'après docs/REGLES_ONE_PIECE.md.
// Aucun texte de règle en dur dans un composant. Les mémos des autres blocs arrivent avec J5.

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

/** Mémo du bloc « Caractéristiques » (REGLES §1 et §2 ; avantages : Q-R1, comme Sans Nom). */
export const MEMO_CARACS: Memo = {
  titre: 'Caractéristiques',
  texte: [
    'Jet = dé + carac, comparé au seuil de difficulté fixé par le MJ.',
    'Avantages : +N = N relances du jet sur cette carac (double avantage = 2 relances). Une valeur négative indique des désavantages, dont le MJ gère l’effet.',
    'Bonus temporaires : ajoutés à la valeur affichée dans le cercle, jusqu’à ce que tu les retires.',
  ],
  liste: STATS.map(([k, label]) => [label, STAT_DESCRIPTIONS[k]] as const),
}

/** Mémo du bloc « Ressources » (REGLES §3, rappels du MJ du 2026-10-11). Dépenses et transferts : à la main (Q-J3). */
export const MEMO_RESSOURCES: Memo = {
  titre: 'Ressources',
  texte: [
    'Touche un losange pour dépenser ou récupérer ; maximum et régénération se règlent en mode édition.',
    'Régénération : en dehors des combats et des phases de stress, 2D6 de Vitalité ou d’Endurance.',
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
