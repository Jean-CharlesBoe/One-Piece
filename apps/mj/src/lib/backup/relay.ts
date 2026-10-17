// Passage de relais entre appareils par le dossier de sauvegarde (D-M18) : un appareil à la fois.
// Chaque sauvegarde porte un identifiant ; chaque appareil retient celui de la dernière sauvegarde qu'il a
// écrite ou reprise. Si le dossier contient une autre sauvegarde, c'est que l'autre appareil a écrit depuis :
// on n'écrase rien sans l'accord du MJ.

export type RelayDecision =
  /** Rien à faire : le dossier contient déjà l'état de cet appareil. */
  | 'a-jour'
  /** Écrire la base de cet appareil dans le dossier. */
  | 'ecrire'
  /** L'autre appareil a écrit une version plus récente, cet appareil n'a rien modifié : proposer de la reprendre. */
  | 'reprendre'
  /** Les deux ont changé (ou le dossier contient une autre base) : le MJ choisit la version gardée. */
  | 'conflit'

export interface RelayState {
  /** Identifiant de la sauvegarde présente dans le dossier (null : aucune). */
  folderId: string | null
  /** Identifiant de la dernière sauvegarde écrite ou reprise par cet appareil (null : jamais). */
  syncId: string | null
  /** La base locale a changé depuis cette dernière sauvegarde. */
  changed: boolean
  /** La base locale ne contient aucune fiche. */
  empty: boolean
}

export function decideRelay(s: RelayState): RelayDecision {
  if (s.folderId === null) return s.empty ? 'a-jour' : 'ecrire'
  if (s.folderId === s.syncId) return s.changed ? 'ecrire' : 'a-jour'
  // Le dossier contient une sauvegarde que cet appareil n'a ni écrite ni reprise.
  if (s.empty) return 'reprendre'
  if (s.syncId !== null && !s.changed) return 'reprendre'
  return 'conflit'
}

/** La base locale a changé depuis la dernière sauvegarde (dates ISO, comparables en texte). */
export const changedSince = (lastChangeAt: string | null, syncAt: string | null): boolean =>
  !!lastChangeAt && (!syncAt || lastChangeAt > syncAt)

/** Nom du fichier d'historique du jour (une copie par jour, la plus récente de la journée). */
export const historyName = (d: Date): string => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `onepiece-mj-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.opmj`
}

/** Fichiers d'historique à supprimer pour n'en garder que `keep` (les plus récents d'après leur nom). */
export function historyToPrune(names: string[], keep: number): string[] {
  return names
    .filter(n => /^onepiece-mj-\d{4}-\d{2}-\d{2}\.opmj$/.test(n))
    .sort()
    .reverse()
    .slice(keep)
}
