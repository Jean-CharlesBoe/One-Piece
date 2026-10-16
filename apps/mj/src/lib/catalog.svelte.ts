import type { CatalogEntry } from './model/entity'
import { getRepository } from './storage/repository'

// Catalogue des fiches en mémoire, partagé par tous les écrans : listes, barre latérale, titres des liens,
// autocomplétion `[[`, sélecteurs de relations, doublons. Rechargé au démarrage, tenu à jour après chaque
// enregistrement (quelques centaines à quelques milliers de fiches : une liste suffit).

const byTitle = (a: CatalogEntry, b: CatalogEntry) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' })

class Catalog {
  entries = $state<CatalogEntry[]>([])
  byId = $derived(new Map(this.entries.map(e => [e.id, e])))
  /** Fiches actives (non archivées). */
  active = $derived(this.entries.filter(e => !e.archived))

  async load(): Promise<void> {
    this.entries = (await (await getRepository()).listCatalog()).sort(byTitle)
  }

  /** Ajoute ou remplace une entrée après un enregistrement. */
  upsert(entry: CatalogEntry): void {
    this.entries = [...this.entries.filter(e => e.id !== entry.id), entry].sort(byTitle)
  }

  remove(id: string): void {
    this.entries = this.entries.filter(e => e.id !== id)
  }

  /** Titre d'une fiche liée ; une fiche supprimée entre-temps est signalée. */
  title(id: string): string {
    return this.byId.get(id)?.title ?? '(fiche introuvable)'
  }
}

export const catalog = new Catalog()
