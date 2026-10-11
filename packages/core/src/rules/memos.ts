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
