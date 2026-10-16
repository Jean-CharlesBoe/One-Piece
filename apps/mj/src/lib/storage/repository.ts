import { Capacitor } from '@capacitor/core'
import type { Entity, EntitySummary } from '../model/entity'
import type { EntityType } from '../model/types'
import type { SearchEngine } from './schema'

/**
 * Accès à la base de l'appli MJ. Les composants ne parlent qu'à ce contrat, jamais à SQLite directement.
 */
export interface MjRepository {
  /** Moteur de l'index plein texte retenu à l'ouverture (D-M11). */
  readonly searchEngine: SearchEngine
  getMeta(key: string): Promise<string | null>
  setMeta(key: string, value: string): Promise<void>
  /** Nombre de fiches non archivées par type. */
  countByType(): Promise<Partial<Record<EntityType, number>>>
  /** Fiches non archivées d'un type, par titre. */
  listEntities(type: EntityType): Promise<EntitySummary[]>
  getEntity(id: string): Promise<Entity | null>
  saveEntity(entity: Entity): Promise<void>
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
