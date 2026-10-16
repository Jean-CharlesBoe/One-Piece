// Accès SQL minimal sur lequel repose le repository. Deux implémentations, même SQL :
// SQLite natif sur le Chromebook, jeep-sqlite (sql.js) dans le navigateur en développement (capacitorDb.ts),
// et sql.js directement dans les tests.

export type Row = Record<string, unknown>
export type Param = string | number | null

export interface Db {
  /** Lecture : une ligne par objet, colonnes par nom. */
  query(sql: string, params?: Param[]): Promise<Row[]>
  /** Une instruction d'écriture. */
  run(sql: string, params?: Param[]): Promise<void>
  /** Plusieurs instructions sans paramètres, dans une transaction. */
  execute(sql: string): Promise<void>
  /** Une instruction hors transaction (PRAGMA). */
  pragma(sql: string): Promise<void>
  /** Rend les écritures durables : rien sur l'appareil, enregistrement dans IndexedDB en développement web. */
  persist(): Promise<void>
}
