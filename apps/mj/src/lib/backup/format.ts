import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { newId, read } from '@onepiece/core'
import type { Entity } from '../model/entity'
import { normalizeEntity } from '../model/normalize'
import { MIGRATIONS } from '../storage/schema'

// Sauvegarde .opmj de l'appli MJ (MODELE_DONNEES §5, D-M18) : archive zip
//   manifest.json  { format, version, id, schemaVersion, exportedAt, lastChangeAt, appVersion, device, counts }
//   data.json      { entities, assets, campaigns, sessions, journal_entries, not_duplicates }
//   media/<id>.<ext>  (à partir de M6)
// Les tables dérivées (links, search_index) ne sont pas sauvegardées : reconstruites à la restauration.
// Tout ce qui est relu passe par normalizeEntity ou par la liste des colonnes connues ci-dessous.

export const BACKUP_FORMAT = 'onepiece-mj-sauvegarde'
export const BACKUP_VERSION = 1
export const BACKUP_FILE = 'onepiece-mj.opmj'

/** Colonnes connues des tables sauvegardées telles quelles (lignes SQL), en attendant leurs modèles (M6, M8). */
export const TABLE_COLUMNS = {
  assets: ['id', 'file_name', 'original_name', 'mime', 'size', 'width', 'height', 'created_at'],
  campaigns: ['id', 'title', 'description_md', 'created_at', 'updated_at'],
  sessions: [
    'id', 'campaign_id', 'number', 'title', 'played_on', 'scenario_id', 'status',
    'prep_md', 'summary_md', 'pinned_ids', 'snapshot', 'created_at', 'updated_at',
  ],
  journal_entries: ['id', 'session_id', 'at', 'kind', 'text_md', 'auto', 'haki', 'created_at', 'updated_at'],
  not_duplicates: ['a_id', 'b_id'],
} as const
export type RawTable = keyof typeof TABLE_COLUMNS
export const RAW_TABLES = Object.keys(TABLE_COLUMNS) as RawTable[]

export type Cell = string | number | null
export type RawRow = Record<string, Cell>

export interface BackupData {
  entities: Entity[]
  assets: RawRow[]
  campaigns: RawRow[]
  sessions: RawRow[]
  journal_entries: RawRow[]
  not_duplicates: RawRow[]
}

export interface BackupManifest {
  format: typeof BACKUP_FORMAT
  version: number
  /** Identifiant unique de cette sauvegarde : sert au relais entre appareils (« est-ce celle que j'ai écrite ? »). */
  id: string
  schemaVersion: number
  exportedAt: string
  /** Date de la dernière modification de la base sauvegardée. */
  lastChangeAt: string | null
  appVersion: string
  /** Appareil qui l'a écrite (« PC Windows », « Chromebook »). */
  device: string
  counts: Record<string, number>
}

export const emptyBackupData = (): BackupData => ({
  entities: [],
  assets: [],
  campaigns: [],
  sessions: [],
  journal_entries: [],
  not_duplicates: [],
})

export function makeManifest(
  data: BackupData,
  info: { lastChangeAt: string | null; appVersion: string; device: string },
): BackupManifest {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    id: newId(),
    schemaVersion: MIGRATIONS.length,
    exportedAt: new Date().toISOString(),
    lastChangeAt: info.lastChangeAt,
    appVersion: info.appVersion,
    device: info.device,
    counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, (v as unknown[]).length])),
  }
}

export function packBackup(manifest: BackupManifest, data: BackupData): Uint8Array {
  return zipSync(
    {
      'manifest.json': strToU8(JSON.stringify(manifest, null, 2)),
      'data.json': strToU8(JSON.stringify(data)),
    },
    { level: 6 },
  )
}

/** Erreur de lecture d'une sauvegarde, avec un message en français pour le MJ. */
export class BackupError extends Error {}

function unzip(bytes: Uint8Array, only?: string): Record<string, Uint8Array> {
  try {
    return unzipSync(bytes, only ? { filter: f => f.name === only } : undefined)
  } catch {
    throw new BackupError("Ce fichier n'est pas une sauvegarde de l'appli MJ (archive illisible).")
  }
}

function parseJson(files: Record<string, Uint8Array>, name: string): unknown {
  const f = files[name]
  if (!f) throw new BackupError(`Sauvegarde incomplète : ${name} manquant.`)
  try {
    return JSON.parse(strFromU8(f))
  } catch {
    throw new BackupError(`Sauvegarde abîmée : ${name} illisible.`)
  }
}

function normalizeManifest(raw: unknown): BackupManifest {
  const r = read.obj(raw)
  if (r.format !== BACKUP_FORMAT) throw new BackupError("Ce fichier n'est pas une sauvegarde de l'appli MJ.")
  const version = read.num(r.version, 0)
  const schemaVersion = read.num(r.schemaVersion, 0)
  if (version > BACKUP_VERSION || schemaVersion > MIGRATIONS.length) {
    throw new BackupError(
      "Sauvegarde faite par une version plus récente de l'appli : recharger l'app (mise à jour) puis réessayer.",
    )
  }
  const counts = read.obj(r.counts)
  return {
    format: BACKUP_FORMAT,
    version,
    id: read.str(r.id, 100) || newId(),
    schemaVersion,
    exportedAt: read.date(r.exportedAt) ?? new Date(0).toISOString(),
    lastChangeAt: read.date(r.lastChangeAt),
    appVersion: read.str(r.appVersion, 40),
    device: read.str(r.device, 60) || 'appareil inconnu',
    counts: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, read.num(v, 0)])),
  }
}

/** Lit seulement le manifeste (relais : savoir qui a écrit la sauvegarde du dossier, et quand). */
export function readManifest(bytes: Uint8Array): BackupManifest {
  return normalizeManifest(parseJson(unzip(bytes, 'manifest.json'), 'manifest.json'))
}

const cell = (v: unknown): Cell => (typeof v === 'string' || typeof v === 'number' ? v : null)

/** Lignes d'une table : colonnes connues seulement, valeurs simples, sans doublon d'identifiant. */
function normalizeRows(table: RawTable, raw: unknown): RawRow[] {
  const cols = TABLE_COLUMNS[table]
  const seen = new Set<string>()
  const out: RawRow[] = []
  for (const r of read.arr(raw).map(read.obj)) {
    const row = Object.fromEntries(cols.map(c => [c, cell(r[c])])) as RawRow
    const key = table === 'not_duplicates' ? `${row.a_id}|${row.b_id}` : String(row.id ?? '')
    if (!key || key === 'null|null' || seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return out
}

export interface ReadBackup {
  manifest: BackupManifest
  data: BackupData
  warnings: string[]
}

/** Lit une sauvegarde complète ; lève BackupError si elle est inutilisable. */
export function readBackup(bytes: Uint8Array): ReadBackup {
  const files = unzip(bytes)
  const manifest = normalizeManifest(parseJson(files, 'manifest.json'))
  const raw = read.obj(parseJson(files, 'data.json'))
  const warnings: string[] = []
  const ids = new Set<string>()
  const entities: Entity[] = []
  for (const r of read.arr(raw.entities)) {
    const { entity, warnings: w } = normalizeEntity(r)
    warnings.push(...w)
    if (ids.has(entity.id)) {
      warnings.push(`« ${entity.title} » : fiche en double ignorée`)
      continue
    }
    ids.add(entity.id)
    entities.push(entity)
  }
  const data: BackupData = { ...emptyBackupData(), entities }
  for (const t of RAW_TABLES) data[t] = normalizeRows(t, raw[t])
  return { manifest, data, warnings }
}
