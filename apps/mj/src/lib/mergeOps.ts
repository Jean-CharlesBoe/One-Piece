import { catalog } from './catalog.svelte'
import { toCatalogEntry, type Entity } from './model/entity'
import { mergeInto, redirectLinks } from './model/merge'
import { getRepository } from './storage/repository'

// Fusion de deux fiches enregistrées (cahier §4.7) : `mergeInto` sur les deux fiches, puis redirection des
// liens de toutes les fiches qui pointaient vers l'absorbée (relations, mentions, pages enfants).

export async function mergeEntities(keepId: string, otherId: string, takeOther: ReadonlySet<string>): Promise<void> {
  const repo = await getRepository()
  const keep = await repo.getEntity(keepId)
  const other = await repo.getEntity(otherId)
  if (!keep || !other || keepId === otherId) throw new Error('Fiches introuvables')

  // Fiches à rediriger : liens entrants et pages enfants de l'absorbée (lus avant la fusion).
  const sources = new Set((await repo.backlinks(otherId)).map(b => b.fromId))
  for (const e of catalog.entries) if (e.parentId === otherId) sources.add(e.id)
  sources.delete(keepId)
  sources.delete(otherId)

  mergeInto(keep, other, takeOther)
  const now = new Date().toISOString()
  const save = async (e: Entity) => {
    e.updatedAt = now
    await repo.saveEntity(e)
    catalog.upsert(toCatalogEntry(e))
  }
  await save(keep)
  await save(other)
  for (const id of sources) {
    const e = await repo.getEntity(id)
    if (e && redirectLinks(e, otherId, keepId)) await save(e)
  }
}
