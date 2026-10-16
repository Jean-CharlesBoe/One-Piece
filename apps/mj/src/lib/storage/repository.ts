import { Capacitor } from '@capacitor/core'
import type { CatalogEntry, Entity } from '../model/entity'
import type { SearchEngine } from './schema'

/**
 * Accès à la base de l'appli MJ. Les composants ne parlent qu'à ce contrat, jamais à SQLite directement.
 */
export interface MjRepository {
  /** Moteur de l'index plein texte retenu à l'ouverture (D-M11). */
  readonly searchEngine: SearchEngine
  getMeta(key: string): Promise<string | null>
  setMeta(key: string, value: string): Promise<void>
  /** Toutes les fiches (archivées comprises), par titre. */
  listCatalog(): Promise<CatalogEntry[]>
  getEntity(id: string): Promise<Entity | null>
  /** Enregistre la fiche et recalcule ses liens sortants et son entrée de recherche. */
  saveEntity(entity: Entity): Promise<void>
  /** Fiches qui pointent vers celle-ci (relations et mentions). */
  backlinks(id: string): Promise<Backlink[]>
  /** Suppression définitive (depuis les archives). */
  deleteEntity(id: string): Promise<void>
}

export interface Backlink {
  fromId: string
  /** 'mention' ou la clé de la propriété de la fiche source. */
  kind: string
}

export const META_SCHEMA_VERSION = 'schema_version'
export const META_SEARCH_ENGINE = 'search_engine'
export const META_LAST_BACKUP = 'last_backup_at'
export const META_LAST_CHANGE = 'last_change_at'
/** Réglage : thème 'auto' | 'clair' | 'sombre'. */
export const META_THEME = 'theme'

export const DB_NAME = 'onepiece-mj'

let instance: Promise<MjRepository> | null = null

/** SQLite natif sur le Chromebook ; jeep-sqlite (même SQL, stocké dans IndexedDB) en développement web. */
export function getRepository(): Promise<MjRepository> {
  instance ??= Promise.all([import('./capacitorDb'), import('./sqliteRepository')]).then(async ([c, r]) =>
    r.createSqliteRepository(await c.openCapacitorDb(DB_NAME, !Capacitor.isNativePlatform())),
  )
  return instance
}
