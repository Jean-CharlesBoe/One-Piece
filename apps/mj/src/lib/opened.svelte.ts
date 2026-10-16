import { catalog } from './catalog.svelte'
import { toCatalogEntry, type Entity } from './model/entity'
import { getRepository } from './storage/repository'

// Fiche ouverte et sa sauvegarde automatique (cahier MJ §4.3) : chaque modification programme un
// enregistrement 400 ms plus tard ; changer de fiche, quitter l'édition ou passer l'app en arrière-plan
// enregistre tout de suite. Pendant l'édition, chaque enregistrement garde la version précédente :
// « Annuler la dernière modification » y revient.

export type SaveState = 'enregistre' | 'en-attente' | 'erreur'

/** Titre changé pendant l'édition : le MJ choisit de mettre à jour les liens et / ou de garder l'ancien nom. */
export interface Renamed {
  id: string
  oldTitle: string
  newTitle: string
}

const HISTORY_MAX = 50

class Opened {
  entity = $state<Entity | null>(null)
  editing = $state(false)
  save = $state<SaveState>('enregistre')
  error = $state('')
  /** Versions enregistrées avant chaque modification de la session d'édition (la plus récente à la fin). */
  history = $state<Entity[]>([])
  /** Incrémenté quand la fiche est remplacée par une ancienne version (l'éditeur de texte se recharge). */
  revision = $state(0)
  renamed = $state<Renamed | null>(null)
  #timer: ReturnType<typeof setTimeout> | null = null
  /** Numéro de la dernière modification : une modification faite pendant l'enregistrement reste à enregistrer. */
  #version = 0
  /** Dernière version enregistrée de la fiche. */
  #saved: Entity | null = null
  /** Titre au début de la session d'édition. */
  #titleAtStart = ''

  async open(id: string): Promise<void> {
    await this.flush()
    const e = await (await getRepository()).getEntity(id)
    this.entity = e
    this.editing = false
    this.history = []
    this.renamed = null
    this.#saved = e ? (structuredClone(e) as Entity) : null
  }

  async close(): Promise<void> {
    await this.flush()
    this.entity = null
    this.editing = false
    this.history = []
    this.renamed = null
    this.#saved = null
  }

  async setEditing(on: boolean): Promise<void> {
    if (on && !this.editing && this.entity) {
      this.#titleAtStart = this.entity.title
      this.history = []
      this.renamed = null
    }
    if (!on && this.editing) {
      await this.flush()
      const e = this.entity
      if (e && this.#titleAtStart && e.title.trim() && e.title.trim() !== this.#titleAtStart.trim()) {
        this.renamed = { id: e.id, oldTitle: this.#titleAtStart.trim(), newTitle: e.title.trim() }
      }
      this.history = []
    }
    this.editing = on && !!this.entity
  }

  /** À appeler après chaque modification de la fiche ouverte. */
  changed(): void {
    if (!this.entity) return
    this.save = 'en-attente'
    this.#version++
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = setTimeout(() => void this.flush(), 400)
  }

  /** Modifie la fiche et l'enregistre tout de suite (épingler, archiver…). */
  async apply(mutate: (e: Entity) => void): Promise<void> {
    if (!this.entity) return
    mutate(this.entity)
    this.save = 'en-attente'
    this.#version++
    await this.flush()
  }

  /** Revient à la version enregistrée avant la dernière modification. */
  async undo(): Promise<void> {
    await this.flush()
    const previous = this.history.at(-1)
    if (!previous || !this.entity) return
    this.history = this.history.slice(0, -1)
    this.entity = { ...($state.snapshot(previous) as Entity), updatedAt: this.entity.updatedAt }
    this.revision++
    await this.#write(false)
  }

  async flush(): Promise<void> {
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = null
    if (!this.entity || this.save !== 'en-attente') return
    // Un titre vide le temps de la saisie n'est pas enregistré : on attend le prochain changement.
    if (!this.entity.title.trim()) return
    await this.#write(this.editing)
  }

  async #write(keepHistory: boolean): Promise<void> {
    const e = this.entity
    if (!e) return
    e.updatedAt = new Date().toISOString()
    const version = this.#version
    const snap = $state.snapshot(e) as Entity
    snap.title = snap.title.trim()
    try {
      await (await getRepository()).saveEntity(snap)
      catalog.upsert(toCatalogEntry(snap))
      if (keepHistory && this.#saved && this.#saved.id === snap.id) {
        this.history = [...this.history, this.#saved].slice(-HISTORY_MAX)
      }
      this.#saved = structuredClone(snap)
      if (this.#version === version) this.save = 'enregistre'
      this.error = ''
    } catch (err) {
      this.save = 'erreur'
      this.error = 'Fiche non enregistrée : ' + (err instanceof Error ? err.message : String(err))
    }
  }
}

export const opened = new Opened()
