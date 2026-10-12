// Carnet du personnage (Lore et Histoire), repris de Sans Nom v0.5.

/** Section du Lore (Origines, Famille…). */
export interface LoreSection {
  id: string
  titre: string
  texte: string
}

/** Entrée de l'Histoire : une séance de jeu. */
export interface SessionEntry {
  id: string
  /** AAAA-MM-JJ */
  date: string
  titre: string
  texte: string
}
