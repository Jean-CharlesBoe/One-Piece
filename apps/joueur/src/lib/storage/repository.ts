import { Capacitor } from '@capacitor/core'
import type { Character, CharacterSummary } from '../model/character'

/**
 * Accès aux personnages. L'interface ne parle qu'à ce contrat, jamais à SQLite directement.
 */
export interface CharacterRepository {
  list(): Promise<CharacterSummary[]>
  get(id: string): Promise<Character | null>
  save(character: Character): Promise<void>
  remove(id: string): Promise<void>
  /** Petites valeurs de fonctionnement (ex. date de dernière sauvegarde). */
  getMeta(key: string): Promise<string | null>
  setMeta(key: string, value: string): Promise<void>
}

export const META_LAST_BACKUP = 'last_backup_at'
/** Réglage : afficher les boutons « i » ('false' = masqués). */
export const META_SHOW_INFO = 'show_info'
/** Réglage : thème 'auto' | 'clair' | 'sombre'. */
export const META_THEME = 'theme'

let instance: Promise<CharacterRepository> | null = null

/** SQLite sur Android ; stockage du navigateur en développement web (`npm run dev:joueur`). */
export function getRepository(): Promise<CharacterRepository> {
  instance ??= Capacitor.isNativePlatform()
    ? import('./sqliteRepository').then(m => m.openSqliteRepository())
    : import('./webRepository').then(m => m.createWebRepository())
  return instance
}
