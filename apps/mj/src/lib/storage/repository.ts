import type { BackupData } from '../backup/format'
import type { Asset } from '../model/asset'
import type { CatalogEntry, Entity } from '../model/entity'
import type { SearchHit } from '../model/search'
import type { Session } from '../model/session'
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
  /** Recherche plein texte (titres, alias, propriétés, texte) dans les fiches non archivées. */
  search(query: string, limit?: number): Promise<SearchHit[]>
  /** Suppression définitive (depuis les archives). */
  deleteEntity(id: string): Promise<void>
  /** Paires écartées de la vue « Doublons probables », sous la forme « idA|idB » (idA < idB). */
  listNotDuplicates(): Promise<string[]>
  markNotDuplicate(a: string, b: string): Promise<void>
  /** La campagne (une seule, D-M13), créée au premier besoin. */
  campaignId(): Promise<string>
  /** Sessions de jeu, par numéro. */
  listSessions(): Promise<Session[]>
  saveSession(session: Session): Promise<void>
  /** Supprime la session et son journal. */
  deleteSession(id: string): Promise<void>
  /** Médias (images, PDF) : la description ; le fichier est dans storage/media.ts. */
  listAssets(): Promise<Asset[]>
  saveAsset(asset: Asset): Promise<void>
  /** Toutes les données à sauvegarder (sans les tables dérivées ni les réglages de l'appareil). */
  exportData(): Promise<BackupData>
  /** Remplace toutes les données par celles d'une sauvegarde (déjà normalisée), en une seule transaction. */
  importData(data: BackupData): Promise<void>
}

export interface Backlink {
  fromId: string
  /** 'mention' ou la clé de la propriété de la fiche source. */
  kind: string
}

export const META_SCHEMA_VERSION = 'schema_version'
export const META_SEARCH_ENGINE = 'search_engine'
/** Date de la dernière sauvegarde écrite dans le dossier, ou reprise depuis lui. */
export const META_LAST_BACKUP = 'last_backup_at'
/** Identifiant de cette dernière sauvegarde (relais entre appareils). */
export const META_BACKUP_ID = 'last_backup_id'
export const META_LAST_CHANGE = 'last_change_at'
/** Réglage : thème 'auto' | 'clair' | 'sombre'. */
export const META_THEME = 'theme'

export const DB_NAME = 'onepiece-mj'

/** Prévient à chaque modification des données (`change`) : déclenche la sauvegarde automatique. */
export const dataChanged = new EventTarget()

let instance: Promise<MjRepository> | null = null

/** Base SQLite de l'appareil (sql.js, gardée dans IndexedDB, D-M18). */
export function getRepository(): Promise<MjRepository> {
  instance ??= (async () => {
    const db = await (await import('./webDb')).openWebDb(DB_NAME)
    return (await import('./sqliteRepository')).createSqliteRepository(db, () =>
      dataChanged.dispatchEvent(new Event('change')),
    )
  })()
  return instance
}
