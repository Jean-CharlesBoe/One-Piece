import { newId } from '@onepiece/core'
import type { EntityType } from './types'

/** Une fiche de la base de connaissances : miroir d'une ligne de la table `entities` (MODELE_DONNEES §2). */
export interface Entity {
  id: string
  type: EntityType
  /** Nom de référence (D-M8). */
  title: string
  aliases: string[]
  parentId: string | null
  sortOrder: number
  /** Champs propres au type, validés par le registre (M2). */
  props: Record<string, unknown>
  bodyMd: string
  tags: string[]
  coverAsset: string | null
  pinned: boolean
  archived: boolean
  notionId: string | null
  createdAt: string
  updatedAt: string
}

/** Ligne de liste : de quoi afficher une fiche sans la relire en entier. */
export interface EntitySummary {
  id: string
  type: EntityType
  title: string
  pinned: boolean
  updatedAt: string
}

export function createEntity(type: EntityType, title: string): Entity {
  const now = new Date().toISOString()
  return {
    id: newId(),
    type,
    title: title.trim(),
    aliases: [],
    parentId: null,
    sortOrder: 0,
    props: {},
    bodyMd: '',
    tags: [],
    coverAsset: null,
    pinned: false,
    archived: false,
    notionId: null,
    createdAt: now,
    updatedAt: now,
  }
}
