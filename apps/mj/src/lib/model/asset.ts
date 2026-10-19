import { newId, read } from '@onepiece/core'
import type { RawRow } from '../backup/format'

// Médias (M6, MODELE_DONNEES §2) : images et PDF. La ligne `assets` décrit le fichier ; le fichier lui-même est
// rangé à part (stockage de l'appareil, dossier `medias/` de la sauvegarde Drive, `media/` d'un fichier .opmj),
// sous le nom `<id>.<ext>`.

export interface Asset {
  id: string
  /** `<id>.<ext>` : nom du fichier rangé. */
  fileName: string
  /** Nom du fichier importé (pour le téléchargement). */
  originalName: string
  mime: string
  size: number
  width: number | null
  height: number | null
  createdAt: string
}

/** Types acceptés à l'import (cahier §4.6), avec leur extension. */
export const ACCEPTED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
}

const EXT_MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf' }

export const isImage = (a: Pick<Asset, 'mime'>) => a.mime.startsWith('image/')
export const isPdf = (a: Pick<Asset, 'mime'>) => a.mime === 'application/pdf'

/** Type d'un fichier choisi : celui du navigateur, sinon d'après l'extension ; `null` si non accepté. */
export function mimeOf(file: { name: string; type: string }): string | null {
  if (ACCEPTED[file.type]) return file.type
  const ext = /\.(\w+)$/.exec(file.name)?.[1]?.toLowerCase() ?? ''
  return EXT_MIME[ext] ?? null
}

/** Nouveau média pour un fichier importé. */
export function createAsset(file: { name: string; size: number }, mime: string, dims: { width: number; height: number } | null = null): Asset {
  const id = newId()
  return {
    id,
    fileName: `${id}.${ACCEPTED[mime] ?? 'bin'}`,
    originalName: file.name,
    mime,
    size: file.size,
    width: dims?.width ?? null,
    height: dims?.height ?? null,
    createdAt: new Date().toISOString(),
  }
}

/** Titre d'une fiche Document créée pour un fichier : son nom sans extension ni soulignés. */
export const titleFromFileName = (name: string) =>
  name.replace(/\.\w{2,5}$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Document'

/** Ligne `assets` (base, sauvegarde) → média ; `null` si elle est inutilisable. */
export function normalizeAsset(raw: unknown): Asset | null {
  const r = read.obj(raw)
  const pick = (a: string, b: string) => r[a] ?? r[b]
  const id = typeof r.id === 'string' ? r.id : ''
  const fileName = String(pick('fileName', 'file_name') ?? '')
  if (!id || !fileName || /[\\/]/.test(fileName)) return null
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null)
  const ext = /\.(\w+)$/.exec(fileName)?.[1]?.toLowerCase() ?? ''
  return {
    id,
    fileName,
    originalName: String(pick('originalName', 'original_name') ?? fileName) || fileName,
    mime: String(r.mime ?? '') || EXT_MIME[ext] || 'application/octet-stream',
    size: num(r.size) ?? 0,
    width: num(r.width),
    height: num(r.height),
    createdAt: read.date(pick('createdAt', 'created_at')) ?? new Date(0).toISOString(),
  }
}

export function assetRow(a: Asset): RawRow {
  return {
    id: a.id,
    file_name: a.fileName,
    original_name: a.originalName,
    mime: a.mime,
    size: a.size,
    width: a.width,
    height: a.height,
    created_at: a.createdAt,
  }
}

/** Taille lisible (« 1,4 Mo »). */
export function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`
}

/** Médias dont le fichier manque (`have` : noms des fichiers présents). */
export const missingFiles = (assets: readonly Asset[], have: ReadonlySet<string>) => assets.filter(a => !have.has(a.fileName))
