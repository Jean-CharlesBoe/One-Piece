import { catalog } from './catalog.svelte'
import { toCatalogEntry, type Entity } from './model/entity'
import { renameLinks } from './model/links'
import type { Renamed } from './opened.svelte'
import { getRepository } from './storage/repository'

// Renommage d'une fiche (cahier MJ §4.3) : proposé au MJ après coup, avec confirmation.
// Seuls les liens affichés sous l'ancien titre changent (renameLinks).

/** Fiches dont le texte cite la fiche renommée sous son ancien titre, avec leur texte mis à jour. */
export async function renameCandidates(r: Renamed): Promise<Entity[]> {
  const repo = await getRepository()
  const ids = [...new Set((await repo.backlinks(r.id)).filter(b => b.kind === 'mention').map(b => b.fromId))]
  const out: Entity[] = []
  for (const id of ids) {
    const e = await repo.getEntity(id)
    if (!e) continue
    const body = renameLinks(e.bodyMd, r.id, r.oldTitle, r.newTitle)
    if (body !== e.bodyMd) out.push({ ...e, bodyMd: body })
  }
  return out
}

/** Enregistre les fiches mises à jour par `renameCandidates`. */
export async function applyRename(updated: Entity[]): Promise<void> {
  const repo = await getRepository()
  for (const e of updated) {
    e.updatedAt = new Date().toISOString()
    await repo.saveEntity(e)
    catalog.upsert(toCatalogEntry(e))
  }
}
